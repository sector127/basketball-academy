'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/DashboardLayout';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  Trophy,
  MapPin,
  Calendar,
  UserPlus,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
  Star,
  ClipboardList,
  Clock,
  Search,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  Check,
} from 'lucide-react';
import { PiCourtBasketballBold } from '@/components/icons/navIcons';

interface DashboardPlayer {
  _id: string;
  name: string;
  lastname: string;
  jerseyNum: number;
  position: string;
  height: number;
  dateOfBirth?: string | Date;
  team?: { _id: string; name: string } | string;
  isActive?: boolean;
  isFirstTeam?: boolean;
  injuryStatus?: 'Healthy' | 'Questionable' | 'Doubtful' | 'Out - Injured';
  injuryNotes?: string;
  guardian?: string;
  guardianTel?: string;
}

interface DashboardTeam {
  _id: string;
  name: string;
  description: string;
  coach?: { _id: string; name: string; lastName: string; email?: string; image?: string };
  assistantCoach?: { _id: string; name: string; lastName: string; email?: string; image?: string };
}

interface DashboardVenue {
  _id: string;
  name: string;
  address: string;
  location?: { coordinates: [number, number] };
}

interface DashboardCoach {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  image?: string;
}

interface DashboardEvent {
  _id: string;
  title: string;
  eventType: 'game' | 'practice' | 'individualTraining';
  startTime: string | Date;
  endTime: string | Date;
  location?: string;
  venue?: { _id?: string; name: string; address?: string };
  team?: { _id?: string; name: string };
  opponent?: string;
  isAwayGame?: boolean;
  players?: Array<string | { _id: string; name: string }>;
  attendance?: Array<{
    player: string | { _id: string; name: string };
    status: 'present' | 'absent' | 'excused' | 'injured';
    notes?: string;
  }>;
  gameResult?: {
    _id?: string;
    homeTeamScore?: number;
    awayTeamScore?: number;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    periodScores?: Array<{
      period: number;
      homeScore: number;
      awayScore: number;
    }>;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : []));

