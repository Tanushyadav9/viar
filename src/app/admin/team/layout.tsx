import React from 'react';
import { requireOwner } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * Server-Side Security Boundary: /admin/team/*
 * Strictly reserved for the Site Owner (aapkaastro1606@gmail.com).
 * Staff members are redirected to /admin?error=owner_only.
 * Students are redirected away to /dashboard?error=admin_restricted.
 */
export default async function AdminTeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner('/admin/team');
  return <>{children}</>;
}
