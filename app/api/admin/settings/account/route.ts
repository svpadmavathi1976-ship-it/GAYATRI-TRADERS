import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { fullName?: string; email?: string };
    const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const errors: Record<string, string> = {};

    if (!fullName) {
      errors.fullName = 'Admin name is required.';
    }

    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(errors).length) {
      return NextResponse.json({ success: false, message: 'Invalid account information.', errors }, { status: 400 });
    }

    const userId = (session.user as { id?: string } | undefined)?.id;

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email,
        NOT: {
          id: userId as string,
        },
      },
    });

    if (existingAdmin) {
      return NextResponse.json({ success: false, message: 'This email address is already in use.' }, { status: 409 });
    }

    await prisma.admin.update({
      where: { id: userId as string },
      data: {
        fullName,
        email,
      },
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to update profile right now.' }, { status: 500 });
  }
}
