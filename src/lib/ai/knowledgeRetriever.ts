import { prisma } from '../prisma.ts';
import { ACADEMIC_SERVICES_KNOWLEDGE } from './knowledge/services.ts';
import { ABOUT_INSTITUTE_KNOWLEDGE } from './knowledge/about.ts';
import { BUILTIN_CONTENT_DEFAULTS } from '../content/defaultContent.ts';

export interface LiveAcademyData {
  courseTitle: string;
  priceInr: number;
  priceUsd: number;
  upiVpa: string;
  payeeName: string;
  activeCohorts: Array<{ batchName: string; startDate: string; capacity?: number }>;
  customKnowledgeEntries: Array<{ id: string; question: string; answer: string; language: string; category: string }>;
}

// ------------------------------------------------------------------------------
// In-Memory Cache for Published KnowledgeEntry Rows with 60s TTL
// Guarantees Owner updates appear within about a minute without constant DB hits.
// ------------------------------------------------------------------------------
interface KnowledgeCache {
  entries: Array<{ id: string; question: string; answer: string; language: string; category: string }>;
  timestamp: number;
}

let knowledgeCache: KnowledgeCache | null = null;
const KNOWLEDGE_CACHE_TTL_MS = 60 * 1000; // 60 seconds ("appear within about a minute")

export function invalidateKnowledgeCache(): void {
  knowledgeCache = null;
}

export function setCachedKnowledgeEntries(
  entries: Array<{ id: string; question: string; answer: string; language: string; category: string }>
): void {
  knowledgeCache = {
    entries,
    timestamp: Date.now(),
  };
}

export async function getPublishedKnowledgeEntries(): Promise<
  Array<{ id: string; question: string; answer: string; language: string; category: string }>
