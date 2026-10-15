'use client';

import React from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Calendar,
  Activity,
  MapPin,
  Clock,
  BookOpen,
  ArrowRight,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import Loader from '@/components/Loader';
import MyPlayersSection from '@/components/portal/MyPlayersSection';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : []));

export default function PlayerPortalPage() {
  const t = useTranslations('PlayerPortal');
  const { data: eventsData, isLoading: eventsLoading } = useSWR('/api/admin/events', fetcher);
  const { data: teamsData } = useSWR('/api/admin/teams', fetcher);
  const events = Array.isArray(eventsData) ? eventsData : [];
  const teams = Array.isArray(teamsData) ? teamsData : [];

  const now = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.endTime || e.startTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const upcomingGames = upcomingEvents.filter((e) => e.eventType === 'game');
  const upcomingPractices = upcomingEvents.filter((e) => e.eventType === 'practice' || e.eventType === 'individualTraining');

  return (
    <DashboardLayout>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        badge={t('badge')}
        icon={User}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
              <Link href="/dashboard/player/calendar">
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> {t('fullCalendar')}
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
              <Link href="/dashboard/player/combinations">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> {t('tacticalPlaybook')}
              </Link>
            </Button>
          </div>
        }
      />

      {/* The player's own profile, attendance, schedule and stats */}
      <MyPlayersSection role="player" />

      {/* Academy-wide overview */}
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Upcoming Fixtures"
          value={upcomingGames.length}
          icon={Trophy}
          accent="gold"
          trend="Competitive games"
          trendType="neutral"
        />
        <StatCard
          title="Training Sessions"
          value={upcomingPractices.length}
          icon={Activity}
          accent="blue"
          trend="Practices scheduled"
          trendType="neutral"
        />
        <StatCard
          title="Academy Squads"
          value={teams.length}
          icon={Shield}
          accent="emerald"
          trend="Active teams"
          trendType="neutral"
        />
        <StatCard
          title="Season Status"
          value="In Progress"
          icon={Calendar}
          accent="purple"
          trend="2026 Championship"
          trendType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Events (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Upcoming Academy Itinerary
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {upcomingEvents.length} Sessions Scheduled
              </span>
            </div>

            {eventsLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No upcoming matches or training sessions scheduled this week.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 6).map((ev: any) => {
                  const isGame = ev.eventType === 'game';
                  const dateStr = ev.startTime
                    ? new Date(ev.startTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'TBD';
                  const timeStr = ev.startTime
                    ? new Date(ev.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '18:00';

                  return (
                    <div
                      key={ev._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl mt-0.5 ${isGame ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {isGame ? <Trophy className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" /> {dateStr} &bull; {timeStr}
                            </span>
                            {(ev.venue?.name || ev.location) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-amber-500" /> {ev.venue?.name || ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <StatusBadge
                        status={isGame ? 'completed' : 'scheduled'}
                        label={isGame ? 'Match' : 'Practice'}
                        variant={isGame ? 'gold' : 'info'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Resource Sidebar (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" /> Tactical Playbook
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Study starting combinations, inbound plays, and pick-and-roll movements designed by academy coaching staff.
            </p>
            <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
              <Link href="/dashboard/player/combinations">
                Open Animated Playbook <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" /> Training Facility
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">BBA Olympic Palace Arena</p>
              <p className="text-slate-500">6 University St, Saburtalo, Tbilisi</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                Locker room access 30 min before tip-off
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
