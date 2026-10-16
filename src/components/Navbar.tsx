import React from 'react';
import { getServerAuthUser } from '@/lib/auth/serverAuth';
import NavbarClient from './NavbarClient';

/**
 * Server Component Navbar
 * 
 * CORE REQUIREMENT:
 * "The admin navigation link appears only for the Owner and staff, decided on the server."
 * 
 * Cryptographically resolves user authentication and computes role/staff status on the server.
 * Guarantees that students and unauthenticated visitors NEVER receive showAdminNav: true.
 */
export default async function Navbar() {
  const auth = await getServerAuthUser();
  const showAdminNav = Boolean(auth.isOwner || auth.isStaff);

  return (
    <NavbarClient
      serverAuth={{
        isAuthenticated: auth.isAuthenticated,
        isOwner: auth.isOwner,
        isStaff: auth.isStaff,
        showAdminNav,
        role: auth.role,
        email: auth.email,
      }}
    />
  );
}
