import { VIAR_ACADEMY_FACTS } from './knowledgeBase.ts';

export type AssistantLanguage = 'en' | 'hi' | 'hinglish';

export interface ActionButton {
  label: string;
  url: string;
  isExternal?: boolean;
  type: 'whatsapp' | 'call' | 'enroll' | 'link';
  variant?: 'primary' | 'secondary' | 'accent';
}

export interface AssistantResponse {
  reply: string;
  language: AssistantLanguage;
  intent: string;
  confidence: 'high' | 'medium' | 'fallback';
  actionButtons: ActionButton[];
}

/**
 * Detect language of query: 'hi' (Devanagari), 'hinglish' (Roman script Hindi), or 'en'
 */
export function detectLanguage(text: string): AssistantLanguage {
  const trimmed = text.trim();

  // 1. Check for Devanagari Unicode characters (U+0900 to U+097F)
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(trimmed)) {
    return 'hi';
  }

  // 2. Check for characteristic Hinglish words in lowercase
  const lower = trimmed.toLowerCase();
  const hinglishKeywords = [
    'kya', 'hai', 'hain', 'kaise', 'kitna', 'kitni', 'kitne', 'milega', 'milegi',
    'hogi', 'hoga', 'karna', 'karni', 'karun', 'chahiye', 'batao', 'bataiye',
    'shuru', 'kab', 'paise', 'padhai', 'padhaya', 'sir', 'ji', 'shadi', 'kundli',
    'kundali', 'lagna', 'grah', 'graha', 'rashi', 'nakshatra', 'dasha', 'dikhani',
    'baat', 'karni', 'bheju', 'bhejna', 'wapas', 'sikha', 'seekhna', 'sikhna',
    'class', 'classes', 'video', 'kholna', 'dena', 'dijiye', 'namaste', 'pranam',
    'dhyan', 'theek', 'samajh', 'acharya', 'niraj'
  ];

  const words = lower.split(/[^a-z0-9]+/);
  let hinglishMatches = 0;
  for (const w of words) {
    if (hinglishKeywords.includes(w)) {
      hinglishMatches++;
    }
  }

  // If 2 or more Hinglish words, or 1 strong interrogative word (kya/kaise/kitni/kab/karna)
  if (
    hinglishMatches >= 2 ||
    (hinglishMatches >= 1 && /\b(kya|kaise|kitna|kitni|kitne|kab|karein|karna|batao|bataiye)\b/i.test(lower))
  ) {
    return 'hinglish';
  }

  return 'en';
}

/**
 * Intelligent Intent Classifier for VIAR Academy Queries
 */
