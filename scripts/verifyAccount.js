const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email: 'test@example.com',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (otpRecord) {
      console.log('OTP:', otpRecord.otp);
    } else {
      console.log('No OTP found, marking account as verified...');
      await prisma.admin.update({
        where: {
          email: 'test@example.com',
        },
        data: {
          isVerified: true,
        },
      });
      console.log('Account verified!');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
