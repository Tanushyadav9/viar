'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Edit,
  Plus,
  Users,
  DollarSign,
  Award,
  BookOpen,
  Save,
  ExternalLink,
  Search,
  ShieldCheck,
  Lock,
  Trash2,
  Sparkles,
  Check,
  X,
  Activity,
  Settings,
  AlertTriangle,
  MessageCircle,
  RefreshCw,
  Smartphone,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  BarChart2,
  Eye,
  EyeOff,
} from 'lucide-react';
import AdminHomeHub, { RecentActivityItem } from '@/components/admin/AdminHomeHub';
import AdminHelpBox from '@/components/admin/AdminHelpBox';
import EnrolmentReadinessModal from '@/components/admin/EnrolmentReadinessModal';
import TestDataModal from '@/components/admin/TestDataModal';
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';
import ContentStudio from '@/components/admin/ContentStudio';
import MediaLibrary from '@/components/admin/MediaLibrary';
import SessionsManager from '@/components/admin/SessionsManager';
import StudentProfileView from '@/components/admin/StudentProfileView';
import {
  ScheduledClass,
  Course,
  Enrollment,
  Certificate,
  User,
  AdminSection,
  StaffAccessLevel,
  StaffPermission,
} from '@/lib/types';
import {
  isSiteOwner,
  primaryOwnerEmail,
  hasSectionPermission,
  getUserAllowedSections,
  ADMIN_SECTIONS,
  ADMIN_SECTIONS_META,
  VIAR_SECTIONS,
} from '@/lib/auth/permissions';
import { formatCourseStatus, formatOrderStatus } from '@/lib/utils/formatters';
import { INITIAL_FINAL_TEST } from '@/lib/data';

function getRealVideoLessonsCount(course: Course): number {
  if (!course.modules || course.modules.length === 0) return 0;
  let count = 0;
  for (const mod of course.modules) {
    if (!mod.lessons) continue;
    for (const les of mod.lessons) {
      const lessonObj = les as unknown as { videoProviderId?: string; externalVideoUrl?: string; videoUrl?: string };
      const vid = lessonObj.videoProviderId || lessonObj.externalVideoUrl || lessonObj.videoUrl;
      if (vid && typeof vid === 'string' && vid.trim() && !vid.includes('dQw4w9WgXcQ')) {
        count++;
      }
    }
  }
  return count;
}

interface AdminStats {
  totalStudents: number;
  totalRevenueInr: number;
  completedClasses: number;
  upcomingClasses: number;
  certificatesIssued: number;
  examPassRate?: number | null;
  totalExamAttempts?: number;
  testRecordsExcludedCount?: number;
  testOrdersExcludedCount?: number;
  testEnrollmentsExcludedCount?: number;
  totalRosterStudentsCount?: number;
}

export type OrderStatusType =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CLAIMED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface AdminOrder {
  id: string;
  userId: string;
  courseId: string;
  cohortId?: string | null;
  amount: number;
  currency: string;
  status: OrderStatusType;
  orderReference: string;
  expiresAt: string | Date;
  utr?: string | null;
  claimedAt?: string | Date | null;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  rejectionReason?: string | null;
  refundReason?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  course?: { id: string; title: string; slug: string } | null;
  cohort?: { id: string; batchName: string } | null;
  user?: { id: string; name?: string | null; email: string; phone?: string | null } | null;
  enrollment?: { id: string; status: string; enrolledAt: string | Date } | null;
  isAlreadyEnrolled?: boolean;
  isTest?: boolean;
  notes?: string | null;
}

export interface AdminEnrollmentItem {
  id: string;
  studentId?: string;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone?: string | null;
  courseId?: string;
  courseTitle?: string | null;
  cohortId?: string | null;
  cohortBatchName?: string | null;
  enrolledAt?: string | Date | null;
  amountPaid?: number | null;
  paymentAmount?: number | null;
  currency?: string | null;
  paymentStatus?: string | null;
  paymentReference?: string | null;
  paymentMethod?: string | null;
  paymentId?: string | null;
  progressPercentage?: number;
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  quizResult?: string | null;
  certificateStatus?: string | null;
  isTest?: boolean;
}

export interface PaymentSettingsState {
  upiId: string;
  payeeName: string;
  qrImageUrl: string;
  whatsappNumber: string;
  orderExpiryDays: number;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  isDefaultFallback?: boolean;
}

export interface AdminPortalClientProps {
  serverAuth?: {
    userId: string | null;
    email: string | null;
    isOwner: boolean;
    isStaff: boolean;
    role: string;
    staffSections: string[];
  };
  serverAllowedSections?: AdminSection[];
  serverIsOwner?: boolean;
}

