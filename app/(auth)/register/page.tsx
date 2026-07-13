"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type FormValues = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverMessage, setServerMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerMessage('');
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    } else if (values.fullName.trim().length < 2) {
      nextErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!values.username.trim()) {
      nextErrors.username = 'Username is required.';
    } else if (values.username.trim().length < 3) {
      nextErrors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-z0-9_.-]+$/.test(values.username.trim().toLowerCase())) {
      nextErrors.username = 'Username can only contain lowercase letters, numbers, dots, dashes, and underscores.';
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim().toLowerCase())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required.';
    } else if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (values.password && values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors((current) => ({ ...current, ...(data.errors || {}) }));
        setServerMessage(data.message || 'Registration failed.');
        return;
      }

      setServerMessage(data.message || 'Registration successful.');
      setValues(initialValues);
      router.push(`/verify-otp?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
    } catch (error) {
      console.error('Registration request failed:', error);
      setServerMessage('Unable to complete registration right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[28px] border border-[#E8DFFB] bg-[#FCFCFD] p-7 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8DFFB] text-[#7F63C7] shadow-[0_12px_24px_-18px_rgba(127,99,199,0.5)]">
          <ShieldCheck size={24} />
        </div>
        <h2 className="font-serif text-3xl font-semibold text-[#2F3340]">Create your account</h2>
        <p className="text-sm text-[#6D7280]">Set up your secure access and join the Gayatri Traders workspace.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Full Name</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <UserRound className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type="text"
              placeholder="Enter your full name"
              value={values.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
          </div>
          {errors.fullName ? <p className="text-sm text-[#C2410C]">{errors.fullName}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Username</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <UserRound className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type="text"
              placeholder="Choose a unique username"
              value={values.username}
              onChange={(event) => handleChange('username', event.target.value)}
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
          </div>
          {errors.username ? <p className="text-sm text-[#C2410C]">{errors.username}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Email Address</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <Mail className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type="email"
              placeholder="name@company.com"
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
          </div>
          {errors.email ? <p className="text-sm text-[#C2410C]">{errors.email}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Password</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <Lock className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a secure password"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 text-[#8A7E93] transition hover:text-[#7F63C7]">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-[#C2410C]">{errors.password}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#4B5563]">Confirm Password</span>
          <div className="flex items-center rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] px-4 py-3 transition focus-within:border-[#B79CED] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(183,156,237,0.16)]">
            <Lock className="mr-3 h-4 w-4 text-[#B79CED]" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={values.confirmPassword}
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
              className="w-full bg-transparent text-sm text-[#2F3340] outline-none placeholder:text-[#A6AAB4]"
            />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="ml-2 text-[#8A7E93] transition hover:text-[#7F63C7]">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword ? <p className="text-sm text-[#C2410C]">{errors.confirmPassword}</p> : null}
        </label>

        {serverMessage ? (
          <p className={`text-sm ${serverMessage.includes('successful') ? 'text-emerald-600' : 'text-[#C2410C]'}`}>{serverMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#C9B1F4] to-[#B79CED] px-4 py-3 font-semibold text-white shadow-[0_16px_40px_-18px_rgba(183,156,237,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(183,156,237,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#6D7280]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#2F3340] transition hover:text-[#8B6AD3]">
          Sign in
        </Link>
      </div>
    </div>
  );
}
