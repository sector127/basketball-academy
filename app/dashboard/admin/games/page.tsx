'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import GameList from '@/components/GameList';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Trophy, Plus } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useIsAdmin } from '@/hooks/use-is-admin';

export default function GamesPage() {
  const t = useTranslations('Games');
  const isAdmin = useIsAdmin();

  return (
    <DashboardLayout>
      <PageHeader
        title={t('matchCenter')}
        subtitle={t('matchCenterSubtitle')}
        badge="2026 Season"
        icon={Trophy}
        actions={
          isAdmin && (
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
              <Link href="/dashboard/admin/games/create">
                <Plus className="mr-1.5 h-4 w-4" /> {t('scheduleGame')}
              </Link>
            </Button>
          )
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <GameList />
      </div>
    </DashboardLayout>
  );
}
