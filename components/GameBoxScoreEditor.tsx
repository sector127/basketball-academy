'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Save, Users, Calculator, Hash, Clock } from 'lucide-react';

interface PlayerStat {
  minutesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

interface GameBoxScoreEditorProps {
  gameId: string;
  teamId?: string;
  opponentName?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null));

interface PeriodScore {
  period: number;
  homeScore: number;
  awayScore: number;
}

interface TeamPlayer {
  _id: string;
  name: string;
  lastname: string;
  jerseyNum: number | string;
  position: string;
}

interface BoxScoreEntry {
  player?: { _id?: string } | string;
  minutesPlayed?: number;
  points?: number;
  assists?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
}

interface GameResultData {
  gameResult?: {
    status?: string;
    homeTeamScore?: number;
    awayTeamScore?: number;
    periodScores?: PeriodScore[];
    boxScores?: BoxScoreEntry[];
  };
}

interface TeamDataResponse {
  data?: TeamPlayer[];
}

export default function GameBoxScoreEditor({ gameId, teamId, opponentName = 'Opponent' }: GameBoxScoreEditorProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing game result
  const { data: resultData, isLoading: resultLoading } = useSWR<GameResultData>(
    gameId ? `/api/admin/games/${gameId}/result` : null,
    fetcher
  );

  // Fetch team players
  const { data: teamData } = useSWR<TeamDataResponse>(
    teamId ? `/api/admin/teams/${teamId}` : null,
    fetcher
  );

  const players: TeamPlayer[] = Array.isArray(teamData?.data) ? teamData.data : [];

  const [status, setStatus] = useState('scheduled');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([
    { period: 1, homeScore: 0, awayScore: 0 },
    { period: 2, homeScore: 0, awayScore: 0 },
    { period: 3, homeScore: 0, awayScore: 0 },
    { period: 4, homeScore: 0, awayScore: 0 },
  ]);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});

  useEffect(() => {
    if (resultData?.gameResult) {
      const res = resultData.gameResult;
      setStatus(res.status || 'scheduled');
      setHomeScore(res.homeTeamScore ?? 0);
      setAwayScore(res.awayTeamScore ?? 0);

      if (Array.isArray(res.periodScores) && res.periodScores.length > 0) {
        setPeriodScores(res.periodScores);
      }

      if (Array.isArray(res.boxScores)) {
        const statsMap: Record<string, PlayerStat> = {};
        res.boxScores.forEach((b: BoxScoreEntry) => {
          const pId = typeof b.player === 'object' && b.player ? b.player._id : (typeof b.player === 'string' ? b.player : undefined);
          if (pId) {
            statsMap[pId] = {
              minutesPlayed: b.minutesPlayed || 0,
              points: b.points || 0,
              assists: b.assists || 0,
              rebounds: b.rebounds || 0,
              steals: b.steals || 0,
              blocks: b.blocks || 0,
              turnovers: b.turnovers || 0,
              fouls: b.fouls || 0,
            };
          }
        });
        setPlayerStats(statsMap);
      }
    }
  }, [resultData]);

  const handlePeriodChange = (index: number, field: 'homeScore' | 'awayScore', value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    const updated = [...periodScores];
    updated[index] = { ...updated[index], [field]: num };
    setPeriodScores(updated);

    // Auto-calculate home and away score totals
    const totalHome = updated.reduce((acc, curr) => acc + (curr.homeScore || 0), 0);
    const totalAway = updated.reduce((acc, curr) => acc + (curr.awayScore || 0), 0);
    setHomeScore(totalHome);
    setAwayScore(totalAway);
  };

  const handlePlayerStatChange = (playerId: string, field: keyof PlayerStat, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setPlayerStats((prev: Record<string, PlayerStat>) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {
          minutesPlayed: 0,
          points: 0,
          assists: 0,
          rebounds: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0,
        }),
        [field]: num,
      },
    }));
  };

  const calculateSum = (field: keyof PlayerStat) => {
    return Object.values(playerStats).reduce((acc: number, curr: PlayerStat) => acc + (curr[field] || 0), 0);
  };

  const totalPlayerPoints = calculateSum('points');

  const handleSaveBoxScore = async () => {
    setSubmitting(true);
    try {
      const boxScoresArray = Object.entries(playerStats).map(([pId, stats]: [string, PlayerStat]) => ({
        player: pId,
        minutesPlayed: stats.minutesPlayed || 0,
        points: stats.points || 0,
        assists: stats.assists || 0,
        rebounds: stats.rebounds || 0,
        steals: stats.steals || 0,
        blocks: stats.blocks || 0,
        turnovers: stats.turnovers || 0,
        fouls: stats.fouls || 0,
      }));

      const payload = {
        status,
        homeTeamScore: homeScore,
        awayTeamScore: awayScore,
        periodScores,
        boxScores: boxScoresArray,
      };

      const res = await fetch(`/api/admin/games/${gameId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save box score');
      }

      await mutate(`/api/admin/games/${gameId}/result`);
      toast({
        title: 'Box Score Saved',
        description: 'Match result and player performance stats recorded.',
        variant: 'default',
      });
    } catch (err: unknown) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quarter / Period Breakdown */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Final Score & Period Telemetry
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500">Status:</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs w-36 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Period Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 text-left font-semibold">Team</th>
                <th className="py-2 px-3 font-semibold">Q1</th>
                <th className="py-2 px-3 font-semibold">Q2</th>
                <th className="py-2 px-3 font-semibold">Q3</th>
                <th className="py-2 px-3 font-semibold">Q4</th>
                <th className="py-2 px-4 font-bold text-slate-900 dark:text-slate-100">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Home Team Row */}
              <tr className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="py-2.5 text-left font-bold text-slate-900 dark:text-slate-100">
                  Brooklyn Academy (Home)
                </td>
                {periodScores.map((p, idx) => (
                  <td key={idx} className="py-2 px-2">
                    <Input
                      type="number"
                      min={0}
                      value={p.homeScore}
                      onChange={(e) => handlePeriodChange(idx, 'homeScore', e.target.value)}
                      className="h-8 w-16 text-center font-mono text-xs mx-auto"
                    />
                  </td>
                ))}
                <td className="py-2 px-4 font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                  {homeScore}
                </td>
              </tr>

              {/* Away Team Row */}
              <tr>
                <td className="py-2.5 text-left font-bold text-slate-700 dark:text-slate-300">
                  {opponentName} (Away)
                </td>
                {periodScores.map((p, idx) => (
                  <td key={idx} className="py-2 px-2">
                    <Input
                      type="number"
                      min={0}
                      value={p.awayScore}
                      onChange={(e) => handlePeriodChange(idx, 'awayScore', e.target.value)}
                      className="h-8 w-16 text-center font-mono text-xs mx-auto"
                    />
                  </td>
                ))}
                <td className="py-2 px-4 font-mono font-bold text-base text-slate-700 dark:text-slate-300">
                  {awayScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Player Box Score Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Player Box Score & Telemetry ({players.length} Athletes)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Roster PTS: {totalPlayerPoints}</span>
            <span>&bull;</span>
            <span>Game PTS: {homeScore}</span>
            {totalPlayerPoints !== homeScore && homeScore > 0 && (
              <span className="text-amber-500 font-semibold">(Discrepancy: {Math.abs(homeScore - totalPlayerPoints)} pts)</span>
            )}
          </div>
        </div>

        {players.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No active players assigned to this squad roster yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-center">
                  <th className="py-2 text-left font-bold text-slate-700 dark:text-slate-300">Athlete</th>
                  <th className="py-2 px-2">MIN</th>
                  <th className="py-2 px-2 text-amber-600 dark:text-amber-400 font-bold">PTS</th>
                  <th className="py-2 px-2">REB</th>
                  <th className="py-2 px-2">AST</th>
                  <th className="py-2 px-2">STL</th>
                  <th className="py-2 px-2">BLK</th>
                  <th className="py-2 px-2">TO</th>
                  <th className="py-2 px-2">PF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {players.map((player) => {
                  const s: Partial<PlayerStat> = playerStats[player._id] || {};
                  return (
                    <tr key={player._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 text-left font-sans font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <span className="text-amber-500 font-mono mr-1.5 font-bold">#{player.jerseyNum}</span>
                        {player.name} {player.lastname}
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({player.position})</span>
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.minutesPlayed || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'minutesPlayed', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.points || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'points', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto font-bold bg-amber-500/10 border-amber-500/30"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.rebounds || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'rebounds', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.assists || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'assists', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.steals || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'steals', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.blocks || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'blocks', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.turnovers || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'turnovers', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto text-rose-500"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          min={0}
                          value={s.fouls || 0}
                          onChange={(e) => handlePlayerStatChange(player._id, 'fouls', e.target.value)}
                          className="h-7 w-14 text-center text-xs mx-auto text-rose-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 dark:border-slate-800 font-mono font-bold text-center">
                <tr className="text-slate-900 dark:text-slate-100">
                  <td className="py-2.5 text-left font-sans">Team Totals</td>
                  <td>{calculateSum('minutesPlayed')}</td>
                  <td className="text-amber-500">{totalPlayerPoints}</td>
                  <td>{calculateSum('rebounds')}</td>
                  <td>{calculateSum('assists')}</td>
                  <td>{calculateSum('steals')}</td>
                  <td>{calculateSum('blocks')}</td>
                  <td className="text-rose-500">{calculateSum('turnovers')}</td>
                  <td className="text-rose-500">{calculateSum('fouls')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            onClick={handleSaveBoxScore}
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md rounded-xl"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {submitting ? 'Saving Box Score...' : 'Save Match Results & Stats'}
          </Button>
        </div>
      </div>
    </div>
  );
}
