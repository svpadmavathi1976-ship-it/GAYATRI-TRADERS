import { ArrowUpRight, CircleDollarSign, FileText, ReceiptText } from 'lucide-react';

const stats = [
  {
    title: 'Total Invoices',
    value: '1,284',
    detail: '+12% from last month',
    icon: FileText,
    accent: 'from-[#E8DFFB] to-[#F8F3FF]',
  },
  {
    title: 'Total Sales',
    value: '₹4.8M',
    detail: '+8.4% this quarter',
    icon: CircleDollarSign,
    accent: 'from-[#FCEFD4] to-[#FFF8E7]',
  },
  {
    title: 'Monthly Revenue',
    value: '₹68K',
    detail: 'Healthy growth trend',
    icon: ReceiptText,
    accent: 'from-[#DBF4E9] to-[#F2FCF7]',
  },
];

export default function StatsCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map(({ title, value, detail, icon: Icon, accent }) => (
        <div
          key={title}
          className="group rounded-[24px] border border-[#E8DFFB] bg-white p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_56px_-22px_rgba(95,100,112,0.3)]"
        >
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[#7F63C7]`}>
            <Icon size={20} />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-[#6D7280]">{title}</p>
              <p className="mt-2 text-2xl font-semibold text-[#2F3340]">{value}</p>
            </div>
            <span className="rounded-full bg-[#F3ECFF] p-1.5 text-[#8B6AD3]">
              <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="mt-3 text-sm text-[#7D8290]">{detail}</p>
        </div>
      ))}
    </section>
  );
}
