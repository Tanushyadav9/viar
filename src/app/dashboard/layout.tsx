import React from 'react';
import { requireAuth } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * Server-Side Security Boundary: /dashboard/*
 * Fail-closed server layout: Unauthenticated requests are immediately redirected
 * to /login?redirect_url=/dashboard on the server before any page component renders.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('/dashboard');
  return <>{children}</>;
}
