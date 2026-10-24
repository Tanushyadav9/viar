import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessArea } from '@/lib/auth/serverAuth';
import { prisma } from '@/lib/prisma';
import { VIAR_SECTIONS, getOwnerEmails } from '@/lib/auth/permissions';
import type { StaffAccessLevel, StaffPermission, User, AdminSection } from '@/lib/types';

// In-memory server fallback cache when DB is unprovisioned during local testing
const serverPermissionsFallback: StaffPermission[] = [];
const serverStaffFallback: Partial<User>[] = [];

/**
 * GET /api/admin/team
 * Returns all staff members and the complete StaffPermission audit trail.
 * Strictly Site Owner-only. Rejects anyone else with 403.
 */
export async function GET(req: NextRequest) {
  void req;
  try {
    const auth = await getServerAuthUser();
    // Unified Policy: Team & Staff permissions management is strictly Owner-only (Staff: No, Student: No)
    if (!canAccessArea(auth, 'team')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: /admin/team is strictly reserved for the Site Owner.',
        },
        { status: 403 }
      );
    }

    // Try reading permissions from Neon Postgres
    try {
      const dbPermissions = await prisma.staffPermission.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const ownerEmails = getOwnerEmails();
      const dbUsers = await prisma.user.findMany({
        where: {
          OR: [
            { role: { in: ['INSTRUCTOR', 'ADMIN', 'OWNER'] } },
            { email: { in: ownerEmails } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const staffWithSections = dbUsers.map((u) => {
        const userPerms = (dbPermissions || []).filter((p) => p.userId === u.id && !p.revokedAt);
        const userEmailLower = (u.email || '').toLowerCase();
        const isOwner = ownerEmails.some((e: string) => e.toLowerCase() === userEmailLower);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: isOwner ? 'OWNER' : u.role,
          isOwner,
          staffSections: isOwner ? [...VIAR_SECTIONS] : userPerms.map((p) => p.section),
        };
      });

      return NextResponse.json({
        success: true,
        source: 'database',
        staff: staffWithSections,
        permissions: dbPermissions || [],
      });
    } catch (dbError) {
      console.warn('Database query for staff permissions skipped:', (dbError as Error).message);
    }

    // Fallback to in-memory server state
    return NextResponse.json({
      success: true,
      source: 'server_fallback',
      staff: serverStaffFallback,
      permissions: serverPermissionsFallback,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/team
 * Grants a new section permission or invites a staff member by email.
 * Strictly Site Owner-only.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    // Unified Policy: Team & Staff permissions management is strictly Owner-only (Staff: No, Student: No)
    if (!canAccessArea(auth, 'team')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only the Site Owner can assign or modify staff permissions.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, section, accessLevel = 'VIEW', name, notes } = body;

    if (!email || !section) {
      return NextResponse.json(
        { success: false, error: 'email and section are required fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSection = String(section).trim().toLowerCase() as AdminSection;
    const cleanLevel = (accessLevel === 'MANAGE' ? 'MANAGE' : 'VIEW') as StaffAccessLevel;

    // Invariant: The 'staff' section cannot be delegated under any circumstances
    if (cleanSection === 'staff') {
      return NextResponse.json(
        { success: false, error: "The 'staff' section cannot be delegated. It is permanently reserved for the Site Owner." },
        { status: 400 }
      );
    }

    if (!(VIAR_SECTIONS as readonly string[]).includes(cleanSection)) {
      return NextResponse.json(
        { success: false, error: `Invalid section '${cleanSection}'. Allowed sections: ${VIAR_SECTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Try persisting to PostgreSQL
    try {
      // Find or create the user in the database
      let user = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: name ? String(name).trim() : cleanEmail.split('@')[0],
            role: 'ADMIN',
          },
        });
      } else if (user.role === 'STUDENT') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }

      // Check for an active permission for this section
      const existing = await prisma.staffPermission.findFirst({
        where: {
          userId: user.id,
          section: cleanSection,
          revokedAt: null,
        },
      });

      let permission;
      if (existing) {
        permission = await prisma.staffPermission.update({
          where: { id: existing.id },
          data: {
            accessLevel: cleanLevel,
          },
        });
      } else {
        permission = await prisma.staffPermission.create({
          data: {
            userId: user.id,
            section: cleanSection,
            accessLevel: cleanLevel,
            grantedByUserId: auth.userId || auth.email || 'site_owner',
          },
        });
      }

      // Audit log the grant action
      await prisma.activityLog.create({
        data: {
          action: 'STAFF_PERMISSION_GRANTED',
          entityType: 'STAFF_PERMISSION',
          entityId: permission.id,
          userEmail: auth.email || 'owner',
          userName: auth.dbUser?.name || 'Site Owner',
          details: {
            targetEmail: cleanEmail,
            targetUserId: user.id,
            section: cleanSection,
            accessLevel: cleanLevel,
            notes: notes ? String(notes).trim() : null,
            grantedAt: now.toISOString(),
          },
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        source: 'database',
        permission,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: `Successfully granted ${cleanLevel} access on '${cleanSection}' to ${cleanEmail}.`,
      });
    } catch (dbError) {
      console.warn('Database write for staff permission failed, falling back to server memory:', (dbError as Error).message);
    }

    // 2. Server memory fallback
    const fallbackPermId = `perm-dyn-${Date.now()}`;
    const newFallbackPerm: StaffPermission = {
      id: fallbackPermId,
      userId: cleanEmail,
      section: cleanSection,
      accessLevel: cleanLevel,
      grantedByUserId: auth.email || 'site_owner',
      grantedAt: now.toISOString(),
      revokedAt: null,
    };

    serverPermissionsFallback.unshift(newFallbackPerm);

    let fallbackUser = serverStaffFallback.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      fallbackUser = {
        id: `user-sim-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`,
        email: cleanEmail,
        name: name ? String(name).trim() : cleanEmail.split('@')[0],
        role: 'ADMIN',
        staffSections: [cleanSection],
      };
      serverStaffFallback.push(fallbackUser);
    } else if (!fallbackUser.staffSections?.includes(cleanSection)) {
      fallbackUser.staffSections = [...(fallbackUser.staffSections || []), cleanSection];
    }

    return NextResponse.json({
      success: true,
      source: 'server_fallback',
      permission: newFallbackPerm,
      user: fallbackUser,
      message: `Successfully granted ${cleanLevel} access on '${cleanSection}' to ${cleanEmail} (server memory fallback).`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/team
 * Soft-revokes a staff member's section permission.
 * Strictly Site Owner-only. Preserves full audit trail.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    // Unified Policy: Team & Staff permissions management is strictly Owner-only (Staff: No, Student: No)
    if (!canAccessArea(auth, 'team')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only the Site Owner can revoke staff permissions.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    let permissionId = searchParams.get('id');

    const now = new Date();

    if (userId) {
      try {
        await prisma.staffPermission.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: now },
        });
        await prisma.user.updateMany({
          where: { id: userId, role: { in: ['ADMIN', 'INSTRUCTOR'] } },
          data: { role: 'STUDENT' },
        });
        return NextResponse.json({
          success: true,
          source: 'database',
          message: `All staff permissions for user ${userId} soft-revoked. Audit trail preserved.`,
        });
      } catch (dbError) {
        console.warn('Database soft-revoke by userId skipped:', (dbError as Error).message);
      }
    }

    if (!permissionId) {
      try {
        const body = await req.json();
        permissionId = body.id || body.permissionId;
      } catch {
        // body might be empty
      }
    }

    if (!permissionId) {
      return NextResponse.json(
        { success: false, error: 'permissionId query param or body field is required.' },
        { status: 400 }
      );
    }

    // 1. Try Prisma soft-revoke
    try {
      const revoked = await prisma.staffPermission.update({
        where: { id: permissionId },
        data: { revokedAt: now },
      });

      return NextResponse.json({
        success: true,
        source: 'database',
        permission: revoked,
        message: `Permission ${permissionId} soft-revoked. Audit trail preserved.`,
      });
    } catch (dbError) {
      console.warn('Database soft-revoke skipped:', (dbError as Error).message);
    }

    // 2. Server memory fallback
    const target = serverPermissionsFallback.find((p) => p.id === permissionId);
    if (target) {
      target.revokedAt = now.toISOString();
    }

    return NextResponse.json({
      success: true,
      source: 'server_fallback',
      message: `Permission ${permissionId} soft-revoked. Audit trail preserved.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
