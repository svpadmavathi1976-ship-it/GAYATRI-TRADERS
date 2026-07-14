'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, FileText, LogIn, ReceiptText, Sparkles } from 'lucide-react';

interface ActivityItem {
  id: string;
  category: string;
  title: string;
  description: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const iconMap: Record<string, typeof Activity> = {
  invoice: FileText,
  report: ReceiptText,
  auth: LogIn,
  backup: Database,
};

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function RecentActivity({ activities: initialActivities }: RecentActivityProps) {
  const [activities, setActivities] = useState(initialActivities);

  useEffect(() => {
    let isMounted = true;

    const syncActivities = async () => {
      try {
        const response = await fetch('/api/admin/activity');
        const payload = await response.json();

        if (response.ok && payload.success && isMounted) {
          setActivities(payload.activities || []);
        }
      } catch (error) {
        console.error('Failed to refresh recent activity:', error);
      }
    };

    void syncActivities();
    const timer = window.setInterval(() => {
      void syncActivities();
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const hasActivities = activities.length > 0;

  return (
    <div className="w-full rounded-[24px] border border-[#E8DFFB] bg-white p-5 shadow-[0_18px_45px_-24px_rgba(95,100,112,0.26)] transition hover:-translate-y-0.5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B6AD3]">Recent Activity</p>
          <p className="mt-2 text-sm text-[#6D7280]">Latest system actions across invoices, reports, auth, and backups</p>
        </div>
      </div>

      {hasActivities ? (
        <div className="max-h-[480px] space-y-3 overflow-y-auto pr-2">
          {activities.map((activity: ActivityItem) => {
            const Icon = iconMap[activity.category] ?? Sparkles;
            const accentClass = activity.category === 'auth' ? 'bg-[#F3ECFF]' : activity.category === 'backup' ? 'bg-[#EAF8F1]' : 'bg-[#F8F4FF]';

            return (
              <div key={activity.id} className="rounded-2xl border border-[#F0E8FB] bg-[#FCFBFF] p-4 transition hover:border-[#D8C7F7] hover:bg-[#FAF8FF]">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-2xl p-2 text-[#7F63C7] ${accentClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#2F3340]">{activity.title}</p>
                      <span className="text-xs font-medium text-[#8B6AD3]">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#6D7280]">{activity.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF]">
                      <span>{formatDateTime(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-[#D9C9F6] bg-[#FAF8F5] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3ECFF] text-[#7F63C7]">
            <Activity size={20} />
          </div>
          <p className="mt-4 text-base font-semibold text-[#2F3340]">No recent activity available.</p>
          <p className="mt-2 text-sm leading-7 text-[#6D7280]">Activities will appear here as you use the system.</p>
        </div>
      )}
    </div>
  );
}
