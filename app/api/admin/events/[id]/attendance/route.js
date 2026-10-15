import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Event from '@/models/Event';
import Player from '@/models/Player';
import { requireAuth } from '@/lib/authGuard';
import mongoose from 'mongoose';
import { canManageEvent } from '@/lib/access';

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findById(id)
      .populate('team')
      .populate('attendance.player', 'name lastname jerseyNum position profilePicture injuryStatus');

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let attendanceList = event.attendance || [];

    // If no attendance has been recorded yet and event has a team, populate default from team roster
    if (attendanceList.length === 0 && event.team) {
      const teamPlayers = await Player.find({ team: event.team._id || event.team, isActive: true })
        .select('name lastname jerseyNum position profilePicture injuryStatus');

      attendanceList = teamPlayers.map((p) => ({
        player: p,
        status: p.injuryStatus && p.injuryStatus !== 'Healthy' ? 'injured' : 'present',
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
  } catch (error) {
    console.error('Error fetching event attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const event = await Event.findById(id).select('team players');
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (!(await canManageEvent(session, event))) {
      return NextResponse.json({ error: 'Forbidden - You do not coach this team' }, { status: 403 });
    }

    const attendanceRecords = Array.isArray(body.attendance) ? body.attendance : [];

    const cleanedAttendance = attendanceRecords.map((item) => ({
      player: item.player?._id || item.player,
      status: ['present', 'absent', 'excused', 'injured'].includes(item.status) ? item.status : 'present',
      notes: item.notes || '',
    }));

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
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
