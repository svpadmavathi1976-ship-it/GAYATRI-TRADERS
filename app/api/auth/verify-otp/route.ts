import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalize(input: string) {
  return input.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const email = typeof payload.email === 'string' ? normalize(payload.email) : '';
    const otp = typeof payload.otp === 'string' ? payload.otp.trim() : '';

    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address and OTP are required.',
        },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'No account was found for this email address.',
        },
        { status: 404 }
      );
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'No verification code found for this account.',
        },
        { status: 404 }
      );
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      await prisma.oTP.deleteMany({
        where: { email },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'OTP has expired',
        },
        { status: 410 }
      );
    }

    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid OTP',
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.admin.update({
        where: { id: admin.id },
        data: { isVerified: true },
      }),
      prisma.oTP.deleteMany({
        where: { email },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Account verified successfully. Please sign in to continue.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to verify your OTP right now. Please try again later.',
      },
      { status: 500 }
    );
  }
}
