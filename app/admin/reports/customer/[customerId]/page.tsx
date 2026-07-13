import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, UsersRound } from 'lucide-react';
import { CustomerReportActions } from '@/components/admin/reports/CustomerReportActions';
import { prisma } from '@/lib/prisma';
import { buildCustomerReportSummaries, getCustomerInvoicesForReport } from '@/lib/customerReports';

function formatCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue)) {
    return 'Rs. 0.00';
  }

  return `Rs. ${numericValue.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatPaymentDisplay(value: number | string | null | undefined, paymentMadeValue: number | string | null | undefined) {
  const hasPayment = paymentMadeValue !== null && paymentMadeValue !== undefined && paymentMadeValue !== '' && Number(paymentMadeValue) > 0;

  if (!hasPayment) {
    return '--';
  }

  if (value === null || value === undefined || value === '') {
    return '--';
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? formatCurrency(numericValue) : '--';
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function compareDates(left: string | null | undefined, right: string | null | undefined) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return -1;
  }

  if (!right) {
    return 1;
  }

  const leftDate = new Date(left);
  const rightDate = new Date(right);

  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
    return String(left).localeCompare(String(right));
  }

  return leftDate.getTime() - rightDate.getTime();
}

function parseInvoiceItems(items: string | null | undefined) {
  if (!items) {
    return [] as Array<{ description?: string; quantity?: number | string; amount?: number | string }>;
  }

  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getInvoiceProductSummary(items: string | null | undefined) {
  const rows = parseInvoiceItems(items);
  const descriptions = rows
    .map((row: any) => row?.description)
    .filter((value): value is string => Boolean(value && String(value).trim()));

  return descriptions.length > 0 ? descriptions.join(', ') : '—';
}

function getInvoiceQuantity(items: string | null | undefined) {
  const rows = parseInvoiceItems(items);
  const totalQuantity = rows.reduce((sum: number, row: any) => {
    const quantity = Number(row?.quantity || 0);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  return totalQuantity > 0 ? totalQuantity.toLocaleString('en-IN') : '—';
}

export default async function CustomerHistoryPage({ params }: { params: { customerId: string } }) {
  const invoices = await prisma.invoice.findMany({
    orderBy: [{ date: 'asc' }, { billNumber: 'asc' }],
  });

  const customerReport = buildCustomerReportSummaries(invoices).find((report) => report.id === params.customerId);

  if (!customerReport) {
    notFound();
  }

  const matchingInvoices = getCustomerInvoicesForReport(invoices, customerReport);

  if (!matchingInvoices.length) {
    notFound();
  }

  const sortedInvoices = matchingInvoices
    .slice()
    .sort((left, right) => compareDates(left.date, right.date) || String(left.billNumber || '').localeCompare(String(right.billNumber || '')));

  const historyRows = sortedInvoices.map((invoice) => {
    const invoiceAmount = Number(invoice.grandTotal || 0);
    const paymentMadeValue = invoice.paymentMade === null || invoice.paymentMade === undefined ? null : Number(invoice.paymentMade);
    const pendingAmountValue = invoice.pendingAmount === null || invoice.pendingAmount === undefined ? null : Number(invoice.pendingAmount);

    return {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber || '—',
      billNumber: invoice.billNo || invoice.billNumber,
      invoiceDate: formatDate(invoice.date),
      products: getInvoiceProductSummary(invoice.items),
      quantity: getInvoiceQuantity(invoice.items),
      invoiceAmount: formatCurrency(invoiceAmount),
      paymentMade: formatPaymentDisplay(paymentMadeValue, paymentMadeValue),
      pendingAmount: formatPaymentDisplay(pendingAmountValue, paymentMadeValue),
    };
  });

  const totalPurchaseAmount = sortedInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
  const lastPurchaseInvoice = sortedInvoices[sortedInvoices.length - 1];
  const customerSummary = {
    customerName: customerReport.customerName || '—',
    gstNumber: customerReport.gstNumber || '—',
    address: customerReport.address || '—',
    totalInvoices: sortedInvoices.length,
    totalPurchaseAmount: formatCurrency(totalPurchaseAmount),
    lastPurchaseDate: formatDate(lastPurchaseInvoice?.date),
  };

  let runningTotal = 0;
  const historyRowsWithRunningTotal = historyRows.map((invoice) => {
    runningTotal += Number(invoice.grandTotal || 0);

    return {
      ...invoice,
      runningTotal: formatCurrency(runningTotal),
    };
  });

  const leftColumnSummary = [
    { label: 'Customer Name', value: customerSummary.customerName },
    { label: 'GST Number', value: customerSummary.gstNumber },
    { label: 'Address', value: customerSummary.address },
  ];

  const rightColumnSummary = [
    { label: 'Total Number of Invoices', value: customerSummary.totalInvoices.toString() },
    { label: 'Total Purchase Amount', value: customerSummary.totalPurchaseAmount },
    { label: 'Last Purchase Date', value: customerSummary.lastPurchaseDate },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#E8DFFB] bg-white/80 p-6 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">CUSTOMER HISTORY</p>
            <h2 className="text-3xl font-semibold text-[#2F3340]">{customerSummary.customerName || 'Customer Purchase History'}</h2>
            <p className="text-sm leading-7 text-[#6D7280]">
              Detailed invoice trail for this customer, ordered chronologically with running purchase totals.
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-2.5 text-sm font-semibold text-[#7F63C7] transition hover:bg-[#F3ECFF]"
          >
            <ArrowLeft size={16} />
            Back to Reports
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E8DFFB] bg-white/85 p-6 shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] p-3 text-[#7F63C7]">
            <UsersRound size={22} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#2F3340]">Customer Information</h3>
            <p className="text-sm text-[#6D7280]">A complete profile of the selected customer and their purchase activity.</p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#F1EAFB] bg-[#FCFAFF] p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {leftColumnSummary.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#F1EAFB] bg-white/70 p-4">
                  <p className="text-sm font-semibold text-[#6D7280]">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-[#2F3340]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4 border-t border-[#F1EAFB] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {rightColumnSummary.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#F1EAFB] bg-white/70 p-4">
                  <p className="text-sm font-semibold text-[#6D7280]">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-[#2F3340]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CustomerReportActions
        customer={customerSummary}
        invoices={historyRowsWithRunningTotal.map((invoice) => ({
          id: invoice.id as string,
          invoiceNumber: invoice.invoiceNumber,
          billNumber: invoice.billNumber,
          invoiceDate: invoice.invoiceDate,
          products: invoice.products,
          quantity: invoice.quantity,
          invoiceAmount: invoice.invoiceAmount,
          paymentMade: invoice.paymentMade,
          pendingAmount: invoice.pendingAmount,
          runningTotal: invoice.runningTotal,
          date: invoice.date,
          grandTotal: invoice.grandTotal,
        }))}
      />

      <section className="overflow-hidden rounded-[28px] border border-[#E8DFFB] bg-white/85 shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="border-b border-[#F1EAFB] px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#2F3340]">Invoice History</h3>
              <p className="mt-1 text-sm text-[#6D7280]">Every invoice linked to this customer is shown below.</p>
            </div>
            <div className="rounded-full border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-1 text-sm font-medium text-[#7F63C7]">
              {historyRowsWithRunningTotal.length} invoices
            </div>
          </div>
        </div>

        {historyRowsWithRunningTotal.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] p-4 text-[#7F63C7]">
              <FileText size={24} />
            </div>
            <h4 className="mt-5 text-xl font-semibold text-[#2F3340]">No invoice history found</h4>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#6D7280]">
              Invoices for this customer will appear here once they are created in the invoice module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-[#F8F4FF] text-sm text-[#6D7280]">
                <tr>
                  {['Invoice Number', 'Bill Number', 'Invoice Date', 'Product(s)', 'Quantity', 'Invoice Amount', 'Payment Made', 'Pending Amount', 'Actions'].map((column) => (
                    <th key={column} className="px-4 py-4 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRowsWithRunningTotal.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-[#F1EAFB] text-sm text-[#4B5563] transition hover:bg-[#FCFAFF]">
                    <td className="px-4 py-4 font-semibold text-[#2F3340]">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-4">{invoice.billNumber || '—'}</td>
                    <td className="px-4 py-4">{invoice.invoiceDate}</td>
                    <td className="px-4 py-4">{invoice.products}</td>
                    <td className="px-4 py-4">{invoice.quantity}</td>
                    <td className="px-4 py-4 font-semibold text-[#2F3340]">{invoice.invoiceAmount}</td>
                    <td className="px-4 py-4 font-semibold text-[#2F3340]">{invoice.paymentMade}</td>
                    <td className="px-4 py-4 font-semibold text-[#2F3340]">{invoice.pendingAmount}</td>
                    <td className="px-4 py-4 font-semibold text-[#2F3340]">{invoice.runningTotal}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/invoices/view/${invoice.id}`}
                          className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2 text-sm font-medium text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                        >
                          View Invoice
                        </Link>
                        <Link
                          href={`/admin/invoices/edit/${invoice.id}`}
                          className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2 text-sm font-medium text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                        >
                          Edit Invoice
                        </Link>
                        <a
                          href={`/admin/invoices/view/${invoice.id}?print=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2 text-sm font-medium text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                        >
                          Print Invoice
                        </a>
                        <a
                          href={`/admin/invoices/view/${invoice.id}?downloadPdf=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2 text-sm font-medium text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                        >
                          Download PDF
                        </a>
                        <a
                          href={`/admin/invoices/view/${invoice.id}?downloadExcel=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2 text-sm font-medium text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                        >
                          Download Excel
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
