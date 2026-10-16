import React from 'react';
import { requireInstructor } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

/**
 * Server-Side Security Boundary: /instructor/*
 * Fail-closed server layout: Requires verified Instructor, Admin, or Site Owner.
 * Unauthorized requests redirect to /login?error=unauthorized_role on the server.
 */
export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireInstructor('/instructor');
  return <>{children}</>;
}
