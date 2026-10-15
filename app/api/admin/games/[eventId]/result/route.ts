import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import GameResult, { type IPeriodScore, type IPlayerBoxScore, type GameStatus } from '@/models/GameResult';
import connectToDatabase from '@/lib/mongoose';
import Event from '@/models/Event';
import { canManageEvent, type AccessSession } from '@/lib/access';

interface RouteContext {
  params: Promise<{ eventId: string }> | { eventId: string };
}

interface EditableGameResultFields {
  homeTeamScore?: number;
  awayTeamScore?: number;
  periodScores?: IPeriodScore[];
  boxScores?: IPlayerBoxScore[];
  status?: GameStatus;
}

const EDITABLE_FIELDS: readonly (keyof EditableGameResultFields)[] = [
  'homeTeamScore',
  'awayTeamScore',
  'periodScores',
  'boxScores',
  'status',
] as const;

function pickEditableFields(data: Record<string, unknown>): EditableGameResultFields {
  const picked: EditableGameResultFields = {};
  for (const key of EDITABLE_FIELDS) {
    if (data[key] !== undefined) {
      (picked as Record<string, unknown>)[key] = data[key];
    }
  }
  return picked;
}

// Coaches may only record results for their own teams' games
async function checkEventAccess(session: AccessSession, eventId: string): Promise<NextResponse | null> {
  const event = await Event.findById(eventId).select('team players');
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (!(await canManageEvent(session, event))) {
    return NextResponse.json({ error: 'Forbidden - You do not coach this team' }, { status: 403 });
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { eventId } = await Promise.resolve(context.params);
    const gameResult = await GameResult.findOne({ event: eventId }).populate(
      'boxScores.player',
      'name lastname jerseyNum position'
    );

    if (!gameResult) {
      return NextResponse.json(
        { error: 'Game result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ gameResult }, { status: 200 });
  } catch (_error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch game result' },
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
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();
    const { eventId } = await Promise.resolve(context.params);
    const accessError = await checkEventAccess(session, eventId);
    if (accessError) return accessError;
    const body = (await request.json()) as Record<string, unknown>;
    const data = pickEditableFields(body);

    const gameResult = await GameResult.findOneAndUpdate(
      { event: eventId },
      data,
      { new: true, runValidators: true }
    );

    if (!gameResult) {
      return NextResponse.json(
        { error: 'Game result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ gameResult }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update game result';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();
    const { eventId } = await Promise.resolve(context.params);
    const accessError = await checkEventAccess(session, eventId);
    if (accessError) return accessError;
    const body = (await request.json()) as Record<string, unknown>;
    const data = pickEditableFields(body);
    const existingResult = await GameResult.findOne({ event: eventId });
    if (existingResult) {
      return NextResponse.json(
        { error: 'Game result already exists for this event' },
        { status: 400 }
      );
    }

    const gameResult = await GameResult.create({
      ...data,
      event: eventId,
    });

    return NextResponse.json({ gameResult }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create game result';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
