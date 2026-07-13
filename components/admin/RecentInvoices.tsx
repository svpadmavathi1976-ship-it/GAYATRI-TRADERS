import { Eye, PencilLine, Trash2 } from 'lucide-react';

const invoices: Array<{ id: string; customer: string; date: string; amount: string; status: string }> = [];

const actionButtons = [
  { label: 'View', icon: Eye },
  { label: 'Edit', icon: PencilLine },
  { label: 'Delete', icon: Trash2 },
];

export default function RecentInvoices() {
  return (
    <div className="rounded-[24px] border border-[#E8DFFB] bg-white p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2F3340]">Recent Invoices</p>
          <p className="text-sm text-[#6D7280]">Latest billing activity</p>
        </div>
        <button type="button" className="text-sm font-semibold text-[#8B6AD3] transition hover:text-[#6D4FC7]">
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="px-3 py-6 text-sm text-[#6D7280]">No recent invoices yet. Create your first invoice to populate this view.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#EFE8FB] text-[#7D8290]">
                <th className="px-3 py-3 font-medium">Invoice #</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#F5F1FA] text-[#4B5563] last:border-b-0">
                  <td className="px-3 py-3 font-semibold text-[#2F3340]">{invoice.id}</td>
                  <td className="px-3 py-3">{invoice.customer}</td>
                  <td className="px-3 py-3">{invoice.date}</td>
                  <td className="px-3 py-3">{invoice.amount}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-[#F3ECFF] px-2.5 py-1 text-xs font-semibold text-[#7F63C7]">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {actionButtons.map(({ label, icon: Icon }) => (
                        <button
                          key={label}
                          type="button"
                          className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] p-2 text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                          aria-label={label}
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
