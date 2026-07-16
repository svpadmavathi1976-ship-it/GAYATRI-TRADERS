'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CircleDollarSign, FileText, ReceiptText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceEmptyState from '@/components/admin/invoices/InvoiceEmptyState';
import InvoiceFilterBar from '@/components/admin/invoices/InvoiceFilterBar';
import InvoiceSummaryCard from '@/components/admin/invoices/InvoiceSummaryCard';
import InvoiceTable from '@/components/admin/invoices/InvoiceTable';
import { formatCurrency, type Invoice } from '@/lib/mockInvoices';

const PAGE_SIZE = 5;

export default function InvoicesPage() {
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<Invoice[]>([]);
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices');
      const result = await response.json();
      setRows(result.invoices || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const normalizedInvoiceQuery = invoiceQuery.trim().toLowerCase();
    const normalizedCustomerQuery = customerQuery.trim().toLowerCase();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    return rows.filter((invoice) => {
      const matchesInvoice = invoice.invoiceNo.toLowerCase().includes(normalizedInvoiceQuery) || invoice.billNo.toLowerCase().includes(normalizedInvoiceQuery);
      const matchesCustomer = invoice.customer.toLowerCase().includes(normalizedCustomerQuery);
      const invoiceDate = new Date(invoice.date);
      const matchesDate = (() => {
        switch (quickFilter) {
          case 'today':
            return invoice.date === todayString;
          case 'week':
            return invoiceDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
          case 'month':
            return invoiceDate >= new Date(today.getFullYear(), today.getMonth(), 1);
          default:
            return true;
        }
      })();
      return matchesInvoice && matchesCustomer && matchesDate;
    });
  }, [rows, invoiceQuery, customerQuery, quickFilter]);

  const sortedInvoices = useMemo(() => {
    const cloned = [...filteredInvoices];
    cloned.sort((first, second) => {
      const firstDate = new Date(first.date).getTime();
      const secondDate = new Date(second.date).getTime();
      return sortAsc ? firstDate - secondDate : secondDate - firstDate;
    });
    return cloned;
  }, [filteredInvoices, sortAsc]);

  const pagedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedInvoices.slice(start, start + PAGE_SIZE);
  }, [sortedInvoices, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / PAGE_SIZE));

  const handleReset = () => {
    setInvoiceQuery('');
    setCustomerQuery('');
    setQuickFilter('all');
    setCurrentPage(1);
  };

  const handleDelete = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Unable to delete invoice.');
        return;
      }

      toast.success(result.message || 'Invoice deleted successfully.');
      setInvoiceToDelete(null);
      await loadInvoices();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Unable to delete invoice right now.');
    } finally {
      setIsDeleting(false);
    }
  };

  const summaryCards = [
    {
      title: 'Total Invoices',
      value: rows.length.toString(),
      detail: 'Live count from the database',
      icon: FileText,
      accent: 'from-[#E8DFFB] to-[#F8F3FF]',
    },
    {
      title: 'Total Sales',
      value: formatCurrency(rows.reduce((sum, invoice) => sum + invoice.amount, 0)),
      detail: 'Across all saved invoices',
      icon: CircleDollarSign,
      accent: 'from-[#FCEFD4] to-[#FFF8E7]',
    },
    {
      title: "Today's Sales",
      value: formatCurrency(rows.filter((invoice) => invoice.date === new Date().toISOString().split('T')[0]).reduce((sum, invoice) => sum + invoice.amount, 0)),
      detail: 'Matching the current day',
      icon: ReceiptText,
      accent: 'from-[#DBF4E9] to-[#F2FCF7]',
    },
    {
      title: 'Monthly Sales',
      value: formatCurrency(rows.filter((invoice) => invoice.date.startsWith(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)).reduce((sum, invoice) => sum + invoice.amount, 0)),
      detail: 'For the current month',
      icon: Sparkles,
      accent: 'from-[#E7F6FF] to-[#F3FAFF]',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-[#E8DFFB] bg-white/80 p-6 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#2F3340]">Invoice Management</h2>
        </div>
        <Link
          href="/admin/invoices/create"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#7F63C7] to-[#9F86E5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(127,99,199,0.8)] transition hover:opacity-90"
        >
          + Create Invoice
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <InvoiceSummaryCard key={card.title} {...card} />
        ))}
      </section>

      <InvoiceFilterBar
        invoiceQuery={invoiceQuery}
        customerQuery={customerQuery}
        quickFilter={quickFilter}
        onInvoiceQueryChange={(value) => {
          setInvoiceQuery(value);
          setCurrentPage(1);
        }}
        onCustomerQueryChange={(value) => {
          setCustomerQuery(value);
          setCurrentPage(1);
        }}
        onQuickFilterChange={(value) => {
          setQuickFilter(value);
          setCurrentPage(1);
        }}
        onReset={handleReset}
      />

      {!isLoading && sortedInvoices.length > 0 ? (
        <InvoiceTable
          invoices={pagedInvoices}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          onDelete={handleDelete}
          onSort={() => setSortAsc((value) => !value)}
          sortLabel={sortAsc ? '↑' : '↓'}
        />
      ) : null}

      {!isLoading && sortedInvoices.length === 0 ? <InvoiceEmptyState /> : null}

      {invoiceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] border border-[#E8DFFB] bg-white p-6 shadow-[0_25px_70px_-25px_rgba(15,23,42,0.35)]">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-2xl bg-[#FFF7F7] p-2 text-[#C2410C]">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2F3340]">Delete Invoice</h3>
                <p className="mt-1 text-sm text-[#6D7280]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl bg-[#F8F4FF] p-4 text-sm text-[#4B5563]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[#2F3340]">{invoiceToDelete.billNo}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-[#6D7280]">Customer Name</span>
                <span className="font-semibold text-[#2F3340]">{invoiceToDelete.customer}</span>
              </div>
            </div>

            <p className="mt-4 text-sm text-[#4B5563]">Are you sure you want to delete this invoice? This action cannot be undone.</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                disabled={isDeleting}
                className="rounded-2xl border border-[#E8DFFB] bg-white px-4 py-2.5 text-sm font-semibold text-[#4B5563] transition hover:bg-[#F8F4FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-2xl bg-[#C2410C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A23A10] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