> {
  const now = Date.now();
  if (knowledgeCache && now - knowledgeCache.timestamp < KNOWLEDGE_CACHE_TTL_MS) {
    return knowledgeCache.entries;
  }

  try {
    const publishedRows = await prisma.knowledgeEntry.findMany({
      where: { published: true },
      select: {
        id: true,
        question: true,
        answer: true,
        language: true,
        category: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    const entries = publishedRows || [];
    knowledgeCache = {
      entries,
      timestamp: now,
    };
    return entries;
  } catch (err) {
    console.warn('[KnowledgeRetriever] Failed to query published KnowledgeEntry rows:', err);
    const fallbackEntries = knowledgeCache?.entries || [];
    knowledgeCache = {
      entries: fallbackEntries,
      timestamp: now,
    };
    return fallbackEntries;
  }
}

/**
 * 1. LIVE DATA FETCH AT REQUEST TIME
 * Reads prices, payment settings, cohorts, and Owner-managed knowledge entries
 * directly from the database at request time.
 * Enforces: One source of truth; never retype prices into prompts.
 */
export async function getLiveAcademyData(): Promise<LiveAcademyData> {
  try {
    // 1. Fetch Flagship Course for live pricing
    let course: { title?: string; priceInr?: number; priceUsd?: number } | null = null;
    try {
      course = await prisma.course.findFirst({
        where: {
          OR: [{ slug: 'what-is-astrology' }, { status: 'PUBLISHED' }],
        },
        select: {
          title: true,
          priceInr: true,
          priceUsd: true,
        },
      });
    } catch {}

    // 2. Fetch Payment Settings
    let paymentSettings: { upiId?: string; payeeName?: string } | null = null;
    try {
      paymentSettings = await prisma.paymentSettings.findFirst({
        select: {
          upiId: true,
          payeeName: true,
        },
      });
    } catch {}

    // 3. Fetch Active / Upcoming Cohorts
    let cohorts: Array<{ batchName: string; startDate: Date | string | null; capacity?: number | null }> = [];
    try {
      cohorts = await prisma.cohort.findMany({
        where: { status: 'UPCOMING' },
        select: {
          batchName: true,
          startDate: true,
          capacity: true,
        },
        take: 2,
      });
    } catch {}

    // 4. Fetch Published Owner KnowledgeEntry Rows (Authoritative Knowledge Base)
    // Always prioritizes published KnowledgeEntry rows and caches for 60s (appear within about a minute)
    // Unpublished entries (published: false) are strictly excluded
    let customEntries: Array<{ id: string; question: string; answer: string; language: string; category: string }> = [];
    try {
      const publishedEntries = await getPublishedKnowledgeEntries();
      if (publishedEntries && publishedEntries.length > 0) {
        customEntries = [...publishedEntries];
      }
    } catch {}

    // Supplementary ContentItem FAQs if available and not conflicting
    try {
      const contentFaqs = await prisma.contentItem.findMany({
        where: { collection: 'faqs', status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
      });
      if (contentFaqs && contentFaqs.length > 0) {
        const extraFaqs = contentFaqs.flatMap((item) => {
          const cat = ((item.metadata as Record<string, unknown>)?.category as string) || 'General';
          const arr: Array<{ id: string; question: string; answer: string; language: string; category: string }> = [];
          if (item.titleEn && item.contentEn) {
            arr.push({
              id: `${item.id || item.key}-en`,
              question: item.titleEn,
              answer: item.contentEn,
              language: 'en',
              category: cat,
            });
          }
          if (item.titleHi && item.contentHi) {
            arr.push({
              id: `${item.id || item.key}-hi`,
              question: item.titleHi,
              answer: item.contentHi,
              language: 'hi',
              category: cat,
            });
          }
          return arr;
        });

        for (const extra of extraFaqs) {
          if (!customEntries.some((e) => e.question.toLowerCase() === extra.question.toLowerCase())) {
            customEntries.push(extra);
          }
        }
      }
    } catch {}

    // Deterministic fallback to built-in FAQs if tables are empty
    if (customEntries.length === 0) {
      customEntries = (BUILTIN_CONTENT_DEFAULTS.faqs || []).flatMap((f) => [
        {
          id: `${f.key}-en`,
          question: f.titleEn,
          answer: f.contentEn,
          language: 'en',
          category: ((f.metadata as Record<string, unknown>)?.category as string) || 'General',
        },
        {
          id: `${f.key}-hi`,
          question: f.titleHi,
          answer: f.contentHi,
          language: 'hi',
          category: ((f.metadata as Record<string, unknown>)?.category as string) || 'General',
        },
      ]);
    }

    return {
      courseTitle: course?.title || 'Vedic Astrology Masterclass: What is Astrology',
      priceInr: course?.priceInr || 5100,
      priceUsd: course?.priceUsd || 69,
      upiVpa: paymentSettings?.upiId || 'aapkaastro@okaxis',
      payeeName: paymentSettings?.payeeName || 'Vihangam Institute of Astrology and Research',
      activeCohorts: cohorts.map((c) => ({
        batchName: c.batchName,
        startDate: c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : 'Ongoing Admissions',
        capacity: c.capacity,
      })),
      customKnowledgeEntries: customEntries,
    };
  } catch (error) {
    console.warn('[KnowledgeRetriever] Database read fallback applied:', error);
    const fallbackFaqs = (BUILTIN_CONTENT_DEFAULTS.faqs || []).flatMap((f) => [
      {
        id: `${f.key}-en`,
        question: f.titleEn,
        answer: f.contentEn,
        language: 'en',
        category: ((f.metadata as Record<string, unknown>)?.category as string) || 'General',
      },
      {
        id: `${f.key}-hi`,
        question: f.titleHi,
        answer: f.contentHi,
        language: 'hi',
        category: ((f.metadata as Record<string, unknown>)?.category as string) || 'General',
      },
    ]);

    const cachedOrFallback =
      knowledgeCache && knowledgeCache.entries.length > 0 ? knowledgeCache.entries : fallbackFaqs;

    return {
      courseTitle: 'Vedic Astrology Masterclass: What is Astrology',
      priceInr: 5100,
      priceUsd: 69,
      upiVpa: 'aapkaastro@okaxis',
      payeeName: 'Vihangam Institute of Astrology and Research',
      activeCohorts: [{ batchName: 'Cohort Admissions Active', startDate: 'Self-Paced Instant Access', capacity: 50 }],
      customKnowledgeEntries: cachedOrFallback,
    };
  }
}

/**
 * 2. SELECTIVE RETRIEVAL OVER STRUCTURED CONTENT & OWNER ENTRIES
 * Keeps context small (< 500 words) by selecting only sections relevant to the visitor's query.
 */
export function retrieveRelevantKnowledgeContext(
  query: string,
  liveData: LiveAcademyData
): { contextText: string; matchedCustomEntries: string[]; hasSpecificMatch: boolean } {
  const q = query.toLowerCase();
  const contextParts: string[] = [];
  const matchedCustomEntries: string[] = [];
  let hasSpecificMatch = false;

  // Always include Live Core Data (Prices, Payments, Contacts)
  contextParts.push(`=== LIVE ACADEMY DATA (SOURCE OF TRUTH) ===
Course: ${liveData.courseTitle}
Tuition (India / UPI): ₹${liveData.priceInr.toLocaleString('en-IN')} INR (One-Time Full Fee)
Tuition (International): $${liveData.priceUsd} USD
UPI ID: ${liveData.upiVpa} (${liveData.payeeName})
Admissions: ${liveData.activeCohorts.map((c) => `${c.batchName} (${c.startDate})`).join(', ')}
Official Contacts: WhatsApp: ${ABOUT_INSTITUTE_KNOWLEDGE.contacts.whatsapp} | Phone: ${ABOUT_INSTITUTE_KNOWLEDGE.contacts.phone} | Email: ${ABOUT_INSTITUTE_KNOWLEDGE.contacts.email}
Checkout Link: https://viar.in/checkout?course=what-is-astrology`);

  // Intent: Pricing, Discounts, Refunds
  if (
    q.includes('fee') ||
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('rupee') ||
    q.includes('रुपय') ||
    q.includes('शुल्क') ||
    q.includes('discount') ||
    q.includes('coupon') ||
    q.includes('refund') ||
    q.includes('वापस') ||
    q.includes('kitni') ||
    q.includes('kitna')
  ) {
    hasSpecificMatch = true;
    contextParts.push(`=== PRICING & REFUND POLICIES ===
- Strict One-Time Fee: ₹${liveData.priceInr.toLocaleString('en-IN')} INR ($${liveData.priceUsd} USD). Zero hidden fees.
- Discounts: No discounts or promo codes exist. The price is fixed uniformly for all students.
- Refund Guarantee: 100% full refund within 7 calendar days of enrollment if student has watched 3 or fewer modules. Beyond 7 days or >3 modules viewed, fee is non-refundable. Refund processed directly via UPI.`);
  }

  // Intent: Curriculum, Syllabus, Topics, Lessons
  if (
    q.includes('syllabus') ||
    q.includes('curriculum') ||
    q.includes('module') ||
    q.includes('topic') ||
    q.includes('lesson') ||
    q.includes('content') ||
    q.includes('kya sikh') ||
    q.includes('क्या सीख') ||
    q.includes('पाठ्यक्रम') ||
    q.includes('विषय')
  ) {
    hasSpecificMatch = true;
    contextParts.push(`=== CURRICULUM & MODULES ===
Format: ${ACADEMIC_SERVICES_KNOWLEDGE.format}
Total: ${ACADEMIC_SERVICES_KNOWLEDGE.modulesCount} Modules (${ACADEMIC_SERVICES_KNOWLEDGE.totalDurationHours}+ hours HD video, 50 lessons).
Highlights:
${ACADEMIC_SERVICES_KNOWLEDGE.topics.slice(0, 7).join('\n')}`);
  }

  // Intent: Instructor, Acharya Niraj Kumar, Credentials, Background
  if (
    q.includes('acharya') ||
    q.includes('niraj') ||
    q.includes('teacher') ||
    q.includes('instructor') ||
    q.includes('who teach') ||
    q.includes('kaun padh') ||
    q.includes('कौन') ||
    q.includes('आचार्य') ||
    q.includes('qualification') ||
    q.includes('credential') ||
    q.includes('award')
  ) {
    hasSpecificMatch = true;
    contextParts.push(`=== INSTRUCTOR PEDIGREE ===
Instructor: ${ABOUT_INSTITUTE_KNOWLEDGE.founder.name}
Credentials:
- ${ABOUT_INSTITUTE_KNOWLEDGE.founder.pedigree[0]}
- ${ABOUT_INSTITUTE_KNOWLEDGE.founder.pedigree[1]}
- ${ABOUT_INSTITUTE_KNOWLEDGE.founder.pedigree[2]}
- Honors: ${ABOUT_INSTITUTE_KNOWLEDGE.founder.stateHonorsAndAwards[0]}
- Practice: 20+ years, 26,000+ horoscopes analyzed.
- Note: VIAR is the academy for learning; personal readings are booked separately via Aapka Astro.`);
  }

  // Intent: Certificate & Verification
  if (
    q.includes('certificate') ||
    q.includes('प्रमाण') ||
    q.includes('degree') ||
    q.includes('diploma') ||
    q.includes('quiz') ||
    q.includes('exam')
  ) {
    hasSpecificMatch = true;
    contextParts.push(`=== CERTIFICATION POLICY ===
Eligibility: Watch all 23 modules and pass final 10-question quiz (>= 70% passing mark).
Certificate: Verifiable digital certificate with unique registry code (format: VIAR-2026-WIA-XXXX). Publicly verifiable on https://viar.in/verify.`);
  }

  // Intent: Payment Process, UPI, Verification
  if (
    q.includes('upi') ||
    q.includes('pay') ||
    q.includes('gpay') ||
    q.includes('phonepe') ||
    q.includes('qr') ||
    q.includes('account') ||
    q.includes('kaise jud') ||
    q.includes('प्रवेश कैसे') ||
    q.includes('payment')
  ) {
    hasSpecificMatch = true;
    contextParts.push(`=== PAYMENT PROCESS ===
- Direct UPI to ${liveData.upiVpa} (0% gateway fees).
- Steps: Scan QR at /checkout, pay ₹${liveData.priceInr.toLocaleString('en-IN')}, submit 12-digit UTR on page, WhatsApp screenshot to ${ABOUT_INSTITUTE_KNOWLEDGE.contacts.whatsapp}.
- Activation: Owner reviews bank credit and activates account in minutes.
- Security: NEVER send passwords over WhatsApp. The course is activated on the student's registered account.`);
  }

  // Match Owner-Editable Custom Knowledge Entries (Overrides static content)
  if (liveData.customKnowledgeEntries.length > 0) {
    const relevantCustom = liveData.customKnowledgeEntries.filter((entry) => {
      const qWords = q.split(/\s+/).filter((w) => w.length > 3);
      const entryText = `${entry.question} ${entry.answer}`.toLowerCase();
      return qWords.some((w) => entryText.includes(w));
    });

    if (relevantCustom.length > 0) {
      hasSpecificMatch = true;
      // Authoritative overrides placed at top of context
      contextParts.unshift(`=== OWNER CUSTOM KNOWLEDGE BASE ===
${relevantCustom
  .slice(0, 5)
  .map((e) => `[Language: ${e.language}]\nQ: ${e.question}\nA: ${e.answer}`)
  .join('\n\n')}`);
      relevantCustom.forEach((e) => matchedCustomEntries.push(e.id));
    }
  }

  // Always include standard FAQ summary if context is light
  if (contextParts.length <= 2) {
    contextParts.push(`=== GENERAL FAQ ===
- Access: 100% self-paced on-demand with lifetime access.
- Prerequisites: None (starts from ground zero).
- Personal Consultations: Not included in course fee; book 1-on-1 reading with Acharya Niraj Kumar via Aapka Astro.`);
  }

  return {
    contextText: contextParts.join('\n\n'),
    matchedCustomEntries,
    hasSpecificMatch,
  };
}

/**
 * 3. PRIVACY MASKING FOR LOGGING
 * Replaces phone numbers, email addresses, UTR account numbers, and payment references before logging.
 * Truncates text to max 150 characters.
 */
export function maskSensitiveData(rawText: string): string {
  if (!rawText) return '';

  let sanitized = rawText;

  // 1. Mask 12-16 digit bank / UTR account strings first (preserving [ACCOUNT_MASKED])
  sanitized = sanitized.replace(/\b\d{12,16}\b/g, '[ACCOUNT_MASKED]');

  // 2. Mask payment references (Razorpay IDs, Order references, UPI transaction IDs)
  sanitized = sanitized.replace(/\bpay_[a-zA-Z0-9]{8,24}\b/gi, '[PAYMENT_REF_MASKED]');
  sanitized = sanitized.replace(/\b(?:ORD|VIAR|order)[-_][a-zA-Z0-9]{4,32}\b/gi, '[PAYMENT_REF_MASKED]');
  sanitized = sanitized.replace(/\b(?:upi|utr|txn|ref)[:\s#_-]*[a-zA-Z0-9]{8,24}\b/gi, '[PAYMENT_REF_MASKED]');

  // 3. Mask email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    '[EMAIL_MASKED]'
  );

  // 4. Mask phone numbers (10 digits starting with 6-9, with or without spaces, or +91...)
  sanitized = sanitized.replace(
    /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|(?:\+91[\s-]?)?[6-9]\d{9}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
    '[PHONE_MASKED]'
  );

  return sanitized.slice(0, 150).trim();
}

/**
 * 4. LOG UNANSWERED OR LOW-CONFIDENCE QUESTIONS
 * Stores masked, truncated question in UnansweredQuestion table for Owner review.
 * Aggregates frequency count if identical question was asked in the last 30 days.
 * Automatically keeps questions for 30 days by pruning older entries.
 */
export async function logUnansweredQuestion(
  rawQuestion: string,
  language: string = 'en'
): Promise<void> {
  try {
    const masked = maskSensitiveData(rawQuestion);
    if (!masked || masked.length < 3) return;

    // Normalize for frequency clustering
    const normalized = masked
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Auto-prune entries older than 30 days to strictly enforce "keep it 30 days"
    await prisma.unansweredQuestion.deleteMany({
      where: {
        lastAskedAt: { lt: thirtyDaysAgo },
      },
    }).catch(() => {});

    // Look for existing recent entry within 30 days
    const existing = await prisma.unansweredQuestion.findFirst({
      where: {
        normalizedQuestion: normalized,
        lastAskedAt: { gte: thirtyDaysAgo },
        status: 'PENDING',
      },
    });

    if (existing) {
      await prisma.unansweredQuestion.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          lastAskedAt: new Date(),
        },
      });
    } else {
      await prisma.unansweredQuestion.create({
        data: {
          question: masked,
          normalizedQuestion: normalized,
          count: 1,
          language,
          status: 'PENDING',
        },
      });
    }
  } catch (err) {
    console.warn('[KnowledgeRetriever] Failed to log unanswered question:', err);
  }
}
