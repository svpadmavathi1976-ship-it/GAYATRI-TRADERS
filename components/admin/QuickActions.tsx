import { FilePlus2, FileSpreadsheet } from 'lucide-react';

export default function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        className="rounded-[24px] border border-[#E8DFFB] bg-gradient-to-br from-[#FAF8F5] to-[#F5ECFF] p-5 text-left shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)] transition duration-200 hover:-translate-y-1"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#7F63C7] shadow-sm">
          <FilePlus2 size={20} />
        </div>
        <p className="text-lg font-semibold text-[#2F3340]">Create Invoice</p>
        <p className="mt-2 text-sm text-[#6D7280]">Launch a polished invoice for a new client.</p>
      </button>

      <button
        type="button"
        className="rounded-[24px] border border-[#E8DFFB] bg-gradient-to-br from-[#F5ECFF] to-[#FAF8F5] p-5 text-left shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)] transition duration-200 hover:-translate-y-1"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#7F63C7] shadow-sm">
          <FileSpreadsheet size={20} />
        </div>
        <p className="text-lg font-semibold text-[#2F3340]">Generate Report</p>
        <p className="mt-2 text-sm text-[#6D7280]">Summarize sales and cashflow in one click.</p>
      </button>
    </div>
  );
}