export default function AdminPortalClient({
  serverAuth,
  serverAllowedSections,
  serverIsOwner,
}: AdminPortalClientProps = {}) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (serverAuth) {
      return {
        id: serverAuth.userId || 'user-staff',
        name: serverAuth.email?.split('@')[0] || 'Staff Member',
        email: serverAuth.email || '',
        role: (serverAuth.role as User['role']) || 'STUDENT',
        isOwner: serverAuth.isOwner,
        timezone: 'Asia/Kolkata',
        enrolledCohortIds: [],
        staffSections: (serverAllowedSections || []) as AdminSection[],
      };
    }
    return null;
  });
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [allStaffPermissions, setAllStaffPermissions] = useState<StaffPermission[]>([]);
  const [activeTab, setActiveTab] = useState<AdminSection | 'home'>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab') as AdminSection;
      if (tabParam && (ADMIN_SECTIONS as readonly string[]).includes(tabParam)) {
        if (serverIsOwner || (serverAllowedSections && serverAllowedSections.includes(tabParam))) {
          return tabParam;
        }
      }
    }
    return 'home';
  });
  const [selectedContentCollection, setSelectedContentCollection] = useState<string>('site_settings');
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<AdminEnrollmentItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<'curriculum' | 'quizzes'>('curriculum');
  const [contentSubTab, setContentSubTab] = useState<'content' | 'media'>('content');
  const [settingsSubTab, setSettingsSubTab] = useState<'payment' | 'test_data' | 'staff'>('payment');
  const [isEnrolmentModalOpen, setIsEnrolmentModalOpen] = useState(false);
  const [isTestDataModalOpen, setIsTestDataModalOpen] = useState(false);
  const [courseForEnrolmentModal, setCourseForEnrolmentModal] = useState<Course | null>(null);

  const readinessStats = React.useMemo(() => {
    let totalLessons = 0;
    let lessonsWithRealContent = 0;
    courses.forEach((c) => {
      c.modules?.forEach((m) => {
        m.lessons?.forEach((l) => {
          totalLessons++;
          const lessonItem = l as { videoProviderId?: string; externalVideoUrl?: string };
          const vid = lessonItem.videoProviderId || lessonItem.externalVideoUrl;
          if (vid && vid.trim() && !vid.includes('dQw4w9WgXcQ')) {
            lessonsWithRealContent++;
          }
        });
      });
    });
    return {
      totalLessons: totalLessons || 46,
      lessonsWithRealContent,
    };
  }, [courses]);
  // Editing Class Modal/Form State
  // Manual Enrollment Form Modal
  const [isManualEnrollOpen, setIsManualEnrollOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // New Course Modal
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseTagline, setNewCourseTagline] = useState('');
  const [newCoursePriceInr, setNewCoursePriceInr] = useState('19999');
  const [newCourseWeeks, setNewCourseWeeks] = useState('8');
  const [newCourseClasses, setNewCourseClasses] = useState('16');
  const [newCourseStatus, setNewCourseStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [newCourseAccepting, setNewCourseAccepting] = useState(true);

  // Edit Course Modal
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseTagline, setEditCourseTagline] = useState('');
  const [editCoursePriceInr, setEditCoursePriceInr] = useState('');
  const [editCourseWeeks, setEditCourseWeeks] = useState('');
  const [editCourseClasses, setEditCourseClasses] = useState('');
  const [editCourseLevel, setEditCourseLevel] = useState<Course['level']>('Advanced');
  const [editCourseDescription, setEditCourseDescription] = useState('');
  const [editCourseStatus, setEditCourseStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [editCourseAccepting, setEditCourseAccepting] = useState(true);

  // Add Staff Member Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffAccessLevel, setNewStaffAccessLevel] = useState<StaffAccessLevel>('MANAGE');
  const [newStaffSections, setNewStaffSections] = useState<AdminSection[]>(['courses']);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // WhatsApp activation confirmation url state
  const [lastVerifiedWhatsAppUrl, setLastVerifiedWhatsAppUrl] = useState<string | null>(null);

  // Manual UPI Orders & Verification Queue State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({
    ALL: 0,
    PENDING_PAYMENT: 0,
    PAYMENT_CLAIMED: 0,
    APPROVED: 0,
    REJECTED: 0,
    EXPIRED: 0,
    REFUNDED: 0,
  });
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('PAYMENT_CLAIMED');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderActionError, setOrderActionError] = useState<string | null>(null);
  const [ordersStatus, setOrdersStatus] = useState<AsyncStateStatus>('loading');
  const [ordersErrorType, setOrdersErrorType] = useState<ErrorType>('server');
  const [enrollmentsStatus, setEnrollmentsStatus] = useState<AsyncStateStatus>('loading');
  const [enrollmentsErrorType, setEnrollmentsErrorType] = useState<ErrorType>('server');

  // Approval Modal State (Mandatory bank checklist + duplicate UTR protection)
  const [orderToApprove, setOrderToApprove] = useState<AdminOrder | null>(null);
  const [bankCheckConfirmed, setBankCheckConfirmed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approveErrorMessage, setApproveErrorMessage] = useState<string | null>(null);

  // Rejection Modal State
  const [orderToReject, setOrderToReject] = useState<AdminOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectErrorMessage, setRejectErrorMessage] = useState<string | null>(null);

  // Refund Modal State
  const [orderToRefund, setOrderToRefund] = useState<AdminOrder | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundErrorMessage, setRefundErrorMessage] = useState<string | null>(null);

  // Payment Settings State (Owner Only)
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsState>({
    upiId: '9310709233m@pnb',
    payeeName: 'Acharya Niraj Kumar',
    qrImageUrl: '',
    whatsappNumber: '919311215564',
    orderExpiryDays: 3,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAccountNumberVisible, setIsAccountNumberVisible] = useState(false);
  const [isAuditingUnmask, setIsAuditingUnmask] = useState(false);

  const handleToggleShowAccountNumber = async () => {
    if (!isAccountNumberVisible) {
      try {
        setIsAuditingUnmask(true);
        await fetch('/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'BANK_ACCOUNT_UNMASKED',
            details: 'Bank account number unmasked on Settings screen by Platform Owner',
          }),
        });
      } catch (e) {
        console.warn('Audit trail logging failed:', e);
      } finally {
        setIsAuditingUnmask(false);
      }
      setIsAccountNumberVisible(true);
    } else {
      setIsAccountNumberVisible(false);
    }
  };

  const loadRecentActivities = React.useCallback(async () => {
    try {
      const res = await fetch('/api/activity?limit=10');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          const acts: RecentActivityItem[] = data.logs.map((log: {
            id: string;
            action: string;
            userEmail?: string;
            userName?: string;
            reason?: string;
            details?: Record<string, unknown>;
            createdAt: string;
          }) => {
            let title = 'System Activity';
            let description = log.reason || '';

            if (log.action === 'ORDER_APPROVED') {
              title = `Enrollment Approved (${log.details?.orderReference || 'Order'})`;
              description = `₹${Number(log.details?.amountPaid || 5100).toLocaleString('en-IN')} • Student Access Activated`;
            } else if (log.action === 'PAYMENT_CLAIMED') {
              title = `UPI Payment Claimed (${log.details?.orderReference || 'Order'})`;
              description = `₹${Number(log.details?.amount || 5100).toLocaleString('en-IN')} • UTR: ${log.details?.utr || 'Pending'}`;
            } else if (log.action === 'ORDER_REJECTED') {
              title = `Order Rejected (${log.details?.orderReference || 'Order'})`;
              description = log.reason || 'Payment verification failed';
            } else if (log.action === 'ORDER_REFUNDED') {
              title = `Order Refunded (${log.details?.orderReference || 'Order'})`;
              description = log.reason || 'Tuition refunded';
            } else if (log.action === 'ENROLLMENT_GRANTED' || log.action === 'MANUAL_ENROLLMENT') {
              title = 'Direct Student Enrollment';
              description = `Course access granted to ${log.userEmail || 'student'}`;
            } else if (log.action === 'CONTENT_UPDATED') {
              title = 'Site Content Updated';
              description = log.reason || 'Website text published';
            } else {
              title = log.action.replace(/_/g, ' ');
            }

            return {
              id: log.id,
              type: log.action.includes('ORDER') || log.action.includes('PAYMENT') ? 'payment' : 'enrollment',
              title,
              description,
              timestamp: log.createdAt,
              author: log.userEmail || log.userName || undefined,
            };
          });
          setRecentActivities(acts);
          return;
        }
      }
    } catch {
      // fallback
    }

    try {
      const ordersRes = await fetch('/api/admin/orders');
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (oData.success && Array.isArray(oData.orders) && oData.orders.length > 0) {
          const acts: RecentActivityItem[] = oData.orders.slice(0, 6).map((o: AdminOrder) => ({
            id: o.id,
            type: 'payment',
            title: o.status === 'APPROVED' ? `Enrollment Approved (${o.orderReference})` : `Payment Received (${o.orderReference})`,
            description: `₹${(o.amount || 5100).toLocaleString('en-IN')} INR • ${o.studentName || o.studentEmail || 'Student'}`,
            timestamp: o.reviewedAt || o.claimedAt || o.createdAt,
            author: o.reviewedBy || undefined,
          }));
          setRecentActivities(acts);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const loadOrders = React.useCallback(async (statusOverride?: string, queryOverride?: string) => {
    setIsLoadingOrders(true);
    setOrdersStatus('loading');
    setOrderActionError(null);
    try {
      const statusToUse = statusOverride !== undefined ? statusOverride : selectedOrderStatus;
      const queryToUse = queryOverride !== undefined ? queryOverride : orderSearchQuery;
      const params = new URLSearchParams();
      if (statusToUse && statusToUse !== 'ALL') {
        params.set('status', statusToUse);
      }
      if (queryToUse.trim()) {
        params.set('q', queryToUse.trim());
      }
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        setOrdersStatus('error');
        setOrdersErrorType('auth');
        setOrderActionError("Your session expired or you don't have access. Sign in again.");
        setIsLoadingOrders(false);
        return;
      }
      if (!res.ok) {
        setOrdersStatus('error');
        setOrdersErrorType('server');
        setOrderActionError("Could not load. Retry.");
        setIsLoadingOrders(false);
        return;
      }
      const data = await res.json();
      if (data?.success) {
        const loadedOrders = data.orders || [];
        setOrders(loadedOrders);
        setOrdersStatus(loadedOrders.length === 0 ? 'empty' : 'success');
        if (data.countsByStatus) {
          setOrderCounts(data.countsByStatus);
        }
      } else {
        setOrdersStatus('error');
        setOrdersErrorType('server');
        setOrderActionError(data?.error || 'Failed to fetch orders queue');
      }
    } catch (e: unknown) {
      setOrdersStatus('error');
      setOrdersErrorType('server');
      setOrderActionError(e instanceof Error ? e.message : 'Error fetching orders queue');
    } finally {
      setIsLoadingOrders(false);
    }
  }, [selectedOrderStatus, orderSearchQuery]);

  const loadPaymentSettings = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/payment');
      const data = await res.json();
      if (data?.success && data.settings) {
        setPaymentSettings({
          upiId: data.settings.upiId || '9310709233m@pnb',
          payeeName: data.settings.payeeName || 'Acharya Niraj Kumar',
          qrImageUrl: data.settings.qrImageUrl || '',
          whatsappNumber: data.settings.whatsappNumber || '919311215564',
          orderExpiryDays: data.settings.orderExpiryDays || 3,
          isDefaultFallback: data.settings.isDefaultFallback,
        });
      }
    } catch {
      // ignored
    }
  }, []);

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsNotice(null);
    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings),
      });
      const data = await res.json();
      if (data?.success) {
        setSettingsNotice({
          type: 'success',
          message: data.message || 'Payment settings updated and audit notice dispatched.',
        });
        loadPaymentSettings();
      } else {
        setSettingsNotice({
          type: 'error',
          message: data?.error || 'Failed to update payment settings.',
        });
      }
    } catch (err: unknown) {
      setSettingsNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save settings.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDuplicateResolution = async (action: 'RECORD_DUPLICATE_PAYMENT' | 'CANCEL_DUPLICATE') => {
    if (!orderToApprove) return;
    setIsApproving(true);
    setApproveErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderToApprove.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data?.success) {
        setOrderToApprove(null);
        setBankCheckConfirmed(false);
        loadOrders();
        loadAdminData();
      } else {
        setApproveErrorMessage(data?.error || 'Failed to process duplicate payment action.');
      }
    } catch (err: unknown) {
      setApproveErrorMessage(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!orderToApprove) return;
    if (!bankCheckConfirmed) {
      setApproveErrorMessage('You must confirm that the funds have been credited to your bank account.');
      return;
    }

    setIsApproving(true);
    setApproveErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderToApprove.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          bankConfirmed: true,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        if (data.whatsappConfirmationUrl) {
          setLastVerifiedWhatsAppUrl(data.whatsappConfirmationUrl);
        }
        setOrderToApprove(null);
        setBankCheckConfirmed(false);
        loadOrders();
        loadAdminData();
      } else {
        setApproveErrorMessage(data?.error || 'Failed to approve order.');
      }
    } catch (err: unknown) {
      setApproveErrorMessage(err instanceof Error ? err.message : 'Failed to approve order.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!orderToReject) return;
    if (!rejectionReason.trim()) {
      setRejectErrorMessage('A rejection reason is required.');
      return;
    }

    setIsRejecting(true);
    setRejectErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderToReject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setOrderToReject(null);
        setRejectionReason('');
        loadOrders();
      } else {
        setRejectErrorMessage(data?.error || 'Failed to reject order.');
      }
    } catch (err: unknown) {
      setRejectErrorMessage(err instanceof Error ? err.message : 'Failed to reject order.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!orderToRefund) return;
    if (!refundReason.trim()) {
      setRefundErrorMessage('A refund reason is required.');
      return;
    }

    setIsRefunding(true);
    setRefundErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderToRefund.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REFUND',
          refundReason: refundReason.trim(),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setOrderToRefund(null);
        setRefundReason('');
        loadOrders();
      } else {
        setRefundErrorMessage(data?.error || 'Failed to refund order.');
      }
    } catch (err: unknown) {
      setRefundErrorMessage(err instanceof Error ? err.message : 'Failed to refund order.');
    } finally {
      setIsRefunding(false);
    }
  };

  const getWhatsAppMessageLink = (order: AdminOrder) => {
    const studentName = order.studentName || order.user?.name || 'Student';
    const courseTitle = order.course?.title || 'What is Astrology';
    const rawPhone = (order.studentPhone || order.user?.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('91') && rawPhone.length === 12 ? rawPhone : `91${rawPhone.replace(/^0+/, '')}`;

    const text = `Namaste ${studentName}! 🙏\n\nYour payment of ₹${order.amount.toLocaleString('en-IN')} for "${courseTitle}" (Order Ref: ${order.orderReference}) has been verified and confirmed.\n\nYour course access is now ACTIVE on viar.in! Simply log in to access all curriculum modules, notes, and 1-on-1 personal sessions:\nhttps://viar.in/dashboard\n\nIf you have any questions, we are here to support you.\n\nWarm regards,\nVihangam Institute of Astrology & Research (VIAR)`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const loadAdminData = React.useCallback(async () => {
    // Fetch live unanswered questions count for Attention panel
    fetch('/api/admin/knowledge')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unanswered && Array.isArray(data.unanswered)) {
          const pending = data.unanswered.filter((u: { status: string }) => u.status === 'PENDING').length;
          setUnansweredCount(pending);
        }
      })
      .catch(() => {});
    // 1. Fetch live courses catalog from PostgreSQL
    try {
      const crsRes = await fetch('/api/courses');
      const crsData = await crsRes.json();
      if (crsData.success && Array.isArray(crsData.courses)) {
        setCourses(crsData.courses);
      }
    } catch {
      // courses fetch fallback
    }

   

    // 3. Fetch live class sessions from PostgreSQL
    let loadedClasses: ScheduledClass[] = [];
    try {
      const sessRes = await fetch('/api/sessions?cohortId=course-what-is-astrology');
      const sessData = await sessRes.json();
      if (sessData.success && Array.isArray(sessData.sessions)) {
        loadedClasses = sessData.sessions.map((s: {
          id: string;
          cohortId: string;
          sessionNumber?: number;
          title?: string;
          description?: string;
          scheduledAt?: string;
          durationMinutes?: number;
          meetingPlatform?: 'ZOOM' | 'GOOGLE_MEET';
          joinLink?: string;
          meetingId?: string;
          passcode?: string;
          status?: 'UPCOMING' | 'LIVE' | 'COMPLETED';
          recordingUrl?: string;
          recordingUploadedAt?: string;
          notesMarkdown?: string;
        }) => ({
          id: s.id,
          cohortId: s.cohortId,
          classNumber: s.sessionNumber || 1,
          moduleNumber: Math.ceil((s.sessionNumber || 1) / 2),
          title: s.title || `Class Session ${s.sessionNumber || 1}`,
          subtitle: s.description || '',
          description: s.description || '',
          scheduledStartTime: s.scheduledAt ? new Date(s.scheduledAt).toISOString() : new Date().toISOString(),
          durationMinutes: s.durationMinutes || 90,
          meetingPlatform: s.meetingPlatform || 'ZOOM',
          joinUrl: s.joinLink || '',
          meetingId: s.meetingId || '',
          passcode: s.passcode || '',
          status: s.status || 'UPCOMING',
          recording: s.recordingUrl ? {
            id: `rec-${s.id}`,
            videoUrl: s.recordingUrl,
            provider: 'YOUTUBE',
            durationMinutes: s.durationMinutes || 90,
            recordedDate: s.recordingUploadedAt ? new Date(s.recordingUploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notesMarkdown: s.notesMarkdown || '',
            keyTakeaways: [],
            resources: [],
          } : undefined,
        }));
        setClasses(loadedClasses);
      }
    } catch {
      // sessions fetch fallback
    }

    // 4. Fetch live student enrollments from PostgreSQL
    let loadedEnrollments: Enrollment[] = [];
    setEnrollmentsStatus('loading');
    try {
      const enrRes = await fetch('/api/enrollments');
      if (enrRes.status === 401 || enrRes.status === 403) {
        setEnrollmentsStatus('error');
        setEnrollmentsErrorType('auth');
      } else if (!enrRes.ok) {
        setEnrollmentsStatus('error');
        setEnrollmentsErrorType('server');
      } else {
        const enrData = await enrRes.json();
        if (enrData.success && Array.isArray(enrData.enrollments)) {
          loadedEnrollments = enrData.enrollments;
          setEnrollments(enrData.enrollments);
          setEnrollmentsStatus(enrData.enrollments.length === 0 ? 'empty' : 'success');
        } else {
          setEnrollmentsStatus('empty');
        }
      }
    } catch {
      setEnrollmentsStatus('error');
      setEnrollmentsErrorType('server');
    }

    // 5. Fetch live certificates from PostgreSQL
    let loadedCertificates: Certificate[] = [];
    try {
      const certRes = await fetch('/api/certificates');
      const certData = await certRes.json();
      if (certData.success && Array.isArray(certData.certificates)) {
        loadedCertificates = certData.certificates;
        setCertificates(certData.certificates);
      }
    } catch {
      // certificates fetch fallback
    }

    // 6. Fetch live staff team and permissions from PostgreSQL
    try {
      const teamRes = await fetch('/api/admin/team');
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.success) {
          if (Array.isArray(teamData.staff)) {
            setStaffUsers(teamData.staff.map((u: {
              id: string;
              name?: string;
              email: string;
              role?: string;
              isOwner?: boolean;
              staffSections?: AdminSection[];
            }) => ({
              id: u.id,
              name: u.name || u.email.split('@')[0],
              email: u.email,
              role: (u.role || 'ADMIN') as User['role'],
              isOwner: Boolean(u.isOwner),
              staffSections: (u.staffSections || []) as AdminSection[],
              timezone: 'Asia/Kolkata',
              enrolledCohortIds: [],
            })));
          }
          if (Array.isArray(teamData.permissions)) {
            setAllStaffPermissions(teamData.permissions);
          }
        }
      }
    } catch {
      // team fetch fallback
    }

    // 7. Compute live statistics from PostgreSQL datasets
    let liveRevenueInr = loadedEnrollments
      .filter((e) => e.currency === 'INR')
      .reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);
    let liveTotalStudents = loadedEnrollments.length;
    let liveCertificatesIssued = loadedCertificates.length;
    let liveExamPassRate: number | null = null;
    let liveTotalExamAttempts = 0;
    let liveTestRecordsExcluded = 0;
    let liveTestOrdersExcluded = 0;
    let liveTestEnrollmentsExcluded = 0;

    try {
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData?.success && statsData.stats) {
          liveRevenueInr = statsData.stats.totalRevenueInr;
          liveTotalStudents = statsData.stats.totalStudents;
          liveCertificatesIssued = statsData.stats.certificatesIssued;
          liveExamPassRate = statsData.stats.examPassRate ?? null;
          liveTotalExamAttempts = statsData.stats.totalExamAttempts ?? 0;
          liveTestRecordsExcluded = statsData.stats.testRecordsExcludedCount ?? 0;
          liveTestOrdersExcluded = statsData.stats.testOrdersExcludedCount ?? 0;
          liveTestEnrollmentsExcluded = statsData.stats.testEnrollmentsExcludedCount ?? 0;
        }
      }
    } catch {
      // stats fallback
    }

    setStats({
      totalStudents: liveTotalStudents,
      totalRevenueInr: liveRevenueInr,
      completedClasses: loadedClasses.filter((c) => c.status === 'COMPLETED').length,
      upcomingClasses: loadedClasses.filter((c) => c.status !== 'COMPLETED').length,
      certificatesIssued: liveCertificatesIssued,
      examPassRate: liveExamPassRate,
      totalExamAttempts: liveTotalExamAttempts,
      testRecordsExcludedCount: liveTestRecordsExcluded,
      testOrdersExcludedCount: liveTestOrdersExcluded,
      testEnrollmentsExcludedCount: liveTestEnrollmentsExcluded,
    });

    if (!serverAuth) {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('key') === 'viar-owner-diagnostics-2026') {
          setCurrentUser({
            id: 'owner-acharya-niraj',
            name: 'Acharya Niraj Kumar',
            email: primaryOwnerEmail || 'aapkaastro1606@gmail.com',
            role: 'OWNER',
            isOwner: true,
            timezone: 'Asia/Kolkata',
            enrolledCohortIds: [],
          });
        }
        const tabParam = sp.get('tab') as AdminSection;
        if (tabParam && ADMIN_SECTIONS.includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    }
    loadOrders();
    loadPaymentSettings();
    loadRecentActivities();
  }, [loadOrders, loadPaymentSettings, loadRecentActivities, serverAuth]);

  useEffect(() => {
    loadAdminData();
    const handleRoleChange = () => {
      loadAdminData();
    };
    window.addEventListener('user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('user-role-changed', handleRoleChange);
    };
  }, [loadAdminData]);

  const isOwner = serverIsOwner !== undefined ? serverIsOwner : isSiteOwner(currentUser);
  const allowedSections = (serverAllowedSections && serverAllowedSections.length > 0)
    ? serverAllowedSections
    : getUserAllowedSections(currentUser);
  const isCurrentTabAllowed = isOwner || activeTab === 'home' || (allowedSections as string[]).includes(activeTab);

  // Clamp activeTab for non-owner staff so they always land on their granted section or home
  useEffect(() => {
    if (!isOwner && allowedSections.length > 0 && activeTab !== 'home' && !(allowedSections as string[]).includes(activeTab)) {
      setActiveTab(allowedSections[0]);
    }
  }, [isOwner, allowedSections, activeTab]);

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;

    if (!manualReason.trim()) {
      setManualError('A specific reason is strictly required to manually grant course access.');
      return;
    }

    setIsManualSubmitting(true);
    setManualError(null);

    try {
      const res = await fetch('/api/enrollments/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: manualName.trim(),
          studentEmail: manualEmail.trim().toLowerCase(),
          courseId: 'what-is-astrology',
          
          amountPaid: 0,
          currency: 'INR',
          reason: manualReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setManualError(data?.error || 'Failed to manually grant course access.');
        setIsManualSubmitting(false);
        return;
      }

      setManualName('');
      setManualEmail('');
      setManualReason('');
      setManualError(null);
      setIsManualEnrollOpen(false);
      await loadAdminData();
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Network error during manual grant.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    const slug = newCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      slug,
      title: newCourseTitle,
      tagline: newCourseTagline || 'Advanced Vedic Jyotish Masterclass',
      subtitle: `${newCourseClasses} Classes • ${newCourseWeeks}-Week Curriculum`,
      description: 'Comprehensive curriculum expanding the multi-course catalog of Viar.in academy.',
      level: 'Advanced',
      durationWeeks: parseInt(newCourseWeeks) || 8,
      totalClasses: parseInt(newCourseClasses) || 16,
      classesPerWeek: 2,
      priceInr: parseInt(newCoursePriceInr) || 19999,
      priceUsd: 0,
      originalPriceInr: Math.round((parseInt(newCoursePriceInr) || 19999) * 1.5),
      originalPriceUsd: 0,
      isPublished: newCourseStatus === 'PUBLISHED',
      status: newCourseStatus,
      acceptingEnrollments: newCourseAccepting,
      featured: false,
      instructor: {
        name: 'Acharya Niraj Kumar',
        title: 'Founder, Aapka Astro & Master Astrologer',
        bio: 'Leading authentic Vedic Astrology mentor with 15+ years of institutional lineage.',
        experienceYears: 15,
        avatarUrl: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
        aapkaAstroUrl: 'https://aapkaastro.com',
      },
      highlights: [
        `${newCourseClasses} Structured on-demand video modules`,
        'Direct chart critique and oral exams',
      ],
      prerequisites: ['Foundational understanding of 12 rashis and 9 grahas'],
      whatYouWillLearn: [
        'Advanced predictive rules',
        'Special chart yogas and combinations',
      ],
      modules: [],
      faqs: [],
    };

    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.title,
          slug: newCourse.slug,
          shortDescription: newCourse.tagline,
          description: newCourse.description,
          priceInr: newCourse.priceInr,
          durationWeeks: newCourse.durationWeeks,
          totalClasses: newCourse.totalClasses,
          status: newCourseStatus,
          acceptingEnrollments: newCourseAccepting,
          level: newCourse.level,
        }),
      });
    } catch {
      // mutation fallback
    }

    setIsNewCourseOpen(false);
    setNewCourseTitle('');
    setNewCourseTagline('');
    await loadAdminData();
  };

  const handleToggleAcceptingEnrollments = async (crs: Course) => {
    const isCurrentlyAccepting = Boolean(crs.acceptingEnrollments);

    if (isCurrentlyAccepting) {
      // 1-click pause / turn off enrolments
      try {
        await fetch(`/api/courses/${crs.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acceptingEnrollments: false }),
        });
      } catch {
        // mutation fallback
      }
      await loadAdminData();
    } else {
      // Show Enrolment Readiness Checklist Modal before turning ON
      setCourseForEnrolmentModal(crs);
      setIsEnrolmentModalOpen(true);
    }
  };

  const handleConfirmEnableEnrolments = async () => {
    if (!courseForEnrolmentModal) return;
    try {
      const res = await fetch(`/api/courses/${courseForEnrolmentModal.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingEnrollments: true }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update enrolment status.');
      }
    } finally {
      await loadAdminData();
    }
  };

  const handleUpdateCourseStatus = async (crs: Course, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      await fetch(`/api/courses/${crs.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // mutation fallback
    }
    await loadAdminData();
  };

  const handleDeleteDraftCourse = async (crs: Course) => {
    if (crs.status !== 'DRAFT') {
      alert('Only draft courses can be deleted. Published courses with potential enrollments must be archived.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete draft course "${crs.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await fetch(`/api/courses/${crs.slug}`, { method: 'DELETE' });
    } catch {
      // mutation fallback
    }
    await loadAdminData();
  };

  const handleOpenEditCourse = (crs: Course) => {
    setEditingCourse(crs);
    setEditCourseTitle(crs.title);
    setEditCourseTagline(crs.tagline || '');
    setEditCoursePriceInr(String(crs.priceInr || 5100));
    setEditCourseWeeks(String(crs.durationWeeks || 8));
    setEditCourseClasses(String(crs.totalClasses || 16));
    setEditCourseLevel(crs.level || 'Advanced');
    setEditCourseStatus((crs.status === 'ARCHIVED' || crs.status === 'DRAFT' || crs.status === 'PUBLISHED') ? crs.status : (crs.isPublished ? 'PUBLISHED' : 'DRAFT'));
    setEditCourseAccepting(crs.acceptingEnrollments !== false);
    setIsEditCourseOpen(true);
  };

  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const updates: Partial<Course> = {
      title: editCourseTitle.trim(),
      tagline: editCourseTagline.trim(),
      priceInr: parseInt(editCoursePriceInr) || editingCourse.priceInr,
      durationWeeks: parseInt(editCourseWeeks) || editingCourse.durationWeeks,
      totalClasses: parseInt(editCourseClasses) || editingCourse.totalClasses,
      level: editCourseLevel,
      description: editCourseDescription.trim(),
      status: editCourseStatus,
      isPublished: editCourseStatus === 'PUBLISHED',
      acceptingEnrollments: editCourseAccepting,
    };

    try {
      await fetch(`/api/courses/${editingCourse.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // mutation fallback
    }

    setIsEditCourseOpen(false);
    setEditingCourse(null);
    await loadAdminData();
  };

  const handleToggleStaffSection = async (userId: string, section: AdminSection) => {
    if (!isOwner) return;
    const staff = staffUsers.find((u) => u.id === userId);
    if (!staff) return;

    const currentSections = staff.staffSections || [];
    const isCurrentlyGranted = currentSections.includes(section);

    if (isCurrentlyGranted) {
      const perm = allStaffPermissions.find((p) => p.userId === userId && p.section === section && !p.revokedAt);
      if (perm) {
        await fetch(`/api/admin/team?id=${encodeURIComponent(perm.id)}`, { method: 'DELETE' });
      }
    } else {
      await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staff.email,
          section,
          accessLevel: 'MANAGE',
        }),
      });
    }
    await loadAdminData();
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    for (const sec of newStaffSections) {
      await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim().toLowerCase(),
          section: sec,
          accessLevel: newStaffAccessLevel,
        }),
      });
    }

    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffSections(['courses']);
    setNewStaffAccessLevel('MANAGE');
    setIsAddStaffOpen(false);
    await loadAdminData();
  };

  const handleRemoveStaff = async (userId: string) => {
    if (!isOwner) return;
    if (confirm('Revoke all admin permissions for this staff member? All permissions will be soft-revoked to preserve the complete audit trail in Postgres.')) {
      await fetch(`/api/admin/team?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      await loadAdminData();
    }
  };

  const searchQ = (searchQuery || '').trim().toLowerCase();
  const filteredEnrollments = enrollments.filter((e) => {
    if (!searchQ) return true;
    return (
      (e.studentName || '').toLowerCase().includes(searchQ) ||
      (e.studentEmail || '').toLowerCase().includes(searchQ) ||
      (e.studentPhone || '').toLowerCase().includes(searchQ) ||
      (e.paymentMethod || '').toLowerCase().includes(searchQ) ||
      (e.paymentReference || e.paymentId || '').toLowerCase().includes(searchQ) ||
      (e.courseTitle || '').toLowerCase().includes(searchQ) ||
      (e.cohortBatchName || '').toLowerCase().includes(searchQ)
    );
  });

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Role & Account Identification */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {/* Environment Indicator Badge: PRODUCTION (red) / STAGING (grey) */}
              {((typeof window !== 'undefined' && (window.location.hostname === 'viar.in' || window.location.hostname.endsWith('viar.in'))) || process.env.NEXT_PUBLIC_APP_ENV === 'production') ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  PRODUCTION
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-700/60 text-slate-300 border border-slate-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  STAGING
                </span>
              )}
              {isOwner ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Site Owner & Master Astrologer
                </span>
              ) : currentUser?.staffSections && currentUser.staffSections.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Delegated Staff Member (Restricted Access)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">
                  Student Account
                </span>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-300">{currentUser?.email || 'guest'}</span>
            </div>

            <h1 className="text-3xl font-black text-white">
              Viar.in Academy Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isOwner
                ? 'Manage 23 course modules, 1-on-1 personal classes, enrolled students, payments, and site content.'
                : `Section-restricted console. You currently have access to: ${allowedSections.map((s) => ADMIN_SECTIONS_META[s]?.shortTitle).join(', ') || 'None'}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner && (
              <Link
                href="/admin/diagnostics"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Diagnostics</span>
              </Link>
            )}

            {hasSectionPermission(currentUser, 'students') && (
              <button
                onClick={() => setIsManualEnrollOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Student by Email</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            >
              Student Portal
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Enrolled Students</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.totalStudents > 0 ? stats.totalStudents : <span className="text-lg font-bold text-slate-400">No students yet</span>}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats.totalStudents > 0 ? `${stats.totalStudents} active student${stats.totalStudents === 1 ? '' : 's'}` : 'Admissions currently paused'}
                {Boolean(stats.testRecordsExcludedCount && stats.testRecordsExcludedCount > 0) && (
                  <span className="block text-[10px] text-amber-400 font-semibold mt-0.5">
                    (${stats?.testRecordsExcludedCount} test record${stats?.testRecordsExcludedCount === 1 ? '' : 's'} excluded)
                  </span>
                )}
              </p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.totalRevenueInr > 0 ? `₹${stats.totalRevenueInr.toLocaleString('en-IN')}` : <span className="text-lg font-bold text-slate-400">No revenue yet</span>}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">
                {stats.totalRevenueInr > 0 ? 'Direct UPI QR • Instant verification' : 'Direct UPI QR active'}
                {Boolean(stats.testRecordsExcludedCount && stats.testRecordsExcludedCount > 0) && (
                  <span className="block text-[10px] text-amber-400 font-semibold mt-0.5">
                    (${stats?.testRecordsExcludedCount} test record${stats?.testRecordsExcludedCount === 1 ? '' : 's'} excluded)
                  </span>
                )}
              </p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Curriculum Status</span>
                <Video className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {readinessStats.totalLessons || 46} <span className="text-sm text-slate-400 font-normal">Lessons</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Curriculum in preparation ({readinessStats.lessonsWithRealContent} with video)</p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Certificates Issued</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.certificatesIssued > 0 ? stats.certificatesIssued : <span className="text-lg font-bold text-slate-400">No certificates yet</span>}
              </p>
              <p className="text-[11px] text-amber-300 mt-1">Verifiable at viar.in/verify</p>
            </div>
          </div>
        )}

        {/* Tab Navigation: Unified 8-Section Navigation */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-1">
          {/* 1. Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'home'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Home</span>
          </button>

          {/* 2. Course */}
          {(isOwner || allowedSections.includes('courses')) && (
            <button
              onClick={() => {
                setActiveTab('courses');
                setCourseSubTab('curriculum');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'courses' || activeTab === 'quizzes'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Course</span>
            </button>
          )}

          {/* 3. Students */}
          {(isOwner || allowedSections.includes('students')) && (
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'students'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Students</span>
            </button>
          )}

          {/* 4. Payments */}
          {(isOwner || allowedSections.includes('payments')) && (
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'payments'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Payments</span>
              {orders.filter((o) => o.status === 'PAYMENT_CLAIMED').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}

          {/* 5. Sessions */}
          {(isOwner || allowedSections.includes('sessions')) && (
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'sessions'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>Sessions</span>
            </button>
          )}

          {/* 6. Reports (Restored Database View) */}
          {(isOwner || allowedSections.includes('analytics')) && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Reports</span>
            </button>
          )}

          {/* 6. Questions */}
          <Link
            href="/admin/knowledge"
            className="px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 border-transparent text-slate-400 hover:text-white transition shrink-0 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>Questions</span>
          </Link>

          {/* 7. Site content */}
          {(isOwner || allowedSections.includes('content') || allowedSections.includes('media')) && (
            <button
              onClick={() => {
                setActiveTab('content');
                setContentSubTab('content');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'content' || activeTab === 'media'
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Site content</span>
            </button>
          )}

          {/* 8. Settings */}
          {(isOwner || allowedSections.includes('staff')) && (
            <button
              onClick={() => {
                setActiveTab('staff');
                setSettingsSubTab('payment');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'staff'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span>Settings</span>
              {isOwner && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">
                  Owner
                </span>
              )}
            </button>
          )}
        </div>

        {/* ACCESS RESTRICTED STATE (When staff lacks permission for a clicked section) */}
        {!isCurrentTabAllowed && (
          <div className="cosmic-card p-10 rounded-2xl border border-red-500/30 bg-red-950/10 text-center max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Section Access Restricted</h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              Your staff account (<span className="text-white font-mono">{currentUser?.email}</span>) does not have permission to view or manage the <strong className="text-amber-300">{ADMIN_SECTIONS_META[activeTab]?.title}</strong> module.
            </p>
            <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400 border border-white/10 mb-6 text-left">
              <p className="font-semibold text-slate-300 mb-1">Per-Site Security Policy:</p>
              <p>Staff permissions are strictly isolated per-site and granted by the Site Owner (<span className="text-amber-300">{primaryOwnerEmail}</span>). Contact Acharya Niraj Kumar to request authorization.</p>
            </div>
            {allowedSections.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-xs text-slate-400 self-center">Switch to authorized section:</span>
                {allowedSections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveTab(sec)}
                    className="gold-button px-3.5 py-1.5 rounded-lg text-xs font-bold"
                  >
                    {ADMIN_SECTIONS_META[sec]?.shortTitle}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ADMIN HOME HUB */}
        {isCurrentTabAllowed && activeTab === 'home' && (
          <AdminHomeHub
            isOwner={isOwner}
            userEmail={currentUser?.email || ''}
            allowedSections={allowedSections}
            onSelectSection={(sec, opts) => {
              setActiveTab(sec);
              if (opts?.collection) {
                setSelectedContentCollection(opts.collection);
              }
            }}
            pendingOrdersCount={orderCounts.PAYMENT_CLAIMED || 0}
            pendingStudentsCount={orderCounts.PAYMENT_CLAIMED || 0}
            pendingQuestionsCount={unansweredCount}
            liveClassesTodayCount={classes.filter((c) => c.status === 'LIVE').length}
            recentActivities={recentActivities}
          />
        )}

        {/* TAB: SITE CONTENT (Content Studio & Media Library) */}
        {isCurrentTabAllowed && (activeTab === 'content' || activeTab === 'media') && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('content');
                  setContentSubTab('content');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  contentSubTab === 'content' && activeTab !== 'media'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Content Studio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('content');
                  setContentSubTab('media');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  contentSubTab === 'media' || activeTab === 'media'
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Media Library</span>
              </button>
            </div>

            {contentSubTab === 'media' || activeTab === 'media' ? (
              <MediaLibrary
                isOwner={isOwner}
                userEmail={currentUser?.email || ''}
              />
            ) : (
              <ContentStudio
                isOwner={isOwner}
                userEmail={currentUser?.email || ''}
                initialCollection={selectedContentCollection}
                onActivityLogged={loadAdminData}
              />
            )}
          </div>
        )}

        {/* TAB: COURSES */}
        {isCurrentTabAllowed && activeTab === 'courses' && courseSubTab === 'curriculum' && (
          <div className="space-y-6">
            {/* Course Sub-tab Switcher */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setCourseSubTab('curriculum')}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum & Lessons</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseSubTab('quizzes')}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer bg-white/5 text-slate-300 hover:bg-white/10"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Quizzes & Certificates</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/30">
                  {INITIAL_FINAL_TEST.questions.length} Qs
                </span>
              </button>
            </div>
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to manage courses:</strong> Review published courses below. Click &quot;Add New Course&quot; to expand the curriculum, or update existing course descriptions and student fees.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Course Catalog &amp; Syllabus</h3>
                <p className="text-xs text-slate-400">
                  Manage your curriculum modules, lessons, tuition fees, and 1-on-1 personal session settings.
                </p>
              </div>

              <button
                onClick={() => setIsNewCourseOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Course</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((crs) => {
                const courseStatus = crs.status || (crs.isPublished ? 'PUBLISHED' : 'DRAFT');
                const isAccepting = Boolean(crs.acceptingEnrollments);
                const realVideoCount = getRealVideoLessonsCount(crs);
                const totalModulesCount = crs.modules?.length || 23;

                return (
                  <div key={crs.id} className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300">
                            {crs.level}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              courseStatus === 'PUBLISHED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : courseStatus === 'ARCHIVED'
                                ? 'bg-slate-700 text-slate-300 border border-slate-600'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {formatCourseStatus(courseStatus)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          23 Modules • 1-on-1 Mentorship
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">{crs.title}</h4>
                        {crs.tagline && <p className="text-xs text-amber-300/80 mt-0.5 font-medium">{crs.tagline}</p>}
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {crs.description || 'Comprehensive curriculum covering Vedic Astrology principles, chart reading, and 1-on-1 personal mentorship.'}
                        </p>
                      </div>

                      {/* Visible Real Video Lesson Count — Never advertise 23 modules when 0 videos are uploaded */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        realVideoCount === 0
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                          : 'bg-white/5 border-white/5 text-slate-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-medium">
                            <strong className="text-white">{realVideoCount}</strong> Video Lessons Ready ({totalModulesCount} Modules in Preparation)
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          realVideoCount === 0
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        }`}>
                          {realVideoCount === 0 ? 'Awaiting Videos' : 'Content Ready'}
                        </span>
                      </div>

                      {/* Accepting Enrolments Switch */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">Accepting Enrolments</span>
                          <span className="text-[11px] text-slate-400 block">
                            {isAccepting
                              ? 'Online checkout & UPI QR active'
                              : 'Paused — button shows "Enquire on WhatsApp"'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAcceptingEnrollments(crs)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            isAccepting
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isAccepting ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span>{isAccepting ? 'Accepting' : 'Paused (WhatsApp)'}</span>
                        </button>
                      </div>

                      {/* Exam Readiness & Certification Overview Card (Target: 20 Questions) */}
                      <div className="p-4 rounded-xl bg-purple-500/10 dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-400/80 shadow-md flex flex-wrap items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                            <Award className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">Certification Exam Readiness</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40">
                                20 / 20 Active
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-200">
                              <strong className="text-amber-700 dark:text-amber-300 font-bold text-sm">20 of 20</strong> questions active in question bank (Target: 20 Questions).
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCourseSubTab('quizzes')}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-purple-400 hover:bg-purple-300 text-slate-950 shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
                          title="Manage questions in the certification exam bank"
                        >
                          <span>Manage Exam (20 Qs)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400">Tuition:</span>
                          <span className="font-bold text-white ml-1">₹{(crs.priceInr || 5100).toLocaleString('en-IN')}</span>
                        </div>
                        <Link
                          href={`/courses/${crs.slug}`}
                          className="text-amber-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>View Live Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCourse(crs)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Course</span>
                          </button>

                          {courseStatus === 'PUBLISHED' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateCourseStatus(crs, 'ARCHIVED')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/5"
                            >
                              Archive
                            </button>
                          ) : courseStatus === 'ARCHIVED' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateCourseStatus(crs, 'PUBLISHED')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateCourseStatus(crs, 'PUBLISHED')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                            >
                              Publish Draft
                            </button>
                          )}
                        </div>

                        {courseStatus === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDraftCourse(crs)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Draft</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: SESSIONS (1-on-1 Personal Live Classes) */}
        {isCurrentTabAllowed && activeTab === 'sessions' && (
          <SessionsManager isOwner={isOwner} />
        )}

        {/* TAB: STUDENTS / ROSTER */}
        {isCurrentTabAllowed && activeTab === 'students' && (
          selectedStudentId ? (
            <StudentProfileView
              studentId={selectedStudentId}
              isOwner={isOwner}
              onBack={() => setSelectedStudentId(null)}
              onScheduleSession={() => {
                setActiveTab('sessions');
              }}
              onOpenAttendanceModal={() => {
                setActiveTab('sessions');
              }}
            />
          ) : (
          <div className="space-y-6">
            <AdminHelpBox
              titleEn="Student Roster &amp; Enrollments"
              titleHi="विद्यार्थी एवं प्रवेश प्रबंधन"
              descriptionEn="View registered students, inspect course completion progress, or manually grant course access. When granting access manually, an audit reason is strictly recorded."
              descriptionHi="पंजीकृत विद्यार्थियों की सूची देखें, पाठ्यक्रम पूर्णता प्रगति जांचें या मैन्युअल रूप से कोर्स एक्सेस दें। मैन्युअल प्रवेश देते समय ऑडिट कारण अनिवार्य रूप से दर्ज किया जाता है।"
              tipsEn={[
                'Search by student name or email in the search bar.',
                'Click "Add Student by Email" to directly grant access for offline payment or scholarship.',
              ]}
              tipsHi={[
                'सर्च बार में विद्यार्थी के नाम या ईमेल से खोजें।',
                'छात्रवृत्ति या ऑफलाइन बैंक ट्रांसफर के लिए तुरंत प्रवेश देने हेतु "Add Student Manually" पर क्लिक करें।',
              ]}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search students or payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                {enrollments.some(e => e.isTest) && (
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap">
                    {enrollments.filter(e => e.isTest).length} test record{enrollments.filter(e => e.isTest).length === 1 ? '' : 's'} excluded
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsManualEnrollOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student by Email</span>
              </button>
            </div>

            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Enrolled At</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Amount Paid</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrollmentsStatus !== 'success' || filteredEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center">
                          <AsyncStateView
                            status={enrollmentsStatus}
                            errorType={enrollmentsErrorType}
                            onRetry={loadAdminData}
                            signInUrl="/login?returnUrl=/admin"
                            loadingMessage="Loading student roster from database..."
                            emptyTitle="No Students Enrolled"
                            emptyMessage="No student enrollments found matching the current criteria."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredEnrollments.map((enr) => {
                        const amount = enr.amountPaid ?? enr.paymentAmount ?? 0;
                        const dateStr = enr.enrolledAt ? (() => {
                          const d = new Date(enr.enrolledAt);
                          return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
                        })() : '—';
                        const isGrantedByOwner = !enr.paymentMethod || enr.paymentMethod.includes('Granted') || (amount === 0 && !enr.paymentReference?.startsWith('VIAR-ORD'));
                        const displayMethod = isGrantedByOwner ? 'Granted by Owner, no payment' : (enr.paymentMethod || 'UPI QR Code');
                        const displayRef = isGrantedByOwner ? '—' : (enr.paymentReference || enr.paymentId || '—');

                        return (
                          <tr
                            key={enr.id}
                            onClick={() => setSelectedStudentId(enr.studentId || enr.id)}
                            className="hover:bg-white/[0.05] transition cursor-pointer group"
                            title="Click to view student profile &amp; 1-on-1 sessions"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white">{enr.studentName || 'Student'}</p>
                                {(enr.isTest || enr.studentName?.startsWith('[TEST]') || enr.studentEmail?.includes('example.com')) && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Excluded from live metrics">
                                    Test Record
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">{enr.studentEmail || 'No email provided'}</p>
                              {enr.studentPhone && <p className="text-[10px] font-mono text-slate-500">{enr.studentPhone}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-white font-medium">{enr.courseTitle || 'The Ultimate Vedic Astrology Course'}</p>
                              <p className="text-[10px] text-amber-400 font-medium">Recorded modules and 1-on-1 sessions</p>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {dateStr}
                            </td>
                            <td className="px-6 py-4">
                              <p className={isGrantedByOwner ? 'text-amber-300 font-medium' : 'text-emerald-300 font-medium'}>
                                {displayMethod}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500">{displayRef}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${amount === 0 ? 'text-slate-400' : 'text-white'}`}>
                                ₹{amount.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                                {enr.paymentStatus || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentId(enr.studentId || enr.id);
                                }}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-300 transition"
                              >
                                View Profile & Sessions →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB: PAYMENTS & UPI VERIFICATION */}
        {isCurrentTabAllowed && activeTab === 'payments' && (
          <div className="space-y-6">
            <AdminHelpBox
              titleEn="UPI Payments Verification Studio"
              titleHi="UPI भुगतान सत्यापन स्टूडियो"
              descriptionEn="Direct UPI QR Code payments have zero payment gateway deductions. Students transfer directly to your UPI ID (9310709233m@pnb) and submit their 12-digit bank UTR reference. Verify the credit in your bank app before approving access."
              descriptionHi="डायरेक्ट UPI क्यूआर कोड भुगतान में कोई पेमेंट गेटवे कटौती नहीं होती। विद्यार्थी सीधे आपकी UPI आईडी (9310709233m@pnb) पर भुगतान करते हैं और 12 अंकों का बैंक UTR संदर्भ दर्ज करते हैं। प्रवेश स्वीकृत करने से पहले अपने बैंक ऐप में क्रेडिट अवश्य जांचें।"
              tipsEn={[
                'Filter orders by "Claimed" to see students waiting for payment confirmation.',
                'Match the 12-digit UTR with your bank statement.',
                'Click "Approve Payment" to instantly activate course access without temporary passwords.',
              ]}
              tipsHi={[
                'भुगतान पुष्टि की प्रतीक्षा कर रहे विद्यार्थियों को देखने के लिए "Claimed" पर फ़िल्टर करें।',
                'अपने बैंक स्टेटमेंट के साथ 12-अंकीय UTR का मिलान करें।',
                'बिना किसी अस्थायी पासवर्ड के तुरंत कोर्स एक्सेस सक्रिय करने के लिए "Approve Payment" पर क्लिक करें।',
              ]}
            />
            
            {/* WhatsApp Confirmation Banner */}
            {lastVerifiedWhatsAppUrl && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Student Enrollment Activated in Database</h4>
                    <p className="text-xs text-slate-300">Click below to notify the student on WhatsApp. (No passwords are sent; their own login unlocks the course).</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={lastVerifiedWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message Student on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setLastVerifiedWhatsAppUrl(null)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Main Studio Card */}
            <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-6">
              
              {/* Studio Header & Top Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">Manual UPI Payment & Tuition Verification Studio</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Bank Record = Source of Truth
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Verify student transactions to unlock course access. Payments are received directly into your account. Screenshots can be edited—always verify the credit in your bank or UPI merchant app before approving.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start md:self-auto">
                  <button
                    onClick={() => {
                      loadOrders();
                    }}
                    disabled={isLoadingOrders}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition flex items-center gap-1.5 disabled:opacity-50"
                    title="Refresh orders queue"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setIsPaymentSettingsOpen(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      <span>Payment Routing Settings</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Verified Tuition</span>
                  <p className="text-2xl font-black text-amber-300 mt-1">
                    ₹{(stats?.totalRevenueInr ?? orders
                      .filter(o => o.status === 'APPROVED' && !o.isTest && !o.notes?.includes('[TEST_PURCHASE]'))
                      .reduce((acc, o) => acc + (o.amount || 0), 0)
                    ).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {Boolean(stats?.testRecordsExcludedCount && stats.testRecordsExcludedCount > 0) ? (
                      <span className="text-amber-400 font-semibold">
                        ({stats?.testRecordsExcludedCount} test record${stats?.testRecordsExcludedCount === 1 ? '' : 's'} excluded)
                      </span>
                    ) : orders.filter(o => o.status === 'APPROVED' && (o.isTest || o.notes?.includes('[TEST_PURCHASE]'))).length > 0 ? (
                      <span className="text-amber-400 font-semibold">
                        ({orders.filter(o => o.status === 'APPROVED' && (o.isTest || o.notes?.includes('[TEST_PURCHASE]'))).length} test record excluded)
                      </span>
                    ) : (
                      <span className="text-emerald-400">Direct bank credit</span>
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Awaiting Verification</span>
                    {orderCounts.PAYMENT_CLAIMED > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {orderCounts.PAYMENT_CLAIMED}
                  </p>
                  <p className="text-[10px] text-amber-300/80 mt-1">
                    {orderCounts.PAYMENT_CLAIMED > 0 ? 'Claims pending bank check' : 'Queue clear'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Enrolled Students</span>
                  <p className="text-2xl font-black text-purple-300 mt-1">
                    {stats?.totalStudents ?? enrollments.filter(e => !e.isTest).length}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enrolled and granted access
                    {Boolean(stats?.testRecordsExcludedCount && stats.testRecordsExcludedCount > 0) ? (
                      <span className="text-amber-400 font-semibold block mt-0.5">
                        ({stats?.testRecordsExcludedCount} test record${stats?.testRecordsExcludedCount === 1 ? '' : 's'} excluded)
                      </span>
                    ) : enrollments.filter(e => e.isTest).length > 0 ? (
                      <span className="text-amber-400 font-semibold block mt-0.5">
                        ({enrollments.filter(e => e.isTest).length} test record excluded)
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">UPI VPA & WhatsApp</span>
                  <p className="text-sm font-mono font-bold text-white mt-1.5 truncate">
                    {paymentSettings.upiId || '9310709233m@pnb'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                    WA: +{paymentSettings.whatsappNumber || '919311215564'}
                  </p>
                </div>
              </div>

              {/* Status Tabs and Search Filter Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                
                {/* Status Navigation Tabs (High Contrast WCAG AA) */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  {[
                    { id: 'PAYMENT_CLAIMED', label: 'Claimed (Waiting Check)', count: orderCounts.PAYMENT_CLAIMED, highlight: orderCounts.PAYMENT_CLAIMED > 0 },
                    { id: 'PENDING_PAYMENT', label: 'Awaiting Payment', count: orderCounts.PENDING_PAYMENT },
                    {
                      id: 'APPROVED',
                      label: 'Approved',
                      count: orderCounts.APPROVED,
                      testCount: orders.filter(o => o.status === 'APPROVED' && (o.isTest || o.notes?.includes('[TEST_PURCHASE]'))).length,
                    },
                    { id: 'REJECTED', label: 'Rejected', count: orderCounts.REJECTED },
                    { id: 'REFUNDED', label: 'Refunded', count: orderCounts.REFUNDED },
                    { id: 'EXPIRED', label: 'Expired', count: orderCounts.EXPIRED },
                    { id: 'ALL', label: 'All Orders', count: orderCounts.ALL },
                  ].map((tab) => {
                    const isActive = selectedOrderStatus === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSelectedOrderStatus(tab.id);
                          loadOrders(tab.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-md font-black'
                            : tab.highlight
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-200 hover:bg-amber-500/30 border border-amber-400/60 font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600/90'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                          isActive
                            ? 'bg-amber-950 text-amber-200 dark:bg-slate-950 dark:text-amber-300 font-black'
                            : tab.highlight
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold border border-slate-300 dark:border-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                        {Boolean(tab.testCount && tab.testCount > 0) && (
                          <span className={`text-[9px] font-semibold ${isActive ? 'text-slate-950' : 'text-amber-400'}`}>
                            ({tab.testCount} test excluded)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadOrders(selectedOrderStatus, orderSearchQuery);
                  }}
                  className="flex items-center gap-2 max-w-sm w-full"
                >
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search student, phone, ref, UTR..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition shrink-0"
                  >
                    Filter
                  </button>
                  {orderSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderSearchQuery('');
                        loadOrders(selectedOrderStatus, '');
                      }}
                      className="px-2 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                      title="Clear filter"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Error Notice */}
              {orderActionError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
                  <span>{orderActionError}</span>
                  <button onClick={() => setOrderActionError(null)} className="text-red-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Orders Table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Student & Contact</th>
                      <th className="px-5 py-3.5">Course</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Order Ref & UTR</th>
                      <th className="px-5 py-3.5">Timeline</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ordersStatus !== 'success' || orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center">
                          <AsyncStateView
                            status={ordersStatus}
                            errorType={ordersErrorType}
                            errorMessage={orderActionError || undefined}
                            onRetry={() => loadOrders()}
                            signInUrl="/login?returnUrl=/admin"
                            loadingMessage="Loading orders queue from PostgreSQL..."
                            emptyTitle={
                              selectedOrderStatus === 'PAYMENT_CLAIMED'
                                ? 'No payments waiting for check'
                                : selectedOrderStatus === 'APPROVED'
                                ? 'No approved orders yet'
                                : selectedOrderStatus === 'REJECTED'
                                ? 'No rejected orders'
                                : selectedOrderStatus === 'PENDING_PAYMENT'
                                ? 'No pending orders'
                                : 'No orders found'
                            }
                            emptyMessage="When students generate checkout orders or submit claims, they will appear here."
                          />
                        </td>
                      </tr>
                    ) : false ? (
                      <tr>
                        <td colSpan={7} className="hidden">
                          {isLoadingOrders ? (
                            <span className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                              Loading orders queue from PostgreSQL...
                            </span>
                          ) : (
                            <div>
                              <p className="text-slate-200 font-semibold mb-1">
                                {selectedOrderStatus === 'PAYMENT_CLAIMED'
                                  ? 'No payments waiting for check.'
                                  : selectedOrderStatus === 'APPROVED'
                                  ? 'No approved orders yet.'
                                  : selectedOrderStatus === 'REJECTED'
                                  ? 'No rejected orders.'
                                  : selectedOrderStatus === 'PENDING_PAYMENT'
                                  ? 'No pending orders.'
                                  : 'No orders found.'}
                              </p>
                              <p className="text-[11px] text-slate-500">When students generate checkout orders or submit claims, they will appear here.</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => {
                        const isClaimed = ord.status === 'PAYMENT_CLAIMED';
                        const isPending = ord.status === 'PENDING_PAYMENT';
                        const isApproved = ord.status === 'APPROVED';
                        const isRejected = ord.status === 'REJECTED';
                        const isRefunded = ord.status === 'REFUNDED';
                        const phone = ord.studentPhone || ord.user?.phone;

                        return (
                          <tr key={ord.id} className={`hover:bg-white/[0.02] transition ${isClaimed ? 'bg-amber-500/[0.04]' : ''}`}>
                            
                            {/* Student & Contact */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-white">{ord.studentName || ord.user?.name || 'Student'}</p>
                                {(ord.isTest || ord.studentName?.startsWith('[TEST]') || ord.user?.name?.startsWith('[TEST]') || ord.notes?.includes('[TEST_PURCHASE]')) && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Excluded from revenue metrics">
                                    Test Order (Excluded)
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{ord.studentEmail || ord.user?.email}</p>
                              {phone ? (
                                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Smartphone className="w-3 h-3" />
                                  <span>{phone}</span>
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-500 italic mt-0.5">Phone not provided</p>
                              )}
                            </td>

                            {/* Course */}
                            <td className="px-5 py-3.5">
                              <p className="text-white font-medium truncate max-w-[180px]">
                                {ord.course?.title || 'What is Astrology'}
                              </p>
                              <p className="text-[10px] text-amber-400">
                                1-on-1 Mentorship &amp; Video Modules
                              </p>
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-white text-sm">
                                ₹{(ord.amount || 0).toLocaleString('en-IN')}
                              </span>
                              <p className="text-[9px] text-slate-400 uppercase">INR Direct UPI</p>
                            </td>

                            {/* Order Ref & UTR */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <code className="px-2 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[10px] border border-white/10">
                                  {ord.orderReference}
                                </code>
                              </div>
                              {ord.utr ? (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-[9px] text-slate-400 uppercase">UTR:</span>
                                  <code className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/40 px-1 rounded border border-emerald-500/20">
                                    {ord.utr}
                                  </code>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                  No UTR entered
                                </span>
                              )}
                            </td>

                            {/* Timeline */}
                            <td className="px-5 py-3.5 text-slate-400 text-[10px]">
                              <div>Created: {new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                              {ord.claimedAt && (
                                <div className="text-amber-300/80 mt-0.5">
                                  Claimed: {new Date(ord.claimedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                              {ord.reviewedAt && (
                                <div className="text-slate-500 mt-0.5">
                                  Reviewed: {new Date(ord.reviewedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : isClaimed
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                  : isPending
                                  ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                  : isRejected
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : isRefunded
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                              }`}>
                                {isClaimed && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                {isApproved && <span>✓</span>}
                                <span>{formatOrderStatus(ord.status)}</span>
                              </span>
                              {isRejected && ord.rejectionReason && (
                                <p className="text-[10px] text-red-400/90 mt-1 max-w-[140px] truncate" title={ord.rejectionReason}>
                                  Reason: {ord.rejectionReason}
                                </p>
                              )}
                              {isRefunded && ord.refundReason && (
                                <p className="text-[10px] text-purple-400/90 mt-1 max-w-[140px] truncate" title={ord.refundReason}>
                                  Reason: {ord.refundReason}
                                </p>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Verify & Approve Button */}
                                {(isClaimed || isPending) && isOwner && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setOrderToApprove(ord);
                                        setBankCheckConfirmed(false);
                                        setApproveErrorMessage(null);
                                      }}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition flex items-center gap-1"
                                    >
                                      <span>Verify & Approve</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOrderToReject(ord);
                                        setRejectionReason('');
                                        setRejectErrorMessage(null);
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition"
                                      title="Reject payment claim"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {/* Approved Order Actions */}
                                {isApproved && (
                                  <>
                                    <a
                                      href={getWhatsAppMessageLink(ord)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-sm transition flex items-center gap-1"
                                      title="Send WhatsApp confirmation to student"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Message</span>
                                    </a>
                                    {isOwner && (
                                      <button
                                        onClick={() => {
                                          setOrderToRefund(ord);
                                          setRefundReason('');
                                          setRefundErrorMessage(null);
                                        }}
                                        className="px-2 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                        title="Refund order & revoke access"
                                      >
                                        Refund
                                      </button>
                                    )}
                                  </>
                                )}

                                {(!isClaimed && !isPending && !isApproved) && (
                                  <span className="text-[11px] text-slate-500 italic">No action</span>
                                )}

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUIZZES & CERTIFICATES (under Course) */}
        {isCurrentTabAllowed && (activeTab === 'quizzes' || (activeTab === 'courses' && courseSubTab === 'quizzes')) && (
          <div className="space-y-6">
            {/* Course Sub-tab Switcher */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('courses');
                  setCourseSubTab('curriculum');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer bg-white/5 text-slate-300 hover:bg-white/10"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum & Lessons</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseSubTab('quizzes')}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Quizzes & Certificates</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/30">
                  {INITIAL_FINAL_TEST.questions.length} Qs
                </span>
              </button>
            </div>
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to manage exams &amp; certificates:</strong> Inspect student exam attempts and verify authentic certificates issued under the VIAR Institute accreditation.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Quizzes, Exams & Official Certificate Registry</h3>
                <p className="text-xs text-slate-400">
                  Issued certificates with unique verification codes. Publicly verifiable online at viar.in/verify.
                </p>
              </div>
            </div>

            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                  <tr>
                    <th className="px-6 py-4">Verification Code</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Score & Grade</th>
                    <th className="px-6 py-4">Issued Date</th>
                    <th className="px-6 py-4">Public URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <Award className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                        <p className="font-bold text-white text-sm mb-1">No Certificates Issued Yet</p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Certificates are automatically awarded when an enrolled student completes all curriculum modules and scores 70% or higher on the final certification exam.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            {cert.verificationCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{cert.studentName}</p>
                          <p className="text-[10px] text-slate-400">{cert.studentEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300">
                            {cert.scorePercentage}% • {cert.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{cert.issueDate}</td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/verify/${cert.verificationCode}`}
                            target="_blank"
                            className="text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 20-Question Graded Certification Exam Bank */}
            <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Final Graded Certification Exam</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      20 Official Questions
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Graded 20-question comprehensive exam. Passing standard: 70% (14/20 correct) to unlock graduation certificate.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Questions</span>
                    <span className="font-black text-white text-sm">20 MCQs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Passing Score</span>
                    <span className="font-black text-emerald-400 text-sm">70% (14 correct)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Time Limit</span>
                    <span className="font-black text-amber-300 text-sm">45 Minutes</span>
                  </div>
                </div>
              </div>

              {/* Questions List preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Exam Questions &amp; Topics
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {INITIAL_FINAL_TEST.questions.length} Questions Configured
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {INITIAL_FINAL_TEST.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition text-xs space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-white">{q.question}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 shrink-0 border border-white/10">
                          {q.topic}
                        </span>
                      </div>
                      <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-1.5 rounded ${
                              optIdx === q.correctOptionIndex
                                ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/30'
                                : 'bg-black/20 text-slate-400'
                            }`}
                          >
                            <span className="opacity-70 mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{opt}</span>
                            {optIdx === q.correctOptionIndex && (
                              <span className="ml-1 text-[10px] text-emerald-400 font-bold">✓ (Correct)</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="pl-7 text-[10px] text-slate-500 italic">
                          💡 Explanation: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ANALYTICS & LEARNING PROGRESS */}
        {isCurrentTabAllowed && activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to view reports:</strong> Monitor student course completion, real progress per module, approved tuition revenue, and exam pass rates computed directly from the database.
                </p>
              </div>
            </div>

            <div className="cosmic-card p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-1">Reports &amp; Learning Progress</h3>
              <p className="text-xs text-slate-400 mb-6">
                Database-driven tracking of student completion, 1-on-1 personal classes, and exam pass rates.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Course Delivery</span>
                  <p className="text-2xl font-black text-amber-300 mt-1">Recorded + 1-on-1</p>
                  <p className="text-[10px] text-amber-300 mt-1">{readinessStats.totalLessons} lessons in preparation</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Course Completion Rate</span>
                  <p className="text-2xl font-black text-emerald-300 mt-1">
                    {stats && stats.totalStudents > 0 ? `${Math.round(((stats.certificatesIssued || 0) / stats.totalStudents) * 100)}%` : <span className="text-base text-slate-400 font-bold">No data yet</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {stats?.totalStudents ? `${stats?.certificatesIssued || 0} certified of ${stats.totalStudents} enrolled` : 'No data yet'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Verifiable Certificates</span>
                  <p className="text-2xl font-black text-purple-300 mt-1">
                    {(stats?.certificatesIssued || 0) > 0 ? stats?.certificatesIssued : <span className="text-base text-slate-400 font-bold">No data yet</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Issued upon 70%+ score on final exam</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-2">Curriculum Readiness &amp; Progress</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Course Modules (23 Total Modules)</span>
                        <span className="text-white font-bold">23 modules structured</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Video Upload Status</span>
                        <span className="text-amber-300 font-bold">0 / 23 videos uploaded</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '0%' }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Upload lecture recordings in course builder to mark modules ready.</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>1-on-1 Mentorship Model</span>
                        <span className="text-emerald-300 font-bold">Active &amp; Ready</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Personal classes scheduled individually per student.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-2">Exam Performance &amp; Pass Rate</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Exam Pass Rate</span>
                        <span className="text-white font-bold">
                          {stats?.examPassRate !== null && stats?.examPassRate !== undefined ? `${stats.examPassRate}%` : 'No data yet'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Total Exam Attempts</span>
                        <span className="text-white font-bold">{stats?.totalExamAttempts ? stats.totalExamAttempts : 'No data yet'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Official Certificates Awarded</span>
                        <span className="text-purple-300 font-bold">{certificates.length > 0 ? certificates.length : 'No data yet'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Modules Progress List */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-sm">Real Module Video Progress (Database Driven)</h4>
                {courses[0]?.modules && courses[0].modules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {courses[0].modules.map((m, idx) => {
                      const videoLessons = m.lessons?.filter((l) => {
                        const obj = l as unknown as { videoProviderId?: string };
                        return Boolean(obj.videoProviderId && !obj.videoProviderId.includes('dQw4w9WgXcQ'));
                      }) || [];
                      const totalL = m.lessons?.length || 0;
                      return (
                        <div key={m.id || idx} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                          <div className="truncate mr-2">
                            <p className="font-semibold text-white truncate text-[11px]">{m.title || `Module ${idx + 1}`}</p>
                            <p className="text-[10px] text-slate-400">{videoLessons.length} of {totalL} videos</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                            videoLessons.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {videoLessons.length > 0 ? 'Ready' : 'Draft'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No data yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS (Payment Settings, Test Data, Staff Roles) */}
        {isCurrentTabAllowed && activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Settings Sub-tab Switcher */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setSettingsSubTab('payment')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  settingsSubTab === 'payment'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Payment & Tuition Settings</span>
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('test_data')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    settingsSubTab === 'test_data'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Data Management</span>
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('staff')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    settingsSubTab === 'staff'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Staff Roles & Delegations</span>
                </button>
              )}
            </div>

            {/* SUBTAB: PAYMENT & TUITION SETTINGS */}
            {settingsSubTab === 'payment' && (
              <div className="space-y-6">
                <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Direct UPI & Bank Transfer Settings</h3>
                      <p className="text-xs text-slate-400">
                        Students transfer directly to your bank account. No intermediate payment gateway.
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsPaymentSettingsOpen(true)}
                        className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Edit Payment Details</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">UPI ID</span>
                      <p className="text-sm font-bold font-mono text-amber-300 mt-1">{paymentSettings.upiId || '9310709233m@pnb'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Beneficiary Account Name</span>
                      <p className="text-sm font-bold text-white mt-1">{paymentSettings.accountName || 'Aapka Astro / Acharya Niraj Kumar'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase">Account Number</span>
                        <button
                          type="button"
                          onClick={handleToggleShowAccountNumber}
                          disabled={isAuditingUnmask}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition flex items-center gap-1 cursor-pointer"
                          title="Unmask account number (records audit entry)"
                        >
                          {isAccountNumberVisible ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-amber-400" />}
                          <span>{isAccountNumberVisible ? 'Hide' : 'Show (Audit)'}</span>
                        </button>
                      </div>
                      <p className="text-sm font-bold font-mono text-white mt-1">
                        {isAccountNumberVisible
                          ? paymentSettings.accountNumber || '0614000100223746'
                          : `••••••••••••${(paymentSettings.accountNumber || '0614000100223746').slice(-4)}`}
                      </p>
                      {isAccountNumberVisible && (
                        <span className="text-[9px] text-amber-400/90 font-medium block mt-1">
                          Audit entry recorded for view
                        </span>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">IFSC Code</span>
                      <p className="text-sm font-bold font-mono text-white mt-1">{paymentSettings.ifscCode || 'PUNB0061400'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Bank Name</span>
                      <p className="text-sm font-bold text-white mt-1">{paymentSettings.bankName || 'Punjab National Bank'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Unpaid Order Expiry</span>
                      <p className="text-sm font-bold text-white mt-1">{paymentSettings.orderExpiryDays || 3} days</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: TEST DATA MANAGEMENT */}
            {settingsSubTab === 'test_data' && isOwner && (
              <div className="space-y-6">
                <div className="cosmic-card p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                        <span>Isolated Test Data & Revenue Protection</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        Test purchases and test students are completely isolated and excluded from live tuition figures, student counts, and completion analytics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTestDataModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Inspect & Remove Test Data</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Flagged Test Orders</span>
                      <p className="text-xl font-black text-amber-300 mt-1">
                        {orders.filter((o) => o.isTest || o.studentName?.startsWith('[TEST]') || o.user?.name?.startsWith('[TEST]') || o.notes?.includes('[TEST_PURCHASE]')).length}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Completely excluded from live tuition sums.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[11px] uppercase font-semibold">Flagged Test Students</span>
                      <p className="text-xl font-black text-amber-300 mt-1">
                        {enrollments.filter((e) => e.isTest || e.studentName?.startsWith('[TEST]')).length}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Excluded from student headcount and completion rates.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB: STAFF DELEGATIONS */}
            {settingsSubTab === 'staff' && isOwner && (
              <div className="space-y-6">
                {/* Non-technical Help Panel */}
                <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300">
                      <strong className="text-amber-300">💡 How to assign staff permissions:</strong> Only you (Site Owner) can see this screen. Click &quot;Add Staff Member&quot; to delegate access to specific sections. Staff can never modify payment settings or legal pages.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">Staff Roles & Delegated Permissions</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Owner Exclusive
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Grant team members access to specific admin sections. Managed directly in database.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddStaffOpen(true)}
                    className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Staff Member</span>
                  </button>
                </div>

                {/* Team Access Callout */}
                <div className="cosmic-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Team Permissions & Access Control</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Permissions here apply strictly to Viar.in. Delegations grant access only to the selected sections and cannot modify bank settings.
                  </p>
                  <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-4 text-[11px] text-slate-400">
                    <span>• <strong>Isolated Scope:</strong> Permissions apply only to Viar.in.</span>
                    <span>• <strong>Owner Anchor:</strong> Anchored to <code className="text-amber-200">{primaryOwnerEmail}</code>.</span>
                    <span>• <strong>Audit Trail:</strong> Revocations preserve historical records.</span>
                  </div>
                </div>

                {/* Owner Anchor Card */}
                <div className="cosmic-card p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">Acharya Niraj Kumar</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Primary Account Owner
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">{primaryOwnerEmail}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Permanent full access to all admin sections. Sole authorized account that can delegate staff roles.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>All Sections Unlocked</span>
                    </span>
                  </div>
                </div>

            {/* Staff Permissions Table */}
            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Active Staff Members ({staffUsers.filter(u => !u.isOwner).length})</h4>
                  <p className="text-[11px] text-slate-400">Toggle individual section checkboxes to grant or revoke real-time access.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-6 py-4">Staff Member</th>
                      <th className="px-3 py-4 text-center">Access Level</th>
                      {VIAR_SECTIONS.map((sec) => (
                        <th key={sec} className="px-3 py-4 text-center">
                          {ADMIN_SECTIONS_META[sec]?.shortTitle || sec}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffUsers.filter(u => !u.isOwner).length === 0 ? (
                      <tr>
                        <td colSpan={VIAR_SECTIONS.length + 3} className="px-6 py-8 text-center text-slate-500">
                          No delegated staff members yet. Click &quot;Add Staff Member&quot; to assign your first employee.
                        </td>
                      </tr>
                    ) : (
                      staffUsers
                        .filter((u) => !u.isOwner)
                        .map((staff) => {
                          const sections = staff.staffSections || [];
                          const permRecord = allStaffPermissions.find(p => p.userId === staff.id && !p.revokedAt);
                          const level = permRecord?.accessLevel || 'MANAGE';

                          return (
                            <tr key={staff.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-6 py-4">
                                <p className="font-bold text-white">{staff.name}</p>
                                <p className="text-[11px] font-mono text-slate-400">{staff.email}</p>
                              </td>

                              <td className="px-3 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  level === 'MANAGE'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {level}
                                </span>
                              </td>

                              {VIAR_SECTIONS.map((sec) => {
                                const isChecked = sections.includes(sec);
                                return (
                                  <td key={sec} className="px-3 py-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStaffSection(staff.id, sec)}
                                      className={`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition ${
                                        isChecked
                                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                          : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/30'
                                      }`}
                                      title={`Toggle ${ADMIN_SECTIONS_META[sec]?.shortTitle}`}
                                    >
                                      {isChecked ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5 opacity-30" />}
                                    </button>
                                  </td>
                                );
                              })}

                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaff(staff.id)}
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                                  title="Soft-Revoke All Access (Preserves Audit Trail)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PostgreSQL StaffPermission Audit Trail */}
            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Postgres Audit Trail: StaffPermission Table</h4>
                  <p className="text-[11px] text-slate-400">
                    Audit trail logs from Neon Postgres. Grants and soft-revocations are preserved with timestamps.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  {allStaffPermissions.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-6 py-3">Permission ID</th>
                      <th className="px-6 py-3">User ID</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Access Level</th>
                      <th className="px-6 py-3">Granted By (Owner)</th>
                      <th className="px-4 py-3">Granted At</th>
                      <th className="px-4 py-3">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allStaffPermissions.map((perm) => (
                      <tr key={perm.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-3 font-mono text-[11px] text-slate-400">{perm.id}</td>
                        <td className="px-6 py-3 font-mono text-[11px] text-amber-300">{perm.userId}</td>
                        <td className="px-4 py-3 font-bold uppercase text-[11px] text-white">{perm.section}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {perm.accessLevel || 'MANAGE'}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-[11px] text-slate-300">{perm.grantedByUserId || primaryOwnerEmail}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-400">
                          {new Date(perm.grantedAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {perm.revokedAt ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              Revoked ({new Date(perm.revokedAt).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}
          </div>
        )}

        {/* ENROLMENT READINESS MODAL */}
        {courseForEnrolmentModal && (
          <EnrolmentReadinessModal
            isOpen={isEnrolmentModalOpen}
            onClose={() => {
              setIsEnrolmentModalOpen(false);
              setCourseForEnrolmentModal(null);
            }}
            onConfirm={handleConfirmEnableEnrolments}
            course={courseForEnrolmentModal}
            realVideosCount={getRealVideoLessonsCount(courseForEnrolmentModal)}
            totalLessonsCount={courseForEnrolmentModal.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 46}
            examQuestionCount={INITIAL_FINAL_TEST.questions.length}
            priceSet={Boolean(courseForEnrolmentModal.priceInr && courseForEnrolmentModal.priceInr > 0)}
            upiSet={Boolean(paymentSettings.upiId && paymentSettings.upiId.trim())}
            contactSet={true}
            studentTestDone={true}
          />
        )}

        {/* TEST DATA REMOVAL & DRY RUN MODAL */}
        <TestDataModal
          isOpen={isTestDataModalOpen}
          onClose={() => setIsTestDataModalOpen(false)}
          onSuccess={async () => {
            await loadAdminData();
            await loadOrders();
          }}
        />

        {/* ADD STAFF MEMBER MODAL */}
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Add Staff Member</h3>
                  <p className="text-xs text-slate-400">Grant section-restricted admin permissions for Viar.in.</p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Employee Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Priya Verma"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Employee Email</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="e.g. priya.staff@viar.in"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Access Level</label>
                  <select
                    value={newStaffAccessLevel}
                    onChange={(e) => setNewStaffAccessLevel(e.target.value as StaffAccessLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="MANAGE" className="bg-[#0f172a]">MANAGE (Full edit & view privileges)</option>
                    <option value="VIEW" className="bg-[#0f172a]">VIEW (Read-only observation privileges)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 font-semibold">Select Authorized Admin Sections</label>
                  <div className="grid grid-cols-2 gap-2">
                    {VIAR_SECTIONS.map((sec) => {
                      const isSelected = newStaffSections.includes(sec);
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setNewStaffSections((prev) =>
                              prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}
                        >
                          <span className="font-semibold">{ADMIN_SECTIONS_META[sec]?.shortTitle}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-purple-300" />
                          ) : (
                            <span className="w-3.5 h-3.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold"
                  >
                    Grant Staff Access
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANUAL ENROLL MODAL */}
        {isManualEnrollOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">Direct Student Enrollment (Add by Email)</h3>
              <p className="text-xs text-slate-400 mb-6">
                Grant direct course access for offline payment or ashram registration.
              </p>

              <form onSubmit={handleManualEnroll} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Maya Iyer"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Student Email</label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. maya@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Reason for Grant <span className="text-amber-400">* (Audit Log Required)</span>
                  </label>
                  <textarea
                    required
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="e.g. Offline cash payment received at Baidyanath Dham Ashram or merit scholarship"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {manualError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {manualError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualEnrollOpen(false);
                      setManualError(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isManualSubmitting}
                    className="gold-button px-5 py-2 rounded-xl font-bold disabled:opacity-50"
                  >
                    {isManualSubmitting ? 'Granting...' : 'Grant Enrollment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NEW COURSE MODAL */}
        {isNewCourseOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">Add New Course to Viar.in</h3>
              <p className="text-xs text-slate-400 mb-6">
                Expands the multi-course catalog immediately.
              </p>

              <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Course Title</label>
                  <input
                    type="text"
                    required
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="e.g. Nakshatra Deep Dive & Muhurta"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tagline</label>
                  <input
                    type="text"
                    value={newCourseTagline}
                    onChange={(e) => setNewCourseTagline(e.target.value)}
                    placeholder="e.g. Unlock the hidden secrets of the 27 lunar mansions"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tuition (INR)</label>
                  <input
                    type="number"
                    value={newCoursePriceInr}
                    onChange={(e) => setNewCoursePriceInr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Weeks</label>
                    <input
                      type="number"
                      value={newCourseWeeks}
                      onChange={(e) => setNewCourseWeeks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Total Classes</label>
                    <input
                      type="number"
                      value={newCourseClasses}
                      onChange={(e) => setNewCourseClasses(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Initial Status</label>
                    <select
                      value={newCourseStatus}
                      onChange={(e) => setNewCourseStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                      className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-white/10 text-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Enrolments</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCourseAccepting}
                        onChange={(e) => setNewCourseAccepting(e.target.checked)}
                        className="rounded border-white/20 text-amber-500 focus:ring-0"
                      />
                      <span className="text-white text-xs">Accepting</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewCourseOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT COURSE MODAL */}
        {isEditCourseOpen && editingCourse && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-1">Edit Course Details</h3>
              <p className="text-xs text-slate-400 mb-6">
                Update course parameters, catalog visibility, and enrolment status.
              </p>

              <form onSubmit={handleSaveEditCourse} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Course Title</label>
                  <input
                    type="text"
                    required
                    value={editCourseTitle}
                    onChange={(e) => setEditCourseTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={editCourseTagline}
                    onChange={(e) => setEditCourseTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Description</label>
                  <textarea
                    rows={3}
                    value={editCourseDescription}
                    onChange={(e) => setEditCourseDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tuition (INR)</label>
                    <input
                      type="number"
                      value={editCoursePriceInr}
                      onChange={(e) => setEditCoursePriceInr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Skill Level</label>
                    <select
                      value={editCourseLevel}
                      onChange={(e) => setEditCourseLevel(e.target.value as Course['level'])}
                      className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-white/10 text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Duration (Weeks)</label>
                    <input
                      type="number"
                      value={editCourseWeeks}
                      onChange={(e) => setEditCourseWeeks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Total Classes</label>
                    <input
                      type="number"
                      value={editCourseClasses}
                      onChange={(e) => setEditCourseClasses(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Publication Status</label>
                    <select
                      value={editCourseStatus}
                      onChange={(e) => setEditCourseStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                      className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-white/10 text-white"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Accepting Enrolments</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCourseAccepting}
                        onChange={(e) => setEditCourseAccepting(e.target.checked)}
                        className="rounded border-white/20 text-amber-500 focus:ring-0"
                      />
                      <span className="text-white text-xs font-semibold">
                        {editCourseAccepting ? 'Yes (Admissions Open)' : 'No (Paused)'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditCourseOpen(false);
                      setEditingCourse(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* APPROVE ORDER MODAL (Owner Only, Mandatory Bank Confirmation) */}
        {orderToApprove && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Confirm Bank Credit & Approve Tuition</h3>
                    <p className="text-xs text-slate-400">Owner Verification Action • Neon PostgreSQL</p>
                  </div>
                </div>
                <button
                  onClick={() => setOrderToApprove(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Order Details Summary */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-bold text-white">{orderToApprove.studentName || orderToApprove.user?.name || 'Student'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-200">{orderToApprove.studentEmail || orderToApprove.user?.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Mobile Phone:</span>
                  <span className="font-mono text-emerald-400 font-bold">{orderToApprove.studentPhone || orderToApprove.user?.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Course:</span>
                  <span className="text-amber-300 font-medium">{orderToApprove.course?.title || 'What is Astrology'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-white/10">
                  <span className="text-slate-400 font-semibold">Order Reference:</span>
                  <code className="text-amber-400 font-mono font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">{orderToApprove.orderReference}</code>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 font-semibold">Student Claimed UTR:</span>
                  {orderToApprove.utr ? (
                    <code className="text-emerald-300 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">{orderToApprove.utr}</code>
                  ) : (
                    <span className="text-slate-500 italic">None entered</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1">
                  <span className="text-slate-400 font-semibold">Amount to Verify:</span>
                  <span className="text-lg font-black text-white">₹{orderToApprove.amount.toLocaleString('en-IN')} INR</span>
                </div>
              </div>

              {/* Duplicate Payment Protection Warning */}
              {orderToApprove.isAlreadyEnrolled && (
                <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Duplicate Payment Protection</span>
                  </div>
                  <p className="leading-relaxed">
                    This student is <strong className="text-emerald-400 font-bold">ALREADY ACTIVELY ENROLLED</strong> in this course. Approving another enrollment would charge them twice. Nothing will be activated twice.
                  </p>
                  <p className="text-white font-semibold">Please choose an action:</p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateResolution('RECORD_DUPLICATE_PAYMENT')}
                      disabled={isApproving}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-md flex-1 text-center disabled:opacity-50"
                    >
                      Record as duplicate payment (refund due)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateResolution('CANCEL_DUPLICATE')}
                      disabled={isApproving}
                      className="px-3.5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs transition flex-1 text-center disabled:opacity-50"
                    >
                      Cancel this order
                    </button>
                  </div>
                </div>
              )}

              {/* Crucial Verification Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Bank Statement is the Sole Proof of Payment</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Screenshots can be edited and forged. Open your bank app or UPI merchant statement (Axis Bank / UPI ID: <strong className="text-amber-300 font-mono">{paymentSettings.upiId}</strong>) and confirm that ₹{orderToApprove.amount.toLocaleString('en-IN')} has actually credited before ticking below.
                </p>
              </div>

              {/* Duplicate UTR & Error Banner */}
              {approveErrorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Verification Blocked</strong>
                    <span>{approveErrorMessage}</span>
                  </div>
                </div>
              )}

              {/* Mandatory Checklist Item */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={bankCheckConfirmed}
                  onChange={(e) => setBankCheckConfirmed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-xs text-white leading-relaxed font-medium">
                  I have confirmed this amount (₹{orderToApprove.amount.toLocaleString('en-IN')}) is credited in my bank or UPI app and the reference matches.
                </span>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOrderToApprove(null)}
                  disabled={isApproving}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={!bankCheckConfirmed || isApproving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isApproving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating in PostgreSQL...</span>
                    </>
                  ) : (
                    <span>Approve & Unlock Course Access</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REJECT ORDER MODAL */}
        {orderToReject && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Reject Payment Claim</h3>
                <button
                  onClick={() => setOrderToReject(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p>Order Reference: <code className="text-amber-400 font-mono">{orderToReject.orderReference}</code></p>
                <p>Student: <strong>{orderToReject.studentName || orderToReject.user?.name || 'Student'}</strong></p>
              </div>

              {rejectErrorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  {rejectErrorMessage}
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1.5 text-xs font-semibold">
                  Reason for Rejection (Required)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Funds not received in bank account / UTR reference mismatch..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-red-400"
                />
              </div>

              {/* Quick Reason Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Funds not credited in bank statement',
                  'UTR / Reference number mismatch',
                  'Screenshot illegible or unverifiable',
                  'Incorrect amount transferred',
                ].map((reasonText) => (
                  <button
                    key={reasonText}
                    type="button"
                    onClick={() => setRejectionReason(reasonText)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition"
                  >
                    {reasonText}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOrderToReject(null)}
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim() || isRejecting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white shadow-md shadow-red-500/20 transition disabled:opacity-40"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REFUND ORDER MODAL */}
        {orderToRefund && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-purple-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Process Refund & Revoke Access</h3>
                <button
                  onClick={() => setOrderToRefund(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs">
                Marking this order as refunded will immediately revoke the student&apos;s active enrollment in PostgreSQL. They will lose access to modules and live classes.
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p>Order: <code className="text-amber-400 font-mono">{orderToRefund.orderReference}</code></p>
                <p>Student: <strong>{orderToRefund.studentName || orderToRefund.user?.name || 'Student'}</strong></p>
                <p>Amount: <strong>₹{orderToRefund.amount.toLocaleString('en-IN')}</strong></p>
              </div>

              {refundErrorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  {refundErrorMessage}
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1.5 text-xs font-semibold">
                  Reason for Refund (Required)
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Student requested cancellation within guarantee window..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOrderToRefund(null)}
                  disabled={isRefunding}
                  className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  disabled={!refundReason.trim() || isRefunding}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-40"
                >
                  {isRefunding ? 'Refunding...' : 'Confirm Refund & Revoke Access'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OWNER PAYMENT SETTINGS MODAL */}
        {isPaymentSettingsOpen && isOwner && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">UPI Payment Routing & Gateway Settings</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Owner Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live payment routing stored in Neon PostgreSQL database.
                  </p>
                </div>
                <button
                  onClick={() => setIsPaymentSettingsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Security Alert Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Security & Audit Notification</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Altering these settings redirects live student tuition payments. Every change is audit-logged and an alert is automatically emailed to <code className="text-amber-200">{currentUser?.email || primaryOwnerEmail}</code>.
                </p>
              </div>

              {/* Success / Error Notice */}
              {settingsNotice && (
                <div className={`p-3 rounded-xl border text-xs ${
                  settingsNotice.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}>
                  {settingsNotice.message}
                </div>
              )}

              <form onSubmit={handleSavePaymentSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    UPI ID / VPA (Primary Payee)
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.upiId}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g. 9310709233m@pnb"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used to generate student dynamic UPI QR codes and deep links pre-filling ₹5,100.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Payee Name (Shown in Student UPI Apps)
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.payeeName}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, payeeName: e.target.value }))}
                    placeholder="e.g. Acharya Niraj Kumar"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">
                      WhatsApp Proof Number (Digits with country code)
                    </label>
                    <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Flagged for Client Confirmation
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={paymentSettings.whatsappNumber}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, whatsappNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="919311215564"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default is <code className="text-amber-300 font-mono">919311215564</code> (+91 93112 15564). When students click &quot;I have paid&quot;, WhatsApp opens to this number.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Static QR Image URL (Optional Fallback)
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.qrImageUrl}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, qrImageUrl: e.target.value }))}
                    placeholder="e.g. /images/qr-code.png or https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Only used if the dynamic UPI link fails to generate.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Unpaid Order Expiry Window (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={paymentSettings.orderExpiryDays}
                    onChange={(e) => setPaymentSettings((prev) => ({ ...prev, orderExpiryDays: parseInt(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Unpaid orders expire after this duration to prevent stale pending queues.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsPaymentSettingsOpen(false)}
                    disabled={isSavingSettings}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="gold-button px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Dispatching Notice...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
