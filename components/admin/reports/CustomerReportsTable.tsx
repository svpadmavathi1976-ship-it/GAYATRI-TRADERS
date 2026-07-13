'use client';

import Link from 'next/link';
import { ChevronDown, Download, Search, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { exportAllCustomerReportsToExcel, exportAllCustomerReportsToPDF, type CustomerReportExportPayload } from '@/lib/customerReportExport';

const tableColumns = ['Customer Name', 'GST Number', 'Address', 'Total Invoices', 'Total Purchase Amount', 'Last Purchase Date', 'Actions'];

type CustomerReportRow = {
  id: string;
  customerName: string;
  gstNumber: string;
  address: string;
  totalInvoices: number;
  totalPurchaseAmount: string;
  lastPurchaseDate: string;
};

type SortOption = 'alphabeticalAsc' | 'totalPurchaseDesc' | 'lastPurchaseDateDesc';

interface CustomerReportsTableProps {
  customerReports: CustomerReportRow[];
  customerExportData?: CustomerReportExportPayload[];
}

const parseAmount = (value: string) => {
  const numericValue = value.replace(/[^\d.-]/g, '');
  const parsedValue = Number(numericValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const parseDateValue = (value: string) => {
  const parsedValue = Date.parse(value);

  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

export function CustomerReportsTable({ customerReports, customerExportData }: CustomerReportsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gst' | 'nonGst'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('lastPurchaseDateDesc');

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredCustomers = useMemo(() => {
    return customerReports.filter((customer) => {
      const matchesSearch = !normalizedSearch
        ? true
        : customer.customerName.toLowerCase().includes(normalizedSearch) || customer.gstNumber.toLowerCase().includes(normalizedSearch);

      const matchesFilter = (() => {
        if (selectedFilter === 'all') {
          return true;
        }

        if (selectedFilter === 'gst') {
          return Boolean(customer.gstNumber?.trim());
        }

        return !customer.gstNumber?.trim();
      })();

      return matchesSearch && matchesFilter;
    });
  }, [customerReports, normalizedSearch, selectedFilter]);

  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];

    sorted.sort((left, right) => {
      switch (sortOption) {
        case 'alphabeticalAsc':
          return left.customerName.localeCompare(right.customerName);
        case 'totalPurchaseDesc':
          return parseAmount(right.totalPurchaseAmount) - parseAmount(left.totalPurchaseAmount);
        case 'lastPurchaseDateDesc':
        default:
          return parseDateValue(right.lastPurchaseDate) - parseDateValue(left.lastPurchaseDate);
      }
    });

    return sorted;
  }, [filteredCustomers, sortOption]);

  const hasActiveFilters = normalizedSearch.length > 0 || selectedFilter !== 'all';
  const showNoMatches = customerReports.length > 0 && filteredCustomers.length === 0 && hasActiveFilters;

  const handleExportAllPdf = () => {
    if (!customerExportData?.length) {
      return;
    }

    exportAllCustomerReportsToPDF(customerExportData);
  };

  const handleExportAllExcel = () => {
    if (!customerExportData?.length) {
      return;
    }

    exportAllCustomerReportsToExcel(customerExportData);
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E8DFFB] bg-white/85 shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)] backdrop-blur">
      <div className="border-b border-[#F1EAFB] bg-[#FCFAFF] px-3 py-3 sm:px-4">
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap">
          <div className="flex h-11 w-[320px] min-w-[320px] shrink-0 items-center gap-2 rounded-lg border border-[#E8DFFB] bg-white px-3 shadow-[0_2px_8px_-4px_rgba(127,99,199,0.16)] transition duration-200 hover:border-[#D4BEF8] hover:shadow-[0_6px_16px_-10px_rgba(127,99,199,0.24)]">
            <Search size={15} className="shrink-0 text-[#7F63C7]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search Customer Name or GST Number..."
              className="w-full border-none bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>

          <div className="flex h-11 w-[210px] min-w-[210px] shrink-0 items-center rounded-lg border border-[#E8DFFB] bg-white px-4 shadow-[0_2px_8px_-4px_rgba(127,99,199,0.16)] transition duration-200 hover:border-[#D4BEF8] hover:shadow-[0_6px_16px_-10px_rgba(127,99,199,0.24)]">
            <label htmlFor="customer-filter" className="shrink-0 pr-2 text-[13px] font-medium leading-none text-[#6B7280]">
              Filter
            </label>
            <div className="relative flex min-w-0 flex-1 items-center">
              <select
                id="customer-filter"
                value={selectedFilter}
                onChange={(event) => setSelectedFilter(event.target.value as 'all' | 'gst' | 'nonGst')}
                className="w-full appearance-none bg-transparent pr-5 text-[14px] font-medium leading-none text-[#374151] outline-none"
              >
                <option value="all">All Customers</option>
                <option value="gst">GST Customers</option>
                <option value="nonGst">Non GST Customers</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            </div>
          </div>

          <div className="flex h-11 w-[210px] min-w-[210px] shrink-0 items-center rounded-lg border border-[#E8DFFB] bg-white px-4 shadow-[0_2px_8px_-4px_rgba(127,99,199,0.16)] transition duration-200 hover:border-[#D4BEF8] hover:shadow-[0_6px_16px_-10px_rgba(127,99,199,0.24)]">
            <label htmlFor="customer-sort" className="shrink-0 pr-2 text-[13px] font-medium leading-none text-[#6B7280]">
              Sort By
            </label>
            <div className="relative flex min-w-0 flex-1 items-center">
              <select
                id="customer-sort"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="w-full appearance-none bg-transparent pr-5 text-[14px] font-medium leading-none text-[#374151] outline-none"
              >
                <option value="alphabeticalAsc">Alphabetically (A–Z)</option>
                <option value="totalPurchaseDesc">Total Purchase (High → Low)</option>
                <option value="lastPurchaseDateDesc">Last Purchase (Newest First)</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={!customerExportData?.length}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#D8C4F8] bg-[#7F63C7] px-3 text-sm font-semibold text-white shadow-[0_6px_16px_-10px_rgba(127,99,199,0.35)] transition duration-200 hover:bg-[#6F55B9] disabled:cursor-not-allowed disabled:border-[#E8DFFB] disabled:bg-[#E8DFFB] disabled:text-[#9CA3AF] disabled:shadow-none"
            >
              <Download size={15} />
              Download All PDF
            </button>
            <button
              type="button"
              onClick={handleExportAllExcel}
              disabled={!customerExportData?.length}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E8DFFB] bg-[#FAF8F5] px-3 text-sm font-semibold text-[#7F63C7] shadow-[0_2px_8px_-4px_rgba(127,99,199,0.16)] transition duration-200 hover:bg-[#F3ECFF] hover:shadow-[0_6px_16px_-10px_rgba(127,99,199,0.24)] disabled:cursor-not-allowed disabled:border-[#E8DFFB] disabled:bg-[#E8DFFB] disabled:text-[#9CA3AF] disabled:shadow-none"
            >
              <Download size={15} />
              Download All Excel
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        {customerReports.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] p-4 text-[#7F63C7]">
              <UsersRound size={24} />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-[#2F3340]">No Customer Reports Available</h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#6D7280]">
              Customer reports will automatically appear here once invoices are created.
            </p>
          </div>
        ) : showNoMatches ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-base font-semibold text-[#2F3340]">No matching customers found.</p>
          </div>
        ) : (
          <table className="w-full table-auto text-left">
            <thead className="bg-[#F8F4FF] text-sm text-[#6D7280]">
              <tr>
                {tableColumns.map((column) => (
                  <th
                    key={column}
                    className={`px-4 py-4 font-semibold ${column === 'Actions' ? 'w-[190px] text-center' : ''}`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer) => (
                <tr key={customer.id} className="border-t border-[#F1EAFB] text-sm text-[#4B5563] transition hover:bg-[#FCFAFF]">
                  <td className="px-4 py-4 font-semibold text-[#2F3340]">{customer.customerName}</td>
                  <td className="px-4 py-4">{customer.gstNumber}</td>
                  <td className="px-4 py-4">{customer.address}</td>
                  <td className="px-4 py-4">{customer.totalInvoices}</td>
                  <td className="px-4 py-4 font-semibold text-[#2F3340]">{customer.totalPurchaseAmount}</td>
                  <td className="px-4 py-4">{customer.lastPurchaseDate}</td>
                  <td className="w-[190px] px-4 py-4 text-center align-middle">
                    <Link
                      href={`/admin/reports/customer/${customer.id}`}
                      className="inline-flex h-9 min-w-[156px] items-center justify-center whitespace-nowrap rounded-xl border border-[#CDB9F8] bg-[#FAF8F5] px-4 py-2 text-sm font-semibold text-[#7F63C7] transition hover:bg-[#F3ECFF]"
                    >
                      View Customer History
                    </Link>
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
