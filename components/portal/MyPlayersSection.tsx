'use client';

import React from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import { Activity, Calendar, CheckCircle2, Clock, HeartPulse, Link2, MapPin, Trophy } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import PlayerStatsTelemetry from '@/components/PlayerStatsTelemetry';
import Loader from '@/components/Loader';

interface UpcomingEvent {
  _id: string;
  title: string;
  eventType: 'game' | 'practice' | 'individualTraining';
  startTime: string;
  endTime: string;
  opponent?: string;
  isAwayGame?: boolean;
  location?: string;
  venue?: { name: string; address?: string } | null;
}

interface LinkedPlayer {
  _id: string;
  name: string;
  lastname: string;
  jerseyNum?: number;
  position?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  injuryStatus?: string;
  injuryNotes?: string;
  isActive?: boolean;
  isFirstTeam?: boolean;
  team?: { _id: string; name: string } | null;
  upcomingEvents: UpcomingEvent[];
  attendance: { present: number; absent: number; excused: number; injured: number; tracked: number; rate: number | null };
}

interface MeResponse {
  players: LinkedPlayer[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

function getAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age -= 1;
  return age;
}

/**
 * Overview of the player records linked to the signed-in player/guardian account.
 */
export default function MyPlayersSection({ role }: { role: 'player' | 'guardian' }) {
  const t = useTranslations('Portal');
  const locale = useLocale();
  const { data, error, isLoading } = useSWR<MeResponse>('/api/me', fetcher);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <p className="mb-6 text-sm text-rose-600">{t('loadFailed')}</p>;
  }

  const players = data?.players || [];
  if (players.length === 0) {
    return (
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('notLinkedTitle')}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {role === 'guardian' ? t('notLinkedGuardian') : t('notLinkedPlayer')}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mb-10 space-y-10">
      {players.map((player) => {
        const age = getAge(player.dateOfBirth);
        const isInjured = player.injuryStatus && player.injuryStatus !== 'Healthy';
        return (
          <section key={player._id} className="space-y-5">
            {/* Profile header */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-500/30">
                <Image
                  src={player.profilePicture || '/uploads/default-profile-picture.jpg'}
                  alt={`${player.name} ${player.lastname}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {player.name} {player.lastname}
                  {player.jerseyNum !== undefined && <span className="ml-2 font-mono text-amber-600">#{player.jerseyNum}</span>}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[player.team?.name, player.position, age !== null ? t('age', { age }) : null].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {player.isFirstTeam && <StatusBadge status="firstTeam" label={t('starter')} variant="gold" />}
                  {player.isActive === false && <StatusBadge status="disabled" label={t('inactive')} variant="destructive" />}
                  <StatusBadge
                    status={isInjured ? 'injured' : 'healthy'}
                    label={isInjured ? player.injuryStatus : t('healthy')}
                    variant={isInjured ? 'warning' : 'success'}
                  />
                </div>
                {isInjured && player.injuryNotes && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{player.injuryNotes}</p>
                )}
              </div>
            </div>

            {/* Attendance */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                title={t('attendanceRate')}
                value={player.attendance.rate !== null ? `${player.attendance.rate}%` : '—'}
                icon={CheckCircle2}
                accent="emerald"
                trend={t('sessionsTracked', { count: player.attendance.tracked })}
                trendType="neutral"
              />
              <StatCard title={t('present')} value={player.attendance.present} icon={Activity} accent="blue" />
              <StatCard title={t('missed')} value={player.attendance.absent + player.attendance.excused} icon={Clock} accent="purple" />
              <StatCard title={t('injuredSessions')} value={player.attendance.injured} icon={HeartPulse} accent="rose" />
            </div>

            {/* Upcoming sessions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Calendar className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {t('upcomingFor', { name: player.name })}
                </h3>
              </div>
              {player.upcomingEvents.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">{t('noUpcoming')}</p>
              ) : (
                <ul className="space-y-2.5">
                  {player.upcomingEvents.map((ev) => {
                    const isGame = ev.eventType === 'game';
                    return (
                      <li
                        key={ev._id}
                        className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-xl p-2 ${isGame ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {isGame ? <Trophy className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{ev.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3" /> {formatDate(ev.startTime)} · {formatTime(ev.startTime)}–{formatTime(ev.endTime)}
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
                          status={ev.eventType}
                          label={isGame ? (ev.isAwayGame ? t('awayGame') : t('homeGame')) : ev.eventType === 'practice' ? t('practice') : t('skills')}
                          variant={isGame ? 'gold' : 'info'}
                          dot={false}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Season stats from recorded box scores */}
            <PlayerStatsTelemetry playerId={player._id} />
          </section>
        );
      })}
    </div>
  );
}
