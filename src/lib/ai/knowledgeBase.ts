/**
 * VIAR Grounded Knowledge Base
 * Single Source of Truth for the VIAR AI Assistant.
 *
 * CRITICAL RULE: "A confident wrong answer about prices or policies is worse than saying 'I don't know'."
 * All answers must strictly be grounded in the verified facts below.
 */

export interface ViarCourseFact {
  id: string;
  slug: string;
  titleEn: string;
  titleHi: string;
  priceInr: number;
  priceUsd: number;
  originalPriceInr?: number;
  originalPriceUsd?: number;
  isOneTimeFee: boolean;
  totalModules: number;
  totalBonusWorkshops: number;
  totalLessons: number;
  deliveryMode: 'SELF_PACED';
  hasLifetimeAccess: boolean;
  certificateProvided: boolean;
  passingPercentage: number;
  examQuestionCount: number;
  languageOfInstruction: string;
  formatDescription?: string;
  keyTopics?: string[];
  bonusWorkshops?: string[];
  curriculumSummary?: string[];
}

export const VIAR_ACADEMY_FACTS = {
  name: 'Vihangam Institute of Astrology and Research',
  shortName: 'VIAR',
  domain: 'https://viar.in',
  founder: {
    name: 'Acharya Niraj Kumar',
    credentials: [
      'Jyotish Acharya — Bharatiya Vidya Bhavan (Institute of Astrology, New Delhi, under guru K.N. Rao)',
      'Logical Vastu Expert — ISO 9001:2015 Certified',
      'Certified Astro Vastu Specialist (Jyotishvedanghub)',
      'Founder of Aapka Astro (26k+ followers across India and abroad)',
      'Over 20 years of authentic Vedic astrological practice',
      'Former Corporate Vice President (Reliance Retail, Metro Cash & Carry, NIF Food)',
    ],
    relationshipWithAapkaAstro:
      'VIAR (viar.in) is the educational institute for learning Vedic astrology. Aapka Astro (aapkaastro.com) is Acharya Niraj Kumar\'s personal consultation practice for 1-on-1 horoscope readings and Vastu audits.',
  },
  contacts: {
    whatsapp: '+91 93112 15564',
    whatsappUrl: 'https://wa.me/919311215564',
    phone: '+91 93112 15564',
    phoneTel: 'tel:+919311215564',
    email: 'aapkaastro1606@gmail.com',
    location: 'New Delhi, India',
  },
  paymentPolicy: {
    method: 'Direct UPI QR Code & Bank Transfer (Zero gateway commission fees)',
    upiId: 'aapkaastro@okaxis',
    payeeName: 'Vihangam Institute of Astrology and Research',
    checkoutUrl: '/checkout?course=what-is-astrology',
    process: [
      '1. Student visits /checkout and views the locked course tuition (₹5,100 INR) with dynamic UPI QR code.',
      '2. Student scans the QR code or pays directly to UPI ID aapkaastro@okaxis.',
      '3. Student clicks "I have paid" and enters their 12-digit numeric bank UTR / transaction reference number.',
      '4. Student sends the payment confirmation screenshot to Acharya Niraj Kumar on WhatsApp (+91 93112 15564).',
      '5. Acharya Niraj Kumar verifies the credit against his bank statement in the Admin Verification Queue and approves the order.',
      '6. The student\'s own account is unlocked instantly. ZERO passwords or temporary credentials are sent over WhatsApp; the student logs in with their own registered email or Google account on viar.in/login.',
    ],
  },
  refundPolicy: {
    satisfactionWindowDays: 7,
    maxModulesAllowed: 3,
    status: 'Operational policy pending formal legal counsel review',
    terms:
      'If within 7 calendar days of verified enrollment and having viewed no more than the first 3 video modules you find the teaching methodology unsuitable, you may request a 100% full tuition refund via WhatsApp (+91 93112 15564) or email (aapkaastro1606@gmail.com). Because payment was direct UPI, refunds are returned 100% in full without gateway deductions within 5-7 business days.',
  },
  flagshipCourse: {
    id: 'course-what-is-astrology',
    slug: 'what-is-astrology',
    titleEn: 'The Ultimate Astrology Course: Foundations to Chart Mastery',
    titleHi: 'द अल्टीमेट एस्ट्रोलॉजी कोर्स: आधार से कुंडली महारत तक',
    priceInr: 5100,
    priceUsd: 69,
    originalPriceInr: 11000,
    originalPriceUsd: 129,
    isOneTimeFee: true,
    hasLifetimeAccess: true,
    deliveryMode: 'SELF_PACED',
    totalModules: 23,
    totalBonusWorkshops: 2,
    totalLessons: 50,
    certificateProvided: true,
    passingPercentage: 70,
    examQuestionCount: 20,
    languageOfInstruction: 'Hindi with clear English astrological terminology & charts',
    formatDescription:
      '100% self-paced high-definition video masterclass. All 23 modules and 2 bonus chart workshops are available on-demand immediately upon enrollment. Watch anytime, pause, rewatch from any device with lifetime access. Not fixed Zoom calls.',
    bonusWorkshops: [
      'Bonus 1: Reading a Real Chart for Career (10th house, Amatyakaraka, D10 Dashamsha analysis)',
      'Bonus 2: Reading a Real Chart for Marriage & Relationships (7th house, Darakaraka, D9 Navamsha analysis)',
    ],
    curriculumSummary: [
      'Module 1: What is Astrology (nature of 9 planets, 12 houses, 12 Rashis & lords)',
      'Module 2: How 9 Grahas Work in Astrology',
      'Module 3: Twelve Houses (Bhavas) and their specific significations',
      'Module 4: Planetary Dignities: Exalted, Debilitated & Mooltrikona states',
      'Module 5: Combustion (Asta) and Retrograde (Vakri) motion of planets',
      'Module 6: Planetary Aspects (Drishti) and Conjunctions (Yutis)',
      'Module 7: The 12 Ascendants (Lagnas) and their functional benefics/malefics',
      'Module 8: Vimshottari Dasha system: Mahadasha, Antardasha calculation and timing',
      'Module 9: Transit (Gochar) of major planets (Saturn, Jupiter, Rahu-Ketu)',
      'Module 10: 27 Nakshatras and their cosmic energies',
      'Module 11: Yogas: Raj Yogas, Dhana Yogas, and Challenging Yogas (Kemadruma, etc.)',
      'Module 12: Divisional Charts: Navamsha (D9) and Dashamsha (D10) basics',
      'Module 13: Kundali Matching (Ashtakoot Guna Milan) & Manglik Dosha analysis',
      'Module 14: Career analysis through the 10th house',
      'Module 15: Financial prosperity and Wealth indicators (2nd & 11th houses)',
      'Module 16: Health and Disease indicators (6th, 8th, 12th houses)',
      'Module 17: Children and Family life (5th house & Saptamsha D7)',
      'Module 18: Spiritual growth and Moksha indicators (9th & 12th houses)',
      'Module 19: Remedial Vedic Astrology: Mantras and Daan',
      'Module 20: Gemstone Therapy (Ratna Vigyan): Anukul vs Pratikul rules',
      'Module 21: Rudraksha Therapy: Mukhi selection based on Lagna',
      'Module 22: Bonus Live Workshop: Real-world Career Chart Analysis',
      'Module 23: Bonus Live Workshop: Real-world Marriage Chart Analysis & Final Exam',
    ],
  } as ViarCourseFact,
  upcomingCourses: [
    { title: 'Vastu Shastra for Your Home', priceInr: 5999, status: 'Coming Soon' },
    { title: 'Gemstone Science 101', priceInr: 3999, status: 'Coming Soon' },
    { title: 'Numerology Basics', priceInr: 3499, status: 'Coming Soon' },
  ],
};

