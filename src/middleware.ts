import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { evaluateRouteAccess } from '@/lib/auth/permissions';
import { isDevSimulationAllowed, parseClerkSessionClaims } from '@/lib/auth/devSimulation';
import { LOCALE_COOKIE_NAME } from '@/i18n/config';

export default clerkMiddleware(async (_auth, request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Detect locale from route prefix: English at root, Hindi under /hi
  const isHindi = pathname === '/hi' || pathname.startsWith('/hi/');
  const activeLocale = isHindi ? 'hi' : 'en';

  // Clean effective pathname for route evaluation & internal rewrite
  let effectivePathname = pathname;
  if (isHindi) {
    effectivePathname = pathname === '/hi' ? '/' : pathname.replace(/^\/hi/, '') || '/';
  }

  // 2. Retrieve auth session token
  const sessionToken =
    request.cookies.get('viar_session')?.value ||
    request.cookies.get('__session')?.value ||
    request.cookies.get('viar_auth_token')?.value;

  // Resolve verified user email (NEVER trust client-supplied headers/cookies in production)
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

  const userRole =
    isDevSimulationAllowed()
      ? request.cookies.get('viar_user_role')?.value || request.headers.get('x-user-role') || undefined
      : undefined;

  // 3. Evaluate route access fail-closed security rules against effective path
  const decision = evaluateRouteAccess({
    pathname: effectivePathname,
    searchParams,
    sessionToken,
    userEmail: verifiedEmail,
    userRole,
    isDevSimulationAllowed: isDevSimulationAllowed(),
  });

  if (decision.action === 'redirect' && decision.redirectUrl) {
    const redirectUrl = new URL(decision.redirectUrl, request.url);
    if (isHindi && !redirectUrl.pathname.startsWith('/hi') && !redirectUrl.pathname.startsWith('/api')) {
      redirectUrl.pathname = redirectUrl.pathname === '/' ? '/hi' : `/hi${redirectUrl.pathname}`;
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Construct response: rewrite for /hi routes, pass-through for root English
  let response: NextResponse;
  if (isHindi && !pathname.startsWith('/api/')) {
    const rewriteUrl = new URL(effectivePathname, request.url);
    searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  // 5. Inject locale headers and remember choice in cookie
  response.headers.set('x-locale', activeLocale);
  response.headers.set('x-next-locale', activeLocale);
  response.cookies.set(LOCALE_COOKIE_NAME, activeLocale, {
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
  });

  // 6. Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
