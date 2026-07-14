import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const [admins, invoices, customerReports] = await Promise.all([
      prisma.admin.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.invoice.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.customerReport.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);

    return NextResponse.json({
      success: true,
      backup: {
        admins,
        invoices,
        customerReports,
      },
    });
  } catch (error) {
    console.error('Backup generation failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to prepare backup at this time.' },
      { status: 500 },
    );
  }
}
