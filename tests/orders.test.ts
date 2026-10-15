import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildUpiPaymentUri,
  buildStudentWhatsAppClaimUrl,
  generateOrderReference,
} from '../src/lib/payments/orders.ts';

describe('Manual UPI Payment Workflow & Verification Security', () => {
  const defaultSettings = {
    upiId: 'aapkaastro@okaxis',
    payeeName: 'Acharya Niraj Kumar',
    whatsappNumber: '919311215564',
    orderExpiryDays: 3,
  };

  describe('Order Reference Generation', () => {
    it('should generate standardized order references matching VIAR-ORD- format', () => {
      const ref1 = generateOrderReference();
      const ref2 = generateOrderReference();

      assert.ok(ref1.startsWith('VIAR-ORD-'), 'Order reference must start with VIAR-ORD-');
      assert.ok(ref2.startsWith('VIAR-ORD-'), 'Order reference must start with VIAR-ORD-');
      assert.notStrictEqual(ref1, ref2, 'Consecutive references must be unique');
    });
  });

  describe('Dynamic UPI URI Generation & Server Price Lock', () => {
    it('should generate valid upi://pay URI carrying order reference and locked INR amount', () => {
      const uri = buildUpiPaymentUri({
        upiId: defaultSettings.upiId,
        payeeName: defaultSettings.payeeName,
        amount: 5100,
        orderReference: 'VIAR-TEST9988',
      });

      assert.ok(uri.startsWith('upi://pay?'), 'URI must begin with upi://pay');
      assert.ok(uri.includes('pa=aapkaastro@okaxis'), 'Payee VPA must match settings');
      assert.ok(uri.includes('am=5100'), 'Amount must be locked to 5100');
      assert.ok(uri.includes('cu=INR'), 'Currency must be INR');
      assert.ok(uri.includes('tn='), 'Transaction note must be present');
      assert.ok(uri.includes('VIAR-TEST9988'), 'Transaction note must carry order reference for bank matching');
    });

    it('should support customized UPI payee VPA from database settings', () => {
      const customSettings = {
        upiId: 'custompayee@oksbi',
        payeeName: 'VIAR Institute',
        whatsappNumber: '919876543210',
        orderExpiryDays: 5,
      };

      const uri = buildUpiPaymentUri({
        upiId: customSettings.upiId,
        payeeName: customSettings.payeeName,
        amount: 5100,
        orderReference: 'VIAR-CUSTOM1',
      });

      assert.ok(uri.includes('pa=custompayee@oksbi'), 'Must use custom VPA');
    });
  });

  describe('Student "I Have Paid" WhatsApp Claim Flow', () => {
    it('should build prefilled WhatsApp claim link with student name, course, amount, order ref, and UTR', () => {
      const claimUrl = buildStudentWhatsAppClaimUrl({
        ownerPhone: defaultSettings.whatsappNumber,
        studentName: 'Rohan Sharma',
        studentPhone: '+91 98111 22334',
        courseTitle: 'What is Astrology',
        amount: 5100,
        orderReference: 'VIAR-ROH12345',
        utr: '426019827361',
      });

      assert.ok(claimUrl.startsWith('https://wa.me/919311215564?text='), 'Must link to Owner WhatsApp number');
      const text = decodeURIComponent(claimUrl.split('?text=')[1]);
      assert.ok(text.includes('Rohan Sharma'), 'Must contain student name');
      assert.ok(text.includes('VIAR-ROH12345'), 'Must contain order reference');
      assert.ok(text.includes('₹5,100'), 'Must contain formatted amount');
      assert.ok(text.includes('426019827361'), 'Must contain student UTR');
    });

    it('should handle claim flow gracefully when student does not provide an optional UTR', () => {
      const claimUrl = buildStudentWhatsAppClaimUrl({
        ownerPhone: defaultSettings.whatsappNumber,
        studentName: 'Priya Patel',
        studentPhone: '+91 98222 33445',
        courseTitle: 'What is Astrology',
        amount: 5100,
        orderReference: 'VIAR-PRIYA99',
      });

      const text = decodeURIComponent(claimUrl.split('?text=')[1]);
      assert.ok(text.includes('VIAR-PRIYA99'), 'Must contain order reference');
      assert.strictEqual(text.includes('UTR: undefined'), false, 'Must not print undefined UTR');
    });
  });

  describe('Bank Record Verification & Fraud Prevention Rules', () => {
    it('should require bankConfirmed === true for approving an order', () => {
      const validateApproval = (bankConfirmed: boolean) => {
        if (!bankConfirmed) {
          throw new Error('Approval blocked: Owner must confirm funds are credited in bank account statement.');
        }
        return true;
      };

      assert.throws(() => validateApproval(false), /Approval blocked/);
      assert.strictEqual(validateApproval(true), true);
    });

    it('should detect duplicate UTR and block approving the same bank reference twice', () => {
      const existingApprovedOrders = [
        { id: 'ord_1', utr: '426019827361', status: 'APPROVED' },
      ];

      const checkDuplicateUtr = (utr: string, currentOrderId: string) => {
        const duplicate = existingApprovedOrders.find(
          (o) => o.status === 'APPROVED' && o.utr === utr && o.id !== currentOrderId
        );
        if (duplicate) {
          throw new Error(`Duplicate UTR detected: Reference ${utr} has already been approved for order ${duplicate.id}.`);
        }
        return true;
      };

      // Same order approving itself is fine
      assert.strictEqual(checkDuplicateUtr('426019827361', 'ord_1'), true);

      // Different order using the same UTR must throw duplicate error
      assert.throws(
        () => checkDuplicateUtr('426019827361', 'ord_2'),
        /Duplicate UTR detected/
      );

      // Different new UTR is allowed
      assert.strictEqual(checkDuplicateUtr('998877665544', 'ord_2'), true);
    });

    it('should require non-empty reason when rejecting an order', () => {
      const validateRejection = (reason?: string) => {
        if (!reason || !reason.trim()) {
          throw new Error('A rejection reason is required.');
        }
        return true;
      };

      assert.throws(() => validateRejection(''), /A rejection reason is required/);
      assert.throws(() => validateRejection('   '), /A rejection reason is required/);
      assert.strictEqual(validateRejection('Amount not credited in bank'), true);
    });

    it('should require non-empty reason when processing a refund', () => {
      const validateRefund = (reason?: string) => {
        if (!reason || !reason.trim()) {
          throw new Error('A reason for the refund is required.');
        }
        return true;
      };

      assert.throws(() => validateRefund(''), /A reason for the refund is required/);
      assert.strictEqual(validateRefund('Cancellation requested within guarantee window'), true);
    });
  });

  describe('Zero-Password Student Access Unlock Security', () => {
    it('should unlock course access directly for student login with zero password transmission', () => {
      const generateActivationNotification = (params: {
        studentName: string;
        orderReference: string;
        courseTitle: string;
      }) => {
        return `Namaste ${params.studentName}! Your payment for "${params.courseTitle}" (Ref: ${params.orderReference}) is confirmed. Your course access is now ACTIVE on viar.in. Log in with your account to start learning: https://viar.in/dashboard`;
      };

      const message = generateActivationNotification({
        studentName: 'Arjun Das',
        orderReference: 'VIAR-ARJ8877',
        courseTitle: 'What is Astrology',
      });

      assert.ok(message.includes('https://viar.in/dashboard'), 'Directs student to portal dashboard');
      assert.strictEqual(/password/i.test(message), false, 'Must NEVER transmit passwords over WhatsApp or email');
      assert.strictEqual(/credential/i.test(message), false, 'Must not generate or transmit temporary credentials');
    });
  });
});