export function identifyIntent(query: string): string {
  const q = query.toLowerCase().trim();

  // General Greetings
  if (/^(hi|hello|hey|namaste|namaskar|pranam|pranaam|good morning|good afternoon|good evening|नमस्ते|प्रणाम|नमस्कार|प्रणाम आचार्य जी)[\s!.]*$/i.test(q)) {
    return 'greeting';
  }

  // 1. Transaction Confirmation Inquiries (Strictly fail-closed: Rule 5)
  if (
    /(confirm\s+(my\s+)?(payment|transaction|booking|enrollment|order)|payment\s+(confirm|verify|check|hua\s+ki\s+nahi)|verify\s+my\s+payment|activate\s+my\s+(course|account|enrollment)|mene\s+paise\s+bhej\s+diye|paise\s+kat\s+gaye|payment\s+ho\s+gaya|पेमेंट\s+(कन्फर्म|सत्यापित|चेक)|पैसे\s+कट\s+गए|भुगतान\s+सत्यापन)/i.test(q)
  ) {
    return 'confirm_payment';
  }

  // 2. Free Tools / Calculators / Free Previews / Kundli Software
  if (
    /(free\s+(tool|tools|calculator|software|kundli|chart|preview|lesson|lessons|video|watch|sample)|kundli\s+(calculator|software|maker)|panchang\s+calculator|free\s+me\s+kya|free\s+resources|watch\s+.*free|मुफ्त\s+(टूल|कैलकुलेटर|सॉफ्टवेयर|कुंडली|पाठ|वीडियो)|फ्री\s+टूल)/i.test(q)
  ) {
    return 'free_tools';
  }

  // 3. Out of scope (Coding, politics, general unrelated topics, medical, legal advice, prompt injections, abuse)
  if (
    /(python|javascript|write\s+code|source\s+code|coding|react|sql|chatgpt|politics|political|election|weather|cricket|world\s+cup|france|narendra\s+modi|stock\s+tips|bitcoin|crypto|dawa|medicine|headache|doctor|medical|surgery|cancer|illness|court\s+case|legal\s+advice|lawyer|lawsuit|property\s+dispute|dan|jailbreak|ignore\s+all\s+instructions|system\s+prompt|developer\s+prompt|api\s+key|api\s+keys|secret\s+key|roleplay|idiot|stupid|scam|scammer|fraud|fool|bastard|abuse|दवा|बीमारी|इलाज|कोर्ट|केस|कानूनी|मौसम|चुनाव|कोडिंग)/i.test(q)
  ) {
    return 'out_of_scope';
  }

  // 4. Refund & Cancellation Policy (Must take precedence over generic module/fee keywords)
  if (
    /(refund|money\s*back|cancel|cancellation|wapas|paise\s+wapas|guarantee|satisfaction|return\s+policy|refund\s+policy|रिफंड|धनवापसी|रद्दीकरण|पैसे\s+वापस)/i.test(q)
  ) {
    return 'refund';
  }

  // 5. Payment method / How to pay / UPI / QR / Account Activation / Password delivery / Enrollment steps
  if (
    /(how\s+(do\s+i\s+|can\s+i\s+|to\s+)?(enroll|enrol|register|join|sign\s*up|pay)|(how\s+soon|when)\s+.*(access|unlock)|access\s+to\s+the\s+course|access\s+after|steps\s+to\s+enroll|admission\s+process|enrollment\s+steps|pay\s+kaise|which\s+upi|upi\s+apps|upi|qr|google\s*pay|phonepe|paytm|vpa|utr|bank\s+transfer|screenshot|payment\s+process|enroll\s+kaise|admission\s+kaise|password|login\s+access|account\s+kab\s+khulega|भुगतान|पेमेंट|यूपीआई|क्यूआर|प्रवेश\s+(कैसे|प्रक्रिया)|दाखिला|पैसे\s+कैसे\s+(दें|भेजें|जमा|पे)|भुगतान\s+(कैसे|प्रक्रिया))/i.test(q)
  ) {
    return 'payment_how_to';
  }

  // 6. Direct Contact / Phone / WhatsApp / Call
  if (
    /(contact|phone|number|mobile|whatsapp|call|reach|email|address|office|baat\s+karni|sampark|direct\s+call|संपर्क|फोन|व्हाट्सएप|कॉल|मोबाइल|बात\s+करनी)/i.test(q)
  ) {
    return 'contact_whatsapp';
  }

  // 7. Personal Horoscope / Prediction Inquiries (Must be redirected to 1-on-1 consultation)
  if (
    /(meri\s+(kundli|kundali|shadi|marriage|career|job|future|health)|kundali\s+dikhani|kundli\s+dekhna|apna\s+bhavishya|personal\s+(horoscope|reading|consultation|prediction)|my\s+(kundali|chart|marriage|career|future)|read\s+my\s+chart|when\s+will\s+i|will\s+i\s+(get|marry|win|recover)|matchmaking|kundli\s+milan|कुंडली|कुंडली\s+का\s+विश्लेषण|मेरी\s+कुंडली|मेरी\s+शादी|भविष्य|परामर्श)/i.test(q)
  ) {
    return 'personal_consultation';
  }

  // 8. Course Tuition / Fees / Price / Cost / Discounts / Currency
  if (
    /(fee|fees|cost|price|pricing|charge|tuition|rate|amount|₹|inr|dollar|usd|currency|currencies|international\s+student|foreign\s+currency|discount|free\s+course|make\s+it\s+free|100%\s*free|for\s+free|\bfree\b|coupon|installment|emi|kitni\s+fees|kitna\s+lagega|kitne\s+paise|paise\s+kitne|fees\s+kya\s+hai|fees\s+batao|fees\s+kitni|फीस|शुल्क|खर्च|लागत|दाम|मूल्य|करेंसी|पैसे\s+कितने)/i.test(q)
  ) {
    return 'fees_pricing';
  }

  // 9. Certification / Exams / Verification
  if (
    /(certificate|certification|exam|test|quiz|praman\s*patra|degree|diploma|certified|accredited|passing\s+marks|verify|verification|certificate\s+milega|certificate\s+kaisa\s+hoga|सर्टिफिकेट|प्रमाणपत्र|परीक्षा|क्विज़|डिग्री)/i.test(q)
  ) {
    return 'certificate';
  }

  // 10. Instructor / Acharya Niraj Kumar
  if (
    /(acharya|niraj|niraj\s+kumar|instructor|teacher|faculty|founder|guru|who\s+teaches|kon\s+padhayega|who\s+is\s+niraj|qualifications|experience|bvb|bharatiya\s+vidya\s+bhavan|background|आचार्य|नीरज|नीरज\s+कुमार|शिक्षक|गुरु|संस्थापक)/i.test(q)
  ) {
    return 'instructor';
  }

  // 11. Curriculum / Syllabus / Modules / Workshops / Bonus classes / Prerequisites
  if (
    /(syllabus|curriculum|module|modules|lesson|lessons|topic|topics|content|chapter|chapters|workshop|workshops|bonus|case\s+study|prerequisite|prerequisites|eligibility|prior\s+knowledge|prior\s+experience|requirements\s+to\s+join|kya\s+sikhaya|kya\s+padhaya|kya\s+kya\s+hai|course\s+me\s+kya\s+hai|course\s+details|what\s+will\s+i\s+learn|topics\s+covered|kundali\s+making|graha|nakshatra|rashis|bhavas|dashas|पाठ्यक्रम|सिलेबस|विषय|अध्याय|मॉड्यूल|क्या\s+सिखाया|क्या\s+पढ़ाया|क्या\s+सिखाते)/i.test(q)
  ) {
    return 'syllabus_curriculum';
  }

  // 12. Course Delivery Format (Live vs Recorded / Timing / Duration / Validity / Lifetime access)
  if (
    /(live|recorded|self\s*paced|timing|timings|schedule|time\s+table|kab\s+hoti\s+hai|kis\s+samay|duration|valid|validity|how\s+long|kab\s+tak|lifetime|zoom|batch|dates|recording\s+milegi|kya\s+live\s+hai|recorded\s+hai\s+ya\s+live|लाइव|रिकॉर्डेड|सेल्फ-पेस्ड|समय|समय\s+सारणी|अवधि|आजीवन|ज़ूम)/i.test(q)
  ) {
    return 'format_schedule';
  }

  // 13. General Course Inquiry
  if (
    /(course|astrology|jyotish|learn|seekhna|admission|join|enroll|कोर्स|ज्योतिष|सीखना|प्रवेश)/i.test(q)
  ) {
    return 'general_course_inquiry';
  }

  return 'unknown';
}

/**
 * Generate Grounded Assistant Response
 * Returns a 100% verified response with action buttons.
 * Guarantees zero hallucinations and zero API cost.
 */
