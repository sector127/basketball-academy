import { NextResponse, type NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Event, { type AttendanceStatus } from '@/models/Event';
import Player from '@/models/Player';
import { requireAuth } from '@/lib/authGuard';
import mongoose from 'mongoose';
import { canManageEvent, type AccessSession } from '@/lib/access';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

interface AttendanceItemInput {
  player?: string | { _id?: string } | mongoose.Types.ObjectId;
  status?: AttendanceStatus | string;
  notes?: string;
}

interface PutAttendanceBody {
  attendance?: AttendanceItemInput[];
}

const VALID_STATUSES: readonly AttendanceStatus[] = ['present', 'absent', 'excused', 'injured'] as const;

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
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findById(id)
      .populate('team')
      .populate('attendance.player', 'name lastname jerseyNum position profilePicture injuryStatus');

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let attendanceList: unknown[] = event.attendance || [];

    // If no attendance has been recorded yet and event has a team, populate default from team roster
    if (attendanceList.length === 0 && event.team) {
      const teamId = typeof event.team === 'object' && event.team !== null && '_id' in event.team
        ? (event.team as { _id: unknown })._id
        : event.team;

      const teamPlayers = await Player.find({ team: teamId, isActive: true })
        .select('name lastname jerseyNum position profilePicture injuryStatus');

      attendanceList = teamPlayers.map((p) => ({
        player: p,
        status: p.injuryStatus && p.injuryStatus !== 'Healthy' ? ('injured' as const) : ('present' as const),
        notes: p.injuryStatus !== 'Healthy' ? `Status: ${p.injuryStatus}` : '',
      }));
    }

    return NextResponse.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        eventType: event.eventType,
        startTime: event.startTime,
        endTime: event.endTime,
        team: event.team,
      },
      attendance: attendanceList,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching event attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { id } = await Promise.resolve(context.params);
    const body = (await request.json()) as PutAttendanceBody;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findById(id).select('team players');
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (session && !(await canManageEvent(session as AccessSession, event))) {
      return NextResponse.json({ error: 'Forbidden - You do not coach this team' }, { status: 403 });
    }

    const attendanceRecords = Array.isArray(body.attendance) ? body.attendance : [];

    const cleanedAttendance = attendanceRecords.map((item) => {
      const playerId = typeof item.player === 'object' && item.player !== null && '_id' in item.player
        ? item.player._id
        : item.player;

      const rawStatus = item.status as AttendanceStatus;
      const status: AttendanceStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'present';

      return {
        player: playerId,
        status,
        notes: item.notes || '',
      };
    });

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { attendance: cleanedAttendance },
      { new: true }
    ).populate('attendance.player', 'name lastname jerseyNum position');

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      attendance: updatedEvent.attendance,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
