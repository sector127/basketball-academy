import {isVenueAvailable} from "@/lib/venueAvailability";
import {NextResponse} from 'next/server';
import connectToDatabase from "@/lib/mongoose";
import Event from "@/models/Event";
import Game from "@/models/Game";
import Venue from "@/models/Venue"
import Player from "@/models/Player";
import Team from "@/models/Team";
import GameResult from "@/models/GameResult";

export async function GET() {
    try {
        await connectToDatabase();
        const events = await Event.find({}).populate('team').populate('gameResult').populate('venue').populate('players');
        return NextResponse.json(events, {status: 200});
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.error();
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const data = await request.json();

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

        const team = await Team.findById(data.team);
        const title = data.eventType === 'game' ? `${team.name} vs ${data.opponent}` : data.title;
        const event = await Event.create({...data, title});

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


