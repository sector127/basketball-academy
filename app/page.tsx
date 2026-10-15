'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/DarkModeToggle';
import {
  Trophy,
  Shield,
  MapPin,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { PiCourtBasketballBold } from '@/components/icons/navIcons';

interface LandingFeature {
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
}

export default function LandingPage() {
  const t = useTranslations('Landing');

  const features: LandingFeature[] = [
    {
      icon: Shield,
      title: t('feature1Title'),
      desc: t('feature1Desc'),
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      icon: PiCourtBasketballBold,
      title: t('feature2Title'),
      desc: t('feature2Desc'),
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      icon: Trophy,
      title: t('feature3Title'),
      desc: t('feature3Desc'),
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      icon: MapPin,
      title: t('feature4Title'),
      desc: t('feature4Desc'),
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-600">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <Image
                src="/assets/images/logo.png"
                alt="BBA logo"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">{t('brand')}</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {t('branch')}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="font-semibold text-xs hidden sm:inline-flex">
              <Link href="/login">{t('staffLogin')}</Link>
            </Button>
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-sm">
              <Link href="/dashboard">
                {t('dashboard')} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-96 w-full max-w-7xl overflow-hidden blur-3xl opacity-20 dark:opacity-30">
            <div className="h-full w-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('heroBadge')}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
              {t('heroTitle1')}{' '}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t('heroDesc')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md">
                <Link href="/dashboard">
                  <PiCourtBasketballBold className="mr-2 h-5 w-5" /> {t('enterPortal')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
                <Link href="/login">
                  {t('coachPlayerSignIn')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container mx-auto px-4 sm:px-6 py-12 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('featuresHeading')}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('featuresSubheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/images/logo.png"
              alt="BBA Logo"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('footerBranch')}
            </span>
          </div>
          <p>&copy; {new Date().getFullYear()} {t('brand')}. {t('footerRights')}</p>
        </div>
      </footer>
    </div>
  );
}
