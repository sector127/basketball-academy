'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { columns } from '@/app/dashboard/coach/players/columns';
import { DataTable } from '@/components/DataTable';
import Loader from '@/components/Loader';
import useSWR, { mutate } from 'swr';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

const fetcher = (url) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function CoachPlayersPage() {
  const t = useTranslations('Players');
  const [context] = React.useState('players');
  const { data: response, error, isLoading } = useSWR('/api/coach/players', fetcher);

  const handleDataChange = async () => {
    await mutate('/api/coach/players');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title={t('directoryTitle')} subtitle={t('loadingPlayers')} />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Squad Players" subtitle="Error loading players" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  const players = response?.data && Array.isArray(response.data) ? response.data : [];

  return (
    <DashboardLayout>
      <PageHeader
        title={t('directoryTitle')}
        subtitle={t('directorySubtitle')}
        badge={t('activePlayersCount', { count: players.length })}
        icon={Users}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <DataTable
          columns={columns(handleDataChange, context)}
          data={players}
          onDataChange={handleDataChange}
          context="players"
        />
      </div>
    </DashboardLayout>
  );
}
