import QuickActions from '@/components/admin/QuickActions';
import RecentActivity from '@/components/admin/RecentActivity';
import RecentInvoices from '@/components/admin/RecentInvoices';
import RevenueChart from '@/components/admin/RevenueChart';
import SalesChart from '@/components/admin/SalesChart';
import StatsCards from '@/components/admin/StatsCards';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#E8DFFB] bg-white/80 p-6 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2F3340]">Professional control center for Gayatri Traders</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6D7280]">
              Monitor invoices, sales momentum, and payment health from a premium ERP-style dashboard designed for business growth.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 text-sm text-[#6D7280]">
            <p className="font-semibold text-[#2F3340]">Today</p>
            <p>12 July 2026 • 09:30 AM</p>
          </div>
        </div>
      </section>

      <StatsCards />

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SalesChart />
        <RevenueChart />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <RecentInvoices />
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}
