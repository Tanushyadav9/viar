'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  return (
    <div className="cosmic-bg min-h-screen py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href={isHi ? '/hi' : '/'}
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHi ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'डेटा सुरक्षा एवं निजता' : 'Student Privacy & Security'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {isHi ? 'गोपनीयता एवं डेटा संरक्षण नीति' : 'Privacy & Data Protection Policy'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isHi
              ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (viar.in) द्वारा विद्यार्थी डेटा, फोन नंबर एवं भुगतान सत्यापन विवरणों के संरक्षण की रूपरेखा।'
              : 'How Vihangam Institute of Astrology and Research collects, uses, and safeguards your student data, phone numbers, and payment verification records.'}
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>{isHi ? 'अंतिम संशोधन: अक्टूबर 2026' : 'Last Updated: October 2026'}</span> • <span>VIAR Data Governance Desk</span>
          </div>
        </div>

        {/* Mandatory Pending Lawyer Review Banner */}
        <div className="mb-10 p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs flex items-start gap-3 shadow-lg shadow-amber-500/5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-black tracking-wide uppercase text-amber-300 text-[11px]">
              ⚠️ PENDING LAWYER REVIEW — DRAFT OPERATIONAL POLICY
            </div>
            <p className="leading-relaxed">
              {isHi
                ? 'यह दस्तावेज viar.in पर चेकआउट के दौरान एकत्र किए जाने वाले विद्यार्थी विवरणों (नाम, ईमेल, फोन नंबर) और UPI लेनदेन संदर्भों की सुरक्षा रूपरेखा को स्पष्ट करता है। यह मसौदा औपचारिक कानूनी समीक्षा के अधीन है।'
                : 'This operational document outlines how student identity details (name, email, phone number) and manual UPI payment references are protected on viar.in pending formal legal counsel review.'}
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1: Commitment */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              {isHi ? 'छात्र गोपनीयता के प्रति हमारी प्रतिबद्धता' : 'Our Commitment to Student Privacy'}
            </h2>
            <p>
              {isHi
                ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (viar.in) में हम मानते हैं कि आध्यात्मिक और वैदिक शिक्षा का आधार विश्वास है। हम आपके व्यक्तिगत विवरणों और अध्ययन प्रगति को पूर्णतः गोपनीय रखते हैं।'
                : 'At Vihangam Institute of Astrology and Research (viar.in), we recognize that trust is the foundation of genuine educational and spiritual study. We hold your personal details, academic progress, and study records in strict confidentiality.'}
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{isHi ? 'शून्य डेटा विक्रय गारंटी:' : 'Zero-Sale Pledge:'}</strong>{' '}
                {isHi
                  ? 'हम किसी भी परिस्थिति में छात्रों का व्यक्तिगत डेटा विज्ञापनदाताओं अथवा तृतीय पक्षों को नहीं बेचते, किराए पर नहीं देते और न ही साझा करते हैं।'
                  : 'We do NOT sell, rent, trade, or monetize student personal data with advertisers or data brokers under any circumstances.'}
              </span>
            </div>
          </section>

          {/* Section 2: Data Collected */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              {isHi ? 'एकत्र किए जाने वाले विद्यार्थी डेटा' : 'Specific Student Data We Collect'}
            </h2>
            <p>
              {isHi
                ? 'चेकआउट एवं शैक्षणिक संचालन हेतु केवल आवश्यक विवरण ही एकत्र किए जाते हैं:'
                : 'We collect only the information necessary to provide an authentic, personalized educational experience:'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">{isHi ? 'नाम एवं पहचान' : 'Full Name & Identity'}</div>
                <p className="text-slate-400">
                  {isHi
                    ? 'विद्यार्थी का पूरा नाम, जो उनके आधिकारिक और सार्वजनिक रूप से सत्यापन योग्य समापन प्रमाणपत्र पर अंकित होता है।'
                    : 'The student\'s full legal name, used for cryptographic course completion certificates (e.g. VIAR-2026-WIA-XXXX).'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">{isHi ? 'ईमेल पता' : 'Email Address'}</div>
                <p className="text-slate-400">
                  {isHi
                    ? 'विद्यार्थी पोर्टल लॉगिन, ऑर्डर रसीद और पाठ्यक्रम प्रगति सूचनाओं के लिए उपयोग किया जाता है।'
                    : 'Used as the primary portal login credential, order receipt notifications, and academic schedule announcements.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">{isHi ? 'व्हाट्सएप / फोन नंबर (अनिवार्य)' : 'WhatsApp / Phone Number (Required)'}</div>
                <p className="text-slate-400">
                  {isHi
                    ? 'चेकआउट के समय अनिवार्य रूप से लिया जाता है। इसका उपयोग ऑर्डर मिलान, व्हाट्सएप पर भुगतान प्रमाण प्राप्त करने और प्रवेश सक्रियण की पुष्टि हेतु किया जाता है।'
                    : 'Required at checkout to correlate the incoming UPI bank credit with the student\'s order, receive payment screenshots on WhatsApp (+91 93112 15564), and confirm enrollment activation.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">{isHi ? 'लेनदेन संदर्भ (UTR) एवं भुगतान प्रमाण' : 'Transaction Reference (UTR) & Proof'}</div>
                <p className="text-slate-400">
                  {isHi
                    ? 'छात्र द्वारा प्रदान की गई 12 अंकों की UTR संख्या और स्क्रीनशॉट केवल बैंक प्रविष्टि के मिलान हेतु उपयोग होते हैं। हम कभी बैंक पासवर्ड अथवा कार्ड विवरण नहीं मांगते।'
                    : 'The 12-digit UTR reference and payment screenshot submitted by the student are used solely to verify bank credits and prevent duplicate claim fraud. We never request banking passwords or card numbers.'}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Data Security */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              {isHi ? 'डेटा सुरक्षा एवं एन्क्रिप्शन' : 'Data Storage & Encryption'}
            </h2>
            <p>
              {isHi
                ? 'सभी विद्यार्थी रिकॉर्ड, ऑर्डर और शैक्षणिक प्रगति सुरक्षित Neon PostgreSQL डेटाबेस में उद्योग-मानक SSL एन्क्रिप्शन के साथ संग्रहीत हैं।'
                : 'All student accounts, orders, and academic milestones are stored in Neon PostgreSQL with industry-standard SSL encryption in transit and at rest.'}
            </p>
          </section>

          {/* Section 4: Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              {isHi ? 'डेटा सहायता एवं संपर्क' : 'Data Privacy Inquiries'}
            </h2>
            <p>
              {isHi
                ? 'अपने व्यक्तिगत डेटा की समीक्षा अथवा संशोधन हेतु संपर्क करें:'
                : 'For privacy inquiries or to review your personal data records, contact:'}
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white">Vihangam Institute of Astrology and Research Data Privacy Officer</div>
              <div>Email: <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a></div>
              <div>Direct Desk: +91 93112 15564</div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
