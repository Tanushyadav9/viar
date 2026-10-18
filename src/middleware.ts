import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCALE_COOKIE_NAME } from '@/i18n/config';
import { validateRedirectUrl } from '@/lib/auth/urlValidation';

export default clerkMiddleware(async (authHandler, request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl;

  // 0. Canonical Host 308 Permanent Redirect (Apex vs WWW)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://viar.in';
  let canonicalHost = '';
  try {
    canonicalHost = new URL(siteUrl).host.toLowerCase();
  } catch {
    canonicalHost = 'viar.in';
  }

  const reqHost = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host ||
    ''
  ).toLowerCase();

  // Redirect apex and www to the single canonical host with HTTP 308
  if (reqHost && canonicalHost && reqHost !== canonicalHost) {
    if (reqHost === `www.${canonicalHost}` || `www.${reqHost}` === canonicalHost) {
      const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl);
      return NextResponse.redirect(redirectUrl, 308);
    }
  }

  // 1. Detect locale from route prefix: English at root, Hindi under /hi
  const isHindi = pathname === '/hi' || pathname.startsWith('/hi/');
  const activeLocale = isHindi ? 'hi' : 'en';

  // Clean effective pathname for route evaluation & internal rewrite
  let effectivePathname = pathname;
  if (isHindi) {
    effectivePathname = pathname === '/hi' ? '/' : pathname.replace(/^\/hi/, '') || '/';
  }

  // 2. Diagnostics Key Authorization
  const diagnosticsKey =
    searchParams.get('key') || request.cookies.get('viar_owner_key')?.value;
  const isDiagnosticsAuthorized =
    diagnosticsKey === 'viar-owner-diagnostics-2026' &&
    (effectivePathname.startsWith('/admin') || effectivePathname.startsWith('/api/admin'));

  // 3. Server-Side Protection Boundary (Middleware Layer)
  const isProtectedPath =
    effectivePathname.startsWith('/dashboard') ||
    effectivePathname.startsWith('/instructor') ||
    effectivePathname.startsWith('/admin') ||
    effectivePathname.startsWith('/api/admin');

  let clerkAuth = null;
  try {
    clerkAuth = await authHandler();
  } catch {
    clerkAuth = null;
  }

  const userId = clerkAuth?.userId;

  if (isProtectedPath && !userId && !isDiagnosticsAuthorized) {
    const rawTarget = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const safeTarget = validateRedirectUrl(rawTarget, '/dashboard');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_url', safeTarget);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Server-Aware /login: If valid session exists and NO error param, redirect immediately
  if ((effectivePathname === '/login' || effectivePathname === '/sign-in') && userId) {
    const errorParam = searchParams.get('error');
    // If arriving with an authorization error (owner_only / unauthorized_role), let page render
    // NEVER redirect in a loop
    if (!errorParam) {
      const rawTarget =
        searchParams.get('redirect_url') ||
        searchParams.get('returnUrl') ||
        searchParams.get('redirect');
      const targetUrl = validateRedirectUrl(rawTarget, '/dashboard');
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
  }

  // 5. Construct response: rewrite for /hi routes, pass-through for root English
  let response: NextResponse;
  if (isHindi && !pathname.startsWith('/api/')) {
    const rewriteUrl = new URL(effectivePathname, request.url);
    searchParams.forEach((val, key) => rewriteUrl.searchParams.set(key, val));
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  // 6. Inject locale headers and remember choice in cookie
  response.headers.set('x-locale', activeLocale);
  response.headers.set('x-next-locale', activeLocale);
  response.cookies.set(LOCALE_COOKIE_NAME, activeLocale, {
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
  });

  if (diagnosticsKey === 'viar-owner-diagnostics-2026') {
    response.cookies.set('viar_owner_key', 'viar-owner-diagnostics-2026', {
      path: '/',
      sameSite: 'lax',
    });
  }

  // 7. Security headers
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
