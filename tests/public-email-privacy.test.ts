import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BUILTIN_CONTENT_DEFAULTS } from '../src/lib/content/defaultContent.ts';
import { generateGroundedAssistantResponse } from '../src/lib/ai/assistantEngine.ts';
import { VIAR_ACADEMY_FACTS } from '../src/lib/ai/knowledgeBase.ts';
import { ABOUT_INSTITUTE_KNOWLEDGE } from '../src/lib/ai/knowledge/about.ts';
import {
  renderEnrollmentConfirmation,
  renderPaymentReceipt,
  renderClassReminder,
  renderCertificateIssued,
  renderPaymentApproved,
  renderPaymentRejected,
} from '../src/lib/email/templates.ts';
import { POST as handleContentUpdate } from '../src/app/api/admin/content/route.ts';
import { setTestAuthUser, type ServerAuthResult } from '../src/lib/auth/serverAuth.ts';

const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com').toLowerCase().trim();

const OWNER_PERSONA: ServerAuthResult = {
  isAuthenticated: true,
  userId: 'usr_owner_001',
  clerkId: 'clerk_owner_001',
  email: OWNER_EMAIL,
  isEmailVerified: true,
  isOwner: true,
  isStaff: true,
  staffSections: ['content', 'settings', 'courses', 'students', 'payments'],
  role: 'OWNER',
  dbUser: {
    id: 'usr_owner_001',
    name: 'Acharya Niraj Kumar',
    email: OWNER_EMAIL,
    role: 'OWNER',
    isOwner: true,
  } as any,
};

