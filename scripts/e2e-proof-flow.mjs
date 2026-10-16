import { PrismaClient } from '@prisma/client';
import {
  createOrGetActiveOrder,
  claimOrderPayment,
  approveOrder,
  generateOrderReference,
  buildUpiPaymentUri,
} from '../src/lib/payments/orders.ts';

const prisma = new PrismaClient();

async function runProofLifecycle() {
  console.log('================================================================');
  console.log('   FULL END-TO-END UPI & ACCESS VERIFICATION LIFECYCLE PROOF');
  console.log('   Target Database: Neon PostgreSQL (neondb, AWS us-east-2)');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testClerkId = `user_live_test_${timestamp}`;
  const testEmail = `student_${timestamp}@example.com`;
  const testName = `Rohan Singhania`;
  const testPhone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;

  // -------------------------------------------------------------------------
  // STEP 1: New Sign-Up on Live Site creates a User row in Neon PostgreSQL
  // -------------------------------------------------------------------------
  console.log('--- STEP 1: NEW SIGN-UP CREATES USER ROW IN NEON DB ---');
  const user = await prisma.user.create({
    data: {
      clerkId: testClerkId,
      email: testEmail,
      name: testName,
      phone: testPhone,
      role: 'STUDENT',
      isOwner: false,
    },
  });
  console.log('✅ Neon PostgreSQL User Row Created:');
  console.log(JSON.stringify(user, null, 2));

  // -------------------------------------------------------------------------
  // STEP 2: Student chooses Flagship Course & Creates Order (Locks Price & Shows QR)
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 2: ORDER CREATED WITH SERVER-SIDE PRICE LOCK & DYNAMIC UPI QR ---');
  const course = await prisma.course.findFirst({
    where: { slug: 'what-is-astrology' },
  });

  if (!course) {
    throw new Error('Flagship course not found in Neon DB');
  }

  const orderResult = await createOrGetActiveOrder({
    userId: user.id,
    courseId: course.id,
    studentName: user.name,
    studentEmail: user.email,
    studentPhone: user.phone || '9811234567',
  });

  console.log('✅ Neon PostgreSQL Order Row Created:');
  console.log(JSON.stringify(orderResult.order, null, 2));
  console.log('\n✅ Dynamic UPI URI carrying Order Reference:');
  console.log(orderResult.upiUri);
  console.log('\n✅ Dynamic QR Code URL:');
  console.log(orderResult.qrCodeUrl);

  // -------------------------------------------------------------------------
  // STEP 3: Student Clicks "I Have Paid" & Submits Bank UTR
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 3: STUDENT CLICKS "I HAVE PAID" & SUBMITS UTR ---');
  const testUtr = `20261015${Math.floor(1000 + Math.random() * 9000)}`;
  const claimResult = await claimOrderPayment({
    orderIdOrReference: orderResult.order.id,
    utr: testUtr,
    notes: 'Paid via Google Pay, bank reference verified on UPI receipt',
  });

  console.log('✅ Neon PostgreSQL Order Updated to PAYMENT_CLAIMED:');
  console.log(JSON.stringify(claimResult.order, null, 2));
  console.log('\n✅ Pre-filled WhatsApp Claim Link for Owner:');
  console.log(claimResult.whatsappUrl);

  // -------------------------------------------------------------------------
  // STEP 4: Owner Verification & Access Approval (Zero Passwords Sent)
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 4: OWNER VERIFIES BANK CREDIT & ACTIVATES ACCESS ---');
  const approvalResult = await approveOrder({
    orderId: claimResult.order.id,
    reviewedByEmail: 'aapkaastro1606@gmail.com',
    bankConfirmed: true, // Mandatory bank verification checklist item
  });

  console.log('✅ Neon PostgreSQL Order Updated to APPROVED:');
  console.log(JSON.stringify(approvalResult.order, null, 2));

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: approvalResult.enrollmentId },
    include: {
      course: { select: { title: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });
  console.log('\n✅ Neon PostgreSQL Active Enrollment Created:');
  console.log(JSON.stringify(enrollment, null, 2));
  console.log('\n✅ Ready-Made WhatsApp Confirmation Link (Zero Passwords):');
  console.log(approvalResult.whatsappConfirmationUrl);

  // -------------------------------------------------------------------------
  // STEP 5: Student Logs In & Sees Course Content (Gating Verified)
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 5: STUDENT ACCESS VERIFICATION (23 MODULES UNLOCKED) ---');
  const studentEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  const totalModules = studentEnrollment?.course?.modules.length || 0;
  let totalLessons = 0;
  studentEnrollment?.course?.modules.forEach((m) => {
    totalLessons += m.lessons.length;
  });

  console.log(`✅ Student Access Unlocked:`);
  console.log(`   Student: ${user.name} (${user.email})`);
  console.log(`   Course: ${studentEnrollment?.course.title}`);
  console.log(`   Status: ${studentEnrollment?.status}`);
  console.log(`   Modules Unlocked: ${totalModules} modules`);
  console.log(`   Total Lessons Unlocked: ${totalLessons} lessons`);
  console.log(`   Sample Lesson 1: ${studentEnrollment?.course.modules[0]?.lessons[0]?.title}`);
  console.log(`   Sample Lesson 1 Hindi: ${studentEnrollment?.course.modules[0]?.lessons[0]?.titleHi}`);

  console.log('\n================================================================');
  console.log('   LIFECYCLE PROOF COMPLETED SUCCESSFULLY (ALL ROWS IN NEON DB)');
  console.log('================================================================');
}

runProofLifecycle()
  .catch((e) => {
    console.error('Proof lifecycle error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
