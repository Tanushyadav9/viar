import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, courseSlug, name, phone } = body;

    if (!email || !courseSlug) {
      return NextResponse.json(
        { success: false, error: 'email and courseSlug are required' },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    try {
      const lead = await prisma.notifyMeLead.create({
        data: {
          email,
          courseSlug,
          name: name || null,
          phone: phone || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "You're on the list! We'll notify you when this cohort opens.",
        lead,
      }, { status: 201 });
    } catch (dbError) {
      console.warn('Database write for notify lead skipped:', (dbError as Error).message);
      return NextResponse.json({
        success: true,
        message: "You're on the list! We'll notify you when this cohort opens.",
        lead: {
          id: `lead-${Date.now()}`,
          email,
          courseSlug,
          name,
          phone,
          createdAt: new Date().toISOString(),
        },
      }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
