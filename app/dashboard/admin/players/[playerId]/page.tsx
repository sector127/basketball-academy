'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import PlayerStatsTelemetry from '@/components/PlayerStatsTelemetry';
import Image from 'next/image';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import {
  User,
  ArrowLeft,
  Edit2,
  Shield,
  Phone,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export interface PlayerDetails {
  _id: string;
  name: string;
  lastname: string;
  jerseyNum?: number | string;
  position?: string;
  isActive?: boolean;
  isFirstTeam?: boolean;
  team?: { _id?: string; name?: string } | string;
  address?: string;
  height?: number;
  age?: number;
  dateOfBirth?: string | Date;
  tel?: string;
  guardian?: string;
  guardianTel?: string;
  profilePicture?: string;
}

export default function AdminPlayerDetailsPage() {
  const t = useTranslations('Players');
  const routeParams = useParams();
  const playerId = typeof routeParams?.playerId === 'string' ? routeParams.playerId : '';
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlayer() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/players/${playerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch player details');
        }
        const data: PlayerDetails = await response.json();
        setPlayer(data);
      } catch (err: unknown) {
        console.error('Error fetching player:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (playerId) {
      fetchPlayer();
    }
  }, [playerId]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title={t('playerProfile')} subtitle={t('profileSubtitle')} />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error || !player) {
    return (
      <DashboardLayout>
        <PageHeader title={t('playerNotFound')} subtitle={t('playerNotFoundSubtitle')} />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error || t('playerNotFoundSubtitle')}
        </div>
      </DashboardLayout>
    );
  }

  const teamName =
    typeof player.team === 'object' && player.team !== null
      ? player.team.name || 'Unassigned'
      : typeof player.team === 'string'
      ? player.team
      : 'Unassigned';

  return (
    <DashboardLayout>
      <PageHeader
        title={`${player.name} ${player.lastname}`}
        subtitle={`Registered athlete in ${teamName} squad`}
        badge={`Jersey #${player.jerseyNum ?? 'XX'}`}
        icon={User}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link href="/dashboard/admin/players">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('backToPlayers')}
              </Link>
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/admin/players/edit/${playerId}`)}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm"
            >
              <Edit2 className="mr-1.5 h-4 w-4" /> {t('edit')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card with Photo */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 text-center">
            <div className="relative mx-auto h-52 w-52 overflow-hidden rounded-2xl border-2 border-amber-500/20 shadow-lg mb-4">
              <Image
                src={player.profilePicture || '/uploads/1739040439615-U18_Player.png'}
                alt={`${player.name} ${player.lastname}`}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {player.name} {player.lastname}
              </h2>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {player.position}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <StatusBadge
                status={player.isActive ? 'active' : 'disabled'}
                label={player.isActive ? t('active') : t('inactive')}
                variant={player.isActive ? 'success' : 'destructive'}
              />
              {player.isFirstTeam && (
                <StatusBadge status="firstTeam" label={t('firstTeam')} variant="gold" />
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-500" /> Team
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{teamName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" /> Address
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                  {player.address || 'Tbilisi, Georgia'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Physical Metrics & Guardian Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title={t('jerseyNum')}
              value={`#${player.jerseyNum ?? '--'}`}
              description=""
              accent="gold"
            />
            <StatCard
              title={t('height')}
              value={`${player.height ?? '--'} cm`}
              description=""
              accent="blue"
            />
            <StatCard
              title={t('dateOfBirth')}
              value={player.age ?? '--'}
              description={
                player.dateOfBirth
                  ? new Date(player.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                  : ''
              }
              accent="emerald"
            />
            <StatCard
              title={t('position')}
              value={player.position?.split(' ')[0] ?? 'Player'}
              description={player.position ?? ''}
              accent="purple"
            />
          </div>

          {/* Contact & Guardian Information Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('emergencyContact')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('guardianPhone')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-800/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Player Contact
                </span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                  {player.tel || 'Not provided'}
                </p>
                <p className="text-xs text-slate-500">Athlete direct line</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-800/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Guardian ({player.guardian || 'Parent'})
                </span>
                <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                  {player.guardianTel || 'Not provided'}
                </p>
                <p className="text-xs text-slate-500">Emergency authorized guardian</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career & Season Telemetry */}
      <div className="mt-8">
        <PlayerStatsTelemetry playerId={playerId} />
      </div>
    </DashboardLayout>
  );
}
