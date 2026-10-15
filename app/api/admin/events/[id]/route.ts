import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from "@/lib/authGuard";
import Event, { type EventType } from '@/models/Event';
import GameResult from '@/models/GameResult';
import connectToDatabase from "@/lib/mongoose";
import Team from '@/models/Team';
import "@/models/Player";
import { isVenueAvailable } from "@/lib/venueAvailability";
import { canManageEvent, type AccessSession } from "@/lib/access";
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

interface UpdateEventInput {
  _id?: unknown;
  id?: unknown;
  eventType?: EventType;
  title?: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  venue?: string;
  team?: string;
  opponent?: string;
  players?: string[];
  isAwayGame?: boolean;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { id } = await Promise.resolve(context.params);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = await Event.findById(id)
      .populate('team')
      .populate('gameResult');

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (_error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;
  try {
    const userRole = (session?.user?.role || '').toLowerCase();
    await connectToDatabase();
    const data = (await request.json()) as UpdateEventInput;
    const { id } = await Promise.resolve(context.params);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Coaches can only modify skills and individual training sessions
    if (userRole === 'coach' && (event.eventType !== 'individualTraining' || (data.eventType && data.eventType !== 'individualTraining'))) {
      return NextResponse.json(
        { error: 'Coaches can only modify Skills & Individual Training sessions. Matches and team practices are managed by administration.' },
        { status: 403 }
      );
    }

    // Coaches must own both the stored event and whatever it is being changed to.
    if (userRole === 'coach' && session) {
      const canManageStored = await canManageEvent(session as AccessSession, event);
      const canManageTarget = await canManageEvent(session as AccessSession, {
        team: data.team || event.team,
        players: Array.isArray(data.players) && data.players.length > 0 ? data.players : event.players,
      });

      if (!canManageStored || !canManageTarget) {
        return NextResponse.json(
          { error: 'Coaches can only modify sessions for their own teams and players.' },
          { status: 403 }
        );
      }
    }

    // Check venue availability for all events with a venue
    if (data.venue) {
      const startTime = data.startTime ? new Date(data.startTime) : event.startTime;
      const endTime = data.endTime ? new Date(data.endTime) : event.endTime;
      const isAvailable = await isVenueAvailable(
        data.venue,
        startTime,
        endTime,
        id
      );

      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Venue is not available during the selected time slot' },
          { status: 409 }
        );
      }
    }

    const cleanedData: Partial<UpdateEventInput> = { ...data };
    delete cleanedData._id;
    delete cleanedData.id;
    if (!cleanedData.team) delete cleanedData.team;
    if (!cleanedData.venue) delete cleanedData.venue;
    if (!cleanedData.players || cleanedData.players.length === 0) delete cleanedData.players;

    let title = cleanedData.title || event.title;
    if (cleanedData.eventType === 'game') {
      const team = cleanedData.team ? await Team.findById(cleanedData.team) : null;
      title = team
        ? `${team.name} vs ${cleanedData.opponent || ''}`
        : (cleanedData.opponent ? `BBA vs ${cleanedData.opponent}` : (cleanedData.title || event.title));
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, { ...cleanedData, title }, { new: true });

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update event';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;
  try {
    const userRole = (session?.user?.role || '').toLowerCase();
    await connectToDatabase();
    const { id } = await Promise.resolve(context.params);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Coaches can only delete skills and individual training sessions for their own teams
    if (userRole === 'coach' && session) {
      const canManage = await canManageEvent(session as AccessSession, event);
      if (event.eventType !== 'individualTraining' || !canManage) {
        return NextResponse.json(
          { error: 'Coaches can only delete Skills & Individual Training sessions. Matches and team practices are managed by administration.' },
          { status: 403 }
        );
      }
    }

    // Delete associated game result if it exists
    if (event.eventType === 'game') {
      await GameResult.findOneAndDelete({ event: id });
    }

    await event.deleteOne();

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (_error: unknown) {
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
