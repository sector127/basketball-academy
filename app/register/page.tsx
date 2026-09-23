'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  LuEyeOff,
  LuLock,
  LuMail,
  LuUser,
  LuEye,
  LuCheckCircle,
  LuXCircle,
  LuArrowLeft,
} from 'react-icons/lu';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const currentPassword = watch('password') || '';

  const passwordCriteria = [
    { label: 'At least 8 characters', met: currentPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(currentPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(currentPassword) },
    { label: 'Contains a number', met: /[0-9]/.test(currentPassword) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(currentPassword) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    // Simulated registration
    setTimeout(() => {
      setIsLoading(false);
      setRegisteredSuccess(true);
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-10 relative overflow-hidden">
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
                Brooklyn Basketball Academy
              </h2>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
          {!registeredSuccess ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Create Staff Account
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Register as an academy coach or staff member
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="e.g. Nikoloz Mskhalaia"
                      className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="e.g. coach@bba.ge"
                      className="pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Create a strong password"
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
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <LuLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Repeat password"
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

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    {...register('terms')}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <Label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                    I agree to the Academy Terms & Code of Conduct
                  </Label>
                </div>
                {errors.terms && <p className="text-xs text-rose-500">{errors.terms.message}</p>}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md text-sm"
                >
                  {isLoading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <LuArrowLeft className="h-3.5 w-3.5" /> Already registered? Sign in
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                <LuCheckCircle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Registration Complete
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Your academy staff profile has been created successfully.
              </p>

              <Button asChild className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                <Link href="/login">
                  Proceed to Sign In
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
