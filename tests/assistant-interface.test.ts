import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isAllowedLinkUrl,
  shouldSuppressAssistant,
  SUGGESTED_QUESTION_CHIPS,
  buildEscalationWhatsAppUrl,
} from '../src/lib/ai/safeMarkdown.ts';

describe('Floating AI Assistant Interface Specifications Suite', () => {
  describe('1. Link Allowlist & Strict XSS Prevention (isAllowedLinkUrl)', () => {
    it('should allow valid internal site paths', () => {
      assert.strictEqual(isAllowedLinkUrl('/'), true);
      assert.strictEqual(isAllowedLinkUrl('/courses'), true);
      assert.strictEqual(isAllowedLinkUrl('/checkout?course=what-is-astrology'), true);
      assert.strictEqual(isAllowedLinkUrl('/verify/VIAR-2026-WIA-1001'), true);
      assert.strictEqual(isAllowedLinkUrl('/privacy-policy'), true);
    });

    it('should allow canonical site URLs (viar.in)', () => {
      assert.strictEqual(isAllowedLinkUrl('https://viar.in'), true);
      assert.strictEqual(isAllowedLinkUrl('https://viar.in/checkout'), true);
      assert.strictEqual(isAllowedLinkUrl('http://viar.in/about'), true);
    });

    it('should allow official WhatsApp links', () => {
      assert.strictEqual(isAllowedLinkUrl('https://wa.me/919311215564'), true);
      assert.strictEqual(isAllowedLinkUrl('https://wa.me/919311215564?text=Hello'), true);
      assert.strictEqual(isAllowedLinkUrl('https://api.whatsapp.com/send?phone=919311215564'), true);
    });

    it('should allow telephone links', () => {
      assert.strictEqual(isAllowedLinkUrl('tel:+919311215564'), true);
      assert.strictEqual(isAllowedLinkUrl('tel:919311215564'), true);
    });

    it('should REJECT external third-party domains', () => {
      assert.strictEqual(isAllowedLinkUrl('https://google.com'), false);
      assert.strictEqual(isAllowedLinkUrl('https://attacker.com/steal'), false);
      assert.strictEqual(isAllowedLinkUrl('http://fake-viar.com'), false);
    });

    it('should REJECT protocol-relative and backslash bypass attempts', () => {
      assert.strictEqual(isAllowedLinkUrl('//attacker.com'), false);
      assert.strictEqual(isAllowedLinkUrl('/\\attacker.com'), false);
    });

    it('should REJECT javascript: and data: URI payloads', () => {
      assert.strictEqual(isAllowedLinkUrl('javascript:alert(1)'), false);
      assert.strictEqual(isAllowedLinkUrl('data:text/html,<script>alert(1)</script>'), false);
      assert.strictEqual(isAllowedLinkUrl('vbscript:msgbox(1)'), false);
    });
  });

  describe('2. Route Suppression Logic (shouldSuppressAssistant)', () => {
    it('should suppress assistant on /admin routes', () => {
      assert.strictEqual(shouldSuppressAssistant('/admin'), true);
      assert.strictEqual(shouldSuppressAssistant('/admin/team'), true);
      assert.strictEqual(shouldSuppressAssistant('/admin/knowledge'), true);
      assert.strictEqual(shouldSuppressAssistant('/hi/admin'), true);
    });

    it('should suppress assistant on /dashboard routes', () => {
      assert.strictEqual(shouldSuppressAssistant('/dashboard'), true);
      assert.strictEqual(shouldSuppressAssistant('/dashboard/courses'), true);
      assert.strictEqual(shouldSuppressAssistant('/hi/dashboard'), true);
    });

    it('should suppress assistant on /instructor routes', () => {
      assert.strictEqual(shouldSuppressAssistant('/instructor'), true);
      assert.strictEqual(shouldSuppressAssistant('/instructor/students'), true);
      assert.strictEqual(shouldSuppressAssistant('/hi/instructor'), true);
    });

    it('should suppress assistant on /checkout routes', () => {
      assert.strictEqual(shouldSuppressAssistant('/checkout'), true);
      assert.strictEqual(shouldSuppressAssistant('/checkout/what-is-astrology'), true);
      assert.strictEqual(shouldSuppressAssistant('/checkout/cohort-spring-2026'), true);
      assert.strictEqual(shouldSuppressAssistant('/hi/checkout'), true);
    });

    it('should NOT suppress assistant on public pages', () => {
      assert.strictEqual(shouldSuppressAssistant('/'), false);
      assert.strictEqual(shouldSuppressAssistant('/hi'), false);
      assert.strictEqual(shouldSuppressAssistant('/about'), false);
      assert.strictEqual(shouldSuppressAssistant('/courses'), false);
      assert.strictEqual(shouldSuppressAssistant('/courses/what-is-astrology'), false);
      assert.strictEqual(shouldSuppressAssistant('/contact'), false);
      assert.strictEqual(shouldSuppressAssistant('/verify'), false);
      assert.strictEqual(shouldSuppressAssistant('/privacy-policy'), false);
      assert.strictEqual(shouldSuppressAssistant('/pricing-policy'), false);
      assert.strictEqual(shouldSuppressAssistant('/terms'), false);
    });
  });

  describe('3. Suggested Question Chips (SUGGESTED_QUESTION_CHIPS)', () => {
    it('should have exactly 4 chips in English', () => {
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.en.length, 4);
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.en[0], 'What is the course fee?');
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.en[1], 'What are the 23 modules?');
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.en[2], 'Who is the instructor?');
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.en[3], 'How do I get certified?');
    });

    it('should have exactly 4 chips in Hindi', () => {
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.hi.length, 4);
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.hi[0], 'कोर्स की फीस कितनी है?');
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.hi[1], '23 मॉड्यूल में क्या शामिल है?');
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.hi[2], 'आचार्य जी की योग्यता क्या है?');
      assert.strictEqual(SUGGESTED_QUESTION_CHIPS.hi[3], 'सर्टिफिकेट कैसे मिलेगा?');
    });
  });

  describe('4. Escalation WhatsApp URL with Pre-Filled Visitor Inquiries', () => {
    it('should pre-fill visitor question in English', () => {
      const url = buildEscalationWhatsAppUrl('Can I pay in two installments?', false);
      assert.ok(url.startsWith('https://wa.me/919311215564?text='));
      assert.ok(url.includes(encodeURIComponent('Can I pay in two installments?')));
      assert.ok(url.includes(encodeURIComponent('VIAR AI assistant')));
    });

    it('should pre-fill visitor question in Hindi', () => {
      const url = buildEscalationWhatsAppUrl('क्या लाइव क्लास भी होगी?', true);
      assert.ok(url.startsWith('https://wa.me/919311215564?text='));
      assert.ok(url.includes(encodeURIComponent('क्या लाइव क्लास भी होगी?')));
      assert.ok(url.includes(encodeURIComponent('नमस्ते आचार्य जी')));
    });

    it('should provide default inquiry text when no question exists', () => {
      const urlEn = buildEscalationWhatsAppUrl(undefined, false);
      assert.ok(urlEn.includes(encodeURIComponent('VIAR Vedic Astrology Masterclass')));

      const urlHi = buildEscalationWhatsAppUrl('', true);
      assert.ok(urlHi.includes(encodeURIComponent('विहंगम ज्योतिष मास्टरक्लास')));
    });
  });
});
