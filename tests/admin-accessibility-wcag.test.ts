import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  getCalendarFeedToken,
  verifyCalendarFeedToken,
  regenerateCalendarFeedToken,
} from '../src/lib/sessions/calendarFeed';

describe('Admin Accessibility (WCAG AA), Contrast, and Invariants Suite', () => {
  const adminPortalPath = path.join(process.cwd(), 'src/app/admin/AdminPortalClient.tsx');
  const sessionsManagerPath = path.join(process.cwd(), 'src/components/admin/SessionsManager.tsx');
  const adminHomeHubPath = path.join(process.cwd(), 'src/components/admin/AdminHomeHub.tsx');
  const dataPath = path.join(process.cwd(), 'src/lib/data.ts');
  const dtoPath = path.join(process.cwd(), 'src/lib/courses/dto.ts');

  const adminPortalSrc = fs.readFileSync(adminPortalPath, 'utf8');
  const sessionsManagerSrc = fs.readFileSync(sessionsManagerPath, 'utf8');
  const adminHomeHubSrc = fs.readFileSync(adminHomeHubPath, 'utf8');
  const dataSrc = fs.readFileSync(dataPath, 'utf8');
  const dtoSrc = fs.readFileSync(dtoPath, 'utf8');

  // =========================================================================
  // 1. WCAG AA CONTRAST & COMPONENT READABILITY
  // =========================================================================
  describe('1. WCAG AA High Contrast Element Verification', () => {
    it('verifies Payments status tab strip uses high-contrast active and inactive styles', () => {
      // Active tab: amber-400 text-slate-950 font-black
      assert.match(
        adminPortalSrc,
        /bg-amber-400 text-slate-950 border border-amber-300 shadow-md font-black/,
        'Payments active tab must use high-contrast solid amber background with dark black text'
      );
      // Inactive tab: bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100
      assert.match(
        adminPortalSrc,
        /bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100/,
        'Payments inactive tabs must use high-contrast dual-mode styles with readable text'
      );
    });

    it('verifies Sessions meeting link box uses high contrast container, label, and copy button', () => {
      assert.match(
        sessionsManagerSrc,
        /bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm/,
        'Class meeting link box must have high contrast container with clear border'
      );
      assert.match(
        sessionsManagerSrc,
        /text-slate-700 dark:text-slate-100 font-bold shrink-0/,
        'Class meeting link label must be bold and high contrast text'
      );
      assert.match(
        sessionsManagerSrc,
        /text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline/,
        'Class meeting link text must be bright amber font-bold'
      );
    });

    it('verifies time-window boxes in Requests use high contrast border and readable text', () => {
      assert.match(
        sessionsManagerSrc,
        /bg-amber-500\/10 dark:bg-slate-900 border-2 border-amber-500\/40 dark:border-amber-500\/60 text-xs shadow-sm/,
        'Preferred time window boxes must have high contrast background and amber border'
      );
      assert.match(
        sessionsManagerSrc,
        /font-extrabold text-amber-800 dark:text-amber-300 block mb-0\.5/,
        'Slot header must be font-extrabold amber'
      );
      assert.match(
        sessionsManagerSrc,
        /font-semibold text-slate-800 dark:text-slate-100/,
        'Slot time label must be readable text font-semibold'
      );
    });

    it('verifies action buttons (Propose, Decline, WhatsApp) meet high contrast standards', () => {
      // Propose another time: solid sky-600 with white text
      assert.match(
        sessionsManagerSrc,
        /bg-sky-600 hover:bg-sky-500 text-white border border-sky-400 shadow-sm/,
        '"Propose another time" button must be solid sky-600 with white text'
      );
      // Decline: solid rose-600 with white text
      assert.match(
        sessionsManagerSrc,
        /bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-sm/,
        '"Decline" button must be solid rose-600 with white text'
      );
      // WhatsApp in sessions: solid emerald-600 with white text
      assert.match(
        sessionsManagerSrc,
        /bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-sm/,
        '"Message on WhatsApp" button in sessions must be solid emerald-600 with white text'
      );
    });

    it('verifies Certification Exam Readiness card is prominent and high contrast', () => {
      assert.match(
        adminPortalSrc,
        /bg-purple-500\/10 dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-400\/80 shadow-md/,
        'Certification Exam Readiness card must have high-contrast border and dual-mode background'
      );
      assert.match(
        adminPortalSrc,
        /bg-purple-400 hover:bg-purple-300 text-slate-950/,
        'Certification Readiness button must be high-contrast purple-400 with dark bold text'
      );
      assert.match(
        adminPortalSrc,
        /questions active in question bank \(Target: 20 Questions\)/,
        'Question count must prominently state target of 20 active questions'
      );
    });
  });

  // =========================================================================
  // 2. LEFTOVER WORDING & RAW LABELS ELIMINATION
  // =========================================================================
  describe('2. Leftover Wording & Raw Labels Guardrails', () => {
    it('ensures banned marketing and internal database jargon is purged from Admin UI', () => {
      const bannedTerms = [
        'Zero gateway commissions',
        '0% Transaction Fees',
        'Unlocked in PostgreSQL database',
        'Live tamper-proof log',
        'Unified administrative tiles',
        '100% self-paced on-demand video',
        '23 video modules',
        'Add New Course to Catalog',
        'No orders found in "PAYMENT_CLAIMED" queue',
      ];

      for (const term of bannedTerms) {
        assert.strictEqual(
          adminPortalSrc.includes(term),
          false,
          `AdminPortalClient must not contain banned term: "${term}"`
        );
        assert.strictEqual(
          adminHomeHubSrc.includes(term),
          false,
          `AdminHomeHub must not contain banned term: "${term}"`
        );
      }
    });

    it('ensures course DTO and data files do not promise on-demand video or lifetime access', () => {
      assert.strictEqual(
        dtoSrc.includes('All 23 video modules'),
        false,
        'dto.ts must not claim "All 23 video modules"'
      );
      assert.strictEqual(
        dtoSrc.includes('lifetime access'),
        false,
        'dto.ts must not promise "lifetime access"'
      );
      assert.strictEqual(
        dataSrc.includes('completely self-paced with lifetime access'),
        false,
        'data.ts must not claim "completely self-paced with lifetime access"'
      );
    });
  });

  // =========================================================================
  // 3. CALENDAR FEED SECRET TOKEN & REGENERATION SECURITY
  // =========================================================================
  describe('3. Calendar Feed Secret Token Lifecycle', () => {
    it('provides secret calendar feed token that verifies successfully', () => {
      const token = getCalendarFeedToken();
      assert.ok(token && token.length > 10, 'Calendar token must exist and have adequate entropy');
      assert.strictEqual(verifyCalendarFeedToken(token), true, 'Valid token must be accepted');
    });

    it('rejects invalid, empty, or wrong tokens with 401 equivalent', () => {
      assert.strictEqual(verifyCalendarFeedToken(''), false);
      assert.strictEqual(verifyCalendarFeedToken('invalid_token_123'), false);
      assert.strictEqual(verifyCalendarFeedToken(null as unknown as string), false);
      assert.strictEqual(verifyCalendarFeedToken(undefined as unknown as string), false);
    });

    it('regenerating token invalidates old token immediately', () => {
      const oldToken = getCalendarFeedToken();
      const newToken = regenerateCalendarFeedToken();

      assert.notStrictEqual(newToken, oldToken, 'New token must differ from old token');
      assert.strictEqual(verifyCalendarFeedToken(oldToken), false, 'Old token must be rejected immediately');
      assert.strictEqual(verifyCalendarFeedToken(newToken), true, 'New token must be accepted');
    });
  });

  // =========================================================================
  // 4. BANK DETAILS MASKING & AUDIT TRAIL
  // =========================================================================
  describe('4. Bank Account Number Masking & Audit', () => {
    it('masks account number by default showing only the last 4 digits', () => {
      assert.match(
        adminPortalSrc,
        /\.slice\(-4\)/,
        'Settings bank details must display masked account number showing only last 4 digits'
      );
      assert.match(
        adminPortalSrc,
        /••••••••••••/,
        'Masked display must use bullet mask prefix'
      );
    });

    it('has an unmask toggle action that records BANK_ACCOUNT_UNMASKED in audit log', () => {
      assert.match(
        adminPortalSrc,
        /handleToggleShowAccountNumber/,
        'Must have handler for unmasking bank account number'
      );
      assert.match(
        adminPortalSrc,
        /action:\s*'BANK_ACCOUNT_UNMASKED'/,
        'Unmasking must trigger BANK_ACCOUNT_UNMASKED audit log entry'
      );
    });
  });

  // =========================================================================
  // 5. RESTORED REPORTS (ANALYTICS) NAVIGATION & METRICS
  // =========================================================================
  describe('5. Restored Reports Tab in Admin Portal', () => {
    it('includes Reports navigation item with BarChart2 icon', () => {
      assert.match(
        adminPortalSrc,
        /<BarChart2 className="w-4 h-4 text-amber-400" \/>\s*<span>Reports<\/span>/,
        'Admin navigation must include "Reports" tab with BarChart2 icon'
      );
    });

    it('renders Reports & Learning Progress view with database metrics', () => {
      assert.match(
        adminPortalSrc,
        /Reports (&amp;|&) Learning Progress/,
        'Reports tab must render "Reports & Learning Progress" heading'
      );
      assert.match(
        adminPortalSrc,
        /Recorded \+ Live Classes/,
        'Reports delivery must accurately read "Recorded + Live Classes"'
      );
    });
  });

  // =========================================================================
  // 6. ENROLMENT READINESS CHECKLIST GATING
  // =========================================================================
  describe('6. Enrolment Readiness Checklist Activation Gate', () => {
    it('strictly checks acceptingEnrollments boolean status to ensure modal triggers when off', () => {
      assert.match(
        adminPortalSrc,
        /Boolean\(crs\.acceptingEnrollments\)/,
        'Enrolment toggle must evaluate Boolean(crs.acceptingEnrollments) to avoid undefined defaulting to on'
      );
    });
  });
});
