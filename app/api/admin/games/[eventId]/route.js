import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Game from '@/models/Game';
import Event from '@/models/Event';
import GameResult from '@/models/GameResult';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const id = resolvedParams.eventId || resolvedParams.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    // Try finding in Game model
    let game = await Game.findById(id).populate('team').populate('event');

    // If not found, try Event model with eventType: 'game'
    if (!game) {
      const event = await Event.findById(id)
        .populate('team')
        .populate('venue')
        .populate('gameResult');

      if (event && event.eventType === 'game') {
        game = {
          _id: event._id,
          team: event.team,
          opponent: event.opponent,
          location: event.isAwayGame ? 'Away' : 'Home',
          venue: event.venue?.name || event.location,
          date: event.startTime,
          startTime: new Date(event.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          score: {
            ourTeam: event.gameResult?.homeTeamScore ?? null,
            opponentTeam: event.gameResult?.awayTeamScore ?? null,
          },
          event: event._id,
        };
      }
    }

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const id = resolvedParams.eventId || resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    let updatedGame = await Game.findByIdAndUpdate(id, body, { new: true });

    if (!updatedGame) {
      // Try updating Event
      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          team: body.team,
          opponent: body.opponent,
          startTime: body.date ? new Date(body.date) : body.startTime,
          venue: body.venue,
          location: body.location,
          title: `Game vs ${body.opponent}`,
        },
        { new: true }
      );

      if (updatedEvent && body.score) {
        await GameResult.findOneAndUpdate(
          { event: updatedEvent._id },
          {
            homeTeamScore: body.score.ourTeam,
            awayTeamScore: body.score.opponentTeam,
            status: 'completed',
          },
          { upsert: true }
        );
      }

      if (!updatedEvent) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, event: updatedEvent }, { status: 200 });
    }

    return NextResponse.json(updatedGame, { status: 200 });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const id = resolvedParams.eventId || resolvedParams.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    await Game.findByIdAndDelete(id);
    await Event.findByIdAndDelete(id);
    await GameResult.deleteMany({ event: id });

    return NextResponse.json({ message: 'Game deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
