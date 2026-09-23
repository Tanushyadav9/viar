import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSiteOwner, VIAR_SECTIONS } from '@/lib/auth/permissions';
import { ViarStore } from '@/lib/store';
import { StaffAccessLevel, AdminSection } from '@/lib/types';

function getCallerEmail(req: NextRequest): string {
  const rawEmail =
    req.cookies.get('viar_user_email')?.value ||
    req.headers.get('x-user-email') ||
    '';
  return rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : '';
}

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

    // Fallback to runtime store
    const storeStaff = ViarStore.getStaffUsers();
    const storePermissions = ViarStore.getStaffPermissions();

    return NextResponse.json({
      success: true,
      source: 'store',
      staff: storeStaff,
      permissions: storePermissions,
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
      // Find or create User record if needed
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

    // 2. Store fallback
    ViarStore.addStaffMember({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      sections: [normalizedSection as AdminSection],
      accessLevel: validLevel,
      grantedByUserId: grantedBy,
    });

    return NextResponse.json({
      success: true,
      source: 'store',
      message: `Granted ${validLevel} permission on '${normalizedSection}' to ${normalizedEmail} in runtime store.`,
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

    // 2. Store fallback
    const ok = ViarStore.softRevokeStaffPermission(permissionId);

    return NextResponse.json({
      success: true,
      source: 'store',
      updated: ok,
      message: `Permission ${permissionId} soft-revoked in store. Audit trail preserved.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
