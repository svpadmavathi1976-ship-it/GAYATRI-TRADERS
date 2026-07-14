import { NextResponse } from 'next/server';
import { createActivityLog, getRecentActivities, requireAuthenticatedUser } from '@/lib/activity';

export async function GET() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  const activities = await getRecentActivities(20);

  return NextResponse.json({
    success: true,
    activities: activities.map((activity: { id: string; category: string; title: string; description: string; createdAt: Date }) => ({
      id: activity.id,
      category: activity.category,
      title: activity.title,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { category?: string; title?: string; description?: string };

    if (!payload.category || !payload.title || !payload.description) {
      return NextResponse.json({ success: false, message: 'Invalid activity payload.' }, { status: 400 });
    }

    const activity = await createActivityLog({
      category: payload.category as 'invoice' | 'report' | 'auth' | 'backup',
      title: payload.title,
      description: payload.description,
    });

    return NextResponse.json({
      success: true,
      activity: {
        id: activity.id,
        category: activity.category,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Activity logging failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to log activity.' }, { status: 500 });
  }
}
