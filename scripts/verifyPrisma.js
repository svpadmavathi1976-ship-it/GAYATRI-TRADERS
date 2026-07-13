const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log('Connected to the database successfully.');
  const admins = await prisma.admin.findMany();
  console.log('Admin count:', admins.length);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Connection verification failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
