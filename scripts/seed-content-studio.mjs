import { PrismaClient } from '@prisma/client';
import { assertStagingEnvironment } from './guard-staging.mjs';

assertStagingEnvironment({
  scriptName: 'seed-content-studio.mjs',
});

const prisma = new PrismaClient();

const BUILTIN_CONTENT_ITEMS = [
  // 1. Site Settings & Contact
  {
    collection: 'site_settings',
    key: 'site_branding',
    titleEn: 'Viar.in - Vihangam Institute of Astrology and Research',
    titleHi: 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR)',
    contentEn: 'Premier Vedic astrology academy offering structured certification courses, cohort-based mentorship, and direct lineage wisdom.',
    contentHi: 'वैदिक ज्योतिष की प्रमुख अकादमिक संस्था जहाँ प्रामाणिक सूत्रों, प्रमाणन पाठ्यक्रमों और गुरु-शिष्य परंपरा का संगम है।',
    metadata: {
      siteUrl: 'https://viar.in',
      tagline: 'Vihangam Institute of Astrology and Research',
      foundedYear: '2010',
      parentBrand: 'Aapka Astro',
      parentBrandUrl: 'https://aapkaastro.com',
    },
    status: 'PUBLISHED',
    sortOrder: 1,
  },
  {
    collection: 'site_settings',
    key: 'contact_information',
    titleEn: 'Institute Contact Information & Communication Channels',
    titleHi: 'संस्थान संपर्क विवरण एवं आधिकारिक माध्यम',
    contentEn: 'For admissions, cohort enrollment assistance, and institutional inquiries, connect with our support team.',
    contentHi: 'प्रवेश, बैच नामांकन सहायता एवं संस्थान संबंधी पूछताछ हेतु हमारी सहायता टीम से संपर्क करें।',
    metadata: {
      phone: '+91 93112 15564',
      email: '', // Separate public email awaiting client confirmation. Never use Owner login address.
      emailNeedsConfirmation: true,
      whatsapp: '919311215564',
      whatsappLink: 'https://wa.me/919311215564',
      addressEn: 'Vihangam Institute of Astrology and Research, New Delhi / NCR, India',
      addressHi: 'विहंगम ज्योतिष एवं अनुसंधान संस्थान, नई दिल्ली / एनसीआर, भारत',
      hoursEn: 'Monday - Saturday, 10:00 AM - 7:00 PM IST',
      hoursHi: 'सोमवार - शनिवार, प्रातः 10:00 से सायं 7:00 बजे तक (भारतीय समयानुसार)',
    },
    status: 'PUBLISHED',
    sortOrder: 2,
  },

  // 2. Homepage Hero
  {
    collection: 'hero',
    key: 'homepage_main_hero',
    titleEn: 'Master Authentic Vedic Astrology with Live Mentorship',
    titleHi: 'गुरु-शिष्य परंपरा से सीखें प्रामाणिक वैदिक ज्योतिष',
    contentEn: 'Join India\'s leading cohort-based Jyotish academy. Decode Janam Kundali, Dasha timing, and predictive principles through 23 structured modules guided directly by Acharya Niraj Kumar.',
    contentHi: 'भारत की प्रतिष्ठित बैच-आधारित ज्योतिष अकादमी से जुड़ें। 23 संरचित पाठों के माध्यम से जन्म कुंडली, दशा गोचर और सटीक फलकथन की विद्या सीधे आचार्य नीरज कुमार से सीखें।',
    metadata: {
      badgeEn: '🎓 Cohort 2026 Enrolling Now',
      badgeHi: '🎓 वर्ष 2026 बैच के प्रवेश प्रारंभ',
      primaryCtaTextEn: 'Explore Flagship Cohort',
      primaryCtaTextHi: 'मुख्य बैच देखें',
      primaryCtaLink: '/courses/what-is-astrology',
      secondaryCtaTextEn: 'View All Courses',
      secondaryCtaTextHi: 'सभी पाठ्यक्रम देखें',
      secondaryCtaLink: '/courses',
    },
    status: 'PUBLISHED',
    sortOrder: 1,
  },

  // 3. FAQs (8 Standard Questions)
  {
    collection: 'faqs',
    key: 'faq_beginners_welcome',
    titleEn: 'Can beginners with zero astrology background enroll?',
    titleHi: 'क्या बिना किसी पूर्व अनुभव वाले नए विद्यार्थी भी सीख सकते हैं?',
    contentEn: 'Yes, absolutely. The curriculum begins from first principles: the 12 Bhavas (houses), 12 Rashis (zodiac signs), and 9 Grahas (planets). You need no prior knowledge of Sanskrit or astronomy—everything is taught step-by-step with real chart examples.',
    contentHi: 'हाँ, बिल्कुल। यह पाठ्यक्रम बुनियादी सिद्धांतों से शुरू होता है: 12 भाव, 12 राशियां और 9 ग्रह। संस्कृत या खगोल विज्ञान के पूर्व ज्ञान की कोई आवश्यकता नहीं है—सब कुछ व्यावहारिक कुंडलियों के साथ सिखाया जाता है।',
    metadata: { category: 'Admissions' },
    status: 'PUBLISHED',
    sortOrder: 1,
  },
  {
    collection: 'faqs',
    key: 'faq_class_timing_recordings',
    titleEn: 'What if I miss a live session? Are recordings provided?',
    titleHi: 'यदि मेरी कोई लाइव क्लास छूट जाए तो क्या रिकॉर्डिंग मिलेगी?',
    contentEn: 'Every live Zoom session is recorded in HD and uploaded to your student portal within 24 hours along with class notes, slides, and reference charts. You retain lifetime access to all lecture recordings.',
    contentHi: 'प्रत्येक लाइव क्लास की एचडी रिकॉर्डिंग 24 घंटे के भीतर आपके छात्र पोर्टल में उपलब्ध करा दी जाती है। आपको सभी व्याख्यानों का आजीवन एक्सेस मिलता है।',
    metadata: { category: 'Classes' },
    status: 'PUBLISHED',
    sortOrder: 2,
  },
  {
    collection: 'faqs',
    key: 'faq_certification_validity',
    titleEn: 'How does the certificate examination and verification work?',
    titleHi: 'प्रमाणपत्र परीक्षा और सत्यापन कैसे कार्य करता है?',
    contentEn: 'Upon completing all 23 modules and attending live practice sessions, students take a 20-question randomized final exam. Scoring 70%+ awards the official VIAR Institute Certificate with a tamper-proof verification ID verifiable at viar.in/verify.',
    contentHi: 'सभी 23 पाठ पूरे करने के बाद 20 प्रश्नों की अंतिम परीक्षा होती है। 70% या अधिक अंक प्राप्त करने पर आधिकारिक डिजिटल प्रमाणपत्र जारी किया जाता है जिसे viar.in/verify पर सत्यापित किया जा सकता है।',
    metadata: { category: 'Certification' },
    status: 'PUBLISHED',
    sortOrder: 3,
  },
  {
    collection: 'faqs',
    key: 'faq_payment_upi',
    titleEn: 'How does payment work? Can I pay via UPI QR?',
    titleHi: 'भुगतान कैसे होता है? क्या मैं UPI QR से भुगतान कर सकता हूँ?',
    contentEn: 'Yes! We support direct UPI payment (Google Pay, PhonePe, Paytm, BHIM) with zero convenience fees. Simply scan the dynamic QR code on checkout, submit your 12-digit UTR, and our team approves your enrollment promptly.',
    contentHi: 'हाँ! हम सीधे UPI (Google Pay, PhonePe, Paytm) भुगतान स्वीकार करते हैं। चेकआउट पर क्यूआर कोड स्कैन करें, अपना 12 अंकों का यूटीआर नंबर दर्ज करें और तत्काल पुष्टि प्राप्त करें।',
    metadata: { category: 'Payments' },
    status: 'PUBLISHED',
    sortOrder: 4,
  },

  // 4. About Instructor
  {
    collection: 'about',
    key: 'instructor_profile',
    titleEn: 'Acharya Niraj Kumar - Master Astrologer & Founder',
    titleHi: 'आचार्य नीरज कुमार - मुख्य ज्योतिषी एवं संस्थापक',
    contentEn: 'With over 15 years of dedicated practice in Vedic Jyotish, Vastu Shastra, and Parashari principles, Acharya Niraj Kumar has guided thousands of seekers and trained hundreds of practicing astrologers worldwide.',
    contentHi: 'वैदिक ज्योतिष, वास्तु शास्त्र एवं पाराशरी सिद्धांतों में 15 से अधिक वर्षों के अनुभव के साथ आचार्य नीरज कुमार ने देश-विदेश के हजारों जातकों का मार्गदर्शन और सैकड़ों ज्योतिषियों को प्रशिक्षित किया है।',
    metadata: {
      experienceYears: 15,
      avatarUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
      aapkaAstroUrl: 'https://aapkaastro.com',
      credentials: [
        'Jyotish Acharya Credential',
        'Vastu Shastra Gold Medalist',
        'Founder of Aapka Astro consultation practice',
      ],
    },
    status: 'PUBLISHED',
    sortOrder: 1,
  },
];

async function seedContentStudio() {
  console.log('🌱 [Content Studio] Seeding initial typed collections into database...');
  let seededCount = 0;

  for (const item of BUILTIN_CONTENT_ITEMS) {
    await prisma.contentItem.upsert({
      where: {
        collection_key: {
          collection: item.collection,
          key: item.key,
        },
      },
      create: {
        collection: item.collection,
        key: item.key,
        titleEn: item.titleEn,
        titleHi: item.titleHi,
        contentEn: item.contentEn,
        contentHi: item.contentHi,
        metadata: item.metadata,
        status: item.status,
        sortOrder: item.sortOrder,
        createdById: 'seed-system',
        updatedById: 'seed-system',
      },
      update: {
        titleEn: item.titleEn,
        titleHi: item.titleHi,
        contentEn: item.contentEn,
        contentHi: item.contentHi,
        metadata: item.metadata,
        status: item.status,
        sortOrder: item.sortOrder,
      },
    });
    seededCount++;
  }

  console.log(`✅ [Content Studio] Successfully seeded ${seededCount} content items into database.`);
}

seedContentStudio()
  .catch((err) => {
    console.error('❌ [Content Studio Seed Error]:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
