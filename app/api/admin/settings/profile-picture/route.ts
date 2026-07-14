import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSizeBytes = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'No image file was provided.' }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Only JPG, PNG, and WEBP images are supported.' }, { status: 400 });
    }

    if (file.size > maxSizeBytes) {
      return NextResponse.json({ success: false, message: 'Image size must be 2MB or less.' }, { status: 400 });
    }

    const userId = (session.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const profilePicture = `data:${file.type};base64,${buffer.toString('base64')}`;

    await prisma.admin.update({
      where: { id: userId },
      data: { profilePicture },
    });

    return NextResponse.json({ success: true, message: 'Profile picture updated successfully.', profilePicture });
  } catch (error) {
    console.error('Profile picture upload failed:', error);

if (error instanceof Error) {
  console.error(error.message);
  console.error(error.stack);
}
    return NextResponse.json({ success: false, message: 'Unable to upload profile picture right now.' }, { status: 500 });
  }
}
