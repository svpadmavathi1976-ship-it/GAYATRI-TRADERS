'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ChevronLeft, ChevronRight, FileText, LayoutGrid, LogOut, Settings, ShieldCheck } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { name: 'Invoices', href: '/admin/invoices', icon: FileText },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Logout', href: '/api/auth/logout', icon: LogOut },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen border-r border-[#E9E0F7] bg-[#FCFCFD]/90 px-4 py-5 shadow-[14px_0_45px_-26px_rgba(95,100,112,0.2)] backdrop-blur lg:flex lg:flex-col ${
        collapsed ? 'w-24' : 'w-72'
      } transition-all duration-300`}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9B1F4] to-[#B79CED] text-white shadow-[0_15px_30px_-14px_rgba(183,156,237,0.7)]">
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2F3340]">Gayatri Traders</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-[#E8DFFB] bg-[#FAF8F5] p-2 text-[#7F63C7] transition hover:bg-[#F3ECFF]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="space-y-2">
        {menuItems.map(({ name, href, icon: Icon }) => {
          const isLogout = name === 'Logout';
          const isActive = href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#E8DFFB] to-[#F5ECFF] text-[#7F63C7] shadow-[0_12px_24px_-18px_rgba(127,99,199,0.4)]'
                  : 'text-[#4B5563] hover:bg-[#F6F3EE] hover:text-[#2F3340]'
              } ${isLogout ? 'mt-6 border-t border-[#EFE8FB] pt-5' : ''}`}
            >
              <Icon size={18} />
              {!collapsed && <span>{name}</span>}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
