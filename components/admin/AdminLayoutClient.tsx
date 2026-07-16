'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/admin/Navbar';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  displayName: string;
  profilePicture?: string | null;
}

export default function AdminLayoutClient({ children, displayName, profilePicture }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(183,156,237,0.16),_transparent_32%),linear-gradient(135deg,_#faf8f5_0%,_#f7f2eb_48%,_#fcfcfd_100%)]">
      <>
  {/* Mobile Overlay */}
  {mobileSidebarOpen && (
    <div
      className="fixed inset-0 z-40 bg-black/40 lg:hidden"
      onClick={() => setMobileSidebarOpen(false)}
    />
  )}

  {/* Desktop Sidebar */}
 <div
  className={`fixed left-0 top-0 z-30 hidden lg:block ${
    collapsed ? "w-24" : "w-64"
  }`}
>
  <Sidebar
    collapsed={collapsed}
    onToggle={() => setCollapsed((value) => !value)}
  />
</div>

  {/* Mobile Sidebar */}
  <div
    className={`fixed left-0 top-0 z-50 transition-transform duration-300 lg:hidden ${
      mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <Sidebar
  collapsed={false}
  onToggle={() => setMobileSidebarOpen(false)}
  onNavigate={() => setMobileSidebarOpen(false)}
/>
  </div>
</>
      <div className={`min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
      <Navbar
  userName={displayName}
  profilePicture={profilePicture}
  onMenuClick={() => setMobileSidebarOpen(true)}
/>
        <main className="p-4 pt-3 sm:p-6 sm:pt-4 lg:p-8 lg:pt-5">{children}</main>
      </div>
    </div>
  );
}
