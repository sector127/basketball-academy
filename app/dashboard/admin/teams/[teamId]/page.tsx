'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/DataTable';
import { columns, type PlayerRowData } from '@/app/dashboard/admin/players/columns';
import Loader from '@/components/Loader';
import BasketballCourt, { type CourtPlayer } from '@/components/BasketballCourt';
import useSWR, { mutate } from 'swr';
import { Shield, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useIsAdmin } from '@/hooks/use-is-admin';

interface TeamApiResponse {
  success?: boolean;
  data?: PlayerRowData[];
}

const fetcher = async (url: string): Promise<TeamApiResponse> => {
  const res = await fetch(url);
  return res.ok ? res.json() : { success: false, data: [] };
};

export default function TeamPlayersPage() {
  const t = useTranslations('Teams');
  const isAdmin = useIsAdmin();
  const routeParams = useParams<{ teamId?: string }>();
  const teamId = routeParams?.teamId;
  const [players, setPlayers] = useState<PlayerRowData[]>([]);
  const [context] = useState('team');
  const { data, error, isLoading } = useSWR<TeamApiResponse>(
    teamId ? `/api/admin/teams/${teamId}` : null,
    fetcher
  );

  const handleDataChange = async () => {
    if (teamId) {
      await mutate(`/api/admin/teams/${teamId}`);
    }
  };

  useEffect(() => {
    if (data?.data && Array.isArray(data.data)) {
      setPlayers(data.data);
    }
  }, [data]);

  const starters = useMemo(
    () => players.filter((player) => player.isFirstTeam),
    [players]
  );
  const teamName =
    players.length > 0 && players[0].team?.name ? players[0].team.name : 'Squad';

  const courtStarters: CourtPlayer[] = useMemo(
    () =>
      starters.map((p) => ({
        _id: p._id,
        name: p.name,
        lastname: p.lastname,
        position: p.position,
        jerseyNum: p.jerseyNum ?? 0,
        isFirstTeam: p.isFirstTeam,
      })),
    [starters]
  );

  const tableColumns = useMemo(() => {
    return columns(setPlayers, context).filter((column) => {
      const colId = (column.id ?? ('accessorKey' in column ? (column.accessorKey as string) : '')) as string;
      return isAdmin || !['select', 'actions'].includes(colId);
    });
  }, [isAdmin, context]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Team Roster" subtitle="Loading academy squad telemetry..." />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch';
    return (
      <DashboardLayout>
        <PageHeader title="Team Roster" subtitle="Error loading roster" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error loading team players: {message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={t('rosterAndLineup', { team: teamName })}
        subtitle={t('rosterSubtitle')}
        badge={t('athletesCount', { count: players.length })}
        icon={Shield}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/teams">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> {t('backToTeams')}
            </Link>
          </Button>
        }
      />

      {/* Starting Lineup Court Visualizer */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('startingFive')} ({starters.length}/5)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any player token on the court to view detailed profile
          </span>
        </div>
        <div className="w-full flex justify-center overflow-x-auto py-2">
          <BasketballCourt firstTeamPlayers={courtStarters} />
        </div>
      </div>

      {/* Full Squad Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('fullRoster')}
          </h3>
        </div>
        <DataTable
          columns={tableColumns}
          data={players}
          onDataChange={handleDataChange}
        />
      </div>
    </DashboardLayout>
  );
}
