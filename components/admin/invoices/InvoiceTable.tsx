import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Eye, FileDown, PencilLine, Trash2 } from 'lucide-react';
import type { Invoice } from '@/lib/mockInvoices';
import { formatCurrency, formatDate } from '@/lib/mockInvoices';
import { exportInvoiceToExcel } from '@/lib/excelExport';

interface InvoiceTableProps {
  invoices: Invoice[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDelete: (invoice: Invoice) => void;
  onSort: () => void;
  sortLabel: string;
}

export default function InvoiceTable({ invoices, currentPage, totalPages, onPageChange, onDelete, onSort, sortLabel }: InvoiceTableProps) {
  const router = useRouter();

  const handleActionClick = async (invoiceId: string, action: 'view' | 'edit' | 'excel') => {
    switch (action) {
      case 'view':
        router.push(`/admin/invoices/view/${invoiceId}`);
        break;
      case 'edit':
        router.push(`/admin/invoices/edit/${invoiceId}`);
        break;
      case 'excel': {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}`);
          const result = await response.json();

          if (!response.ok || !result.invoice) {
            toast.error('The selected invoice could not be found.');
            return;
          }

          const invoice = result.invoice;
          exportInvoiceToExcel({
            billNumber: invoice.billNumber,
            date: invoice.date,
            receiverName: invoice.receiverName,
            receiverAddress: invoice.receiverAddress,
            receiverGSTIN: invoice.receiverGSTIN,
            billNo: invoice.billNo,
            dispatchedThrough: invoice.dispatchedThrough,
            billOfLading: invoice.billOfLading,
            destination: invoice.destination,
            deliveryDate: invoice.deliveryDate,
            lorryNumber: invoice.lorryNumber,
            grandTotal: invoice.grandTotal,
            paymentMade: invoice.paymentMade,
pendingAmount: invoice.pendingAmount,
            amountInWords: invoice.amountInWords,
            rows: invoice.items ? JSON.parse(invoice.items) : [],
          });
          toast.success('Invoice exported to Excel successfully.');
        } catch (error) {
          console.error('Failed to export invoice to Excel:', error);
          toast.error('Unable to export the invoice as Excel right now.');
        }
        break;
      }
      default:
        break;
    }
  };

  const actionButtons = [
    { label: 'View', icon: Eye, action: 'view' as const },
    { label: 'Edit', icon: PencilLine, action: 'edit' as const },
    { label: 'Excel', icon: FileDown, action: 'excel' as const },
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E8DFFB] bg-white/85 shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)] backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left">
          <thead className="sticky top-0 z-10 bg-[#F8F4FF] text-sm text-[#6D7280]">
            <tr>
              <th className="w-[14%] px-4 py-4 font-semibold">Invoice No.</th>
              <th className="w-[12%] px-4 py-4 font-semibold">Bill No.</th>
              <th className="w-[24%] px-4 py-4 font-semibold">Customer Name</th>
              <th className="w-[16%] px-4 py-4 font-semibold">
                <button type="button" onClick={onSort} className="flex items-center gap-1 transition hover:text-[#2F3340]">
                  Invoice Date
                  <span className="text-xs text-[#8B6AD3]">{sortLabel}</span>
                </button>
              </th>
              <th className="w-[14%] px-4 py-4 font-semibold">Amount</th>
              <th className="w-[20%] px-4 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-[#F1EAFB] text-sm text-[#4B5563] transition hover:bg-[#FCFAFF]">
                <td className="px-4 py-4 font-semibold text-[#2F3340]">{invoice.invoiceNo}</td>
                <td className="px-4 py-4">{invoice.billNo}</td>
                <td className="px-4 py-4">{invoice.customer}</td>
                <td className="px-4 py-4">{formatDate(invoice.date)}</td>
                <td className="px-4 py-4 font-semibold text-[#2F3340]">{formatCurrency(invoice.amount)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {actionButtons.map(({ label, icon: Icon, action }) => (
                      <button
                        key={label}
                        type="button"
                        title={label}
                        onClick={() => void handleActionClick(invoice.id, action)}
                        className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] p-2 text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                      >
                        <Icon size={15} />
                      </button>
                    ))}
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => onDelete(invoice)}
                      className="rounded-xl border border-[#FFE0E0] bg-[#FFF7F7] p-2 text-[#C2410C] transition hover:bg-[#FFE8E8]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#F1EAFB] bg-[#FCFBFF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#6D7280]">Showing {invoices.length} invoices</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-xl border border-[#E8DFFB] bg-white px-3 py-2 text-sm text-[#6D7280] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-9 w-9 rounded-xl border text-sm transition ${
                currentPage === page ? 'border-[#7F63C7] bg-[#7F63C7] text-white' : 'border-[#E8DFFB] bg-white text-[#6D7280] hover:bg-[#F8F4FF]'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-xl border border-[#E8DFFB] bg-white px-3 py-2 text-sm text-[#6D7280] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
