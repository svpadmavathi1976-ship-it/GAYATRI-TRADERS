'use client';

import { Download } from 'lucide-react';
import { exportCustomerReportToExcel, exportCustomerReportToPDF } from '@/lib/customerReportExport';

interface CustomerSummaryData {
  customerName: string;
  gstNumber: string;
  address: string;
  totalInvoices: number;
  totalPurchaseAmount: string;
  lastPurchaseDate: string;
}

interface CustomerInvoiceExportRow {
  id: string;
  invoiceNumber: string;
  billNumber?: string | null;
  invoiceDate: string;

  products: string;
  bags: string;
  quantity: string;
  rate: string;

  invoiceAmount: string;

  paymentMade: string;
  pendingAmount: string;

  runningTotal: string;

  date?: string | null;
  grandTotal?: number | string | null;
}

interface CustomerReportActionsProps {
  customer: CustomerSummaryData;
  invoices: CustomerInvoiceExportRow[];
}

export function CustomerReportActions({ customer, invoices }: CustomerReportActionsProps) {
  const handleExportPdf = async () => {
    exportCustomerReportToPDF({ customer, invoices });
    try {
      await fetch('/api/admin/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'report',
          title: 'Customer Report PDF Generated',
          description: `Customer report for ${customer.customerName} was generated as PDF.`,
        }),
      });
    } catch (error) {
      console.error('Failed to log customer report PDF activity:', error);
    }
  };

  const handleExportExcel = async () => {
    exportCustomerReportToExcel({ customer, invoices });
    try {
      await fetch('/api/admin/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'report',
          title: 'Customer Report Excel Generated',
          description: `Customer report for ${customer.customerName} was generated as Excel.`,
        }),
      });
    } catch (error) {
      console.error('Failed to log customer report Excel activity:', error);
    }
  };

  return (
    <section className="rounded-[28px] border border-[#E8DFFB] bg-white/85 p-5 shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#2F3340]">Customer Report Export Actions</h3>
          <p className="mt-1 text-sm text-[#6D7280]">Download the full customer report as PDF or Excel from one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-2.5 text-sm font-semibold text-[#7F63C7] transition hover:bg-[#F3ECFF]"
          >
            <Download size={16} />
            Download Complete Customer Report (PDF)
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-2.5 text-sm font-semibold text-[#7F63C7] transition hover:bg-[#F3ECFF]"
          >
            <Download size={16} />
            Download Complete Customer Report (Excel)
          </button>
        </div>
      </div>
    </section>
  );
}
