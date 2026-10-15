import Player from '@/models/Player';
import connectToDatabase from "@/lib/mongoose";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/authGuard";

export async function PATCH(req) {
    const {errorResponse} = await requireAuth(['admin']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();

        const {playerIds} = await req.json();

        const players = await Player.updateMany(
            {_id: {$in: playerIds}},
            {isActive: false, isFirstTeam: false}
        );

        return NextResponse.json(players, {status: 200});
    } catch (error) {
        console.error('Error disabling players:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}