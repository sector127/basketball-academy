import {NextResponse} from 'next/server';
import connectToDatabase from "@/lib/mongoose";
import Player from '@/models/Player';
import Team from '@/models/Team'; // Import your Team model
import mongoose from 'mongoose';
import {auth} from '@/auth';

export async function GET(request, {params}) {
    const {teamId} = await params;

    try {
        await connectToDatabase();

        // Get the session
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                {success: false, error: 'Unauthorized - Please log in'},
                {status: 401}
            );
        }

        const userId = session.user.id;

        // Validate teamId
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return NextResponse.json(
                {success: false, error: 'Invalid team ID'},
                {status: 400}
            );
        }

        // Find the team by teamId and check if the coach matches the userId
        const team = await Team.findById(new mongoose.Types.ObjectId(teamId));
        if (!team) {
            return NextResponse.json(
                {success: false, error: 'Team not found'},
                {status: 404}
            );
        }

        // Check if the team's coach matches the userId
        if (!team.coach || team.coach.toString() !== userId) {
            return NextResponse.json(
                {success: false, error: 'Unauthorized - Not a team coach'},
                {status: 403}
            );
        }

        // Find players with the matching teamId
        const players = await Player.find({
            team: new mongoose.Types.ObjectId(teamId),
            isActive: true,
        })
            .select('name position dateOfBirth age lastname height isFirstTeam jerseyNum')
            .populate('team', 'name');

        return NextResponse.json({success: true, data: players});
    } catch (error) {
        console.error('Error fetching players:', error);
        return NextResponse.json(
            {success: false, error: 'Error fetching players'},
            {status: 500}
        );
    }
}