import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { requireAuth } from '@/lib/authGuard';
import User from '@/models/User';
import Player from '@/models/Player';
import Event from '@/models/Event';
import '@/models/Team';
import '@/models/Venue';

const UPCOMING_LIMIT = 10;
const ATTENDANCE_STATUSES = ['present', 'absent', 'excused', 'injured'] as const;
type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

interface AttendanceRecord {
  player?: { toString(): string } | string;
  status: AttendanceStatus;
}

interface EventAttendanceDoc {
  _id: unknown;
  attendance?: AttendanceRecord[];
}

interface LeanTeamRef {
  _id: { toString(): string };
  name?: string;
}

interface LeanPlayerDoc {
  _id: { toString(): string };
  name?: string;
  lastname?: string;
  team?: LeanTeamRef | null;
  [key: string]: unknown;
}

interface LeanEventDoc {
  _id: unknown;
  title?: string;
  eventType?: string;
  startTime?: Date;
  endTime?: Date;
  team?: LeanTeamRef | null;
  players?: Array<{ toString(): string }>;
  venue?: unknown;
  location?: string;
  isAwayGame?: boolean;
  opponent?: string;
}

// The signed-in player's or guardian's linked players, with their schedule and attendance
export async function GET(): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const user = await User.findById(session.user.id)
      .select('name lastName email role players')
      .lean<{ name?: string; lastName?: string; email?: string; role?: string; players?: Array<{ toString(): string }> }>();

    const players = await Player.find({ _id: { $in: user?.players || [] } })
      .populate<{ team: LeanTeamRef }>('team', 'name')
      .lean<LeanPlayerDoc[]>();

    const playerIds = players.map((p) => p._id);
    const teamIds = players.map((p) => p.team?._id).filter(Boolean);
    const now = new Date();

    const upcomingEvents = await Event.find({
      endTime: { $gte: now },
      $or: [{ team: { $in: teamIds } }, { players: { $in: playerIds } }],
    })
      .select('title eventType startTime endTime team players venue location isAwayGame opponent')
      .populate<{ team: LeanTeamRef }>('team', 'name')
      .populate('venue', 'name address')
      .sort({ startTime: 1 })
      .limit(UPCOMING_LIMIT * Math.max(1, players.length))
      .lean<LeanEventDoc[]>();

    const pastWithAttendance = await Event.find({
      startTime: { $lt: now },
      'attendance.player': { $in: playerIds },
    })
      .select('attendance')
      .lean<EventAttendanceDoc[]>();

    const result = players.map((player) => {
      const id = player._id.toString();
      const teamId = player.team?._id?.toString();
      const attendance: Record<AttendanceStatus, number> = {
        present: 0,
        absent: 0,
        excused: 0,
        injured: 0,
      };

      for (const event of pastWithAttendance) {
        const record = event.attendance?.find((a) => a.player?.toString() === id);
        if (record && attendance[record.status] !== undefined) {
          attendance[record.status] += 1;
        }
      }
      const tracked = ATTENDANCE_STATUSES.reduce((sum, s) => sum + attendance[s], 0);

      return {
        ...player,
        upcomingEvents: upcomingEvents
          .filter((e) => e.team?._id?.toString() === teamId || e.players?.some((p) => p.toString() === id))
          .slice(0, UPCOMING_LIMIT)
          .map(({ players: _players, ...event }) => event),
        attendance: {
          ...attendance,
          tracked,
          rate: tracked > 0 ? Math.round((attendance.present / tracked) * 100) : null,
        },
      };
    });

    return NextResponse.json(
      {
        user: { name: user?.name, lastName: user?.lastName, email: user?.email, role: user?.role },
        players: result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error loading account overview:', error);
    return NextResponse.json({ error: 'Failed to load your overview' }, { status: 500 });
  }
}
