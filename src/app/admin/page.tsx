import React from 'react';
import { requireAdminOrStaff } from '@/lib/auth/serverAuth';
import AdminPortalClient from './AdminPortalClient';
import { ADMIN_SECTIONS } from '@/lib/auth/permissions';
import { AdminSection } from '@/lib/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Server-Side Entrypoint for /admin
 * 
 * CORE SECURITY GUARANTEES:
 * 1. Owner Access: Site Owner (aapkaastro1606@gmail.com) reaches the admin area with no redirect and no loop.
 * 2. Staff Access: Staff members see ONLY the sections granted in /admin/team.
 * 3. Student Redirection: Students attempting to access /admin are redirected away to /dashboard.
 * 4. Fail-Closed: Unauthenticated requests redirect to /login?redirect_url=/admin.
 */
export default async function AdminPage() {
  const auth = await requireAdminOrStaff('/admin');

  let allowedSections: AdminSection[] = [];
  if (auth.isOwner) {
    allowedSections = [...ADMIN_SECTIONS];
  } else {
    allowedSections = (auth.staffSections || []).filter(
      (s): s is AdminSection => s !== 'staff' && (ADMIN_SECTIONS as readonly string[]).includes(s as AdminSection)
    );

    // If a staff member has zero active granted sections, redirect away to dashboard
    if (allowedSections.length === 0) {
      redirect('/dashboard?error=admin_restricted');
    }
  }

  return (
    <AdminPortalClient
      serverAuth={{
        userId: auth.userId,
        email: auth.email,
        isOwner: auth.isOwner,
        isStaff: auth.isStaff,
        role: auth.role,
        staffSections: auth.staffSections,
      }}
      serverAllowedSections={allowedSections}
      serverIsOwner={auth.isOwner}
    />
  );
}
