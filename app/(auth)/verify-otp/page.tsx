"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { Suspense, type FormEvent, useEffect, useRef, useState } from 'react';

const OTP_LENGTH = 6;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email')?.trim().toLowerCase() ?? '';

  const [email, setEmail] = useState(emailParam);
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [serverError, setServerError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setEmail(emailParam);
  }, [emailParam]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextValues = [...otpValues];
    nextValues[index] = digit;
    setOtpValues(nextValues);
    setServerError('');
    setServerMessage('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      const nextValues = [...otpValues];
      nextValues[index - 1] = '';
      setOtpValues(nextValues);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const nextValues = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((digit, index) => {
      nextValues[index] = digit;
    });

    setOtpValues(nextValues);
    setServerError('');
    setServerMessage('');

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const otp = otpValues.join('');

    if (!email) {
      setServerError('Email address is required.');
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setServerError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setServerError('');
    setServerMessage('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Verification failed.');
        return;
      }

      setServerMessage(data.message || 'Account verified successfully.');
      setOtpValues(Array(OTP_LENGTH).fill(''));
      window.setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (error) {
      console.error('OTP verification failed:', error);
      setServerError('Unable to verify your OTP right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setServerError('Email address is required.');
      return;
    }

    setIsResending(true);
    setServerError('');
    setServerMessage('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || 'Unable to resend OTP.');
        return;
      }

      setServerMessage(data.message || 'A fresh OTP has been sent.');
      setOtpValues(Array(OTP_LENGTH).fill(''));
    } catch (error) {
      console.error('Resend OTP failed:', error);
      setServerError('Unable to resend OTP right now.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[28px] border border-[#E8DFFB] bg-[#FCFCFD] p-7 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8DFFB] text-[#7F63C7] shadow-[0_12px_24px_-18px_rgba(127,99,199,0.5)]">
          <ShieldCheck size={24} />
        </div>
        <h2 className="font-serif text-3xl font-semibold text-[#2F3340]">Verify your account</h2>
        <p className="text-sm text-[#6D7280]">Enter the 6-digit code we sent to {email || 'your email'}.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={value}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              className="h-12 w-11 rounded-2xl border border-[#E8DFFB] bg-[#FAF8F5] text-center text-lg font-semibold text-[#2F3340] outline-none transition focus:border-[#B79CED] focus:bg-white focus:shadow-[0_0_0_4px_rgba(183,156,237,0.16)] sm:h-14 sm:w-12"
            />
          ))}
        </div>

        {serverError ? <p className="text-center text-sm text-[#C2410C]">{serverError}</p> : null}
        {serverMessage ? <p className="text-center text-sm text-emerald-600">{serverMessage}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#C9B1F4] to-[#B79CED] px-4 py-3 font-semibold text-white shadow-[0_16px_40px_-18px_rgba(183,156,237,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(183,156,237,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8DFFB] bg-white px-4 py-2.5 text-sm font-semibold text-[#6D7280] transition hover:border-[#B79CED] hover:text-[#7F63C7] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw size={16} />
          {isResending ? 'Sending...' : 'Resend OTP'}
        </button>

        <Link href="/register" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#2F3340] transition hover:text-[#8B6AD3]">
          <ArrowLeft size={16} />
          Back to register
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-[28px] border border-[#E8DFFB] bg-[#FCFCFD] p-7 shadow-[0_25px_60px_-24px_rgba(95,100,112,0.24)] sm:p-8">
          <p className="text-center text-sm text-[#6D7280]">Loading verification form...</p>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
