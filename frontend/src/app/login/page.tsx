'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Manrope } from 'next/font/google';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-login',
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@dentalflow.com', password: 'password123' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${manrope.variable} min-h-screen flex font-[family-name:var(--font-login)]`}>
      {/* Brand panel — solid navy, no gradient */}
      <aside className="relative hidden lg:flex lg:w-[46%] flex-col justify-between bg-[#1e3a5f] px-12 py-10 text-white overflow-hidden">
        {/* Quiet geometric accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-sm font-bold tracking-tight">
            DF
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">DentalFlow</p>
            <p className="text-xs text-white/55 tracking-wide">Practice management</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-5">
          <h1 className="text-[2.35rem] font-semibold leading-[1.15] tracking-tight">
            Run your practice from one calm workspace.
          </h1>
          <p className="text-[15px] leading-relaxed text-white/70">
            Appointments, patient recall, and daily schedules — organized for the way
            dental teams actually work.
          </p>
          <ul className="space-y-3 pt-2 text-sm text-white/80">
            {[
              'Patient board with live status updates',
              'Conflict-aware appointment booking',
              'Automatic recall and reminder emails',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#7dd3fc]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          DentalFlow Clinic · Demo environment
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 flex-col bg-[#f4f7fb]">
        <div className="flex items-center gap-2.5 px-6 py-5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f] text-xs font-bold text-white">
            DF
          </div>
          <span className="text-[15px] font-semibold text-[#1e3a5f]">DentalFlow</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0_1px_2px_rgba(15,42,82,0.04),0_8px_24px_rgba(15,42,82,0.06)]">
              <div className="mb-7">
                <h2 className="text-xl font-semibold tracking-tight text-[#0f172a]">
                  Sign in to your clinic
                </h2>
                <p className="mt-1.5 text-sm text-[#64748b]">
                  Enter your work email and password
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#334155] text-[13px]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@clinic.com"
                    className="h-10 rounded-lg border-[#dbe3ee] bg-[#fafbfc] focus-visible:bg-white"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[#334155] text-[13px]">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-10 rounded-lg border-[#dbe3ee] bg-[#fafbfc] focus-visible:bg-white"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="mt-1 h-10 w-full rounded-lg bg-[#1e3a5f] text-white hover:bg-[#16304f]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </div>

            <div className="mt-6 px-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#94a3b8] mb-2">
                Demo access
              </p>
              <div className="grid gap-1 text-[12px] text-[#64748b]">
                <p>
                  <span className="text-[#94a3b8]">Admin</span>
                  {' · '}
                  admin@dentalflow.com
                </p>
                <p>
                  <span className="text-[#94a3b8]">Front desk</span>
                  {' · '}
                  reception@dentalflow.com
                </p>
                <p>
                  <span className="text-[#94a3b8]">Dentist</span>
                  {' · '}
                  dentist@dentalflow.com
                </p>
                <p className="pt-1 text-[#94a3b8]">Password: password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
