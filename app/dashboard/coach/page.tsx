'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { combinations } from '@/lib/combinationsCheatSheet';
import {
  Shield,
  Users,
  Star,
  BookOpen,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { PiCourtBasketballBold } from '@/components/icons/navIcons';

interface TeamItem {
  _id: string;
  name: string;
  description?: string;
}

interface PlayerItem {
  _id: string;
  name?: string;
  team?: string | { _id: string };
  isFirstTeam?: boolean;
}

interface PlayersApiResponse {
  data?: PlayerItem[];
}

const fetcher = async (url: string): Promise<unknown> => {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
};

export default function CoachDashboard() {
  const t = useTranslations('CoachDashboard');
  const { data: teamsData } = useSWR<TeamItem[]>(
    '/api/coach/teams',
    fetcher as (url: string) => Promise<TeamItem[]>
  );
  const { data: playersData } = useSWR<PlayersApiResponse>(
    '/api/coach/players',
    fetcher as (url: string) => Promise<PlayersApiResponse>
  );
  const teams: TeamItem[] = Array.isArray(teamsData) ? teamsData : [];
  const players: PlayerItem[] =
    playersData?.data && Array.isArray(playersData.data) ? playersData.data : [];

  const startersCount = players.filter((p) => p.isFirstTeam).length;

  return (
    <DashboardLayout>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        badge={t('badge')}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
              <Link href="/dashboard/coach/combinations">
                <BookOpen className="mr-1.5 h-4 w-4" /> {t('tacticalPlaybook')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link href="/dashboard/coach/players">
                <Users className="mr-1.5 h-4 w-4" /> {t('viewAllPlayers')}
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('assignedTeams')}
          value={teams.length}
          icon={Shield}
          description={t('assignedTeamsDesc')}
          trend="U18 Elite & U16 Dev"
          trendType="neutral"
          accent="blue"
        />
        <StatCard
          title={t('activePlayers')}
          value={players.length}
          icon={Users}
          description={t('activePlayersDesc')}
          trend="100% active roster"
          trendType="positive"
          accent="gold"
        />
        <StatCard
          title={t('startingLineups')}
          value={startersCount}
          icon={Star}
          description={t('startingLineupsDesc')}
          trend="Court starters active"
          trendType="positive"
          accent="emerald"
        />
        <StatCard
          title={t('tacticalPlays')}
          value={combinations.length}
          icon={BookOpen}
          description={t('tacticalPlaysDesc')}
          trend="Visualizer ready"
          trendType="neutral"
          accent="purple"
        />
      </div>

      {/* Teams Grid Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              My Teams & Rosters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a team to inspect the interactive court and starters
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Link href="/dashboard/coach/teams">
              View Teams <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => {
            const teamPlayers = players.filter((p) => {
              const teamId = typeof p.team === 'object' && p.team !== null ? p.team._id : p.team;
              return teamId === team._id;
            });
            const teamStarters = teamPlayers.filter((p) => p.isFirstTeam);

            return (
              <div
                key={team._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    </div>
                    <StatusBadge status="active" label="Competitive" variant="success" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        Roster Size
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                        {teamPlayers.length} Players
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        Court Starters
                      </p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                        {teamStarters.length} / 5 Starters
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-sm">
                    <Link href={`/dashboard/coach/teams/${team._id}`}>
                      <PiCourtBasketballBold className="mr-1.5 h-4 w-4" /> Open Court & Roster
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tactical Playbook Spotlight */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Installed Combinations & Plays
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive play visualizer and tactical setups
              </p>
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Link href="/dashboard/coach/combinations">
              All Plays <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {combinations.slice(0, 4).map((comb, idx) => (
            <Link
              key={idx}
              href="/dashboard/coach/combinations"
              className="group flex flex-col justify-between rounded-xl border border-slate-100 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Set #{idx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mt-0.5">
                  {comb.name}
                </h4>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Detailed Diagram</span>
                <Eye className="h-3.5 w-3.5 group-hover:text-amber-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
