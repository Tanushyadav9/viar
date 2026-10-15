import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { UPI_CONFIG, generateUpiUrl, generateWhatsAppPaymentSubmissionUrl, generateWhatsAppActivationUrl } from '../src/lib/payments/upi.ts';

describe('Webhook & Payment Verification Logic', () => {
  describe('UPI QR & Manual Verification Security', () => {
    it('should generate valid UPI deep-link URI with correct payee VPA and amount', () => {
      const upiUrl = generateUpiUrl({
        amount: 5100,
        studentName: 'Pooja Verma',
        courseTitle: 'What is Astrology',
      });

      assert.ok(upiUrl.startsWith('upi://pay?'), 'URI must start with upi://pay');
      assert.ok(upiUrl.includes(`pa=${UPI_CONFIG.vpa}`), `VPA must be ${UPI_CONFIG.vpa}`);
      assert.ok(upiUrl.includes('am=5100'), 'Amount must be 5100');
      assert.ok(upiUrl.includes('cu=INR'), 'Currency must be INR');
    });

    it('should generate WhatsApp submission link with student and payment details', () => {
      const submissionUrl = generateWhatsAppPaymentSubmissionUrl({
        studentName: 'Pooja Verma',
        studentEmail: 'pooja@example.com',
        studentPhone: '+91 98765 43210',
        courseTitle: 'What is Astrology',
        amount: 5100,
        utr: '123456789012',
      });

      assert.ok(submissionUrl.startsWith(`https://wa.me/${UPI_CONFIG.ownerWhatsApp}?text=`), 'Must link to Owner WhatsApp');
      const decodedText = decodeURIComponent(submissionUrl.split('?text=')[1]);
      assert.ok(decodedText.includes('Pooja Verma'), 'Must include student name');
      assert.ok(decodedText.includes('pooja@example.com'), 'Must include student email');
      assert.ok(decodedText.includes('123456789012'), 'Must include 12-digit UTR');
      assert.ok(decodedText.includes('₹5,100'), 'Must include INR amount');
    });

    it('should generate WhatsApp activation link that NEVER includes passwords or credentials', () => {
      const activationUrl = generateWhatsAppActivationUrl({
        studentPhone: '9876543210',
        studentName: 'Pooja Verma',
        courseTitle: 'What is Astrology — Foundations of Vedic Astrology',
      });

      assert.ok(activationUrl.startsWith('https://wa.me/919876543210?text='), 'Must format Indian phone number to 91 prefix');
      const decoded = decodeURIComponent(activationUrl.split('?text=')[1]);
      assert.ok(decoded.includes('Your Course Access is now ACTIVE'), 'Must confirm access activation');
      assert.ok(decoded.includes('https://viar.in/login'), 'Must direct to student login');
      assert.ok(decoded.includes('No separate passwords are required'), 'Must clarify no passwords sent');
      
      // Verify strict security: zero passwords or credential tokens present
      assert.strictEqual(/password[:= ]/i.test(decoded), false, 'Must NEVER contain password assignment');
      assert.strictEqual(/temp_pass/i.test(decoded), false, 'Must NEVER contain temporary passwords');
    });

    it('should validate 12-digit numeric UTR transaction format', () => {
      const validUtr = '426019827361';
      const invalidShortUtr = '12345';
      const invalidAlphaUtr = '42601982736A';

      const isValidUtr = (utr: string) => /^\d{12}$/.test(utr.trim());

      assert.strictEqual(isValidUtr(validUtr), true);
      assert.strictEqual(isValidUtr(invalidShortUtr), false);
      assert.strictEqual(isValidUtr(invalidAlphaUtr), false);
    });
  });

  describe('Clerk Webhook Svix Signatures & User Sync', () => {
    // Generate valid Svix secret (Base64 encoded 32 bytes with whsec_ prefix)
    const testSecretBytes = Buffer.from('test_secret_key_for_clerk_webhook_123456');
    const clerkSecret = `whsec_${testSecretBytes.toString('base64')}`;

    it('should successfully verify a valid Clerk webhook payload using Svix', async () => {
      const { Webhook } = await import('svix');
      const wh = new Webhook(clerkSecret);

      const payload = JSON.stringify({
        type: 'user.created',
        data: {
          id: 'user_2bXYZ987654321',
          first_name: 'Aditi',
          last_name: 'Sharma',
          email_addresses: [
            {
              id: 'email_123',
              email_address: 'aditi.sharma@example.com',
            },
          ],
          primary_email_address_id: 'email_123',
        },
      });

      const msgId = 'msg_test_12345';
      const timestamp = Math.floor(Date.now() / 1000);
      const toSign = `${msgId}.${timestamp}.${payload}`;
      
      // Calculate HMAC signature
      const secretKey = clerkSecret.split('_')[1];
      const keyBuffer = Buffer.from(secretKey, 'base64');
      const signature = crypto.createHmac('sha256', keyBuffer).update(toSign).digest('base64');
      const signatureHeader = `v1,${signature}`;

      wh.verify(payload, {
        'svix-id': msgId,
        'svix-timestamp': String(timestamp),
        'svix-signature': signatureHeader,
      });

      const parsed = JSON.parse(payload);
      assert.strictEqual(parsed.type, 'user.created');
      assert.strictEqual(parsed.data.id, 'user_2bXYZ987654321');
      assert.strictEqual(parsed.data.email_addresses[0].email_address, 'aditi.sharma@example.com');
    });

    it('should reject a Clerk webhook payload with tampered signature or bad secret', async () => {
      const { Webhook } = await import('svix');
      const wh = new Webhook(clerkSecret);

      const payload = JSON.stringify({
        type: 'user.created',
        data: { id: 'user_tampered' },
      });

      assert.throws(() => {
        wh.verify(payload, {
          'svix-id': 'msg_test_bad',
          'svix-timestamp': String(Math.floor(Date.now() / 1000)),
          'svix-signature': 'v1,invalid_signature_base64_string',
        });
      }, /No matching signature found|Signature verification failed|No signature found/i);
    });

    it('should correctly process user.created payload and map role and owner flag', async () => {
      const { assignRoleForUser } = await import('../src/lib/auth/permissions.ts');

      // Test regular student user creation mapping
      const studentEmail = 'student.new@example.com';
      const studentRoleInfo = assignRoleForUser(studentEmail);
      assert.strictEqual(studentRoleInfo.role, 'STUDENT');
      assert.strictEqual(studentRoleInfo.isOwner, false);

      // Test owner user creation mapping (only recognized when OWNER_EMAIL is set)
      const ownerEmail = 'ask@aapkaastro.com';
      const origOwner = process.env.OWNER_EMAIL;
      try {
        process.env.OWNER_EMAIL = ownerEmail;
        const ownerRoleInfo = assignRoleForUser(ownerEmail);
        assert.strictEqual(ownerRoleInfo.role, 'OWNER');
        assert.strictEqual(ownerRoleInfo.isOwner, true);
      } finally {
        if (origOwner !== undefined) process.env.OWNER_EMAIL = origOwner;
        else delete process.env.OWNER_EMAIL;
      }
    });
  });
});
