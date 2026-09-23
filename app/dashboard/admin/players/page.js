'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { columns } from '@/app/dashboard/admin/players/columns';
import { DataTable } from '@/components/DataTable';
import Loader from '@/components/Loader';
import useSWR, { mutate } from 'swr';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const fetcher = (url) => fetch(url).then((res) => (res.ok ? res.json() : []));

export default function PlayersPage() {
  const [context] = React.useState('players');
  const { data: players, error, isLoading } = useSWR('/api/admin/players', fetcher);

  const handleDataChange = async () => {
    await mutate('/api/admin/players');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Players Directory" subtitle="Loading academy player database..." />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Players Directory" subtitle="Error loading players" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  const playerList = Array.isArray(players) ? players : [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Players Directory"
        subtitle="Manage athlete registrations, physical metrics, emergency contacts, and active status"
        badge={`${playerList.length} Active Players`}
        icon={Users}
        actions={
          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm">
            <Link href="/dashboard/admin/players/create">
              <Plus className="mr-1.5 h-4 w-4" /> Add Player
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <DataTable
          columns={columns(playerList, context)}
          data={playerList}
          onDataChange={handleDataChange}
          context="players"
        />
      </div>
    </DashboardLayout>
  );
}
