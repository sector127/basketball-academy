import {NextResponse} from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
import Team from '@/models/Team';
import {requireAuth} from '@/lib/authGuard';

export async function GET(request) {
    try {
        await connectToDatabase();

        const {session, errorResponse} = await requireAuth(['admin', 'coach']);
        if (errorResponse) return errorResponse;

        const userId = session.user.id;
        const userRole = (session.user.role || '').toLowerCase();

        let playerQuery = { isActive: true };

        if (userRole !== 'admin') {
            // Find all teams where the logged-in user is coach or assistantCoach
            const teams = await Team.find({
                $or: [{coach: userId}, {assistantCoach: userId}]
            });
            if (!teams || teams.length === 0) {
                return NextResponse.json(
                    {success: true, data: [], message: 'No teams found for this coach'},
                    {status: 200}
                );
            }
            const teamIds = teams.map(team => team._id);
            playerQuery.team = {$in: teamIds};
        }

        // Fetch all active players from these teams
        const players = await Player.find(playerQuery)
            .select('name lastname position jerseyNum height dateOfBirth age isFirstTeam team guardian guardianTel profilePicture')
            .populate('team', 'name');
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