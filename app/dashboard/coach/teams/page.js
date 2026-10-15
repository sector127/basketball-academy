'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EntityCard } from '@/components/ui/entity-card';
import { EmptyState } from '@/components/ui/empty-state';
import Loader from '@/components/Loader';
import { motion } from 'framer-motion';
import { Shield, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CoachTeamsPage() {
  const t = useTranslations('CoachDashboard');
  const tTeams = useTranslations('Teams');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/coach/teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="My Teams" subtitle="Competitive basketball squads under your guidance" />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="My Teams" subtitle="Competitive basketball squads under your guidance" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={t('assignedTeams')}
        subtitle={t('assignedTeamsDesc')}
        badge={`${teams.length} ${tTeams('title')}`}
        icon={Shield}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <EntityCard
                key={team._id}
                title={team.name}
                subtitle={team.description}
                badge="Active Roster"
                href={`/dashboard/coach/teams/${team._id}`}
                actions={
                  <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-sm w-full">
                    <Link href={`/dashboard/coach/teams/${team._id}`}>
                      {tTeams('viewRoster')} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title="No teams assigned"
            description="You do not have any teams assigned to your coach profile yet."
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
