'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/DarkModeToggle';
import { getSafeCallbackUrl } from '@/lib/safeRedirect';

export default function SignIn() {
  const t = useTranslations('Login');
  const tLanding = useTranslations('Landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'), window.location.origin);

      const result = await signIn('credentials', {
        email,
        password,
        redirectTo: callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setLoading(false);
        if (result?.code === 'pending_approval') {
          setError(t('pendingApproval'));
        } else if (result?.status === 500 || result?.error === 'Configuration') {
          setError('Database connection error. Please check that MongoDB is running.');
        } else {
          setError('Invalid email or password.');
        }
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err: unknown) {
      setLoading(false);
      setError('An error occurred during sign in.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Top Controls */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl" />
      <motion.div
        className="w-full max-w-md flex flex-col gap-6 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="group flex flex-col items-center gap-2 mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/assets/images/logo.png"
                alt="BBA logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {tLanding('brand')}
              </h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t('portalBadge')}
              </span>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('welcomeBack')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <motion.div
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('password')}
                </Label>
                <Link
                  href="/resetPassword"
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  required
                  className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md text-sm"
            >
              {loading ? t('authenticating') : t('signIn')}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('noAccount')}{' '}
            <Link href="/register" className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400">
              {t('requestAccess')}
            </Link>
          </div>

          {/* Demo credentials for local development only (stripped from production builds) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-400 font-medium">{t('demoStaffAccounts')}</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@bba.ge');
                    setPassword('admin123');
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 px-2 py-0.5 rounded transition-colors"
                >
                  admin@bba.ge
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('nika@bba.ge');
                    setPassword('password123');
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 px-2 py-0.5 rounded transition-colors"
                >
                  nika@bba.ge
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
