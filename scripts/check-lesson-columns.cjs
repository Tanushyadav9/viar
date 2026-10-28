const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'lessons'
    ORDER BY ordinal_position;
  `;
  console.log(result);
}

main().finally(() => prisma.$disconnect());
