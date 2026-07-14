"use client";

import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        identifier,
        password,
        remember,
        callbackUrl: '/admin/dashboard',
      } as any);

      if (!result || result.error || result.ok === false) {
        toast.error(result?.error || 'Unable to sign in. Please try again.');
        setLoading(false);
        return;
      }

      try {
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'auth',
            title: 'Admin Login',
            description: 'The admin signed in successfully.',
          }),
        });
      } catch (error) {
        console.error('Failed to log login activity:', error);
      }
      toast.success('Signed in successfully');
      const redirectTo = result.url ?? '/admin/dashboard';
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[28px] border border-[#E8DFFB] bg-[#FCFCFD] p-7 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8DFFB] text-[#7F63C7] shadow-[0_12px_24px_-18px_rgba(127,99,199,0.5)]">
          <ShieldCheck size={24} />
        </div>
        <h2 className="font-serif text-3xl font-semibold text-[#2F3340]">Welcome back!</h2>
        <p className="text-sm text-[#6D7280]">Sign in to continue to the Gayatri Traders admin workspace.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Username or Email</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <Mail className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Password</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <Lock className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="ml-2 text-[#8A7E93] transition hover:text-[#7F63C7]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-[#6D7280]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-[#D8D0C7] bg-white accent-[#B79CED]"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-[#8B6AD3] transition hover:text-[#6D4FC7]">
            Forgot password?
          </Link>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#C9B1F4] to-[#B79CED] px-4 py-3 font-semibold text-white shadow-[0_16px_40px_-18px_rgba(183,156,237,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(183,156,237,0.8)]"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#6D7280]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[#2F3340] transition hover:text-[#8B6AD3]">
          Create one
        </Link>
      </div>
    </div>
  );
}
