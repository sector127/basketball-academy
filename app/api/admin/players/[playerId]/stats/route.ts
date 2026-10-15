import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import GameResult from '@/models/GameResult';
import '@/models/Event';
import Player from '@/models/Player';
import { requireAuth } from '@/lib/authGuard';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ playerId: string }> | { playerId: string };
}

interface PlayerBoxScore {
  player?: { toString(): string } | string;
  points?: number;
  assists?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  minutesPlayed?: number;
}

interface LeanPopulatedEvent {
  _id: unknown;
  title?: string;
  startTime: Date;
  opponent?: string;
  isAwayGame?: boolean;
  location?: string;
  venue?: unknown;
  team?: { name?: string };
}

interface LeanGameResultWithEvent {
  _id: unknown;
  boxScores?: PlayerBoxScore[];
  homeTeamScore?: number;
  awayTeamScore?: number;
  event?: LeanPopulatedEvent | null;
}

interface GameLogEntry {
  gameId: unknown;
  date?: Date;
  opponent: string;
  teamName: string;
  ourScore?: number;
  opponentScore?: number;
  stats: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
  };
}

export async function GET(
  _request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { playerId } = await Promise.resolve(context.params);

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    const player = await Player.findById(playerObjectId).populate('team', 'name');
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Find all game results containing this player's box score
    const gameResults = await GameResult.find({
      'boxScores.player': playerObjectId,
    }).populate<{ event: LeanPopulatedEvent }>({
      path: 'event',
      select: 'title startTime opponent isAwayGame location venue team',
      populate: { path: 'team', select: 'name' },
    });

    const gameLogs: GameLogEntry[] = [];
    const totals = {
      points: 0,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      minutesPlayed: 0,
    };

    (gameResults as LeanGameResultWithEvent[]).forEach((result) => {
      const playerStat = result.boxScores?.find(
        (b) => b.player && b.player.toString() === playerId
      );

      if (playerStat) {
        totals.points += playerStat.points || 0;
        totals.assists += playerStat.assists || 0;
        totals.rebounds += playerStat.rebounds || 0;
        totals.steals += playerStat.steals || 0;
        totals.blocks += playerStat.blocks || 0;
        totals.turnovers += playerStat.turnovers || 0;
        totals.fouls += playerStat.fouls || 0;
        totals.minutesPlayed += playerStat.minutesPlayed || 0;

        gameLogs.push({
          gameId: result.event?._id,
          date: result.event?.startTime,
          opponent: result.event?.opponent || 'Opponent',
          teamName: result.event?.team?.name || 'Academy Team',
          // For away games the academy is the away side
          ourScore: result.event?.isAwayGame ? result.awayTeamScore : result.homeTeamScore,
          opponentScore: result.event?.isAwayGame ? result.homeTeamScore : result.awayTeamScore,
          stats: {
            minutes: playerStat.minutesPlayed || 0,
            points: playerStat.points || 0,
            rebounds: playerStat.rebounds || 0,
            assists: playerStat.assists || 0,
            steals: playerStat.steals || 0,
            blocks: playerStat.blocks || 0,
            turnovers: playerStat.turnovers || 0,
            fouls: playerStat.fouls || 0,
          },
        });
      }
    });

    const gamesPlayed = gameLogs.length;
    const averages =
      gamesPlayed > 0
        ? {
            ppg: +(totals.points / gamesPlayed).toFixed(1),
            rpg: +(totals.rebounds / gamesPlayed).toFixed(1),
            apg: +(totals.assists / gamesPlayed).toFixed(1),
            spg: +(totals.steals / gamesPlayed).toFixed(1),
            bpg: +(totals.blocks / gamesPlayed).toFixed(1),
            topg: +(totals.turnovers / gamesPlayed).toFixed(1),
            mpg: +(totals.minutesPlayed / gamesPlayed).toFixed(1),
          }
        : {
            ppg: 0,
            rpg: 0,
            apg: 0,
            spg: 0,
            bpg: 0,
            topg: 0,
            mpg: 0,
          };

    // Sort logs descending by date
    gameLogs.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json(
      {
        success: true,
        player: {
          _id: player._id,
          name: player.name,
          lastname: player.lastname,
          jerseyNum: player.jerseyNum,
          position: player.position,
          height: player.height,
          team: player.team,
        },
        gamesPlayed,
        averages,
        totals,
        recentGames: gameLogs.slice(0, 10),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 });
  }
}
