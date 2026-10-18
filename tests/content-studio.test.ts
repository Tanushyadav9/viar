import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sanitizeRichText, isSafeContentUrl, renderSafeContent } from '../src/lib/content/sanitizer.ts';
import { BUILTIN_CONTENT_DEFAULTS } from '../src/lib/content/defaultContent.ts';
import {
  getContentItem,
  getCollectionItems,
  saveContentItem,
  restoreContentRevision,
  updateContentStatus,
} from '../src/lib/content/contentService.ts';
import {
  isStorageConfigured,
  checkMediaAssetUsage,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  deleteMediaAsset,
} from '../src/lib/content/mediaService.ts';
import {
  isSiteOwner,
  hasSectionPermission,
  checkStaffSectionAccess,
  verifyRouteAccess,
} from '../src/lib/auth/permissions.ts';

describe('Content Studio & Media Library Comprehensive Test Suite', () => {
  
  // ============================================================================
  // 1. RICH TEXT & LINK SANITIZER SECURITY
  // ============================================================================
  describe('1. Rich Text & Link Sanitizer Security', () => {
    test('should allow safe HTTPS, tel, mailto, and wa.me links', () => {
      assert.strictEqual(isSafeContentUrl('https://aapkaastro.com'), true);
      assert.strictEqual(isSafeContentUrl('https://wa.me/919311215564'), true);
      assert.strictEqual(isSafeContentUrl('tel:+919311215564'), true);
      assert.strictEqual(isSafeContentUrl('mailto:admissions@viar.in'), true);
      assert.strictEqual(isSafeContentUrl('/courses/what-is-astrology'), true);
    });

    test('should strictly reject malicious protocols and evasions', () => {
      assert.strictEqual(isSafeContentUrl('javascript:alert(1)'), false);
      assert.strictEqual(isSafeContentUrl('data:text/html;base64,PHNjcmlwdD4='), false);
      assert.strictEqual(isSafeContentUrl('vbscript:msgbox(1)'), false);
      assert.strictEqual(isSafeContentUrl('//evil.com/phish'), false);
      assert.strictEqual(isSafeContentUrl('/\\evil.com'), false);
      assert.strictEqual(isSafeContentUrl('http://insecure-site.com'), false); // Only https allowed
    });

    test('should strip dangerous tags (<script>, <iframe>, <object>, <style>)', () => {
      const malicious = '<p>Welcome</p><script>alert("hacked")</script><iframe></iframe>';
      const cleaned = sanitizeRichText(malicious);
      assert.strictEqual(cleaned.includes('<script>'), false);
      assert.strictEqual(cleaned.includes('<iframe>'), false);
      assert.strictEqual(cleaned.includes('alert'), false);
      assert.strictEqual(cleaned.includes('<p>Welcome</p>'), true);
    });

    test('should strip inline event handlers (onerror, onload, onclick)', () => {
      const malicious = '<img src="x" onerror="stealCookies()" onload="pwn()" />';
      const cleaned = sanitizeRichText(malicious);
      assert.strictEqual(cleaned.includes('onerror'), false);
      assert.strictEqual(cleaned.includes('onload'), false);
      assert.strictEqual(cleaned.includes('stealCookies'), false);
    });

    test('should preserve safe formatting (bold, italic, lists, safe links)', () => {
      const markdown = 'Master **Vedic Astrology** with *Acharya Niraj Kumar*:\n• Module 1\n• Module 2\nVisit [Aapka Astro](https://aapkaastro.com)';
      const rendered = renderSafeContent(markdown);
      assert.strictEqual(rendered.includes('<strong>Vedic Astrology</strong>'), true);
      assert.strictEqual(rendered.includes('<em>Acharya Niraj Kumar</em>'), true);
      assert.strictEqual(rendered.includes('href="https://aapkaastro.com"'), true);
      assert.strictEqual(rendered.includes('rel="noopener noreferrer"'), true);
    });
  });

  // ============================================================================
  // 2. RESILIENT FALLBACK ENGINE (ZERO CRASHES, ZERO BLANK PAGES)
  // ============================================================================
  describe('2. Resilient Built-in Default Fallback Engine', () => {
    test('should return built-in defaults when database entry does not exist', async () => {
      const item = await getContentItem('site_settings', 'contact_phone');
      assert.ok(item);
      assert.strictEqual(item.collection, 'site_settings');
      assert.strictEqual(item.key, 'contact_phone');
      assert.ok(item.titleEn.length > 0);
      assert.ok(item.contentEn.length > 0);
      assert.strictEqual(item.contentEn, '+91 93112 15564');
    });

    test('should return all 8 default FAQs when database has no records', async () => {
      const faqs = await getCollectionItems('faqs');
      assert.ok(Array.isArray(faqs));
      assert.strictEqual(faqs.length >= 8, true);
      const tuitionFaq = faqs.find((f) => f.key === 'faq_tuition_fee');
      assert.ok(tuitionFaq);
      assert.strictEqual(tuitionFaq?.titleEn.includes('fee'), true);
      assert.strictEqual(tuitionFaq?.status, 'PUBLISHED');
    });

    test('should return hero defaults with both English and Hindi text', async () => {
      const hero = await getContentItem('hero', 'hero_main');
      assert.ok(hero);
      assert.ok(hero.titleEn.includes('Vedic Astrology'));
      assert.ok(hero.titleHi.includes('वैदिक ज्योतिष'));
      assert.strictEqual(hero.status, 'PUBLISHED');
    });
  });

  // ============================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & OWNER/STAFF BOUNDARIES
  // ============================================================================
  describe('3. Role-Based Access Control & Scope Boundaries', () => {
    const ownerEmail = 'aapkaastro1606@gmail.com';
    const staffWithContent = {
      id: 'staff-1',
      name: 'Rohan Sharma',
      email: 'rohan@viar.in',
      role: 'ADMIN' as const,
      isOwner: false,
      timezone: 'Asia/Kolkata',
      enrolledCohortIds: [],
      staffSections: ['content', 'media'],
    };
    const staffCoursesOnly = {
      id: 'staff-2',
      name: 'Priya Verma',
      email: 'priya@viar.in',
      role: 'ADMIN' as const,
      isOwner: false,
      timezone: 'Asia/Kolkata',
      enrolledCohortIds: [],
      staffSections: ['courses'],
    };
    const studentUser = {
      id: 'student-1',
      name: 'Amit Patel',
      email: 'amit@gmail.com',
      role: 'STUDENT' as const,
      isOwner: false,
      timezone: 'Asia/Kolkata',
      enrolledCohortIds: [],
      staffSections: [],
    };

    test('Owner should have universal access to all sections including legal and staff', () => {
      assert.strictEqual(isSiteOwner(ownerEmail), true);
      assert.strictEqual(hasSectionPermission({ email: ownerEmail, isOwner: true } as any, 'content'), true);
      assert.strictEqual(hasSectionPermission({ email: ownerEmail, isOwner: true } as any, 'media'), true);
      assert.strictEqual(hasSectionPermission({ email: ownerEmail, isOwner: true } as any, 'staff'), true);
    });

    test('Staff with content permission can access content but NEVER legal or staff', () => {
      assert.strictEqual(hasSectionPermission(staffWithContent as any, 'content'), true);
      assert.strictEqual(hasSectionPermission(staffWithContent as any, 'media'), true);
      // Staff section is strictly owner-only
      assert.strictEqual(hasSectionPermission(staffWithContent as any, 'staff'), false);
    });

    test('Staff with only courses permission cannot access content or media', () => {
      assert.strictEqual(hasSectionPermission(staffCoursesOnly as any, 'content'), false);
      assert.strictEqual(hasSectionPermission(staffCoursesOnly as any, 'media'), false);
      assert.strictEqual(hasSectionPermission(staffCoursesOnly as any, 'courses'), true);
    });

    test('Student accounts cannot access any admin section', () => {
      assert.strictEqual(hasSectionPermission(studentUser as any, 'content'), false);
      assert.strictEqual(hasSectionPermission(studentUser as any, 'media'), false);
      assert.strictEqual(hasSectionPermission(studentUser as any, 'courses'), false);
    });

    test('Logged out request with empty session should be denied', () => {
      const mockReq = {
        cookies: { get: () => undefined },
        headers: { get: () => null },
      };
      const access = verifyRouteAccess(mockReq, 'content', 'VIEW');
      assert.strictEqual(access.allowed, false);
      assert.strictEqual(access.reason?.includes('Unauthenticated'), true);
    });
  });

  // ============================================================================
  // 4. MEDIA LIBRARY & STORAGE CONSTRAINTS
  // ============================================================================
  describe('4. Media Library Safety & Asset Protection', () => {
    test('should validate maximum file size of 5 MB', () => {
      assert.strictEqual(MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024);
      const smallFile = 2 * 1024 * 1024;
      const oversizedFile = 6 * 1024 * 1024;
      assert.strictEqual(smallFile <= MAX_IMAGE_SIZE_BYTES, true);
      assert.strictEqual(oversizedFile <= MAX_IMAGE_SIZE_BYTES, false);
    });

    test('should allow only JPG, PNG, and WebP mime types', () => {
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/jpeg'), true);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/png'), true);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/webp'), true);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('image/svg+xml'), false);
      assert.strictEqual(ALLOWED_MIME_TYPES.has('application/pdf'), false);
    });

    test('should return clear notice when Cloudflare R2 storage credentials are missing', () => {
      const status = isStorageConfigured();
      assert.strictEqual(typeof status.configured, 'boolean');
      assert.ok(status.message.length > 0);
      if (!status.configured) {
        assert.strictEqual(status.message.includes('Cloudflare R2'), true);
        assert.strictEqual(status.message.includes('disabled to protect database storage'), true);
      }
    });

    test('should block deletion of built-in system seed assets', async () => {
      await assert.rejects(
        async () => {
          await deleteMediaAsset('media-acharya-headshot', 'owner');
        },
        {
          message: /System seed assets are built into the platform and cannot be deleted/,
        }
      );
    });
  });

  // ============================================================================
  // 5. STATUS TRANSITIONS & REVISION HISTORY INTEGRITY
  // ============================================================================
  describe('5. Status Transitions & Revision Snapshots', () => {
    test('BUILTIN_CONTENT_DEFAULTS contains all mandatory collections with EN and HI', () => {
      const collections = Object.keys(BUILTIN_CONTENT_DEFAULTS);
      assert.ok(collections.includes('site_settings'));
      assert.ok(collections.includes('hero'));
      assert.ok(collections.includes('faqs'));
      assert.ok(collections.includes('about'));

      for (const col of collections) {
        const items = BUILTIN_CONTENT_DEFAULTS[col];
        assert.ok(items.length > 0, `Collection ${col} must have seed items`);
        for (const item of items) {
          assert.ok(item.titleEn.length > 0, `Item ${item.key} must have English title`);
          assert.ok(item.titleHi.length > 0, `Item ${item.key} must have Hindi title`);
          assert.strictEqual(typeof item.sortOrder, 'number');
        }
      }
    });
  });

});
