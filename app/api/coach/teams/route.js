import {getToken} from 'next-auth/jwt'; // Use getToken to retrieve the session
import connectToDatabase from '@/lib/mongoose';
import Team from '@/models/Team';
import {NextResponse} from 'next/server';

export async function GET(req) {
    try {
        // Retrieve the session token
        const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});

        // If no token or user is not a coach, deny access
        if (!token || token.role !== 'coach') {
            return NextResponse.json(
                {message: 'Access Denied'},
                {status: 403}
            );
        }

        // Connect to the database
        await connectToDatabase();

        // Fetch teams coached by the logged-in coach
        const teams = await Team.find({coach: token.sub}); // Assuming `coach` field in Team schema references the coach's ID

        // Return the teams
        return NextResponse.json(teams, {status: 200});
    } catch (error) {
        console.error('Error fetching teams:', error);
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        );
    }
}


