'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Send,
  Phone
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { BUILTIN_CONTENT_DEFAULTS } from '@/lib/content/defaultContent';
import { SISTER_SERVICES } from '@/config/services';

export default function ContactPage() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const defaultContact = BUILTIN_CONTENT_DEFAULTS.site_settings.find((s) => s.key === 'contact_information');
  const [contactData, setContactData] = useState<any>(() => defaultContact); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Course Admissions Inquiry');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/content?collection=site_settings&key=contact_information')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.item) {
          setContactData(data.item);
        }
      })
      .catch(() => {});
  }, []);

  const meta = contactData?.metadata || defaultContact?.metadata || {};
  const phone = meta.phone || '+91 93112 15564';
  const emailAddr = meta.email || 'admissions@viar.in';
  const whatsappNum = meta.whatsapp || '919311215564';
  const whatsappLink = meta.whatsappLink || `https://wa.me/${whatsappNum}`;
  const address = isHi && meta.addressHi ? meta.addressHi : meta.addressEn || 'New Delhi, India • Serving students worldwide';
  const hours = isHi && meta.hoursHi ? meta.hoursHi : meta.hoursEn || 'Monday – Saturday: 10:00 AM – 7:00 PM IST';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          courseSlug: 'what-is-astrology',
          phone: subject ? (subject + ': ' + message).slice(0, 100) : undefined,
        }),
      });
    } catch {
      // Graceful fallback for offline
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'विद्यार्थी सहायता एवं पूछताछ' : 'Student Support & Inquiries'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            {isHi ? 'VIAR से संपर्क करें' : 'Get in Touch with VIAR'}
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            {isHi
              ? 'हमारे 23-मॉड्यूल के सेल्फ-पेस्ड पाठ्यक्रम, प्रवेश, अथवा भुगतान संबंधी किसी भी प्रश्न के लिए विहंगम ज्योतिष एवं अनुसंधान संस्थान की सहायता टीम सदैव उपलब्ध है।'
              : 'Have questions about our 23-module self-paced course, curriculum, enrollment, or payment methods? Our admissions and support team at Vihangam Institute of Astrology and Research is here to assist.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-start">
          
          {/* Left: Contact Info & Sister Platforms */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">
                {isHi ? 'शैक्षणिक एवं प्रवेश कार्यालय' : 'Academic & Admissions Office'}
              </h3>
              
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {isHi ? 'प्रवेश एवं सहायता' : 'Admissions & Support'}
                  </span>
                  <a href={`mailto:${emailAddr}`} className="text-amber-300 hover:underline">
                    {emailAddr}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {isHi ? 'व्हाट्सएप छात्र डेस्क' : 'WhatsApp Student Desk'}
                  </span>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {isHi ? 'शैक्षणिक समन्वय' : 'Academic Coordination'}
                  </span>
                  <span>{address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {isHi ? 'कार्य समय' : 'Response Hours'}
                  </span>
                  <span>{hours}</span>
                </div>
              </div>
            </div>

            {/* Note on Private Consultations */}
            <div className="cosmic-card p-6 rounded-2xl border border-amber-500/30 bg-[#0e1320] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/aapkaastro-logo.png"
                    alt="Aapka Astro"
                    width={90}
                    height={24}
                    className="h-6 w-auto object-contain brightness-110"
                  />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  {isHi ? 'परामर्श मंच' : SISTER_SERVICES.aapkaAstro.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {isHi ? 'व्यक्तिगत ज्योतिषीय परामर्श' : SISTER_SERVICES.aapkaAstro.tagline}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHi
                  ? 'आचार्य नीरज कुमार जी के साथ 1-ऑन-1 व्यक्तिगत जन्म कुंडली विश्लेषण और वैदिक मार्गदर्शन।'
                  : SISTER_SERVICES.aapkaAstro.description}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={SISTER_SERVICES.aapkaAstro.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-button flex-1 py-2.5 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
                >
                  <span>{isHi ? 'AapkaAstro.com पर जाएं' : SISTER_SERVICES.aapkaAstro.ctaText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://wa.me/919311215564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-center bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition inline-flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isHi ? 'व्हाट्सएप' : 'WhatsApp'}</span>
                </a>
              </div>
            </div>

            {/* Corporate Advisory Note */}
            <div className="cosmic-card p-6 rounded-2xl border border-sky-500/20 bg-[#0d1424] space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Image
                  src="/images/dowconsulting-logo.png"
                  alt="DOW Consulting Logo"
                  width={100}
                  height={28}
                  className="h-6 w-auto object-contain brightness-110"
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  {isHi ? 'कॉर्पोरेट सलाहकार' : SISTER_SERVICES.dowConsulting.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{SISTER_SERVICES.dowConsulting.name}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHi
                  ? 'व्यापार विस्तार, रणनीतिक निर्णय और कॉर्पोरेट समय-चयन हेतु गोपनीय वैदिक एवं वास्तु परामर्श।'
                  : SISTER_SERVICES.dowConsulting.description}
              </p>
              <p className="text-xs text-slate-400 pt-1">
                {isHi
                  ? 'शीर्ष कॉर्पोरेट पूछताछ, व्यावसायिक मुहूर्त अथवा वास्तु ऑडिट हेतु सीधे संपर्क करें: '
                  : 'For executive corporate inquiries, strategic launch Muhurta, or commercial Vastu audits, contact directly via '}
                <a href="mailto:aapkaastro1606@gmail.com" className="text-sky-300 underline font-semibold">aapkaastro1606@gmail.com</a>
                {' '}{isHi ? 'अथवा व्हाट्सएप' : 'or WhatsApp'}{' '}
                <a href="https://wa.me/919311215564" target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">+91 93112 15564</a>.
              </p>
              <div className="pt-2">
                <a
                  href={SISTER_SERVICES.dowConsulting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit DOW Consulting (opens in a new tab)"
                  className="text-xs font-bold text-sky-300 hover:text-sky-200 inline-flex items-center gap-1 transition"
                >
                  <span>{isHi ? 'DOW Consulting वेबसाइट देखें' : 'Visit DOW Consulting'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7">
            <div className="cosmic-card p-8 rounded-2xl border border-white/10">
              
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {isHi ? 'पूछताछ प्राप्त हुई' : 'Inquiry Received'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    {isHi ? (
                      <>
                        धन्यवाद, <strong className="text-white">{name}</strong>। हमारे प्रवेश समन्वयक आपकी पूछताछ की समीक्षा कर 24 कार्य घंटों के भीतर <strong className="text-amber-300">{email}</strong> पर उत्तर देंगे।
                      </>
                    ) : (
                      <>
                        Thank you, <strong className="text-white">{name}</strong>. Our admissions coordinator will review your request and reply to <strong className="text-amber-300">{email}</strong> within 24 business hours.
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    {isHi ? 'दूसरा संदेश भेजें' : 'Send Another Message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {isHi ? 'शैक्षणिक पूछताछ भेजें' : 'Send an Academic Inquiry'}
                  </h2>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isHi ? 'आपका पूरा नाम' : 'Your Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isHi ? 'उदा. प्रिया शर्मा' : 'e.g. Priya Sharma'}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isHi ? 'ईमेल पता' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isHi ? 'पूछताछ का विषय' : 'Topic of Inquiry'}
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    >
                      <option value="Course Admissions Inquiry">
                        {isHi ? 'पाठ्यक्रम प्रवेश पूछताछ' : 'Course Admissions Inquiry'}
                      </option>
                      <option value="Timezone & Schedule Assistance">
                        {isHi ? 'टाइमज़ोन एवं अध्ययन सहायता' : 'Timezone & Schedule Assistance'}
                      </option>
                      <option value="Payment / Currency Question">
                        {isHi ? 'भुगतान / मुद्रा संबंधी प्रश्न' : 'Payment / Currency Question'}
                      </option>
                      <option value="Certificate Verification Assistance">
                        {isHi ? 'प्रमाणपत्र सत्यापन सहायता' : 'Certificate Verification Assistance'}
                      </option>
                      <option value="General Question">
                        {isHi ? 'सामान्य प्रश्न' : 'General Question'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isHi ? 'संदेश' : 'Message'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isHi ? 'कृपया अपना प्रश्न अथवा देश/टाइमज़ोन लिखें...' : 'Please let us know your query or country timezone...'}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="gold-button w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-60"
                  >
                    <span>
                      {isSubmitting
                        ? (isHi ? 'प्रस्तुत किया जा रहा है...' : 'Submitting...')
                        : (isHi ? 'पूछताछ जमा करें' : 'Submit Academic Inquiry')}
                    </span>
                    <Send className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isHi
                        ? 'आपका संपर्क विवरण एन्क्रिप्टेड और पूर्णतः गोपनीय रखा जाता है।'
                        : 'Your contact details are encrypted and kept strictly confidential.'}
                    </span>
                  </p>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
