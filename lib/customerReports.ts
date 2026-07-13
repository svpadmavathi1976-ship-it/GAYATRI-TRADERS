import { createHash } from 'crypto';

interface CustomerReportInvoiceLike {
  id?: string;
  receiverName?: string | null;
  receiverAddress?: string | null;
  receiverGSTIN?: string | null;
  invoiceNumber?: string | null;
  billNo?: string | null;
  billNumber?: string | null;
  items?: string | null;
  grandTotal?: number | null;
  paymentMade?: number | null;
  pendingAmount?: number | null;
  date?: string | null;
}

function normalizeText(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeIdentityText(value?: string | null) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesCustomerIdentity(left: { customerName: string; address: string; gstNumber: string; normalizedCustomerName?: string; normalizedAddress?: string }, right: { customerName: string; address: string; gstNumber: string; normalizedCustomerName?: string; normalizedAddress?: string }) {
  if (left.gstNumber && right.gstNumber && left.gstNumber === right.gstNumber) {
    return true;
  }

  const leftName = left.normalizedCustomerName || normalizeIdentityText(left.customerName);
  const leftAddress = left.normalizedAddress || normalizeIdentityText(left.address);
  const rightName = right.normalizedCustomerName || normalizeIdentityText(right.customerName);
  const rightAddress = right.normalizedAddress || normalizeIdentityText(right.address);

  if (!leftName && !leftAddress) {
    return false;
  }

  if (!rightName && !rightAddress) {
    return false;
  }

  const sameName = !leftName || !rightName || leftName === rightName;
  const sameAddress = !leftAddress || !rightAddress || leftAddress === rightAddress;

  return sameName && sameAddress;
}

function getInvoiceDateValue(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return '';
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? normalized : parsed.toISOString().slice(0, 10);
}

function compareDates(left: string, right: string) {
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
    return left.localeCompare(right);
  }

  return leftDate.getTime() - rightDate.getTime();
}

export function getCustomerIdentity(invoice: CustomerReportInvoiceLike) {
  const customerName = normalizeText(invoice.receiverName);
  const address = normalizeText(invoice.receiverAddress);
  const gstNumber = normalizeText(invoice.receiverGSTIN).toUpperCase();
  const normalizedCustomerName = normalizeIdentityText(customerName);
  const normalizedAddress = normalizeIdentityText(address);
  const normalizedNameAddressKey = normalizedCustomerName || normalizedAddress ? `${normalizedCustomerName}::${normalizedAddress}` : 'unknown-customer';

  return {
    customerKey: gstNumber || normalizedNameAddressKey || 'unknown-customer',
    customerName,
    gstNumber,
    address,
    fallbackKey: normalizedNameAddressKey,
    normalizedCustomerName,
    normalizedAddress,
    normalizedNameAddressKey,
  };
}

export function buildCustomerRouteId(input: { customerName: string; gstNumber: string; address: string }) {
  const normalizedIdentity = [
    normalizeText(input.gstNumber).toUpperCase(),
    normalizeIdentityText(input.customerName),
    normalizeIdentityText(input.address),
  ]
    .filter(Boolean)
    .join('|');

  return createHash('sha256').update(normalizedIdentity || 'unknown-customer').digest('hex').slice(0, 16);
}

export function getCustomerInvoicesForReport(
  invoices: CustomerReportInvoiceLike[],
  report: {
    customerName: string;
    gstNumber: string;
    address: string;
    normalizedCustomerName?: string;
    normalizedAddress?: string;
  },
) {
  const normalizedCustomerName = report.normalizedCustomerName || normalizeIdentityText(report.customerName);
  const normalizedAddress = report.normalizedAddress || normalizeIdentityText(report.address);
  const gstNumber = normalizeText(report.gstNumber).toUpperCase();

  return invoices.filter((invoice) => {
    const identity = getCustomerIdentity(invoice);

    if (gstNumber && identity.gstNumber) {
      return identity.gstNumber === gstNumber;
    }

    const matchesNameAddress = Boolean(normalizedCustomerName || normalizedAddress)
      && identity.normalizedCustomerName === normalizedCustomerName
      && identity.normalizedAddress === normalizedAddress;

    return matchesNameAddress;
  });
}

export function buildCustomerReportSummaries(invoices: CustomerReportInvoiceLike[]) {
  const groupedReports = new Map<string, {
    id: string;
    customerKey: string;
    customerName: string;
    gstNumber: string;
    address: string;
    normalizedCustomerName: string;
    normalizedAddress: string;
    totalInvoices: number;
    totalPurchaseAmount: number;
    lastPurchaseDate: string;
  }>();

  invoices.forEach((invoice) => {
    const identity = getCustomerIdentity(invoice);
    const amount = Number(invoice.grandTotal || 0);
    const purchaseDate = getInvoiceDateValue(invoice.date);

    const matchedReport = Array.from(groupedReports.values()).find((report) => matchesCustomerIdentity(
      {
        customerName: identity.customerName,
        address: identity.address,
        gstNumber: identity.gstNumber,
        normalizedCustomerName: identity.normalizedCustomerName,
        normalizedAddress: identity.normalizedAddress,
      },
      {
        customerName: report.customerName,
        address: report.address,
        gstNumber: report.gstNumber,
        normalizedCustomerName: report.normalizedCustomerName,
        normalizedAddress: report.normalizedAddress,
      },
    ));

    if (matchedReport) {
      matchedReport.totalInvoices += 1;
      matchedReport.totalPurchaseAmount += amount;
      matchedReport.customerName = identity.customerName || matchedReport.customerName;
      matchedReport.gstNumber = identity.gstNumber || matchedReport.gstNumber;
      matchedReport.address = identity.address || matchedReport.address;
      matchedReport.normalizedCustomerName = identity.normalizedCustomerName || matchedReport.normalizedCustomerName;
      matchedReport.normalizedAddress = identity.normalizedAddress || matchedReport.normalizedAddress;
      matchedReport.lastPurchaseDate = compareDates(matchedReport.lastPurchaseDate, purchaseDate) < 0 ? purchaseDate : matchedReport.lastPurchaseDate;
      matchedReport.id = buildCustomerRouteId({
        customerName: matchedReport.customerName,
        gstNumber: matchedReport.gstNumber,
        address: matchedReport.address,
      });

      return;
    }

    const reportKey = identity.gstNumber || identity.normalizedNameAddressKey || 'unknown-customer';

    groupedReports.set(reportKey, {
      id: buildCustomerRouteId({
        customerName: identity.customerName,
        gstNumber: identity.gstNumber,
        address: identity.address,
      }),
      customerKey: reportKey,
      customerName: identity.customerName,
      gstNumber: identity.gstNumber,
      address: identity.address,
      normalizedCustomerName: identity.normalizedCustomerName,
      normalizedAddress: identity.normalizedAddress,
      totalInvoices: 1,
      totalPurchaseAmount: amount,
      lastPurchaseDate: purchaseDate,
    });
  });

  return Array.from(groupedReports.values()).sort((left, right) => {
    const dateOrder = compareDates(right.lastPurchaseDate, left.lastPurchaseDate);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    return left.customerName.localeCompare(right.customerName);
  });
}
