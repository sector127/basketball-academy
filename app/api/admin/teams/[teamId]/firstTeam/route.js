import {NextResponse} from "next/server";
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';

export async function GET(req, {params}) {
    await connectToDatabase();

    const {teamId} = params;

    try {
        // Fetch players from the specific team who are in the first team
        const firstTeamPlayers = await Player.find({team: teamId, isFirstTeam: true}).populate('team');
        return NextResponse.json(firstTeamPlayers);
    } catch (error) {
        console.error('Error fetching first team players:', error);
        return NextResponse.json({error: 'Failed to fetch first team players'}, {status: 500});
    }
}

export async function PATCH(req, {params}) {
    await connectToDatabase();

    const {teamId} = await params;
    const {playerId, isFirstTeam} = await req.json();

    try {
        // Check if the player exists and belongs to the team
        const player = await Player.findOne({_id: playerId, team: teamId});
        if (!player) {
            return NextResponse.json({error: 'Player not found in this team'}, {status: 404});
        }

        // If setting isFirstTeam to true, check if there are already 5 players in the first team for this team
        if (isFirstTeam) {
            const firstTeamPlayersCount = await Player.countDocuments({team: teamId, isFirstTeam: true});
            if (firstTeamPlayersCount >= 5) {
                return NextResponse.json(
                    {error: 'First team already has 5 players'},
                    {status: 400}
                );
            }

            // Check if a player with the same position already exists in the first team
            const existingPlayerInPosition = await Player.findOne({
                team: teamId,
                isFirstTeam: true,
                position: player.position,
            });

            if (existingPlayerInPosition) {
                return NextResponse.json(
                    {
                        error: `A player with the position ${player.position} already exists in the first team, please edit ${player.name}'s position before adding.`,
                    },
                    {status: 400}
                );
            }
        }

        // Update the player's isFirstTeam status
        player.isFirstTeam = isFirstTeam;
        await player.save();

        return NextResponse.json(
            {message: `Player ${isFirstTeam ? 'added to' : 'removed from'} first team`, player},
            {status: 200}
        );
    } catch (error) {
        console.error('Error updating first team status:', error);
        return NextResponse.json({error: 'Failed to update first team status'}, {status: 500});
    }
}