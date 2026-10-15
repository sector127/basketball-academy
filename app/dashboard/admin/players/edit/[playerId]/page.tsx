'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import PlayerForm from '@/components/PlayerForm';
import Loader from '@/components/Loader';
import { Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export default function EditPlayerPage() {
  const t = useTranslations('Players');
  const params = useParams();
  const playerId = params?.playerId as string;

  const { data: player, error, isLoading } = useSWR(
    playerId ? `/api/admin/players/${playerId}` : null,
    fetcher
  );

  return (
    <DashboardLayout>
      <PageHeader
        title={t('editPlayer')}
        subtitle={t('editSubtitle')}
        badge={t.has('roster') ? t('roster') : 'Roster'}
        icon={Edit2}
      />
      <div className="max-w-4xl mx-auto py-2">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader />
          </div>
        ) : error || !player ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              {error ? 'Failed to load player details' : 'Player not found'}
            </p>
          </div>
        ) : (
          <PlayerForm initialData={player} isEditing={true} playerId={playerId} />
        )}
      </div>
    </DashboardLayout>
  );
}
