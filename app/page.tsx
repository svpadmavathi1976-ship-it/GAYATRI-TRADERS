import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(183,156,237,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(200,162,200,0.2),_transparent_24%),linear-gradient(135deg,_#FAF8F5_0%,_#F7F2EB_45%,_#FCFCFD_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute left-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-[#E8DFFB]/70 blur-3xl" />
      <div className="absolute bottom-[-2rem] right-[-3rem] h-64 w-64 rounded-full bg-[#F4E6D8]/80 blur-3xl" />
      <div className="absolute inset-x-0 top-8 mx-auto h-px w-[80%] bg-gradient-to-r from-transparent via-[#DCCCF8] to-transparent" />

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[36px] border border-[#E8DFFB] bg-[#FCFCFD]/85 p-8 shadow-[0_30px_80px_-32px_rgba(95,100,112,0.32)] backdrop-blur-xl sm:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.8),_transparent_38%),radial-gradient(circle_at_85%_15%,_rgba(183,156,237,0.18),_transparent_30%)]" />
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-[#E8DFFB] bg-white/65" />
        <div className="absolute bottom-8 left-8 h-16 w-16 rounded-full bg-[#F4EDE4]/90" />

        <div className="relative grid gap-10 lg:grid-cols-1 lg:items-center">
          <div className="space-y-7 w-full">
            <div className="inline-flex items-center rounded-full border border-[#E8DFFB] bg-white/80 px-3.5 py-2 text-sm font-medium text-[#7F63C7] shadow-[0_10px_30px_-18px_rgba(95,100,112,0.3)]">
              Gayatri Traders Admin Portal
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-[#2F3340] sm:text-5xl lg:text-6xl">
                A calm, premium gateway to your trading workspace.
              </h1>
              <p className="text-lg leading-8 text-[#5F6470]">
                Secure access, thoughtful approvals, and a refined experience designed for modern teams who value elegance as much as efficiency.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="rounded-full bg-gradient-to-r from-[#C9B1F4] to-[#B79CED] px-6 py-3 font-semibold text-white shadow-[0_16px_40px_-18px_rgba(183,156,237,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(183,156,237,0.8)]">
                Sign in
              </Link>
              <Link href="/register" className="rounded-full border border-[#E8DFFB] bg-white/75 px-6 py-3 font-semibold text-[#4B5563] transition hover:bg-[#F7F0FB]">
                Create account
              </Link>
            </div>

          </div>

          {/* right-side decorative card removed to let hero content span full width */}
        </div>
      </div>
    </main>
  );
}
