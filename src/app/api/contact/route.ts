import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { isContactRateLimited } from '@/lib/contact-rate-limit';

export const runtime = 'nodejs';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    if (isContactRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait a few minutes before submitting another inquiry.',
        },
        { status: 429 }
      );
    }

    // 2. Parse JSON Body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    // 3. Honeypot Check (Spam Bot Protection)
    const honeypot = body.website || body.botField || body.hp_field;
    if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
      return NextResponse.json(
        { success: false, error: 'Spam submission detected.' },
        { status: 400 }
      );
    }

    // 4. Field Validations
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 150) : 'Course Admissions Inquiry';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const consent = body.consent === true || body.consent === 'true';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 150) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!message || message.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Message must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { success: false, error: 'You must agree to be contacted by VIAR to submit this inquiry.' },
        { status: 400 }
      );
    }

    // 5. Store Lead in PostgreSQL
    let leadId = `lead_${Date.now()}`;
    try {
      const lead = await prisma.notifyMeLead.create({
        data: {
          name,
          email,
          courseSlug: 'what-is-astrology',
          phone: `Subject: ${subject} | Msg: ${message.slice(0, 300)}`,
        },
      });
      leadId = lead.id;

      // Activity log audit trail
      await prisma.activityLog.create({
        data: {
          action: 'CONTACT_FORM_SUBMITTED',
          entityType: 'LEAD',
          entityId: lead.id,
          userEmail: email,
          userName: name,
          reason: subject,
          details: {
            subject,
            messageSnippet: message.slice(0, 150),
            ip,
          },
        },
      }).catch(() => {});
    } catch (dbError) {
      console.warn('[Contact API] DB write fallback:', (dbError as Error).message);
    }

    // 6. Email Notification to Owner (Respecting EMAIL_ENABLED)
    const isEmailEnabled = process.env.EMAIL_ENABLED !== 'false' && process.env.EMAIL_ENABLED !== '0';
    const ownerEmail = process.env.OWNER_EMAIL || 'aapkaastro1606@gmail.com';

    if (isEmailEnabled) {
      try {
        await emailService.sendEmail({
          to: ownerEmail,
          subject: `[VIAR Contact Form] ${subject} - ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">New Academic Contact Inquiry</h2>
              <p><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
              <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
              <p><strong>IP Address:</strong> ${escapeHtml(ip)}</p>
              <p><strong>Submitted At:</strong> ${new Date().toISOString()}</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <h3 style="color: #334155;">Message Content:</h3>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; white-space: pre-wrap; color: #1e293b; font-size: 14px; line-height: 1.5;">${escapeHtml(message)}</div>
            </div>
          `,
          text: `New Academic Contact Inquiry\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        });
      } catch (mailError) {
        console.error('[Contact API] Failed to email Owner:', mailError);
      }
    } else {
      console.info('[Contact API] EMAIL_ENABLED is disabled; skipped email notification to Owner.');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your inquiry has been received. Our admissions coordinator will reach out shortly.',
        leadId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Contact API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
