/**
 * Structured Knowledge Base: Pricing, Payment, Refund, and Certification Policies
 * Extracted directly from /pricing-policy, /refund-policy, and /terms.
 */

export const POLICIES_KNOWLEDGE = {
  paymentPolicy: {
    method: 'Direct UPI QR Code & Direct Bank Transfer (0% gateway surcharge)',
    upiVpa: '9310709233m@pnb',
    payeeName: 'Vihangam Institute of Astrology and Research',
    checkoutProcess: [
      '1. Student visits /checkout or clicks Enroll Now.',
      '2. Scans the dynamic UPI QR code or copies the UPI ID (9310709233m@pnb).',
      '3. Completes payment in any UPI app (GPay, PhonePe, Paytm, BHIM, Cred).',
      '4. Submits the 12-digit UTR reference number on the checkout page.',
      '5. Sends screenshot to WhatsApp (+91 93112 15564) for instant reconciliation.',
      '6. Owner verifies credit in bank and approves order in Admin Studio.',
      '7. Student account unlocks instantly with full access to all 23 modules.',
    ],
    zeroPasswordsRule:
      'No passwords are ever sent over WhatsApp. The course is unlocked directly on the student’s existing registered viar.in account.',
  },
  refundPolicy: {
    guaranteeName: '7-Day Review Window & 100% Full Refund Guarantee',
    terms: [
      'Full 100% refund available within 7 calendar days of enrollment approval.',
      'Student must have watched 3 or fewer modules (progress <= 3 modules).',
      'Processed via direct UPI transfer back to the student’s bank account within 24–48 hours.',
      'Beyond 7 days, or if more than 3 modules have been viewed, tuition is non-refundable.',
    ],
  },
  certificationPolicy: {
    eligibility: 'Must watch all 23 video modules and achieve >= 70% score on the 10-question final quiz.',
    format: 'Verifiable cryptographic certificate with unique code (e.g. VIAR-2026-WIA-XXXX).',
    verificationUrl: 'https://viar.in/verify',
  },
};
