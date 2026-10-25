'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { UserCourseStatusResult } from '@/lib/courses/enrollmentTypes';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  Calendar,
  Clock,
  Globe,
  ArrowRight,
  UserCheck,
  LogIn
} from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/components/LanguageContext';
import { buildStudentWhatsAppClaimUrl } from '@/lib/payments/upi';

interface CheckoutCourse {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  priceInr: number;
  originalPriceInr?: number;
  highlights?: string[];
  totalClasses?: number;
  acceptingEnrollments?: boolean;
}

interface OrderRecord {
  id: string;
  orderReference: string;
  amount: number;
  currency: string;
  status: 'PENDING_PAYMENT' | 'PAYMENT_CLAIMED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REFUNDED';
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone: string;
  utr?: string | null;
  claimedAt?: string | null;
  expiresAt: string;
}

interface CheckoutOrderResponse {
  success: boolean;
  order: OrderRecord;
  upiUri: string;
  qrCodeUrl: string;
  staticQrUrl: string | null;
  settings: {
    upiId: string;
    payeeName: string;
    whatsappNumber: string;
    orderExpiryDays: number;
  };
}

interface CheckoutClientProps {
  cohortId: string;
  initialStatus?: UserCourseStatusResult | null;
  currentUser?: { id?: string; name?: string | null; email?: string | null; phone?: string | null } | null;
}

