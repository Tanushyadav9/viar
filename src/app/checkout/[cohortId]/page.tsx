'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  CreditCard,
  Calendar,
  Clock,
  Globe,
  AlertCircle
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { Course, Cohort } from '@/lib/types';
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const cohortId = params?.cohortId as string;
  const initialCurrency = (searchParams?.get('currency') as 'INR' | 'USD') || 'INR';

  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD'>(initialCurrency);
  const [paymentGateway, setPaymentGateway] = useState<'RAZORPAY' | 'STRIPE'>('RAZORPAY');
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const targetCohort = ViarStore.getCohortById(cohortId) || ViarStore.getCohorts()[0];
    if (targetCohort) {
      setCohort(targetCohort);
      const targetCourse = ViarStore.getCourseById(targetCohort.courseId);
      if (targetCourse) setCourse(targetCourse);
    }
    const tz = ViarStore.getTimezone() || getUserLocalTimezone();
    setUserTz(tz);

    // Default student demo filler
    setFullName('Aarav Sharma');
    setEmail('aarav.sharma@example.com');
    setPhone('+91 98765 43210');
  }, [cohortId]);

  const handleCurrencyChange = (newCurr: 'INR' | 'USD') => {
    setCurrency(newCurr);
    setPaymentGateway(newCurr === 'INR' ? 'RAZORPAY' : 'STRIPE');
  };

  const handleEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setErrorMsg('Please enter your full name and valid email address.');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);

    // Simulate gateway checkout modal / processing
    setTimeout(() => {
      const price = currency === 'INR' ? (course?.priceInr || 14999) : (course?.priceUsd || 199);
      const paymentMethod = paymentGateway === 'RAZORPAY' ? 'UPI / Netbanking (Razorpay)' : 'International Card (Stripe)';

      ViarStore.createEnrollment({
        studentName: fullName,
        studentEmail: email,
        courseId: course?.id || 'course-what-is-astrology',
        cohortId: cohort?.id || 'cohort-wia-batch-1',
        amount: price,
        currency,
        paymentMethod,
      });

      setIsProcessing(false);
      // Redirect straight to student dashboard with success param
      router.push('/dashboard?enrolled=true');
    }, 1200);
  };

  if (!course || !cohort) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin mb-4" />
          <p className="text-slate-300">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  const amount = currency === 'INR' ? course.priceInr : course.priceUsd;
  const originalAmount = currency === 'INR' ? course.originalPriceInr : course.originalPriceUsd;

  return (
    <div className="cosmic-bg min-h-screen py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Complete Your Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            One-time tuition for lifetime access to the 18 live classes, HD recordings, materials, and final certification.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form: Student Details & Payment Method */}
          <div className="lg:col-span-7 cosmic-card p-6 sm:p-8 rounded-2xl border border-white/10">
            
            <form onSubmit={handleEnrollment} className="space-y-6">
              
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Choose Currency & Region
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('INR')}
                    className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                      currency === 'INR'
                        ? 'border-amber-500 bg-amber-500/10 text-white font-bold'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-sm">₹ INR (India)</p>
                      <p className="text-[11px] text-slate-400">UPI, Netbanking, Cards</p>
                    </div>
                    <span className="text-base font-extrabold text-amber-400">₹{course.priceInr.toLocaleString()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('USD')}
                    className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                      currency === 'USD'
                        ? 'border-amber-500 bg-amber-500/10 text-white font-bold'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-sm">$ USD (Global)</p>
                      <p className="text-[11px] text-slate-400">International Cards</p>
                    </div>
                    <span className="text-base font-extrabold text-amber-400">${course.priceUsd}</span>
                  </button>
                </div>
              </div>

              {/* Student Details */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  2. Student Information (For Certificate & Class Access)
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Full Name (Will appear on your certificate)</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email Address (Live class Zoom links sent here)</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone / WhatsApp (For batch SMS & reminders)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Gateway Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  3. Payment Method
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => setPaymentGateway(currency === 'INR' ? 'RAZORPAY' : 'STRIPE')}
                    className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {currency === 'INR' ? 'Razorpay Secure Checkout' : 'Stripe Global Checkout'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {currency === 'INR'
                            ? 'Instant UPI (GPay, PhonePe, Paytm), Netbanking, Debit & Credit'
                            : 'Visa, Mastercard, Amex, Apple Pay'}
                        </p>
                      </div>
                    </div>
                    <span className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="gold-button w-full py-4 rounded-xl font-bold text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Processing Secure Enrollment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Pay {currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount}`} & Begin Immersion
                    </span>
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-[11px] text-slate-400">
                  By completing payment, you agree to Viar.in course policies. No recurring charges.
                </p>
              </div>

            </form>

          </div>

          {/* Right Summary: Order & Schedule breakdown */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="cosmic-card p-6 rounded-2xl border border-white/10 bg-[#0b0f1a]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-white/10 mb-4">
                Order Summary
              </h3>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{course.title}</h4>
                  <p className="text-xs text-amber-300">{cohort.batchName}</p>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-1.5 mb-4">
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Starts: {formatInTimezone(cohort.startDate, userTz, 'short')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>18 Live Masterclasses (Saturdays & Sundays)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Synced to: {userTz}</span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs text-slate-400 pb-4 border-b border-white/10">
                <div className="flex justify-between">
                  <span>Standard Tuition</span>
                  <span className="line-through">
                    {currency === 'INR' ? `₹${originalAmount.toLocaleString()}` : `$${originalAmount}`}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Cohort 01 Launch Discount</span>
                  <span>
                    - {currency === 'INR' ? `₹${(originalAmount - amount).toLocaleString()}` : `$${originalAmount - amount}`}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total Due Today</span>
                <span className="text-2xl font-black text-amber-400">
                  {currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount}`}
                </span>
              </div>
            </div>

            {/* Guarantee / Lineage Note */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>The Viar.in Learning Guarantee</span>
              </p>
              <p className="leading-relaxed text-slate-400">
                Attending live and watching recordings are treated equally. You will have full access to study materials, session notes, and final exam certification at any time.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="cosmic-bg min-h-screen flex items-center justify-center p-4">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
