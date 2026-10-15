'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle, ArrowLeft, ShieldCheck, Mail, Phone } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function RefundPolicyPage() {
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
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'शुल्क एवं धनवापसी नीति' : 'Academic Tuition Policy'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {isHi ? 'धनवापसी एवं रद्दीकरण नीति' : 'Refund & Cancellation Policy'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isHi
              ? 'प्रत्यक्ष UPI भुगतान, 100% सीधी वापसी और छात्र संतुष्टि के लिए स्पष्ट एवं पारदर्शी नियम।'
              : 'Transparent, student-friendly terms for direct UPI tuition payments, milestone windows, and manual refund processing.'}
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>{isHi ? 'अंतिम संशोधन: अक्टूबर 2026' : 'Last Updated: October 2026'}</span> • <span>VIAR Admissions &amp; Finance Desk</span>
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
                ? 'यह दस्तावेज viar.in पर प्रत्यक्ष UPI शिक्षण शुल्क की धनवापसी प्रक्रिया, पात्रता अवधि और खाता मिलान के नियमों को स्पष्ट करता है। यह मसौदा औपचारिक कानूनी समीक्षा के अधीन है।'
                : 'This operational document outlines the criteria for direct UPI tuition refunds, eligibility milestones, and bank reconciliation on viar.in pending formal legal counsel review.'}
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1: Scope */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              {isHi ? 'उद्देश्य एवं संदर्भ' : 'Scope & Course Format'}
            </h2>
            <p>
              {isHi
                ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (viar.in) आचार्य नीरज कुमार के मार्गदर्शन में 23 संरचित ऑन-डिमांड वीडियो मॉड्यूल, अध्ययन नोट्स और व्यावहारिक कार्यशालाएं प्रदान करता है।'
                : 'Vihangam Institute of Astrology and Research delivers 23 structured on-demand video masterclasses in Vedic Jyotish under the direction of Acharya Niraj Kumar. All tuition is paid directly via UPI without intermediary gateway commissions.'}
            </p>
          </section>

          {/* Section 2: Direct UPI Refund Handling */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              {isHi ? 'प्रत्यक्ष UPI धनवापसी नियम (शून्य मध्यस्थ शुल्क)' : 'Direct UPI Refund Handling (Zero Gateway Fees)'}
            </h2>
            <p>
              {isHi
                ? 'पारंपरिक पेमेंट गेटवे 2% से 3% शुल्क काटते हैं, किंतु viar.in पर प्रत्यक्ष UPI के कारण स्वीकृत धनवापसी 100% पूरी राशि के साथ सीधे छात्र के मूल बैंक खाते में वापस भेजी जाती है।'
                : 'Because payments are processed directly via UPI rather than commission-charging gateways, all approved refunds are returned 100% in full without third-party processing fee deductions.'}
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
              <div className="font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'धनवापसी प्रक्रिया एवं सत्यापन' : 'Refund Protocol & Database Revocation'}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  {isHi
                    ? 'छात्र को अपना ऑर्डर संदर्भ संख्या, 12 अंकों का UTR और पंजीकृत फोन नंबर ask@aapkaastro.com अथवा व्हाट्सएप (+91 93112 15564) पर प्रेषित करना होता है।'
                    : 'The student submits their refund request specifying Order Reference, original 12-digit UTR, and registered phone number to ask@aapkaastro.com or WhatsApp (+91 93112 15564).'}
                </li>
                <li>
                  {isHi
                    ? 'आचार्य नीरज कुमार द्वारा बैंक खाते में मूल जमा का मिलान कर 48 घंटों में अनुमोदन किया जाता है।'
                    : 'Acharya Niraj Kumar verifies the original bank credit entry within 48 hours.'}
                </li>
                <li>
                  {isHi
                    ? 'धनवापसी होते ही संस्थान डेटाबेस में छात्र का नामांकन REVOKED (रद्द) के रूप में चिह्नित हो जाता है और 5-7 कार्यदिवसों में राशि प्रेषित हो जाती है।'
                    : 'Upon processing, the student Enrollment record is marked REVOKED in PostgreSQL, and funds are dispatched via direct UPI / NEFT within 5–7 business days.'}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: 7-Day Satisfaction Guarantee */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              {isHi ? '7-दिवसीय संतुष्टि गारंटी अवधि' : '7-Day Satisfaction Review Window'}
            </h2>
            <p>
              {isHi
                ? 'यदि नामांकन के 7 दिनों के भीतर और पहले 3 मॉड्यूल देखने के पश्चात आपको लगता है कि यह पाठ्यक्रम आपकी अपेक्षाओं के अनुरूप नहीं है, तो आप बिना किसी झंझट के 100% पूर्ण धनवापसी का अनुरोध कर सकते हैं।'
                : 'If, within 7 calendar days of your verified enrollment and having viewed no more than the first three (3) video modules, you find the teaching methodology unsuitable, you may request a 100% full tuition refund.'}
            </p>
          </section>

          {/* Section 4: Post-Review Window */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              {isHi ? 'समीक्षा अवधि के पश्चात की नीति' : 'Post-Review Window Policy'}
            </h2>
            <p>
              {isHi
                ? '7 दिन बीत जाने अथवा 3 से अधिक मॉड्यूल देखने/अध्ययन सामग्री डाउनलोड कर लेने के उपरांत कोई मौद्रिक धनवापसी देय नहीं होगी। व्यक्तिगत आकस्मिक स्थिति में छात्र आगामी बैच में स्थानांतरण हेतु आवेदन कर सकते हैं।'
                : 'Once the 7-day window has elapsed or more than three modules/downloadable materials have been accessed, monetary refunds cannot be issued. In verified medical or family emergencies, a student may petition for a one-time enrollment transfer to a future cohort.'}
            </p>
          </section>

          {/* Section 5: Contact Desk */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              {isHi ? 'धनवापसी सहायता डेस्क' : 'Refund Support Desk'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Email Admissions</div>
                  <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">WhatsApp Finance Desk</div>
                  <a href="https://wa.me/919311215564" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">+91 93112 15564</a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
