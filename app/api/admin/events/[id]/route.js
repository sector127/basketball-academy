import {NextResponse} from 'next/server';
import Event from '@/models/Event';
import GameResult from '@/models/GameResult';
import connectToDatabase from "@/lib/mongoose";
import Team from '@/models/Team'
import Player from "@/models/Player";
import {isVenueAvailable} from "@/lib/venueAvailability";

export async function GET(request, {params}) {
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

export async function PUT(request) {
    try {
        await connectToDatabase();
        const data = await request.json();
        const {id} = data;

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json(
                {error: 'Event not found'},
                {status: 404}
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

        const team = await Team.findById(data.team);
        const title = data.eventType === 'game' ? `${team.name} vs ${data.opponent}` : data.title;

        const updatedEvent = await Event.findByIdAndUpdate(id, {...data, title}, {new: true});

        return NextResponse.json({event: updatedEvent}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: error.message},
            {status: 400}
        );
    }
}


export async function DELETE(request, {params}) {
    try {
        await connectToDatabase();
        const {id} = params;

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json(
                {error: 'Event not found'},
                {status: 404}
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