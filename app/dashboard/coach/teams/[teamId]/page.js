'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/DataTable';
import { columns } from '@/app/dashboard/coach/players/columns';
import Loader from '@/components/Loader';
import BasketballCourt from '@/components/BasketballCourt';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import useSWR, { mutate } from 'swr';
import { Shield, ArrowLeft, Star, Users } from 'lucide-react';
import Link from 'next/link';

export default function TeamPlayersPage({ params }) {
  const [players, setPlayers] = useState([]);
  const { teamId } = React.use(params);
  const [context] = useState('team');
  const router = useRouter();

  const fetcher = async (url) => {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        router.push('/login');
        throw new Error('Unauthorized - Please log in');
      }
      if (res.status === 403) {
        router.push('/unauthorized');
        throw new Error('Unauthorized - Not a team coach');
      }
      throw new Error(data.error || 'Failed to fetch players');
    }
    return res.json();
  };

  const { data, error, isLoading } = useSWR(`/api/coach/teams/${teamId}`, fetcher);

  const handleDataChange = async () => {
    await mutate(`/api/coach/teams/${teamId}`);
  };

  useEffect(() => {
    if (data?.data) {
      setPlayers(data.data);
    }
  }, [data]);

  const starters = players?.filter((player) => player.isFirstTeam) || [];
  const teamName = players.length > 0 && players[0].team?.name ? players[0].team.name : 'Team';

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading Roster..." subtitle="Retrieving player telemetry and starting lineup" />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Team Error" subtitle="Unable to load team players" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  const positions = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];

  return (
    <DashboardLayout>
      <PageHeader
        title={teamName}
        subtitle="Tactical court visualization, active starting five, and full roster telemetry"
        badge={`${players.length} Players`}
        icon={Shield}
        actions={
          <Button asChild variant="outline" size="sm" className="shadow-sm">
            <Link href="/dashboard/coach/teams">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Teams
            </Link>
          </Button>
        }
      />

      {/* Visual Court & Starting Lineup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Court layout */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Starting Five Formation
              </h3>
            </div>
            <StatusBadge status="firstTeam" label={`${starters.length} / 5 Assigned`} variant="gold" />
          </div>

          <div className="w-full max-w-[602px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-950/5">
            <BasketballCourt firstTeamPlayers={starters} />
          </div>
        </div>

        {/* Starters Slot Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Lineup Positions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle starting status using the star in the roster table below
            </p>
          </div>

          <div className="space-y-2.5">
            {positions.map((pos) => {
              const starter = starters.find((p) => p.position === pos);
              return (
                <div
                  key={pos}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-800/40"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {pos}
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {starter ? `${starter.name} ${starter.lastname}` : 'Unassigned'}
                    </p>
                  </div>

                  {starter ? (
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      #{starter.jerseyNum}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Open</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Roster Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Full Team Roster
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click the star icon next to a player to toggle first-team starting status
              </p>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns(setPlayers, context)}
          data={players}
          onDataChange={handleDataChange}
        />
      </div>
    </DashboardLayout>
  );
}
