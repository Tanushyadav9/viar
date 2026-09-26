import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

describe('Payment Webhook Verification Logic', () => {
  const razorpaySecret = 'rzp_test_secret_key_12345';
  const stripeSecret = 'whsec_test_stripe_secret_67890';

  describe('Razorpay HMAC-SHA256 Signatures', () => {
    function verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return expected === signature;
    }

    it('should successfully verify a valid Razorpay webhook signature', () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_ABC123456789',
              amount: 499900,
              currency: 'INR',
              email: 'student@example.com',
            },
          },
        },
      });

      const validSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(payload)
        .digest('hex');

      const isVerified = verifyRazorpaySignature(payload, validSignature, razorpaySecret);
      assert.strictEqual(isVerified, true, 'Valid signature must be verified');
    });

    it('should reject a tampered payload with mismatched signature', () => {
      const originalPayload = JSON.stringify({ event: 'payment.captured', amount: 499900 });
      const tamperedPayload = JSON.stringify({ event: 'payment.captured', amount: 100 });

      const originalSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(originalPayload)
        .digest('hex');

      const isVerified = verifyRazorpaySignature(tamperedPayload, originalSignature, razorpaySecret);
      assert.strictEqual(isVerified, false, 'Tampered payload must fail signature verification');
    });

    it('should reject when verified against incorrect secret key', () => {
      const payload = JSON.stringify({ event: 'order.paid' });
      const validSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(payload)
        .digest('hex');

      const isVerified = verifyRazorpaySignature(payload, validSignature, 'wrong_secret');
      assert.strictEqual(isVerified, false, 'Signature with wrong secret must fail');
    });
  });

  describe('Stripe Webhook Signatures', () => {
    function verifyStripeSignature(rawBody: string, header: string, secret: string): boolean {
      const parts = header.split(',').reduce((acc, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {} as Record<string, string>);

      const timestamp = parts['t'];
      const signature = parts['v1'];
      if (!timestamp || !signature) return false;

      const signedPayload = `${timestamp}.${rawBody}`;
      const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
      return expected === signature;
    }

    it('should successfully verify a valid Stripe signature header', () => {
      const rawBody = JSON.stringify({
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_abc', amount: 6900, currency: 'usd' } },
      });

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${rawBody}`;
      const signature = crypto.createHmac('sha256', stripeSecret).update(signedPayload).digest('hex');
      const stripeHeader = `t=${timestamp},v1=${signature}`;

      const isValid = verifyStripeSignature(rawBody, stripeHeader, stripeSecret);
      assert.strictEqual(isValid, true, 'Valid Stripe signature header must verify');
    });

    it('should reject malformed or missing Stripe signature header', () => {
      const rawBody = '{"type":"checkout.session.completed"}';
      const isValid = verifyStripeSignature(rawBody, 'invalid_header_format', stripeSecret);
      assert.strictEqual(isValid, false, 'Malformed header must fail verification');
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

      // Test owner user creation mapping
      const ownerEmail = 'ask@aapkaastro.com';
      const ownerRoleInfo = assignRoleForUser(ownerEmail);
      assert.strictEqual(ownerRoleInfo.role, 'OWNER');
      assert.strictEqual(ownerRoleInfo.isOwner, true);
    });
  });
});

