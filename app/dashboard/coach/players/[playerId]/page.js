'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import Image from 'next/image';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  User,
  ArrowLeft,
  Shield,
  Phone,
  MapPin,
  Calendar,
  Ruler,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function CoachPlayerDetailsPage({ params }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { playerId } = React.use(params);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlayer() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/players/${playerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch player details');
        }
        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        console.error('Error fetching player:', err);
        setError(err.message);
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
        <PageHeader title="Player Profile" subtitle="Loading athlete telemetry..." />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error || !player) {
    return (
      <DashboardLayout>
        <PageHeader title="Player Not Found" subtitle="Unable to load requested athlete" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error || 'Player record does not exist or has been removed.'}
        </div>
      </DashboardLayout>
    );
  }

  const teamName = player.team?.name || (typeof player.team === 'string' ? player.team : 'Unassigned');

  return (
    <DashboardLayout>
      <PageHeader
        title={`${player.name} ${player.lastname}`}
        subtitle={`Athlete in ${teamName} roster`}
        badge={`Jersey #${player.jerseyNum ?? 'XX'}`}
        icon={User}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link href="/dashboard/coach/players">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Squad
              </Link>
            </Button>
            {player.team?._id && (
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
                <Link href={`/dashboard/coach/teams/${player.team._id}`}>
                  View Court <Star className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
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
                label={player.isActive ? 'Active Athlete' : 'Disabled'}
                variant={player.isActive ? 'success' : 'destructive'}
              />
              {player.isFirstTeam && (
                <StatusBadge status="firstTeam" label="First Team Starter" variant="gold" />
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
              title="Jersey"
              value={`#${player.jerseyNum ?? '--'}`}
              description="Roster number"
              accent="gold"
            />
            <StatCard
              title="Height"
              value={`${player.height ?? '--'} cm`}
              description="Verified metric"
              accent="blue"
            />
            <StatCard
              title="Age"
              value={player.age ?? '--'}
              description={
                player.dateOfBirth
                  ? new Date(player.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                  : 'DOB verified'
              }
              accent="emerald"
            />
            <StatCard
              title="Position"
              value={player.position?.split(' ')[0] ?? 'Player'}
              description={player.position ?? 'Court role'}
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
                  Emergency & Contact Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct telephone and family emergency contacts
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
                <p className="text-xs text-slate-500">Direct athlete phone</p>
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
    </DashboardLayout>
  );
}
