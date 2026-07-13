"use client";

import Link from 'next/link';
import { Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md rounded-[28px] border border-[#E8DFFB] bg-[#FCFCFD] p-7 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8DFFB] text-[#7F63C7] shadow-[0_12px_24px_-18px_rgba(127,99,199,0.5)]">
          <ShieldCheck size={24} />
        </div>
        <h2 className="font-serif text-3xl font-semibold text-[#2F3340]">Reset your password</h2>
        <p className="text-sm text-[#6D7280]">Enter your email address and we&apos;ll send an OTP to help you recover access.</p>
      </div>

      <form className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Email Address</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <Mail className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
          </div>
        </label>

        <button className="w-full rounded-2xl bg-gradient-to-r from-[#C9B1F4] to-[#B79CED] px-4 py-3 font-semibold text-white shadow-[0_16px_40px_-18px_rgba(183,156,237,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(183,156,237,0.8)]">
          Send OTP
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#6D7280]">
        Remembered your password?{' '}
        <Link href="/login" className="font-semibold text-[#2F3340] transition hover:text-[#8B6AD3]">
          Back to login
        </Link>
      </div>
    </div>
  );
}
