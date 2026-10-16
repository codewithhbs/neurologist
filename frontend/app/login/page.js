'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiPhone, FiUser, FiArrowRight, FiAlertCircle, FiCheck,
  FiShield, FiClock, FiAward, FiActivity,
} from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';
import apiClient, { setPatientToken } from '@/lib/apiClient';

/* ---------------- OTP boxes ---------------- */
function OtpInput({ value, onChange, onComplete, disabled }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const setAt = (i, char) => {
    const next = (value.padEnd(6, ' ').split('').map((c, idx) => (idx === i ? char : c)).join(''))
      .replace(/\s/g, ' ')
      .trimEnd();
    const clean = next.split('').map((c) => (c === ' ' ? '' : c)).join('');
    onChange(clean);
    return clean;
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAt(i, ' ');
      return;
    }
    if (raw.length > 1) {
      const merged = (value.slice(0, i) + raw).slice(0, 6);
      onChange(merged);
      const focusIdx = Math.min(merged.length, 5);
      refs.current[focusIdx]?.focus();
      if (merged.length === 6) onComplete?.(merged);
      return;
    }
    const merged = setAt(i, raw);
    if (i < 5) refs.current[i + 1]?.focus();
    if (merged.length === 6 && !merged.includes(' ')) onComplete?.(merged);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) onComplete?.(pasted);
  };

  return (
    <div className="flex gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-900
                     outline-none transition focus:border-[#0D5CA8] focus:bg-white focus:ring-4 focus:ring-[#0D5CA8]/10
                     disabled:opacity-50"
        />
      ))}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState('mobile'); // mobile | otp | done
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async (resend = false) => {
    setErr('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setErr('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/send-otp', { mobile });
      if (!resend) setOtp('');
      setStep('otp');
      setCooldown(30);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  const verify = async (code) => {
    const value = typeof code === 'string' ? code : otp;
    setErr('');
    if (value.length !== 6) {
      setErr('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        mobile,
        otp: value,
        name: name.trim(),
      });
      setPatientToken(res.data.token);
      setStep('done');
      setTimeout(() => router.push('/profile'), 700);
    } catch (e) {
      setErr(e.response?.data?.message || 'Invalid or expired OTP');
      setOtp('');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const editNumber = () => {
    setStep('mobile');
    setOtp('');
    setErr('');
    setCooldown(0);
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- LEFT : brand panel ---------- */}
      <aside className="relative hidden overflow-hidden p-12 xl:p-16 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0D5CA8] via-[#11417E] to-[#0A2850]"
          aria-hidden
        />
        {/* soft blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#08A599]/40 blur-3xl" aria-hidden />
        {/* dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
          aria-hidden
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/95 text-xl text-[#11417E] shadow-lg">
            <FaBrain />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Neurocare Clinic</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-[2.75rem]">
            Healthy mind,
            <br />
            <span className="text-white/70">booked in seconds.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/75">
            Sign in with your mobile number to book appointments, view treatment plans and access
            your reports — anytime.
          </p>

          <ul className="mt-10 space-y-5">
            {[
              { icon: FiClock, t: 'Instant appointments', d: 'Pick a slot with Dr Neeraj Kumar' },
              { icon: FiActivity, t: 'Your records, one place', d: 'Prescriptions, reports and treatment history' },
              { icon: FiShield, t: 'Private & secure', d: 'OTP verified access, encrypted end to end' },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-white ring-1 ring-white/20">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{t}</span>
                  <span className="block text-[13px] text-white/60">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/80">
          <div className="flex items-center gap-2">
            <FiAward size={16} className="text-white" />
            <span className="text-xs">Senior Consultant Neurologist</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-xs">24+ years of experience</span>
        </div>
      </aside>

      {/* ---------- RIGHT : form ---------- */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#11417E] to-[#08A599] text-xl text-white shadow-lg shadow-[#11417E]/25">
              <FaBrain />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Neurocare Clinic
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/[0.06] sm:p-8">
            {step === 'done' ? (
              <div className="py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#0D5CA8]/10 text-[#0D5CA8]">
                  <FiCheck size={26} />
                </div>
                <h1 className="mt-5 text-xl font-bold text-slate-900">You&apos;re in!</h1>
                <p className="mt-1 text-sm text-slate-500">Taking you to your profile…</p>
              </div>
            ) : (
              <>
                {/* step pills */}
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-1.5 flex-1 rounded-full bg-[#0D5CA8] transition" />
                  <span className={`h-1.5 flex-1 rounded-full transition ${step === 'otp' ? 'bg-[#0D5CA8]' : 'bg-slate-200'}`} />
                </div>

                <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
                  {step === 'mobile' ? 'Sign in or create account' : 'Verify your number'}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {step === 'mobile'
                    ? 'We\u2019ll send a one-time password to your mobile. No password needed.'
                    : 'Enter the 6-digit code we just sent you.'}
                </p>

                {err && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-[13px] text-red-600"
                  >
                    <FiAlertCircle size={15} className="mt-px shrink-0" />
                    <span>{err}</span>
                  </div>
                )}

                {step === 'mobile' ? (
                  <div className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="mobile" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                        Mobile number
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-[#0D5CA8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0D5CA8]/10">
                        <FiPhone size={16} className="shrink-0 text-slate-400" />
                        <span className="border-r border-slate-200 pr-2.5 text-sm font-medium text-slate-600">
                          +91
                        </span>
                        <input
                          id="mobile"
                          type="tel"
                          autoComplete="tel"
                          autoFocus
                          placeholder="98765 43210"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                          className="w-full bg-transparent py-3 text-[15px] tracking-wide text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => sendOtp()}
                      disabled={loading || mobile.length !== 10}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D5CA8] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0D5CA8]/25 transition hover:bg-[#11417E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <Spinner /> Sending OTP…
                        </>
                      ) : (
                        <>
                          Continue <FiArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[12px] leading-relaxed text-slate-500">
                      <FiShield size={22} className="shrink-0 text-[#0D5CA8]" />
                      <span>
                        New here? Just enter your number — your account is created automatically after
                        verification.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px]">
                      <span className="text-slate-500">
                        Sent to <span className="font-semibold text-slate-800">+91 {mobile}</span>
                      </span>
                      <button
                        onClick={editNumber}
                        className="font-semibold text-[#0D5CA8] transition hover:text-[#11417E]"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="mb-2 block text-[13px] font-medium text-slate-700">
                        One-time password
                      </label>
                      <OtpInput value={otp} onChange={setOtp} onComplete={verify} disabled={loading} />
                    </div>

                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                        Your name{' '}
                        <span className="font-normal text-slate-400">(new patients only)</span>
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-[#0D5CA8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0D5CA8]/10">
                        <FiUser size={16} className="shrink-0 text-slate-400" />
                        <input
                          id="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && verify()}
                          className="w-full bg-transparent py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => verify()}
                      disabled={loading || otp.length !== 6}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D5CA8] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0D5CA8]/25 transition hover:bg-[#11417E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <Spinner /> Verifying…
                        </>
                      ) : (
                        <>
                          Verify &amp; continue <FiArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[13px] text-slate-500">
                      Didn&apos;t get the code?{' '}
                      {cooldown > 0 ? (
                        <span className="font-medium text-slate-400">Resend in {cooldown}s</span>
                      ) : (
                        <button
                          onClick={() => sendOtp(true)}
                          disabled={loading}
                          className="font-semibold text-[#0D5CA8] transition hover:text-[#11417E]"
                        >
                          Resend OTP
                        </button>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-center text-[12px] leading-relaxed text-slate-400">
            By continuing you agree to our{' '}
            <a href="/terms" className="text-slate-600 underline underline-offset-2 hover:text-[#0D5CA8]">
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-slate-600 underline underline-offset-2 hover:text-[#0D5CA8]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}