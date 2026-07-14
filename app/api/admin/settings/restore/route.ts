import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function normalizeBackupString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeBackupNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDateValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('backupFile');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No backup file was provided.' }, { status: 400 });
    }

    const fileText = await file.text();
    const payload = JSON.parse(fileText) as { backup?: any };
    const backup = payload?.backup ?? payload;

    if (!backup || !Array.isArray(backup.invoices) || !Array.isArray(backup.customerReports)) {
      return NextResponse.json({ success: false, message: 'Backup file is not valid.' }, { status: 400 });
    }

    const invoiceData = backup.invoices.map((item: any) => ({
      id: normalizeBackupString(item.id) || undefined,
      billNumber: normalizeBackupString(item.billNumber || item.billNo || ''),
      date: normalizeBackupString(item.date),
      state: normalizeBackupString(item.state),
      stateCode: normalizeBackupString(item.stateCode),
      receiverName: normalizeBackupString(item.receiverName),
      receiverAddress: normalizeBackupString(item.receiverAddress),
      receiverGSTIN: normalizeBackupString(item.receiverGSTIN),
      invoiceNumber: normalizeBackupString(item.invoiceNumber),
      billNo: normalizeBackupString(item.billNo),
      dispatchedThrough: normalizeBackupString(item.dispatchedThrough),
      customTransport: normalizeBackupString(item.customTransport),
      billOfLading: normalizeBackupString(item.billOfLading),
      destination: normalizeBackupString(item.destination),
      deliveryDate: normalizeBackupString(item.deliveryDate),
      lorryNumber: normalizeBackupString(item.lorryNumber),
      grandTotal: normalizeBackupNumber(item.grandTotal) ?? 0,
      amountInWords: normalizeBackupString(item.amountInWords),
      items: normalizeBackupString(item.items),
      paymentMade: normalizeBackupNumber(item.paymentMade),
      pendingAmount: normalizeBackupNumber(item.pendingAmount),
      createdAt: normalizeDateValue(item.createdAt),
      updatedAt: normalizeDateValue(item.updatedAt),
    }));

    const customerReportData = backup.customerReports.map((item: any) => ({
      id: normalizeBackupString(item.id) || undefined,
      customerKey: normalizeBackupString(item.customerKey),
      customerName: normalizeBackupString(item.customerName),
      gstNumber: normalizeBackupString(item.gstNumber),
      address: normalizeBackupString(item.address),
      totalInvoices: Number(item.totalInvoices) || 0,
      totalPurchaseAmount: Number(item.totalPurchaseAmount) || 0,
      lastPurchaseDate: normalizeBackupString(item.lastPurchaseDate),
      createdAt: normalizeDateValue(item.createdAt),
      updatedAt: normalizeDateValue(item.updatedAt),
    }));

    const adminData = Array.isArray(backup.admins) ? backup.admins.map((item: any) => ({
      id: normalizeBackupString(item.id) || undefined,
      fullName: normalizeBackupString(item.fullName),
      username: normalizeBackupString(item.username),
      email: normalizeBackupString(item.email),
      password: normalizeBackupString(item.password),
      role: normalizeBackupString(item.role) || 'ADMIN',
      isVerified: Boolean(item.isVerified),
      createdAt: normalizeDateValue(item.createdAt),
      updatedAt: normalizeDateValue(item.updatedAt),
    })) : [];

    await prisma.$transaction(async (tx) => {
      await tx.invoice.deleteMany();
      await tx.customerReport.deleteMany();

      for (const invoice of invoiceData) {
        await tx.invoice.create({ data: invoice });
      }

      for (const customerReport of customerReportData) {
        await tx.customerReport.create({ data: customerReport });
      }

      for (const admin of adminData) {
        if (!admin.email || !admin.username || !admin.password) {
          continue;
        }

        await tx.admin.upsert({
          where: { email: admin.email },
          create: admin,
          update: {
            fullName: admin.fullName,
            username: admin.username,
            password: admin.password,
            role: admin.role,
            isVerified: admin.isVerified,
            updatedAt: admin.updatedAt,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Backup restored successfully.' });
  } catch (error) {
    console.error('Restore failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to restore the backup file.' }, { status: 500 });
  }
}
