'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import GameForm from '@/components/GameForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateGamePage() {
  const { register, handleSubmit, setValue } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const isAway = Boolean(data.isAwayGame);

      const payload = {
        eventType: 'game',
        title: `Game vs ${data.opponent || 'Opponent'}`,
        team: data.team,
        opponent: data.opponent,
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime
          ? new Date(data.endTime)
          : new Date(Date.now() + 2 * 60 * 60 * 1000),
        venue: isAway ? undefined : data.venue || undefined,
        location: isAway ? data.location || 'Away Arena' : undefined,
        isAwayGame: isAway,
        description: data.description || '',
      };

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to schedule game');
      }

      toast({
        title: 'Game Scheduled',
        description: 'New match fixture has been scheduled successfully.',
      });

      router.push('/dashboard/admin/games');
    } catch (err) {
      toast({
        title: 'Scheduling Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Schedule Match Fixture"
        subtitle="Configure opposing team, arena venue, and scheduled tip-off time"
        badge="New Game"
        icon={Trophy}
        actions={
          <Button asChild variant="outline" size="sm" className="shadow-sm">
            <Link href="/dashboard/admin/games">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Match Center
            </Link>
          </Button>
        }
      />

      <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <GameForm register={register} setValue={setValue} />

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/games">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm"
            >
              {submitting ? 'Scheduling...' : 'Save Match Fixture'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
