import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateEmailForSignup,
  extractDomainFromEmail,
  KNOWN_DISPOSABLE_DOMAINS,
} from '../src/lib/auth/email-policy.ts';

describe('Email Sign-Up Policy & Domain Restriction Logic', () => {

  describe('extractDomainFromEmail helper', () => {
    it('should correctly extract and lowercase domain from standard emails', () => {
      assert.strictEqual(extractDomainFromEmail('User@Gmail.COM'), 'gmail.com');
      assert.strictEqual(extractDomainFromEmail('student.123@yahoo.co.in'), 'yahoo.co.in');
    });

    it('should return null for malformed emails', () => {
      assert.strictEqual(extractDomainFromEmail('invalid-email'), null);
      assert.strictEqual(extractDomainFromEmail('@nodomain'), null);
      assert.strictEqual(extractDomainFromEmail('user@'), null);
    });
  });

  describe('Mode 1: BLOCKLIST (Recommended Default)', () => {
    it('should allow common trusted providers (Gmail, Yahoo, Outlook, iCloud)', () => {
      const allowedEmails = [
        'aarav.sharma@gmail.com',
        'priya.patel@yahoo.com',
        'rohan.mehra@outlook.com',
        'ananya.iyer@icloud.com',
      ];

      for (const email of allowedEmails) {
        const res = validateEmailForSignup(email, { mode: 'BLOCKLIST', blocklistExtra: [] });
        assert.strictEqual(res.allowed, true, `Expected ${email} to be allowed`);
        assert.strictEqual(res.mode, 'BLOCKLIST');
        assert.strictEqual(res.reason, undefined);
      }
    });

    it('should allow legitimate corporate and university domains', () => {
      const legitimateEmails = [
        'researcher@oxford.ac.uk',
        'consultant@deloitte.com',
        'executive@reliance.com',
        'student@iitb.ac.in',
      ];

      for (const email of legitimateEmails) {
        const res = validateEmailForSignup(email, { mode: 'BLOCKLIST', blocklistExtra: [] });
        assert.strictEqual(res.allowed, true, `Expected legitimate domain ${email} to be allowed`);
      }
    });

    it('should block known disposable/temporary email services', () => {
      const disposableEmails = [
        'throwaway@mailinator.com',
        'bot123@tempmail.com',
        'fake@10minutemail.com',
        'test@guerrillamail.com',
        'spam@yopmail.com',
        'disposable@trashmail.com',
        'temp@sharklasers.com',
        'burner@burnermail.io',
      ];

      for (const email of disposableEmails) {
        const res = validateEmailForSignup(email, { mode: 'BLOCKLIST', blocklistExtra: [] });
        assert.strictEqual(res.allowed, false, `Expected disposable email ${email} to be blocked`);
        assert.ok(res.reason?.includes('Temporary or disposable email addresses'), 'Reason must explain disposable block');
        assert.ok(res.reason?.includes('cannot be used'), 'Reason must state cannot be used');
        assert.ok(res.reason?.includes('permanent email address'), 'Reason must recommend permanent email');
      }
    });

    it('should block disposable subdomains (e.g. sub.mailinator.com)', () => {
      const res = validateEmailForSignup('user@sub.mailinator.com', { mode: 'BLOCKLIST', blocklistExtra: [] });
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('Temporary or disposable email addresses'));
    });

    it('should block custom domains defined in blocklistExtra', () => {
      const res = validateEmailForSignup('user@spammercorp.net', {
        mode: 'BLOCKLIST',
        blocklistExtra: ['spammercorp.net'],
      });
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('Temporary or disposable email addresses'));
    });
  });

  describe('Mode 2: ALLOWLIST (Strict Mode)', () => {
    const strictConfig = {
      mode: 'ALLOWLIST' as const,
      allowlist: ['gmail.com', 'yahoo.com', 'outlook.com'],
    };

    it('should allow domains that are explicitly on the allowlist', () => {
      const res1 = validateEmailForSignup('student@gmail.com', strictConfig);
      assert.strictEqual(res1.allowed, true);

      const res2 = validateEmailForSignup('student@yahoo.com', strictConfig);
      assert.strictEqual(res2.allowed, true);
    });

    it('should reject unlisted real domains with clear, friendly guidance', () => {
      const res = validateEmailForSignup('student@icloud.com', strictConfig);
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.mode, 'ALLOWLIST');
      assert.ok(res.reason?.includes('restricted to approved email providers'), 'Must mention restricted providers');
      assert.ok(res.reason?.includes('admissions@viar.in'), 'Must provide admissions contact for whitelisting');
    });
  });

  describe('Input Validation & Error Messages', () => {
    it('should reject malformed email addresses', () => {
      const res = validateEmailForSignup('not-an-email');
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('valid email address'));
    });

    it('should reject email addresses without domain extension', () => {
      const res = validateEmailForSignup('user@localhost');
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('valid email address'));
    });
  });

});
