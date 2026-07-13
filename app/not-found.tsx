import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCFAFF] px-6 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[#E8DFFB] bg-white p-8 text-center shadow-[0_20px_50px_-25px_rgba(95,100,112,0.24)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#2F3340]">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-[#6D7280]">
          The requested customer history page could not be found. Please return to the reports list and try again.
        </p>
        <Link
          href="/admin/reports"
          className="mt-6 inline-flex items-center justify-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-2.5 text-sm font-semibold text-[#7F63C7] transition hover:bg-[#F3ECFF]"
        >
          Back to Reports
        </Link>
      </div>
    </div>
  );
}
