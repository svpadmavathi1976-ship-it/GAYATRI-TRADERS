import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { currentPassword?: string; newPassword?: string };
    const currentPassword = typeof payload.currentPassword === 'string' ? payload.currentPassword : '';
    const newPassword = typeof payload.newPassword === 'string' ? payload.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Current and new passwords are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'The new password must be at least 8 characters.' }, { status: 400 });
    }

    const userId = (session.user as { id?: string } | undefined)?.id;
    const admin = await prisma.admin.findUnique({ where: { id: userId as string } });

    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin account not found.' }, { status: 404 });
    }

    const currentMatches = await bcrypt.compare(currentPassword, admin.password);

    if (!currentMatches) {
      return NextResponse.json({ success: false, message: 'The current password is incorrect.' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to change password right now.' }, { status: 500 });
  }
}
