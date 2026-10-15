import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import connectToDatabase from '@/lib/mongoose';
import Event from '@/models/Event';
import Team from '@/models/Team';
import Venue from '@/models/Venue';
import Player from '@/models/Player';
import { ACADEMY_TIME_ZONE, isValidTimeZone, zonedTimeToUtc } from '@/lib/timezone';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export async function POST(request) {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      action = 'create', // 'preview' | 'create'
      teamId,
      venueId,
      sessionType = 'practice',
      title,
      description = '',
      startDate,
      endDate,
      schedule = [], // [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:30', venueId? }]
      skipConflicts = true,
      selectedDateTimes = null, // array of ISO strings user checked in preview
      timeZone, // IANA zone the schedule's wall-clock times are in (the planner's browser zone)
    } = body;

    // Interpret "18:00" in the user's zone, not the server's (UTC in Docker)
    const scheduleTimeZone = isValidTimeZone(timeZone) ? timeZone : ACADEMY_TIME_ZONE;

    if (!teamId) {
      return NextResponse.json({ error: 'Team is required' }, { status: 400 });
    }

    if (!venueId) {
      return NextResponse.json({ error: 'Default venue is required' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and End of Season date are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return NextResponse.json(
        { error: 'At least one practice day and time slot is required' },
        { status: 400 }
      );
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const defaultVenue = await Venue.findById(venueId);
    if (!defaultVenue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
      return NextResponse.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
    }

    // Parse start and end date boundaries. Calendar days are iterated in UTC so the
    // weekday and date label never depend on the server's time zone.
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    const startDayUtc = Date.UTC(startYear, startMonth - 1, startDay);
    const endDayUtc = Date.UTC(endYear, endMonth - 1, endDay);
    const endBoundary = zonedTimeToUtc(endYear, endMonth, endDay, 23, 59, scheduleTimeZone);

    if (startDayUtc > endDayUtc) {
      return NextResponse.json(
        { error: 'End of season date must be after the start date' },
        { status: 400 }
      );
    }

    const MAX_SEASON_DAYS = 550; // ~18 months
    if ((endDayUtc - startDayUtc) / (24 * 60 * 60 * 1000) > MAX_SEASON_DAYS) {
      return NextResponse.json(
        { error: 'A season plan can cover at most 18 months' },
        { status: 400 }
      );
    }

    // Schedule map by dayOfWeek (0-6)
    const scheduleByDay = new Map();
    for (const item of schedule) {
      const day = parseInt(item.dayOfWeek, 10);
      if (isNaN(day) || day < 0 || day > 6) continue;
      if (!TIME_PATTERN.test(item.startTime) || !TIME_PATTERN.test(item.endTime)) {
        return NextResponse.json(
          { error: `Invalid time for ${DAY_NAMES[day]}. Use HH:mm.` },
          { status: 400 }
        );
      }
      if (item.endTime <= item.startTime) {
        return NextResponse.json(
          { error: `End time must be after start time for ${DAY_NAMES[day]}` },
          { status: 400 }
        );
      }
      scheduleByDay.set(day, item);
    }

    // Load every booking at the involved venues for the whole season once,
    // instead of querying the database for each session
    const venueIds = [...new Set([venueId, ...schedule.map((item) => item.venueId).filter(Boolean)].map(String))];
    const seasonStart = zonedTimeToUtc(startYear, startMonth, startDay, 0, 0, scheduleTimeZone);
    const existingBookings = await Event.find({
      venue: { $in: venueIds },
      startTime: { $lt: endBoundary },
      endTime: { $gt: seasonStart },
    }).select('title eventType startTime endTime venue').lean();

    // Calculate all target dates
    const calculatedSessions = [];
    const DAY_MS = 24 * 60 * 60 * 1000;

    for (let dayUtc = startDayUtc; dayUtc <= endDayUtc; dayUtc += DAY_MS) {
      const currentDate = new Date(dayUtc);
      const dayOfWeek = currentDate.getUTCDay();

      if (scheduleByDay.has(dayOfWeek)) {
        const slot = scheduleByDay.get(dayOfWeek);
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth() + 1;
        const day = currentDate.getUTCDate();

        const sessionStart = zonedTimeToUtc(year, month, day, startH, startM, scheduleTimeZone);
        const sessionEnd = zonedTimeToUtc(year, month, day, endH, endM, scheduleTimeZone);

        const effectiveVenueId = slot.venueId || venueId;

        // Check venue availability (same overlap rule as lib/venueAvailability)
        const conflictingEvent = existingBookings.find((booking) =>
          String(booking.venue) === String(effectiveVenueId) &&
          booking.startTime < sessionEnd &&
          booking.endTime > sessionStart
        );
        const isAvailable = !conflictingEvent;
        const conflictReason = conflictingEvent
          ? `Overlaps with: "${conflictingEvent.title}" (${conflictingEvent.eventType})`
          : null;

        calculatedSessions.push({
          date: currentDate.toISOString().split('T')[0], // UTC midnight of the calendar day, so this is the local date
          dayOfWeek,
          dayName: DAY_NAMES[dayOfWeek],
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDateTime: sessionStart.toISOString(),
          endDateTime: sessionEnd.toISOString(),
          venueId: effectiveVenueId,
          isAvailable,
          conflictReason,
        });
      }
    }

    // PREVIEW ACTION: return calculated sessions list without saving
    if (action === 'preview') {
      const availableSessions = calculatedSessions.filter((s) => s.isAvailable);
      const conflictingSessions = calculatedSessions.filter((s) => !s.isAvailable);

      return NextResponse.json({
        totalSessions: calculatedSessions.length,
        availableCount: availableSessions.length,
        conflictCount: conflictingSessions.length,
        sessions: calculatedSessions,
        team: {
          _id: team._id,
          name: team.name,
        },
        venue: {
          _id: defaultVenue._id,
          name: defaultVenue.name,
        },
      });
    }

    // CREATE ACTION: batch create events
    if (action === 'create') {
      // Filter sessions based on availability or user selection
      let sessionsToCreate = calculatedSessions;

      if (Array.isArray(selectedDateTimes) && selectedDateTimes.length > 0) {
        const allowedSet = new Set(selectedDateTimes);
        sessionsToCreate = sessionsToCreate.filter((s) =>
          allowedSet.has(s.startDateTime)
        );
      } else if (skipConflicts) {
        sessionsToCreate = sessionsToCreate.filter((s) => s.isAvailable);
      }

      if (sessionsToCreate.length === 0) {
        return NextResponse.json(
          { error: 'No valid sessions to schedule. All dates either conflicted or were skipped.' },
          { status: 400 }
        );
      }

      // Fetch team players to auto-populate rosters and attendance
      const players = await Player.find({ team: teamId, isActive: { $ne: false } }).select('_id name lastname');
      const defaultAttendance = players.map((p) => ({
        player: p._id,
        status: 'present',
        notes: '',
      }));

      const recurringGroupId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const autoTitle =
        title?.trim() ||
        `${team.name} - ${sessionType === 'individualTraining' ? 'Skills Training' : 'Team Practice'}`;

      const eventsPayload = sessionsToCreate.map((s) => ({
        eventType: sessionType,
        title: autoTitle,
        description: description || `Recurring ${sessionType} session for ${team.name}.`,
        startTime: new Date(s.startDateTime),
        endTime: new Date(s.endDateTime),
        isAwayGame: false,
        venue: s.venueId,
        team: teamId,
        players: players.map((p) => p._id),
        attendance: defaultAttendance,
        isRecurring: true,
        recurringGroupId,
        recurrenceRule: {
          daysOfWeek: schedule.map((item) => parseInt(item.dayOfWeek, 10)),
          seasonEndDate: endBoundary,
          frequencyPerWeek: schedule.length,
        },
      }));

      const createdEvents = await Event.insertMany(eventsPayload);

      return NextResponse.json(
        {
          success: true,
          count: createdEvents.length,
          recurringGroupId,
          teamName: team.name,
          message: `Successfully booked ${createdEvents.length} practice sessions across the season.`,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Recurring events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process recurring events' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const futureOnly = searchParams.get('futureOnly') === 'true';
    const fromDateStr = searchParams.get('fromDate');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Recurring group ID (groupId) is required' },
        { status: 400 }
      );
    }

    const filter = { recurringGroupId: groupId };

    // futureOnly keeps past sessions (and their attendance history); it defaults to "from now"
    if (futureOnly) {
      const fromDate = fromDateStr ? new Date(fromDateStr) : new Date();
      if (isNaN(fromDate.getTime())) {
        return NextResponse.json({ error: 'Invalid fromDate' }, { status: 400 });
      }
      filter.startTime = { $gte: fromDate };
    }

    const result = await Event.deleteMany(filter);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} recurring sessions.`,
    });
  } catch (error) {
    console.error('Delete recurring series error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete recurring series' },
      { status: 500 }
    );
  }
}
