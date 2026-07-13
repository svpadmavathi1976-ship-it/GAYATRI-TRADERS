export type InvoiceStatus = 'Paid' | 'Pending' | 'Draft' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNo: string;
  billNo: string;
  customer: string;
  date: string;
  amount: number;
  paymentMade?: number | null;
  pendingAmount?: number | null;
  status: InvoiceStatus;
  createdAt?: string;
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
