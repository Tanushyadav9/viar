import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma Database Connection...');
  try {
    const rawResult = await prisma.$queryRaw`SELECT 1 as connected, current_database(), current_user, version();`;
    console.log('DB Ping Successful:', rawResult);

    // Check migrations applied in _prisma_migrations
    let migrations = [];
    try {
      migrations = await prisma.$queryRaw`SELECT id, checksum, finished_at, migration_name, applied_steps_count FROM _prisma_migrations ORDER BY finished_at ASC;`;
      console.log('Applied migrations count:', migrations.length);
      console.log('Migrations:', migrations);
    } catch (migErr) {
      console.error('Error querying _prisma_migrations (table might not exist!):', migErr.message);
    }

    // Check row counts for key tables
    const tables = [
      'user',
      'course',
      'cohort',
      'courseModule',
      'lesson',
      'enrollment',
      'sessionProgress',
      'quiz',
      'quizAttempt',
      'certificate',
      'payment',
      'staffPermission',
    ];

    for (const t of tables) {
      try {
        if (prisma[t]) {
          const count = await prisma[t].count();
          console.log(`Table ${t}: ${count} rows`);
        } else {
          console.log(`Table ${t}: not in PrismaClient models`);
        }
      } catch (err) {
        console.error(`Table ${t} error:`, err.message);
      }
    }

    // Check if there are any users in the User table
    const users = await prisma.user.findMany({ take: 10 });
    console.log(`Users sample (${users.length}):`, users.map(u => ({ id: u.id, email: u.email, role: u.role, isOwner: u.isOwner, createdAt: u.createdAt })));

  } catch (err) {
    console.error('Database connection FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
