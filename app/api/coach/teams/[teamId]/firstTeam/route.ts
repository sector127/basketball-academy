import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
import { PLAYER_PUBLIC_FIELDS, canManageTeam, canViewPlayerContacts } from '@/lib/access';

interface RouteContext {
  params: Promise<{ teamId: string }> | { teamId: string };
}

interface PatchBody {
  playerId?: string;
  isFirstTeam?: boolean;
}

interface MongoError extends Error {
  code?: number;
}

export async function GET(
  _req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  await connectToDatabase();

  const { teamId } = await Promise.resolve(context.params);
  try {
    // Fetch players from the specific team who are in the first team
    const query = Player.find({ team: teamId, isFirstTeam: true }).populate('team', 'name');
    if (!canViewPlayerContacts(session.user.role)) query.select(PLAYER_PUBLIC_FIELDS);
    const firstTeamPlayers = await query;
    return NextResponse.json(firstTeamPlayers);
  } catch (error: unknown) {
    console.error('Error fetching first team players:', error);
    return NextResponse.json({ error: 'Failed to fetch first team players' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;
  await connectToDatabase();

  const { teamId } = await Promise.resolve(context.params);
  const { playerId, isFirstTeam } = (await req.json()) as PatchBody;

  try {
    if (!(await canManageTeam(session, teamId))) {
      return NextResponse.json({ error: 'Forbidden - You do not coach this team' }, { status: 403 });
    }

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Check if the player exists and belongs to the team
    const player = await Player.findOne({ _id: playerId, team: teamId });
    if (!player) {
      return NextResponse.json({ error: 'Player not found in this team' }, { status: 404 });
    }

    // If setting isFirstTeam to true, check if there are already 5 players in the first team for this team
    if (isFirstTeam) {
      if (player.isActive === false) {
        return NextResponse.json({ error: 'Disabled players cannot be starters' }, { status: 400 });
      }

      const firstTeamPlayersCount = await Player.countDocuments({
        team: teamId,
        isFirstTeam: true,
        isActive: { $ne: false },
      });
      if (firstTeamPlayersCount >= 5) {
        return NextResponse.json(
          { error: 'First team already has 5 players' },
          { status: 400 }
        );
      }

      // Check if a player with the same position already exists in the first team
      const existingPlayerInPosition = await Player.findOne({
        team: teamId,
        isFirstTeam: true,
        isActive: { $ne: false },
        position: player.position,
      });

      if (existingPlayerInPosition) {
        return NextResponse.json(
          {
            error: `A player with the position ${player.position} already exists in the first team, please edit ${player.name}'s position before adding.`,
          },
          { status: 400 }
        );
      }
    }

    // Update the player's isFirstTeam status
    player.isFirstTeam = Boolean(isFirstTeam);
    await player.save();

    return NextResponse.json(
      { message: `Player ${isFirstTeam ? 'added to' : 'removed from'} first team`, player },
      { status: 200 }
    );
  } catch (error: unknown) {
    const mongoErr = error as MongoError;
    // Unique index on starters: another request took this position first
    if (mongoErr.code === 11000) {
      return NextResponse.json(
        { error: 'That starting position was just filled. Refresh and try again.' },
        { status: 409 }
      );
    }
    console.error('Error updating first team status:', error);
    return NextResponse.json({ error: 'Failed to update first team status' }, { status: 500 });
  }
}
