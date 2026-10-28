'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Award,
  ArrowRight,
  ExternalLink,
  Users,
  Compass,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Phone,
  X
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { SISTER_SERVICES } from '@/config/services';

const CREDENTIAL_GALLERY = [
  {
    src: '/images/gallery/Jyotish_Acharya_Certificate.png',
    alt: 'Jyotish Acharya Certificate',
    title: 'Jyotish Acharya',
    institution: 'Bhartiya Vidya Bhawan (K.N. Rao Institute)',
    category: 'Formal Jyotish Credential',
  },
  {
    src: '/images/gallery/Jyotishvedanghub_Astro_Vastu_Certificate.png',
    alt: 'Certificate of Achievement Astro Vastu Video Course - Jyotishvedanghub',
    title: 'Astro Vastu Video Course Certificate',
    institution: 'Jyotishvedanghub (Awarded August 22, 2022)',
    category: 'Verified Course Credential',
  },
  {
    src: '/images/gallery/Vastu_Expert_Certificate.png',
    alt: 'Vastu Expert Certificate',
    title: 'Certified Vastu Expert',
    institution: 'Divya Vastu & Vaastu Just For You',
    category: 'Advanced AstroVastu Credential',
  },
  {
    src: '/images/gallery/Shivjyoti_Best_Astrologer_Award.jpg',
    alt: 'Shivjyoti Astrology Best Astrologer Award presented to Jyotishacharya Niraj Kumar',
    title: 'Best Astrologer Honor',
    institution: 'Shivjyoti Astrology (Regd.) with Chief Guest Dr. H S Rawat',
    category: 'Honor & Award in Astrology R&D',
  },
  {
    src: '/images/gallery/Dignitary_Felicitation_Award.jpg',
    alt: 'State Dignitary Felicitation by Uttarakhand Chief Minister Pushkar Singh Dhami',
    title: 'State Dignitary Felicitation',
    institution: 'Presented by Hon. CM Pushkar Singh Dhami',
    category: 'State Honors & Recognition',
  },
  {
    src: '/images/gallery/Minister_Honor_Felicitation.jpg',
    alt: 'Minister Honor & Felicitation of Acharya Niraj Kumar',
    title: 'Honorary Reception & Felicitation',
    institution: 'State Dignitary & Ministerial Delegation',
    category: 'Public Distinction',
  },
  {
    src: '/images/gallery/with_guruji.jpg',
    alt: 'Acharya Niraj Kumar with Guruji',
    title: 'With Late Guru Shri B. B. Tiwari',
    institution: 'Parampara & Traditional Lineage',
    category: 'Spiritual Lineage',
  },
  {
    src: '/images/gallery/Recognition_Awards.jpg',
    alt: 'Recognition Awards',
    title: 'Excellence in Astrology & Vastu',
    institution: 'National Astrological Forum',
    category: 'Honor & Recognition',
  },
  {
    src: '/images/gallery/Awards_Receiving.jpg',
    alt: 'Receiving Astrological Honors',
    title: 'Astrology Felicitations',
    institution: 'Vedic Science Conclave',
    category: 'Honor & Award',
  },
  {
    src: '/images/gallery/Getting_Certificates.jpg',
    alt: 'Certification Ceremony',
    title: 'Academic Convocations',
    institution: 'Jyotish Vidyapeeth',
    category: 'Academic Convocation',
  },
];

