'use client';

import { Bell, Upload } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  userName: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          aria-label="View notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] shadow-sm transition hover:border-[#D1D5DB] hover:bg-[#F9FAFB] hover:text-[#111827]"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-3 rounded-full border border-[#E5E7EB] bg-white px-2 py-1.5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C9B1F4] to-[#B79CED] text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden pr-1 text-left sm:block">
              <p className="text-sm font-semibold text-[#2F3340]">{userName}</p>
              <p className="text-xs text-[#7D8290]">Super Admin</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4B5563] transition hover:bg-[#F8F4FF]">
                <Upload size={15} className="text-[#8B6AD3]" />
                Upload profile
                <input type="file" className="sr-only" />
              </label>
              <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#4B5563] transition hover:bg-[#F8F4FF]">
                Profile
              </button>
              <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#4B5563] transition hover:bg-[#F8F4FF]">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
