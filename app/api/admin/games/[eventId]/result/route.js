import {NextResponse} from 'next/server';

;
import GameResult from '@/models/GameResult';
import connectToDatabase from "@/lib/mongoose";

export async function GET(request, {params}) {
    try {
        await connectToDatabase();
        const {eventId} = params;

        const gameResult = await GameResult.findOne({event: eventId});

        if (!gameResult) {
            return NextResponse.json(
                {error: 'Game result not found'},
                {status: 404}
            );
        }

        return NextResponse.json({gameResult}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: 'Failed to fetch game result'},
            {status: 500}
        );
    }
}

export async function PUT(request, {params}) {
    try {
        await connectToDatabase();
        const {eventId} = params;
        const data = await request.json();

        const gameResult = await GameResult.findOneAndUpdate(
            {event: eventId},
            data,
            {new: true, runValidators: true}
        );

        if (!gameResult) {
            return NextResponse.json(
                {error: 'Game result not found'},
                {status: 404}
            );
        }

        return NextResponse.json({gameResult}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: error.message},
            {status: 400}
        );
    }
}

export async function POST(request, {params}) {
    try {
        await connectToDatabase();
        const {eventId} = params;
        const data = await request.json();

        // Check if game result already exists
        const existingResult = await GameResult.findOne({event: eventId});
        if (existingResult) {
            return NextResponse.json(
                {error: 'Game result already exists for this event'},
                {status: 400}
            );
        }

        const gameResult = await GameResult.create({
            ...data,
            event: eventId
        });

        return NextResponse.json({gameResult}, {status: 201});
    } catch (error) {
        return NextResponse.json(
            {error: error.message},
            {status: 400}
        );
    }
}