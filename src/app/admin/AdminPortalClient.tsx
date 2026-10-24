'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Calendar,
  Edit,
  Plus,
  Users,
  CheckCircle2,
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
  BarChart3,
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
} from 'lucide-react';
import AdminHomeHub, { RecentActivityItem } from '@/components/admin/AdminHomeHub';
import AdminHelpBox from '@/components/admin/AdminHelpBox';
import {
  AsyncStateView,
  type AsyncStateStatus,
  type ErrorType,
} from '@/components/common/AsyncStateView';
import ContentStudio from '@/components/admin/ContentStudio';
import MediaLibrary from '@/components/admin/MediaLibrary';
import { ViarStore } from '@/lib/store';
import {
  ScheduledClass,
  Cohort,
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
import { formatInTimezone, getUserLocalTimezone } from '@/lib/timezones';
import { formatCourseStatus, formatClassStatus, formatOrderStatus } from '@/lib/utils/formatters';

interface AdminStats {
  totalStudents: number;
  totalRevenueInr: number;
  totalRevenueUsd: number;
  completedClasses: number;
  upcomingClasses: number;
  certificatesIssued: number;
  activeCohorts: number;
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
}

export interface PaymentSettingsState {
  upiId: string;
  payeeName: string;
  qrImageUrl: string;
  whatsappNumber: string;
  orderExpiryDays: number;
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
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('cohort-wia-batch-1');
  const [userTz, setUserTz] = useState<string>('Asia/Kolkata');

  // Editing Class Modal/Form State
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [editJoinUrl, setEditJoinUrl] = useState('');
  const [editMeetingId, setEditMeetingId] = useState('');
  const [editPasscode, setEditPasscode] = useState('');
  const [editPlatform, setEditPlatform] = useState<'ZOOM' | 'GOOGLE_MEET'>('ZOOM');
  const [editStatus, setEditStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

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
    upiId: 'aapkaastro@okaxis',
    payeeName: 'Acharya Niraj Kumar',
    qrImageUrl: '',
    whatsappNumber: '919311215564',
    orderExpiryDays: 3,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        if (data.orders && data.orders.length > 0) {
          const acts: RecentActivityItem[] = data.orders.slice(0, 6).map((o: AdminOrder) => ({
            id: o.id,
            type: 'payment',
            title: o.status === 'APPROVED' ? `Enrollment Approved (${o.orderReference})` : `UPI Payment Claimed (${o.orderReference})`,
            description: `₹${o.amount.toLocaleString()} ${o.currency} • ${o.studentName || o.studentEmail || 'Student'} (UTR: ${o.utr || 'Pending'})`,
            timestamp: o.claimedAt || o.createdAt,
            author: o.reviewedBy || undefined,
          }));
          setRecentActivities(acts);
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
          upiId: data.settings.upiId || 'aapkaastro@okaxis',
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

    const text = `Namaste ${studentName}! 🙏\n\nYour payment of ₹${order.amount.toLocaleString('en-IN')} for "${courseTitle}" (Order Ref: ${order.orderReference}) has been verified and confirmed.\n\nYour course access is now ACTIVE on viar.in! Simply log in to access all 23 video modules, notes, and live classes:\nhttps://viar.in/dashboard\n\nIf you have any questions, we are here to support you.\n\nWarm regards,\nVihangam Institute of Astrology & Research (VIAR)`;

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

    // 2. Fetch live cohorts from PostgreSQL
    let loadedCohorts: Cohort[] = [];
    try {
      const cohRes = await fetch('/api/cohorts');
      const cohData = await cohRes.json();
      if (cohData.success && Array.isArray(cohData.cohorts)) {
        loadedCohorts = cohData.cohorts;
        setCohorts(cohData.cohorts);
      }
    } catch {
      // cohorts fetch fallback
    }

    // 3. Fetch live class sessions from PostgreSQL
    let loadedClasses: ScheduledClass[] = [];
    try {
      const targetCohort = selectedCohortId || 'cohort-wia-batch-1';
      const sessRes = await fetch(`/api/sessions?cohortId=${encodeURIComponent(targetCohort)}`);
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
    const totalRevInr = loadedEnrollments
      .filter((e) => e.currency === 'INR')
      .reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);
    const totalRevUsd = loadedEnrollments
      .filter((e) => e.currency === 'USD')
      .reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);

    setStats({
      totalStudents: loadedEnrollments.length,
      totalRevenueInr: totalRevInr,
      totalRevenueUsd: totalRevUsd,
      completedClasses: loadedClasses.filter((c) => c.status === 'COMPLETED').length,
      upcomingClasses: loadedClasses.filter((c) => c.status !== 'COMPLETED').length,
      certificatesIssued: loadedCertificates.length,
      activeCohorts: loadedCohorts.filter((c) => c.status !== 'COMPLETED').length,
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
  }, [selectedCohortId, loadOrders, loadPaymentSettings, serverAuth]);

  useEffect(() => {
    loadAdminData();
    setUserTz(ViarStore.getTimezone() || getUserLocalTimezone());

    const handleTzChange = () => {
      setUserTz(ViarStore.getTimezone());
    };
    const handleRoleChange = () => {
      loadAdminData();
    };

    window.addEventListener('timezone-changed', handleTzChange);
    window.addEventListener('user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('timezone-changed', handleTzChange);
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

  const handleOpenEditClass = (cls: ScheduledClass) => {
    setEditingClass(cls);
    setEditJoinUrl(cls.joinUrl);
    setEditMeetingId(cls.meetingId || '');
    setEditPasscode(cls.passcode || '');
    setEditPlatform(cls.meetingPlatform);
    setEditStatus(cls.status);
    setEditVideoUrl(cls.recording?.videoUrl || '');
    setEditNotes(cls.recording?.notesMarkdown || '');
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const updates: Partial<ScheduledClass> = {
      joinUrl: editJoinUrl,
      meetingId: editMeetingId,
      passcode: editPasscode,
      meetingPlatform: editPlatform,
      status: editStatus,
    };

    if (editVideoUrl) {
      updates.recording = {
        id: editingClass.recording?.id || `rec-${editingClass.id}`,
        videoUrl: editVideoUrl,
        provider: 'YOUTUBE',
        durationMinutes: editingClass.durationMinutes,
        recordedDate: new Date().toISOString().split('T')[0],
        notesMarkdown: editNotes,
        keyTakeaways: editingClass.recording?.keyTakeaways || [
          'Detailed chart breakdown discussed in session',
          'Review notes and practice on sample Kundalis',
        ],
        resources: editingClass.recording?.resources || [],
      };
      if (editStatus === 'UPCOMING' || editStatus === 'LIVE') {
        updates.status = 'COMPLETED';
      }
    }

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId: editingClass.cohortId || selectedCohortId,
          sessionId: editingClass.id,
          sessionNumber: editingClass.classNumber,
          title: editingClass.title,
          description: editingClass.description,
          scheduledAt: editingClass.scheduledStartTime,
          durationMinutes: editingClass.durationMinutes,
          meetingPlatform: editPlatform,
          status: updates.status || editStatus,
          joinUrl: editJoinUrl,
          meetingId: editMeetingId,
          passcode: editPasscode,
          recordingUrl: editVideoUrl || undefined,
          notes: editNotes || undefined,
        }),
      });
    } catch (err) {
      console.warn('Session update API error:', err);
    }
    setEditingClass(null);
    await loadAdminData();
  };

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
          cohortId: selectedCohortId || 'cohort-wia-batch-1',
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
      subtitle: `${newCourseClasses} Classes • ${newCourseWeeks}-Week Live Cohort`,
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
    const newVal = crs.acceptingEnrollments === false ? true : false;
    try {
      await fetch(`/api/courses/${crs.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingEnrollments: newVal }),
      });
    } catch {
      // mutation fallback
    }
    await loadAdminData();
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

  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Role & Account Identification */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
                ? 'Full administrative control over all 8 modules, class schedules, financial telemetry, and staff delegations.'
                : `Section-restricted console. You currently have access to: ${allowedSections.map((s) => ADMIN_SECTIONS_META[s]?.shortTitle).join(', ') || 'None'}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner && (
              <Link
                href="/admin/knowledge"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Knowledge</span>
              </Link>
            )}

            {isOwner && (
              <Link
                href="/admin/diagnostics"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Diagnostics</span>
              </Link>
            )}

            <Link
              href="/instructor"
              className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <span>Course &amp; Curriculum Management &rarr;</span>
            </Link>

            {hasSectionPermission(currentUser, 'students') && (
              <button
                onClick={() => setIsManualEnrollOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Enroll Student</span>
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
                {stats.totalStudents > 0 ? `${stats.totalStudents} enrolled scholar${stats.totalStudents === 1 ? '' : 's'}` : 'Self-paced admissions open'}
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
              <p className="text-[11px] text-emerald-400 mt-1">Direct UPI QR • Zero gateway deductions</p>
            </div>

            <div className="cosmic-card p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Curriculum Status</span>
                <Video className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                23 <span className="text-sm text-slate-400 font-normal">Modules</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">100% self-paced on-demand video</p>
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

        {/* Tab Navigation with Dynamic Permission Locks */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-1">
          {/* Admin Home Hub Tab */}
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
              activeTab === 'home'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Admin Home</span>
          </button>

          {ADMIN_SECTIONS.map((sec) => {
            // Hide staff tab from non-owners completely
            if (sec === 'staff' && !isOwner) return null;

            // Staff see ONLY the sections granted in /admin/team
            if (!isOwner && !allowedSections.includes(sec)) return null;

            const isAllowed = isOwner || allowedSections.includes(sec);
            const meta = ADMIN_SECTIONS_META[sec];
            const isActive = activeTab === sec;

            return (
              <button
                key={sec}
                onClick={() => setActiveTab(sec)}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'border-purple-400 text-purple-300'
                    : isAllowed
                    ? 'border-transparent text-slate-400 hover:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-400 opacity-60'
                }`}
              >
                {!isAllowed && <Lock className="w-3 h-3 text-amber-400/70" />}
                {sec === 'content' && <FileText className="w-4 h-4 text-indigo-400" />}
                {sec === 'media' && <ImageIcon className="w-4 h-4 text-sky-400" />}
                {sec === 'courses' && <BookOpen className="w-4 h-4" />}
                {sec === 'cohorts' && <Calendar className="w-4 h-4" />}
                {sec === 'students' && <Users className="w-4 h-4" />}
                {sec === 'quizzes' && <Award className="w-4 h-4" />}
                {sec === 'analytics' && <BarChart3 className="w-4 h-4" />}
                {sec === 'payments' && <DollarSign className="w-4 h-4" />}
                {sec === 'staff' && <ShieldCheck className="w-4 h-4 text-amber-400" />}

                <span>{meta.shortTitle}</span>
                {sec === 'staff' && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">
                    Owner
                  </span>
                )}
              </button>
            );
          })}
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

        {/* TAB: CONTENT STUDIO */}
        {isCurrentTabAllowed && activeTab === 'content' && (
          <ContentStudio
            isOwner={isOwner}
            userEmail={currentUser?.email || ''}
            initialCollection={selectedContentCollection}
            onActivityLogged={loadAdminData}
          />
        )}

        {/* TAB: MEDIA LIBRARY */}
        {isCurrentTabAllowed && activeTab === 'media' && (
          <MediaLibrary
            isOwner={isOwner}
            userEmail={currentUser?.email || ''}
          />
        )}

        {/* TAB: COHORTS & SCHEDULE */}
        {isCurrentTabAllowed && activeTab === 'cohorts' && (
          <div className="space-y-8">
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to manage class sessions:</strong> Select your cohort batch below to view all scheduled classes. Click &quot;Edit Class&quot; to change Zoom or Google Meet links, meeting passcodes, or add lecture recordings once a class concludes.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Cohorts, Live Class Schedule & Links</h3>
                <p className="text-xs text-slate-400">
                  Update meeting links or record links. Students see these instantly in their dashboards.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Cohort:</span>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="bg-white/5 border border-white/10 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0f172a]">
                      {c.batchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="cosmic-card p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-white/10 text-amber-300">
                        Class {cls.classNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          cls.status === 'LIVE'
                            ? 'bg-amber-500 text-black'
                            : cls.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {formatClassStatus(cls.status)}
                      </span>
                      <span className="text-xs text-slate-400">Module {cls.moduleNumber}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                      {cls.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatInTimezone(cls.scheduledStartTime, userTz, 'short')}</span>
                      <span>•</span>
                      <span>Platform: <strong className="text-white">{cls.meetingPlatform}</strong></span>
                      {cls.passcode && <span>• Passcode: <span className="font-mono text-amber-300">{cls.passcode}</span></span>}
                      {cls.recording && (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Recording Attached
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Link & Recording</span>
                    </button>
                    <a
                      href={cls.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                      title="Test Join Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Attached Lecture Recordings Section */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Lecture Recordings Vault</h3>
                <p className="text-xs text-slate-400">
                  Manage Cloudflare Stream, Vimeo, or YouTube replay URLs for Cohort {selectedCohortId}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="cosmic-card p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Class {cls.classNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cls.recording ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {cls.recording ? 'REPLAY READY' : 'PENDING UPLOAD'}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{cls.title}</h4>
                    {cls.recording ? (
                      <div className="space-y-2 text-xs text-slate-400">
                        <p className="truncate font-mono bg-white/5 p-2 rounded-lg text-slate-300">
                          {cls.recording.videoUrl}
                        </p>
                        <p className="line-clamp-2 text-slate-400">{cls.recording.notesMarkdown || 'No study notes attached.'}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No recording uploaded yet for this session.</p>
                    )}
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="w-full mt-2 gold-button py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{cls.recording ? 'Update Video Link & Notes' : 'Attach Recording'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: COURSES */}
        {isCurrentTabAllowed && activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to manage courses:</strong> Review published courses below. Click &quot;Add New Course to Catalog&quot; to expand the curriculum, or update existing course descriptions and student fees.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Multi-Course Catalog Engine</h3>
                <p className="text-xs text-slate-400">
                  The platform is built to support infinite courses and cohorts without changing codebase.
                </p>
              </div>

              <button
                onClick={() => setIsNewCourseOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Course to Catalog</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((crs) => {
                const courseStatus = crs.status || (crs.isPublished ? 'PUBLISHED' : 'DRAFT');
                const isAccepting = crs.acceptingEnrollments !== false;
                const publishedLessonsCount = crs.modules?.reduce((acc, m) => {
                  if (m.lessons && m.lessons.length > 0) {
                    return acc + m.lessons.filter((l) => l.isPublished !== false).length;
                  }
                  return acc + (m.isPublished !== false ? 1 : 0);
                }, 0) || crs.totalClasses || 0;
                const totalModulesCount = crs.modules?.length || crs.totalClasses || 0;

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
                          {crs.durationWeeks} Weeks • {crs.totalClasses} Classes
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">{crs.title}</h4>
                        {crs.tagline && <p className="text-xs text-amber-300/80 mt-0.5 font-medium">{crs.tagline}</p>}
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{crs.description}</p>
                      </div>

                      {/* Visible Published Lesson Count — "Never advertise 23 modules when fewer lessons are live" */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-slate-300 font-medium">
                            <strong className="text-white">{publishedLessonsCount}</strong> Published Lessons Live ({totalModulesCount} Modules)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Dynamic Count</span>
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
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400">Tuition:</span>
                          <span className="font-bold text-white ml-1">₹{crs.priceInr.toLocaleString('en-IN')}</span>
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
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white flex items-center gap-1 border border-white/10"
                          >
                            <Edit className="w-3 h-3 text-amber-400" />
                            <span>Edit</span>
                          </button>

                          {courseStatus === 'PUBLISHED' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateCourseStatus(crs, 'ARCHIVED')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5"
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

        {/* TAB: STUDENTS / ROSTER */}
        {isCurrentTabAllowed && activeTab === 'students' && (
          <div className="space-y-6">
            <AdminHelpBox
              titleEn="Students & Scholars Management"
              titleHi="विद्यार्थी एवं अध्येता प्रबंधन"
              descriptionEn="View registered students, inspect course completion progress, or manually grant course access. When granting access manually, an audit reason is strictly recorded."
              descriptionHi="पंजीकृत विद्यार्थियों की सूची देखें, पाठ्यक्रम पूर्णता प्रगति जांचें या मैन्युअल रूप से कोर्स एक्सेस दें। मैन्युअल प्रवेश देते समय ऑडिट कारण अनिवार्य रूप से दर्ज किया जाता है।"
              tipsEn={[
                'Search by student name or email in the search bar.',
                'Click "Add Student Manually" to grant immediate access for scholarship or offline bank transfer.',
              ]}
              tipsHi={[
                'सर्च बार में विद्यार्थी के नाम या ईमेल से खोजें।',
                'छात्रवृत्ति या ऑफलाइन बैंक ट्रांसफर के लिए तुरंत प्रवेश देने हेतु "Add Student Manually" पर क्लिक करें।',
              ]}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

              <button
                onClick={() => setIsManualEnrollOpen(true)}
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student Manually</span>
              </button>
            </div>

            <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Course / Cohort</th>
                      <th className="px-6 py-4">Enrolled At</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Amount Paid</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrollmentsStatus !== 'success' || filteredEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center">
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
                      filteredEnrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{enr.studentName}</p>
                          <p className="text-[11px] text-slate-400">{enr.studentEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">What is Astrology</p>
                          <p className="text-[10px] text-amber-400">Cohort 01 (Autumn 2026)</p>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-200">{enr.paymentMethod}</p>
                          <p className="text-[10px] font-mono text-slate-500">{enr.paymentId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">
                            ₹{enr.paymentAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {enr.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYMENTS & UPI VERIFICATION */}
        {isCurrentTabAllowed && activeTab === 'payments' && (
          <div className="space-y-6">
            <AdminHelpBox
              titleEn="UPI Payments Verification Studio"
              titleHi="UPI भुगतान सत्यापन स्टूडियो"
              descriptionEn="Direct UPI QR Code payments have zero payment gateway deductions. Students transfer directly to your UPI ID (aapkaastro@okaxis) and submit their 12-digit bank UTR reference. Verify the credit in your bank app before approving access."
              descriptionHi="डायरेक्ट UPI क्यूआर कोड भुगतान में कोई पेमेंट गेटवे कटौती नहीं होती। विद्यार्थी सीधे आपकी UPI आईडी (aapkaastro@okaxis) पर भुगतान करते हैं और 12 अंकों का बैंक UTR संदर्भ दर्ज करते हैं। प्रवेश स्वीकृत करने से पहले अपने बैंक ऐप में क्रेडिट अवश्य जांचें।"
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
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Verify student transactions to unlock course access. Zero gateway commissions. Screenshots can be edited—verify the credit in your bank or UPI merchant app before approving.
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
                    ₹{orders.filter(o => o.status === 'APPROVED').reduce((acc, o) => acc + (o.amount || 0), 0).toLocaleString('en-IN') || stats?.totalRevenueInr.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-emerald-400 mt-1">Direct bank credit • Zero gateway fees</p>
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
                    {orderCounts.APPROVED || enrollments.filter(e => e.paymentAmount > 0).length}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Unlocked in PostgreSQL database</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">UPI VPA & WhatsApp</span>
                  <p className="text-sm font-mono font-bold text-white mt-1.5 truncate">
                    {paymentSettings.upiId || 'aapkaastro@okaxis'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                    WA: +{paymentSettings.whatsappNumber || '919311215564'}
                  </p>
                </div>
              </div>

              {/* Status Tabs and Search Filter Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                
                {/* Status Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1.5 rounded-xl border border-white/5">
                  {[
                    { id: 'PAYMENT_CLAIMED', label: 'Claimed', count: orderCounts.PAYMENT_CLAIMED, highlight: orderCounts.PAYMENT_CLAIMED > 0 },
                    { id: 'PENDING_PAYMENT', label: 'Awaiting Payment', count: orderCounts.PENDING_PAYMENT },
                    { id: 'APPROVED', label: 'Approved', count: orderCounts.APPROVED },
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          tab.highlight
                            ? 'bg-amber-500 text-black font-bold animate-pulse'
                            : isActive
                            ? 'bg-amber-400/30 text-amber-200'
                            : 'bg-white/10 text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
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
                      <th className="px-5 py-3.5">Course & Cohort</th>
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
                            emptyTitle={`No orders found in "${selectedOrderStatus}" queue.`}
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
                              <p className="text-slate-300 font-semibold mb-1">No orders found in &quot;{selectedOrderStatus}&quot; queue.</p>
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
                              <p className="font-bold text-white">{ord.studentName || ord.user?.name || 'Student'}</p>
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
                                {ord.cohort?.batchName || 'Masterclass Cohort'}
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
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
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

        {/* TAB: QUIZZES & CERTIFICATES */}
        {isCurrentTabAllowed && activeTab === 'quizzes' && (
          <div className="space-y-6">
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
                  Issued certificates with cryptographic verification codes. Publicly verifiable at viar.in/verify.
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
                  {certificates.map((cert) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ANALYTICS & PLATFORM TELEMETRY */}
        {isCurrentTabAllowed && activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to view analytics:</strong> Monitor student engagement across batches, video watch progress, and certification pass rates in real time.
                </p>
              </div>
            </div>

            <div className="cosmic-card p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-1">Platform Telemetry & Academic Analytics</h3>
              <p className="text-xs text-slate-400 mb-6">
                Real-time tracking of student completion, live lecture attendance, and quiz pass rates.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Course Delivery</span>
                  <p className="text-2xl font-black text-amber-300 mt-1">Self-Paced</p>
                  <p className="text-[10px] text-emerald-400 mt-1">23 on-demand modules published</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Course Completion Rate</span>
                  <p className="text-2xl font-black text-emerald-300 mt-1">
                    {stats && stats.totalStudents > 0 ? `${Math.round(((stats.certificatesIssued || 0) / stats.totalStudents) * 100)}%` : <span className="text-base text-slate-400 font-bold">No students yet</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{stats?.certificatesIssued || 0} certified of {stats?.totalStudents || 0} enrolled</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Verifiable Certificates</span>
                  <p className="text-2xl font-black text-purple-300 mt-1">
                    {(stats?.certificatesIssued || 0) > 0 ? stats?.certificatesIssued : <span className="text-base text-slate-400 font-bold">No certificates yet</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Issued upon 70%+ score on final exam</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-2">Curriculum Sessions & Progress</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Modules 1–8: Foundations & Astronomy</span>
                        <span className="text-white font-bold">{classes.filter((c) => c.classNumber <= 8 && c.status === 'COMPLETED').length} / 8 completed</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.round((classes.filter((c) => c.classNumber <= 8 && c.status === 'COMPLETED').length / 8) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Modules 9–16: 12 Rashis & Chart Casting</span>
                        <span className="text-white font-bold">{classes.filter((c) => c.classNumber > 8 && c.classNumber <= 16 && c.status === 'COMPLETED').length} / 8 completed</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.round((classes.filter((c) => c.classNumber > 8 && c.classNumber <= 16 && c.status === 'COMPLETED').length / 8) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Modules 17–23: Predictions & Certification</span>
                        <span className="text-white font-bold">{classes.filter((c) => c.classNumber > 16 && c.status === 'COMPLETED').length} / 7 completed</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.round((classes.filter((c) => c.classNumber > 16 && c.status === 'COMPLETED').length / 7) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-2">Student Reviews & Trust Indicators</h4>
                  <p className="text-xs text-slate-400 mb-3">Direct UPI verification active • Cryptographic certificate validation</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 text-xs font-bold">
                      ✓ System Active
                    </span>
                    <span className="text-xs text-slate-400">{certificates.length} Cryptographic Certificate{certificates.length === 1 ? "" : "s"} Issued</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: STAFF ROLES & PERMISSIONS (OWNER ONLY) */}
        {isCurrentTabAllowed && activeTab === 'staff' && isOwner && (
          <div className="space-y-6">
            {/* Non-technical Help Panel */}
            <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-300">💡 How to assign staff permissions:</strong> Only you (Site Owner) can see this screen. Click &quot;Add Staff Member&quot; to delegate access to specific tiles. Staff can never modify payment settings or legal pages.
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
                  Grant team members access to specific admin sections. Free Postgres-backed RBAC with zero Clerk add-on fees.
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

            {/* Architectural & Cost Callout */}
            <div className="cosmic-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Zero-Cost RBAC Architecture vs Paid Clerk Organizations</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clerk charges an expensive monthly subscription plus add-on fees for custom organization roles. We built this permission system inside your existing free Neon PostgreSQL database (<code className="text-amber-300">StaffPermission</code> table) and verified it in application code.
              </p>
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-4 text-[11px] text-slate-400">
                <span>• <strong>Isolated Scope:</strong> Permissions here apply strictly to Viar.in. Staff have zero access to Aapka Astro or sister systems.</span>
                <span>• <strong>Owner Anchor:</strong> Anchored to <code className="text-amber-200">{primaryOwnerEmail}</code>. Cannot be overridden by employees.</span>
                <span>• <strong>Audit Trail:</strong> Soft-revocations preserve full historical timestamps without permanent row deletion.</span>
              </div>
            </div>

            {/* Owner Anchor Card */}
            <div className="cosmic-card p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">Acharya Niraj Kumar</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Supreme Owner Anchor
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
                      <th className="px-3 py-4 text-center">Courses</th>
                      <th className="px-3 py-4 text-center">Cohorts</th>
                      <th className="px-3 py-4 text-center">Students</th>
                      <th className="px-3 py-4 text-center">Quizzes</th>
                      <th className="px-3 py-4 text-center">Analytics</th>
                      <th className="px-3 py-4 text-center">Payments</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {staffUsers.filter(u => !u.isOwner).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
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

        {/* EDIT CLASS MODAL */}
        {editingClass && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-purple-500/40 rounded-2xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Edit Class {editingClass.classNumber} Details
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{editingClass.title}</h3>
                </div>
                <button
                  onClick={() => setEditingClass(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Meeting Platform</label>
                    <select
                      value={editPlatform}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditPlatform(e.target.value as 'ZOOM' | 'GOOGLE_MEET')}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <option value="ZOOM" className="bg-[#0f172a]">Zoom</option>
                      <option value="GOOGLE_MEET" className="bg-[#0f172a]">Google Meet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditStatus(e.target.value as 'UPCOMING' | 'LIVE' | 'COMPLETED')}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <option value="UPCOMING" className="bg-[#0f172a]">Upcoming</option>
                      <option value="LIVE" className="bg-[#0f172a]">Live Now</option>
                      <option value="COMPLETED" className="bg-[#0f172a]">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Live Join Link (Zoom / Meet URL)</label>
                  <input
                    type="url"
                    required
                    value={editJoinUrl}
                    onChange={(e) => setEditJoinUrl(e.target.value)}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Meeting ID</label>
                    <input
                      type="text"
                      value={editMeetingId}
                      onChange={(e) => setEditMeetingId(e.target.value)}
                      placeholder="981 4238 5102"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Meeting Passcode</label>
                    <input
                      type="text"
                      value={editPasscode}
                      onChange={(e) => setEditPasscode(e.target.value)}
                      placeholder="VIAR2026"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Video Recording Embed URL (YouTube, Vimeo, Bunny, or Direct MP4)
                  </label>
                  <input
                    type="url"
                    value={editVideoUrl}
                    onChange={(e) => setEditVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/... or https://player.vimeo.com/video/..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white mb-2"
                  />
                  <p className="text-[11px] text-slate-400">
                    Adding a recording URL automatically makes the recording playable on student dashboards.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Study Notes (Markdown)</label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Key principles, chart examples, and formulas discussed in this lecture..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
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
              <h3 className="text-lg font-bold text-white mb-1">Manual Student Enrollment</h3>
              <p className="text-xs text-slate-400 mb-6">
                Grant offline or scholarship access to Cohort 01.
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
                  <span className="text-slate-400">Course / Cohort:</span>
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
                    placeholder="e.g. aapkaastro@okaxis"
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
