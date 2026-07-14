import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActivityCategory = 'invoice' | 'report' | 'auth' | 'backup';

export interface ActivityLogInput {
  category: ActivityCategory;
  title: string;
  description: string;
}

export async function createActivityLog(input: ActivityLogInput) {
  return prisma.activity.create({
    data: {
      category: input.category,
      title: input.title,
      description: input.description,
    },
  });
}

export async function getRecentActivities(limit = 20) {
  return prisma.activity.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

export async function requireAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return session.user as { id?: string; fullName?: string; username?: string; email?: string; name?: string };
}
