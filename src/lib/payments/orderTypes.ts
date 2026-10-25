export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CLAIMED'
  | 'APPROVED_ENROLLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface OrderData {
  id: string;
  orderReference: string;
  userId: string;
  courseId: string;
  cohortId?: string | null;
  amount: number;
  currency: string;
  status: OrderStatus;
  studentName?: string | null;
  studentEmail?: string | null;
  studentPhone: string;
  utr?: string | null;
  claimedAt?: Date | string | null;
  notes?: string | null;
  expiresAt: Date | string;
  reviewedBy?: string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
  bankConfirmed: boolean;
  refundedAt?: Date | string | null;
  refundReason?: string | null;
  enrollmentId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  cohort?: {
    id: string;
    batchName: string;
  };
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}
