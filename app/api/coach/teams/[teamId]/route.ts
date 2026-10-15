import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
import Team from '@/models/Team';
import Event from '@/models/Event';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/authGuard';
import { formatAcademyTime } from '@/lib/timezone';

interface RouteContext {
  params: Promise<{ teamId: string }> | { teamId: string };
}

interface PeriodScore {
  period: string | number;
  homeScore: number;
  awayScore: number;
}

interface LeanGameResult {
  _id: unknown;
  status?: string;
  homeTeamScore?: number;
  awayTeamScore?: number;
  periodScores?: PeriodScore[];
}

interface LeanVenueRef {
  _id: unknown;
  name?: string;
  address?: string;
}

interface AttendanceItem {
  player?: unknown;
  status?: string;
}

interface LeanEventDoc {
  _id: unknown;
  title: string;
  description?: string;
  eventType: string;
  startTime: Date;
  endTime?: Date;
  isAwayGame?: boolean;
  opponent?: string;
  location?: string;
  venue?: LeanVenueRef | null;
  gameResult?: LeanGameResult | null;
  attendance?: AttendanceItem[];
}

export async function GET(
  _request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { teamId } = await Promise.resolve(context.params);

  try {
    await connectToDatabase();

    const { session, errorResponse } = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;

    const userId = session.user.id;

    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    // Find the team by teamId and populate coaching staff
    const team = await Team.findById(new mongoose.Types.ObjectId(teamId))
      .populate('coach', 'name lastName email image')
      .populate('assistantCoach', 'name lastName email image');
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is head coach, assistant coach, or admin
    const coachIdStr = typeof team.coach === 'object' && team.coach !== null && '_id' in team.coach
      ? (team.coach._id as { toString(): string }).toString()
      : team.coach?.toString();
    const assistantIdStr = typeof team.assistantCoach === 'object' && team.assistantCoach !== null && '_id' in team.assistantCoach
      ? (team.assistantCoach._id as { toString(): string }).toString()
      : team.assistantCoach?.toString();

    const isAuthorized =
      session.user.role === 'admin' ||
      coachIdStr === userId ||
      assistantIdStr === userId;
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Not a team coach' },
        { status: 403 }
      );
    }

    // Find players with the matching teamId
    const players = await Player.find({
      team: new mongoose.Types.ObjectId(teamId),
      isActive: true,
    })
      .select('name position dateOfBirth age lastname height isFirstTeam jerseyNum')
      .populate('team', 'name');

    // Fetch all events for this team (games, practices, trainings)
    const events = await Event.find({
      team: new mongoose.Types.ObjectId(teamId),
    })
      .populate<{ venue: LeanVenueRef }>('venue')
      .populate<{ gameResult: LeanGameResult }>('gameResult')
      .sort({ startTime: -1 })
      .lean<LeanEventDoc[]>();

    const now = new Date();

    // Separate and format games
    const allGames = events
      .filter((e) => e.eventType === 'game')
      .map((e) => {
        const isAway = Boolean(e.isAwayGame);
        // Played games without a recorded final score are 'awaiting_result'
        const resultStatus = e.gameResult?.status || 'scheduled';
        const isCompleted = resultStatus === 'completed';
        const status = isCompleted
          ? 'completed'
          : new Date(e.endTime || e.startTime) < now && resultStatus !== 'cancelled'
          ? 'awaiting_result'
          : resultStatus;
        const ourScore = isCompleted
          ? (isAway ? e.gameResult?.awayTeamScore : e.gameResult?.homeTeamScore) ?? null
          : null;
        const opponentScore = isCompleted
          ? (isAway ? e.gameResult?.homeTeamScore : e.gameResult?.awayTeamScore) ?? null
          : null;
        const outcome =
          ourScore !== null && opponentScore !== null
            ? ourScore > opponentScore
              ? 'W'
              : ourScore < opponentScore
              ? 'L'
              : 'D'
            : null;

        return {
          _id: e._id,
          title: e.title,
          description: e.description || '',
          opponent: e.opponent || 'Opponent',
          isAwayGame: isAway,
          location: isAway ? 'Away' : 'Home',
          venue: e.venue?.name || e.location || (isAway ? 'Away Court' : 'BBA Arena'),
          venueAddress: e.venue?.address || '',
          date: e.startTime,
          startTime: formatAcademyTime(e.startTime),
          endTime: e.endTime ? formatAcademyTime(e.endTime) : '',
          status,
          ourScore,
          opponentScore,
          outcome,
          periodScores: e.gameResult?.periodScores || [],
        };
      });

    // Played games (scored or awaiting a result), sorted newest first
    const recentGames = allGames
      .filter((g) => g.status === 'completed' || g.status === 'awaiting_result')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // Only games with a final score count toward the record
    const scoredGames = recentGames.filter((g) => g.outcome !== null);

    // Upcoming games, sorted soonest first
    const upcomingGames = allGames
      .filter((g) => g.status === 'scheduled' && new Date(g.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const nextFixture = upcomingGames.length > 0 ? upcomingGames[0] : null;

    // Practices and skill sessions
    const practices = events
      .filter((e) => e.eventType === 'practice' || e.eventType === 'individualTraining')
      .map((e) => ({
        _id: e._id,
        title: e.title,
        description: e.description || '',
        eventType: e.eventType,
        date: e.startTime,
        startTime: formatAcademyTime(e.startTime),
        endTime: e.endTime ? formatAcademyTime(e.endTime) : '',
        venue: e.venue?.name || 'BBA Facility',
        venueAddress: e.venue?.address || '',
        isUpcoming: new Date(e.endTime || e.startTime) >= now,
        attendanceCount: e.attendance?.filter((a) => a.status === 'present').length || 0,
        totalTracked: e.attendance?.length || 0,
      }));

    const upcomingPractices = practices
      .filter((p) => p.isUpcoming)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate comprehensive stats
    const wins = scoredGames.filter((g) => g.outcome === 'W').length;
    const losses = scoredGames.filter((g) => g.outcome === 'L').length;
    const totalPlayed = scoredGames.length;
    const totalScored = scoredGames.reduce((acc, g) => acc + (g.ourScore || 0), 0);
    const totalConceded = scoredGames.reduce((acc, g) => acc + (g.opponentScore || 0), 0);
    const avgPointsScored = totalPlayed > 0 ? (totalScored / totalPlayed).toFixed(1) : '0';
    const avgPointsConceded = totalPlayed > 0 ? (totalConceded / totalPlayed).toFixed(1) : '0';
    const starters = players.filter((p) => p.isFirstTeam);

    const heights = players
      .map((p) => (typeof p.height === 'number' ? p.height : parseFloat(String(p.height || ''))))
      .filter((h) => !isNaN(h) && h > 0);
    const avgHeight =
      heights.length > 0
        ? (heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(1)
        : null;

    const stats = {
      totalPlayers: players.length,
      startersCount: starters.length,
      gamesPlayed: totalPlayed,
      wins,
      losses,
      winRate: totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0,
      avgPointsScored,
      avgPointsConceded,
      pointDifferential: totalScored - totalConceded,
      avgHeight,
      lastFiveOutcome: scoredGames.slice(0, 5).map((g) => g.outcome),
    };

    return NextResponse.json({
      success: true,
      data: players,
      team,
      recentGames,
      upcomingGames,
      nextFixture,
      upcomingPractices,
      allPractices: practices,
      stats,
    });
  } catch (error: unknown) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching players' },
      { status: 500 }
    );
  }
}
