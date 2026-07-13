const points = [40, 72, 58, 86, 74, 96, 110];

export default function SalesChart() {
  const width = 320;
  const height = 180;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const stepX = width / (points.length - 1);

  const svgPoints = points
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / (max - min || 1)) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-[24px] border border-[#E8DFFB] bg-white p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2F3340]">Sales Overview</p>
          <p className="text-sm text-[#6D7280]">Weekly invoice momentum</p>
        </div>
        <span className="rounded-full bg-[#F3ECFF] px-3 py-1 text-xs font-semibold text-[#8B6AD3]">+18.2%</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
        <path d={`M 0 ${height} L ${svgPoints.split(' ').join(' L ')} L ${width} ${height} Z`} fill="rgba(183, 156, 237, 0.15)" />
        <polyline
          points={svgPoints}
          fill="none"
          stroke="#7F63C7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((value, index) => {
          const x = index * stepX;
          const y = height - ((value - min) / (max - min || 1)) * (height - 20) - 10;
          return <circle key={index} cx={x} cy={y} r="4.5" fill="#FFFFFF" stroke="#7F63C7" strokeWidth="2" />;
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-[#7D8290]">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
}
