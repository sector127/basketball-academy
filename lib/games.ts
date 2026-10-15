import { formatAcademyTime } from '@/lib/timezone';
import type { IGameResult, GameStatus } from '@/models/GameResult';

export interface PopulatedEventGame {
  _id: unknown;
  isAwayGame?: boolean;
  gameResult?: Partial<IGameResult> | null;
  team?: { name?: string; _id?: unknown } | null;
  opponent?: string | null;
  venue?: { name?: string; _id?: unknown } | null;
  location?: string | null;
  startTime: Date | string;
  endTime: Date | string;
}

export interface AcademyScores {
  status: GameStatus | string;
  ourTeam: number | null;
  opponentTeam: number | null;
}

export interface GameSummary {
  _id: unknown;
  team: { name?: string; _id?: unknown };
  opponent: string;
  location: 'Away' | 'Home';
  isAwayGame: boolean;
  venue: string;
  date: Date | string;
  endDate: Date | string;
  startTime: string;
  status: GameStatus | string;
  score: {
    ourTeam: number | null;
    opponentTeam: number | null;
  };
  event: unknown;
}

/**
 * Scores from the academy's point of view. GameResult stores home/away scores;
 * for away games the academy is the away side.
 */
export function getAcademyScores(event: PopulatedEventGame): AcademyScores {
  const result = event.gameResult;
  const status: GameStatus | string = result?.status || 'scheduled';
  if (status !== 'completed') {
    return { status, ourTeam: null, opponentTeam: null };
  }
  const isAway = Boolean(event.isAwayGame);
  return {
    status,
    ourTeam: (isAway ? result?.awayTeamScore : result?.homeTeamScore) ?? null,
    opponentTeam: (isAway ? result?.homeTeamScore : result?.awayTeamScore) ?? null,
  };
}

/**
 * Game list item built from a populated game Event (team, venue, gameResult).
 */
export function toGameSummary(event: PopulatedEventGame): GameSummary {
  const isAway = Boolean(event.isAwayGame);
  const { status, ourTeam, opponentTeam } = getAcademyScores(event);
  return {
    _id: event._id,
    team: event.team || { name: 'BBA Team' },
    opponent: event.opponent || 'Opponent',
    location: isAway ? 'Away' : 'Home',
    isAwayGame: isAway,
    venue: event.venue?.name || event.location || (isAway ? 'Away Court' : 'BBA Court'),
    date: event.startTime,
    endDate: event.endTime,
    startTime: formatAcademyTime(event.startTime),
    status,
    score: { ourTeam, opponentTeam },
    event: event._id,
  };
}

export function buildGameTitle(teamName: string | null | undefined, opponent: string): string {
  return `${teamName || 'BBA'} vs ${opponent}`;
}
