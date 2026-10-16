/**
 * UPI QR & Direct Payment System
 * Vihangam Institute of Astrology and Research (VIAR)
 * 
 * Razorpay and Stripe have been completely removed.
 * Tuition is received via direct UPI QR to avoid 2-3% gateway commissions.
 * 
 * Verification workflow:
 * 1. Visitor signs up / logs in and visits course checkout
 * 2. Scans UPI QR code (or pays to aapkaastro@okaxis)
 * 3. Enters UTR / transaction reference and sends screenshot to WhatsApp (+91 93112 15564)
 * 4. Owner verifies payment in Owner Studio and clicks "Verify & Activate Access"
 * 5. Student's existing login automatically unlocks the course (no passwords sent over WhatsApp)
 */

export const UPI_CONFIG = {
  vpa: 'aapkaastro@okaxis',
  payeeName: 'Vihangam Institute of Astrology and Research',
  ownerWhatsApp: '919311215564',
  ownerWhatsAppDisplay: '+91 93112 15564',
  ownerEmail: 'aapkaastro1606@gmail.com',
  defaultAmountInr: 5100,
  currency: 'INR',
};

/**
 * Generate standard UPI Payment Intent URL / QR Payload
 */
export function generateUpiUrl(params: {
  amount?: number;
  studentName?: string;
  courseTitle?: string;
}): string {
  const amount = params.amount || UPI_CONFIG.defaultAmountInr;
  const note = encodeURIComponent(`VIAR Astrology Tuition - ${params.studentName || 'Student'}`);
  const payee = encodeURIComponent(UPI_CONFIG.payeeName);
  return `upi://pay?pa=${UPI_CONFIG.vpa}&pn=${payee}&am=${amount}&cu=INR&tn=${note}`;
}

/**
 * Generate direct WhatsApp message URL for student to submit payment screenshot to Owner
 */
export function generateWhatsAppPaymentSubmissionUrl(params: {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseTitle: string;
  amount: number;
  utr?: string;
}): string {
  const message = [
    `*VIAR Astrology Course Payment Submission*`,
    ``,
    `*Student Name:* ${params.studentName}`,
    `*Email:* ${params.studentEmail}`,
    params.studentPhone ? `*Phone:* ${params.studentPhone}` : null,
    `*Course:* ${params.courseTitle}`,
    `*Amount Paid:* ₹${params.amount.toLocaleString('en-IN')}`,
    params.utr ? `*UPI Transaction ID / UTR:* ${params.utr}` : null,
    ``,
    `I have completed the UPI payment. Please find the payment screenshot attached. Kindly verify and activate my course access.`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${UPI_CONFIG.ownerWhatsApp}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate direct WhatsApp activation confirmation message URL for Owner to notify student
 * NOTE: Never sends passwords or credentials. Access unlocks through the student's own account.
 */
export function generateWhatsAppActivationUrl(params: {
  studentPhone: string;
  studentName: string;
  courseTitle: string;
}): string {
  const phoneClean = params.studentPhone.replace(/[^0-9]/g, '');
  const targetPhone = phoneClean.startsWith('91') && phoneClean.length === 12
    ? phoneClean
    : phoneClean.length === 10
    ? `91${phoneClean}`
    : phoneClean;

  const message = [
    `*Namaste ${params.studentName}!* ðŸ™âœ¨`,
    ``,
    `Your payment for *${params.courseTitle}* has been verified by the academy.`,
    ``,
    `âœ… *Your Course Access is now ACTIVE.*`,
    ``,
    `To access your lessons, video lectures, reference notes, and class schedule:`,
    `1. Visit *https://viar.in/login*`,
    `2. Sign in with your registered account (${params.studentName})`,
    `3. Go directly to your Student Dashboard to start learning!`,
    ``,
    `_No separate passwords are required — your own secure login unlocks the course directly._`,
    ``,
    `Wishing you profound spiritual and astrological mastery.`,
    `*Vihangam Institute of Astrology and Research*`,
  ].join('\n');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate pre-filled WhatsApp link for student to submit payment proof to Owner
 */
export function buildStudentWhatsAppClaimUrl(params: {
  ownerPhone: string;
  studentName: string;
  studentPhone: string;
  courseTitle: string;
  amount: number;
  orderReference: string;
  utr?: string | null;
}): string {
  const lines = [
    `*VIAR Astrology Course Payment Proof*`,
    ``,
    `*Student Name:* ${params.studentName}`,
    `*Phone:* ${params.studentPhone}`,
    `*Course:* ${params.courseTitle}`,
    `*Amount Paid:* ₹${params.amount.toLocaleString('en-IN')}`,
    `*Order Reference:* ${params.orderReference}`,
    params.utr ? `*UPI Transaction ID (UTR):* ${params.utr}` : null,
    ``,
    `I have completed the UPI payment. Please find the payment screenshot attached. Kindly verify my transaction in bank records and activate my course access.`,
  ].filter(Boolean);

  return `https://wa.me/${params.ownerPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
