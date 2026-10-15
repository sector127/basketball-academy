import {isVenueAvailable} from "@/lib/venueAvailability";
import {NextResponse} from 'next/server';
import {requireAuth} from "@/lib/authGuard";
import connectToDatabase from "@/lib/mongoose";
import Event from "@/models/Event";
import Venue from "@/models/Venue"
import Player from "@/models/Player";
import Team from "@/models/Team";
import GameResult from "@/models/GameResult";
import {PLAYER_PUBLIC_FIELDS, canManageEvent} from "@/lib/access";

export async function GET() {
    const {errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const events = await Event.find({}).populate('team').populate('gameResult').populate('venue').populate('players', PLAYER_PUBLIC_FIELDS);
        return NextResponse.json(events, {status: 200});
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.error();
    }
}

export async function POST(request) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;
    try {
        const userRole = (session?.user?.role || '').toLowerCase();
        const data = await request.json();

        // Coaches are strictly restricted to scheduling individual/skills training only
        if (userRole === 'coach' && data.eventType !== 'individualTraining') {
            return NextResponse.json(
                {error: 'Coaches are only authorized to schedule Skills & Individual Training sessions. Matches and team practices are administrative and must be scheduled through the admin dashboard.'},
                {status: 403}
            );
        }

        await connectToDatabase();

        if (userRole === 'coach' && !(await canManageEvent(session, data))) {
            return NextResponse.json(
                {error: 'Coaches can only schedule sessions for their own teams and players.'},
                {status: 403}
            );
        }

        // Check venue availability for all events with a venue
        if (data.venue) {
            const isAvailable = await isVenueAvailable(
                data.venue,
                new Date(data.startTime),
                new Date(data.endTime)
            );

            if (!isAvailable) {
                return NextResponse.json(
                    {error: 'Venue is not available during the selected time slot'},
                    {status: 409} // Conflict status code
                );
            }
        }

        const cleanedData = { ...data };
        if (!cleanedData.team) delete cleanedData.team;
        if (!cleanedData.venue) delete cleanedData.venue;
        if (!cleanedData.players || cleanedData.players.length === 0) delete cleanedData.players;

        let title = cleanedData.title;
        if (cleanedData.eventType === 'game') {
            const team = cleanedData.team ? await Team.findById(cleanedData.team) : null;
            title = team ? `${team.name} vs ${cleanedData.opponent}` : (cleanedData.opponent ? `BBA vs ${cleanedData.opponent}` : cleanedData.title);
        }
        const event = await Event.create({...cleanedData, title});

        // If it's a game, create initial game result
        if (event.eventType === 'game') {
            await GameResult.create({
                event: event._id,
                periodScores: [
                    {period: 1, homeScore: 0, awayScore: 0},
                    {period: 2, homeScore: 0, awayScore: 0},
                    {period: 3, homeScore: 0, awayScore: 0},
                    {period: 4, homeScore: 0, awayScore: 0}
                ]
            });
        }

        return NextResponse.json({event}, {status: 201});
    } catch (error) {
        return NextResponse.json(
            {error: error.message},
            {status: 400}
        );
    }
}


