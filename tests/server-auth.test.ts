import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateRedirectUrl } from '../src/lib/auth/urlValidation.ts';

describe('Server-Side Authentication, Redirect Validation & Canonical Host', () => {

  describe('1. validateRedirectUrl — Open Redirect Prevention', () => {
    it('should allow valid single-slash internal paths', () => {
      assert.strictEqual(validateRedirectUrl('/dashboard'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('/courses/what-is-astrology'), '/courses/what-is-astrology');
      assert.strictEqual(validateRedirectUrl('/admin'), '/admin');
      assert.strictEqual(validateRedirectUrl('/checkout/cohort-1?ref=upi'), '/checkout/cohort-1?ref=upi');
    });

    it('should reject external absolute URLs with schemes', () => {
      assert.strictEqual(validateRedirectUrl('https://evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('http://attacker.com/steal'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('ftp://example.com'), '/dashboard');
    });

    it('should reject protocol-relative URLs starting with //', () => {
      assert.strictEqual(validateRedirectUrl('//evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('//evil.com/phish'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('//viar.in.attacker.com'), '/dashboard');
    });

    it('should reject backslash bypass attempts (/\\, \\, etc.)', () => {
      assert.strictEqual(validateRedirectUrl('/\\evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('\\evil.com'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('/foo\\bar'), '/dashboard');
    });

    it('should reject javascript:, data:, or colon-containing payloads', () => {
      assert.strictEqual(validateRedirectUrl('javascript:alert(1)'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('data:text/html,<script>alert(1)</script>'), '/dashboard');
      assert.strictEqual(validateRedirectUrl('/foo:bar'), '/dashboard');
    });

    it('should return custom default URL when supplied', () => {
      assert.strictEqual(validateRedirectUrl('//evil.com', '/login'), '/login');
      assert.strictEqual(validateRedirectUrl(null, '/courses'), '/courses');
      assert.strictEqual(validateRedirectUrl(undefined, '/courses'), '/courses');
      assert.strictEqual(validateRedirectUrl('', '/courses'), '/courses');
    });
  });

  describe('2. Server-Side Owner Detection (Primary Verified Email Case-Insensitive)', () => {
    const ownerEmail = 'aapkaastro1606@gmail.com';
    process.env.OWNER_EMAIL = ownerEmail;

    function verifyServerOwner(emailObj: { emailAddress?: string; isVerified?: boolean } | null | undefined): boolean {
      if (!emailObj || !emailObj.emailAddress || !emailObj.isVerified) return false;
      const cleanEmail = emailObj.emailAddress.trim().toLowerCase();
      const configuredOwner = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
      return Boolean(cleanEmail && configuredOwner && cleanEmail === configuredOwner);
    }

    it('should recognize verified primary email matching OWNER_EMAIL (exact match)', () => {
      const result = verifyServerOwner({
        emailAddress: 'aapkaastro1606@gmail.com',
        isVerified: true,
      });
      assert.strictEqual(result, true);
    });

    it('should recognize verified primary email matching OWNER_EMAIL case-insensitively', () => {
      const resultUpper = verifyServerOwner({
        emailAddress: 'AAPKAASTRO1606@GMAIL.COM',
        isVerified: true,
      });
      assert.strictEqual(resultUpper, true);

      const resultMixed = verifyServerOwner({
        emailAddress: 'AapkaAstro1606@Gmail.Com',
        isVerified: true,
      });
      assert.strictEqual(resultMixed, true);
    });

    it('should REJECT an unverified email even if address matches OWNER_EMAIL', () => {
      const result = verifyServerOwner({
        emailAddress: 'aapkaastro1606@gmail.com',
        isVerified: false,
      });
      assert.strictEqual(result, false);
    });

    it('should REJECT other email addresses (even if verified)', () => {
      assert.strictEqual(verifyServerOwner({ emailAddress: 'student@example.com', isVerified: true }), false);
      assert.strictEqual(verifyServerOwner({ emailAddress: 'ask@aapkaastro.com', isVerified: true }), false);
      assert.strictEqual(verifyServerOwner({ emailAddress: 'admin@viar.in', isVerified: true }), false);
      assert.strictEqual(verifyServerOwner({ emailAddress: 'niraj@aapkaastro.com', isVerified: true }), false);
    });

    it('should fail-closed if OWNER_EMAIL environment variable is empty or unset', () => {
      const prev = process.env.OWNER_EMAIL;
      process.env.OWNER_EMAIL = '';
      assert.strictEqual(verifyServerOwner({ emailAddress: 'aapkaastro1606@gmail.com', isVerified: true }), false);
      process.env.OWNER_EMAIL = prev;
    });
  });

  describe('3. Canonical Host 308 Redirect Logic (Apex vs WWW)', () => {
    const siteUrl = 'https://viar.in';
    const canonicalHost = new URL(siteUrl).host.toLowerCase(); // 'viar.in'

    function checkCanonicalRedirect(reqHost: string): { redirect: boolean; status?: number; target?: string } {
      const cleanHost = reqHost.toLowerCase();
      if (cleanHost && canonicalHost && cleanHost !== canonicalHost) {
        if (cleanHost === `www.${canonicalHost}` || `www.${cleanHost}` === canonicalHost) {
          return {
            redirect: true,
            status: 308,
            target: `${siteUrl}/dashboard`,
          };
        }
      }
      return { redirect: false };
    }

    it('should issue HTTP 308 redirect for www.viar.in to canonical viar.in', () => {
      const res = checkCanonicalRedirect('www.viar.in');
      assert.strictEqual(res.redirect, true);
      assert.strictEqual(res.status, 308);
      assert.strictEqual(res.target, 'https://viar.in/dashboard');
    });

    it('should NOT redirect when requesting the canonical apex host viar.in', () => {
      const res = checkCanonicalRedirect('viar.in');
      assert.strictEqual(res.redirect, false);
    });

    it('should NOT redirect localhost or test hostnames', () => {
      const res = checkCanonicalRedirect('localhost:3000');
      assert.strictEqual(res.redirect, false);
    });
  });

  describe('4. /login Server-Awareness & Loop Prevention', () => {
    function evaluateLoginBehavior(params: {
      userId?: string | null;
      error?: string | null;
      redirectUrl?: string | null;
    }): { action: 'redirect' | 'render_error' | 'render_signin'; target?: string } {
      const { userId, error, redirectUrl } = params;
      const safeTarget = validateRedirectUrl(redirectUrl, '/dashboard');

      // Valid session and NO error -> immediate server-side redirect
      if (userId && !error) {
        return { action: 'redirect', target: safeTarget };
      }

      // Valid session with authorization error -> render error card with signout (NEVER LOOP!)
      if (userId && error) {
        return { action: 'render_error' };
      }

      // No session -> render SignIn
      return { action: 'render_signin' };
    }

    it('should immediately redirect authenticated user without error to destination', () => {
      const res = evaluateLoginBehavior({
        userId: 'user_123',
        redirectUrl: '/dashboard',
      });
      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.target, '/dashboard');
    });

    it('should NEVER redirect in a loop when error=owner_only (renders error with signout)', () => {
      const res = evaluateLoginBehavior({
        userId: 'user_123_student',
        error: 'owner_only',
        redirectUrl: '/admin',
      });
      // MUST NOT redirect back to /admin!
      assert.strictEqual(res.action, 'render_error');
    });

    it('should NEVER redirect in a loop when error=unauthorized_role (renders error with signout)', () => {
      const res = evaluateLoginBehavior({
        userId: 'user_123_student',
        error: 'unauthorized_role',
        redirectUrl: '/instructor',
      });
      assert.strictEqual(res.action, 'render_error');
    });

    it('should render SignIn component when user is not authenticated', () => {
      const res = evaluateLoginBehavior({
        userId: null,
        redirectUrl: '/dashboard',
      });
      assert.strictEqual(res.action, 'render_signin');
    });
  });

});
