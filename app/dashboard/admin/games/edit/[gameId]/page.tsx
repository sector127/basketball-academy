'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import GameForm, { type GameFormInitialValues } from '@/components/GameForm';
import GameBoxScoreEditor from '@/components/GameBoxScoreEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import useSWR from 'swr';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

export interface EditGameFormData {
  team: string;
  opponent: string;
  startTime: string;
  endTime: string;
  venue?: string;
  location?: string;
  isAwayGame?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface EditGameResponse extends GameFormInitialValues {
  _id: string;
}

export default function EditGamePage() {
  const t = useTranslations('Games');
  const routeParams = useParams();
  const gameId = typeof routeParams?.gameId === 'string' ? routeParams.gameId : '';
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue } = useForm<EditGameFormData>();
  const { data: game, error, isLoading } = useSWR<EditGameResponse | null>(
    gameId ? `/api/admin/games/${gameId}` : null,
    fetcher
  );

  const onSubmit: SubmitHandler<EditGameFormData> = async (formData) => {
    try {
      setSubmitting(true);
      const isAway = Boolean(formData.isAwayGame);

      const payload = {
        team: formData.team,
        opponent: formData.opponent,
        startTime: formData.startTime ? new Date(formData.startTime) : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        venue: isAway ? undefined : formData.venue || undefined,
        location: isAway ? formData.location || 'Away' : 'Home',
        isAwayGame: isAway,
        description: formData.description,
      };

      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err: { error?: string } = await res.json();
        throw new Error(err.error || 'Failed to update game fixture');
      }

      toast({
        title: 'Match Updated',
        description: 'Match fixture details updated successfully.',
      });

      router.push('/dashboard/admin/games');
    } catch (err: unknown) {
      toast({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageHeader title="Edit Match Fixture" subtitle="Loading game telemetry..." />
        <Loader />
      </DashboardLayout>
    );
  }

  if (error || !game) {
    return (
      <DashboardLayout>
        <PageHeader title="Match Not Found" subtitle="Unable to load fixture details" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Fixture record does not exist or has been removed.
        </div>
      </DashboardLayout>
    );
  }

  const teamId =
    typeof game.team === 'object' && game.team !== null
      ? game.team._id || ''
      : (game.team as string) || '';

  return (
    <DashboardLayout>
      <PageHeader
        title={t('editGame')}
        subtitle="Modify opponent matchup, arena assignment, and scheduled time"
        badge="Edit Mode"
        icon={Trophy}
        actions={
          <Button asChild variant="outline" size="sm" className="shadow-sm">
            <Link href="/dashboard/admin/games">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> {t('backToGames')}
            </Link>
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <Tabs defaultValue="fixture" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <TabsTrigger value="fixture" className="rounded-lg text-xs font-semibold">
              Fixture & Schedule
            </TabsTrigger>
            <TabsTrigger value="boxscore" className="rounded-lg text-xs font-semibold">
              Box Score & Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fixture">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <GameForm register={register} setValue={setValue} initialValues={game} />

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/admin/games">{t('cancel')}</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm rounded-xl"
                  >
                    {submitting ? '...' : t('updateGame')}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="boxscore">
            <GameBoxScoreEditor
              gameId={gameId}
              teamId={teamId}
              opponentName={game.opponent}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
