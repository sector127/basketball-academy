'use client';

import { useEffect, useState } from 'react';
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
import { LuMoreHorizontal } from 'react-icons/lu';
import { Trophy, Calendar, MapPin, Edit3, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchGames = async () => {
    try {
      setLoading(true);
      // Try /api/admin/games first
      let res = await fetch('/api/admin/games');
      let data = [];

      if (res.ok) {
        data = await res.json();
      }

      // If no games from /api/admin/games, fetch from /api/admin/events
      if (!Array.isArray(data) || data.length === 0) {
        const eventsRes = await fetch('/api/admin/events');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          if (Array.isArray(eventsData)) {
            data = eventsData
              .filter((e) => e.eventType === 'game')
              .map((e) => ({
                _id: e._id,
                date: e.startTime,
                startTime: new Date(e.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                team: e.team || { name: 'BBA Team' },
                opponent: e.opponent || 'Opponent',
                venue: e.venue?.name || e.location || 'BBA Court',
                location: e.isAwayGame ? 'Away' : 'Home',
                score: {
                  ourTeam: e.gameResult?.homeTeamScore ?? null,
                  opponentTeam: e.gameResult?.awayTeamScore ?? null,
                },
              }));
          }
        }
      }

      setGames(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const today = new Date();
  const pastGames = games.filter(
    (g) => g.score?.ourTeam !== null && g.score?.opponentTeam !== null
  );
  const futureGames = games.filter(
    (g) => g.score?.ourTeam === null || g.score?.opponentTeam === null
  );

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
              {game.location || 'Home'}
            </span>

            {isPast ? (
              <StatusBadge
                status="completed"
                label={isWin ? 'Won' : isTie ? 'Draw' : 'Lost'}
                variant={isWin ? 'success' : isTie ? 'warning' : 'destructive'}
              />
            ) : (
              <StatusBadge status="scheduled" label="Scheduled" variant="info" />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400">
                  <LuMoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl">
                <DropdownMenuItem onClick={() => handleEdit(game)} className="cursor-pointer text-xs">
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit Match
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Teams & Score Row */}
        <div className="py-4 flex items-center justify-between gap-4">
          {/* Home / Academy Team */}
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isHome ? 'Home' : 'Away'}
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
              {isHome ? 'Away' : 'Home'}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upcoming Fixtures */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Upcoming Fixtures
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scheduled regular and tournament games
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {futureGames.length > 0 ? (
            futureGames.map((game) => renderGameCard(game, false))
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming fixtures"
              description="Schedule the next match for your academy squads."
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
              Match Results
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Final scores and box results
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {pastGames.length > 0 ? (
            pastGames.map((game) => renderGameCard(game, true))
          ) : (
            <EmptyState
              icon={Trophy}
              title="No match results yet"
              description="Completed games with final scores will be displayed here."
            />
          )}
        </div>
      </div>
    </div>
  );
}
