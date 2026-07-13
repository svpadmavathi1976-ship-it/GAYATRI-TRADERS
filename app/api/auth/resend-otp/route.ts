import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalize(input: string) {
  return input.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const email = typeof payload.email === 'string' ? normalize(payload.email) : '';

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email address is required.',
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

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.oTP.deleteMany({
      where: { email },
    });

    await prisma.oTP.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    if (resend) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: 'Your new Gayatri Traders verification code',
        html: `<p>Your new verification code is <strong>${otp}</strong>.</p><p>This code will expire in 15 minutes.</p>`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'A new verification code has been sent to your email.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to resend verification code right now. Please try again later.',
      },
      { status: 500 }
    );
  }
}
