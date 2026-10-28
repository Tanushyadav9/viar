const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE lessons 
    ADD COLUMN IF NOT EXISTS zoom_passcode TEXT,
    ADD COLUMN IF NOT EXISTS private_host_notes TEXT;
  `);
  console.log('Columns zoom_passcode and private_host_notes added or already exist successfully');
  
  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name IN ('zoom_passcode', 'private_host_notes');
  `);
  console.log('Verified columns in Neon DB:', columns);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
