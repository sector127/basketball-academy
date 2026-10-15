'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable } from '@/components/DataTable';
import { columns } from '@/app/dashboard/coach/players/columns';
import Loader from '@/components/Loader';
import BasketballCourt from '@/components/BasketballCourt';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import useSWR, { mutate } from 'swr';
import {
  Shield,
  ArrowLeft,
  Star,
  Users,
  Trophy,
  Calendar,
  Activity,
  Flame,
  Clock,
  MapPin,
  BookOpen,
  Dumbbell,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { PiCourtBasketballBold } from '@/components/icons/navIcons';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { combinations } from '@/lib/combinationsCheatSheet';

function formatMatchDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatFullDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TeamPlayersPage() {
  const t = useTranslations('Teams');
  const routeParams = useParams();
  const teamId = routeParams?.teamId;
  const [players, setPlayers] = useState([]);
  const [rosterFilter, setRosterFilter] = useState('all'); // 'all' | 'starters' | 'bench'
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
      throw new Error(data.error || 'Failed to fetch team data');
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

  const team = data?.team || {};
  const teamName = team?.name || (players.length > 0 && players[0].team?.name ? players[0].team.name : 'Team');
  const teamDescription = team?.description || 'Competitive basketball squad under academy guidance';
  const recentGames = data?.recentGames || [];
  const upcomingGames = data?.upcomingGames || [];
  const nextFixture = data?.nextFixture || (upcomingGames.length > 0 ? upcomingGames[0] : null);
  const upcomingPractices = data?.upcomingPractices || [];
  const stats = data?.stats || {
    totalPlayers: players.length,
    startersCount: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgPointsScored: '0',
    avgPointsConceded: '0',
    pointDifferential: 0,
    lastFiveOutcome: [],
  };

  const starters = useMemo(() => players?.filter((player) => player.isFirstTeam) || [], [players]);
  const bench = useMemo(() => players?.filter((player) => !player.isFirstTeam) || [], [players]);

  const filteredPlayers = useMemo(() => {
    if (rosterFilter === 'starters') return starters;
    if (rosterFilter === 'bench') return bench;
    return players;
  }, [players, starters, bench, rosterFilter]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading Team Hub..." subtitle="Retrieving tactical telemetry, match history, and lineup" />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Team Error" subtitle="Unable to load team details" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  const positions = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
  const featuredPlays = combinations.slice(0, 3);

  return (
    <DashboardLayout>
      {/* 1. Header with Title, Description, and Quick Navigation Actions */}
      <PageHeader
        title={teamName}
        subtitle={teamDescription}
        badge={`${players.length} Athletes • Active Squad`}
        icon={Shield}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="shadow-xs">
              <Link href="/dashboard/coach/teams">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('backToTeams')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shadow-xs">
              <Link href="/dashboard/coach/calendar">
                <Calendar className="mr-1.5 h-4 w-4" /> Calendar
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs">
              <Link href="/dashboard/coach/combinations">
                <BookOpen className="mr-1.5 h-4 w-4" /> Playbook
              </Link>
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="League Record"
          value={`${stats.wins} - ${stats.losses}`}
          icon={Trophy}
          description="Championship regular season"
          trend={`${stats.winRate}% Win Rate`}
          trendType={stats.winRate >= 50 ? 'positive' : 'negative'}
          accent="emerald"
        />
        <StatCard
          title="Next Fixture"
          value={nextFixture ? (nextFixture.opponent.length > 18 ? nextFixture.opponent.slice(0, 18) + '...' : nextFixture.opponent) : 'TBD'}
          icon={Calendar}
          description={nextFixture ? `${nextFixture.location} Match` : 'No upcoming match'}
          trend={nextFixture ? `${formatMatchDate(nextFixture.date)} • ${nextFixture.startTime}` : 'Schedule pending'}
          trendType="neutral"
          accent="gold"
        />
        <StatCard
          title="Active Squad"
          value={`${players.length} Athletes`}
          icon={Users}
          description="Squad depth available"
          trend={`${starters.length} / 5 Starters Set`}
          trendType={starters.length === 5 ? 'positive' : 'neutral'}
          accent="blue"
        />
        <StatCard
          title="Offensive Scoring"
          value={`${stats.avgPointsScored} PPG`}
          icon={Activity}
          description={`Conceded: ${stats.avgPointsConceded} PPG`}
          trend={`${stats.pointDifferential >= 0 ? '+' : ''}${stats.pointDifferential} Point Diff`}
          trendType={stats.pointDifferential >= 0 ? 'positive' : 'negative'}
          accent="purple"
        />
      </div>

      {/* 3. Main Operations Row: Joined Matchday & Form Hub (Left 5 Cols) + Squad Roster (Right 7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (5 Cols): Joined Matchday & Recent Form Hub */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col justify-between space-y-3.5">
          <div>
            {/* Header: Title + Form Pills */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Matchday & Form
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Next fixture & last 5 match results
                  </p>
                </div>
              </div>

              {/* Form Guide Pills */}
              {stats.lastFiveOutcome && stats.lastFiveOutcome.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">
                    Form:
                  </span>
                  {stats.lastFiveOutcome.map((outcome, idx) => (
                    <span
                      key={idx}
                      className={`flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold shadow-xs ${
                        outcome === 'W'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : outcome === 'L'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {outcome}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Next Fixture Spotlight (Compact Banner) */}
            {nextFixture ? (
              <div className="mt-3 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-3.5 text-white relative overflow-hidden shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Next Match • {formatMatchDate(nextFixture.date)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
                    {nextFixture.startTime}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-center">
                  <div className="flex-1 truncate">
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {nextFixture.isAwayGame ? 'Away' : 'Home'}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                      {teamName}
                    </h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-amber-400 mx-2">
                    VS
                  </span>
                  <div className="flex-1 truncate">
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {nextFixture.isAwayGame ? 'Home' : 'Away'}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                      {nextFixture.opponent}
                    </h5>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 truncate text-slate-300 text-[10px]">
                    <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="truncate">{nextFixture.venue}</span>
                  </span>
                  <Link
                    href="/dashboard/coach/calendar"
                    className="text-amber-400 hover:text-amber-300 font-semibold text-[10px] shrink-0 ml-2 inline-flex items-center gap-0.5"
                  >
                    Calendar &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                No upcoming fixture scheduled
              </div>
            )}

            {/* Last 5 Matches List (Compact) */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="text-[11px]">Last 5 Matches</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {stats.wins}W - {stats.losses}L Record
                </span>
              </div>

              {recentGames.length > 0 ? (
                <div className="space-y-1.5">
                  {recentGames.slice(0, 5).map((game) => (
                    <div
                      key={game._id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-6 w-11 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold ${
                            game.outcome === 'W'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : game.outcome === 'L'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {game.outcome ? `${game.outcome} ${game.ourScore}-${game.opponentScore}` : 'TBD'}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
                            vs {game.opponent}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {formatMatchDate(game.date)} • {game.location}
                          </p>
                        </div>
                      </div>

                      {/* Quarter Pills */}
                      {game.periodScores && game.periodScores.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                          {game.periodScores.map((period) => (
                            <span
                              key={period.period}
                              className="px-1 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-mono text-slate-500 dark:text-slate-400"
                            >
                              {period.homeScore}-{period.awayScore}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-3">No completed matches logged</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.gamesPlayed} Total Matches Played</span>
            <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400 h-6 px-1.5">
              <Link href="/dashboard/coach/games">
                All Matches <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column (7 Cols): Squad Roster & Tactical Lineup Hub (Tabs) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col justify-between">
          <Tabs defaultValue="roster" className="w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Squad Roster & Tactical Lineup
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Roster table with star assignment & court visualizer
                    </p>
                  </div>
                </div>

                <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-center">
                  <TabsTrigger
                    value="roster"
                    className="text-xs font-semibold rounded-lg gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
                  >
                    <Users className="h-3.5 w-3.5 text-blue-500" /> Roster ({players.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="court"
                    className="text-xs font-semibold rounded-lg gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
                  >
                    <PiCourtBasketballBold className="h-3.5 w-3.5 text-amber-500" /> Court ({starters.length}/5)
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Full Roster Table */}
              <TabsContent value="roster" className="mt-3 space-y-2.5 focus-visible:outline-none">
                <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRosterFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        rosterFilter === 'all'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      All ({players.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterFilter('starters')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        rosterFilter === 'starters'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-500/30'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Starters ({starters.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterFilter('bench')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        rosterFilter === 'bench'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      Bench ({bench.length})
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Star className="h-2.5 w-2.5 text-amber-500" /> Star toggles starting five
                  </span>
                </div>

                <DataTable
                  columns={columns(setPlayers, context)}
                  data={filteredPlayers}
                  onDataChange={handleDataChange}
                />
              </TabsContent>

              {/* Tab 2: Starting 5 Court Visualizer */}
              <TabsContent value="court" className="mt-3 flex flex-col items-center justify-center focus-visible:outline-none">
                <div className="w-full flex items-center justify-between mb-2 px-1 max-w-[602px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      On-Court Positions ({starters.length}/5 Starters)
                    </h4>
                  </div>
                  <StatusBadge status="firstTeam" label={`${starters.length}/5 Assigned`} variant="gold" />
                </div>

                <div className="w-full max-w-[602px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-950/5">
                  <BasketballCourt firstTeamPlayers={starters} />
                </div>

                {/* Quick Starter Summary Chips Below Court */}
                <div className="w-full max-w-[602px] mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                  {positions.map((pos) => {
                    const starter = starters.find((p) => p.position === pos);
                    return (
                      <div
                        key={pos}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 text-[11px]"
                      >
                        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">
                          {pos.split(' ').map((w) => w[0]).join('')}:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                          {starter ? `${starter.name} ${starter.lastname[0]}.` : 'Open'}
                        </span>
                        {starter && (
                          <span className="font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded">
                            #{starter.jerseyNum}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* 4. Team Operations Hub: Practices & Coaching/Tactics (Balanced 2-Column Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scheduled Practices */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Dumbbell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Scheduled Practices & Drills
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upcoming on-court training sessions and individual workouts
                  </p>
                </div>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400 h-7 px-2">
                <Link href="/dashboard/coach/calendar">
                  Calendar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {upcomingPractices.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingPractices.map((practice) => (
                  <div
                    key={practice._id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          practice.eventType === 'individualTraining'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {practice.eventType === 'individualTraining' ? 'Individual Skills' : 'Team Practice'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {practice.startTime} - {practice.endTime}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {practice.title}
                    </h4>

                    {practice.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {practice.description}
                      </p>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{practice.venue}</span>
                      </span>
                      <span className="font-mono text-slate-400 shrink-0">
                        {formatMatchDate(practice.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No upcoming practices"
                description="Team practice sessions scheduled on the academy calendar will appear here."
              />
            )}
          </div>
        </div>

        {/* Right: Coaching Leadership & Tactical Playbook */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Coaching & Tactical Playbook
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Staff leadership and installed court combinations
                  </p>
                </div>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400 h-7 px-2">
                <Link href="/dashboard/coach/combinations">
                  All Plays <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {/* Coaching Staff Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0">
                  {team.coach ? `${team.coach.name?.[0] || 'N'}${team.coach.lastName?.[0] || 'M'}` : 'HC'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {team.coach ? `${team.coach.name} ${team.coach.lastName}` : 'Nikoloz Mskhalaia'}
                  </h4>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Head Coach
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0">
                  {team.assistantCoach ? `${team.assistantCoach.name?.[0] || 'G'}${team.assistantCoach.lastName?.[0] || 'A'}` : 'AC'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {team.assistantCoach ? `${team.assistantCoach.name} ${team.assistantCoach.lastName}` : 'Guga (Assistant Coach)'}
                  </h4>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Assistant Coach
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Installed Tactical Combinations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {featuredPlays.map((play, idx) => (
                <Link
                  key={idx}
                  href="/dashboard/coach/combinations"
                  className="group flex flex-col justify-between rounded-xl border border-slate-100 p-2.5 transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-slate-50/70 dark:border-slate-800/80 dark:hover:bg-slate-800/40"
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Set #{idx + 1}
                    </span>
                    <h5 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mt-0.5 line-clamp-2">
                      {play.name}
                    </h5>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Diagram</span>
                    <Eye className="h-3 w-3 group-hover:text-amber-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Average Athlete Height: <strong className="text-slate-700 dark:text-slate-200 font-mono">{stats.avgHeight ? `${stats.avgHeight} cm` : '187.4 cm'}</strong></span>
            <span>Base: <strong className="text-slate-700 dark:text-slate-200">BBA Main Arena</strong></span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
