'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/DarkModeToggle';

interface SetNewPasswordFormProps {
  token: string;
}

// Second step: the user opened the emailed link (?token=...) and picks a new password
function SetNewPasswordForm({ token }: SetNewPasswordFormProps) {
  const t = useTranslations('ResetPassword');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t('passwordsDontMatch'));
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || t('requestFailed'));
      setIsDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isDone) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('passwordChanged')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('passwordChangedDesc')}</p>
        <Button asChild className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs">
          <Link href="/login">{t('backToSignIn')}</Link>
        </Button>
      </div>
    );
  }

  const fields: Array<{ id: string; label: string; value: string; setter: (val: string) => void }> = [
    { id: 'new-password', label: t('newPassword'), value: password, setter: setPassword },
    { id: 'confirm-password', label: t('confirmPassword'), value: confirm, setter: setConfirm },
  ];

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('newPasswordTitle')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('newPasswordSubtitle')}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ id, label, value, setter }) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id={id}
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
              />
            </div>
          </div>
        ))}
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{error}</p>
        )}
        <Button
          type="submit"
          disabled={isSaving}
          className="w-full h-10 mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md text-sm"
        >
          {isSaving ? t('sending') : t('setNewPassword')}
        </Button>
      </form>
    </>
  );
}

function ResetPasswordPage() {
  const t = useTranslations('ResetPassword');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    setError('');
    try {
      const res = await fetch('/api/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(body.error || t('requestFailed'));
      }
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Top Controls */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl" />
      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="group flex flex-col items-center gap-2 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
              <Image
                src="/assets/images/logo.png"
                alt="BBA logo"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
          {token ? (
            <SetNewPasswordForm token={token} />
          ) : !isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {t('title')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('subtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      required
                      className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full h-10 mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md text-sm"
                >
                  {isSending ? t('sending') : t('sendLink')}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {t('backToSignIn')}
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('checkInbox')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                {t('checkInboxDesc')}
              </p>

              <Button asChild className="w-full mt-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs">
                <Link href="/login">
                  {t('backToSignIn')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary
export default function ResetPasswordRoute() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
