/**
 * VIAR Built-in Content Defaults
 * 
 * CORE ARCHITECTURAL RULE:
 * Public pages read published content from the database and fall back to these
 * built-in defaults when an entry is missing or the database is unreachable.
 * A public page must NEVER come up blank or crash because database content is missing.
 */

export interface BuiltinContentItem {
  collection: string;
  key: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  metadata?: Record<string, unknown>;
  sortOrder: number;
}

export const BUILTIN_CONTENT_DEFAULTS: Record<string, BuiltinContentItem[]> = {
  // 1. SITE SETTINGS & CONTACT DETAILS
  site_settings: [
    {
      collection: 'site_settings',
      key: 'contact_phone',
      titleEn: 'Official Admissions & Inquiry Phone',
      titleHi: 'आधिकारिक प्रवेश एवं परामर्श फोन',
      contentEn: '+91 93112 15564',
      contentHi: '+91 93112 15564',
      metadata: { tel: '+919311215564', icon: 'Phone', type: 'phone' },
      sortOrder: 1,
    },
    {
      collection: 'site_settings',
      key: 'contact_whatsapp',
      titleEn: 'Official WhatsApp Helpdesk',
      titleHi: 'आधिकारिक व्हाट्सएप सहायता केंद्र',
      contentEn: '+91 93112 15564',
      contentHi: '+91 93112 15564',
      metadata: {
        number: '919311215564',
        url: 'https://wa.me/919311215564?text=Namaste%20Acharya%20ji%2C%20I%20have%20an%20inquiry%20regarding%20the%20VIAR%20Astrology%20Course.',
        icon: 'MessageCircle',
        type: 'whatsapp',
      },
      sortOrder: 2,
    },
    {
      collection: 'site_settings',
      key: 'contact_email',
      titleEn: 'Official Academy Email',
      titleHi: 'आधिकारिक संस्थान ईमेल',
      contentEn: 'aapkaastro1606@gmail.com',
      contentHi: 'aapkaastro1606@gmail.com',
      metadata: { mailto: 'mailto:aapkaastro1606@gmail.com', icon: 'Mail', type: 'email' },
      sortOrder: 3,
    },
    {
      collection: 'site_settings',
      key: 'campus_location',
      titleEn: 'Academy Campus Location',
      titleHi: 'संस्थान का पता एवं स्थान',
      contentEn: 'New Delhi, India',
      contentHi: 'नई दिल्ली, भारत',
      metadata: { icon: 'MapPin', type: 'address' },
      sortOrder: 4,
    },
    {
      collection: 'site_settings',
      key: 'social_youtube',
      titleEn: 'Aapka Astro YouTube Channel',
      titleHi: 'आपका एस्ट्रो यूट्यूब चैनल',
      contentEn: 'https://youtube.com/@aapkaastro',
      contentHi: 'https://youtube.com/@aapkaastro',
      metadata: { url: 'https://youtube.com/@aapkaastro', icon: 'Youtube', subscribers: '26,000+' },
      sortOrder: 5,
    },
    {
      collection: 'site_settings',
      key: 'social_instagram',
      titleEn: 'Official Instagram Handle',
      titleHi: 'आधिकारिक इंस्टाग्राम हैंडल',
      contentEn: 'https://instagram.com/aapkaastro',
      contentHi: 'https://instagram.com/aapkaastro',
      metadata: { url: 'https://instagram.com/aapkaastro', icon: 'Instagram' },
      sortOrder: 6,
    },
  ],

  // 2. HERO SECTION & PROMOTIONAL BANNERS
  hero: [
    {
      collection: 'hero',
      key: 'hero_main',
      titleEn: 'Learn Vedic Astrology From Sacred Principles to Real Chart Mastery',
      titleHi: 'वैदिक ज्योतिष सीखें: पवित्र सिद्धांतों से व्यावहारिक कुंडली महारत तक',
      contentEn:
        'A comprehensive self-paced video education platform run by Acharya Niraj Kumar (Jyotish Acharya, Bharatiya Vidya Bhavan New Delhi; founder of Aapka Astro). Blending 20+ years of traditional learning from Baidyanath Dham with 20+ years of senior executive leadership, trusted by students across India and abroad.',
      contentHi:
        'आचार्य नीरज कुमार जी (ज्योतिष आचार्य, भारतीय विद्या भवन नई दिल्ली; संस्थापक: आपका एस्ट्रो) द्वारा संचालित 23-मॉड्यूल का व्यापक शैक्षणिक मंच। बैद्यनाथ धाम की पवित्र गुरु-परंपरा और 20+ वर्षों के वरिष्ठ कॉर्पोरेट नेतृत्व का अद्वितीय समन्वय।',
      metadata: {
        badgeEn: 'VIHANGAM INSTITUTE OF ASTROLOGY AND RESEARCH • BY AAPKA ASTRO',
        badgeHi: 'विहंगम ज्योतिष एवं अनुसंधान संस्थान • BY AAPKA ASTRO',
        ctaPrimaryTextEn: 'Start Learning Today',
        ctaPrimaryTextHi: 'आज ही सीखना शुरू करें',
        ctaPrimaryUrl: '/courses/what-is-astrology',
        ctaSecondaryTextEn: 'Browse Course Catalog',
        ctaSecondaryTextHi: 'पाठ्यक्रम सूची देखें',
        ctaSecondaryUrl: '/courses',
        statExperience: '20+ Years',
        statModules: '23 Modules',
        statCommunity: '26,000+ Followers',
      },
      sortOrder: 1,
    },
    {
      collection: 'hero',
      key: 'announcement_bar',
      titleEn: 'Self-Paced Masterclass Open',
      titleHi: 'सेल्फ-पेस्ड मास्टरक्लास खुला है',
      contentEn:
        'The Ultimate Astrology Course (23 Video Modules + 2 Bonus Workshops). Instant Lifetime Access! Enroll Today →',
      contentHi:
        'सम्पूर्ण वैदिक ज्योतिष कोर्स (23 वीडियो मॉड्यूल + 2 बोनस कार्यशालाएं)। आजीवन पहुंच! आज ही प्रवेश लें →',
      metadata: {
        url: '/courses/what-is-astrology',
        active: true,
      },
      sortOrder: 2,
    },
  ],

  // 3. FREQUENTLY ASKED QUESTIONS (FAQs)
  faqs: [
    {
      collection: 'faqs',
      key: 'faq_tuition_fee',
      titleEn: 'What is the course fee, and are there any recurring charges?',
      titleHi: 'कोर्स की फीस कितनी है और क्या कोई अन्य मासिक खर्च है?',
      contentEn:
        'The tuition fee for our flagship 23-module masterclass is strictly a one-time fee of ₹5,100 INR (or $69 USD for international students). There are no monthly subscriptions, hidden exam fees, or renewal charges. You receive instant lifetime access to all 23 video modules, downloadable lesson notes, 2 practical case-study workshops, and the final certification exam.',
      contentHi:
        'हमारे 23-मॉड्यूल के फ्लैगशिप मास्टरक्लास का शिक्षण शुल्क बिल्कुल निश्चित रूप से मात्र ₹5,100 (एकमुश्त) है (अथवा अंतरराष्ट्रीय छात्रों के लिए $69 USD)। इसमें कोई मासिक शुल्क, परीक्षा शुल्क अथवा छिपा हुआ खर्च नहीं है। आपको सभी 23 वीडियो पाठों, नोट्स, 2 व्यावहारिक वर्कशॉप और सर्टिफिकेट का आजीवन एक्सेस मिलता है।',
      metadata: { category: 'pricing' },
      sortOrder: 1,
    },
    {
      collection: 'faqs',
      key: 'faq_modules_structure',
      titleEn: 'What is taught in the 23 modules and bonus workshops?',
      titleHi: '23 वीडियो मॉड्यूल और बोनस वर्कशॉप में क्या-क्या सिखाया जाएगा?',
      contentEn:
        'The course covers complete Vedic astrology from first principles: astronomy of the zodiac, the 9 Grahas (planets), 12 Rashis (zodiac signs), 12 Bhavas (houses), planetary aspects (Drishti), combustion, retrograde states, Vimshottari Dasha timing, and practical chart synthesis. You also get 2 bonus workshops breaking down real-life marriage and career horoscopes.',
      contentHi:
        'पाठ्यक्रम में वैदिक ज्योतिष के मूल आधार से लेकर उन्नत फलित ज्योतिष तक सब कुछ शामिल है: खगोलीय परिचय, 9 ग्रह, 12 राशियां, 12 भाव, ग्रहों की दृष्टियां, अस्त व वक्री ग्रह, विंशोत्तरी दशा समय-गणना, और व्यावहारिक कुंडली विश्लेषण। साथ ही करियर एवं विवाह पर 2 व्यावहारिक केस-स्टडी वर्कशॉप उपलब्ध हैं।',
      metadata: { category: 'curriculum' },
      sortOrder: 2,
    },
    {
      collection: 'faqs',
      key: 'faq_class_format',
      titleEn: 'Is the course conducted live on Zoom or is it self-paced?',
      titleHi: 'क्या यह लाइव क्लास है या रिकॉर्डेड वीडियो पाठ्यक्रम?',
      contentEn:
        'The masterclass is 100% self-paced on-demand video learning. You can watch the high-definition lectures anytime, anywhere, on any device (phone, laptop, tablet), replay challenging concepts as many times as you want, and study at your own convenience with lifetime access.',
      contentHi:
        'यह मास्टरक्लास 100% अपनी गति से सीखने की सुविधा (Self-Paced) प्रदान करता है। आप कभी भी, किसी भी डिवाइस (मोबाइल, लैपटॉप या टैबलेट) पर हाई-डेफिनिशन वीडियो पाठ देख सकते हैं, कठिन विषयों को दोहरा सकते हैं और अपनी सुविधानुसार अध्ययन कर सकते हैं।',
      metadata: { category: 'format' },
      sortOrder: 3,
    },
    {
      collection: 'faqs',
      key: 'faq_refund_policy',
      titleEn: 'What is your refund and satisfaction policy?',
      titleHi: 'आपकी रिफंड एवं संतुष्टि नीति क्या है?',
      contentEn:
        'We stand behind our academic rigor with a 7-day review window. If you have watched 3 or fewer video modules within 7 calendar days of enrollment and feel the course is not right for you, simply email aapkaastro1606@gmail.com or WhatsApp +91 93112 15564. We will refund 100% of your tuition directly via UPI or bank transfer with zero deductions.',
      contentHi:
        'हम 7-दिवसीय संतुष्टि समीक्षा अवधि प्रदान करते हैं। यदि प्रवेश के 7 दिनों के भीतर और अधिकतम 3 मॉड्यूल देखने तक आपको लगता है कि यह पाठ्यक्रम आपके अनुरूप नहीं है, तो आप हमें ईमेल अथवा व्हाट्सएप पर सूचित करें। बिना किसी कटौती के 100% शुल्क सीधे यूपीआई द्वारा वापस कर दिया जाएगा।',
      metadata: { category: 'policy' },
      sortOrder: 4,
    },
    {
      collection: 'faqs',
      key: 'faq_certification',
      titleEn: 'How do I earn my Certificate of Completion?',
      titleHi: 'कोर्स पूरा करने के बाद सर्टिफिकेट कैसे मिलेगा?',
      contentEn:
        'After watching the 23 modules, you can take our 20-question comprehensive certification exam in your student portal. Scoring 70% or higher automatically generates an official, verifiable Certificate of Completion with a unique cryptographic verification code (e.g. VIAR-2026-WIA-XXXX), instantly verifiable at viar.in/verify.',
      contentHi:
        'सभी 23 मॉड्यूल पूर्ण करने के बाद आप स्टूडेंट पोर्टल पर 20 प्रश्नों की ऑनलाइन परीक्षा दे सकते हैं। 70% या अधिक अंक प्राप्त करने पर आधिकारिक सत्यापन-योग्य प्रमाणपत्र स्वतः जारी हो जाता है, जिसे viar.in/verify पर कभी भी सत्यापित किया जा सकता है।',
      metadata: { category: 'certificate' },
      sortOrder: 5,
    },
    {
      collection: 'faqs',
      key: 'faq_prerequisites',
      titleEn: 'Do I need any prior knowledge of astrology or Sanskrit?',
      titleHi: 'क्या मुझे पहले से ज्योतिष अथवा संस्कृत का ज्ञान होना आवश्यक है?',
      contentEn:
        'No prior background in astrology or Sanskrit is required. Acharya Niraj Kumar explains every astrological term logically from scratch, grounding classical Sanskrit shlokas in accessible English, Hindi, and practical real-life examples suitable for complete beginners to advanced practitioners.',
      contentHi:
        'किसी पूर्व ज्योतिषीय अथवा संस्कृत ज्ञान की आवश्यकता नहीं है। आचार्य नीरज कुमार जी प्रत्येक सिद्धांत को बिल्कुल शून्य से, तार्किक एवं सरल भाषा में समझाते हैं, जिससे नए विद्यार्थी भी सहजता से सीख सकते हैं।',
      metadata: { category: 'curriculum' },
      sortOrder: 6,
    },
    {
      collection: 'faqs',
      key: 'faq_upi_enrollment',
      titleEn: 'How does payment work and how soon is my account unlocked?',
      titleHi: 'पेमेंट कैसे करें और कोर्स कितनी देर में अनलॉक होता है?',
      contentEn:
        'At viar.in/checkout, scan the dynamic UPI QR code or transfer ₹5,100 directly to aapkaastro@okaxis. Enter your 12-digit bank UTR reference and click "I Have Paid", then share the screenshot on WhatsApp (+91 93112 15564). Once verified by the Site Owner in the admin queue, your student portal account immediately unlocks with zero password sharing required.',
      contentHi:
        'viar.in/checkout पेज पर दिए गए डायनामिक यूपीआई क्यूआर कोड को स्कैन करें या ₹5,100 aapkaastro@okaxis पर भेजें। 12 अंकों का यूटीआर नंबर दर्ज कर स्क्रीनशॉट व्हाट्सएप पर भेजें। बैंक सत्यापन होते ही आपका कोर्स स्वतः अनलॉक हो जाता है।',
      metadata: { category: 'payment' },
      sortOrder: 7,
    },
    {
      collection: 'faqs',
      key: 'faq_contact_instructor',
      titleEn: 'Can I connect with Acharya Niraj Kumar for questions during the course?',
      titleHi: 'क्या कोर्स के दौरान आचार्य जी से शंका समाधान हेतु बात हो सकती है?',
      contentEn:
        'Yes! Students can connect directly with Acharya Niraj Kumar via official WhatsApp (+91 93112 15564) and during dedicated periodic question-and-answer sessions. For in-depth personal chart readings, separate consultation appointments can also be scheduled on Aapka Astro.',
      contentHi:
        'हाँ! छात्र आधिकारिक व्हाट्सएप (+91 93112 15564) के माध्यम से आचार्य जी से जुड़ सकते हैं। व्यक्तिगत जन्म कुंडली परामर्श हेतु हमारे सहयोगी मंच आपका एस्ट्रो (aapkaastro.com) पर अलग से अपॉइंटमेंट भी लिया जा सकता है।',
      metadata: { category: 'support' },
      sortOrder: 8,
    },
  ],

  // 4. ABOUT INSTRUCTOR & LINEAGE
  about: [
    {
      collection: 'about',
      key: 'instructor_profile',
      titleEn: 'Acharya Niraj Kumar — Jyotish Acharya & Founder',
      titleHi: 'आचार्य नीरज कुमार — ज्योतिष आचार्य एवं संस्थापक',
      contentEn:
        'Acharya Niraj Kumar is the founder of Vihangam Institute of Astrology and Research (VIAR) and the esteemed astrology portal Aapka Astro. Holding the prestigious Jyotish Acharya credential from Bharatiya Vidya Bhavan, New Delhi (established under the legendary guidance of Shri K. N. Rao), Acharya Niraj Kumar synthesizes over two decades of traditional learning rooted in Baidyanath Dham (Deoghar) with 20+ years of senior executive corporate leadership (including former Vice President at Reliance Capital).\n\nHis teaching philosophy rejects superstition, fear-mongering, and vague generalities, teaching instead classical Parashari principles with mathematical rigor, empirical verification, and modern ethical counseling.',
      contentHi:
        'आचार्य नीरज कुमार विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) और प्रतिष्ठित ज्योतिष मंच आपका एस्ट्रो (Aapka Astro) के संस्थापक हैं। भारतीय विद्या भवन, नई दिल्ली (आदरणीय श्री के. एन. राव जी के मार्गदर्शन में स्थापित) से प्रतिष्ठित ज्योतिष आचार्य की उपाधि प्राप्त आचार्य जी ने बैद्यनाथ धाम (देवघर) की पवित्र गुरु-परंपरा और 20+ वर्षों के वरिष्ठ कॉर्पोरेट नेतृत्व (पूर्व वाइस प्रेसिडेंट, रिलायंस कैपिटल) का दुर्लभ समन्वय किया है।\n\nउनकी शिक्षण पद्धति अंधविश्वास और भय से मुक्त है, और महर्षि पराशर के प्राचीन सिद्धांतों को तार्किक, गणितीय और प्रामाणिक दृष्टिकोण से प्रस्तुत करती है।',
      metadata: {
        credentials: 'Jyotish Acharya (Bharatiya Vidya Bhavan, New Delhi)',
        lineage: 'Baidyanath Dham, Late Guru Shri B. B. Tiwari',
        corporateExperience: '20+ Years Senior Executive Leadership (Ex-VP Reliance)',
        followersCount: '26,000+',
      },
      sortOrder: 1,
    },
  ],

  // 5. STUDENT TESTIMONIALS & TRUST SIGNALS
  testimonials: [
    {
      collection: 'testimonials',
      key: 'testimonial_1',
      titleEn: 'Rajesh Malhotra — Corporate Executive & Astrological Researcher',
      titleHi: 'राजेश मल्होत्रा — कॉर्पोरेट कार्यकारी एवं ज्योतिष अध्येता',
      contentEn:
        '"Acharya ji\'s corporate background combined with classical Jyotish brings unmatched clarity. Every rule is explained with logical reasoning and real chart examples. Truly the most authentic astrology course available online."',
      contentHi:
        '"आचार्य जी की कॉर्पोरेट पृष्ठभूमि और शास्त्रीय ज्योतिष का समन्वय अद्भुत स्पष्टता लाता है। प्रत्येक नियम को तार्किक कारणों और वास्तविक उदाहरणों के साथ समझाया गया है।"',
      metadata: { location: 'Mumbai, India', rating: 5, avatar: '/images/avatar-1.png' },
      sortOrder: 1,
    },
    {
      collection: 'testimonials',
      key: 'testimonial_2',
      titleEn: 'Dr. Sunita Sharma — Medical Professional & Vedic Learner',
      titleHi: 'डॉ. सुनीता शर्मा — चिकित्सा पेशेवर एवं वैदिक शिक्षार्थी',
      contentEn:
        '"The 23 modules are structured brilliantly. As a doctor, I appreciated the systematic, non-superstitious approach to planetary energies and dasha timing. Worth every rupee."',
      contentHi:
        '"23 मॉड्यूल की संरचना बेहद वैज्ञानिक है। अंधविश्वास रहित और प्रामाणिक शिक्षण पद्धति इसे अद्वितीय बनाती है। हर गंभीर शिक्षार्थी को यह कोर्स अवश्य करना चाहिए।"',
      metadata: { location: 'New Delhi, India', rating: 5, avatar: '/images/avatar-2.png' },
      sortOrder: 2,
    },
  ],
};
