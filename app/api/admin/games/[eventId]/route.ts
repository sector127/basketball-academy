import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import connectToDatabase from '@/lib/mongoose';
import Event, { type IEvent } from '@/models/Event';
import Team from '@/models/Team';
import GameResult from '@/models/GameResult';
import '@/models/Venue';
import mongoose, { type HydratedDocument } from 'mongoose';
import { isVenueAvailable } from '@/lib/venueAvailability';
import { buildGameTitle, getAcademyScores, toGameSummary, type PopulatedEventGame } from '@/lib/games';

interface RouteContext {
  params: Promise<{ eventId: string }> | { eventId: string };
}

interface UpdateGameBody {
  startTime?: string;
  endTime?: string;
  isAwayGame?: boolean;
  opponent?: string;
  team?: string;
  description?: string;
  location?: string;
  venue?: string;
  score?: {
    ourTeam?: number | null;
    opponentTeam?: number | null;
  };
}

interface PopulatedGameDoc extends Omit<IEvent, 'team' | 'venue'> {
  _id: mongoose.Types.ObjectId;
  team?: { _id: mongoose.Types.ObjectId; name: string } | null;
  venue?: { _id: mongoose.Types.ObjectId; name: string } | null;
  gameResult?: unknown;
}

async function findGame(id: string): Promise<HydratedDocument<IEvent> | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const event = await Event.findById(id).populate('team').populate('venue').populate('gameResult');
  return event && event.eventType === 'game' ? event : null;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await Promise.resolve(context.params);
    const event = await findGame(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const populatedEvent = event as unknown as PopulatedGameDoc;
    const venueObj = populatedEvent.venue && typeof populatedEvent.venue === 'object' && 'name' in populatedEvent.venue
      ? populatedEvent.venue
      : null;

    return NextResponse.json({
      ...toGameSummary(event as unknown as PopulatedEventGame),
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue || null,
      venueName: venueObj?.name || event.location || '',
      location: event.location || '',
      description: event.description || '',
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await Promise.resolve(context.params);
    const event = await findGame(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const body = (await request.json()) as UpdateGameBody;

    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const startTime = body.startTime ? new Date(body.startTime) : event.startTime;
    const endTime = body.endTime
      ? new Date(body.endTime)
      : new Date(startTime.getTime() + (durationMs > 0 ? durationMs : 2 * 60 * 60 * 1000));
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end time' }, { status: 400 });
    }
    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const isAwayGame = body.isAwayGame !== undefined ? Boolean(body.isAwayGame) : Boolean(event.isAwayGame);
    const opponent = (body.opponent ?? event.opponent ?? '').trim();
    if (!opponent) {
      return NextResponse.json({ error: 'Opponent is required' }, { status: 400 });
    }

    const populatedEvent = event as unknown as PopulatedGameDoc;
    const existingTeamId = populatedEvent.team?._id ? String(populatedEvent.team._id) : (event.team ? String(event.team) : undefined);
    const teamId = body.team || existingTeamId;
    const team = teamId ? await Team.findById(teamId) : null;
    if (body.team && !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = {
      opponent,
      startTime,
      endTime,
      isAwayGame,
      title: buildGameTitle(team?.name, opponent),
    };
    if (team) update.team = team._id;
    if (body.description !== undefined) update.description = body.description;
    const unset: Record<string, number> = {};

    if (isAwayGame) {
      update.location = (body.location || event.location || 'Away').trim();
      unset.venue = 1;
    } else {
      const existingVenueId = populatedEvent.venue?._id ? String(populatedEvent.venue._id) : (event.venue ? String(event.venue) : undefined);
      const venueId = body.venue || existingVenueId;
      if (!venueId) {
        return NextResponse.json({ error: 'A venue is required for home games' }, { status: 400 });
      }
      if (!(await isVenueAvailable(venueId, startTime, endTime, String(event._id)))) {
        return NextResponse.json({ error: 'Venue is not available during the selected time slot' }, { status: 409 });
      }
      update.venue = venueId;
      unset.location = 1;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $set: update, $unset: unset },
      { new: true }
    ).populate('team').populate('venue').populate('gameResult');

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Game not found after update' }, { status: 404 });
    }

    if (body.score && body.score.ourTeam != null && body.score.opponentTeam != null) {
      await GameResult.findOneAndUpdate(
        { event: updatedEvent._id },
        {
          homeTeamScore: isAwayGame ? body.score.opponentTeam : body.score.ourTeam,
          awayTeamScore: isAwayGame ? body.score.ourTeam : body.score.opponentTeam,
          status: 'completed',
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      score: getAcademyScores(updatedEvent as unknown as PopulatedEventGame),
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await Promise.resolve(context.params);
    const event = await findGame(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    await GameResult.deleteMany({ event: event._id });
    await event.deleteOne();

    return NextResponse.json({ message: 'Game deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
