import {NextResponse} from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
import Team from '@/models/Team';
import {auth} from '@/auth'; // Adjust path to your auth.ts

export async function GET(request) {
    try {
        await connectToDatabase();

        // Get the session to identify the logged-in user
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                {success: false, error: 'Unauthorized - Please log in'},
                {status: 401}
            );
        }

        const userId = session.user.id;

        // Find all teams where the logged-in user is the coach
        const teams = await Team.find({coach: userId});
        if (!teams || teams.length === 0) {
            return NextResponse.json(
                {success: true, data: [], message: 'No teams found for this coach'},
                {status: 200}
            );
        }

        // Extract team IDs
        const teamIds = teams.map(team => team._id);

        // Fetch all active players from these teams
        const players = await Player.find({
            team: {$in: teamIds},
            isActive: true,
        })
            .select('name lastname position jerseyNum height dateOfBirth age isFirstTeam team guardian guardianTel') // Select relevant fields
            .populate('team', 'name'); // Populate team name

        return NextResponse.json({
            success: true,
            data: players,
        });
    } catch (error) {
        console.error('Error fetching players:', error);
        return NextResponse.json(
            {success: false, error: 'Error fetching players'},
            {status: 500}
        );
    }
}