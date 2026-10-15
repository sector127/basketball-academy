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
  Users,
  Calendar,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Mail,
  ExternalLink,
  Shield,
  Activity,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import Loader from '@/components/Loader';
import MyPlayersSection from '@/components/portal/MyPlayersSection';

interface GuardianPortalEvent {
  _id: string;
  eventType: string;
  title: string;
  startTime?: string | Date;
  endTime?: string | Date;
  venue?: { name?: string; address?: string };
  location?: string;
  team?: { name?: string };
  opponent?: string;
}

interface GuardianPortalCoach {
  _id: string;
  name: string;
  lastName: string;
  email: string;
}

const fetcher = <T,>(url: string): Promise<T[]> => fetch(url).then((res) => (res.ok ? res.json() : []));

export default function GuardianPortalPage() {
  const t = useTranslations('GuardianPortal');
  const { data: eventsData, isLoading: eventsLoading } = useSWR<GuardianPortalEvent[]>('/api/admin/events', fetcher);
  const { data: venuesData } = useSWR('/api/admin/venues', fetcher);
  const { data: coachesData } = useSWR<GuardianPortalCoach[]>('/api/admin/coaches', fetcher);
  const events = Array.isArray(eventsData) ? eventsData : [];
  const venues = Array.isArray(venuesData) ? venuesData : [];
  const coaches = Array.isArray(coachesData) ? coachesData : [];

  const now = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.endTime || e.startTime || now) >= now)
    .sort((a, b) => new Date(a.startTime || now).getTime() - new Date(b.startTime || now).getTime());

  return (
    <DashboardLayout>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        badge={t('badge')}
        icon={Users}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link href="/dashboard/guardian/calendar">
              <Calendar className="mr-1.5 h-3.5 w-3.5" /> {t('academyCalendar')}
            </Link>
          </Button>
        }
      />

      {/* Each linked child's profile, attendance, schedule and stats */}
      <MyPlayersSection role="guardian" />

      {/* Academy-wide overview */}
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Scheduled Sessions"
          value={upcomingEvents.length}
          icon={Calendar}
          accent="gold"
          trend="Upcoming this month"
          trendType="neutral"
        />
        <StatCard
          title="Academy Venues"
          value={venues.length}
          icon={MapPin}
          accent="blue"
          trend="Certified courts in Tbilisi"
          trendType="neutral"
        />
        <StatCard
          title="Coaching Staff"
          value={coaches.length}
          icon={ShieldCheck}
          accent="emerald"
          trend="Certified trainers"
          trendType="neutral"
        />
        <StatCard
          title="Academy Helpline"
          value="+995 32 200 00"
          icon={Phone}
          accent="purple"
          trend="Parent support"
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
                  Upcoming Practice & Game Schedule
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {upcomingEvents.length} Events Scheduled
              </span>
            </div>

            {eventsLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No upcoming events scheduled at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 6).map((ev: GuardianPortalEvent) => {
                  const isGame = ev.eventType === 'game';
                  const dateStr = ev.startTime
                    ? new Date(ev.startTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'TBD';
                  const timeStr = ev.startTime
                    ? new Date(ev.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '18:00';

                  const locationName = ev.venue?.name || ev.location || 'BBA Court';
                  const locationAddress = ev.venue?.address || ev.location || 'Tbilisi, Georgia';

                  return (
                    <div
                      key={ev._id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${isGame ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {isGame ? <Trophy className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {ev.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Clock className="h-3 w-3 text-slate-400" /> {dateStr} &bull; {timeStr}
                            </p>
                          </div>
                        </div>

                        <StatusBadge
                          status={isGame ? 'completed' : 'scheduled'}
                          label={isGame ? 'Game' : 'Practice'}
                          variant={isGame ? 'gold' : 'info'}
                        />
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{locationName} &bull; {locationAddress}</span>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1 self-start sm:self-auto text-[11px]"
                        >
                          Directions <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Staff & Safety Contacts (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Academy Coaching Staff
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reach out directly to certified squad trainers and player development mentors regarding training attendance or athletic concerns.
            </p>

            <div className="space-y-3 pt-1">
              {coaches.slice(0, 3).map((coach: GuardianPortalCoach) => (
                <div
                  key={coach._id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 space-y-1"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Coach {coach.name} {coach.lastName}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span className="font-mono">{coach.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" /> Athlete Safety Policy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Certified medical trainers and ice baths are available on-site at all official BBA facilities. Parents are welcome at all open scrimmage sessions.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