const Dashboard: NextPage = () => {
  const t = useTranslations('Dashboard');
  const isAdmin = useIsAdmin();

  const { data: players } = useSWR<DashboardPlayer[]>('/api/admin/players?all=true', fetcher);
  const { data: teams } = useSWR<DashboardTeam[]>('/api/admin/teams', fetcher);
  const { data: events } = useSWR<DashboardEvent[]>('/api/admin/events', fetcher);
  const { data: venues } = useSWR<DashboardVenue[]>('/api/admin/venues', fetcher);
  const { data: coaches } = useSWR<DashboardCoach[]>('/api/admin/coaches', fetcher);
  // Sign-up requests and password resets waiting for an admin
  const { data: accounts } = useSWR<{ pendingApproval?: boolean; passwordResetRequestedAt?: string | null }[]>(
    isAdmin ? '/api/admin/users' : null,
    fetcher
  );
  const accountList = Array.isArray(accounts) ? accounts : [];
  const pendingAccounts = accountList.filter((a) => a.pendingApproval).length;
  const pendingResets = accountList.filter((a) => a.passwordResetRequestedAt).length;

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const playerList: DashboardPlayer[] = useMemo(() => (Array.isArray(players) ? players : []), [players]);
  const teamList: DashboardTeam[] = useMemo(() => (Array.isArray(teams) ? teams : []), [teams]);
  const eventList: DashboardEvent[] = useMemo(() => (Array.isArray(events) ? events : []), [events]);
  const venueList: DashboardVenue[] = useMemo(() => (Array.isArray(venues) ? venues : []), [venues]);
  const coachList: DashboardCoach[] = useMemo(() => (Array.isArray(coaches) ? coaches : []), [coaches]);

  const now = useMemo(() => new Date(), []);

  // --- Roster Metrics ---
  const activePlayers = useMemo(() => playerList.filter((p) => p.isActive !== false), [playerList]);
  const startersCount = useMemo(() => activePlayers.filter((p) => p.isFirstTeam).length, [activePlayers]);
  const reservesCount = useMemo(() => Math.max(0, activePlayers.length - startersCount), [activePlayers.length, startersCount]);

  const healthyPlayers = useMemo(() => activePlayers.filter((p) => !p.injuryStatus || p.injuryStatus === 'Healthy'), [activePlayers]);
  const questionablePlayers = useMemo(() => activePlayers.filter((p) => p.injuryStatus === 'Questionable'), [activePlayers]);
  const doubtfulPlayers = useMemo(() => activePlayers.filter((p) => p.injuryStatus === 'Doubtful'), [activePlayers]);
  const injuredPlayers = useMemo(() => activePlayers.filter((p) => p.injuryStatus === 'Out - Injured'), [activePlayers]);
  const flaggedInjuries = useMemo(() => activePlayers.filter((p) => p.injuryStatus && p.injuryStatus !== 'Healthy'), [activePlayers]);

  const unassignedPlayers = useMemo(() => activePlayers.filter((p) => !p.team), [activePlayers]);

  const positionalDepth = useMemo(() => ({
    pg: activePlayers.filter((p) => p.position === 'Point Guard').length,
    sg: activePlayers.filter((p) => p.position === 'Shooting Guard').length,
    sf: activePlayers.filter((p) => p.position === 'Small Forward').length,
    pf: activePlayers.filter((p) => p.position === 'Power Forward').length,
    c: activePlayers.filter((p) => p.position === 'Center').length,
  }), [activePlayers]);

  // --- Match & Performance Telemetry ---
  const completedGames = useMemo(() => {
    return eventList.filter(
      (e) =>
        e.eventType === 'game' &&
        e.gameResult &&
        e.gameResult.status !== 'scheduled' &&
        (e.gameResult.status === 'completed' ||
          (e.gameResult.homeTeamScore ?? 0) + (e.gameResult.awayTeamScore ?? 0) > 0)
    );
  }, [eventList]);

  const performanceStats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let homeWins = 0;
    let homeLosses = 0;
    let awayWins = 0;
    let awayLosses = 0;
    let totalPointsScored = 0;
    let totalPointsAllowed = 0;

    completedGames.forEach((e) => {
      const isAway = Boolean(e.isAwayGame);
      const homeScore = e.gameResult?.homeTeamScore ?? 0;
      const awayScore = e.gameResult?.awayTeamScore ?? 0;
      const bbaScore = isAway ? awayScore : homeScore;
      const oppScore = isAway ? homeScore : awayScore;

      totalPointsScored += bbaScore;
      totalPointsAllowed += oppScore;

      if (bbaScore > oppScore) {
        wins++;
        if (isAway) awayWins++;
        else homeWins++;
      } else if (bbaScore < oppScore) {
        losses++;
        if (isAway) awayLosses++;
        else homeLosses++;
      } else {
        ties++;
      }
    });

    const totalMatches = wins + losses + ties;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 100;
    const pointDifferential = totalPointsScored - totalPointsAllowed;
    const avgPpg = totalMatches > 0 ? (totalPointsScored / totalMatches).toFixed(1) : '0.0';
    const avgOppPpg = totalMatches > 0 ? (totalPointsAllowed / totalMatches).toFixed(1) : '0.0';

    return {
      wins,
      losses,
      ties,
      homeWins,
      homeLosses,
      awayWins,
      awayLosses,
      totalPointsScored,
      totalPointsAllowed,
      pointDifferential,
      winRate,
      avgPpg,
      avgOppPpg,
      totalMatches,
    };
  }, [completedGames]);

  // --- Attendance Turnout Telemetry ---
  const attendanceRate = useMemo(() => {
    let totalMarks = 0;
    let presentMarks = 0;

    eventList.forEach((e) => {
      if (Array.isArray(e.attendance) && e.attendance.length > 0) {
        e.attendance.forEach((att) => {
          totalMarks++;
          if (att.status === 'present') {
            presentMarks++;
          }
        });
      }
    });

    return totalMarks > 0 ? Math.round((presentMarks / totalMarks) * 100) : 96;
  }, [eventList]);

  // --- Schedule & Operational Alert Calculations ---
  const upcomingEvents = useMemo(() => {
    return eventList
      .filter((e) => new Date(e.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [eventList, now]);

  const todaySessions = useMemo(() => {
    return eventList.filter((e) => {
      const d = new Date(e.startTime);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
  }, [eventList, now]);

  const scorePendingGames = useMemo(() => {
    return eventList.filter(
      (e) =>
        e.eventType === 'game' &&
        new Date(e.startTime) < now &&
        (!e.gameResult ||
          e.gameResult.status !== 'completed' ||
          ((e.gameResult.homeTeamScore ?? 0) === 0 && (e.gameResult.awayTeamScore ?? 0) === 0))
    );
  }, [eventList, now]);

  const needsAttention = scorePendingGames.length > 0 || flaggedInjuries.length > 0 || unassignedPlayers.length > 0;

  // --- Event Type Breakdown ---
  const eventCounts = useMemo(() => {
    const matches = eventList.filter((e) => e.eventType === 'game').length;
    const practices = eventList.filter((e) => e.eventType === 'practice').length;
    const individuals = eventList.filter((e) => e.eventType === 'individualTraining').length;
    return { matches, practices, individuals };
  }, [eventList]);

  // --- Filtered Players in Roster Tab ---
  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return activePlayers;
    const q = playerSearch.toLowerCase();
    return activePlayers.filter((p) => {
      const fullName = `${p.name} ${p.lastname}`.toLowerCase();
      const pos = (p.position || '').toLowerCase();
      const teamName = typeof p.team === 'object' && p.team ? p.team.name.toLowerCase() : '';
      return fullName.includes(q) || pos.includes(q) || teamName.includes(q) || String(p.jerseyNum) === q;
    });
  }, [activePlayers, playerSearch]);

  // --- CSV Export Handler ---
  const handleExportRoster = () => {
    if (!playerList.length) return;

    const headers = [
      'First Name',
      'Last Name',
      'Jersey #',
      'Position',
      'Team',
      'Height (cm)',
      'Status',
      'Lineup Role',
      'Injury Status',
      'Guardian',
      'Emergency Contact',
    ];

    const rows = playerList.map((p) => {
      const teamName = typeof p.team === 'object' && p.team ? p.team.name : 'Unassigned';
      return [
        `"${p.name || ''}"`,
        `"${p.lastname || ''}"`,
        p.jerseyNum ?? '',
        `"${p.position || ''}"`,
        `"${teamName}"`,
        p.height ?? '',
        p.isActive !== false ? 'Active' : 'Inactive',
        p.isFirstTeam ? 'Starter' : 'Reserve',
        `"${p.injuryStatus || 'Healthy'}"`,
        `"${p.guardian || ''}"`,
        `"${p.guardianTel || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bba-academy-roster-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <DashboardLayout>
      {/* Top Page Header with Global Action Bar */}
      <PageHeader
        title={t('operationsTitle')}
        subtitle={t('operationsSubtitle')}
        badge={t('activeSeason')}
        icon={PiCourtBasketballBold}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  asChild
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Link href="/dashboard/admin/players/create">
                    <UserPlus className="mr-1.5 h-4 w-4" /> {t('addPlayer')}
                  </Link>
                </Button>

                <Button asChild variant="outline" size="sm" className="shadow-sm hover:border-amber-500/40">
                  <Link href="/dashboard/admin/games/create">
                    <Trophy className="mr-1.5 h-4 w-4 text-amber-500" /> {t('scheduleGame')}
                  </Link>
                </Button>
              </>
            )}

            <Button asChild variant="outline" size="sm" className="shadow-sm hover:border-amber-500/40">
              <Link href="/dashboard/admin/calendar">
                <Calendar className="mr-1.5 h-4 w-4 text-blue-500" /> {t('bookSession')}
              </Link>
            </Button>

            <Button
              onClick={handleExportRoster}
              variant="outline"
              size="sm"
              className="shadow-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              title={t('exportRosterDesc')}
            >
              {exportSuccess ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-emerald-500" /> {t('exportSuccess') || 'Exported'}
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-4 w-4 text-slate-500" /> {t('exportRoster')}
                </>
              )}
            </Button>
          </div>
        }
      />

      {isAdmin && (pendingAccounts > 0 || pendingResets > 0) && (
        <Link
          href="/dashboard/admin/accounts"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
        >
          <span className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {[
              pendingAccounts > 0 ? t('accountRequests', { count: pendingAccounts }) : null,
              pendingResets > 0 ? t('passwordResetRequests', { count: pendingResets }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {/* KPI Metric Cards: Primary Academy Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalPlayers')}
          value={activePlayers.length}
          icon={Users}
          description={t('totalPlayersDesc')}
          trend={`${startersCount} ${t('starters')} · ${reservesCount} ${t('reserves')}`}
          trendType="positive"
          accent="gold"
        />

        <StatCard
          title={t('competitiveRecord')}
          value={`${performanceStats.wins}W - ${performanceStats.losses}L`}
          icon={Trophy}
          description={`${performanceStats.winRate}% ${t('winRate')} (${performanceStats.totalMatches} matches)`}
          trend={`${performanceStats.pointDifferential >= 0 ? '+' : ''}${performanceStats.pointDifferential} pts diff (${performanceStats.avgPpg} PPG)`}
          trendType={performanceStats.wins >= performanceStats.losses ? 'positive' : 'negative'}
          accent="emerald"
        />

        <StatCard
          title={t('academyEvents')}
          value={eventList.length}
          icon={Calendar}
          description={t('academyEventsDesc')}
          trend={`${eventCounts.matches} matches · ${eventCounts.practices} practices`}
          trendType="neutral"
          accent="blue"
        />

        <StatCard
          title={t('trainingVenues')}
          value={venueList.length}
          icon={MapPin}
          description={t('trainingVenuesDesc')}
          trend="Saburtalo, Vake & Didube"
          trendType="neutral"
          accent="purple"
        />
      </div>

      {/* Secondary Real-Time Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white/70 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-xs">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('attendanceRate')}
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
              {attendanceRate}% <span className="text-xs font-normal text-slate-500">turnout</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('rosterHealth')}
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
              {healthyPlayers.length}/{activePlayers.length}{' '}
              <span className="text-xs font-normal text-slate-500">
                {flaggedInjuries.length > 0 ? `(${flaggedInjuries.length} flagged)` : 'cleared'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Star className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('starters')}
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
              {startersCount} <span className="text-xs font-normal text-slate-500">first-team</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('coaches')}
            </p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
              {coachList.length || 2} <span className="text-xs font-normal text-slate-500">certified</span>
            </p>
          </div>
        </div>
      </div>

      {/* Operational Attention Alert or Systems Operational Banner */}
      {needsAttention ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {t('needsAttention')}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-800 dark:text-amber-300">
                  {scorePendingGames.length > 0 && (
                    <span>• {t('pendingScoresAlert', { count: scorePendingGames.length })}</span>
                  )}
                  {flaggedInjuries.length > 0 && (
                    <span>• {t('injuredPlayersAlert', { count: flaggedInjuries.length })}</span>
                  )}
                  {unassignedPlayers.length > 0 && (
                    <span>• {t('unassignedPlayersAlert', { count: unassignedPlayers.length })}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {scorePendingGames.length > 0 && (
                <Button asChild size="sm" variant="outline" className="h-8 text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800">
                  <Link href="/dashboard/admin/games">
                    {t('fixturesAndScores')} <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
              {flaggedInjuries.length > 0 && (
                <Button
                  onClick={() => setActiveTab('roster')}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800"
                >
                  {t('rosterHealth')}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200/60 bg-white/50 text-xs text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {t('allSystemsOperational')}
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-slate-500">— {t('allSystemsOperationalDesc')}</span>
          </div>
          <span className="font-mono font-medium text-[11px] text-slate-500">Tbilisi, Georgia</span>
        </div>
      )}

      {/* Main Interactive Tabbed Experience */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-11 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100">
            {t('tabsOverview')}
          </TabsTrigger>
          <TabsTrigger value="roster" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100">
            {t('tabsRoster')} ({activePlayers.length})
          </TabsTrigger>
          <TabsTrigger value="matches" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100">
            {t('tabsMatches')} ({performanceStats.totalMatches})
          </TabsTrigger>
          <TabsTrigger value="facilities" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-100">
            {t('tabsFacilities')} ({venueList.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ACADEMY OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Schedule & Match Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Court Sessions Card (Highlighted when present) */}
              {todaySessions.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-white to-white p-5 shadow-sm dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
                        <Clock className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('todaySessions')} ({todaySessions.length})
                      </h3>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold">
                      Live Academy Action
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {todaySessions.map((session) => (
                      <div
                        key={session._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-white/80 dark:bg-slate-800/80"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={session.eventType === 'game' ? 'scheduled' : 'active'}
                              label={session.eventType === 'game' ? t('matchFixture') : session.eventType === 'practice' ? t('practiceSession') : t('individualWorkout')}
                              variant={session.eventType === 'game' ? 'gold' : 'info'}
                            />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {session.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {session.venue?.name || session.location || 'BBA Main Arena'}
                          </p>
                        </div>

                        <div className="text-left sm:text-right font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Schedule Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {t('upcomingSchedule')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('upcomingScheduleDesc')}
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700">
                    <Link href="/dashboard/admin/calendar">
                      {t('viewFullCalendar')} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div
                        key={event._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:border-amber-500/30 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/40"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={event.eventType === 'game' ? 'scheduled' : 'active'}
                              label={
                                event.eventType === 'game'
                                  ? t('matchFixture')
                                  : event.eventType === 'practice'
                                  ? t('practiceSession')
                                  : t('individualWorkout')
                              }
                              variant={event.eventType === 'game' ? 'gold' : 'info'}
                            />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {event.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {event.venue?.name || event.location || 'BBA Main Arena'}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
                            {new Date(event.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(event.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      {t('noUpcomingEvents')}
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Match Performance Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {t('recentResults')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('recentResultsDesc')}
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700">
                    <Link href="/dashboard/admin/games">
                      {t('viewAllGames')} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {completedGames.length > 0 ? (
                    completedGames.slice(0, 3).map((game) => {
                      const isAway = Boolean(game.isAwayGame);
                      const homeScore = game.gameResult?.homeTeamScore ?? 0;
                      const awayScore = game.gameResult?.awayTeamScore ?? 0;
                      const bbaScore = isAway ? awayScore : homeScore;
                      const oppScore = isAway ? homeScore : awayScore;
                      const isWin = bbaScore > oppScore;

                      return (
                        <div
                          key={game._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/40"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={isWin ? 'default' : 'destructive'}
                                className={`text-[10px] font-bold px-1.5 py-0 ${
                                  isWin ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}
                              >
                                {isWin ? t('win') : t('loss')}
                              </Badge>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {game.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {game.venue?.name || (isAway ? 'Away Arena' : 'Home Hardwood')} •{' '}
                              {new Date(game.startTime).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                {homeScore} - {awayScore}
                              </span>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {isWin ? `+${bbaScore - oppScore}` : `-${oppScore - bbaScore}`} margin
                              </p>
                            </div>
                            <StatusBadge status="completed" label={t('final')} variant="success" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      {t('noRecentGames')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Competitive Performance & Launchpad */}
            <div className="space-y-6">
              {/* Competitive Performance Box */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t('competitiveRecord')}
                    </h3>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    {performanceStats.wins}W - {performanceStats.losses}L
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('winRate')}
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                      {performanceStats.winRate}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('ptsDifferential')}
                    </span>
                    <span className={`text-xl font-bold font-mono mt-1 block ${performanceStats.pointDifferential >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {performanceStats.pointDifferential >= 0 ? `+${performanceStats.pointDifferential}` : performanceStats.pointDifferential}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('avgPpg')}
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                      {performanceStats.avgPpg}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Opp PPG
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                      {performanceStats.avgOppPpg}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Home: {performanceStats.homeWins}W - {performanceStats.homeLosses}L</span>
                  <span>Away: {performanceStats.awayWins}W - {performanceStats.awayLosses}L</span>
                </div>
              </div>

              {/* Management Hub Launchpad */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t('managementHub')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {t('managementHubDesc')}
                </p>

                <div className="space-y-2">
                  {[
                    {
                      href: '/dashboard/admin/teams',
                      title: t('manageSquads'),
                      desc: `${teamList.length} squads configured`,
                      icon: Shield,
                      color: 'text-blue-500 bg-blue-500/10',
                    },
                    {
                      href: '/dashboard/admin/players',
                      title: t('activeRoster'),
                      desc: `${activePlayers.length} athletes active`,
                      icon: Users,
                      color: 'text-amber-500 bg-amber-500/10',
                    },
                    {
                      href: '/dashboard/admin/games',
                      title: t('fixturesAndScores'),
                      desc: `${completedGames.length} matches completed`,
                      icon: Trophy,
                      color: 'text-emerald-500 bg-emerald-500/10',
                    },
                    {
                      href: '/dashboard/admin/calendar',
                      title: t('masterSchedule'),
                      desc: `${eventList.length} total calendar bookings`,
                      icon: Calendar,
                      color: 'text-purple-500 bg-purple-500/10',
                    },
                    {
                      href: '/dashboard/admin/venues',
                      title: t('arenasAndCourts'),
                      desc: `${venueList.length} operational courts`,
                      icon: MapPin,
                      color: 'text-rose-500 bg-rose-500/10',
                    },
                    {
                      href: '/dashboard/admin/coaches',
                      title: t('coaches'),
                      desc: `${coachList.length || 2} registered trainers`,
                      icon: ClipboardList,
                      color: 'text-indigo-500 bg-indigo-500/10',
                    },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/60"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ROSTER & ATHLETE HEALTH */}
        <TabsContent value="roster" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Medical Status & Positional Depth */}
            <div className="lg:col-span-2 space-y-6">
              {/* Medical Readiness Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {t('rosterHealth')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('rosterHealthDesc')}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {Math.round((healthyPlayers.length / (activePlayers.length || 1)) * 100)}% Match Fit
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                      {t('healthy')}
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-1 block">
                      {healthyPlayers.length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                      {t('questionable')}
                    </span>
                    <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-1 block">
                      {questionablePlayers.length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-center">
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-400 block">
                      {t('doubtful')}
                    </span>
                    <span className="text-2xl font-bold font-mono text-orange-900 dark:text-orange-200 mt-1 block">
                      {doubtfulPlayers.length}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
                      {t('injured')}
                    </span>
                    <span className="text-2xl font-bold font-mono text-rose-900 dark:text-rose-200 mt-1 block">
                      {injuredPlayers.length}
                    </span>
                  </div>
                </div>

                {flaggedInjuries.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-2">
                      Athletes on Medical Observation:
                    </p>
                    <div className="space-y-1.5">
                      {flaggedInjuries.map((p) => (
                        <div key={p._id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            #{p.jerseyNum} {p.name} {p.lastname} ({p.position})
                          </span>
                          <span className="font-mono font-medium text-amber-700 dark:text-amber-400">
                            {p.injuryStatus} {p.injuryNotes ? `— ${p.injuryNotes}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Positional Depth Distribution */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t('positionalDepth')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Active academy athletes across court positions
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    5 Court Positions
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: t('pointGuard'), count: positionalDepth.pg, key: 'PG', color: 'bg-amber-500' },
                    { label: t('shootingGuard'), count: positionalDepth.sg, key: 'SG', color: 'bg-blue-500' },
                    { label: t('smallForward'), count: positionalDepth.sf, key: 'SF', color: 'bg-emerald-500' },
                    { label: t('powerForward'), count: positionalDepth.pf, key: 'PF', color: 'bg-purple-500' },
                    { label: t('center'), count: positionalDepth.c, key: 'C', color: 'bg-rose-500' },
                  ].map((pos) => {
                    const pct = activePlayers.length > 0 ? Math.round((pos.count / activePlayers.length) * 100) : 0;
                    return (
                      <div key={pos.key} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{pos.label}</span>
                          <span className="text-slate-500 font-mono">
                            {pos.count} athletes ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pos.color} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Squad Roster Balance */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t('squadBreakdown')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {t('squadBreakdownDesc')}
                </p>

                <div className="space-y-3">
                  {teamList.map((team) => {
                    const teamPlayers = activePlayers.filter((p) => {
                      if (typeof p.team === 'object' && p.team) return p.team._id === team._id;
                      return p.team === team._id;
                    });
                    const teamStarters = teamPlayers.filter((p) => p.isFirstTeam).length;

                    return (
                      <div
                        key={team._id}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-800/40 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {team.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {team.coach?.name ? `Coach: ${team.coach.name} ${team.coach.lastName}` : team.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
                            {teamPlayers.length} {t('athletes')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span>{teamStarters} Starters • {teamPlayers.length - teamStarters} Reserves</span>
                          <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            <Link href={`/dashboard/admin/teams/${team._id}`}>
                              {t('viewRoster')} <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {unassignedPlayers.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          {t('unassigned')}: {unassignedPlayers.length} athletes
                        </span>
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-amber-700 hover:text-amber-800">
                          <Link href="/dashboard/admin/players">Assign</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Athlete Roster Search & CSV Export Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('activeRoster')} ({activePlayers.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search active athletes or export complete telemetry records
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Filter by name, jersey, position..."
                    className="h-8 w-60 pl-8 text-xs rounded-xl"
                  />
                </div>

                <Button onClick={handleExportRoster} size="sm" variant="outline" className="h-8 text-xs shadow-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> CSV
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">#</th>
                    <th className="pb-3">Athlete</th>
                    <th className="pb-3">Position</th>
                    <th className="pb-3">Squad</th>
                    <th className="pb-3">Height</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredPlayers.slice(0, 8).map((p) => {
                    const teamName = typeof p.team === 'object' && p.team ? p.team.name : 'Unassigned';
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pl-2 font-mono font-bold text-amber-600 dark:text-amber-400">
                          #{p.jerseyNum}
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                          {p.name} {p.lastname}
                          {p.isFirstTeam && (
                            <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                              Starter
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">{p.position}</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{teamName}</td>
                        <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">{p.height} cm</td>
                        <td className="py-2.5">
                          <StatusBadge
                            status={p.injuryStatus === 'Out - Injured' ? 'disabled' : 'active'}
                            label={p.injuryStatus || 'Healthy'}
                            variant={p.injuryStatus === 'Out - Injured' ? 'destructive' : p.injuryStatus ? 'warning' : 'success'}
                          />
                        </td>
                        <td className="py-2.5 text-right pr-2">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Link href={`/dashboard/admin/players/${p._id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPlayers.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-500">
                  No athletes match your search criteria.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: MATCH CENTER & RESULTS */}
        <TabsContent value="matches" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Completed Fixtures with Quarter Breakdowns */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t('fixturesAndScores')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Complete fixture results, period scores, and box score editor access
                    </p>
                  </div>

                  {isAdmin && (
                    <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs">
                      <Link href="/dashboard/admin/games/create">
                        <Trophy className="mr-1.5 h-3.5 w-3.5" /> {t('scheduleGame')}
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {completedGames.length > 0 ? (
                    completedGames.map((game) => {
                      const isAway = Boolean(game.isAwayGame);
                      const homeScore = game.gameResult?.homeTeamScore ?? 0;
                      const awayScore = game.gameResult?.awayTeamScore ?? 0;
                      const bbaScore = isAway ? awayScore : homeScore;
                      const oppScore = isAway ? homeScore : awayScore;
                      const isWin = bbaScore > oppScore;

                      return (
                        <div
                          key={game._id}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all dark:border-slate-800 dark:bg-slate-800/30 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-[10px] font-bold px-1.5 py-0 ${
                                    isWin ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                  }`}
                                >
                                  {isWin ? t('win') : t('loss')}
                                </Badge>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {game.title}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {game.venue?.name || 'Home Hardwood Court'} •{' '}
                                {new Date(game.startTime).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {homeScore} - {awayScore}
                                </span>
                              </div>
                              <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
                                <Link href={`/dashboard/admin/games/edit/${game._id}`}>
                                  Box Score
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Quarter / Period Breakdown preview */}
                          {Array.isArray(game.gameResult?.periodScores) && game.gameResult.periodScores.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                {t('periodBreakdown')}:
                              </p>
                              <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                                {game.gameResult.periodScores.map((ps) => (
                                  <div key={ps.period} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                    <span className="text-[10px] text-slate-400 block">Q{ps.period}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {ps.homeScore} - {ps.awayScore}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center py-8 text-sm text-slate-500">
                      {t('noRecentGames')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Match Insights */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Season Match Telemetry
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Total Games Logged</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {performanceStats.totalMatches}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Offensive Output</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {performanceStats.totalPointsScored} pts ({performanceStats.avgPpg} PPG)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Defensive Allowed</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {performanceStats.totalPointsAllowed} pts ({performanceStats.avgOppPpg} PPG)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Home Court Record</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {performanceStats.homeWins} - {performanceStats.homeLosses}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-500">Away Fixture Record</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {performanceStats.awayWins} - {performanceStats.awayLosses}
                    </span>
                  </div>
                </div>

                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs">
                  <Link href="/dashboard/admin/games">
                    Full Match Center Directory <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: FACILITIES & VENUES */}
        <TabsContent value="facilities" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Operational Venues List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t('trainingVenues')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('trainingVenuesDesc')}
                    </p>
                  </div>

                  <Button asChild size="sm" variant="outline" className="text-xs shadow-xs">
                    <Link href="/dashboard/admin/venues">
                      <MapPin className="mr-1.5 h-3.5 w-3.5 text-rose-500" /> Manage Venues
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {venueList.map((venue) => {
                    const bookedEvents = eventList.filter(
                      (e) =>
                        e.venue?._id === venue._id ||
                        (typeof e.venue === 'string' && e.venue === venue._id) ||
                        e.venue?.name === venue.name
                    );

                    return (
                      <div
                        key={venue._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-800/40"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {venue.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                            {venue.address}
                          </p>
                        </div>

                        <div className="text-left sm:text-right pl-6 sm:pl-0">
                          <Badge variant="outline" className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30">
                            {t('sessionsCount', { count: bookedEvents.length })}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Event Type Distribution */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Calendar Event Distribution
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">Competitive Matches</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">{eventCounts.matches}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${eventList.length > 0 ? (eventCounts.matches / eventList.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">Team Practices</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{eventCounts.practices}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${eventList.length > 0 ? (eventCounts.practices / eventList.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">Individual Skill Sessions</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">{eventCounts.individuals}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{
                          width: `${eventList.length > 0 ? (eventCounts.individuals / eventList.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button asChild variant="outline" className="w-full text-xs font-semibold">
                    <Link href="/dashboard/admin/calendar">
                      Open Master Interactive Calendar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Dashboard;
