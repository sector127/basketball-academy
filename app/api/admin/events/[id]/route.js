import {NextResponse} from 'next/server';
import {requireAuth} from "@/lib/authGuard";
import Event from '@/models/Event';
import GameResult from '@/models/GameResult';
import connectToDatabase from "@/lib/mongoose";
import Team from '@/models/Team'
import Player from "@/models/Player";
import {isVenueAvailable} from "@/lib/venueAvailability";
import {canManageEvent} from "@/lib/access";

export async function GET(request, {params}) {
    const {errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const {id} = await params;

        const event = await Event.findById(id)
            .populate('team')
            .populate('gameResult');

        if (!event) {
            return NextResponse.json(
                {error: 'Event not found'},
                {status: 404}
            );
        }

        return NextResponse.json({event}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: 'Failed to fetch event'},
            {status: 500}
        );
    }
}

export async function PUT(request, {params}) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;
    try {
        const userRole = (session?.user?.role || '').toLowerCase();
        await connectToDatabase();
        const data = await request.json();
        const {id} = await params;

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json(
                {error: 'Event not found'},
                {status: 404}
            );
        }

        // Coaches can only modify skills and individual training sessions
        if (userRole === 'coach' && (event.eventType !== 'individualTraining' || (data.eventType && data.eventType !== 'individualTraining'))) {
            return NextResponse.json(
                {error: 'Coaches can only modify Skills & Individual Training sessions. Matches and team practices are managed by administration.'},
                {status: 403}
            );
        }

        // Coaches must own both the stored event and whatever it is being changed to.
        // Empty team/players in the payload keep the stored values (see cleanedData below).
        if (userRole === 'coach' && (
            !(await canManageEvent(session, event)) ||
            !(await canManageEvent(session, {
                team: data.team || event.team,
                players: Array.isArray(data.players) && data.players.length > 0 ? data.players : event.players,
            }))
        )) {
            return NextResponse.json(
                {error: 'Coaches can only modify sessions for their own teams and players.'},
                {status: 403}
            );
        }

        // Check venue availability for all events with a venue
        if (data.venue) {
            const isAvailable = await isVenueAvailable(
                data.venue,
                new Date(data.startTime),
                new Date(data.endTime),
                id // Pass eventId to exclude current event when checking availability
            );

            if (!isAvailable) {
                return NextResponse.json(
                    {error: 'Venue is not available during the selected time slot'},
                    {status: 409}
                );
            }
        }
        const cleanedData = { ...data };
        delete cleanedData._id;
        delete cleanedData.id;
        if (!cleanedData.team) delete cleanedData.team;
        if (!cleanedData.venue) delete cleanedData.venue;
        if (!cleanedData.players || cleanedData.players.length === 0) delete cleanedData.players;

        let title = cleanedData.title;
        if (cleanedData.eventType === 'game') {
            const team = cleanedData.team ? await Team.findById(cleanedData.team) : null;
            title = team ? `${team.name} vs ${cleanedData.opponent}` : (cleanedData.opponent ? `BBA vs ${cleanedData.opponent}` : cleanedData.title);
        }

        const updatedEvent = await Event.findByIdAndUpdate(id, {...cleanedData, title}, {new: true});

        return NextResponse.json({event: updatedEvent}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: error.message},
            {status: 400}
        );
    }
}


export async function DELETE(request, {params}) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;
    try {
        const userRole = (session?.user?.role || '').toLowerCase();
        await connectToDatabase();
        const {id} = await params;
        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json(
                {error: 'Event not found'},
                {status: 404}
            );
        }

        // Coaches can only delete skills and individual training sessions for their own teams
        if (userRole === 'coach' && (event.eventType !== 'individualTraining' || !(await canManageEvent(session, event)))) {
            return NextResponse.json(
                {error: 'Coaches can only delete Skills & Individual Training sessions. Matches and team practices are managed by administration.'},
                {status: 403}
            );
        }

        // Delete associated game result if it exists
        if (event.eventType === 'game') {
            await GameResult.findOneAndDelete({event: id});
        }

        await event.deleteOne();

        return NextResponse.json(
            {message: 'Event deleted successfully'},
            {status: 200}
        );
    } catch (error) {
        return NextResponse.json(
            {error: 'Failed to delete event'},
            {status: 500}
        );
    }
}