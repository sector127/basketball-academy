'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import GameList from '@/components/GameList';
import { PageHeader } from '@/components/ui/page-header';
import { Trophy } from 'lucide-react';

export default function CoachGamesPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Squad Matches & Fixtures"
        subtitle="Upcoming championship games, match results, and box score telemetry"
        badge="Competitive Season"
        icon={Trophy}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <GameList />
      </div>
    </DashboardLayout>
  );
}
