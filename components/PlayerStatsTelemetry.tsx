'use client';

import React from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Trophy, Activity, Target, Shield, Clock, Award } from 'lucide-react';
import Loader from '@/components/Loader';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

interface PlayerStatsTelemetryProps {
  playerId: string;
}

export interface RecentGameStat {
  gameId?: unknown;
  date?: string | Date;
  opponent: string;
  teamName?: string;
  ourScore?: number;
  opponentScore?: number;
  stats: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
  };
}

export interface PlayerStatsResponse {
  success: boolean;
  gamesPlayed: number;
  averages: {
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    topg: number;
    mpg: number;
  };
  totals: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    minutesPlayed: number;
  };
  recentGames: RecentGameStat[];
}

export default function PlayerStatsTelemetry({ playerId }: PlayerStatsTelemetryProps) {
  const t = useTranslations('Players');
  const { data: statsData, error, isLoading } = useSWR<PlayerStatsResponse>(
    playerId ? `/api/admin/players/${playerId}/stats` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <Loader />
      </div>
    );
  }

  if (error || !statsData?.success) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/90 text-center text-xs text-slate-500">
        Player stats telemetry unavailable.
      </div>
    );
  }

  const { gamesPlayed, averages, totals, recentGames } = statsData;

  if (gamesPlayed === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/90 text-center">
        <Activity className="h-10 w-10 text-amber-500/60 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {t('stats.noStatsYet')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {t('stats.noStatsDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title={t('stats.pointsPerGame')}
          value={averages.ppg}
          icon={Target}
          accent="gold"
          trend={`${totals.points} total pts`}
          trendType="neutral"
        />
        <StatCard
          title={t('stats.reboundsPerGame')}
          value={averages.rpg}
          icon={Shield}
          accent="blue"
          trend={`${totals.rebounds} total reb`}
          trendType="neutral"
        />
        <StatCard
          title={t('stats.assistsPerGame')}
          value={averages.apg}
          icon={Activity}
          accent="emerald"
          trend={`${totals.assists} total ast`}
          trendType="neutral"
        />
        <StatCard
          title={t('stats.stealsPerGame')}
          value={averages.spg}
          icon={Award}
          accent="gold"
          trend={`${totals.steals} total stl`}
          trendType="neutral"
        />
        <StatCard
          title={t('stats.blocksPerGame')}
          value={averages.bpg}
          icon={Shield}
          accent="purple"
          trend={`${totals.blocks} total blk`}
          trendType="neutral"
        />
        <StatCard
          title="Minutes / Game"
          value={averages.mpg}
          icon={Clock}
          accent="blue"
          trend={`${gamesPlayed} games`}
          trendType="neutral"
        />
      </div>

      {/* Match Logs Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('stats.recentMatchLogs')} ({recentGames.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {totals.points} PTS &bull; {totals.rebounds} REB &bull; {totals.assists} AST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-2 text-left font-bold text-slate-700 dark:text-slate-300">Date & Match</th>
                <th className="py-2 px-2">Result</th>
                <th className="py-2 px-2">MIN</th>
                <th className="py-2 px-2 font-bold text-amber-600 dark:text-amber-400">PTS</th>
                <th className="py-2 px-2">REB</th>
                <th className="py-2 px-2">AST</th>
                <th className="py-2 px-2">STL</th>
                <th className="py-2 px-2">BLK</th>
                <th className="py-2 px-2">TO</th>
                <th className="py-2 px-2">PF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {recentGames.map((game: RecentGameStat, idx: number) => {
                const isWin = game.ourScore > game.opponentScore;
                const isTie = game.ourScore === game.opponentScore;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 text-left font-sans font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <span>vs {game.opponent}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {game.date ? new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <StatusBadge
                        status={isWin ? 'completed' : isTie ? 'scheduled' : 'disabled'}
                        label={`${game.ourScore}-${game.opponentScore}`}
                        variant={isWin ? 'success' : isTie ? 'warning' : 'destructive'}
                      />
                    </td>
                    <td className="py-2 px-2">{game.stats.minutes}</td>
                    <td className="py-2 px-2 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                      {game.stats.points}
                    </td>
                    <td className="py-2 px-2">{game.stats.rebounds}</td>
                    <td className="py-2 px-2">{game.stats.assists}</td>
                    <td className="py-2 px-2">{game.stats.steals}</td>
                    <td className="py-2 px-2">{game.stats.blocks}</td>
                    <td className="py-2 px-2 text-rose-500">{game.stats.turnovers}</td>
                    <td className="py-2 px-2 text-rose-500">{game.stats.fouls}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