describe('Public Contact Email Privacy & Separation from Owner Login Address', () => {
  // ============================================================================
  // 1. Site Content & Default Content Settings Invariants
  // ============================================================================
  describe('1. Site Content & Settings Invariants', () => {
    it('contact_email in defaultContent must NOT equal OWNER_EMAIL and must be marked HIDDEN or needsConfirmation', () => {
      const allItems = Object.values(BUILTIN_CONTENT_DEFAULTS).flat();
      const emailItem = allItems.find((item) => item.key === 'contact_email');
      assert.ok(emailItem, 'contact_email setting must exist in defaultContent');

      const contentEn = (emailItem.contentEn || '').toLowerCase().trim();
      const contentHi = (emailItem.contentHi || '').toLowerCase().trim();
      const mailto = (String(emailItem.metadata?.mailto || '')).toLowerCase().trim();

      assert.notEqual(contentEn, OWNER_EMAIL, 'contentEn must NEVER be owner login email');
      assert.notEqual(contentHi, OWNER_EMAIL, 'contentHi must NEVER be owner login email');
      assert.ok(!mailto.includes(OWNER_EMAIL), 'mailto metadata must NEVER include owner login email');

      // Must be hidden or marked with needsConfirmation until confirmed by client
      const isHidden = emailItem.status === 'HIDDEN';
      const needsConfirmation = Boolean(emailItem.metadata?.needsConfirmation);
      assert.ok(
        isHidden || needsConfirmation || contentEn === '',
        'contact_email must be HIDDEN or marked with needsConfirmation until client supplies verified mailbox'
      );
    });

    it('POST /api/admin/content strictly rejects any attempt to set public email to OWNER_EMAIL', async () => {
      setTestAuthUser(OWNER_PERSONA);
      try {
        const req = new Request('http://localhost:3000/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: 'site_settings',
            key: 'contact_email',
            titleEn: 'Official Academy Email',
            titleHi: 'आधिकारिक संस्थान ईमेल',
            contentEn: OWNER_EMAIL,
            contentHi: OWNER_EMAIL,
            status: 'PUBLISHED',
          }),
        });

        const res = await handleContentUpdate(req as unknown as import('next/server').NextRequest);
        assert.equal(res.status, 400, 'Must return 400 Bad Request when setting contact_email to owner login email');
        const body = await res.json();
        assert.equal(body.success, false);
        assert.ok(body.error.toLowerCase().includes('owner login address') || body.error.toLowerCase().includes('not be'));
      } finally {
        setTestAuthUser(null);
      }
    });
  });

  // ============================================================================
  // 2. Public Pages Source Code & Components
  // ============================================================================
  describe('2. Public Pages Source Code & Components Verification', () => {
    const PUBLIC_PAGE_FILES = [
      'src/components/Footer.tsx',
      'src/components/CourseDetailClient.tsx',
      'src/app/about/page.tsx',
      'src/app/contact/page.tsx',
      'src/app/courses/page.tsx',
      'src/app/refund-policy/page.tsx',
      'src/app/privacy-policy/page.tsx',
      'src/app/terms/page.tsx',
      'src/app/pricing-policy/page.tsx',
      'src/app/disclaimer/page.tsx',
      'src/app/api/courses/[slug]/syllabus/download/route.ts',
    ];

    for (const relativePath of PUBLIC_PAGE_FILES) {
      it(`public page file '${relativePath}' must NEVER contain owner login email (${OWNER_EMAIL})`, () => {
        const fullPath = path.resolve(process.cwd(), relativePath);
        assert.ok(fs.existsSync(fullPath), `File must exist: ${relativePath}`);
        const sourceCode = fs.readFileSync(fullPath, 'utf8');

        assert.ok(
          !sourceCode.includes(OWNER_EMAIL),
          `Privacy violation: '${relativePath}' contains owner login email '${OWNER_EMAIL}'. Public pages must hide email until confirmed or use separate client-supplied address.`
        );
      });
    }
  });

  // ============================================================================
  // 3. Email Footers & Templates Verification
  // ============================================================================
  describe('3. Email Footers & Templates Verification', () => {
    it('renderEnrollmentConfirmation footer and text must NOT contain OWNER_EMAIL', () => {
      const email = renderEnrollmentConfirmation({
        studentName: 'Aarav Verma',
        studentEmail: 'aarav@example.com',
        courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
        cohortName: 'Foundation Batch',
        startDate: 'Immediate',
        amountPaid: 5100,
        currency: 'INR',
        dashboardUrl: 'https://viar.in/dashboard',
      });

      assert.ok(!email.html.includes(OWNER_EMAIL), 'Enrollment confirmation HTML footer must not contain owner email');
      assert.ok(!email.text.includes(OWNER_EMAIL), 'Enrollment confirmation text footer must not contain owner email');
    });

    it('renderPaymentReceipt footer and text must NOT contain OWNER_EMAIL', () => {
      const email = renderPaymentReceipt({
        receiptNumber: 'REC-UPI-1001',
        orderId: 'ord_1001',
        studentName: 'Priya Patel',
        studentEmail: 'priya@example.com',
        courseTitle: 'Foundations of Vedic Astrology (Jyotish)',
        cohortName: 'Self-Paced Mentorship',
        amount: 5100,
        currency: 'INR',
        paymentMethod: 'Direct UPI (Zero Gateway Deductions)',
        paymentDate: '26 Oct 2026',
        status: 'PAID',
        dashboardUrl: 'https://viar.in/dashboard/payments',
      });

      assert.ok(!email.html.includes(OWNER_EMAIL), 'Payment receipt HTML must not contain owner email');
      assert.ok(!email.text.includes(OWNER_EMAIL), 'Payment receipt text must not contain owner email');
    });

    it('renderClassReminder footer and text must NOT contain OWNER_EMAIL', () => {
      const email = renderClassReminder({
        studentName: 'Rohan Sharma',
        studentEmail: 'rohan@example.com',
        courseTitle: 'Foundations of Vedic Astrology',
        sessionNumber: 1,
        sessionTitle: 'Lagna & Planetary Basics',
        scheduledAtUtc: new Date(Date.now() + 3600000).toISOString(),
        joinLink: 'https://meet.google.com/test-room',
        reminderType: '1h',
      });

      assert.ok(!email.html.includes(OWNER_EMAIL), 'Class reminder HTML must not contain owner email');
      assert.ok(!email.text.includes(OWNER_EMAIL), 'Class reminder text must not contain owner email');
    });

    it('renderCertificateIssued footer and text must NOT contain OWNER_EMAIL', () => {
      const email = renderCertificateIssued({
        studentName: 'Meera Nair',
        studentEmail: 'meera@example.com',
        courseTitle: 'Foundations of Vedic Astrology',
        scorePercentage: 90,
        grade: 'Distinction',
        certificateCode: 'VIAR-2026-TEST-001',
        certificateUrl: 'https://viar.in/certificates/VIAR-2026-TEST-001.pdf',
        verifyUrl: 'https://viar.in/verify?code=VIAR-2026-TEST-001',
      });

      assert.ok(!email.html.includes(OWNER_EMAIL), 'Certificate issued HTML must not contain owner email');
      assert.ok(!email.text.includes(OWNER_EMAIL), 'Certificate issued text must not contain owner email');
    });

    it('renderPaymentApproved footer and text must NOT contain OWNER_EMAIL', () => {
      const email = renderPaymentApproved({
        studentName: 'Sanjay Gupta',
        studentEmail: 'sanjay@example.com',
        orderReference: 'VIAR-ORD-TEST',
        courseTitle: 'Foundations of Vedic Astrology',
        amountPaid: 5100,
        dashboardUrl: 'https://viar.in/dashboard',
      });

      assert.ok(!email.html.includes(OWNER_EMAIL), 'Payment approved HTML must not contain owner email');
      assert.ok(!email.text.includes(OWNER_EMAIL), 'Payment approved text must not contain owner email');
    });

    it('renderPaymentRejected footer and text must NOT contain OWNER_EMAIL', () => {
      const email = renderPaymentRejected({
        studentName: 'Devansh Roy',
        studentEmail: 'devansh@example.com',
        orderReference: 'VIAR-ORD-FAIL',
        courseTitle: 'Foundations of Vedic Astrology',
        amount: 5100,
        rejectionReason: 'UTR not credited in statement',
      });

      assert.ok(!email.html.includes(OWNER_EMAIL), 'Payment rejected HTML must not contain owner email');
      assert.ok(!email.text.includes(OWNER_EMAIL), 'Payment rejected text must not contain owner email');
    });
  });

  // ============================================================================
  // 4. Chatbot Answers & AI Knowledge Verification
  // ============================================================================
  describe('4. Chatbot Answers & AI Knowledge Privacy', () => {
    it('VIAR_ACADEMY_FACTS.contacts.email and ABOUT_INSTITUTE_KNOWLEDGE.contacts.email must NOT equal OWNER_EMAIL', () => {
      assert.notEqual(VIAR_ACADEMY_FACTS.contacts.email, OWNER_EMAIL);
      assert.notEqual(ABOUT_INSTITUTE_KNOWLEDGE.contacts.email, OWNER_EMAIL);
    });

    it('Chatbot responds to contact queries in English without exposing OWNER_EMAIL', () => {
      const queries = [
        'What is your official email address?',
        'How can I email Acharya Niraj Kumar?',
        'Contact email address please',
        'Who do I email for admissions inquiry?',
      ];

      for (const q of queries) {
        const response = generateGroundedAssistantResponse(q, { locale: 'en' });
        assert.ok(
          !response.reply.includes(OWNER_EMAIL),
          `Chatbot response for '${q}' exposed owner email: ${response.reply}`
        );
        assert.ok(
          response.reply.includes('93112 15564') || response.reply.includes('contact') || response.reply.includes('WhatsApp'),
          `Chatbot response should provide official WhatsApp helpline or contact desk for query '${q}'`
        );
      }
    });

    it('Chatbot responds to contact queries in Hindi without exposing OWNER_EMAIL', () => {
      const queries = [
        'संस्थान का आधिकारिक ईमेल क्या है?',
        'आचार्य जी से ईमेल पर कैसे संपर्क करें?',
        'संपर्क विवरण क्या हैं?',
      ];

      for (const q of queries) {
        const response = generateGroundedAssistantResponse(q, { locale: 'hi' });
        assert.ok(
          !response.reply.includes(OWNER_EMAIL),
          `Hindi Chatbot response for '${q}' exposed owner email: ${response.reply}`
        );
      }
    });

    it('Chatbot responds to contact queries in Hinglish without exposing OWNER_EMAIL', () => {
      const queries = [
        'Mujhe Acharya ji ko email bhejna hai, address kya hai?',
        'Contact email kya hai VIAR ka?',
      ];

      for (const q of queries) {
        const response = generateGroundedAssistantResponse(q);
        assert.ok(
          !response.reply.includes(OWNER_EMAIL),
          `Hinglish Chatbot response for '${q}' exposed owner email: ${response.reply}`
        );
      }
    });
  });
});
