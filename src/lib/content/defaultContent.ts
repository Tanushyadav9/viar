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
      metadata: {
        mailto: 'mailto:aapkaastro1606@gmail.com',
        icon: 'Mail',
        type: 'email',
        note: 'Official confirmed inquiries email & admissions helpline',
      },
      sortOrder: 3,
    },
    {
      collection: 'site_settings',
      key: 'announcement_bar',
      titleEn: 'Course & 1-on-1 Mentorship',
      titleHi: 'पाठ्यक्रम एवं व्यक्तिगत मार्गदर्शन',
      contentEn:
        'Vedic Astrology Course & 1-on-1 Mentorship with Acharya Niraj Kumar',
      contentHi:
        'आचार्य नीरज कुमार जी के साथ वैदिक ज्योतिष पाठ्यक्रम एवं 1-on-1 व्यक्तिगत मार्गदर्शन',
      metadata: {
        url: '/courses/what-is-astrology',
        active: false, // Default OFF until client approves wording that does not promise "instant" or "lifetime"
        needsConfirmation: true,
        type: 'announcement_bar',
      },
      sortOrder: 35,
    },
    {
      collection: 'site_settings',
      key: 'campus_location',
      titleEn: 'Academy Campus Location',
      titleHi: 'संस्थान का पता एवं स्थान',
      contentEn: 'Online Institute • Noida, Uttar Pradesh, India',
      contentHi: 'ऑनलाइन संस्थान • नोएडा, उत्तर प्रदेश, भारत',
      metadata: { icon: 'MapPin', type: 'address', needsConfirmation: true },
      sortOrder: 4,
    },
    {
      collection: 'site_settings',
      key: 'social_youtube',
      titleEn: 'Aapka Astro YouTube Channel',
      titleHi: 'आपका एस्ट्रो यूट्यूब चैनल',
      contentEn: 'https://www.youtube.com/@aapkaastro7900',
      contentHi: 'https://www.youtube.com/@aapkaastro7900',
      metadata: { url: 'https://www.youtube.com/@aapkaastro7900', icon: 'Youtube', subscribers: '26,000+' },
      sortOrder: 5,
    },
    {
      collection: 'site_settings',
      key: 'social_instagram',
      titleEn: 'Official Instagram Handle',
      titleHi: 'आधिकारिक इंस्टाग्राम हैंडल',
      contentEn: 'https://www.instagram.com/aapkaastrologer',
      contentHi: 'https://www.instagram.com/aapkaastrologer',
      metadata: { url: 'https://www.instagram.com/aapkaastrologer', icon: 'Instagram' },
      sortOrder: 6,
    },
    {
      collection: 'site_settings',
      key: 'social_facebook',
      titleEn: 'Official Facebook Page',
      titleHi: 'आधिकारिक फेसबुक पेज',
      contentEn: 'https://www.facebook.com/aapkaastro',
      contentHi: 'https://www.facebook.com/aapkaastro',
      metadata: { url: 'https://www.facebook.com/aapkaastro', icon: 'Facebook' },
      sortOrder: 7,
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
      titleEn: 'Course & 1-on-1 Mentorship',
      titleHi: 'पाठ्यक्रम एवं व्यक्तिगत मार्गदर्शन',
      contentEn:
        'Vedic Astrology Course & 1-on-1 Mentorship with Acharya Niraj Kumar',
      contentHi:
        'आचार्य नीरज कुमार जी के साथ वैदिक ज्योतिष पाठ्यक्रम एवं 1-on-1 व्यक्तिगत मार्गदर्शन',
      metadata: {
        url: '/courses/what-is-astrology',
        active: false,
        needsConfirmation: true,
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
        'At viar.in/checkout, scan the dynamic UPI QR code or transfer ₹5,100 directly to 9310709233m@pnb. Enter your 12-digit bank UTR reference and click "I Have Paid", then share the screenshot on WhatsApp (+91 93112 15564). Once verified by the Site Owner in the admin queue, your student portal account immediately unlocks with zero password sharing required.',
      contentHi:
        'viar.in/checkout पेज पर दिए गए डायनामिक यूपीआई क्यूआर कोड को स्कैन करें या ₹5,100 9310709233m@pnb पर भेजें। 12 अंकों का यूटीआर नंबर दर्ज कर स्क्रीनशॉट व्हाट्सएप पर भेजें। बैंक सत्यापन होते ही आपका कोर्स स्वतः अनलॉक हो जाता है।',
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

  // 5. STUDENT TESTIMONIALS & TRUST SIGNALS (Client Management Spec: required consent note, initials/name, city, quote, course, date)
  testimonials: [
    {
      collection: 'testimonials',
      key: 'testimonial_1',
      titleEn: 'Rajesh M. (Mumbai, India)',
      titleHi: 'राजेश एम. (मुंबई, भारत)',
      contentEn:
        '"Acharya ji\'s corporate background combined with classical Jyotish brings unmatched clarity. Every rule is explained with logical reasoning and real chart examples. Truly the most authentic astrology course available online."',
      contentHi:
        '"आचार्य जी की कॉर्पोरेट पृष्ठभूमि और शास्त्रीय ज्योतिष का समन्वय अद्भुत स्पष्टता लाता है। प्रत्येक नियम को तार्किक कारणों और वास्तविक उदाहरणों के साथ समझाया गया है।"',
      metadata: {
        name: 'Rajesh M.',
        city: 'Mumbai, India',
        course: 'The Ultimate Astrology Course',
        date: '2026-03',
        rating: 5,
        consentGiven: true,
        consentNote: 'Explicit written consent provided by student via email on 2026-03-10',
      },
      sortOrder: 1,
    },
    {
      collection: 'testimonials',
      key: 'testimonial_2',
      titleEn: 'Dr. Sunita S. (New Delhi, India)',
      titleHi: 'डॉ. सुनीता एस. (नई दिल्ली, भारत)',
      contentEn:
        '"The 23 modules are structured brilliantly. As a doctor, I appreciated the systematic, non-superstitious approach to planetary energies and dasha timing. Worth every rupee."',
      contentHi:
        '"23 मॉड्यूल की संरचना बेहद वैज्ञानिक है। अंधविश्वास रहित और प्रामाणिक शिक्षण पद्धति इसे अद्वितीय बनाती है। हर गंभीर शिक्षार्थी को यह कोर्स अवश्य करना चाहिए।"',
      metadata: {
        name: 'Dr. Sunita S.',
        city: 'New Delhi, India',
        course: 'The Ultimate Astrology Course',
        date: '2026-02',
        rating: 5,
        consentGiven: true,
        consentNote: 'Explicit written consent provided by student via WhatsApp on 2026-02-18',
      },
      sortOrder: 2,
    },
  ],

  // 6. PROMOTIONAL POPUP (Headline, text, image, dates, enabled)
  popup: [
    {
      collection: 'popup',
      key: 'course_promo_popup',
      titleEn: '50% Off Your First Astrology Masterclass',
      titleHi: 'प्रथम ज्योतिष मास्टरक्लास पर 50% की विशेष छूट',
      contentEn:
        'Join Acharya Niraj Kumar\'s 23-module flagship masterclass. Learn authentic Parashari Jyotish from first principles with instant lifetime access and official certification.',
      contentHi:
        'आचार्य नीरज कुमार जी के 23-मॉड्यूल फ्लैगशिप मास्टरक्लास में प्रवेश लें। पवित्र वैदिक सिद्धांतों से वास्तविक कुंडली तक सीखें।',
      metadata: {
        enabled: true,
        imageUrl: '/images/Acharya_Niraj_Kumar_Solo.jpg',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        buttonLabelEn: 'Claim 50% Off & Enroll Now',
        buttonLabelHi: '50% छूट के साथ प्रवेश लें',
        url: '/courses/what-is-astrology',
      },
      sortOrder: 1,
    },
  ],

  // 7. CERTIFICATE TEMPLATE TEXT (Institute name and signatory line)
  certificate_template: [
    {
      collection: 'certificate_template',
      key: 'institute_name',
      titleEn: 'Vihangam Institute of Astrology and Research (VIAR)',
      titleHi: 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR)',
      contentEn: 'Official academic institution issuing verifiable certification for Vedic astrology.',
      contentHi: 'वैदिक ज्योतिष हेतु आधिकारिक सत्यापन-योग्य प्रमाणपत्र जारी करने वाला शैक्षणिक संस्थान।',
      metadata: {
        acronym: 'VIAR',
        registryUrl: 'https://viar.in/verify',
      },
      sortOrder: 1,
    },
    {
      collection: 'certificate_template',
      key: 'signatory_line',
      titleEn: 'Acharya Niraj Kumar, Founder & Jyotish Acharya',
      titleHi: 'आचार्य नीरज कुमार, संस्थापक एवं ज्योतिष आचार्य',
      contentEn: 'Founder, Lead Astrologer & Verification Signatory',
      contentHi: 'संस्थापक, मुख्य ज्योतिषाचार्य एवं सत्यापन हस्ताक्षरकर्ता',
      metadata: {
        title: 'Founder & Master Astrologer',
        partnerLine: 'In academic partnership with Aapka Astro (aapkaastro.com)',
      },
      sortOrder: 2,
    },
  ],

  // 8. LEGAL PAGES (Owner-only editor with version history and "pending lawyer review" flag)
  legal: [
    {
      collection: 'legal',
      key: 'terms_of_service',
      titleEn: 'VIAR Terms of Service & Academy Enrollment Agreement',
      titleHi: 'VIAR सेवा की शर्तें एवं अकादमी प्रवेश अनुबंध',
      contentEn:
        'Welcome to Vihangam Institute of Astrology and Research (VIAR, viar.in). By enrolling in our courses, you agree to these academic terms. Course content is for personal education only. Sharing login credentials or redistributing video lectures is strictly prohibited.',
      contentHi:
        'विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) में आपका स्वागत है। हमारे पाठ्यक्रमों में प्रवेश लेकर आप इन शैक्षणिक शर्तों से सहमत होते हैं। सामग्री केवल व्यक्तिगत अध्ययन हेतु है।',
      metadata: {
        pendingLawyerReview: false,
        lastReviewedDate: '2026-04-01',
      },
      sortOrder: 1,
    },
    {
      collection: 'legal',
      key: 'refund_policy',
      titleEn: 'VIAR 7-Day Satisfaction & 100% Refund Policy',
      titleHi: 'VIAR 7-दिवसीय संतुष्टि एवं 100% शुल्क वापसी नीति',
      contentEn:
        'We stand behind the academic depth of our masterclass. If you have completed 3 or fewer modules within 7 calendar days of enrollment, you may request a 100% full refund via UPI or bank transfer with zero deductions.',
      contentHi:
        'हम अपने पाठ्यक्रम की गुणवत्ता के प्रति पूर्णतः आश्वस्त हैं। यदि प्रवेश के 7 दिनों के भीतर और अधिकतम 3 मॉड्यूल देखने तक आपको लगता है कि यह पाठ्यक्रम आपके लिए नहीं है, तो आप 100% शुल्क वापसी का अनुरोध कर सकते हैं।',
      metadata: {
        pendingLawyerReview: false,
        lastReviewedDate: '2026-04-01',
      },
      sortOrder: 2,
    },
    {
      collection: 'legal',
      key: 'privacy_policy',
      titleEn: 'VIAR Student Privacy & Data Protection Policy',
      titleHi: 'VIAR छात्र गोपनीयता एवं डेटा सुरक्षा नीति',
      contentEn:
        'VIAR respects student privacy. We never sell student data, share phone numbers with advertisers, or store plain-text payment passwords.',
      contentHi:
        'VIAR छात्र गोपनीयता का पूर्ण सम्मान करता है। हम कभी भी छात्र डेटा नहीं बेचते हैं और न ही तीसरे पक्ष से साझा करते हैं।',
      metadata: {
        pendingLawyerReview: false,
        lastReviewedDate: '2026-04-01',
      },
      sortOrder: 3,
    },
  ],

  // 9. BLOG OR ANNOUNCEMENTS
  announcements: [
    {
      collection: 'announcements',
      key: 'announcement_batch',
      titleEn: 'Admissions Open for Self-Paced Masterclass',
      titleHi: 'सेल्फ-पेस्ड मास्टरक्लास हेतु प्रवेश खुला है',
      contentEn:
        'Enroll today to receive instant access to all 23 HD video modules and 2 bonus chart interpretation workshops.',
      contentHi:
        'आज ही प्रवेश लें और सभी 23 एचडी वीडियो पाठों तथा 2 बोनस कार्यशालाओं का तत्काल एक्सेस पाएं।',
      metadata: {
        active: true,
        url: '/courses/what-is-astrology',
        date: '2026-04-15',
      },
      sortOrder: 1,
    },
  ],
};

// Aliases for seamless collection discovery
BUILTIN_CONTENT_DEFAULTS.homepage = BUILTIN_CONTENT_DEFAULTS.hero;

