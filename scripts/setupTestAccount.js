const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await prisma.admin.upsert({
      where: {
        email: 'test@example.com',
      },
      update: {
        password: hashedPassword,
        isVerified: true,
      },
      create: {
        fullName: 'Test Admin',
        username: 'testadmin',
        email: 'test@example.com',
        password: hashedPassword,
        isVerified: true,
      },
    });
    
    console.log('Test account ready!');
    console.log('Email: test@example.com or username: testadmin');
    console.log('Password: password123');
    console.log('Account:', admin);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
