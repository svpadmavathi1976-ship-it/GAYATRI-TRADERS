import { Activity, BadgeCheck, ReceiptText, Trash2 } from 'lucide-react';

const activities = [
  { title: 'Invoice Created', detail: 'New invoice saved to the database', time: 'Just now', icon: ReceiptText },
  { title: 'Invoice Printed', detail: 'INV-1019 printed successfully', time: '25 mins ago', icon: BadgeCheck },
  { title: 'Report Generated', detail: 'Monthly profitability report exported', time: '1 hour ago', icon: Activity },
  { title: 'Invoice Deleted', detail: 'Draft invoice removed from queue', time: '3 hours ago', icon: Trash2 },
];

export default function RecentActivity() {
  return (
    <div className="rounded-[24px] border border-[#E8DFFB] bg-white p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#2F3340]">Recent Activity</p>
        <p className="text-sm text-[#6D7280]">Recent updates from your workspace</p>
      </div>

      <div className="space-y-3">
        {activities.map(({ title, detail, time, icon: Icon }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl bg-[#FAF8F5] p-3">
            <div className="mt-0.5 rounded-2xl bg-[#F3ECFF] p-2 text-[#7F63C7]">
              <Icon size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2F3340]">{title}</p>
              <p className="text-sm text-[#6D7280]">{detail}</p>
            </div>
            <span className="text-xs text-[#A6AAB4]">{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
