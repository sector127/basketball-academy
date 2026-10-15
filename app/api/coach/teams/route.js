import connectToDatabase from '@/lib/mongoose';
import Team from '@/models/Team';
import {NextResponse} from 'next/server';
import {requireAuth} from '@/lib/authGuard';
export async function GET(req) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;

    try {
        await connectToDatabase();

        const userId = session.user.id;
        const userRole = (session.user.role || '').toLowerCase();

        let query = {};
        if (userRole !== 'admin') {
            query = {
                $or: [{coach: userId}, {assistantCoach: userId}],
            };
        }

        const teams = await Team.find(query).populate('coach', 'name lastName email');
        return NextResponse.json(teams, {status: 200});
    } catch (error) {
        console.error('Error fetching coach teams:', error);
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        );
    }
}

