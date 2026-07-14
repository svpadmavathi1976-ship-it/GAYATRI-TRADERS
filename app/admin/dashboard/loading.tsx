export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#E8DFFB] bg-white/80 p-6 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] backdrop-blur">
        <div className="h-20 animate-pulse rounded-2xl bg-[#F5ECFF]" />
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-[24px] border border-[#E8DFFB] bg-white" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="h-56 animate-pulse rounded-[24px] border border-[#E8DFFB] bg-white" />
        <div className="h-56 animate-pulse rounded-[24px] border border-[#E8DFFB] bg-white" />
      </div>
    </div>
  );
}