/**
 * System Prompt for LLM calls (OpenAI, Neon AI Gateway, Gemini)
 * Completely grounds the assistant in the site's content with zero tolerance for hallucinations.
 */
export const GROUNDED_VIAR_SYSTEM_PROMPT = `
You are the official AI Academic Assistant for Vihangam Institute of Astrology and Research (VIAR, viar.in).
Your job is to answer visitors' questions accurately, warmly, and concisely about VIAR's courses, tuition fees, curriculum, instructor Acharya Niraj Kumar, and enrollment process.

GROUND RULES (ZERO TOLERANCE FOR HALLUCINATION):
1. ACCURACY OVER COMPLETION: "A confident wrong answer about prices or policies is worse than saying 'I don't know'." If a detail is not in your knowledge base, say you don't have that verified information and provide the WhatsApp link (+91 93112 15564) to ask Acharya Niraj Kumar directly.
2. PRICE IS STRICTLY ₹5,100 INR: The tuition fee for the flagship course is strictly ₹5,100 INR (or $69 USD). There are NO hidden fees, NO monthly subscriptions, and NO discounts beyond this one-time fee.
3. COURSE FORMAT: It is 100% SELF-PACED on-demand video masterclass (23 video modules + 2 bonus practical chart workshops). Students get LIFETIME ACCESS immediately upon enrollment. It is NOT a fixed-time live Zoom batch.
4. PAYMENT & ACCESS: Direct UPI to aapkaastro@okaxis (dynamic QR on /checkout). Students submit 12-digit bank UTR and WhatsApp screenshot. NO passwords are sent over WhatsApp; students log in with their own registered email or Google on viar.in/login.
5. REFUND POLICY: 7-day review window. 100% full refund if requested within 7 days of enrollment AND having viewed no more than the first 3 video modules.
6. CERTIFICATION: Verifiable digital Certificate of Completion awarded after passing the 20-question final quiz with 70%+ score. Verifiable at viar.in/verify.
7. INSTRUCTOR: Acharya Niraj Kumar — certified Jyotish Acharya from Bharatiya Vidya Bhavan, New Delhi (under K.N. Rao), ISO 9001 certified Logical Vastu Expert, 20+ years of practice, former retail corporate VP.
8. PERSONAL CONSULTATIONS: VIAR is strictly an educational academy. If a visitor asks for personal horoscope reading, kundli predictions, or Vastu audits, politely clarify that VIAR is for learning astrology, and invite them to book a personal consultation with Acharya Niraj Kumar directly on WhatsApp (+91 93112 15564) or through Aapka Astro (aapkaastro.com).
9. LANGUAGE MATCHING: Respond in the visitor's language. If asked in Hindi (Devanagari), respond in authentic Devanagari Hindi. If asked in Hinglish (Roman script Hindi like "fees kitni hai"), respond in natural, polite Hinglish. If asked in English, respond in clear English.
10. TONE: Respectful, scholarly, welcoming, and truthful (like a dedicated Vedic academy advisor). Use "Namaste" or "नमस्ते" where appropriate.
11. CALLS TO ACTION: Always suggest relevant links or actions:
    - WhatsApp Acharya ji: https://wa.me/919311215564
    - Call: +91 93112 15564
    - Course Enrollment: /checkout?course=what-is-astrology
    - Curriculum: /courses/what-is-astrology
`.trim();
