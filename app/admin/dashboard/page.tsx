import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRecentActivities } from '@/lib/activity';
import DashboardClock from '@/components/admin/DashboardClock';
import RecentActivity from '@/components/admin/RecentActivity';
import StatsCards from '@/components/admin/StatsCards';

export const dynamic = 'force-dynamic';

type InvoiceSummary = {
  grandTotal: number;
  paymentMade: number | null;
  pendingAmount: number | null;
  date: string;
  receiverName: string;
};

function formatCurrency(amount: number) {
  return `₹ ${Number(amount).toLocaleString('en-IN')}`;
}

function formatNumber(value: number) {
  return Number(value).toLocaleString('en-IN');
}

function parseInvoiceDate(value: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
  }

  const slashMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    return new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}T00:00:00`);
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function getMonthName(monthIndex: number) {
  return new Date(2024, monthIndex, 1).toLocaleString('en-IN', { month: 'short' });
}

function summarizeDashboardData(invoices: InvoiceSummary[]) {
  const totalInvoices = invoices.length;
  const totalSales = invoices.reduce((sum, invoice) => sum + (Number(invoice.grandTotal) || 0), 0);
  const paymentCollected = invoices.reduce((sum, invoice) => sum + (Number(invoice.paymentMade ?? 0) || 0), 0);
  const outstandingAmount = invoices.reduce((sum, invoice) => {
    if (invoice.pendingAmount !== null && invoice.pendingAmount !== undefined) {
      return sum + Number(invoice.pendingAmount || 0);
    }

    const paymentMade = Number(invoice.paymentMade ?? 0);
    const grandTotal = Number(invoice.grandTotal || 0);
    return sum + Math.max(grandTotal - paymentMade, 0);
  }, 0);

  const monthlyRevenue = Array.from({ length: 12 }, () => 0);
  const weeklySales = Array.from({ length: 7 }, () => 0);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  const dayOfWeek = startOfWeek.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(startOfWeek);
  monday.setDate(startOfWeek.getDate() + mondayOffset);

  let highestInvoiceAmount = 0;
  const customerSet = new Set<string>();
  let highestSalesMonth = '—';
  let highestSalesMonthValue = 0;

  invoices.forEach((invoice) => {
    const parsedDate = parseInvoiceDate(invoice.date);
    const invoiceAmount = Number(invoice.grandTotal || 0);

    if (invoiceAmount > highestInvoiceAmount) {
      highestInvoiceAmount = invoiceAmount;
    }

    if (invoice.receiverName?.trim()) {
      customerSet.add(invoice.receiverName.trim());
    }

    if (parsedDate) {
      const monthIndex = parsedDate.getMonth();
      monthlyRevenue[monthIndex] += invoiceAmount;

      const weekIndex = Math.round((parsedDate.getTime() - monday.getTime()) / 86400000);
      if (weekIndex >= 0 && weekIndex < weeklySales.length) {
        weeklySales[weekIndex] += invoiceAmount;
      }
    }
  });

  monthlyRevenue.forEach((value, index) => {
    if (value > highestSalesMonthValue) {
      highestSalesMonthValue = value;
      highestSalesMonth = getMonthName(index);
    }
  });

  const currentMonth = new Date().getMonth();
  const monthlyRevenueValue = monthlyRevenue[currentMonth];
  const averageInvoiceValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;
  return {
    hasData: totalInvoices > 0,
    totalInvoices,
    totalSales,
    monthlyRevenueValue,
    monthlyRevenue,
    weeklySales,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const adminName =
    (session?.user as { fullName?: string; username?: string; name?: string } | undefined)?.fullName ??
    (session?.user as { fullName?: string; username?: string; name?: string } | undefined)?.username ??
    (session?.user as { fullName?: string; username?: string; name?: string } | undefined)?.name ??
    'Admin';

  const invoices = await prisma.invoice.findMany({
    select: {
      grandTotal: true,
      paymentMade: true,
      pendingAmount: true,
      date: true,
      receiverName: true,
    },
  });

  const dashboardData = summarizeDashboardData(
    invoices.map((invoice) => ({
      grandTotal: Number(invoice.grandTotal || 0),
      paymentMade: invoice.paymentMade !== null ? Number(invoice.paymentMade || 0) : null,
      pendingAmount: invoice.pendingAmount !== null ? Number(invoice.pendingAmount || 0) : null,
      date: typeof invoice.date === 'string' ? invoice.date : '',
      receiverName: typeof invoice.receiverName === 'string' ? invoice.receiverName : '',
    }))
  );
  const activities = await getRecentActivities(15);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#E8DFFB] bg-white/80 p-6 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Welcome Back</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2F3340]">{adminName}</h2>
            <p className="mt-2 text-lg font-medium text-[#6B7280]">Gayatri Traders</p>
          </div>
          <DashboardClock />
        </div>
      </section>

      <StatsCards
        stats={[
          {
            title: 'Total Invoices',
            value: `${dashboardData.totalInvoices} Invoices`,
            detail: 'Stored in the database',
            icon: 'FileText',
            accent: 'from-[#E8DFFB] to-[#F8F3FF]',
          },
          {
            title: 'Total Sales',
            value: formatCurrency(dashboardData.totalSales),
            detail: 'Across all invoice grand totals',
            icon: 'CircleDollarSign',
            accent: 'from-[#FCEFD4] to-[#FFF8E7]',
          },
          {
            title: 'Monthly Revenue',
            value: formatCurrency(dashboardData.monthlyRevenueValue),
            detail: 'Revenue generated this month',
            icon: 'ReceiptText',
            accent: 'from-[#DBF4E9] to-[#F2FCF7]',
          },
        ]}
      />

      <section className="w-full">
        <RecentActivity
          activities={activities.map((activity: { id: string; category: string; title: string; description: string; createdAt: Date }) => ({
            id: activity.id,
            category: activity.category,
            title: activity.title,
            description: activity.description,
            createdAt: activity.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
