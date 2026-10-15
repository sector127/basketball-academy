import {NextResponse} from 'next/server';
import {requireAuth} from '@/lib/authGuard';
import GameResult from '@/models/GameResult';
import connectToDatabase from "@/lib/mongoose";
import Event from '@/models/Event';
import {canManageEvent} from '@/lib/access';

const EDITABLE_FIELDS = ['homeTeamScore', 'awayTeamScore', 'periodScores', 'boxScores', 'status'];

function pickEditableFields(data) {
    return Object.fromEntries(
        EDITABLE_FIELDS.filter((key) => data && data[key] !== undefined).map((key) => [key, data[key]])
    );
}

// Coaches may only record results for their own teams' games
async function checkEventAccess(session, eventId) {
    const event = await Event.findById(eventId).select('team players');
    if (!event) {
        return NextResponse.json({error: 'Event not found'}, {status: 404});
    }
    if (!(await canManageEvent(session, event))) {
        return NextResponse.json({error: 'Forbidden - You do not coach this team'}, {status: 403});
    }
    return null;
}

export async function GET(request, {params}) {
    const {errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const {eventId} = await params;
        const gameResult = await GameResult.findOne({event: eventId}).populate('boxScores.player', 'name lastname jerseyNum position');

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
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const {eventId} = await params;
        const accessError = await checkEventAccess(session, eventId);
        if (accessError) return accessError;
        const data = pickEditableFields(await request.json());

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
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const {eventId} = await params;
        const accessError = await checkEventAccess(session, eventId);
        if (accessError) return accessError;
        const data = pickEditableFields(await request.json());
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