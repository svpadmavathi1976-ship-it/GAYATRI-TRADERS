import { Search } from 'lucide-react';

interface InvoiceFilterBarProps {
  invoiceQuery: string;
  customerQuery: string;
  quickFilter: string;
  onInvoiceQueryChange: (value: string) => void;
  onCustomerQueryChange: (value: string) => void;
  onQuickFilterChange: (value: string) => void;
  onReset: () => void;
}

const quickFilters = ['all', 'today', 'week', 'month'];

export default function InvoiceFilterBar({
  invoiceQuery,
  customerQuery,
  quickFilter,
  onInvoiceQueryChange,
  onCustomerQueryChange,
  onQuickFilterChange,
  onReset,
}: InvoiceFilterBarProps) {
  return (
    <section className="rounded-[28px] border border-[#E8DFFB] bg-white/80 p-4 shadow-[0_20px_50px_-26px_rgba(95,100,112,0.24)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2.5 text-sm text-[#4B5563]">
          <Search size={16} className="text-[#8B6AD3]" />
          <input
            value={invoiceQuery}
            onChange={(event) => onInvoiceQueryChange(event.target.value)}
            placeholder="Search invoice number"
            className="w-full bg-transparent outline-none placeholder:text-[#A6AAB4]"
          />
        </label>

        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-3 py-2.5 text-sm text-[#4B5563]">
          <Search size={16} className="text-[#8B6AD3]" />
          <input
            value={customerQuery}
            onChange={(event) => onCustomerQueryChange(event.target.value)}
            placeholder="Search customer name"
            className="w-full bg-transparent outline-none placeholder:text-[#A6AAB4]"
          />
        </label>

        <div className="flex min-w-[280px] flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Quick Filters</span>
          <div className="relative flex items-center rounded-full border border-[#E8DFFB] bg-white/90 p-1 shadow-[0_10px_30px_-16px_rgba(127,99,199,0.45)]">
            <div
              className="absolute inset-y-1 rounded-full bg-gradient-to-r from-[#A89BF5] via-[#8B6AD3] to-[#7F63C7] shadow-[0_12px_20px_-10px_rgba(127,99,199,0.45)] transition-all duration-300"
              style={{
                left: `calc(${quickFilters.findIndex((filter) => filter === quickFilter)} * ((100% - 0.5rem) / ${quickFilters.length}) + 0.25rem)`,
                width: `calc((100% - 0.5rem) / ${quickFilters.length})`,
              }}
            />
            {quickFilters.map((filter) => {
              const isActive = quickFilter === filter;
              const label = filter === 'all' ? 'All' : filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month';

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onQuickFilterChange(filter)}
                  className={`relative z-10 flex-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-[#6D7280] hover:bg-[#F7F3FF] hover:text-[#4B5563]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
