import * as XLSX from 'xlsx';
import type { CustomerReportExportPayload } from '@/lib/customerReportExport';

export interface InvoiceBackupRecord {
  id: string;
  billNumber: string;
  date: string;
  state: string;
  stateCode: string;
  receiverName: string;
  receiverAddress: string;
  receiverGSTIN: string;
  invoiceNumber: string;
  billNo: string;
  dispatchedThrough: string;
  customTransport: string;
  billOfLading: string;
  destination: string;
  deliveryDate: string;
  lorryNumber: string;
  grandTotal: number | null;
  amountInWords: string;
  items: string;
  paymentMade: number | null;
  pendingAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

function normalizeString(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDate(value?: string | null) {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return 'Rs. 0.00';
  }
  return `Rs. ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function autoFitColumns(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<Array<string | number>>;
  const widthMap: Array<{ width: number }> = [];

  for (let colIndex = 0; colIndex < Math.max(1, ...(rows.map((row) => row.length))); colIndex += 1) {
    const maxLength = rows.reduce((max, row) => {
      const value = row[colIndex];
      if (value === undefined || value === null) {
        return max;
      }
      return Math.max(max, String(value).length);
    }, 10);

    widthMap[colIndex] = { width: Math.min(40, Math.max(12, Math.ceil(maxLength * 1.2))) };
  }

  sheet['!cols'] = widthMap;
}

export function exportInvoicesToExcel(invoices: InvoiceBackupRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const rows: Array<Array<string | number>> = [
    ['Gayatri Traders Invoice Export'],
    [],
    [
      'Invoice ID',
      'Bill Number',
      'Invoice Number',
      'Date',
      'Customer',
      'GSTIN',
      'State',
      'Grand Total',
      'Payment Made',
      'Pending Amount',
      'Last Updated',
    ],
  ];

  invoices.forEach((invoice) => {
    rows.push([
      invoice.id || '-',
      invoice.billNumber || invoice.billNo || '-',
      invoice.invoiceNumber || '-',
      normalizeDate(invoice.date),
      normalizeString(invoice.receiverName) || '-',
      normalizeString(invoice.receiverGSTIN) || '-',
      normalizeString(invoice.state) || '-',
      formatCurrency(invoice.grandTotal),
      invoice.paymentMade !== null ? formatCurrency(invoice.paymentMade) : 'Rs. 0.00',
      invoice.pendingAmount !== null ? formatCurrency(invoice.pendingAmount) : 'Rs. 0.00',
      normalizeDate(invoice.updatedAt),
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
  autoFitColumns(worksheet);

  XLSX.writeFile(workbook, `Gayatri-Traders-All-Invoices-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportDatabaseBackupJson(backup: { admins?: unknown[]; invoices: InvoiceBackupRecord[]; customerReports: unknown[] }) {
  if (typeof window === 'undefined') {
    return;
  }

  const fileName = `Gayatri-Traders-Database-Backup-${new Date().toISOString().slice(0, 10)}.json`;
  const content = JSON.stringify({ backup }, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

interface CustomerGroup {
  customerName: string;
  gstNumber: string;
  address: string;
  invoices: InvoiceBackupRecord[];
}

function buildCustomerGroups(invoices: InvoiceBackupRecord[]) {
  const groups = new Map<string, CustomerGroup>();

  invoices.forEach((invoice) => {
    const customerName = normalizeString(invoice.receiverName) || 'Unknown Customer';
    const gstNumber = normalizeString(invoice.receiverGSTIN).toUpperCase();
    const address = normalizeString(invoice.receiverAddress) || 'Unknown Address';
    const groupKey = gstNumber || `${customerName}::${address}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        customerName,
        gstNumber,
        address,
        invoices: [],
      });
    }

    groups.get(groupKey)?.invoices.push(invoice);
  });

  return Array.from(groups.values());
}

function parseInvoiceItems(items: string | null) {
  if (!items) {
    return [] as Array<{ description?: string }>; 
  }

  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as Array<{ description?: string }>;
  }
}

export function buildCustomerReportExportPayload(invoices: InvoiceBackupRecord[]): CustomerReportExportPayload[] {
  const groups = buildCustomerGroups(invoices);

  return groups.map((group) => {
    const invoiceRows = group.invoices.slice().sort((left, right) => {
      const leftDate = new Date(left.date || '');
      const rightDate = new Date(right.date || '');
      if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
        return String(left.billNumber || left.invoiceNumber || '').localeCompare(String(right.billNumber || right.invoiceNumber || ''));
      }
      return leftDate.getTime() - rightDate.getTime();
    });

    const customer = {
      customerName: group.customerName,
      gstNumber: group.gstNumber || '—',
      address: group.address,
      totalInvoices: group.invoices.length,
      totalPurchaseAmount: formatCurrency(group.invoices.reduce((total, invoice) => total + Number(invoice.grandTotal ?? 0), 0)),
      lastPurchaseDate: normalizeDate(group.invoices[group.invoices.length - 1]?.date),
    };

    const invoicesPayload = invoiceRows.map((invoice) => {
      const itemDescriptions = parseInvoiceItems(invoice.items).map((item) => item.description?.trim()).filter(Boolean);
      const products = itemDescriptions.length ? itemDescriptions.join(', ') : '—';
      const quantityTotal = parseInvoiceItems(invoice.items).reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0);

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || invoice.billNumber || '—',
        billNumber: invoice.billNo || invoice.billNumber || '—',
        invoiceDate: normalizeDate(invoice.date),
        products,
        quantity: quantityTotal > 0 ? String(quantityTotal) : '—',
        invoiceAmount: formatCurrency(invoice.grandTotal),
        paymentMade: invoice.paymentMade !== null ? formatCurrency(invoice.paymentMade) : '—',
        pendingAmount: invoice.pendingAmount !== null ? formatCurrency(invoice.pendingAmount) : '—',
        runningTotal: formatCurrency(invoice.grandTotal),
        date: invoice.date,
        grandTotal: invoice.grandTotal,
      };
    });

    return {
      customer,
      invoices: invoicesPayload,
    };
  });
}
