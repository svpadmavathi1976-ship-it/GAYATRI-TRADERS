'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { name: 'Invoices', href: '/admin/invoices', icon: FileText },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen border-r border-[#E9E0F7] bg-white shadow-xl lg:flex lg:flex-col transition-all duration-300 ${
        collapsed ? 'w-24' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="border-b border-[#EFE8FB] px-5 py-6">
        <div className="flex items-start justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9B1F4] to-[#9F7AEA] text-white shadow-lg">
              <ShieldCheck size={22} />
            </div>

            {!collapsed && (
              <div>
                <h2 className="text-base font-bold text-[#2F3340]">
                  Gayatri Traders
                </h2>

                <p className="text-xs text-[#8B8B99]">
                  Rice Trading & Invoice System
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={onToggle}
              className="rounded-xl p-2 text-[#7F63C7] hover:bg-[#F6F1FF]"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {collapsed && (
            <button
              onClick={onToggle}
              className="rounded-xl p-2 text-[#7F63C7] hover:bg-[#F6F1FF]"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6">

        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A48BCF]">
          {!collapsed && 'Navigation'}
        </p>

        <nav className="space-y-2">

          {menuItems.map(({ name, href, icon: Icon }) => {

            const isActive =
              href === '/admin/dashboard'
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <Link
                key={name}
                href={href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'border-l-4 border-[#8B6AD3] bg-gradient-to-r from-[#EEE6FF] to-[#F8F4FF] text-[#6F4BC3] shadow-md'
                    : 'text-[#505867] hover:bg-[#F8F4FF] hover:text-[#6F4BC3]'
                }`}
              >
                <Icon
                  size={19}
                  className={`${
                    isActive
                      ? 'text-[#7F63C7]'
                      : 'text-[#8C94A6] group-hover:text-[#7F63C7]'
                  }`}
                />

                {!collapsed && (
                  <span className="font-medium">
                    {name}
                  </span>
                )}
              </Link>
            );
          })}

        </nav>

      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[#EFE8FB] px-5 py-5">
          <div className="rounded-2xl bg-gradient-to-r from-[#F8F4FF] to-[#FFFFFF] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A48BCF]">
              System
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>

              <span className="text-sm font-semibold text-[#2F3340]">
                Online
              </span>
            </div>

            <p className="mt-3 text-xs text-[#7D8290]">
              Version 1.0.0
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}