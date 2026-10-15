import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Public Health Endpoint Logic...');
  try {
    await prisma.$queryRaw`SELECT 1 as ping`;
    console.log('✅ Public /api/health logic: Database ping succeeded (status: 200, { status: "ok" })');
  } catch (err) {
    console.error('❌ Public /api/health logic failed:', err);
  }

  console.log('\nTesting Owner Diagnostics API Telemetry Collection...');
  try {
    // Ping latency
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const latency = Math.round(performance.now() - start);
    console.log(`✅ DB Reachable: true, Latency: ${latency}ms`);

    // Migrations
    const migrations = await prisma.$queryRaw`SELECT id, migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC`;
    console.log(`✅ Applied Migrations: ${migrations.length}`);
    console.log(`   Latest: ${migrations[0]?.migration_name}`);

    // Table Counts
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const lessonCount = await prisma.lesson.count();
    const cohortCount = await prisma.cohort.count();
    const enrollCount = await prisma.enrollment.count();
    console.log(`✅ Table Counts: Users=${userCount}, Courses=${courseCount}, Lessons=${lessonCount}, Cohorts=${cohortCount}, Enrollments=${enrollCount}`);

    // Clerk key mode
    const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
    const keyMode = pubKey.startsWith('pk_live_') ? 'LIVE' : pubKey.startsWith('pk_test_') ? 'TEST' : 'NOT_CONFIGURED';
    console.log(`✅ Clerk Key Mode: ${keyMode} (Prefix: ${pubKey ? pubKey.substring(0, 8) + '...' : 'None'})`);

    // Env vars checklist
    const envVars = ['DATABASE_URL', 'DIRECT_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'OWNER_EMAIL'];
    console.log('✅ Environment Checklist (Presence Only, Zero Leaked Secrets):');
    for (const v of envVars) {
      console.log(`   - ${v}: ${Boolean(process.env[v])}`);
    }

  } catch (err) {
    console.error('❌ Diagnostics logic failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