export default function AboutPage() {
  const { isHi } = useLanguage();
  const [activeModalImg, setActiveModalImg] = useState<{ src: string; title: string; institution: string } | null>(null);

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Introduction to Vihangam Institute of Astrology and Research */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHi ? 'अग्रणी ज्योतिष विज्ञान एवं अनुसंधान' : 'Pioneering Astrological Science & Research'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {isHi ? (
                <>विहंगम ज्योतिष एवं अनुसंधान संस्थान <span className="gold-gradient-text">का परिचय</span></>
              ) : (
                <>Introduction to <span className="gold-gradient-text">Vihangam Institute of Astrology and Research</span></>
              )}
            </h1>
          </div>

          <div className="bg-gradient-to-b from-[#111827] to-[#0d131f] rounded-3xl border border-amber-500/30 p-8 sm:p-12 text-left space-y-6 shadow-2xl">
            <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
              {isHi
                ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) में आपका स्वागत है — एक अग्रणी शैक्षणिक संस्थान जो ज्योतिष को एक गहन विज्ञान और कला के रूप में समझने और सिखाने के लिए समर्पित है। प्राचीन ज्ञान को समकालीन वैज्ञानिक अनुसंधान के साथ जोड़ने के दृष्टिकोण से स्थापित, यह संस्थान उन सभी शिक्षार्थियों और अभ्यासियों का प्रमुख केंद्र है जो ज्योतिषीय सिद्धांतों, विधियों और दैनिक जीवन में उनके व्यावहारिक अनुप्रयोगों का गंभीर अध्ययन करना चाहते हैं।'
                : 'Welcome to the Vihangam Institute of Astrology and Research, a pioneering institution dedicated to the exploration and understanding of astrology as a profound science and art. Established with the vision of bridging ancient wisdom with contemporary inquiry, the institute serves as a hub for both learners and practitioners who seek to delve into the intricacies of astrological principles, methodologies, and their practical applications in daily life.'}
            </p>
            <p className="text-slate-300 text-base leading-relaxed">
              {isHi
                ? 'विहंगम में हमारा दृढ़ विश्वास है कि ज्योतिष केवल भविष्यवाणियों का साधन नहीं है, बल्कि यह मानव जीवन के अनुभवों और ब्रह्मांड के साथ हमारे अंतर्संबंध को समझने का एक दिव्य माध्यम है। हमारा दृष्टिकोण गहन शैक्षणिक अनुसंधान को अनुभवात्मक शिक्षण के साथ जोड़ता है, जिससे शिक्षार्थी न केवल सैद्धांतिक आधार को समझें बल्कि उसके व्यावहारिक परिणामों का भी विश्लेषण कर सकें।'
                : 'At Vihangam, we believe that astrology is not merely a tool for prediction, but a lens through which we can gain insights into the human experience and our interconnectedness with the cosmos. Our approach combines rigorous academic research with experiential learning, ensuring that students and researchers not only grasp the theoretical foundations of astrology but also engage with its practical implications.'}
            </p>
            <p className="text-slate-300 text-base leading-relaxed">
              {isHi
                ? 'विद्वान प्राध्यापकों और अनुभवी ज्योतिषियों के मार्गदर्शन में संस्थान एक व्यापक पाठ्यक्रम प्रदान करता है जिसमें जन्मकुंडली विश्लेषण, फलित तकनीक, ग्रह गोचर, नाड़ी ज्योतिष, वर्षफल और केरल प्रश्न पद्धति शामिल हैं। नियमित पाठ्यक्रमों के अतिरिक्त, हम कार्यशालाओं, संगोष्ठियों और सम्मेलनों का भी आयोजन करते हैं।'
                : 'With a team of esteemed scholars and seasoned astrologers, the institute offers a comprehensive curriculum that encompasses various branches of astrology, including natal astrology, predictive techniques, and the study of transits, Nadi astrology, progressions, Kerala prashant. In addition to specialized courses, we also host workshops, seminars, and conferences that encourage dialogue, innovation, and the dissemination of astrological knowledge.'}
            </p>
            <p className="text-slate-300 text-base leading-relaxed">
              {isHi
                ? 'चाहे आप एक जिज्ञासु नौसिखिए हों या अपने ज्ञान को विस्तार देने वाले अभ्यासी, विहंगम ज्योतिष एवं अनुसंधान संस्थान बौद्धिक अन्वेषण और व्यक्तिगत विकास के लिए एक आदर्श वातावरण प्रदान करता है। हमारे साथ इस ज्ञान यात्रा में जुड़ें।'
                : 'Whether you are a curious novice or an established practitioner seeking to enhance your skills, Vihangam Institute of Astrology and Research provides a nurturing environment for exploration and growth. Join us as we embark on a journey to uncover the celestial patterns that shape our lives and illuminate our paths.'}
            </p>
          </div>
        </div>

        {/* Master Instructor Biography Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'गुरु परंपरा, आधुनिक विज्ञान एवं कॉर्पोरेट नेतृत्व' : 'Master Lineage, Science & Corporate Leadership'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {isHi ? (
              <>आपका एस्ट्रो एवं VIAR <span className="gold-gradient-text">के संस्थापक</span></>
            ) : (
              <>The Mind Behind <span className="gold-gradient-text">Aapka Astro & VIAR</span></>
            )}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-2">
            {isHi
              ? 'जहां पारंपरिक वैदिक परंपरा, कॉर्पोरेट कार्यकारी दृष्टिकोण और गणितीय सटीकता का संगम होता है।'
              : 'Where traditional Vedic lineage meets corporate executive insight and empirical mathematical rigor.'}
          </p>
        </div>

        {/* Primary Biography Showcase */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0d131f] rounded-3xl border border-amber-500/30 p-8 sm:p-12 lg:p-16 mb-20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-center">
              <div className="relative inline-block mx-auto">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl mx-auto relative group">
                  <Image
                    src="/images/Acharya_Niraj_Kumar_Desk.jpg"
                    alt="Acharya Niraj Kumar"
                    fill
                    sizes="(max-width: 640px) 256px, 320px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 right-0 bg-[#0f172a] border border-amber-400/40 px-4 py-2 rounded-xl shadow-xl text-left">
                  <p className="text-xs font-bold text-amber-300">
                    {isHi ? 'आचार्य नीरज कुमार' : 'Acharya Niraj Kumar'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isHi ? 'संस्थापक, आपका एस्ट्रो एवं मुख्य मार्गदर्शक, VIAR' : 'Founder, Aapka Astro & Lead Instructor, VIAR'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-emerald-600/30 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 93112 15564</span>
                </a>
              </div>

              {/* Official Social Media Channels */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <a
                  href="https://www.youtube.com/@aapkaastro7900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-red-600/25 transition"
                >
                  <span>YouTube: @aapkaastro7900</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://www.facebook.com/aapkaastro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-blue-600/25 transition"
                >
                  <span>Facebook: /aapkaastro</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href="https://www.instagram.com/aapkaastrologer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-pink-600/15 border border-pink-500/30 text-pink-300 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-pink-600/25 transition"
                >
                  <span>Instagram: @aapkaastrologer</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  {isHi ? 'मुख्य मार्गदर्शक का परिचय' : 'Master Instructor Profile'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                  {isHi ? 'आचार्य नीरज कुमार' : 'Acharya Niraj Kumar'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-1">
                  {isHi
                    ? 'ज्योतिष आचार्य • एस्ट्रोवास्तु विशेषज्ञ • वरिष्ठ कॉर्पोरेट नेतृत्व'
                    : 'Jyotish Acharya • AstroVastu Consultant • Corporate Leadership Veteran'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-medium italic">
                {isHi
                  ? '“आपका एस्ट्रो और विहंगम ज्योतिष एवं अनुसंधान संस्थान (VIAR) का नेतृत्व आचार्य नीरज कुमार द्वारा किया जाता है, जो गहन पारंपरिक ज्ञान और दुर्लभ वास्तविक कॉर्पोरेट नेतृत्व का समन्वय प्रस्तुत करते हैं।”'
                  : '“Aapka Astro and Vihangam Institute of Astrology and Research (VIAR) are led by Acharya Niraj Kumar, a practitioner who brings together deep traditional learning and rare real-world corporate leadership.”'}
              </div>

              <p>
                {isHi
                  ? 'बैद्यनाथ धाम (देवघर) के आध्यात्मिक वातावरण में पले-बढ़े आचार्य नीरज कुमार की ज्योतिष और वास्तु में रुचि बाल्यकाल से ही जागृत हो गई थी। पिछले दो दशकों से अधिक समय में उन्होंने देश-विदेश के हजारों विद्यार्थियों और परामर्शार्थियों का सफल मार्गदर्शन किया है।'
                  : 'Raised in the spiritually rich ecosystem of Baidyanath Dham, Deoghar, his journey into astrology and Vastu began early, shaped by curiosity and disciplined guidance. Over the last two decades, he has studied, practiced, and refined his approach, trusted by students and clients across India and abroad through comprehensive chart interpretations and numerous Vastu consultations.'}
              </p>

              <p>
                {isHi
                  ? 'आचार्य नीरज कुमार की पद्धति को जो बात सबसे विशिष्ट बनाती है, वह है उनका दो दशकों का शीर्ष कॉर्पोरेट कार्यकारी अनुभव। रिलायंस रिटेल (Reliance Retail), मेट्रो कैश एंड कैरी (Metro Cash & Carry), और एनआईएफ फूड (NIF Food) जैसी प्रतिष्ठित संस्थाओं में वाइस प्रेसिडेंट (VP) और बिजनेस हेड के रूप में उन्होंने व्यापारिक चुनौतियों और प्रबंधन के दबाव को प्रत्यक्ष रूप से जिया है।'
                  : 'What makes Acharya Niraj Kumar uniquely effective—especially in demystifying chart interpretation and teaching commercial Vastu—is his extensive corporate background. With over two decades in senior executive roles including Vice President and Business Head at major organizations such as Reliance Retail, Metro Cash & Carry, and NIF Food, he understands business realities, career crossroads, and executive leadership pressure firsthand.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-left">
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-black text-amber-300">20+ Years</p>
                  <p className="text-xs text-slate-400">{isHi ? 'वैदिक अभ्यास' : 'Vedic Practice'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-black text-white">{isHi ? 'सत्यापित' : 'Trusted'}</p>
                  <p className="text-xs text-slate-400">{isHi ? 'देश-विदेश में प्रतिष्ठित' : 'Across India & Abroad'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] col-span-2 sm:col-span-1">
                  <p className="text-2xl font-black text-emerald-400">26,000+</p>
                  <p className="text-xs text-slate-400">{isHi ? 'वैश्विक समुदाय' : 'Global Community'}</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Credentials & Lineage Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              {isHi ? 'परंपरा एवं अध्ययन' : 'Lineage & Learning'}
            </h2>
            <h3 className="text-3xl font-extrabold text-white">
              {isHi ? 'औपचारिक योग्यताएं एवं पारंपरिक प्रमाण-पत्र' : 'Formal Qualifications & Traditional Credentials'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Traditional Lineage & Jyotish Credentials */}
            <div className="cosmic-card p-8 rounded-2xl border border-amber-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {isHi ? 'वैदिक परंपरा एवं प्रमाणन' : 'Vedic Lineage & Certifications'}
                  </h4>
                  <p className="text-xs text-amber-300">
                    {isHi ? 'भारत के शीर्ष ज्योतिषीय संस्थानों द्वारा प्रमाणित' : 'Certified by India\'s leading Jyotish authorities'}
                  </p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'स्वर्गीय गुरु श्री बी. बी. तिवारी जी के सानिध्य में अध्ययन' : 'Trained under Late Guru Shri B. B. Tiwari'}
                    </strong>
                    <span>
                      {isHi ? 'शास्त्रीय पाराशरी ज्योतिष और प्राचीन मौखिक गुरु-शिष्य परंपरा का प्रत्यक्ष अध्ययन।' : 'Direct lineage learning in classical Parashari Jyotish and ancient oral tradition.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'ज्योतिष आचार्य' : 'Jyotish Acharya'}
                    </strong>
                    <span>
                      {isHi ? 'भारतीय विद्या भवन (के. एन. राव संस्थान) — भारत का प्रतिष्ठित शास्त्रीय ज्योतिष प्रमाणन।' : 'Bhartiya Vidya Bhawan (K.N. Rao Institute) — premier classical Jyotish certification.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'एम.ए. ज्योतिष (IGNOU, 2024)' : 'M.A. in Jyotish (IGNOU, 2024)'}
                    </strong>
                    <span>
                      {isHi ? 'वैदिक ज्योतिष विज्ञान और गणितीय खगोलशास्त्र में स्नातकोत्तर डिग्री।' : 'Postgraduate academic degree in Vedic astrological sciences and computational astronomy.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'नाड़ी प्रवीण (ICAS)' : 'Nadi Parveen (ICAS)'}
                    </strong>
                    <span>
                      {isHi ? 'इंडियन काउंसिल ऑफ एस्ट्रोलॉजिकल साइंसेज — नाड़ी ज्योतिष में विशिष्ट तकनीकें।' : 'Indian Council of Astrological Sciences — specialized techniques in Nadi astrology.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'ज्योतिष प्रभाकर (IRIW डॉ. पवन सिन्हा के सानिध्य में)' : 'Jyotish Prabhakar (IRIW under Dr. Pawan Sinha)'}
                    </strong>
                    <span>
                      {isHi ? 'उन्नत मनोवैज्ञानिक विश्लेषण और कर्म सुधार पद्धति।' : 'Advanced psychological analysis and karmic remedial frameworks.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'ज्योतिष विशारद एवं ज्योतिष मणि (भारत ज्योतिष विद्यापीठ)' : 'Jyotish Visharad & Jyotish Mani (Bharat Jyotish Vidyapith)'}
                    </strong>
                    <span>
                      {isHi ? 'ग्रह गोचर, विंशोत्तरी दशा और मुहूर्त निर्णय में दक्षता।' : 'Mastery of planetary transits, Dashas, and Muhurta selection.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'उन्नत देवता एवं ऊर्जा वास्तु (दिव्य वास्तु)' : 'Advanced Devta & Energy Vastu (Divya Vastu)'}
                    </strong>
                    <span>
                      {isHi ? 'सूक्ष्म ऊर्जा क्षेत्रों और बिना तोड़-फोड़ के वास्तु सुधार में महारत।' : 'Granular decoding of spatial energetic blueprints, micro-zones, and non-demolition remedies.'}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Academic & Corporate Leadership */}
            <div className="cosmic-card p-8 rounded-2xl border border-sky-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {isHi ? 'शैक्षणिक एवं कॉर्पोरेट आधार' : 'Academic & Corporate Foundation'}
                  </h4>
                  <p className="text-xs text-sky-300">
                    {isHi ? 'व्यावहारिक यथार्थवाद और आध्यात्मिक ज्ञान का संगम' : 'Executive realism meets timeless metaphysics'}
                  </p>
                </div>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'बी.एससी. (ऑनर्स) भौतिक विज्ञान' : 'B.Sc. (Hons.) in Physics'}
                    </strong>
                    <span>
                      {isHi ? 'खगोलीय ज्यामिति, प्रकाशिकी और ग्रहीय कंपनों का वैज्ञानिक व विश्लेषणात्मक दृष्टिकोण।' : 'Analytical, first-principles approach to celestial geometry, optics, and planetary vibrations.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'पीजीडीबीएम (अंतर्राष्ट्रीय व्यापार एवं विपणन)' : 'PGDBM in International Business & Marketing'}
                    </strong>
                    <span>
                      {isHi ? 'व्यावसायिक प्रबंधन, बहुराष्ट्रीय संचालन और व्यापार रणनीति में विशेषज्ञता।' : 'Structured corporate management, cross-border operations, and business strategy.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'नेतृत्व विकास एवं परिवर्तन प्रबंधन (XLRI)' : 'Leadership Development & Change Management (XLRI)'}
                    </strong>
                    <span>
                      {isHi ? 'एशिया के शीर्ष प्रबंधन संस्थान से कार्यकारी नेतृत्व क्रेडेंशियल।' : 'Executive leadership credentials from one of Asia\'s most prestigious management institutions.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'पूर्व वाइस प्रेसिडेंट (VP) एवं बिजनेस हेड' : 'Former Vice President & Business Head'}
                    </strong>
                    <span>
                      {isHi ? 'रिलायंस रिटेल, मेट्रो कैश एंड कैरी, और एनआईएफ फूड में शीर्ष कार्यकारी नेतृत्व।' : 'Executive leadership tenures at Reliance Retail, Metro Cash & Carry, and NIF Food.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">
                      {isHi ? 'व्यावहारिक कॉर्पोरेट वास्तु अभ्यास' : 'Strategic Corporate Vastu Practice'}
                    </strong>
                    <span>
                      {isHi ? 'प्राचीन वास्तु को अंधविश्वास से मुक्त कर कार्यक्षमता, नेतृत्व संतुलन और व्यावसायिक सफलता की व्यावहारिक रणनीति बनाना।' : 'Translating ancient Vastu from abstract dogma into actionable strategy for productivity, leadership alignment, and retail throughput.'}
                    </span>
                  </div>
                </li>
              </ul>

              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs leading-relaxed">
                <strong className="font-semibold block mb-1">
                  {isHi ? 'VIAR के छात्रों के लिए यह क्यों महत्वपूर्ण है:' : 'Why this matters to Viar students:'}
                </strong>
                {isHi
                  ? 'कक्षाओं में किसी भी प्रकार का अंधविश्वास या काल्पनिक भय नहीं सिखाया जाता। प्रत्येक विषय को खगोलीय गणित, मनोवैज्ञानिक अंतर्दृष्टि और व्यावहारिक धरातल पर तार्किक रूप से सिखाया जाता है।'
                  : 'Classes are not taught with vague superstitions or fatalistic warnings. Every concept is taught with astronomical mathematics, psychological nuance, and pragmatic real-world grounding.'}
              </div>
            </div>

          </div>
        </div>

        {/* Visual Credentials & Recognition Gallery */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              {isHi ? 'सत्यापित दृश्य प्रमाण' : 'Verified Visual Proof'}
            </h2>
            <h3 className="text-3xl font-extrabold text-white">
              {isHi ? 'प्रमाण-पत्र एवं सम्मान दीर्घा' : 'Credentials & Recognition Gallery'}
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              {isHi
                ? 'आपका एस्ट्रो अभिलेखागार से आधिकारिक प्रमाण पत्र, पुरस्कार और परंपरा दस्तावेज।'
                : 'Official certificates, awards, and lineage documentation from Aapka Astro archives.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CREDENTIAL_GALLERY.map((item, index) => (
              <div
                key={index}
                onClick={() => setActiveModalImg(item)}
                className="cosmic-card p-4 rounded-2xl border border-white/10 hover:border-amber-500/40 transition group cursor-pointer"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/40 relative mb-4">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                    <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                      <span>{isHi ? 'पूरा प्रमाणपत्र देखने के लिए क्लिक करें' : 'Click to view full credential'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.institution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for viewing credential images */}
        {activeModalImg && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveModalImg(null)}
          >
            <div
              className="bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-3xl w-full p-4 sm:p-6 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModalImg(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-xl overflow-hidden bg-black mb-4">
                <Image
                  src={activeModalImg.src}
                  alt={activeModalImg.title}
                  fill
                  sizes="800px"
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">{activeModalImg.title}</h3>
                <p className="text-sm text-amber-300">{activeModalImg.institution}</p>
              </div>
            </div>
          </div>
        )}

        {/* The 3 Educational Pillars of Viar */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              {isHi ? 'हमारे मुख्य मानक' : 'Our Core Standards'}
            </h2>
            <h3 className="text-3xl font-extrabold text-white">
              {isHi ? 'विहंगम संस्थान की विशिष्टता' : 'How Vihangam Institute Differs'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Compass className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">
                {isHi ? 'गणितीय सटीकता' : 'Mathematical Rigor'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? 'हम सतही भविष्यवाणियों के बजाय वास्तविक अयनांश, ग्रहीय अक्षांश-देशांतर और खगोलीय चक्रों का अध्ययन करते हैं।'
                  : 'We study Sidereal zodiacs, Ayanamsha mechanics, planetary longitude, and actual astronomical cycles rather than vague generic horoscopes.'}
              </p>
            </div>

            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Users className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">
                {isHi ? 'स्व-अध्ययन में पूर्णता' : 'Self-Paced Mastery'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? '23 संरचित वीडियो मॉड्यूल 24/7 आपकी सुविधानुसार उपलब्ध, विस्तृत नोट्स और वास्तविक कुंडली केस स्टडीज के साथ।'
                  : '23 structured video modules accessible 24/7 at your own speed, with comprehensive notes, real chart walkthroughs, and dedicated academic Q&A support.'}
              </p>
            </div>

            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              <Award className="w-10 h-10 text-amber-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">
                {isHi ? 'सत्यापन योग्य प्रमाणपत्र' : 'Verifiable Credential'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? '20 प्रश्नों की अंतिम परीक्षा उत्तीर्ण कर आचार्य नीरज कुमार द्वारा हस्ताक्षरित और viar.in/verify पर सत्यापन योग्य आधिकारिक प्रमाणपत्र प्राप्त करें।'
                  : 'Earn an authentic graduate certificate backed by a 20-question examination, signed by Acharya Niraj Kumar and verifiable at viar.in/verify.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cross-Platform Ecosystem Callout */}
        <div className="p-8 rounded-3xl bg-[#090d16] border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 mb-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Image
                src="/images/aapkaastro-logo.png"
                alt="Aapka Astro"
                width={48}
                height={48}
                className="h-10 w-auto object-contain brightness-110"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {isHi ? 'क्या आप व्यक्तिगत परामर्श की तलाश में हैं?' : 'Looking for Personal Consultation Instead?'}
              </h3>
              <p className="text-sm text-slate-300 max-w-2xl">
                {isHi
                  ? 'यदि आप आचार्य नीरज कुमार से व्यक्तिगत जन्मकुंडली विश्लेषण, विवाह मिलान या कॉर्पोरेट वास्तु परामर्श चाहते हैं, तो हमारी सहयोगी संस्था आपका एस्ट्रो (+91 93112 15564) पर संपर्क करें।'
                  : 'If you seek personal horoscope readings, marriage matching, or corporate advisory with Acharya Niraj Kumar, explore sister platform Aapka Astro (+91 93112 15564) or submit an executive corporate advisory inquiry.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={SISTER_SERVICES.aapkaAstro.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Aapka Astro (opens in a new tab)"
              className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <span>AapkaAstro.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={SISTER_SERVICES.dowConsulting.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit DOW Consulting (opens in a new tab)"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#6D28D9] dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <Image
                src="/images/dowconsulting-logo.png"
                alt="DOW Consulting"
                width={56}
                height={18}
                className="h-4 w-auto object-contain brightness-110"
              />
              <span>{isHi ? 'कॉर्पोरेट परामर्श पूछताछ' : 'Corporate Advisory Inquiries'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/courses/what-is-astrology"
            className="gold-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-amber-500/20"
          >
            <span>{isHi ? 'आचार्य नीरज कुमार के साथ सेल्फ-पेस्ड मास्टरक्लास देखें' : 'Explore Self-Paced Masterclass with Acharya Niraj Kumar'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
