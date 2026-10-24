'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { buildStudentWhatsAppClaimUrl } from '@/lib/payments/upi';

interface OrderItem {
  id: string;
  orderReference: string;
  amount: number;
  currency: string;
  status: string;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone?: string;
  utr?: string | null;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  cohort?: {
    id: string;
    batchName: string;
  };
}

export default function WaitingForApprovalPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string; phone?: string } | null>(null);
  const [pendingOrder, setPendingOrder] = useState<OrderItem | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('919311215564');

  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      // 1. Sync User
      const userRes = await fetch('/api/users/sync');
      if (!userRes.ok) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      const userData = await userRes.json();
      if (userData?.user) {
        setUser(userData.user);
      }

      // 2. Fetch User Orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (data.success && Array.isArray(data.orders)) {
          // Look for latest pending or claimed order
          const claimed = data.orders.find(
            (o: OrderItem) => o.status === 'PAYMENT_CLAIMED' || o.status === 'PENDING_PAYMENT'
          );
          const approved = data.orders.find((o: OrderItem) => o.status === 'APPROVED');

          if (approved && !claimed) {
            setIsApproved(true);
            setPendingOrder(approved);
          } else if (claimed) {
            setPendingOrder(claimed);
          }
        }
      }

      // 3. Fetch payment settings for WhatsApp number
      const settingsRes = await fetch('/api/admin/settings/payment').catch(() => null);
      if (settingsRes && settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData?.settings?.whatsappNumber) {
          setWhatsappNumber(sData.settings.whatsappNumber);
        }
      }
    } catch (err) {
      console.warn('Status check failed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll status every 15 seconds while waiting
    const interval = setInterval(() => {
      checkStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const courseTitle = pendingOrder?.course?.title || 'What is Astrology — Foundations of Vedic Astrology';
  const orderRef = pendingOrder?.orderReference || 'VIAR-PENDING';
  const amount = pendingOrder?.amount || 5100;
  const targetCohortId = pendingOrder?.cohort?.id || 'cohort-wia-batch-1';

  const whatsappUrl = buildStudentWhatsAppClaimUrl({
    ownerPhone: whatsappNumber,
    studentName: user?.name || pendingOrder?.studentName || 'Scholar',
    studentPhone: user?.phone || pendingOrder?.studentPhone || '',
    courseTitle,
    amount,
    orderReference: orderRef,
    utr: pendingOrder?.utr || undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin mb-4" />
          <p className="text-slate-300 text-sm">Checking approval status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center py-16 px-4">
      <div className="cosmic-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-[#0a0d18] shadow-2xl space-y-6">
        {/* Header Icon */}
        <div className="text-center space-y-3">
          {isApproved ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
              {isApproved
                ? language === 'hi' ? 'नामांकन स्वीकृत' : 'ENROLLMENT APPROVED'
                : language === 'hi' ? 'भुगतान सत्यापन प्रक्रिया में' : 'WAITING FOR OWNER APPROVAL'}
            </span>
            <h1 className="text-2xl font-black text-white">
              {isApproved
                ? language === 'hi' ? 'आपका खाता सक्रिय हो गया है!' : 'Your Access is Activated!'
                : language === 'hi' ? 'भुगतान सत्यापन की प्रतीक्षा है' : 'Waiting for Approval'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {isApproved
                ? language === 'hi'
                  ? 'आचार्य नीरज कुमार जी द्वारा आपके भुगतान की पुष्टि कर दी गई है। अब आप कक्षाएं, नोट्स और वीडियो देख सकते हैं।'
                  : 'Acharya Niraj Kumar has confirmed your payment credit. Your course vault is now unlocked.'
                : language === 'hi'
                  ? 'आपका भुगतान विवरण प्राप्त हो गया है। बैंक रिकॉर्ड में जमा राशि की पुष्टि होते ही आचार्य जी आपका खाता सक्रिय कर देंगे।'
                  : 'Your payment proof has been submitted. Acharya Niraj Kumar will cross-reference your bank credit to unlock your portal.'}
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2.5 font-mono">
          <div className="flex justify-between items-center text-slate-400">
            <span>Course / पाठ्यक्रम:</span>
            <span className="text-white font-bold text-right truncate max-w-[200px]">{courseTitle}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Order Reference:</span>
            <span className="text-amber-300 font-bold">{orderRef}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Tuition / शुल्क:</span>
            <span className="text-emerald-400 font-bold">₹{amount.toLocaleString('en-IN')} INR</span>
          </div>
          {pendingOrder?.utr && (
            <div className="flex justify-between items-center text-slate-400">
              <span>UTR / Transaction ID:</span>
              <span className="text-white font-bold">{pendingOrder.utr}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-400">
            <span>Status / स्थिति:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {isApproved ? 'Active / सक्रिय' : 'Pending Verification / सत्यापन प्रतीक्षित'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {isApproved ? (
            <button
              onClick={() => router.push(`/dashboard/courses/${targetCohortId}`)}
              className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'hi' ? 'पाठ्यक्रम पोर्टल में प्रवेश करें' : 'Enter Classroom Vault'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{language === 'hi' ? 'व्हाट्सएप पर संपर्क करें' : 'Send Screenshot on WhatsApp'}</span>
              </a>

              <button
                onClick={() => checkStatus(true)}
                disabled={isRefreshing}
                className="w-full py-3 rounded-2xl font-semibold text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking status...' : 'Check Status Now / स्थिति जांचें'}</span>
              </button>
            </>
          )}
        </div>

        {/* Security / Policy Callout */}
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'सुरक्षित पोर्टल पहुंच' : 'Portal Security Guarantee'}</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[10px]">
            {language === 'hi'
              ? 'सत्यापन के उपरांत आपका यही लॉगिन खाता स्वचालित रूप से पाठ्यक्रम को अनलॉक कर देगा। व्हाट्सएप पर कोई पासवर्ड या गोपनीय लिंक नहीं भेजा जाता।'
              : 'Once verified by Acharya Ji, your current login session will directly unlock the curriculum. No separate credentials are sent via WhatsApp.'}
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/courses"
            className="text-xs text-slate-400 hover:text-white transition"
          >
            ← {language === 'hi' ? 'पाठ्यक्रम सूची पर वापस जाएं' : 'Back to Courses'}
          </Link>
        </div>
      </div>
    </div>
  );
}
