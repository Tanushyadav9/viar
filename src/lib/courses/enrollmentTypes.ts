import type { OrderData } from '@/lib/payments/orderTypes';

export type UserCourseState =
  | 'NOT_SIGNED_IN'
  | 'NO_ORDER'
  | 'ORDER_PENDING'
  | 'ORDER_CLAIMED'
  | 'ORDER_REJECTED'
  | 'ENROLLED'
  | 'ACCESS_REVOKED'
  | 'INVITATION_PENDING';

export interface UserCourseStatusResult {
  state: UserCourseState;
  isEnrolled: boolean;
  canAccessCourse: boolean;
  button: {
    text: string;
    textHi: string;
    href: string;
    variant: 'gold' | 'emerald' | 'amber' | 'slate' | 'outline';
    actionType: 'link' | 'redirect' | 'whatsapp' | 'login';
  };
  order?: OrderData | null;
  rejectionReason?: string | null;
  enrollmentId?: string | null;
  cohortId?: string | null;
  whatsappUrl: string;
  invitedEmail?: string | null;
}

export const OWNER_WHATSAPP_NUMBER = '919311215564';

export function getWhatsAppContactUrl(message: string): string {
  return `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
