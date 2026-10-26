import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, isAuthorizedForSection } from '@/lib/auth/serverAuth';
import { emailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !isAuthorizedForSection(auth, 'content', 'MANAGE'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid recipient email address is required.' }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();
    const subject = 'Viar.in Academy — Public Inquiry Mailbox Test';
    const textContent = `This is a verification test email from the Viar.in Academy Content Studio.\n\nYour public contact mailbox (${targetEmail}) is operational and ready to receive inquiries from students.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0c101c; color: #f8fafc; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #f59e0b; margin-top: 0;">Viar.in Astrology Academy</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
          This test email confirms that your public inquiry address <strong style="color: #38bdf8;">${targetEmail}</strong> is configured properly and able to receive messages.
        </p>
        <div style="margin: 20px 0; padding: 12px 16px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 13px; color: #cbd5e1;">
          Verified by: <strong>${auth.email || 'Site Owner'}</strong> at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </div>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
          Acharya Niraj Kumar • Vihangam Institute of Astrology and Research
        </p>
      </div>
    `;

    const sendResult = await emailService.sendEmail({
      to: targetEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    await prisma.activityLog.create({
      data: {
        userId: auth.userId || null,
        userEmail: auth.email || null,
        action: 'TEST_EMAIL_SENT',
        entityType: 'EMAIL',
        entityId: targetEmail,
        reason: `Sent test verification email to public contact address "${targetEmail}"`,
        details: { targetEmail, success: sendResult.success, messageId: sendResult.messageId },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${targetEmail}. Please check your inbox or spam folder.`,
      result: sendResult,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