export default function CheckoutClient({ cohortId: propCohortId, initialStatus, currentUser: propUser }: CheckoutClientProps) {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const cohortId = propCohortId || (params?.cohortId as string) || 'cohort-wia-batch-1';

  // Auth & Student State
  const [isAuthLoading, setIsAuthLoading] = useState(!propUser);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(propUser));
  const [currentUser, setCurrentUser] = useState(propUser || null);

  // Course State
  const [course, setCourse] = useState<CheckoutCourse | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('');

  // Active Order State (Server-Locked Price & Order Reference)
  // Active Order State (Server-Locked Price & Order Reference)
  const [orderData, setOrderData] = useState<CheckoutOrderResponse | null>(() => {
    if (initialStatus?.order) {
      return {
        success: true,
        order: initialStatus.order as unknown as OrderRecord,
        upiUri: `upi://pay?pa=9310709233m@pnb&pn=Vihangam%20Institute%20of%20Astrology%20and%20Research&am=${initialStatus.order.amount}&cu=INR&tn=${encodeURIComponent(initialStatus.order.orderReference)}`,
        qrCodeUrl: '/images/upi-qr.jpg',
        staticQrUrl: '/images/upi-qr.jpg',
        settings: {
          upiId: '9310709233m@pnb',
          payeeName: 'Vihangam Institute of Astrology and Research',
          whatsappNumber: '919311215564',
          orderExpiryDays: 3,
        },
      };
    }
    return null;
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isClaimingPayment, setIsClaimingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopiedUpi, setIsCopiedUpi] = useState(false);
  const [isCopiedRef, setIsCopiedRef] = useState(false);

  useEffect(() => {
    if (initialStatus?.state === 'ENROLLED') {
      router.replace(`/dashboard/courses/${cohortId}`);
    }
  }, [initialStatus, cohortId, router]);

  // 1. Initial Load: Auth check and Course lookup
  useEffect(() => {
    // Check authentication via /api/users/sync
    fetch('/api/users/sync')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setIsLoggedIn(true);
          setCurrentUser(data.user);
          if (data.user.name) setFullName(data.user.name);
          if (data.user.email) setEmail(data.user.email);
          if (data.user.phone) setPhone(data.user.phone);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });

    // Fetch course details
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        const courses = (data?.courses || []) as CheckoutCourse[];
        const found = courses.find(
          (c) => c.id === cohortId || c.slug === cohortId || c.slug === 'what-is-astrology'
        ) || (courses[0] as CheckoutCourse | undefined);
        setCourse(found || null);
      })
      .catch(() => {
        setCourse(null);
      });
  }, [cohortId]);

  // 2. Automatically generate / lock order once user & course are ready
  const initOrder = React.useCallback(async (phoneToUse?: string) => {
    if (!course || course.acceptingEnrollments === false) return;
    const cleanPhone = (phoneToUse || phone).trim();
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 10) {
      return; // Wait for student to provide phone number
    }

    setIsCreatingOrder(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          cohortId: 'what-is-astrology',
          studentName: fullName.trim() || undefined,
          studentEmail: email.trim() || undefined,
          studentPhone: cleanPhone,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        if (data.code === 'ALREADY_ENROLLED') {
          router.replace(`/dashboard/courses/${cohortId}`);
          return;
        }
        if (data.code === 'ORDER_EXISTS' && data.order) {
          setOrderData({
            success: true,
            order: data.order,
            upiUri: data.upiUri || `upi://pay?pa=9310709233m@pnb&pn=Vihangam%20Institute%20of%20Astrology%20and%20Research&am=${data.order.amount}&cu=INR&tn=${encodeURIComponent(data.order.orderReference)}`,
            qrCodeUrl: '/images/upi-qr.jpg',
            staticQrUrl: '/images/upi-qr.jpg',
            settings: data.settings || {
              upiId: '9310709233m@pnb',
              payeeName: 'Vihangam Institute of Astrology and Research',
              whatsappNumber: '919311215564',
              orderExpiryDays: 3,
            },
          });
          if (data.order?.utr) setUtr(data.order.utr);
          return;
        }
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize order.');
      }

      setOrderData(data);
      if (data.order?.utr) setUtr(data.order.utr);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not lock order price.');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [course, phone, fullName, email, notes, cohortId, router]);

  // Trigger order init when phone is pre-filled from user profile
  useEffect(() => {
    if (isLoggedIn && course && phone && !orderData && !isCreatingOrder) {
      initOrder(phone);
    }
  }, [isLoggedIn, course, phone, orderData, isCreatingOrder, initOrder]);

  // Copy helper
  const handleCopy = (text: string, type: 'upi' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setIsCopiedUpi(true);
      setTimeout(() => setIsCopiedUpi(false), 2500);
    } else {
      setIsCopiedRef(true);
      setTimeout(() => setIsCopiedRef(false), 2500);
    }
  };

  // Student clicks "I have paid"
  const handleClaimPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderData?.order?.id) {
      setErrorMsg(language === 'hi' ? 'कृपया पहले अपना फोन नंबर दर्ज करें।' : 'Please enter your phone number to generate order.');
      return;
    }

    setIsClaimingPayment(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/orders/${orderData.order.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: utr.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit payment claim.');
      }

      // Update local order data to PAYMENT_CLAIMED status
      setOrderData((prev) => prev ? { ...prev, order: data.order } : null);

      // Open WhatsApp with prefilled message in a new window/tab
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit payment confirmation.');
    } finally {
      setIsClaimingPayment(false);
    }
  };

  // Loading state
  if (isAuthLoading || !course) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin mb-4" />
          <p className="text-slate-300 text-sm">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  // 2.5 ADMISSIONS PAUSED: When acceptingEnrollments is false, block checkout and redirect to WhatsApp
  if (course.acceptingEnrollments === false) {
    return (
      <div className="cosmic-bg min-h-screen py-16 flex items-center justify-center px-4">
        <div className="cosmic-card p-8 rounded-3xl border border-amber-500/30 max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
              {language === 'hi' ? 'प्रवेश अस्थायी रूप से स्थगित' : 'Admissions Currently Paused'}
            </span>
            <h1 className="text-2xl font-black text-white">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {language === 'hi'
                ? 'इस पाठ्यक्रम के लिए ऑनलाइन चेकआउट एवं नया पंजीकरण वर्तमान में बंद है। आगामी बैच की तिथियों व सीट उपलब्धता हेतु आचार्य जी से व्हाट्सएप पर संपर्क करें।'
                : 'Online registration and automated checkout are currently paused for this course. Please contact Acharya Niraj Kumar directly on WhatsApp to enquire about upcoming admissions.'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`https://wa.me/919311215564?text=${encodeURIComponent(
                language === 'hi'
                  ? `नमस्ते आचार्य जी, मैं "${course.title}" पाठ्यक्रम में प्रवेश हेतु पूछताछ करना चाहता/चाहती हूँ।`
                  : `Hello Acharya Ji, I would like to enquire about admissions for "${course.title}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl text-center font-black text-sm block shadow-lg shadow-emerald-500/20 tracking-wide uppercase bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'व्हाट्सएप पर पूछताछ करें' : 'Enquire on WhatsApp'}</span>
            </a>

            <Link
              href={`/courses/${course.slug}`}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              ← {language === 'hi' ? 'पाठ्यक्रम विवरण पर वापस जाएं' : 'Back to Course Details'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. MUST BE LOGGED IN: If not logged in, prompt sign in
  if (!isLoggedIn) {
    return (
      <div className="cosmic-bg min-h-screen py-16 flex items-center justify-center px-4">
        <div className="cosmic-card p-8 rounded-3xl border border-white/10 max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              {language === 'hi' ? 'नामांकन के लिए लॉगिन आवश्यक है' : 'Please Sign In to Enroll'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {language === 'hi'
                ? 'पाठ्यक्रम में नामांकन करने और अपनी छात्र पहचान सुरक्षित रखने के लिए कृपया पहले अपने खाते में लॉगिन करें।'
                : 'To lock your enrollment and link your course vault to your personal student account, please sign in or register below.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{course.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>₹{(course.priceInr || 5100).toLocaleString('en-IN')} INR • One-Time Tuition</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant course unlock upon Owner payment verification</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/login?redirect=/checkout/${cohortId}`}
              className="gold-button flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In with Account'}</span>
            </Link>
            <Link
              href={`/signup?redirect=/checkout/${cohortId}`}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>{language === 'hi' ? 'नया खाता बनाएं' : 'Create Free Account'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tuitionInr = orderData?.order?.amount || course.priceInr || 5100;
  const originalInr = course.originalPriceInr || 11000;
  const savingsInr = originalInr - tuitionInr;
  const orderRef = orderData?.order?.orderReference || 'Generating...';
  const orderStatus = orderData?.order?.status || 'PENDING_PAYMENT';
  const whatsappNumber = orderData?.settings?.whatsappNumber || '919311215564';
  const upiId = orderData?.settings?.upiId || '9310709233m@pnb';
  const payeeName = orderData?.settings?.payeeName || 'Vihangam Institute of Astrology and Research';
  const isClaimed = orderStatus === 'PAYMENT_CLAIMED';
  const isApproved = orderStatus === 'APPROVED';

  const outsideIndiaWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello, I am interested in enrolling in *${course.title}* from outside India. Please share international payment options.`
  )}`;

  return (
    <div className="cosmic-bg min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
                  {/* Rejection Alert Banner if applicable */}
          {initialStatus?.state === 'ORDER_REJECTED' && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Previous Verification Not Completed</span>
              </div>
              <p className="leading-relaxed">
                Reason from Acharya Niraj Kumar: <strong>{initialStatus.rejectionReason}</strong>. You may generate a fresh order reference below.
              </p>
            </div>
          )}

        {/* Language Switcher Bar */}
        <div className="flex justify-end mb-6">
          <LanguageSwitcher />
        </div>

        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'सीधा सुरक्षित UPI QR भुगतान' : 'Zero-Commission Direct UPI QR Checkout'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {t('checkout.title', 'Complete Your Enrollment')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            {language === 'hi'
              ? 'बिना किसी गेटवे कमीशन के सीधा UPI QR से भुगतान करें। आचार्य जी द्वारा सत्यापन के बाद आपका पाठ्यक्रम सक्रिय हो जाएगा।'
              : 'Direct peer-to-peer tuition payment with 0% gateway deductions. Verified directly by Acharya Niraj Kumar.'}
          </p>
        </div>

        {/* Outside India Callout Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5 text-sky-200">
            <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>{language === 'hi' ? 'भारत से बाहर हैं?' : 'Outside India?'}</strong> {language === 'hi' ? 'अंतर्राष्ट्रीय भुगतान विकल्पों के लिए व्हाट्सएप पर संदेश भेजें।' : 'Message us on WhatsApp for international payment options.'}
            </span>
          </div>
          <a
            href={outsideIndiaWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shrink-0 transition flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'hi' ? 'व्हाट्सएप करें' : 'Message on WhatsApp'}</span>
          </a>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 max-w-3xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* STATUS SCREEN: When order is PAYMENT_CLAIMED */}
        {isClaimed && (
          <div className="mb-10 p-6 sm:p-8 rounded-3xl cosmic-card border-2 border-amber-500/50 bg-[#0d101a] max-w-3xl mx-auto text-center space-y-5 shadow-2xl shadow-amber-500/10">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                {language === 'hi' ? 'भुगतान सत्यापन के लिए प्राप्त हुआ' : 'Payment Received for Verification'}
              </h2>
              <p className="text-sm font-semibold text-amber-300 mt-2 max-w-xl mx-auto leading-relaxed">
                {language === 'hi'
                  ? 'सत्यापन की पुष्टि होने के बाद आपको पाठ्यक्रम तक पहुंच प्राप्त होगी।'
                  : 'You will get access once it is confirmed.'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                {language === 'hi'
                  ? 'बैंक रिकॉर्ड में राशि जमा की पुष्टि होते ही आचार्य जी आपके खाते को अनलॉक कर देंगे।'
                  : 'Acharya Niraj Kumar will cross-reference your bank credit in the verification studio to activate your portal.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-left max-w-md mx-auto space-y-2 font-mono">
              <div className="text-slate-400 flex justify-between">
                <span>Order Reference:</span>
                <span className="text-amber-300 font-bold">{orderRef}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Student:</span>
                <span className="text-white font-bold">{fullName || currentUser?.name}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Amount:</span>
                <span className="text-emerald-400 font-bold">₹{tuitionInr.toLocaleString('en-IN')} INR</span>
              </div>
              {orderData?.order?.utr && (
                <div className="text-slate-400 flex justify-between">
                  <span>UTR / Ref ID:</span>
                  <span className="text-white font-bold">{orderData.order.utr}</span>
                </div>
              )}
              <div className="text-slate-400 flex justify-between">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Awaiting Bank Verification</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href={orderData?.settings ? buildStudentWhatsAppClaimUrl({
                  ownerPhone: whatsappNumber,
                  studentName: fullName || currentUser?.name || 'Student',
                  studentPhone: phone || currentUser?.phone || '',
                  courseTitle: course.title,
                  amount: tuitionInr,
                  orderReference: orderRef,
                  utr: utr || orderData?.order?.utr,
                }) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{language === 'hi' ? 'व्हाट्सएप पर स्क्रीनशॉट भेजें' : 'Send Screenshot on WhatsApp'}</span>
              </a>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-1.5 transition"
              >
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 text-center max-w-lg mx-auto">
              <strong>✨ {language === 'hi' ? 'खाता पहुंच:' : 'Account Access:'}</strong> {language === 'hi' ? 'सत्यापन के बाद आपका यही लॉगिन पाठ्यक्रम अनलॉक कर देगा। व्हाट्सएप पर कोई अलग पासवर्ड नहीं भेजा जाता।' : 'Your existing login will unlock the course once verified. No separate passwords will be sent.'}
            </div>
          </div>
        )}

        {/* STATUS SCREEN: When order is APPROVED */}
        {isApproved && (
          <div className="mb-10 p-6 sm:p-8 rounded-3xl cosmic-card border-2 border-emerald-500/50 bg-[#07130f] max-w-3xl mx-auto text-center space-y-5 shadow-2xl shadow-emerald-500/20">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                {language === 'hi' ? 'आपका नामांकन सक्रिय हो चुका है!' : 'Your Enrollment is Active!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
                {language === 'hi'
                  ? 'आचार्य जी द्वारा आपके भुगतान की पुष्टि कर दी गई है। आप तुरंत सभी वीडियो पाठ और नोट्स देख सकते हैं।'
                  : 'Your payment has been verified by the academy. Full course content is unlocked in your dashboard.'}
              </p>
            </div>

            <Link
              href="/dashboard"
              className="gold-button inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-amber-500/20"
            >
              <span>{language === 'hi' ? 'डैशबोर्ड में अध्ययन शुरू करें' : 'Start Learning in Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* MAIN CHECKOUT FORM (when order is PENDING_PAYMENT or not yet claimed) */}
        {!isClaimed && !isApproved && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Step 1 (UPI QR Code) & Step 2 (Form) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Scan QR Code */}
              <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
                      1
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {language === 'hi' ? '1. QR कोड स्कैन करके भुगतान करें' : '1. Scan UPI QR Code to Pay'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {language === 'hi'
                          ? 'अपने मोबाइल के किसी भी UPI ऐप से यह QR कोड स्कैन करें।'
                          : 'Pre-fills ₹5,100 tuition and carries your unique order reference.'}
                      </p>
                    </div>
                  </div>
                  {orderData?.order && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                      {orderRef}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code Canvas / Image */}
                  <div className="p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/10 border-2 border-amber-400/50 shrink-0 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={orderData?.staticQrUrl || '/images/upi-qr.jpg'}
                      alt="VIAR UPI QR Code"
                      width={220}
                      height={220}
                      className="w-[200px] h-[200px] rounded-lg object-contain mx-auto"
                    />
                    <div className="mt-2 text-center">
                      <span className="text-[11px] font-mono font-black text-slate-900 tracking-wider">
                        ₹{tuitionInr.toLocaleString('en-IN')} INR
                      </span>
                    </div>
                  </div>

                  {/* UPI Details & Mobile CTA */}
                  <div className="space-y-4 w-full">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        {language === 'hi' ? 'अकादमी UPI ID' : 'Academy UPI ID'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs sm:text-sm font-bold text-amber-300 truncate">
                          {upiId}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(upiId, 'upi')}
                          className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 transition flex items-center gap-1.5"
                          title="Copy UPI ID"
                        >
                          {isCopiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span className="hidden sm:inline">{isCopiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Payee Name
                      </label>
                      <p className="text-xs text-white font-medium">
                        {payeeName}
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Order Reference (Locked)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-300 px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20">
                          {orderRef}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(orderRef, 'ref')}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {isCopiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopiedRef ? 'Copied' : 'Copy Ref'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Deep link button on Mobile */}
                    <a
                      href={orderData?.upiUri || `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${tuitionInr}&cu=INR&tn=${encodeURIComponent(orderRef)}`}
                      className="gold-button w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{language === 'hi' ? 'UPI ऐप में खोलें और भुगतान करें' : 'Pay in UPI App (GPay / PhonePe / Paytm)'}</span>
                    </a>

                    <p className="text-[11px] text-slate-400">
                      {language === 'hi'
                        ? 'स्वीकृत ऐप्स: Google Pay, PhonePe, Paytm, BHIM, Cred एवं सभी बैंक UPI।'
                        : 'Accepted Apps: Google Pay, PhonePe, Paytm, BHIM, Cred, and all bank UPI apps.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Student Details & "I have paid" Form */}
              <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10">
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-6">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {language === 'hi' ? '2. छात्र विवरण एवं भुगतान पुष्टि' : '2. Student Details & Payment Confirmation'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {language === 'hi' ? 'सत्यापन के लिए अपना फोन नंबर और 12 अंकों का UTR दर्ज करें।' : 'Collect phone number and submit your UTR so Acharya Niraj Kumar can verify.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleClaimPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {language === 'hi' ? 'पूरा नाम' : 'Full Name'} <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {language === 'hi' ? 'ईमेल पता' : 'Email Address'} <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. student@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {language === 'hi' ? 'मोबाइल नंबर (आवश्यक)' : 'Mobile Phone (Required)'} <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (!orderData && e.target.value.replace(/[^0-9]/g, '').length >= 10) {
                            initOrder(e.target.value);
                          }
                        }}
                        onBlur={() => {
                          if (!orderData && phone.replace(/[^0-9]/g, '').length >= 10) {
                            initOrder(phone);
                          }
                        }}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-amber-400/40 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                      />
                      <p className="text-[10px] text-amber-300/80 mt-1">
                        Required for verification & WhatsApp confirmation.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {language === 'hi' ? 'UPI Transaction ID / UTR संख्या (वैकल्पिक)' : 'UPI Transaction ID / UTR Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="e.g. 426019827361 (12 digits)"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'hi'
                        ? 'यह संख्या आपके Google Pay / PhonePe / बैंक भुगतान रसीद में 12 अंकों की UTR / UPI Ref ID के रूप में होती है।'
                        : 'Found on your banking receipt as the 12-digit UPI Ref ID / UTR number.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {language === 'hi' ? 'अतिरिक्त टिप्पणी' : 'Additional Notes (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Paid via Google Pay from HDFC account"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  {/* Direct Verification Guarantee Notice */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'hi' ? 'सीधा बैंक सत्यापन गारंटी' : 'Direct Bank Record Verification Guarantee'}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {language === 'hi'
                        ? 'आपका भुगतान सीधे संस्थान के बैंक खाते में प्राप्त होता है। बटन दबाने पर यह सत्यापन कतार में दर्ज हो जाएगा और व्हाट्सएप खुलेगा।'
                        : 'Your tuition reaches the academy account directly. Clicking "I have paid" alerts the Owner and opens WhatsApp with your pre-filled details.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isClaimingPayment || isCreatingOrder}
                    className="gold-button w-full py-4 rounded-xl font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition uppercase tracking-wide"
                  >
                    {isClaimingPayment ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>{language === 'hi' ? 'सत्यापन के लिए भेजा जा रहा है...' : 'Recording Payment Claim...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{language === 'hi' ? 'मैंने भुगतान कर दिया है (I have paid)' : 'I Have Paid — Submit for Verification'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* RIGHT: Order Summary & Inclusions */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-[#0b0f1a] space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-white/10">
                  {language === 'hi' ? 'पाठ्यक्रम सारांश' : 'Enrollment Summary'}
                </h3>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-snug">{course.title}</h4>
                    <p className="text-xs text-amber-300 mt-0.5">Acharya Niraj Kumar</p>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Instant Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>23 HD Video Modules + 2 Bonus Workshops</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>100% Self-Paced • Learn on Any Device</span>
                  </div>
                </div>

                {/* Tuition Calculation */}
                <div className="space-y-2 text-xs text-slate-400 pb-4 border-b border-white/10">
                  <div className="flex justify-between">
                    <span>Standard Academy Tuition</span>
                    <span className="line-through">₹{originalInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Masterclass Inaugural Discount (54% OFF)</span>
                    <span>- ₹{savingsInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Tuition Due</span>
                    <span className="text-[11px] text-emerald-400">Zero Gateway Commission</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-amber-300">
                      ₹{tuitionInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 block">INR (One-Time)</span>
                  </div>
                </div>

                {/* Order Expiry Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                  <strong>Locked Price:</strong> This order reference locks your tuition at ₹{tuitionInr.toLocaleString('en-IN')}. Unpaid orders expire in {orderData?.settings?.orderExpiryDays || 3} days.
                </div>

                {/* Helpline Info */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Admissions WhatsApp Helpline</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Have questions about payment or enrollment? Chat directly with the academy admissions desk:
                  </p>
                  <div className="font-mono text-emerald-400 font-bold">
                    +{whatsappNumber}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}


