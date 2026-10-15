'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getRoleHome(role?: string | null): string {
  const r = role?.toLowerCase();
  if (r === 'coach' || r === 'player' || r === 'guardian') return `/dashboard/${r}`;
  return '/dashboard';
}

export default function UnauthorizedPage() {
  const t = useTranslations('Unauthorized');
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10">
          <ShieldAlert className="h-6 w-6 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('title')}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('description')}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
            <Link href={getRoleHome(session?.user?.role)}>{t('backToDashboard')}</Link>
          </Button>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
            {t('signInDifferent')}
          </Button>
        </div>
      </div>
    </div>
  );
}
