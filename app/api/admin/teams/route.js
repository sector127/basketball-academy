import connectToDatabase from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/authGuard";
export async function GET(req) {
    const {errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const teams = await Team.find({}).populate('coach', 'name lastName email role image').populate('assistantCoach', 'name lastName email role image');

        return new Response(JSON.stringify(teams), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        return new Response(JSON.stringify({message: 'Internal Server Error'}), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function POST(req) {
    const {errorResponse} = await requireAuth(['admin']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();

        const {name, description, coach} = await req.json();

        // Validate the input
        if (!name || !description) {
            return NextResponse.json({error: 'Name and description are required.'}, {status: 400});
        }

        // Create a new team
        const newTeam = await Team.create({name, description, coach});

        return NextResponse.json(newTeam, {status: 201});
    } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
    }
}

