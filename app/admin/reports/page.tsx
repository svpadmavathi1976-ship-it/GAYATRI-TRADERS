import { prisma } from '@/lib/prisma';
import { CustomerReportsTable } from '@/components/admin/reports/CustomerReportsTable';
import type { CustomerReportExportPayload } from '@/lib/customerReportExport';
import { buildCustomerReportSummaries, getCustomerInvoicesForReport } from '@/lib/customerReports';

type CustomerReportRow = {
  id: string;
  customerName: string;
  gstNumber: string;
  address: string;
  normalizedCustomerName?: string;
  normalizedAddress?: string;
  totalInvoices: number;
  totalPurchaseAmount: string;
  lastPurchaseDate: string;
};

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

function buildCustomerExportData(invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>>, reports: CustomerReportRow[]): CustomerReportExportPayload[] {
  return reports.map((report) => {
    const matchingInvoices = getCustomerInvoicesForReport(invoices, report);
    const sortedInvoices = matchingInvoices
      .slice()
      .sort((left, right) => compareDates(left.date, right.date) || String(left.billNumber || '').localeCompare(String(right.billNumber || '')));

    let runningTotal = 0;
    const historyRows = sortedInvoices.map((invoice) => {
      const invoiceAmount = Number(invoice.grandTotal || 0);
      const paymentMadeValue = invoice.paymentMade === null || invoice.paymentMade === undefined ? null : Number(invoice.paymentMade);
      const pendingAmountValue = invoice.pendingAmount === null || invoice.pendingAmount === undefined ? null : Number(invoice.pendingAmount);
      runningTotal += invoiceAmount;
      console.log("Invoice:", invoice.invoiceNumber);
      console.log("paymentMade:", invoice.paymentMade);
      console.log("pendingAmount:", invoice.pendingAmount);
      return {
        id: invoice.id || '',
        invoiceNumber: invoice.invoiceNumber || '—',
        billNumber: invoice.billNo || invoice.billNumber,
        invoiceDate: formatDate(invoice.date),
        products: getInvoiceProductSummary(invoice.items),
        quantity: getInvoiceQuantity(invoice.items),
        invoiceAmount: formatCurrency(invoiceAmount),
        paymentMade: formatPaymentDisplay(paymentMadeValue, paymentMadeValue),
        pendingAmount: formatPaymentDisplay(pendingAmountValue, paymentMadeValue),
        runningTotal: formatCurrency(runningTotal),
        date: invoice.date,
        grandTotal: invoice.grandTotal,
      };
    });

    const totalPurchaseAmount = sortedInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
    const lastPurchaseInvoice = sortedInvoices[sortedInvoices.length - 1];

    return {
      customer: {
        customerName: report.customerName || '—',
        gstNumber: report.gstNumber || '—',
        address: report.address || '—',
        totalInvoices: sortedInvoices.length || report.totalInvoices,
        totalPurchaseAmount: formatCurrency(totalPurchaseAmount),
        lastPurchaseDate: formatDate(lastPurchaseInvoice?.date || report.lastPurchaseDate),
      },
      invoices: historyRows,
    };
  });
}

export default async function ReportsPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const customerReports: CustomerReportRow[] = buildCustomerReportSummaries(invoices).map((report) => ({
    id: report.id,
    customerName: report.customerName,
    gstNumber: report.gstNumber,
    address: report.address,
    normalizedCustomerName: report.normalizedCustomerName,
    normalizedAddress: report.normalizedAddress,
    totalInvoices: report.totalInvoices,
    totalPurchaseAmount: Number(report.totalPurchaseAmount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }),
    lastPurchaseDate: report.lastPurchaseDate || '—',
  }));

  const customerExportData = buildCustomerExportData(invoices, customerReports);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#E8DFFB] bg-white/80 p-6 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold text-[#2F3340]">Customer Reports</h2>
        </div>
      </section>

      <CustomerReportsTable customerReports={customerReports} customerExportData={customerExportData} />
    </div>
  );
}
