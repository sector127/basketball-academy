import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import connectToDatabase from '@/lib/mongoose';
import Event from '@/models/Event';
import Team from '@/models/Team';
import GameResult from '@/models/GameResult';
import '@/models/Venue';
import mongoose from 'mongoose';
import { isVenueAvailable } from '@/lib/venueAvailability';
import { buildGameTitle, getAcademyScores, toGameSummary } from '@/lib/games';

async function findGame(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const event = await Event.findById(id).populate('team').populate('venue').populate('gameResult');
  return event && event.eventType === 'game' ? event : null;
}

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await params;
    const event = await findGame(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Summary fields for display, plus the raw event fields the edit form needs
    // (ISO start/end times, venue as a populated document with _id)
    return NextResponse.json({
      ...toGameSummary(event),
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue || null,
      venueName: event.venue?.name || event.location || '',
      location: event.location || '',
      description: event.description || '',
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await params;
    const event = await findGame(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const body = await request.json();

    // Moving the start keeps the game's length unless a new end time is given
    const durationMs = event.endTime - event.startTime;
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

    const isAwayGame = body.isAwayGame !== undefined ? Boolean(body.isAwayGame) : event.isAwayGame;
    const opponent = (body.opponent ?? event.opponent ?? '').trim();
    if (!opponent) {
      return NextResponse.json({ error: 'Opponent is required' }, { status: 400 });
    }

    const teamId = body.team || event.team?._id;
    const team = teamId ? await Team.findById(teamId) : null;
    if (body.team && !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const update = {
      opponent,
      startTime,
      endTime,
      isAwayGame,
      title: buildGameTitle(team?.name, opponent),
    };
    if (team) update.team = team._id;
    if (body.description !== undefined) update.description = body.description;
    const unset = {};

    if (isAwayGame) {
      // Away games are at the opponent's location, not one of our venues
      update.location = (body.location || event.location || 'Away').trim();
      unset.venue = 1;
    } else {
      const venueId = body.venue || event.venue?._id;
      if (!venueId) {
        return NextResponse.json({ error: 'A venue is required for home games' }, { status: 400 });
      }
      if (!(await isVenueAvailable(venueId, startTime, endTime, event._id))) {
        return NextResponse.json({ error: 'Venue is not available during the selected time slot' }, { status: 409 });
      }
      update.venue = venueId;
      unset.location = 1;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $set: update, $unset: unset },
      // Validated above; update validators can't see isAwayGame for the conditional venue rule
      { new: true }
    ).populate('team').populate('venue').populate('gameResult');

    // Optional final score from the academy's point of view
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

    return NextResponse.json({ success: true, event: updatedEvent, score: getAcademyScores(updatedEvent) }, { status: 200 });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await params;
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
