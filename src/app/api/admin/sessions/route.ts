import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, canAccessSection } from '@/lib/auth/serverAuth';
import {
  listOneOnOneSessions,
  createOneOnOneSession,
  updateOneOnOneSession,
  recordTaughtContent,
  deleteOneOnOneSession,
  generateWhatsAppShareUrl,
} from '@/lib/sessions/oneOnOneService';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: sessions access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const sessions = await listOneOnOneSessions({ studentId, status, search });

    // Also get enrolled students list for the dropdown in the scheduling modal
    let enrolledStudents: Array<{ id: string; name: string; email: string; phone?: string | null }> = [];
    try {
      const dbUsers = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
        },
        select: { id: true, name: true, email: true, phone: true },
        orderBy: { name: 'asc' },
        take: 100,
      });
      if (dbUsers && dbUsers.length > 0) {
        enrolledStudents = dbUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email || '',
          phone: u.phone,
        }));
      }
    } catch {}

    if (enrolledStudents.length === 0) {
      // Fallback students
      enrolledStudents = [
        { id: 'usr_student_enrolled_001', name: 'Rohan Sharma', email: 'rohan.sharma@example.com', phone: '+91 98101 23456' },
        { id: 'usr_student_enrolled_002', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 99202 34567' },
        { id: 'usr_student_enrolled_003', name: 'Amit Verma', email: 'amit.verma@example.com', phone: '+91 98765 43210' },
      ];
    }

    // Enhance sessions with pre-computed WhatsApp share URLs
    const enhancedSessions = sessions.map((s) => ({
      ...s,
      whatsAppShareUrl: generateWhatsAppShareUrl(s),
    }));

    return NextResponse.json({
      success: true,
      sessions: enhancedSessions,
      students: enrolledStudents,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch sessions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: sessions access required' }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, studentName, studentEmail, studentPhone, title, scheduledAt, durationMinutes, meetingPlatform, meetingLink, notes } = body;

    if (!studentId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, title, and scheduledAt are required' },
        { status: 400 }
      );
    }

    const session = await createOneOnOneSession({
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      title,
      scheduledAt,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
      meetingPlatform: meetingPlatform || 'GOOGLE_MEET',
      meetingLink: meetingLink || null,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        whatsAppShareUrl: generateWhatsAppShareUrl(session),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: sessions access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, taughtRecord, homework, recordingUrl, markCompleted, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    let updated;
    if (taughtRecord !== undefined) {
      updated = await recordTaughtContent(id, {
        taughtRecord,
        homework,
        recordingUrl,
        markCompleted: markCompleted ?? true,
      });
    } else {
      updated = await updateOneOnOneSession(id, updates);
    }

    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        ...updated,
        whatsAppShareUrl: generateWhatsAppShareUrl(updated),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth.isAuthenticated || (!auth.isOwner && !canAccessSection(auth, 'sessions'))) {
      return NextResponse.json({ error: 'Unauthorized: sessions access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const deleted = await deleteOneOnOneSession(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
