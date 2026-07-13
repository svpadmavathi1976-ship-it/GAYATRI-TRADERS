import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(183,156,237,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(200,162,200,0.18),_transparent_24%),linear-gradient(135deg,_#FAF8F5_0%,_#F7F2EB_45%,_#FCFCFD_100%)] px-4 py-6 text-[#2F3340] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[#E8DFFB] bg-[#FCFCFD]/85 shadow-[0_30px_80px_-32px_rgba(95,100,112,0.32)] backdrop-blur-xl">
        <section className="hidden w-[46%] flex-col border-r border-[#E8DFFB] bg-[radial-gradient(circle_at_top_left,_rgba(183,156,237,0.2),_transparent_32%),linear-gradient(135deg,_#FCFCFD_0%,_#F9F3FF_45%,_#F5EFE9_100%)] p-10 lg:flex">
          <div className="flex h-full flex-col">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-[#E8DFFB] bg-white/80 px-4 py-2 text-sm font-medium text-[#5F6470] shadow-[0_10px_30px_-18px_rgba(95,100,112,0.35)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8DFFB] text-lg text-[#7F63C7]">G</span>
                Gayatri Traders
              </Link>
            </div>

            <div className="flex flex-1 items-center py-10">
              <div className="max-w-lg space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]">Admin Portal</p>
                  <h1 className="font-serif text-4xl font-semibold leading-tight text-[#2F3340]">
                    Welcome back to a premium trading command center.
                  </h1>
                </div>
                <p className="text-lg leading-8 text-[#5F6470]">
                  Secure your team, manage approvals, and stay aligned with every business operation in one place.
                </p>
              </div>
            </div>

            <div className="h-8" />
          </div>
        </section>

        <section className="flex w-full flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(183,156,237,0.13),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(250,248,245,0.9))] p-6 sm:p-8 lg:p-10">
          {children}
        </section>
      </div>
    </main>
  );
}
