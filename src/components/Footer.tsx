'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Video, Award, Clock, ExternalLink, Phone, Mail } from 'lucide-react';
import { SISTER_SERVICES } from '@/config/services';
import { useLanguage } from '@/components/LanguageContext';
import { COMMON_TIMEZONES, getUserLocalTimezone } from '@/lib/timezones';
import { ViarStore } from '@/lib/store';

export default function Footer() {
  const { isHi } = useLanguage();
  const [selectedTz, setSelectedTz] = React.useState<string>('Asia/Kolkata');

  React.useEffect(() => {
    setSelectedTz(ViarStore.getTimezone() || getUserLocalTimezone());
    const handleTzChange = () => {
      setSelectedTz(ViarStore.getTimezone());
    };
    window.addEventListener('timezone-changed', handleTzChange);
    return () => window.removeEventListener('timezone-changed', handleTzChange);
  }, []);

  const handleTzChange = (tz: string) => {
    setSelectedTz(tz);
    ViarStore.setTimezone(tz);
    window.dispatchEvent(new Event('timezone-changed'));
  };

  return (
    <footer className="border-t border-white/10 bg-[#05070a] text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dedicated "Our Other Services" Section (Requirement 6.6) */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-transparent border border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isHi ? 'सहयोगी मंच' : 'Ecosystem Cross-Promotion'}
                </span>
                <span className="text-xs text-slate-400">
                  {isHi ? 'हमारी अन्य सेवाएं' : 'Our Other Services'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {isHi ? 'परामर्श एवं कॉर्पोरेट सलाहकार सेवाएं' : 'Explore Consultations & Corporate Advisory'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {isHi
                  ? 'व्यक्तिगत कुंडली विश्लेषण अथवा कॉर्पोरेट मुहूर्त परामर्श के लिए आचार्य नीरज कुमार द्वारा स्थापित हमारे सहयोगी मंचों से जुड़ें।'
                  : 'Looking for 1-on-1 private chart readings or corporate muhurta consulting? Connect with our sister platforms founded by Acharya Niraj Kumar.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={SISTER_SERVICES.aapkaAstro.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-2 transition"
              >
                <Image
                  src="/images/aapkaastro-logo.png"
                  alt="Aapka Astro"
                  width={60}
                  height={18}
                  className="h-4 w-auto object-contain brightness-110"
                />
                <span>{SISTER_SERVICES.aapkaAstro.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/contact"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5 transition"
              >
                <span>{isHi ? 'कॉर्पोरेट सलाहकार पूछताछ' : 'Corporate Advisory Inquiries'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust features banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-white/10 mb-12">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isHi ? '23 वीडियो मॉड्यूल' : '23 Video Modules'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'विस्तृत ऑन-डिमांड पाठ्यक्रम + 2 बोनस कुंडली विश्लेषण मास्टरक्लास आजीवन पहुंच के साथ।'
                  : 'Comprehensive on-demand curriculum + 2 bonus chart reading masterclasses with lifetime access.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isHi ? 'अपनी गति से सीखें' : 'Learn at Your Own Pace'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'विश्व में कहीं से भी 100% सेल्फ-पेस्ड। कोई समय-सारिणी या निश्चित समय का दबाव नहीं।'
                  : '100% self-paced from anywhere in the world. No live scheduling conflicts or rigid timetables.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isHi ? 'सत्यापन योग्य प्रमाणन' : 'Verifiable Certification'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'मूल्यांकन परीक्षा उत्तीर्ण करने पर विहंगम ज्योतिष एवं अनुसंधान संस्थान का आधिकारिक प्रमाणपत्र।'
                  : 'Pass the final evaluation to receive an official certificate from Vihangam Institute of Astrology and Research.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isHi ? 'आपका एस्ट्रो परंपरा' : 'Aapka Astro Pedigree'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'aapkaastro.com के संस्थापक आचार्य नीरज कुमार द्वारा प्रत्यक्ष रूप से मार्गदर्शित।'
                  : 'Taught directly by Acharya Niraj Kumar, founder of aapkaastro.com.'}
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 p-1 flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-icon.png"
                  alt="VIAR - Vihangam Institute of Astrology and Research"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block leading-none">
                  VIAR<span className="text-amber-400">.IN</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                  {isHi ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान' : 'Vihangam Institute of Astrology & Research'}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-4">
              {isHi
                ? 'प्रामाणिक, गणितीय और कल्याणकारी वैदिक ज्योतिष शिक्षा के इच्छुक विद्यार्थियों के लिए भारत का अग्रणी ऑनलाइन संस्थान।'
                : 'The premier online astrology academy for students worldwide seeking authentic, mathematical, and compassionate Vedic Jyotish education.'}
            </p>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 max-w-sm">
              <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                <span>{isHi ? 'व्यक्तिगत 1-ऑन-1 परामर्श चाहते हैं?' : 'Looking for private 1-on-1 consultations?'}</span>
              </p>
              <p className="text-slate-400 leading-normal">
                {isHi ? 'हमारे सहयोगी परामर्श मंच पर जाएं: ' : 'Visit our sister consultation practice at '}
                <a 
                  href="https://aapkaastro.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-amber-400 underline font-medium hover:text-amber-300 inline-flex items-center gap-0.5"
                >
                  AapkaAstro.com <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              </p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              {isHi ? 'पाठ्यक्रम' : 'Courses'}
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/courses/what-is-astrology" className="hover:text-amber-400 transition">
                  {isHi ? 'ज्योतिष क्या है (प्रमुख पाठ्यक्रम)' : 'What is Astrology (Flagship)'}
                </Link>
              </li>
              <li>
                <Link href="/courses/vastu-shastra-for-your-home" className="hover:text-amber-400 transition">
                  {isHi ? 'गृह हेतु वास्तु शास्त्र' : 'Vastu Shastra for Your Home'}
                </Link>
              </li>
              <li>
                <Link href="/courses/gemstone-science-101" className="hover:text-amber-400 transition">
                  {isHi ? 'रत्न विज्ञान 101' : 'Gemstone Science 101'}
                </Link>
              </li>
              <li>
                <Link href="/courses/numerology-basics" className="hover:text-amber-400 transition">
                  {isHi ? 'अंक ज्योतिष के मूल तत्व' : 'Numerology Basics'}
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition text-slate-400">
                  {isHi ? 'संपूर्ण कैटलॉग देखें' : 'View Full Catalog'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              {isHi ? 'संस्थान एवं परंपरा' : 'Academy & Lineage'}
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-amber-400 transition">
                  {isHi ? 'आचार्य जी के बारे में' : 'About the Instructor'}
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition">
                  {isHi ? 'संपूर्ण पाठ्यक्रम सूची' : 'Full Course Catalog'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition">
                  {isHi ? 'संपर्क एवं प्रवेश' : 'Contact & Admissions'}
                </Link>
              </li>
              <li>
                <Link href="/instructor" className="hover:text-amber-400 transition text-amber-300">
                  {isHi ? 'मार्गदर्शक सूट' : 'Instructor Suite'}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-sky-300 transition text-slate-400 flex items-center gap-1"
                >
                  <span>{isHi ? 'कॉर्पोरेट सलाहकार पूछताछ' : 'Corporate Advisory Inquiries'}</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              {isHi ? 'छात्र पोर्टल' : 'Student Portal'}
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-amber-400 transition">
                  {isHi ? 'विद्यार्थी डैशबोर्ड' : 'Student Dashboard'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/courses/cohort-wia-batch-1" className="hover:text-amber-400 transition">
                  {isHi ? '23 वीडियो मॉड्यूल एवं मास्टरक्लास' : '23 Video Modules & Masterclasses'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/certificates" className="hover:text-amber-400 transition">
                  {isHi ? 'मेरे प्रमाणपत्र' : 'My Certificates'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/payments" className="hover:text-amber-400 transition">
                  {isHi ? 'खरीद इतिहास एवं रसीदें' : 'Purchase History & Receipts'}
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-amber-400 transition">
                  {isHi ? 'प्रमाणपत्र सत्यापन खोज' : 'Public Certificate Lookup'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              {isHi ? 'संपर्क एवं सोशल मीडिया' : 'Connect & Channels'}
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition flex items-center gap-1.5 text-slate-300 font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+91 93112 15564 ({isHi ? 'व्हाट्सएप' : 'WhatsApp'})</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:aapkaastro1606@gmail.com"
                  className="hover:text-amber-300 transition flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>aapkaastro1606@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/aapkaastrologer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <span>Instagram: @aapkaastrologer</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/aapkaastro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <span>Facebook: /aapkaastro</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@aapkaastro7900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <span>YouTube: @aapkaastro7900</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Trust Policies Navigation */}
        <div className="pt-8 pb-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">
              {isHi ? 'विधिक एवं सुरक्षा नीतियां' : 'Legal & Trust Policies'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
            <Link href="/terms" className="hover:text-amber-400 transition">
              {isHi ? 'सेवा की शर्तें' : 'Terms of Service'}
            </Link>
            <Link href="/privacy-policy" className="hover:text-amber-400 transition">
              {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
            </Link>
            <Link href="/refund-policy" className="hover:text-amber-400 transition">
              {isHi ? 'धनवापसी एवं रद्दीकरण' : 'Refund & Cancellation'}
            </Link>
            <Link href="/disclaimer" className="hover:text-amber-400 transition">
              {isHi ? 'शैक्षणिक अस्वीकरण' : 'Educational Disclaimer'}
            </Link>
            <Link href="/pricing-policy" className="hover:text-amber-400 transition">
              {isHi ? 'मूल्य निर्धारण नीति' : 'Pricing Policy'}
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            {isHi
              ? `© ${new Date().getFullYear()} Viar.in (विहंगम ज्योतिष एवं अनुसंधान संस्थान)। सर्वाधिकार सुरक्षित।`
              : `© ${new Date().getFullYear()} Viar.in (Vihangam Institute of Astrology and Research). All rights reserved.`}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <label htmlFor="footer-tz-select" className="text-slate-400 shrink-0">
                {isHi ? 'समय क्षेत्र:' : 'Timezone:'}
              </label>
              <select
                id="footer-tz-select"
                value={selectedTz}
                onChange={(e) => handleTzChange(e.target.value)}
                className="bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
                aria-label="Display Timezone"
              >
                {COMMON_TIMEZONES.map((t) => (
                  <option key={t.tz} value={t.tz} className="bg-slate-900 text-white">
                    {t.label} ({t.offset})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>{isHi ? 'Aapka Astro नेटवर्क द्वारा संचालित' : 'Powered by Aapka Astro Network'}</span>
              <span>{isHi ? 'सुरक्षित 256-बिट SSL' : 'Secure 256-Bit SSL'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
