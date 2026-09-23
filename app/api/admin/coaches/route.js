import connectToDatabase from '@/lib/mongoose';
import Coach from '@/models/Coach';
import User from '@/models/User';
import {NextResponse} from "next/server";

export async function GET(req) {
    try {
        await connectToDatabase();
        const coaches = await User.find({role: 'coach'});

        return NextResponse.json(coaches, {status: 200});
    } catch (error) {
        console.error('Error fetching coaches:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}

export async function POST(req) {
    try {
        await connectToDatabase();
        const coach = await Coach.create(req.body);

        return NextResponse.json(coach, {status: 201});
    } catch (error) {
        console.error('Error creating coach:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}
