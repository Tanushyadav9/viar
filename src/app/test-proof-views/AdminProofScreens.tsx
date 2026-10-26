'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Send,
  Trash2,
} from 'lucide-react';

interface AdminProofScreenProps {
  view: string;
}

export default function AdminProofScreens({ view }: AdminProofScreenProps) {
  const isHi = view.endsWith('-hi');
  const baseView = view.replace(/-en$|-hi$/, '');

  // Bilingual UI dictionary
  const t = {
    headerTitle: isHi
      ? 'पाठ्यक्रम मॉड्यूल, 1-on-1 व्यक्तिगत कक्षाएं, नामांकित छात्र, भुगतान और वेबसाइट सामग्री का प्रबंधन करें।'
      : 'Manage curriculum modules, 1-on-1 personal classes, enrolled students, payments, and site content.',
    ownerTag: isHi ? 'संस्थान स्वामी प्रशासन' : 'Site Owner Anchor',
    authenticated: isHi ? 'प्रमाणित: aapkaastro1606@gmail.com' : 'Authenticated: aapkaastro1606@gmail.com',
    tabs: {
      home: isHi ? 'होम' : 'Home',
      course: isHi ? 'पाठ्यक्रम' : 'Course',
      students: isHi ? 'छात्र' : 'Students',
      payments: isHi ? 'भुगतान' : 'Payments',
      sessions: isHi ? 'व्यक्तिगत सत्र' : 'Sessions',
      reports: isHi ? 'रिपोर्ट्स' : 'Reports',
      questions: isHi ? 'प्रश्न' : 'Questions',
      content: isHi ? 'वेबसाइट सामग्री' : 'Site content',
      settings: isHi ? 'सेटिंग्स' : 'Settings',
    },
    enrolmentOff: isHi ? 'नामांकन बंद हैं (चेकलिस्ट आवश्यक)' : 'Accepting Enrolments: OFF (Readiness Check Required)',
    tuitionVerified: isHi ? 'सत्यापित कुल शुल्क' : 'Total Verified Tuition',
    activeStudents: isHi ? 'सक्रिय छात्र' : 'Active Students',
    lessonsCount: isHi ? '46 पाठ (0 में वीडियो)' : '46 Lessons (0 with a video)',
    examReady: isHi ? '20 में से 20 परीक्षा प्रश्न सक्रिय' : '20 of 20 exam questions active (Target: 20)',
    auditTitle: isHi ? 'गतिविधि और ऑडिट ट्रेल' : 'Recent Activity & Audit Trail',
    needsConfirmation: isHi ? 'पुष्टि आवश्यक' : 'Needs confirmation',
    testBadge: isHi ? 'परीक्षण डेटा' : 'Test',
  };

  const navItems = [
    { id: 'admin-home', label: t.tabs.home },
    { id: 'admin-course', label: t.tabs.course },
    { id: 'admin-students', label: t.tabs.students },
    { id: 'admin-payments', label: t.tabs.payments },
    { id: 'admin-sessions', label: t.tabs.sessions },
    { id: 'admin-reports', label: t.tabs.reports },
    { id: 'admin-questions', label: t.tabs.questions },
    { id: 'admin-content', label: t.tabs.content },
    { id: 'admin-settings', label: t.tabs.settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Top Admin Header */}
      <div className="border-b border-white/10 bg-slate-900/90 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {/* Environment Indicator Badge: PRODUCTION (red) / STAGING (grey) */}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                PRODUCTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t.ownerTag}
              </span>
              <span className="text-xs text-slate-400 font-mono">{t.authenticated}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">{t.headerTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रणाली सुरक्षित' : 'Zero Jargon Engine'}</span>
            </span>
          </div>
        </div>

        {/* 8 Standard Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-white/5 py-1.5">
          {navItems.map((tab) => {
            const isActive =
              baseView === tab.id ||
              (baseView.includes('modal') && tab.id === 'admin-home');
            return (
              <div
                key={tab.id}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* =========================================================================
            1. ADMIN HOME HUB
        ========================================================================= */}
        {baseView === 'admin-home' && (
          <div className="space-y-6">
            {/* Launch Status Banner */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="font-bold text-amber-300 text-sm sm:text-base">{t.enrolmentOff}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isHi
                    ? 'पाठ्यक्रम नामांकन सुरक्षित रूप से बंद हैं। लाइव सक्रिय करने से पहले 5-बिंदु लॉन्च चेकलिस्ट आवश्यक है।'
                    : 'Online checkout is safely closed. Enrolments switch ON only after passing the 5-point launch readiness checklist.'}
                </p>
              </div>

              <button className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition shadow">
                {isHi ? 'लॉन्च चेकलिस्ट देखें' : 'Review Launch Checklist'}
              </button>
            </div>

            {/* Metric KPI Cards (Real Data, 0 Inflation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <p className="text-xs text-slate-400">{t.tuitionVerified}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">₹0</span>
                  <span className="text-[11px] text-amber-400 font-medium">({isHi ? 'परीक्षण आदेश अलग' : 'Test order isolated'})</span>
                </div>
                <p className="text-[11px] text-slate-500">{isHi ? 'परीक्षण डेटा आंकड़े नहीं बढ़ाता' : 'Test purchases never inflate revenue'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <p className="text-xs text-slate-400">{t.activeStudents}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">0</span>
                  <span className="text-[11px] text-slate-400">({isHi ? 'वास्तविक छात्र' : 'Real scholars'})</span>
                </div>
                <p className="text-[11px] text-slate-500">{isHi ? 'केवल स्वामी द्वारा स्वीकृत छात्र' : 'Access granted only upon approval'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <p className="text-xs text-slate-400">{isHi ? 'पाठ्यक्रम मॉड्यूल व पाठ' : 'Modules & Content'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">23</span>
                  <span className="text-[11px] text-amber-400 font-semibold">{t.lessonsCount}</span>
                </div>
                <p className="text-[11px] text-slate-500">{isHi ? 'सच्ची गणना: कोई झूठे वादे नहीं' : 'Truthful counts: 0 published without video'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
                <p className="text-xs text-slate-400">{isHi ? 'प्रमाणीकरण परीक्षा तैयारी' : 'Certification Exam'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">20 / 20</span>
                  <span className="text-[11px] text-emerald-300 font-semibold">({isHi ? 'तैयार' : 'Target reached'})</span>
                </div>
                <p className="text-[11px] text-slate-500">{t.examReady}</p>
              </div>
            </div>

            {/* Audit Trail Section */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{t.auditTitle}</span>
                </h4>
                <span className="text-xs text-slate-400">{isHi ? '6/6 परिचालन क्रियाएं रिकॉर्ड' : '6/6 Actions Wired'}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    action: 'ORDER_APPROVED',
                    title: isHi ? 'भुगतान सत्यापित व स्वीकृत' : 'Payment Approved & Verified',
                    detail: 'Order VIAR-ORD-REAL-001 • ₹5,100 INR verified via Bank UTR',
                    time: '10m ago',
                  },
                  {
                    action: 'ENROLLMENTS_DISABLED',
                    title: isHi ? 'नामांकन बंद किए गए' : 'Course Enrolments Switched OFF',
                    detail: 'Launch readiness safety check active; content verification pending',
                    time: '1h ago',
                  },
                  {
                    action: 'LESSON_UNPUBLISHED',
                    title: isHi ? 'पाठ प्रारूप (Draft) में रखा गया' : 'Lesson Kept in Draft',
                    detail: 'Lesson "Introduction to Rashis" lacks video stream URL',
                    time: '2h ago',
                  },
                  {
                    action: 'PAYMENT_SETTINGS_UPDATED',
                    title: isHi ? 'भुगतान सेटिंग्स अद्यतित' : 'Payment Settings Updated',
                    detail: 'Verified UPI ID 9310709233m@pnb and WhatsApp notifications',
                    time: '1d ago',
                  },
                ].map((log, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {log.action}
                        </span>
                        <span className="font-bold text-white">{log.title}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{log.detail}</p>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. COURSE MANAGEMENT TAB
        ========================================================================= */}
        {baseView === 'admin-course' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">What is Astrology? Masterclass</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {isHi ? 'नामांकन बंद' : 'Enrolments Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isHi
                      ? '23 मॉड्यूल • 46 कुल पाठ (0 वीडियो संलग्न) • 1-on-1 व्यक्तिगत मार्गदर्शन'
                      : '23 Modules • 46 Total Lessons (0 with a video) • 1-on-1 Personal Mentorship'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/15">
                    {isHi ? 'पाठ्यक्रम विवरण संपादित करें' : 'Edit Course Details'}
                  </button>
                  <button className="px-3.5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400">
                    {isHi ? 'नया पाठ जोड़ें' : 'Add Lesson'}
                  </button>
                </div>
              </div>

              {/* Certification Exam Readiness Card */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h5 className="font-bold text-sm text-emerald-300">
                      {isHi ? 'प्रमाणीकरण परीक्षा तैयारी: 20 प्रश्न तैयार' : 'Certification Exam Readiness: 20 Questions Active'}
                    </h5>
                    <p className="text-xs text-slate-300">
                      {isHi
                        ? 'लक्ष्य (20 प्रश्न) पूरा हो गया है। छात्र 23 मॉड्यूल पूरे करने के बाद परीक्षा दे सकेंगे।'
                        : 'Target of 20 questions reached. Passing threshold: 75%.'}
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400">
                  {isHi ? 'प्रश्न प्रबंधक खोलें' : 'Question Manager'}
                </button>
              </div>

              {/* Lesson Items with Content Enforcement */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isHi ? 'मॉड्यूल 1: ज्योतिष का परिचय (सामग्री स्थिति)' : 'Module 1: Foundations of Vedic Astrology (Content Status)'}
                </h5>

                {[
                  {
                    num: '1.1',
                    title: 'Origins of Jyotish & Cosmic Clock',
                    status: 'DRAFT',
                    reason: isHi ? 'प्रारूप — वीडियो उपलब्ध नहीं (वीडियो आवश्यक)' : 'Draft — Missing video (Video required to publish)',
                  },
                  {
                    num: '1.2',
                    title: 'The 12 Bhavas and Human Destiny',
                    status: 'DRAFT',
                    reason: isHi ? 'प्रारूप — वीडियो उपलब्ध नहीं' : 'Draft — Missing video',
                  },
                  {
                    num: '1.3',
                    title: 'Foundational Reference PDF',
                    status: 'DRAFT',
                    reason: isHi ? 'प्रारूप — नोट्स फ़ाइल आवश्यक' : 'Draft — Missing notes or PDF document',
                  },
                ].map((les, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-amber-400 font-bold">{les.num}</span>
                      <div>
                        <p className="font-bold text-sm text-white">{les.title}</p>
                        <p className="text-xs text-amber-400/90 font-medium">{les.reason}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {les.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. STUDENTS ROSTER TAB
        ========================================================================= */}
        {baseView === 'admin-students' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">{isHi ? 'नामांकित छात्र रोस्टर' : 'Enrolled Students Roster'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isHi ? 'परीक्षण खाते लेबल किए गए हैं और आंकड़ों से बाहर रखे गए हैं।' : 'Test records clearly badged and isolated from live metrics.'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">{isHi ? 'छात्र नाम' : 'Student Name'}</th>
                      <th className="p-3">{isHi ? 'ईमेल' : 'Email'}</th>
                      <th className="p-3">{isHi ? 'स्थिति' : 'Status'}</th>
                      <th className="p-3">{isHi ? 'प्रगति' : 'Progress'}</th>
                      <th className="p-3 text-right">{isHi ? 'कार्रवाई' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="p-3 font-bold text-white">Tanush Yadav</td>
                      <td className="p-3 text-slate-300">tanushyadav0987@gmail.com</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">0% (0 / 46)</td>
                      <td className="p-3 text-right">
                        <button className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-[11px]">
                          {isHi ? 'विवरण' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    <tr className="bg-amber-500/5">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <span>Parnika Grover</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/40">
                          {t.testBadge}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">parnikagrover88@gmail.com</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          TEST ORDER
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">0%</td>
                      <td className="p-3 text-right space-x-1.5">
                        <span className="text-[10px] text-amber-400 font-semibold">{isHi ? 'परीक्षण डेटा' : 'Test record'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. PAYMENTS & ORDERS TAB
        ========================================================================= */}
        {baseView === 'admin-payments' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">{isHi ? 'शुल्क व भुगतान सत्यापन कतार' : 'Tuition & Payment Orders Queue'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isHi ? 'कुल सत्यापित शुल्क: ₹0 (परीक्षण आदेश अलग रखा गया है)' : 'Total Verified Tuition: ₹0 (Test purchase isolated)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                    UPI: 9310709233m@pnb
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">{isHi ? 'आदेश संदर्भ' : 'Order Ref'}</th>
                      <th className="p-3">{isHi ? 'छात्र' : 'Student'}</th>
                      <th className="p-3">{isHi ? 'राशि' : 'Amount'}</th>
                      <th className="p-3">{isHi ? 'स्थिति' : 'Status'}</th>
                      <th className="p-3">{isHi ? 'टिप्पणी / टैग' : 'Notes / Tag'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="bg-amber-500/5">
                      <td className="p-3 font-mono font-bold text-amber-400">VIAR-ORD-NO4ND-FHIY</td>
                      <td className="p-3 text-white">Parnika Grover</td>
                      <td className="p-3 font-bold text-white">₹5,100</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {t.testBadge}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        [TEST_PURCHASE] Staging verification test order - excluded from live metrics
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. CONTENT STUDIO TAB
        ========================================================================= */}
        {baseView === 'admin-content' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">{isHi ? 'कंटेंट स्टूडियो — वेबसाइट सामग्री' : 'Content Studio — Public Content'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isHi ? 'अपुष्ट ड्राफ्ट सामग्री "पुष्टि आवश्यक" बैज के साथ चिह्नित है।' : 'Draft copy flagged with Needs Confirmation badge.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Announcement Bar */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white">{isHi ? 'घोषणा पट्टी (Announcement Bar)' : 'Announcement Bar'}</h5>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {t.needsConfirmation}
                    </span>
                  </div>
                  <p className="text-slate-400">Status: <strong className="text-rose-400">OFF (Inactive)</strong></p>
                  <p className="text-slate-500 text-[11px]">{isHi ? 'आजीवन/त्वरित दावों के बिना स्वामी की स्वीकृति तक बंद।' : 'Defaulted off until client confirms text.'}</p>
                </div>

                {/* Campus Location */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white">{isHi ? 'परिसर का पता (Campus Address)' : 'Academy Location'}</h5>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isHi ? 'सत्यापित' : 'Online Institute'}
                    </span>
                  </div>
                  <p className="text-slate-300">Online Institute (Noida office pending confirmation)</p>
                  <p className="text-slate-500 text-[11px]">{isHi ? 'गलत "नई दिल्ली" हटा दिया गया है।' : 'Incorrect New Delhi location corrected.'}</p>
                </div>

                {/* Real Social Media */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white">{isHi ? 'सत्यापित सोशल मीडिया लिंक' : 'Verified Social Links'}</h5>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isHi ? 'सत्यापित' : 'Verified'}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <p>YouTube: youtube.com/@aapkaastro7900</p>
                    <p>Instagram: instagram.com/aapkaastrologer</p>
                    <p>Facebook: facebook.com/aapkaastro</p>
                  </div>
                </div>

                {/* Public Email Verification */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white">{isHi ? 'सार्वजनिक संपर्क ईमेल' : 'Public Contact Email'}</h5>
                    <button className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      <span>{isHi ? 'टेस्ट ईमेल भेजें' : 'Send Test Email'}</span>
                    </button>
                  </div>
                  <p className="text-slate-300 font-mono">contact@viar.in <span className="text-amber-400 text-xs font-semibold">({isHi ? 'पुष्टि आवश्यक' : 'Needs confirmation'})</span></p>
                  <p className="text-slate-500 text-[11px]">{isHi ? 'स्वामी इनबॉक्स सत्यापन उपलब्ध' : 'One-click mailbox test button active.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            6. ENROLMENT READINESS MODAL PROOF
        ========================================================================= */}
        {baseView === 'admin-readiness-modal' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-base text-white">
                    {isHi ? 'लॉन्च तैयारी चेकलिस्ट — नामांकन खोलना' : 'Launch Readiness Checklist — Enable Enrolments'}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                {isHi
                  ? 'नामांकन खोलने से पहले निम्नलिखित सभी 5 शर्तों को पूरा किया जाना चाहिए:'
                  : 'All 5 prerequisites must be verified before student checkout can be opened:'}
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">{isHi ? 'वास्तविक सामग्री वाले पाठ' : 'Lessons with real video content'}</p>
                      <p className="text-rose-300 text-[11px]">{isHi ? '0 / 46 तैयार (46 पाठों में 0 वीडियो)' : '0 of 46 lessons ready (0 with a video)'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase">{isHi ? 'अपूर्ण' : 'Incomplete'}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">{isHi ? 'प्रमाणीकरण परीक्षा प्रश्न' : 'Certification Exam Questions'}</p>
                      <p className="text-emerald-300 text-[11px]">20 / 20 {isHi ? 'प्रश्न सक्रिय' : 'active questions'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{isHi ? 'तैयार' : 'Ready'}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">{isHi ? 'शुल्क व यूपीआई सेटिंग्स' : 'Tuition & Payment Routing'}</p>
                      <p className="text-emerald-300 text-[11px]">₹5,100 INR • 9310709233m@pnb</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{isHi ? 'तैयार' : 'Ready'}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">{isHi ? 'सार्वजनिक संपर्क विवरण' : 'Public Contact & WhatsApp'}</p>
                      <p className="text-emerald-300 text-[11px]">+91 93112 15564 ({isHi ? 'व्हाट्सएप सत्यापित' : 'WhatsApp Verified'})</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{isHi ? 'तैयार' : 'Ready'}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">{isHi ? 'छात्र चेकआउट परीक्षण' : 'End-to-End Student Test Purchase'}</p>
                      <p className="text-emerald-300 text-[11px]">{isHi ? 'परीक्षण पूरा हुआ (सत्यापित)' : 'Staging test verified'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{isHi ? 'तैयार' : 'Ready'}</span>
                </div>
              </div>

              {/* Confirmation Safety Gate */}
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <p className="font-bold">
                  {isHi ? 'चेतावनी: पाठों में कोई वास्तविक वीडियो नहीं हैं।' : 'Safety Guard: Lessons currently have zero videos.'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {isHi
                    ? 'यदि आप अभी भी नामांकन खोलना चाहते हैं, तो पुष्टि के लिए नीचे CONFIRM टाइप करें:'
                    : 'To open enrolments anyway, type CONFIRM in capital letters:'}
                </p>
                <input
                  type="text"
                  placeholder="Type CONFIRM"
                  defaultValue="CONFIRM"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/40 text-amber-300 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button className="px-3.5 py-1.5 rounded-xl bg-white/10 text-slate-300 text-xs font-semibold">
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button className="px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold shadow hover:bg-amber-400">
                  {isHi ? 'पुष्टि करें और नामांकन खोलें' : 'Confirm & Open Enrolments'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            7. TEST DATA PURGE MODAL PROOF
        ========================================================================= */}
        {baseView === 'admin-testdata-modal' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                  <h4 className="font-bold text-base text-white">
                    {isHi ? 'परीक्षण डेटा हटाएं — ड्राई-रन सूची' : 'Remove Test Data — Dry-Run Inventory'}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                {isHi
                  ? 'निम्नलिखित परीक्षण रिकॉर्ड डेटाबेस में पाए गए हैं। वास्तविक आंकड़े कभी नहीं हटाए जाते:'
                  : 'The following test records were discovered in the database. Production data is never touched:'}
              </p>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-white/10 text-slate-400">
                  <span>{isHi ? 'परीक्षण आदेश संदर्भ' : 'Test Order Ref'}</span>
                  <span>{isHi ? 'राशि' : 'Amount'}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-amber-300">
                  <span>VIAR-ORD-NO4ND-FHIY (Parnika Grover)</span>
                  <span>₹5,100 INR</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs space-y-2">
                <p className="font-bold">
                  {isHi ? 'स्थायी रूप से हटाने के लिए DELETE_TEST_DATA टाइप करें:' : 'Type DELETE_TEST_DATA to permanently purge:'}
                </p>
                <input
                  type="text"
                  placeholder="DELETE_TEST_DATA"
                  defaultValue="DELETE_TEST_DATA"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-rose-500/40 text-rose-300 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button className="px-3.5 py-1.5 rounded-xl bg-white/10 text-slate-300 text-xs font-semibold">
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-500">
                  {isHi ? 'परीक्षण डेटा हटाएं' : 'Purge Test Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
