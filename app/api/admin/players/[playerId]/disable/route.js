import {NextResponse} from "next/server";
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';

export async function PATCH(req, {params}) {
    await connectToDatabase();

    const {playerId} = params;
    console.log(playerId);

    try {
        const player = await Player.findById(playerId);
        if (!player) {
            return NextResponse.json({error: 'Player not found'}, {status: 404});
        }

        // Set isActive to false (disable the player)
        player.isActive = false;
        await player.save();

        return NextResponse.json(
            {message: 'Player disabled successfully', player},
            {status: 200}
        );
    } catch (error) {
        console.error('Error disabling player:', error);
        return NextResponse.json({error: 'Failed to disable player'}, {status: 500});
    }
}