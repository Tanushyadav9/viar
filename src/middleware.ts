import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected paths
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isInstructorRoute = pathname.startsWith('/instructor');
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isDashboardRoute && !isInstructorRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Retrieve auth session and role tokens
  const sessionToken =
    request.cookies.get('viar_session')?.value ||
    request.cookies.get('__session')?.value ||
    request.cookies.get('viar_auth_token')?.value;

  const userRole =
    request.cookies.get('viar_user_role')?.value ||
    request.headers.get('x-user-role') ||
    '';

  // In Next.js client-side local demo mode, if no session cookie exists yet,
  // we check if an authorization bypass/demo cookie exists or check query params
  const isDemoActive =
    request.cookies.get('viar_demo_active')?.value === 'true' ||
    process.env.NODE_ENV === 'development';

  // 1. Unauthenticated check for all protected routes
  if (!sessionToken && !isDemoActive) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-based access control for instructor & admin portals
  if (isInstructorRoute || isAdminRoute) {
    // If authenticated as regular STUDENT and not INSTRUCTOR/ADMIN:
    if (sessionToken && userRole === 'STUDENT') {
      const unauthorizedUrl = new URL('/dashboard', request.url);
      unauthorizedUrl.searchParams.set('error', 'unauthorized_role');
      return NextResponse.redirect(unauthorizedUrl);
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
