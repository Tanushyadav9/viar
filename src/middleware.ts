import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isSiteOwner } from '@/lib/auth/permissions';
import { isDevSimulationAllowed, parseClerkSessionClaims } from '@/lib/auth/devSimulation';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected paths
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isInstructorRoute = pathname.startsWith('/instructor');
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isDashboardRoute && !isInstructorRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Retrieve auth session token
  const sessionToken =
    request.cookies.get('viar_session')?.value ||
    request.cookies.get('__session')?.value ||
    request.cookies.get('viar_auth_token')?.value;

  // 1. Unauthenticated check for all protected routes
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Resolve verified user email (NEVER trust client-supplied headers/cookies in production)
  let verifiedEmail = '';
  const clerkPayload = parseClerkSessionClaims(sessionToken);
  if (clerkPayload?.email) {
    verifiedEmail = clerkPayload.email;
  } else if (isDevSimulationAllowed()) {
    // Only in local development when explicit ENABLE_LOCAL_DEV_SIMULATOR is set
    const rawEmail =
      request.cookies.get('viar_user_email')?.value ||
      request.headers.get('x-user-email') ||
      '';
    verifiedEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : '';
  }

  const isOwner = verifiedEmail ? isSiteOwner(verifiedEmail) : false;

  // 3. /admin/team: Strictly Site Owner-Only
  // Rejects anyone else (including staff with MANAGE access to other sections) server-side
  if (pathname.startsWith('/admin/team')) {
    if (!isOwner) {
      const redirectUrl = new URL('/admin', request.url);
      redirectUrl.searchParams.set('error', 'owner_only');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 4. Role-based access control for instructor & admin portals
  // Deny regular students by default; only allow confirmed Owner or verified Staff
  if (isInstructorRoute || isAdminRoute) {
    if (!isOwner) {
      // In local development simulation mode, check if dev staff session is simulated
      const isDevStaff =
        isDevSimulationAllowed() &&
        (request.cookies.get('viar_user_role')?.value === 'ADMIN' ||
          request.headers.get('x-user-role') === 'ADMIN');

      if (!isDevStaff) {
        const unauthorizedUrl = new URL('/dashboard', request.url);
        unauthorizedUrl.searchParams.set('error', 'unauthorized_role');
        return NextResponse.redirect(unauthorizedUrl);
      }
    }
  }

  const response = NextResponse.next();
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/instructor/:path*',
    '/admin/:path*',
  ],
};
