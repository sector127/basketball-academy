import connectToDatabase from '@/lib/mongoose';
import Team from '@/models/Team';
import '@/models/User';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";

interface CreateTeamBody {
  name?: string;
  description?: string;
  coach?: string;
}

export async function GET(_req: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const teams = await Team.find({})
      .populate('coach', 'name lastName email role image')
      .populate('assistantCoach', 'name lastName email role image');

    return NextResponse.json(teams, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();

    const { name, description, coach } = (await req.json()) as CreateTeamBody;

    // Validate the input
    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required.' }, { status: 400 });
    }

    // Create a new team
    const newTeam = await Team.create({ name, description, coach: coach || undefined });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating team:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
