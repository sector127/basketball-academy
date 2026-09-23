'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { PiCourtBasketballBold } from 'react-icons/pi';

interface DashboardEvent {
  _id: string;
  title: string;
  eventType: string;
  startTime: string | Date;
  endTime: string | Date;
  location?: string;
  venue?: { name: string };
  gameResult?: {
    homeTeamScore: number;
    awayTeamScore: number;
    status: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : []));

const Dashboard: NextPage = () => {
  const t = useTranslations('Dashboard');

  const { data: players } = useSWR<unknown[]>('/api/admin/players', fetcher);
  const { data: teams } = useSWR<unknown[]>('/api/admin/teams', fetcher);
  const { data: events } = useSWR<DashboardEvent[]>('/api/admin/events', fetcher);
  const { data: venues } = useSWR<unknown[]>('/api/admin/venues', fetcher);

  const playerCount = Array.isArray(players) ? players.length : 0;
  const teamCount = Array.isArray(teams) ? teams.length : 0;
  const venueCount = Array.isArray(venues) ? venues.length : 0;
  const eventList: DashboardEvent[] = Array.isArray(events) ? events : [];

  const upcomingEvents = eventList
    .filter((e) => new Date(e.startTime) >= new Date())
    .slice(0, 4);

  const recentGames = eventList
    .filter((e) => e.eventType === 'game' && e.gameResult)
    .slice(0, 3);
  return (
    <DashboardLayout>
      <PageHeader
        title="Academy Operations"
        subtitle="Live roster telemetry, upcoming fixtures, and academy performance overview"
        badge="Active Season"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
              <Link href="/dashboard/admin/players/create">
                <UserPlus className="mr-1.5 h-4 w-4" /> Add Player
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link href="/dashboard/admin/games/create">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Schedule Game
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Players"
          value={playerCount}
          icon={Users}
          description="Active academy athletes"
          trend="+100% active"
          trendType="positive"
          accent="gold"
        />
        <StatCard
          title="Active Teams"
          value={teamCount}
          icon={Shield}
          description="Competitive rosters"
          trend="U18 & U16 squads"
          trendType="neutral"
          accent="blue"
        />
        <StatCard
          title="Academy Events"
          value={eventList.length}
          icon={Trophy}
          description="Games & practices scheduled"
          trend="Regular season"
          trendType="positive"
          accent="emerald"
        />
        <StatCard
          title="Training Venues"
          value={venueCount}
          icon={MapPin}
          description="Operational arenas in Tbilisi"
          trend="Saburtalo & Vake"
          trendType="neutral"
          accent="purple"
        />
      </div>

      {/* Main Grid: Upcoming Schedule & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left 2 Cols: Upcoming Schedule & Recent Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Schedule Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Upcoming Schedule
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Next matches and practice sessions
                  </p>
                </div>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Link href="/dashboard/admin/calendar">
                  View Full Calendar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any) => (
                  <div
                    key={event._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:border-amber-500/30 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={event.eventType === 'game' ? 'scheduled' : 'active'}
                          label={event.eventType}
                          variant={event.eventType === 'game' ? 'gold' : 'info'}
                        />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {event.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {event.venue?.name || event.location || 'BBA Arena'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(event.startTime).toLocaleDateString('en-US', {
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
                  No upcoming events scheduled.
                </p>
              )}
            </div>
          </div>

          {/* Recent Games Performance Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Latest Match Results
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recent games and official scores
                  </p>
                </div>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Link href="/dashboard/admin/games">
                  All Games <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {recentGames.length > 0 ? (
                recentGames.map((game: any) => (
                  <div
                    key={game._id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-800/40"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {game.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {game.venue?.name || 'Home Arena'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">
                          {game.gameResult?.homeTeamScore ?? 0} - {game.gameResult?.awayTeamScore ?? 0}
                        </span>
                      </div>
                      <StatusBadge status="completed" label="Final" variant="success" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No completed game results recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Launchpad Modules */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Operations Hub
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Quick access to administrative tools
            </p>

            <div className="space-y-2.5">
              {[
                {
                  href: '/dashboard/admin/teams',
                  title: 'Manage Teams',
                  desc: 'Roster lineups and team assignments',
                  icon: Shield,
                  color: 'text-blue-500 bg-blue-500/10',
                },
                {
                  href: '/dashboard/admin/players',
                  title: 'Players Directory',
                  desc: 'Stats, medicals, and contact information',
                  icon: Users,
                  color: 'text-amber-500 bg-amber-500/10',
                },
                {
                  href: '/dashboard/admin/games',
                  title: 'Game Center',
                  desc: 'Match scheduling and box scores',
                  icon: Trophy,
                  color: 'text-emerald-500 bg-emerald-500/10',
                },
                {
                  href: '/dashboard/admin/calendar',
                  title: 'Academy Calendar',
                  desc: 'Court bookings and daily schedules',
                  icon: Calendar,
                  color: 'text-purple-500 bg-purple-500/10',
                },
                {
                  href: '/dashboard/admin/venues',
                  title: 'Venues & Courts',
                  desc: 'Gym availability and facilities',
                  icon: MapPin,
                  color: 'text-rose-500 bg-rose-500/10',
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-3.5 rounded-xl border border-slate-100 p-3 transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/60"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
