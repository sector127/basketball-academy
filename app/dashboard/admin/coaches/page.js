'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import Loader from '@/components/Loader';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, User } from 'lucide-react';

export default function CoachesPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCoaches() {
      try {
        const response = await fetch('/api/admin/coaches');
        if (!response.ok) {
          throw new Error('Failed to fetch coaches');
        }
        const data = await response.json();
        setCoaches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCoaches();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Coaching Staff" subtitle="Loading academy trainers..." />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Coaching Staff" subtitle="Error loading staff" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Coaching Staff"
        subtitle="Certified trainers, squad tacticians, and player development mentors"
        badge={`${coaches.length} Coaches`}
        icon={ShieldCheck}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {coaches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {coaches.map((coach) => (
              <div
                key={coach._id}
                className="group relative flex flex-col items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="w-full flex justify-end">
                  <StatusBadge status="coach" label="Staff Coach" variant="gold" />
                </div>

                <div className="relative my-4 h-28 w-28 overflow-hidden rounded-2xl border-2 border-amber-500/20 shadow-md group-hover:scale-105 transition-transform duration-300">
                  {coach.image ? (
                    <Image
                      src={coach.image}
                      alt={`${coach.name} ${coach.lastName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {coach.name} {coach.lastName}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{coach.email}</span>
                  </div>
                </div>

                <div className="mt-5 w-full pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Brooklyn Basketball Academy
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No coaches registered"
            description="Add coaching staff to manage rosters and tactical trainings."
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
