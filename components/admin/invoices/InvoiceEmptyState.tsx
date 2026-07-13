import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function InvoiceEmptyState() {
  return (
    <div className="rounded-[28px] border border-[#E8DFFB] bg-white/85 p-10 text-center shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#E8DFFB] to-[#F8F3FF] text-[#7F63C7]">
        <FileText size={28} />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-[#2F3340]">No invoices found.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6D7280]">
        Create your first invoice to begin managing customer billing.
      </p>
      <Link
        href="/admin/invoices/create"
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#7F63C7] to-[#9F86E5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(127,99,199,0.8)] transition hover:opacity-90"
      >
        Create Invoice
      </Link>
    </div>
  );
}
