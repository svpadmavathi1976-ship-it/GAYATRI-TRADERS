import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateRegistrationPayload(payload: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
  const username = typeof payload.username === 'string' ? payload.username.trim().toLowerCase() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const confirmPassword = typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!username) {
    errors.username = 'Username is required.';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  } else if (!/^[a-z0-9_.-]+$/.test(username)) {
    errors.username = 'Username can only contain lowercase letters, numbers, dots, dashes, and underscores.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    errors,
    values: { fullName, username, email, password },
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const { errors, values } = validateRegistrationPayload(payload);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please fix the highlighted fields and try again.',
          errors,
        },
        { status: 400 }
      );
    }

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ email: values.email }, { username: values.username }],
      },
    });

    if (existingAdmin) {
      const field = existingAdmin.email === values.email ? 'email' : 'username';
      return NextResponse.json(
        {
          success: false,
          message: `An account with that ${field} already exists.`,
          errors: {
            [field]: `${field === 'email' ? 'Email' : 'Username'} is already registered.`,
          },
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(values.password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const admin = await prisma.admin.create({
  data: {
    fullName: values.fullName,
    username: values.username,
    email: values.email,
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    isVerified: false,
  },
});

    await prisma.oTP.create({
      data: {
        email: values.email,
        otp,
        expiresAt,
      },
    });

    if (resend) {
      try {
  const emailResponse = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: values.email,
    subject: "Your Gayatri Traders verification code",
    html: `<p>Your verification code is <strong>${otp}</strong>.</p>`,
  });

  console.log("Resend response:", emailResponse);
} catch (error) {
  console.error("Resend error:", error);
  throw error;
}
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please use the OTP sent to your email to continue.',
        adminId: admin.id,
      },
      { status: 201 }
    );
  } catch (error) {
  console.error('==========================');
  console.error(error);
  console.error('==========================');
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to complete registration right now. Please try again later.',
      },
      { status: 500 }
    );
  }
}