export function generateGroundedAssistantResponse(
  query: string,
  options: { locale?: string; isEnrolled?: boolean } = {}
): AssistantResponse {
  const language = options.locale === 'hi' ? 'hi' : detectLanguage(query);
  const intent = identifyIntent(query);

  const facts = VIAR_ACADEMY_FACTS;
  const course = facts.flagshipCourse;
  const contact = facts.contacts;

  // Standard Helper for Action Buttons
  const getWhatsAppAction = (customText?: string): ActionButton => ({
    label: language === 'hi' ? 'आचार्य जी से व्हाट्सएप पर बात करें' : language === 'hinglish' ? 'Acharya ji se WhatsApp par baat karein' : 'Chat on WhatsApp',
    url: `${contact.whatsappUrl}?text=${encodeURIComponent(customText || 'Namaste Acharya Niraj Kumar ji, I have an inquiry regarding the VIAR Astrology Masterclass.')}`,
    isExternal: true,
    type: 'whatsapp',
    variant: 'primary',
  });

  const getCallAction = (): ActionButton => ({
    label: language === 'hi' ? 'कॉल करें: +91 93112 15564' : language === 'hinglish' ? 'Call: +91 93112 15564' : 'Call +91 93112 15564',
    url: contact.phoneTel,
    isExternal: true,
    type: 'call',
    variant: 'secondary',
  });

  const getEnrollAction = (): ActionButton => {
    if (options.isEnrolled) {
      return {
        label: language === 'hi' ? 'मेरे कोर्स पर जाएं' : language === 'hinglish' ? 'Go to My Course' : 'Go to My Course',
        url: '/dashboard/courses',
        isExternal: false,
        type: 'link',
        variant: 'primary',
      };
    }
    return {
      label: language === 'hi' ? 'कोर्स में प्रवेश लें (₹5,100)' : language === 'hinglish' ? 'Enroll in Course (₹5,100)' : 'Enroll in Masterclass (₹5,100)',
      url: '/checkout?course=what-is-astrology',
      isExternal: false,
      type: 'enroll',
      variant: 'accent',
    };
  };

  const getSyllabusAction = (): ActionButton => ({
    label: language === 'hi' ? '23-मॉड्यूल पाठ्यक्रम देखें' : language === 'hinglish' ? '23 Modules Syllabus Dekhein' : 'View 23-Module Syllabus',
    url: '/courses/what-is-astrology',
    isExternal: false,
    type: 'link',
    variant: 'secondary',
  });

  const getRefundPolicyAction = (): ActionButton => ({
    label: language === 'hi' ? 'रिफंड पॉलिसी पढ़ें' : language === 'hinglish' ? 'Refund Policy Dekhein' : 'Read Refund Policy',
    url: '/refund-policy',
    isExternal: false,
    type: 'link',
    variant: 'secondary',
  });

  // 1. GREETING
  if (intent === 'greeting') {
    if (language === 'hi') {
      return {
        reply: 'नमस्ते! 🙏 विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) में आपका स्वागत है। मैं आपका शैक्षणिक सहायक हूँ। आप मुझसे हमारे 23-मॉड्यूल वैदिक ज्योतिष कोर्स, ₹5,100 शिक्षण शुल्क, पाठ्यक्रम, आचार्य नीरज कुमार जी, या प्रवेश प्रक्रिया के बारे में कुछ भी पूछ सकते हैं।',
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: 'Namaste! 🙏 Vihangam Institute of Astrology and Research (VIAR) mein aapka swagat hai. Main aapka AI Academic Assistant hoon. Aap mujhse hamare 23-module Vedic Astrology masterclass, ₹5,100 fees, syllabus, Acharya Niraj Kumar ji, ya admission process ke baare mein kuch bhi pooch sakte hain.',
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
      };
    }
    return {
      reply: 'Namaste! 🙏 Welcome to Vihangam Institute of Astrology and Research (VIAR). I am your Academic Assistant. I can help answer questions about our 23-module Vedic Astrology masterclass, the ₹5,100 INR one-time tuition, syllabus, instructor Acharya Niraj Kumar, and the enrollment process.',
      language,
      intent,
      confidence: 'high',
      actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
    };
  }

  // 1B. CONFIRM PAYMENT (Rule 5: Fail-closed; never confirm payment as an AI)
  if (intent === 'confirm_payment') {
    if (language === 'hi') {
      return {
        reply: `एक एआई सहायक के रूप में, मैं बैंक लेन-देन की पुष्टि या भुगतान सत्यापन नहीं कर सकता। केवल संस्थान के संस्थापक (आचार्य नीरज कुमार जी) बैंक में राशि प्राप्त होने की पुष्टि करके नामांकन सक्रिय करते हैं।\n\nकृपया अपना 12 अंकों का बैंक UTR / ट्रांजैक्शन नंबर और पेमेंट का स्क्रीनशॉट सीधे आचार्य जी को व्हाट्सएप (+91 93112 15564) पर भेजें अथवा viar.in/checkout पर 'मैंने भुगतान कर दिया' पर सबमिट करें। बैंक सत्यापन होते ही आपका कोर्स स्वतः अनलॉक हो जाएगा।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [
          getWhatsAppAction('Namaste Acharya ji, I have made the payment. Here is my 12-digit UTR reference for verification: '),
          getCallAction(),
        ],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Main ek AI assistant hoon aur financial transactions ya payment verification confirm nahi kar sakta. Course access strictly tab unlock hota hai jab Acharya Niraj Kumar ji bank credit verify karte hain.\n\nKripya apna 12-digit bank UTR reference number aur payment screenshot direct Acharya ji ko WhatsApp (+91 93112 15564) par send karein ya viar.in/checkout par submit karein. Bank verification complete hote hi aapka course instantly unlock ho jayega.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [
          getWhatsAppAction('Namaste Acharya ji, I have made the payment. Here is my 12-digit UTR reference for verification: '),
          getCallAction(),
        ],
      };
    }
    return {
      reply: `As an AI assistant, I cannot verify financial transactions, bank receipts, or confirm that a payment or enrollment has occurred. Only the academy Owner (Acharya Niraj Kumar) verifies bank credits and activates student access.\n\nPlease submit your 12-digit bank UTR transaction reference at viar.in/checkout and message your payment screenshot directly to Acharya Niraj Kumar on WhatsApp (+91 93112 15564). Once bank credit is verified in the admin queue, your student account unlocks automatically.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [
        getWhatsAppAction('Namaste Acharya ji, I have made the payment. Here is my 12-digit UTR reference for verification: '),
        getCallAction(),
      ],
    };
  }

  // 1C. FREE TOOLS / CALCULATORS
  if (intent === 'free_tools') {
    if (language === 'hi') {
      return {
        reply: `VIAR संस्थान के viar.in/courses पेज पर मॉड्यूल 1 के परिचयात्मक वीडियो पाठ निःशुल्क (Free Preview) उपलब्ध हैं ताकि आप नामांकन से पूर्व आचार्य जी की शिक्षण शैली का अनुभव कर सकें।\n\nनिःशुल्क ऑनलाइन ज्योतिषीय टूल्स (तुरंत जन्म कुंडली निर्माण, दैनिक पंचांग, और शुभ मुहूर्त कैलकुलेटर) के लिए आप हमारे सहयोगी परामर्श मंच 'Aapka Astro' (aapkaastro.com) पर जा सकते हैं। VIAR का 23-मॉड्यूल का संपूर्ण शैक्षणिक सर्टिफिकेशन कोर्स ₹5,100 शिक्षण शुल्क पर उपलब्ध है।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [
          {
            label: 'फ्री प्रीव्यू देखें',
            url: '/courses/what-is-astrology',
            type: 'link',
            variant: 'secondary',
          },
          getEnrollAction(),
          getWhatsAppAction(),
        ],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `VIAR par Module 1 ke free preview lessons viar.in/courses par available hain taaki aap enroll karne se pehle teaching style dekh sakein.\n\nFree online astrological tools (Kundli generation, daily Panchang, aur Muhurta calculators) ke liye aap hamare sister portal Aapka Astro (aapkaastro.com) par visit kar sakte hain. VIAR ka complete 23-module masterclass course ₹5,100 ki one-time fee par available hai.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [
          {
            label: 'Watch Free Preview',
            url: '/courses/what-is-astrology',
            type: 'link',
            variant: 'secondary',
          },
          getEnrollAction(),
          getWhatsAppAction(),
        ],
      };
    }
    return {
      reply: `VIAR provides free preview lessons for Module 1 of our masterclass at viar.in/courses so you can experience Acharya Niraj Kumar's logical teaching methodology before enrolling.\n\nFor free astrological calculators (instant Kundli generation, daily Panchang, and Muhurta tools), please visit our sister portal Aapka Astro (aapkaastro.com). The flagship 23-module academic certification course at VIAR is a structured paid program for ₹5,100 INR ($69 USD).`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [
        {
          label: 'Watch Free Preview',
          url: '/courses/what-is-astrology',
          type: 'link',
          variant: 'secondary',
        },
        getEnrollAction(),
        getWhatsAppAction(),
      ],
    };
  }

  // 2. FEES & PRICING
  if (intent === 'fees_pricing') {
    if (language === 'hi') {
      return {
        reply: `हमारे फ्लैगशिप कोर्स "${course.titleHi}" का शिक्षण शुल्क बिल्कुल पारदर्शी और निश्चित रूप से मात्र ₹${course.priceInr.toLocaleString('en-IN')} (अथवा $${course.priceUsd} USD) है।\n\n• यह एक बार का एकमुश्त शुल्क (One-time Fee) है — कोई मासिक या छिपा हुआ शुल्क नहीं है।\n• इसमें सभी 23 वीडियो मॉड्यूल, 2 व्यावहारिक चार्ट वर्कशॉप, डाउनलोड करने योग्य नोट्स और आधिकारिक सर्टिफिकेट शामिल हैं।\n• जीवनभर की पहुंच (Lifetime Access) मिलती है।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getWhatsAppAction('Namaste Acharya ji, I want to confirm the ₹5,100 fee and proceed with enrollment.')],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Hamare flagship course "${course.titleEn}" ki fees strictly ₹${course.priceInr.toLocaleString('en-IN')} (ya $${course.priceUsd} USD) hai.\n\n• Yeh ek one-time fee hai — koi monthly subscription ya hidden charge nahi hai.\n• Isme complete 23 on-demand video modules, 2 bonus chart workshops, downloadable notes, aur verifiable certificate included hai.\n• Aapko course ka lifetime access milta hai.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getWhatsAppAction('Namaste Acharya ji, I want to confirm the ₹5,100 fee and proceed with enrollment.')],
      };
    }
    return {
      reply: `The tuition fee for "${course.titleEn}" is strictly a one-time fee of ₹${course.priceInr.toLocaleString('en-IN')} INR (or $${course.priceUsd} USD).\n\n• Strictly One-Time: No recurring subscriptions, no hidden taxes, and no renewal fees.\n• Complete Access: Includes all 23 on-demand video modules, 2 bonus real-chart masterclasses, study materials, and verifiable certification.\n• Lifetime Access: Learn anytime from any device at your own pace.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getEnrollAction(), getWhatsAppAction('Namaste Acharya ji, I want to confirm the ₹5,100 fee and proceed with enrollment.')],
    };
  }

  // 3. SYLLABUS & CURRICULUM
  if (intent === 'syllabus_curriculum') {
    if (language === 'hi') {
      return {
        reply: `हमारा पाठ्यक्रम 23 गहन संरचित वीडियो मॉड्यूल में विभाजित है जो आधारभूत सिद्धांतों से लेकर वास्तविक कुंडली विश्लेषण तक सिखाता है:\n\n1. 9 ग्रहों की प्रकृति, 12 राशियां और 12 भाव (घर)\n2. ग्रहों का अस्त (Combustion) और वक्री (Retrograde) होना\n3. ग्रहों की दृष्टि (Drishti) और युति (Conjunction)\n4. विंशोत्तरी महादशा और अंतर्दशा गणना एवं समय निर्धारण\n5. 27 नक्षत्र और गोचर (Transit)\n6. राज योग, धन योग एवं अरिष्ट योग\n7. करियर (10वां भाव) एवं विवाह (7वां भाव) कुंडली विश्लेषण\n8. रत्न विज्ञान (Gemstone Therapy) एवं रुद्राक्ष चयन\n9. 2 बोनस वर्कशॉप: करियर और वैवाहिक जीवन के वास्तविक चार्ट केस स्टडीज।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getSyllabusAction(), getEnrollAction(), getWhatsAppAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Hamara curriculum 23 structured on-demand video modules mein divided hai jo zero se lekar advanced chart reading sikhata hai:\n\n• 9 Grahas, 12 Rashis, aur 12 Bhavas ke basic to advanced attributes\n• Planetary dignities: Uccha, Neecha, Asta, aur Vakri grah\n• Drishti, Yuti, aur functional benefics/malefics\n• Vimshottari Dasha system (Mahadasha & Antardasha timing)\n• 27 Nakshatras aur Gochar (Planetary Transits)\n• Raj Yogas, Dhana Yogas aur Kundli Milan\n• Vedic Remedies: Ratna therapy (Gemstones) aur Rudraksha Vigyan\n• 2 Bonus Practical Masterclasses: Career aur Marriage chart reading case studies.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getSyllabusAction(), getEnrollAction(), getWhatsAppAction()],
      };
    }
    return {
      reply: `The curriculum is structured across 23 comprehensive on-demand video modules designed to take you from foundational astronomy to expert chart reading:\n\n• Core Architecture: Nature of 9 planets, 12 signs (Rashis), and 12 houses (Bhavas)\n• Planetary Mechanics: Dignities (Exaltation/Debilitation), Combustion (Asta), and Retrograde (Vakri) motion\n• Interplanetary Dynamics: Planetary aspects (Drishtis) and conjunctions (Yutis)\n• Predictive Tools: Vimshottari Dasha timing, 27 Nakshatras, and planetary transits (Gochar)\n• Specialized Analysis: Career forecasting (10th house) and Marriage compatibility (7th house & D9 Navamsha)\n• Remedial Vedic Sciences: Authentic Gemstone prescription and Rudraksha rules\n• 2 Bonus Workshops: Live case study breakdowns of real client charts for career and marriage.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getSyllabusAction(), getEnrollAction(), getWhatsAppAction()],
    };
  }

  // 4. FORMAT & SCHEDULE (Self-Paced vs Live)
  if (intent === 'format_schedule') {
    if (language === 'hi') {
      return {
        reply: `यह पाठ्यक्रम 100% सेल्फ-पेस्ड (Self-Paced) है!\n\n• किसी निश्चित समय पर लाइव ज़ूम क्लास में उपस्थित होने का कोई दबाव नहीं है।\n• नामांकन होते ही सभी 23 वीडियो मॉड्यूल तुरंत आपके स्टूडेंट पोर्टल में अनलॉक हो जाते हैं।\n• आप अपनी सुविधा अनुसार किसी भी समय, फोन, टैबलेट या लैपटॉप पर वीडियो देख सकते हैं, रोक सकते हैं, और दोबारा देख सकते हैं।\n• आपको आजीवन पहुंच (Lifetime Access) मिलती है।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Yeh course 100% self-paced high-definition video masterclass hai!\n\n• Koi rigid live Zoom timing nahi hai — aap apne schedule ke according jab chahein padh sakte hain.\n• Enroll hote hi saare 23 video modules aapke account mein unlock ho jaate hain.\n• Pause, rewind, aur rewatch ki poori azaadi hai.\n• Lifetime access milta hai, so aap bina kisi time pressure ke calmly seekh sakte hain.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
      };
    }
    return {
      reply: `The course is 100% self-paced with immediate on-demand access!\n\n• Zero Scheduling Pressure: There are no mandatory live Zoom meetings or fixed class hours. You learn entirely on your own schedule.\n• Instant Unlock: All 23 high-definition video modules and 2 bonus workshops become accessible immediately upon enrollment verification.\n• Watch Anywhere: Compatible with desktop, tablet, and mobile browsers with pause, rewind, and re-watch capabilities.\n• Lifetime Access: Take as much time as you need with no expiry date.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
    };
  }

  // 5. CERTIFICATE & EXAM
  if (intent === 'certificate') {
    if (language === 'hi') {
      return {
        reply: `हाँ! पाठ्यक्रम पूरा करने पर आपको विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) का आधिकारिक सत्यापन-योग्य प्रमाणपत्र (Verifiable Certificate) मिलता है।\n\n• सभी वीडियो मॉड्यूल देखने के पश्चात पोर्टल पर 20 बहुविकल्पीय प्रश्नों की एक अंतिम परीक्षा होती है।\n• 70% या अधिक अंक प्राप्त करने पर आपका डिजिटल सर्टिफिकेट तुरंत जारी हो जाता है।\n• प्रत्येक सर्टिफिकेट पर एक अद्वितीय कोड होता है जिसे viar.in/verify पर कोई भी सत्यापित कर सकता है।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Haan! Course complete karne ke baad aapko VIAR (Vihangam Institute of Astrology and Research) ka official verifiable Certificate of Completion milta hai.\n\n• Video modules complete karne ke baad 20 multiple-choice questions ka final quiz hota hai.\n• 70% ya usse zyada score karne par automatically digital certificate generate ho jaata hai.\n• Har certificate par ek unique verification code hota hai jise viar.in/verify par check kiya ja sakta hai.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction()],
      };
    }
    return {
      reply: `Yes! Upon completing the course, you receive an official verifiable digital Certificate of Completion from the Vihangam Institute of Astrology and Research (VIAR).\n\n• Assessment & Quiz: A 20-question multiple-choice graded assessment quiz testing practical chart reading and foundational concepts.\n• Passing Standard: Scoring 70% or higher automatically awards your certificate.\n• Cryptographic Verification: Each certificate carries a unique code verifiable publicly at viar.in/verify.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getEnrollAction(), getSyllabusAction()],
    };
  }

  // 6. INSTRUCTOR: ACHARYA NIRAJ KUMAR
  if (intent === 'instructor') {
    if (language === 'hi') {
      return {
        reply: `पाठ्यक्रम का निर्माण और शिक्षण विशेष रूप से आचार्य नीरज कुमार द्वारा किया गया है:\n\n• ज्योतिषाचार्य: प्रतिष्ठित भारतीय विद्या भवन (इंस्टीट्यूट ऑफ एस्ट्रोलॉजी, नई दिल्ली) से प्रामाणिक ज्योतिषाचार्य (अध्यक्ष के. एन. राव के मार्गदर्शन में)।\n• 20 से अधिक वर्षों का वैदिक ज्योतिष एवं तार्किक वास्तु (Logical Vastu) का व्यावहारिक अनुभव।\n• पूर्व कॉर्पोरेट उपाध्यक्ष (Reliance Retail, Metro Cash & Carry, NIF Food) — वे प्राचीन विज्ञान को आधुनिक तार्किक दृष्टिकोण से समझाते हैं।\n• Aapka Astro (26k+ फॉलोअर्स) और VIAR के संस्थापक।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getWhatsAppAction('Namaste Acharya ji, I would like to know more about learning under your guidance.'), getEnrollAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Course ko poori tarah se Acharya Niraj Kumar ji padhate hain:\n\n• Certified Jyotish Acharya from legendary Bharatiya Vidya Bhavan (Institute of Astrology, New Delhi, under guru K.N. Rao).\n• Certified Logical Vastu Expert (ISO 9001:2015) & Astro-Vastu specialist.\n• 20+ years ka real astrological practice experience.\n• Former Corporate Vice President at Reliance Retail & Metro Cash & Carry — isliye unka teaching method pure logic aur mathematics par based hai, zero superstition.\n• Founder of Aapka Astro (26k+ community) aur VIAR.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getWhatsAppAction('Namaste Acharya ji, I would like to know more about learning under your guidance.'), getEnrollAction()],
      };
    }
    return {
      reply: `The entire curriculum is authored and instructed exclusively by Acharya Niraj Kumar:\n\n• Academic Pedigree: Certified Jyotish Acharya from the renowned Bharatiya Vidya Bhavan - Institute of Astrology, New Delhi (under guru K.N. Rao).\n• Certified Vastu Specialist: Certified Logical Vastu Expert (ISO 9001:2015) and Astro-Vastu specialist.\n• Dual Expertise: Combines 20+ years of active astrological practice with 20+ years of senior executive leadership (former Vice President at Reliance Retail and Metro Cash & Carry), delivering a purely logical, scientific, and mathematics-backed approach to chart reading.\n• Founder: Founder of Aapka Astro (26k+ community) and VIAR.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getWhatsAppAction('Namaste Acharya ji, I would like to know more about learning under your guidance.'), getEnrollAction()],
    };
  }

  // 7. HOW TO PAY & ENROLLMENT PROCESS
  if (intent === 'payment_how_to') {
    if (options.isEnrolled) {
      const getMyCourseAction = (): ActionButton => ({
        label: language === 'hi' ? 'मेरे कोर्स पर जाएं' : language === 'hinglish' ? 'Go to My Course' : 'Go to My Course',
        url: '/dashboard/courses',
        isExternal: false,
        type: 'link',
        variant: 'primary',
      });

      if (language === 'hi') {
        return {
          reply: 'आप पहले से ही इस पाठ्यक्रम में नामांकित हैं! आप सीधे अपने छात्र पोर्टल (viar.in/dashboard/courses) से अपने सभी पाठ देख सकते हैं। आपको दोबारा कोई भुगतान करने की आवश्यकता नहीं है।',
          language,
          intent,
          confidence: 'high',
          actionButtons: [getMyCourseAction(), getWhatsAppAction('Namaste Acharya ji, I am an enrolled student and have a question.')],
        };
      }
      if (language === 'hinglish') {
        return {
          reply: 'Aap already iss course mein enrolled hain! Aap direct apne Student Portal (viar.in/dashboard/courses) se access kar sakte hain. Aapko dobara payment karne ki zaroorat nahi hai.',
          language,
          intent,
          confidence: 'high',
          actionButtons: [getMyCourseAction(), getWhatsAppAction('Namaste Acharya ji, I am an enrolled student and have a question.')],
        };
      }
      return {
        reply: 'You are already enrolled in this course! You have active lifetime access to all lessons in your Student Portal (viar.in/dashboard/courses). You do not need to make any further payment.',
        language,
        intent,
        confidence: 'high',
        actionButtons: [getMyCourseAction(), getWhatsAppAction('Namaste Acharya ji, I am an enrolled student and have a question.')],
      };
    }

    if (language === 'hi') {
      return {
        reply: `प्रवेश एवं भुगतान की प्रक्रिया अत्यंत सरल और सुरक्षित है:\n\n1. viar.in/checkout पर जाएं जहाँ ₹5,100 का शुल्क और डायनामिक UPI QR कोड दिखाई देगा।\n2. किसी भी UPI ऐप (Google Pay, PhonePe, Paytm, BHIM) से QR कोड स्कैन करें या सीधे UPI ID: 9310709233m@pnb पर ₹5,100 भेजें।\n3. 'मैंने भुगतान कर दिया' पर क्लिक करके 12 अंकों का बैंक UTR / ट्रांजैक्शन नंबर दर्ज करें।\n4. पेमेंट का स्क्रीनशॉट व्हाट्सएप पर आचार्य नीरज कुमार (+91 93112 15564) को भेजें।\n5. बैंक में राशि सत्यापित होते ही आपके रजिस्टर्ड ईमेल पर तुरंत कोर्स अनलॉक हो जाता है। (व्हाट्सएप पर कोई अस्थायी पासवर्ड नहीं भेजा जाता; आप अपने ही ईमेल से लॉगिन करते हैं)।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getWhatsAppAction('Namaste Acharya ji, I have a question about the UPI payment process for the course.')],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Course mein enroll karne ka process direct aur safe hai:\n\n1. viar.in/checkout par jaiye jahan ₹5,100 locked fee aur dynamic UPI QR code show hota hai.\n2. Kisi bhi UPI app (GPay, PhonePe, Paytm) se QR code scan karein ya UPI ID: 9310709233m@pnb par ₹5,100 pay karein.\n3. 'I have paid' par click karke apna 12-digit bank UTR number submit karein.\n4. WhatsApp par payment screenshot Acharya Niraj Kumar (+91 93112 15564) ko bhejein.\n5. Bank credit verify hote hi aapka account dashboard par instant unlock ho jaata hai. (WhatsApp par koi random password nahi bheja jata; aap apne registered email se hi login karte hain).`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getWhatsAppAction('Namaste Acharya ji, I have a question about the UPI payment process for the course.')],
      };
    }
    return {
      reply: `Enrollment is direct, secure, and completed in 5 simple steps:\n\n1. Visit viar.in/checkout to view your locked ₹5,100 tuition and dynamic UPI QR code.\n2. Scan the QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM) or pay to UPI ID: 9310709233m@pnb.\n3. Click "I have paid" and enter your 12-digit bank UTR transaction reference.\n4. Send your payment screenshot to Acharya Niraj Kumar on WhatsApp (+91 93112 15564).\n5. Once bank credit is verified in the admin queue, your student account unlocks automatically. (No passwords are sent over WhatsApp; you sign in securely with your own registered email or Google account on viar.in/login).`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getEnrollAction(), getWhatsAppAction('Namaste Acharya ji, I have a question about the UPI payment process for the course.')],
    };
  }

  // 8. REFUND & CANCELLATION
  if (intent === 'refund') {
    if (language === 'hi') {
      return {
        reply: `हमारी रिफंड पॉलिसी पूर्णतः पारदर्शी और छात्र-हितैषी है:\n\n• 7-दिवसीय संतुष्टि समीक्षा अवधि: यदि नामांकन के 7 दिनों के भीतर और पहले 3 मॉड्यूल देखने के पश्चात आपको लगता है कि शिक्षण शैली आपके अनुकूल नहीं है, तो आप 100% पूर्ण धनवापसी का अनुरोध कर सकते हैं।\n• चूंकि भुगतान प्रत्यक्ष UPI द्वारा किया जाता है, इसलिए कोई गेटवे कटौती नहीं होती और पूरी राशि 5-7 कार्यदिवसों में सीधे आपके मूल बैंक खाते में वापस कर दी जाती है।\n• 7 दिन बीत जाने या 3 से अधिक मॉड्यूल देख लेने के बाद रिफंड देय नहीं होता।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getRefundPolicyAction(), getWhatsAppAction('Namaste Acharya ji, I have a question regarding the refund policy.')],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Hamari refund policy transparent aur student-friendly hai:\n\n• 7-Day Review Window: Enrollment ke 7 calendar days ke andar aur agar aapne first 3 video modules se zyada nahi dekha hai, toh aap 100% full refund claim kar sakte hain.\n• Zero deductions: Direct UPI payment hone ki wajah se koi third-party gateway fee deduct nahi hoti aur 100% amount 5-7 business days mein aapke bank account mein credit ho jaati hai.\n• 7 days ya 3 modules se zyada dekhne ke baad monetary refund applicable nahi hota.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getRefundPolicyAction(), getWhatsAppAction('Namaste Acharya ji, I have a question regarding the refund policy.')],
      };
    }
    return {
      reply: `Our refund policy is student-friendly, direct, and completely transparent:\n\n• 7-Day Review Window: If within 7 calendar days of enrollment and having viewed no more than the first three (3) video modules you find the methodology unsuitable, you may request a 100% full tuition refund.\n• 100% Direct Refund: Because payments are processed directly via UPI rather than third-party gateways, approved refunds are returned in full without processing deductions within 5–7 business days.\n• Eligibility Boundary: Once the 7-day window has elapsed or more than 3 modules have been viewed, monetary refunds cannot be issued.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getRefundPolicyAction(), getWhatsAppAction('Namaste Acharya ji, I have a question regarding the refund policy.')],
    };
  }

  // 9. PERSONAL HOROSCOPE / CONSULTATION (Safely escalate, do not guess)
  if (intent === 'personal_consultation') {
    if (language === 'hi') {
      return {
        reply: `नमस्ते! मैं VIAR संस्थान का शैक्षणिक सहायक हूँ और केवल ज्योतिष पाठ्यक्रमों एवं प्रवेश संबंधी प्रश्नों में सहायता कर सकता हूँ। मैं व्यक्तिगत कुंडलियों का विश्लेषण या भविष्यवाणियां नहीं कर सकता।\n\nयदि आप आचार्य नीरज कुमार जी से अपनी व्यक्तिगत जन्म कुंडली (Kundali Reading), करियर, विवाह या वास्तु परामर्श लेना चाहते हैं, तो कृपया उनके व्यक्तिगत परामर्श मंच 'Aapka Astro' पर अथवा सीधे व्हाट्सएप या कॉल के माध्यम से संपर्क करें।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [
          getWhatsAppAction('Namaste Acharya Niraj Kumar ji, I would like to book a personal Kundli Consultation with you.'),
          getCallAction(),
        ],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Namaste! Main VIAR ka AI Academic Assistant hoon aur main sirf courses aur admissions ke baare mein jaanta hoon. Main personal kundali readings ya predictions nahi kar sakta.\n\nAgar aapko Acharya Niraj Kumar ji se apni personal Kundli reading, career, marriage, ya Vastu consultation karani hai, toh aap unke direct WhatsApp ya phone par connect karke consultation book kar sakte hain.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [
          getWhatsAppAction('Namaste Acharya Niraj Kumar ji, I would like to book a personal Kundli Consultation with you.'),
          getCallAction(),
        ],
      };
    }
    return {
      reply: `Namaste! As the VIAR Academic Assistant, I am specialized strictly in our astrology courses, curriculum, tuition, and admissions. I cannot analyze personal horoscopes or generate astrological predictions.\n\nTo consult Acharya Niraj Kumar for a comprehensive personal birth chart reading, career/marriage forecast, or Vastu audit, please reach out on our sister consultation platform Aapka Astro (aapkaastro.com) or connect directly via WhatsApp or phone call:`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [
        getWhatsAppAction('Namaste Acharya Niraj Kumar ji, I would like to book a personal Kundli Consultation with you.'),
        getCallAction(),
      ],
    };
  }

  // 10. DIRECT CONTACT & WHATSAPP
  if (intent === 'contact_whatsapp') {
    if (language === 'hi') {
      return {
        reply: `आप आचार्य नीरज कुमार जी एवं संस्थान से सीधे संपर्क कर सकते हैं:\n\n• व्हाट्सएप हेल्पलाइन: +91 93112 15564\n• फोन कॉल: +91 93112 15564\n• स्थान: ऑनलाइन संस्थान (नोएडा, उत्तर प्रदेश)\n\nनीचे दिए गए बटन पर क्लिक करके सीधे व्हाट्सएप पर चैट शुरू कर सकते हैं।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getWhatsAppAction(), getCallAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `Aap Acharya Niraj Kumar ji aur VIAR team se directly connect kar sakte hain:\n\n• WhatsApp Helpline: +91 93112 15564\n• Direct Call: +91 93112 15564\n• Location: Online Institute (Noida, Uttar Pradesh)\n\nNeeche diye gaye buttons par click karke direct call ya WhatsApp kar sakte hain.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getWhatsAppAction(), getCallAction()],
      };
    }
    return {
      reply: `You can reach Acharya Niraj Kumar and the VIAR admissions desk directly:\n\n• WhatsApp Helpline: +91 93112 15564\n• Phone: +91 93112 15564\n• Location: Online Institute (Noida, Uttar Pradesh, India)\n\nFeel free to tap the buttons below for immediate direct communication.`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getWhatsAppAction(), getCallAction()],
    };
  }

  // 11. GENERAL COURSE INQUIRY
  if (intent === 'general_course_inquiry') {
    if (language === 'hi') {
      return {
        reply: `विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) का फ्लैगशिप कार्यक्रम "${course.titleHi}" है।\n\n• 23 उच्च गुणवत्ता वाले ऑन-डिमांड वीडियो मॉड्यूल + 2 व्यावहारिक बोनस वर्कशॉप।\n• 100% अपनी गति से सीखने की सुविधा (Self-paced) और जीवनभर पहुंच (Lifetime Access)।\n• शिक्षण शुल्क: मात्र ₹5,100 (एकमुश्त)।\n• अंतिम परीक्षा उत्तीर्ण करने पर आधिकारिक सत्यापन-योग्य प्रमाणपत्र।\n\nआप नीचे दिए गए लिंक से पूरा पाठ्यक्रम देख सकते हैं या सीधे प्रवेश ले सकते हैं।`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
      };
    }
    if (language === 'hinglish') {
      return {
        reply: `VIAR ka flagship masterclass "${course.titleEn}" hai:\n\n• 23 on-demand video modules + 2 practical bonus workshops.\n• 100% self-paced format with lifetime access.\n• One-time tuition fee: strictly ₹5,100.\n• Official verifiable Certificate of Completion.\n\nAap neeche diye gaye button se direct enroll kar sakte hain ya syllabus dekh sakte hain.`,
        language,
        intent,
        confidence: 'high',
        actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
      };
    }
    return {
      reply: `VIAR's flagship program is "${course.titleEn}":\n\n• Structure: 23 comprehensive on-demand video modules plus 2 real-world chart analysis bonus workshops.\n• Format: 100% self-paced with immediate lifetime access.\n• Tuition: Strictly ₹5,100 INR one-time fee.\n• Certification: Official verifiable Certificate of Completion upon passing the final exam.\n\nExplore the full curriculum or enroll directly below:`,
      language,
      intent,
      confidence: 'high',
      actionButtons: [getEnrollAction(), getSyllabusAction(), getWhatsAppAction()],
    };
  }

  // 12. OUT OF SCOPE OR UNKNOWN (Safe Refusal with Direct Contact)
  const finalIntent = intent === 'out_of_scope' ? 'out_of_scope' : 'fallback';

  if (language === 'hi') {
    return {
      reply: `मुझे क्षमा करें, मैं केवल विहंगम संस्थान (VIAR) के वैदिक ज्योतिष पाठ्यक्रमों, ₹5,100 शिक्षण शुल्क, पाठ्यक्रम एवं प्रवेश प्रक्रिया के प्रश्नों का उत्तर दे सकता हूँ। मेरे पास इस विशिष्ट विषय की सत्यापित जानकारी नहीं है।\n\nसटीक जानकारी प्राप्त करने अथवा सीधे मार्गदर्शन हेतु आप आचार्य नीरज कुमार जी से व्हाट्सएप अथवा फोन पर संपर्क कर सकते हैं।`,
      language,
      intent: finalIntent,
      confidence: 'fallback',
      actionButtons: [getWhatsAppAction(), getCallAction(), getEnrollAction()],
    };
  }
  if (language === 'hinglish') {
    return {
      reply: `Mujhe maaf kijiye, main sirf VIAR ke Vedic Astrology courses, ₹5,100 fees, syllabus, aur admission process ke baare mein guide kar sakta hoon. Mere paas is topic ki verified information nahi hai.\n\nGalat jankari dene se behtar hai ki aap direct Acharya Niraj Kumar ji se WhatsApp ya call par baat karein:`,
      language,
      intent: finalIntent,
      confidence: 'fallback',
      actionButtons: [getWhatsAppAction(), getCallAction(), getEnrollAction()],
    };
  }
  return {
    reply: `I apologize, but as the VIAR Academic Assistant, I am strictly grounded in VIAR's Vedic Astrology courses, ₹5,100 tuition, curriculum, and admissions. I do not have verified information on this specific topic.\n\nRather than risk providing an inaccurate answer, I encourage you to contact Acharya Niraj Kumar directly on WhatsApp or phone:`,
    language,
    intent: finalIntent,
    confidence: 'fallback',
    actionButtons: [getWhatsAppAction(), getCallAction(), getEnrollAction()],
  };
}
