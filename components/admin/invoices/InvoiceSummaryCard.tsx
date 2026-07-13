import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

interface InvoiceSummaryCardProps {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
}

export default function InvoiceSummaryCard({ title, value, detail, icon: Icon, accent }: InvoiceSummaryCardProps) {
  return (
    <div className="group rounded-[24px] border border-[#E8DFFB] bg-white/90 p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_56px_-22px_rgba(95,100,112,0.3)]">
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
  );
}
