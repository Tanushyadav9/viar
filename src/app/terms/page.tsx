'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function TermsPage() {
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
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'शैक्षणिक नियमावली' : 'Academic Agreement'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {isHi ? 'सेवा की शर्तें एवं विद्यार्थी समझौता' : 'Terms of Service & Student Agreement'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {isHi
              ? 'विहंगम ज्योतिष एवं अनुसंधान संस्थान (viar.in) में किसी भी पाठ्यक्रम में प्रवेश लेने अथवा नामांकन करने से पूर्व कृपया इन शर्तों को ध्यानपूर्वक पढ़ें।'
              : 'Please read these terms carefully before enrolling in any course or using the Vihangam Institute of Astrology and Research platform.'}
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span>{isHi ? 'अंतिम संशोधन: अक्टूबर 2026' : 'Last Updated: October 2026'}</span> • <span>VIAR &amp; Aapka Astro Network</span>
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
                ? 'यह दस्तावेज viar.in पर प्रत्यक्ष UPI भुगतान, मैनुअल बैंक सत्यापन, छात्र डेटा संग्रहण और धनवापसी प्रक्रियाओं के संचालन नियमों को रेखांकित करता है। यह मसौदा औपचारिक कानूनी समीक्षा के अधीन है।'
                : 'This operational document outlines the terms governing direct UPI payments, manual bank verification, student data collection, and refund handling on viar.in pending formal legal counsel review.'}
            </p>
          </div>
        </div>

        {/* Main Terms Content */}
        <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8 text-slate-300 text-sm leading-relaxed">
          
          {/* Section 1: Acceptance */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              {isHi ? 'शर्तों की स्वीकृति' : 'Acceptance of Agreement'}
            </h2>
            <p>
              {isHi ? (
                <>
                  <strong>viar.in</strong> (विहंगम ज्योतिष एवं अनुसंधान संस्थान) पर किसी भी कार्यक्रम में प्रवेश लेने अथवा उपयोग करने से आप इन सेवा की शर्तों, गोपनीयता नीति और धनवापसी नीति से पूर्णतः बंधे रहने की सहमति देते हैं।
                </>
              ) : (
                <>
                  By visiting, accessing, or enrolling in any program on <strong>viar.in</strong> (&ldquo;Site&rdquo; or &ldquo;Vihangam Institute of Astrology and Research&rdquo;), you agree to comply with and be bound by these Terms of Service (&ldquo;Terms&rdquo;), along with our Privacy Policy and Refund Policy.
                </>
              )}
            </p>
          </section>

          {/* Section 2: Direct UPI Payment & Manual Verification */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              {isHi ? 'प्रत्यक्ष UPI भुगतान एवं मैनुअल सत्यापन प्रक्रिया' : 'Direct UPI Payment & Manual Bank Verification'}
            </h2>
            <p>
              {isHi ? (
                <>
                  कमीशन शुल्क से बचने और विद्यार्थियों को न्यूनतम शिक्षण शुल्क (₹5,100 INR) उपलब्ध कराने के उद्देश्य से, सभी भुगतान संस्थान की अधिकृत UPI आईडी (<code>aapkaastro@okaxis</code> / आचार्य नीरज कुमार) पर प्रत्यक्ष रूप से प्राप्त किए जाते हैं।
                </>
              ) : (
                <>
                  To eliminate third-party gateway commissions and provide students with optimal tuition rates (₹5,100 INR), all tuition is received strictly via direct UPI QR payment or bank transfer to the Academy&apos;s authorized UPI ID (<code>aapkaastro@okaxis</code> / Acharya Niraj Kumar).
                </>
              )}
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{isHi ? 'सत्यापन नियम एवं बैंक प्रमाण' : 'Verification Rules & Bank Proof Requirement'}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  {isHi
                    ? 'भुगतान करने के पश्चात छात्र "मैंने भुगतान कर दिया है" बटन पर क्लिक करके अपना 12 अंकों का लेनदेन संदर्भ (UTR) दर्ज करते हैं और व्हाट्सएप (+91 93112 15564) पर स्क्रीनशॉट भेजते हैं।'
                    : 'After scanning and completing UPI payment, students click "I Have Paid", provide the 12-digit transaction reference (UTR), and transmit the payment screenshot via WhatsApp to +91 93112 15564.'}
                </li>
                <li>
                  {isHi
                    ? 'स्क्रीनशॉट में संपादन संभव होने के कारण, संस्थान केवल बैंक खाते अथवा UPI ऐप में राशि जमा होने की प्रत्यक्ष प्रविष्टि का मिलान करने के उपरांत ही पाठ्यक्रम सक्रिय करता है।'
                    : 'Because digital screenshots can be edited, approval strictly requires the Academy to verify incoming bank or UPI statement credit matching the order reference and UTR. The bank credit is the proof of payment.'}
                </li>
                <li>
                  {isHi
                    ? 'धोखाधड़ी रोकने हेतु एक ही UTR को दो भिन्न ऑर्डरों में स्वीकृत नहीं किया जा सकता है।'
                    : 'Duplicate UTR protection strictly prevents the same bank transaction reference from being credited or approved across multiple student orders.'}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Required Data Collection */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              {isHi ? 'अनिवार्य विद्यार्थी डेटा संग्रहण' : 'Required Student Data Collection'}
            </h2>
            <p>
              {isHi
                ? 'चेकआउट और नामांकन के समय निम्नलिखित विवरण अनिवार्य रूप से एकत्र किए जाते हैं:'
                : 'During order initiation and checkout, the following student information is collected:'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="font-bold text-white mb-1">{isHi ? 'पूरा कानूनी नाम' : 'Full Legal Name'}</div>
                <div className="text-slate-400">{isHi ? 'आधिकारिक सत्यापन योग्य प्रमाणपत्र पर मुद्रण हेतु।' : 'For cryptographic completion certificate issuance.'}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="font-bold text-white mb-1">{isHi ? 'ईमेल पता' : 'Email Address'}</div>
                <div className="text-slate-400">{isHi ? 'विद्यार्थी पोर्टल लॉगिन एवं शैक्षणिक अधिसूचनाओं हेतु।' : 'For student portal authentication and academic notices.'}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="font-bold text-white mb-1">{isHi ? 'व्हाट्सएप / फोन नंबर' : 'Phone / WhatsApp'}</div>
                <div className="text-slate-400">{isHi ? 'भुगतान सत्यापन मिलान एवं त्वरित छात्र सहायता हेतु।' : 'Required for payment matching, claim review, and support.'}</div>
              </div>
            </div>
          </section>

          {/* Section 4: Zero Password Transmission */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              {isHi ? 'सुरक्षित प्रवेश एवं शून्य पासवर्ड प्रेषण नीति' : 'Zero-Password Course Access Security'}
            </h2>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isHi ? 'व्हाट्सएप पर कभी कोई पासवर्ड नहीं भेजा जाता' : 'No Passwords Are Ever Sent Over WhatsApp'}</span>
              </div>
              <p>
                {isHi
                  ? 'सुरक्षा कारणों से व्हाट्सएप पर कभी कोई पासवर्ड या अस्थाई क्रेडेंशियल नहीं भेजे जाते। आचार्य नीरज कुमार द्वारा बैंक खाते में भुगतान की पुष्टि होते ही, संस्थान डेटाबेस में आपके मौजूदा लॉगिन खाते पर पाठ्यक्रम स्वतः अनलॉक हो जाता है।'
                  : 'For account security and privacy, no separate student portal credentials or temporary passwords are ever generated or transmitted over WhatsApp or unencrypted channels. Once payment is verified by the Owner, the course vault automatically unlocks on the student\'s existing account at viar.in/dashboard.'}
              </p>
            </div>
          </section>

          {/* Section 5: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              {isHi ? 'बौद्धिक संपदा एवं सामग्री संरक्षण' : 'Intellectual Property & Content Protection'}
            </h2>
            <p>
              {isHi
                ? 'आचार्य नीरज कुमार द्वारा रचित 23 वीडियो व्याख्यान, अध्ययन नोट्स, खगोलीय गणनाएं और व्यावहारिक कार्यशालाएं विहंगम ज्योतिष एवं अनुसंधान संस्थान की विशिष्ट बौद्धिक संपदा हैं। किसी भी सामग्री की अनधिकृत रिकॉर्डिंग अथवा वितरण कानूनी अपराध है।'
                : 'All 23 structured video lectures, downloadable notes, calculation sheets, and case study breakdowns developed by Acharya Niraj Kumar are the proprietary intellectual property of VIAR. Unauthorized redistribution, recording, or re-selling is strictly prohibited.'}
            </p>
          </section>

          {/* Section 6: Refund Handling */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">6</span>
              {isHi ? 'धनवापसी नियम एवं प्रक्रिया' : 'Refund Handling via Direct UPI'}
            </h2>
            <p>
              {isHi
                ? 'धनवापसी अनुरोध संस्थान की धनवापसी नीति के अनुसार प्रत्यक्ष UPI/NEFT के माध्यम से 5-7 कार्यदिवसों में छात्र के मूल बैंक खाते में प्रेषित किए जाते हैं, जिसमें कोई मध्यस्थ कटौती नहीं होती। धनवापसी के साथ ही विद्यार्थी पोर्टल पर पाठ्यक्रम प्रवेश रद्द कर दिया जाता है।'
                : 'Eligible refunds are processed directly via UPI / NEFT back to the student\'s originating bank account within 5–7 business days with zero gateway fee deductions, in accordance with our Refund Policy. Upon refund issuance, course enrollment is revoked in the database.'}
            </p>
          </section>

          {/* Section 7: Jurisdiction & Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">7</span>
              {isHi ? 'अधिकार क्षेत्र एवं संपर्क' : 'Governing Law & Legal Desk'}
            </h2>
            <p>
              {isHi
                ? 'ये शर्तें भारत के कानूनों के अनुसार शासित हैं। किसी भी विवाद का अधिकार क्षेत्र नई दिल्ली/गुरुग्राम न्यायालय होगा।'
                : 'These Terms are governed by the laws of India, subject to the jurisdiction of competent courts in New Delhi / Gurugram, India.'}
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <div className="font-semibold text-white">Vihangam Institute of Astrology and Research Academic Desk</div>
              <div>Email: <a href="mailto:ask@aapkaastro.com" className="text-amber-400 underline">ask@aapkaastro.com</a></div>
              <div>WhatsApp Support: +91 93112 15564</div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
