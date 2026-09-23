import Player from '@/models/Player';
import connectToDatabase from "@/lib/mongoose";
import {NextResponse} from "next/server";

export async function PATCH(req) {
    try {
        await connectToDatabase();

        const {playerIds} = await req.json();

        const players = await Player.updateMany(
            {_id: {$in: playerIds}},
            {isActive: false}
        );

        return NextResponse.json(players, {status: 200});
    } catch (error) {
        console.error('Error disabling players:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}