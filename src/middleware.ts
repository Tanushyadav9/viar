import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { evaluateRouteAccess } from '@/lib/auth/permissions';
import { isDevSimulationAllowed, parseClerkSessionClaims } from '@/lib/auth/devSimulation';

export default clerkMiddleware(async (_auth, request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl;

  // Retrieve auth session token
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

  // Evaluate route access fail-closed security rules
  const decision = evaluateRouteAccess({
    pathname,
    searchParams,
    sessionToken,
    userEmail: verifiedEmail,
    userRole,
    isDevSimulationAllowed: isDevSimulationAllowed(),
  });

  if (decision.action === 'redirect' && decision.redirectUrl) {
    const redirectUrl = new URL(decision.redirectUrl, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();
  // Security headers
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
