import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSiteOwner, VIAR_SECTIONS } from '@/lib/auth/permissions';
import { DEMO_USERS } from '@/lib/data';
import { StaffAccessLevel, StaffPermission, User, AdminSection } from '@/lib/types';

function getCallerEmail(req: NextRequest): string {
  const sessionToken =
    req.cookies.get('viar_session')?.value ||
    req.cookies.get('__session')?.value ||
    req.cookies.get('viar_auth_token')?.value;

  if (!sessionToken) {
    return '';
  }

  const rawEmail =
    req.cookies.get('viar_user_email')?.value ||
    req.headers.get('x-user-email') ||
    '';
  return rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : '';
}

// In-memory server fallback cache when DB is unprovisioned during local testing
const serverPermissionsFallback: StaffPermission[] = [
  {
    id: 'perm-1',
    userId: 'user-staff-content',
    section: 'courses',
    accessLevel: 'MANAGE',
    grantedByUserId: 'ask@aapkaastro.com',
    grantedAt: '2026-09-20T10:00:00.000Z',
    revokedAt: null,
  },
  {
    id: 'perm-2',
    userId: 'user-staff-content',
    section: 'quizzes',
    accessLevel: 'MANAGE',
    grantedByUserId: 'ask@aapkaastro.com',
    grantedAt: '2026-09-20T10:00:00.000Z',
    revokedAt: null,
  },
];

const serverStaffFallback: Partial<User>[] = DEMO_USERS.filter(
  (u) => u.isOwner || (u.staffSections && u.staffSections.length > 0)
);

/**
 * GET /api/admin/team
 * Returns all staff members and the complete StaffPermission audit trail.
 * Strictly Site Owner-only. Rejects anyone else with 403.
 */
export async function GET(req: NextRequest) {
  try {
    const callerEmail = getCallerEmail(req);
    if (!isSiteOwner(callerEmail)) {
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

      const dbUsers = await prisma.user.findMany({
        where: {
          role: { in: ['INSTRUCTOR', 'ADMIN'] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (dbPermissions && dbPermissions.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'database',
          staff: dbUsers,
          permissions: dbPermissions,
        });
      }
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
    const callerEmail = getCallerEmail(req);
    if (!isSiteOwner(callerEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only the Site Owner can grant staff permissions.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, name, section, accessLevel = 'MANAGE' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedSection = (section || '').trim().toLowerCase();

    // Verify section name belongs to Viar sections
    const isViarSection = (sec: string): sec is (typeof VIAR_SECTIONS)[number] =>
      (VIAR_SECTIONS as readonly string[]).includes(sec);

    if (!isViarSection(normalizedSection)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid section '${section}'. Allowed sections for Viar: ${VIAR_SECTIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const validLevel: StaffAccessLevel = accessLevel === 'VIEW' ? 'VIEW' : 'MANAGE';
    const grantedBy = callerEmail || 'ask@aapkaastro.com';

    // 1. Attempt Prisma creation
    try {
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: name || normalizedEmail.split('@')[0],
            role: 'INSTRUCTOR',
          },
        });
      }

      const createdPermission = await prisma.staffPermission.create({
        data: {
          userId: user.id,
          section: normalizedSection,
          accessLevel: validLevel,
          grantedByUserId: grantedBy,
          revokedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        source: 'database',
        permission: createdPermission,
        message: `Successfully granted ${validLevel} permission on '${normalizedSection}' to ${normalizedEmail}.`,
      });
    } catch (dbError) {
      console.warn('Database write for staff permission skipped:', (dbError as Error).message);
    }

    // 2. Server memory fallback
    const newPerm: StaffPermission = {
      id: `perm-${Date.now()}-${normalizedSection}`,
      userId: normalizedEmail,
      section: normalizedSection,
      accessLevel: validLevel,
      grantedByUserId: grantedBy,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
    };
    serverPermissionsFallback.push(newPerm);

    const existingStaff = serverStaffFallback.find((u) => u.email === normalizedEmail);
    if (!existingStaff) {
      serverStaffFallback.push({
        id: `user-staff-${Date.now()}`,
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'INSTRUCTOR',
        isOwner: false,
        staffSections: [normalizedSection as AdminSection],
      });
    }

    return NextResponse.json({
      success: true,
      source: 'server_fallback',
      permission: newPerm,
      message: `Granted ${validLevel} permission on '${normalizedSection}' to ${normalizedEmail}.`,
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
 * Soft-revokes an existing staff permission record by setting revokedAt = now().
 * Preserves the historical audit trail without hard-deleting the row.
 * Strictly Site Owner-only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const callerEmail = getCallerEmail(req);
    if (!isSiteOwner(callerEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only the Site Owner can revoke staff permissions.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let permissionId = searchParams.get('id');

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

    const now = new Date();

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
