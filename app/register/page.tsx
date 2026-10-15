'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  Lock as LuLock,
  Mail as LuMail,
  User as LuUser,
  Eye as LuEye,
  EyeOff as LuEyeOff,
  CheckCircle as LuCheckCircle,
  XCircle as LuXCircle,
  ArrowLeft as LuArrowLeft,
} from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/DarkModeToggle';

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(50, 'Name must be less than 50 characters'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(50, 'Name must be less than 50 characters'),
    role: z.enum(['guardian', 'player', 'staff']),
    note: z.string().max(500, 'Keep the note under 500 characters').optional(),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const t = useTranslations('Register');
  const tLanding = useTranslations('Landing');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { role: 'guardian' },
  });

  const currentPassword = watch('password') || '';

  const passwordCriteria = [
    { label: 'At least 8 characters', met: currentPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(currentPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(currentPassword) },
    { label: 'Contains a number', met: /[0-9]/.test(currentPassword) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(currentPassword) },
  ];

  // Creates an account that an admin must approve before it can sign in
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: data.role,
          note: data.note || '',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t('requestFailed'));
      }
      setRegisteredSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('requestFailed'));
    } finally {
      setIsLoading(false);
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
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {tLanding('brand')}
              </h2>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
          {!registeredSuccess ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {t('subtitle')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('title')}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('accountType')}
                  </Label>
                  <select
                    id="role"
                    {...register('role')}
                    className="h-10 w-full rounded-md border border-input bg-slate-50 px-3 text-sm dark:bg-slate-800/60"
                  >
                    <option value="guardian">{t('accountTypeGuardian')}</option>
                    <option value="player">{t('accountTypePlayer')}</option>
                    <option value="staff">{t('accountTypeStaff')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('firstName')}
                    </Label>
                    <div className="relative">
                      <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        autoComplete="given-name"
                        {...register('name')}
                        placeholder={t('firstNamePlaceholder')}
                        className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('lastName')}
                    </Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      {...register('lastName')}
                      placeholder={t('lastNamePlaceholder')}
                      className="h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                    {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('email')}
                  </Label>
                  <div className="relative">
                    <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder={t('emailPlaceholder')}
                      className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('password')}
                  </Label>
                  <div className="relative">
                    <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder={t('passwordPlaceholder')}
                      className="pl-9 pr-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('confirmPassword')}
                  </Label>
                  <div className="relative">
                    <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder={t('confirmPasswordPlaceholder')}
                      className="pl-9 pr-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Password Criteria Checklist */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1.5 text-[11px]">
                  {passwordCriteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {c.met ? (
                        <LuCheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <LuXCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className={c.met ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('note')}
                  </Label>
                  <textarea
                    id="note"
                    rows={2}
                    {...register('note')}
                    placeholder={t('notePlaceholder')}
                    className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                  />
                  {errors.note && <p className="text-xs text-rose-500">{errors.note.message}</p>}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    {...register('terms')}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <Label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                    {t('terms')}
                  </Label>
                </div>
                {errors.terms && <p className="text-xs text-rose-500">{errors.terms.message}</p>}

                {submitError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md text-sm"
                >
                  {isLoading ? t('creatingAccount') : t('createAccount')}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <LuArrowLeft className="h-3.5 w-3.5" /> {t('alreadyHaveAccount')} {t('signIn')}
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                <LuCheckCircle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('successTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t('successMessage')}
              </p>
              <Button asChild className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                <Link href="/login">
                  {t('signIn')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
