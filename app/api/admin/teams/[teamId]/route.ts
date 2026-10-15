import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import connectToDatabase from "@/lib/mongoose";
import Player from '@/models/Player';
import Team from '@/models/Team';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ teamId: string }> | { teamId: string };
}

interface UpdateTeamBody {
  name?: string;
  description?: string;
  coach?: string;
}

export async function GET(
  _request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  const { teamId } = await Promise.resolve(context.params);
  try {
    await connectToDatabase();

    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ success: false, error: 'Invalid team ID' }, { status: 400 });
    }

    // Find players with the matching teamId
    const players = await Player.find({ team: new mongoose.Types.ObjectId(teamId), isActive: true })
      .select('name position dateOfBirth age lastname height isFirstTeam jerseyNum')
      .populate('team', 'name');
    return NextResponse.json({ success: true, data: players });
  } catch (error: unknown) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ success: false, error: 'Error fetching players' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  const { teamId } = await Promise.resolve(context.params);
  try {
    await connectToDatabase();

    const { name, description, coach } = (await request.json()) as UpdateTeamBody;

    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { name, description, coach },
      { new: true }
    );
    if (!updatedTeam) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    // Return the updated team
    return NextResponse.json(updatedTeam, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating team:', error);
    return NextResponse.json({ success: false, error: 'Error updating team' }, { status: 500 });
  }
}
