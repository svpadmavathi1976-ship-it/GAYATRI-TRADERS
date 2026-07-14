'use client';

import { useEffect, useState } from 'react';

export default function DashboardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 text-sm text-[#6D7280]">
      <p className="font-semibold text-[#2F3340]">Today</p>
      <p>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p className="mt-1">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
    </div>
  );
}
