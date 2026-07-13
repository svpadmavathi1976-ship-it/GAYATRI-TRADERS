const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const values = [42, 58, 53, 69, 74, 83];

export default function RevenueChart() {
  return (
    <div className="rounded-[24px] border border-[#E8DFFB] bg-white p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2F3340]">Monthly Revenue</p>
          <p className="text-sm text-[#6D7280]">Last 6 months</p>
        </div>
        <span className="rounded-full bg-[#F3ECFF] px-3 py-1 text-xs font-semibold text-[#8B6AD3]">Stable</span>
      </div>

      <div className="flex h-48 items-end justify-between gap-3">
        {values.map((value, index) => (
          <div key={months[index]} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end rounded-[16px] bg-[#F7F2EB] p-1.5">
              <div
                className="w-full rounded-[12px] bg-gradient-to-t from-[#B79CED] to-[#C9B1F4]"
                style={{ height: `${value}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#7D8290]">{months[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
