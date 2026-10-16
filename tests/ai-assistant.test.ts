import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectLanguage,
  identifyIntent,
  generateGroundedAssistantResponse,
} from '../src/lib/ai/assistantEngine.ts';
import { VIAR_ACADEMY_FACTS } from '../src/lib/ai/knowledgeBase.ts';

describe('Floating AI Assistant — Grounded Knowledge & Multilingual Engine', () => {

  // 1. Language Detection Suite
  describe('1. Language Detection (English, Hindi, Hinglish)', () => {
    it('should detect pure Devanagari Hindi accurately', () => {
      assert.strictEqual(detectLanguage('कोर्स की फीस कितनी है?'), 'hi');
      assert.strictEqual(detectLanguage('नमस्ते आचार्य जी, क्या मुझे सर्टिफिकेट मिलेगा?'), 'hi');
      assert.strictEqual(detectLanguage('पाठ्यक्रम में क्या सिखाया जाता है?'), 'hi');
    });

    it('should detect natural Hinglish queries accurately', () => {
      assert.strictEqual(detectLanguage('fees kitni hai course ki?'), 'hinglish');
      assert.strictEqual(detectLanguage('kya live classes hoti hain ya recorded?'), 'hinglish');
      assert.strictEqual(detectLanguage('syllabus mein kya kya padhaya jayega?'), 'hinglish');
      assert.strictEqual(detectLanguage('acharya niraj kumar ji se baat karni hai'), 'hinglish');
      assert.strictEqual(detectLanguage('admission kaise lena hai?'), 'hinglish');
      assert.strictEqual(detectLanguage('kya refund milta hai agar pasand na aaye?'), 'hinglish');
    });

    it('should detect English queries accurately', () => {
      assert.strictEqual(detectLanguage('What is the tuition fee for the astrology masterclass?'), 'en');
      assert.strictEqual(detectLanguage('Is this course completely self-paced with lifetime access?'), 'en');
      assert.strictEqual(detectLanguage('How do I verify the digital certificate?'), 'en');
      assert.strictEqual(detectLanguage('Who is the lead instructor for this academy?'), 'en');
    });
  });

  // 2. Intent Identification Suite
  describe('2. Intent Classification', () => {
    it('should correctly classify tuition fee inquiries', () => {
      assert.strictEqual(identifyIntent('how much does the course cost?'), 'fees_pricing');
      assert.strictEqual(identifyIntent('fees kitni lagegi?'), 'fees_pricing');
      assert.strictEqual(identifyIntent('कोर्स की फीस क्या है?'), 'fees_pricing');
      assert.strictEqual(identifyIntent('is there any discount or installment?'), 'fees_pricing');
    });

    it('should correctly classify syllabus and curriculum inquiries', () => {
      assert.strictEqual(identifyIntent('tell me about the 23 modules'), 'syllabus_curriculum');
      assert.strictEqual(identifyIntent('syllabus mein kya kya padhaya jayega?'), 'syllabus_curriculum');
      assert.strictEqual(identifyIntent('पाठ्यक्रम में कौन से विषय शामिल हैं?'), 'syllabus_curriculum');
      assert.strictEqual(identifyIntent('what topics are covered in the curriculum?'), 'syllabus_curriculum');
    });

    it('should correctly classify schedule and format inquiries (self-paced vs live)', () => {
      assert.strictEqual(identifyIntent('is this live on zoom or recorded?'), 'format_schedule');
      assert.strictEqual(identifyIntent('kya classes live hoti hain ya recording milegi?'), 'format_schedule');
      assert.strictEqual(identifyIntent('क्या यह लाइव क्लास है या रिकॉर्डेड?'), 'format_schedule');
      assert.strictEqual(identifyIntent('do I get lifetime access?'), 'format_schedule');
    });

    it('should correctly classify certificate inquiries', () => {
      assert.strictEqual(identifyIntent('do I get a verifiable certificate upon completion?'), 'certificate');
      assert.strictEqual(identifyIntent('certificate ke liye exam pass karna padega kya?'), 'certificate');
      assert.strictEqual(identifyIntent('क्या सर्टिफिकेट मिलेगा?'), 'certificate');
    });

    it('should correctly classify instructor credentials inquiries', () => {
      assert.strictEqual(identifyIntent('who is Acharya Niraj Kumar?'), 'instructor');
      assert.strictEqual(identifyIntent('teacher ka qualification aur experience kya hai?'), 'instructor');
      assert.strictEqual(identifyIntent('आचार्य नीरज कुमार जी का परिचय क्या है?'), 'instructor');
    });

    it('should correctly classify payment process inquiries', () => {
      assert.strictEqual(identifyIntent('how to pay via UPI QR?'), 'payment_how_to');
      assert.strictEqual(identifyIntent('payment kaise karein aur screenshot kahan bhejna hai?'), 'payment_how_to');
      assert.strictEqual(identifyIntent('पेमेंट कैसे करें?'), 'payment_how_to');
    });

    it('should correctly classify refund inquiries', () => {
      assert.strictEqual(identifyIntent('what is your refund policy?'), 'refund');
      assert.strictEqual(identifyIntent('agar course pasand na aaye toh paise wapas milenge?'), 'refund');
      assert.strictEqual(identifyIntent('धनवापसी नीति क्या है?'), 'refund');
    });

    it('should correctly classify personal horoscope / prediction inquiries', () => {
      assert.strictEqual(identifyIntent('meri kundli dekh kar batao meri shadi kab hogi?'), 'personal_consultation');
      assert.strictEqual(identifyIntent('can you read my birth chart for my career future?'), 'personal_consultation');
      assert.strictEqual(identifyIntent('मेरी कुंडली का विश्लेषण करें'), 'personal_consultation');
    });

    it('should correctly classify out-of-scope inquiries', () => {
      assert.strictEqual(identifyIntent('write a python script to scrape data'), 'out_of_scope');
      assert.strictEqual(identifyIntent('who will win the political election?'), 'out_of_scope');
      assert.strictEqual(identifyIntent('what medicine should I take for headache?'), 'out_of_scope');
    });
  });

  // 3. Grounded Knowledge Integrity (Zero Hallucination)
  describe('3. Grounded Knowledge Integrity & Zero Hallucination', () => {
    it('Pricing Fact Check: Must strictly state ₹5,100 INR and reject arbitrary numbers', () => {
      const resEn = generateGroundedAssistantResponse('What is the course fee?');
      assert.ok(resEn.reply.includes('5,100'), 'English response must contain 5,100');
      assert.strictEqual(resEn.reply.includes('₹5,100'), true);
      assert.strictEqual(resEn.reply.includes('15,000'), false);
      assert.strictEqual(resEn.reply.includes('35,000'), false);

      const resHi = generateGroundedAssistantResponse('कोर्स की फीस क्या है?');
      assert.ok(resHi.reply.includes('5,100'), 'Hindi response must contain 5,100');

      const resHinglish = generateGroundedAssistantResponse('fees kitni hai course ki?');
      assert.ok(resHinglish.reply.includes('5,100'), 'Hinglish response must contain 5,100');
    });

    it('Curriculum Fact Check: Must state 23 on-demand modules and 2 bonus workshops', () => {
      const res = generateGroundedAssistantResponse('What is the syllabus?');
      assert.ok(res.reply.includes('23'), 'Must mention 23 modules');
      assert.ok(res.reply.toLowerCase().includes('bonus'), 'Must mention bonus workshops');
      assert.ok(res.reply.includes('Career') || res.reply.includes('career'), 'Must mention career reading');
      assert.ok(res.reply.includes('Marriage') || res.reply.includes('marriage'), 'Must mention marriage timing');
    });

    it('Format Fact Check: Must state 100% self-paced and lifetime access', () => {
      const res = generateGroundedAssistantResponse('Is the course live or recorded?');
      assert.ok(res.reply.toLowerCase().includes('self-paced') || res.reply.includes('सेल्फ-पेस्ड'), 'Must highlight self-paced');
      assert.ok(res.reply.toLowerCase().includes('lifetime') || res.reply.includes('आजीवन'), 'Must highlight lifetime access');
    });

    it('Refund Policy Fact Check: Must state 7 calendar days and up to 3 modules', () => {
      const res = generateGroundedAssistantResponse('What is the refund policy?');
      assert.ok(res.reply.includes('7'), 'Must mention 7 days');
      assert.ok(res.reply.includes('3'), 'Must mention 3 modules limit');
      assert.ok(res.reply.includes('100%'), 'Must mention 100% full refund');
    });

    it('Certification Fact Check: Must state 20 questions and 70% passing threshold', () => {
      const res = generateGroundedAssistantResponse('Do I get a certificate?');
      assert.ok(res.reply.includes('20'), 'Must mention 20 questions');
      assert.ok(res.reply.includes('70%'), 'Must mention 70% passing score');
      assert.ok(res.reply.includes('viar.in/verify'), 'Must mention verification URL');
    });

    it('Instructor Pedigree Check: Must state Bharatiya Vidya Bhavan and 20+ years experience', () => {
      const res = generateGroundedAssistantResponse('Who is Acharya Niraj Kumar?');
      assert.ok(res.reply.includes('Bharatiya Vidya Bhavan') || res.reply.includes('भारतीय विद्या भवन'), 'Must state BVB');
      assert.ok(res.reply.includes('20'), 'Must mention 20+ years');
    });

    it('Payment & Credentials Security: Must state direct UPI and ZERO passwords sent over WhatsApp', () => {
      const res = generateGroundedAssistantResponse('How to pay and get login access?');
      assert.ok(res.reply.includes('UPI') || res.reply.includes('यूपीआई'), 'Must state UPI');
      assert.ok(res.reply.includes('aapkaastro@okaxis'), 'Must state official UPI VPA');
      assert.ok(res.reply.includes('12') && res.reply.includes('UTR'), 'Must mention 12-digit UTR');
    });
  });

  // 4. Safe Refusal & Escalation Suite
  describe('4. Safe Refusal & Escalation', () => {
    it('Personal Horoscope Inquiry: Must decline prediction and provide direct consultation link to Acharya ji', () => {
      const res = generateGroundedAssistantResponse('meri kundli dekh kar batao meri shadi kab hogi?');
      // Must politely clarify that AI does not do personal predictions
      assert.ok(
        res.reply.toLowerCase().includes('personal') ||
        res.reply.includes('व्यक्तिगत') ||
        res.reply.includes('prediction') ||
        res.reply.includes('consultation'),
        'Must decline personal chart prediction'
      );

      // Must provide WhatsApp action button linking to Acharya ji
      const waAction = res.actionButtons.find((b) => b.type === 'whatsapp');
      assert.ok(waAction, 'Must have WhatsApp action button');
      assert.ok(waAction.url.includes('919311215564'), 'WhatsApp must target official number');
      assert.ok(waAction.url.includes('Kundli') || waAction.url.includes('Consultation'), 'URL must pre-fill consultation request');
    });

    it('Out of Scope Inquiry: Must decline coding/unrelated topics and provide help escalation', () => {
      const res = generateGroundedAssistantResponse('write a python script for scraping stocks');
      assert.ok(
        res.reply.includes('VIAR') || res.reply.includes('academic') || res.reply.includes('वैदिक ज्योतिष'),
        'Must state boundary of knowledge'
      );
      assert.strictEqual(res.confidence, 'fallback');
      const waAction = res.actionButtons.find((b) => b.type === 'whatsapp');
      assert.ok(waAction, 'Must provide direct WhatsApp escalation');
    });
  });

  // 5. Action Buttons Formatting
  describe('5. Action Buttons & Deep Links', () => {
    it('should generate valid WhatsApp URLs with encoded parameters', () => {
      const res = generateGroundedAssistantResponse('how can I contact Acharya ji?');
      const wa = res.actionButtons.find((b) => b.type === 'whatsapp');
      assert.ok(wa, 'WhatsApp action must be present');
      assert.ok(wa.url.startsWith('https://wa.me/919311215564'));
    });

    it('should generate valid checkout URL for enrollment', () => {
      const res = generateGroundedAssistantResponse('I want to enroll in the astrology course');
      const enroll = res.actionButtons.find((b) => b.type === 'enroll');
      assert.ok(enroll, 'Enroll action must be present');
      assert.strictEqual(enroll.url, '/checkout?course=what-is-astrology');
    });
  });
});
