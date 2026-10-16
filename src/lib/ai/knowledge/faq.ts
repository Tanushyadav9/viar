/**
 * Structured Knowledge Base: Frequently Asked Questions
 * Covers course logistics, prerequisites, and scope boundaries.
 */

export interface FAQItem {
  id: string;
  category: string;
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
}

export const FAQ_KNOWLEDGE: FAQItem[] = [
  {
    id: 'faq-who-can-join',
    category: 'admission',
    questionEn: 'Do I need prior astrology or Sanskrit knowledge to join?',
    questionHi: 'क्या मुझे ज्योतिष सीखने के लिए पहले से संस्कृत या ज्योतिष का ज्ञान होना जरूरी है?',
    answerEn:
      'No. The course starts from absolute ground zero and assumes zero prior knowledge. Everything is explained logically with clear modern examples.',
    answerHi:
      'नहीं, किसी पूर्व ज्ञान या संस्कृत की आवश्यकता नहीं है। आचार्य नीरज कुमार जी बिल्कुल शून्य से शुरू करके सरल और तार्किक भाषा में सिखाते हैं।',
  },
  {
    id: 'faq-self-paced-format',
    category: 'format',
    questionEn: 'Is the masterclass live on Zoom or self-paced on-demand?',
    questionHi: 'क्या यह कोर्स लाइव क्लास है या रिकॉर्डेड वीडियो मास्टरक्लास?',
    answerEn:
      'It is a 100% self-paced on-demand video masterclass with lifetime access. You can watch anytime at your own speed on mobile, tablet, or laptop, plus join bonus live Q&A workshops.',
    answerHi:
      'यह 100% सेल्फ-पेस्ड ऑन-डिमांड वीडियो मास्टरक्लास है जिसमें लाइफटाइम एक्सेस मिलता है। आप कभी भी अपने फोन या लैपटॉप पर वीडियो देख सकते हैं, और बोनस लाइव वर्कशॉप में भी भाग ले सकते हैं।',
  },
  {
    id: 'faq-certificate-validity',
    category: 'certification',
    questionEn: 'Will I receive a valid certificate after completion?',
    questionHi: 'क्या कोर्स पूरा करने के बाद सर्टिफिकेट मिलेगा?',
    answerEn:
      'Yes! After completing all 23 modules and passing the final quiz (70% pass mark), you receive a verifiable digital certificate with a unique registry code (VIAR-2026-WIA-XXXX).',
    answerHi:
      'हाँ! सभी 23 मॉड्यूल पूरे करने और अंतिम मूल्यांकन परीक्षा (70% अंक) उत्तीर्ण करने पर आपको संस्थान से सत्यापन योग्य डिजिटल प्रमाणपत्र प्राप्त होगा।',
  },
  {
    id: 'faq-personal-readings',
    category: 'consultation',
    questionEn: 'Does this fee include a personal horoscope reading or prediction?',
    questionHi: 'क्या इस कोर्स की फीस में मेरी व्यक्तिगत कुंडली देखना भी शामिल है?',
    answerEn:
      'No. VIAR is an academic learning institute for studying Vedic astrology. For personal horoscope readings and consultations with Acharya Niraj Kumar, please book via Aapka Astro (aapkaastro.com) or WhatsApp (+91 93112 15564).',
    answerHi:
      'नहीं। VIAR ज्योतिष सीखने का संस्थान है। आचार्य नीरज कुमार जी से व्यक्तिगत कुंडली परामर्श या भविष्यकथन के लिए आप आपका एस्ट्रो (aapkaastro.com) अथवा व्हाट्सएप (+91 93112 15564) पर अलग से सत्र बुक कर सकते हैं।',
  },
  {
    id: 'faq-lifetime-access',
    category: 'format',
    questionEn: 'How long do I have access to the video lectures and notes?',
    questionHi: 'वीडियो और नोट्स का एक्सेस कितने समय के लिए रहता है?',
    answerEn:
      'You get lifetime access with unlimited rewatches. All downloadable PDFs, chart references, and future course updates are included with no recurring subscription fees.',
    answerHi:
      'आपको लाइफटाइम (आजीवन) एक्सेस मिलता है। आप जितनी बार चाहें वीडियो दोबारा देख सकते हैं। इसके लिए कोई मासिक या वार्षिक शुल्क नहीं है।',
  },
];
