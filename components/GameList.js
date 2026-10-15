'use client';

import { useEffect, useState, useMemo } from 'react';
import Loader from '@/components/Loader';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trophy, Calendar, MapPin, Edit3, Trash2, MoreHorizontal as LuMoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useIsAdmin } from '@/hooks/use-is-admin';

export default function GameList() {
  const t = useTranslations('Games');
  const isAdmin = useIsAdmin();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameToDelete, setGameToDelete] = useState(null);
  const router = useRouter();
  const fetchGames = async () => {
    try {
      setLoading(true);
      // Games are summarized server-side from game events (scores already from our side)
      const res = await fetch('/api/admin/games');
      if (!res.ok) throw new Error('Failed to load games');
      const data = await res.json();

      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const isGameCompleted = (g) => {
    if (g.status === 'completed') return true;
    if (g.status === 'scheduled') return false;
    return g.score?.ourTeam !== null && g.score?.opponentTeam !== null;
  };

  const pastGames = useMemo(() => {
    return games
      .filter((g) => isGameCompleted(g))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [games]);

  const futureGames = useMemo(() => {
    return games
      .filter((g) => !isGameCompleted(g))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games]);

  const handleDeleteGame = async () => {
    if (!gameToDelete) return;
    try {
      const res = await fetch(`/api/admin/games/${gameToDelete._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGames((prev) => prev.filter((g) => g._id !== gameToDelete._id));
      }
    } catch (err) {
      console.error('Failed to delete game:', err);
    } finally {
      setGameToDelete(null);
    }
  };

  const handleEdit = (game) => {
    router.push(`/dashboard/admin/games/edit/${game._id}`);
  };

  const renderGameCard = (game, isPast) => {
    const isHome = game.location === 'Home';
    const ourScore = game.score?.ourTeam;
    const oppScore = game.score?.opponentTeam;
    const isWin = ourScore !== null && oppScore !== null && ourScore > oppScore;
    const isTie = ourScore !== null && oppScore !== null && ourScore === oppScore;

    return (
      <div
        key={game._id}
        className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        {/* Header row: Date, Venue, Status, Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {new Date(game.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>&bull;</span>
            <span className="font-mono">{game.startTime || '18:00'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {game.location === 'Away' ? t('away') : t('home')}
            </span>

            {isPast ? (
              <StatusBadge
                status="completed"
                label={isWin ? 'Won' : isTie ? 'Draw' : 'Lost'}
                variant={isWin ? 'success' : isTie ? 'warning' : 'destructive'}
              />
            ) : new Date(game.endDate || game.date) < new Date() ? (
              // Played but no final score recorded yet
              <StatusBadge status="pending" label={t('awaitingResult')} variant="warning" />
            ) : (
              <StatusBadge status="scheduled" label={t('scheduled')} variant="info" />
            )}

            {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400">
                  <LuMoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl">
                <DropdownMenuItem onClick={() => handleEdit(game)} className="cursor-pointer text-xs">
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> {t('editGame')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setGameToDelete(game)}
                  className="cursor-pointer text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('deleteGame') || 'Delete Match'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </div>
        </div>

        {/* Teams & Score Row */}
        <div className="py-4 flex items-center justify-between gap-4">
          {/* Home / Academy Team */}
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isHome ? t('home') : t('away')}
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {game.team?.name || 'BBA Team'}
            </p>
          </div>

          {/* Score / VS Center */}
          <div className="shrink-0 text-center px-4">
            {isPast ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                  {ourScore}
                </span>
                <span className="text-slate-400 font-bold">-</span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">
                  {oppScore}
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                VS
              </span>
            )}
          </div>

          {/* Opponent Team */}
          <div className="flex-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isHome ? t('away') : t('home')}
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {game.opponent || 'Opponent'}
            </p>
          </div>
        </div>

        {/* Footer Venue */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{game.venue || 'BBA Main Court'}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        Error loading games: {error}
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upcoming Fixtures */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t('scheduled')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('matchCenterSubtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {futureGames.length > 0 ? (
            futureGames.map((game) => renderGameCard(game, false))
          ) : (
            <EmptyState
              icon={Calendar}
              title={t('noGames')}
              description={t('noGamesDesc')}
            />
          )}
        </div>
      </div>

      {/* Match Results */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t('completed')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('final')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {pastGames.length > 0 ? (
            pastGames.map((game) => renderGameCard(game, true))
          ) : (
            <EmptyState
              icon={Trophy}
              title={t('noGames')}
              description={t('noGamesDesc')}
            />
          )}
        </div>
      </div>
    </div>

    <AlertDialog open={Boolean(gameToDelete)} onOpenChange={(open) => !open && setGameToDelete(null)}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle') || 'Confirm Deletion'}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirmDesc') || 'Are you sure you want to delete this game fixture? This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">{t('cancel') || 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteGame}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
          >
            {t('deleteGame') || 'Delete Match'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
