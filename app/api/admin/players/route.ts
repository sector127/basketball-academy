import connectToDatabase from '@/lib/mongoose';
import Player, { type IPlayer } from '@/models/Player';
import Team from "@/models/Team";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { UploadError, deleteUpload, isUploadedFile, saveImageUpload } from '@/lib/uploads';
import { PLAYER_PUBLIC_FIELDS, canViewPlayerContacts } from '@/lib/access';
import type { FilterQuery } from 'mongoose';
import mongoose from 'mongoose';

export async function GET(req: NextRequest | Request): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const url = new URL(req.url, 'http://localhost');
    const includeAll = url.searchParams.get('all') === 'true';
    const filter: FilterQuery<IPlayer> = includeAll ? {} : { isActive: true };
    const query = Player.find(filter).populate('team');
    if (!canViewPlayerContacts(session.user.role)) query.select(PLAYER_PUBLIC_FIELDS);
    const players = await query;

    return NextResponse.json(players, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();

    // Get form data from the request
    const formData = await request.formData();

    // Extract data for validation first
    const teamId = formData.get('teamId') as string | null;
    const jerseyNumStr = formData.get('jerseyNum') as string | null;
    const jerseyNum = jerseyNumStr ? parseInt(jerseyNumStr, 10) : NaN;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check for existing player with same jersey number
    const existingPlayer = await Player.findOne({ jerseyNum, team: teamId, isActive: { $ne: false } });
    if (existingPlayer) {
      return NextResponse.json(
        { error: `Player with jersey number ${jerseyNum} already exists in this team` },
        { status: 409 }
      );
    }

    // Only proceed with file upload after all validations pass
    let profilePicturePath = '/uploads/default-profile-picture.jpg';
    const profilePicture = formData.get('profilePicture');

    if (isUploadedFile(profilePicture)) {
      profilePicturePath = await saveImageUpload(profilePicture);
    }

    const heightStr = formData.get('height') as string | null;
    const height = heightStr ? parseFloat(heightStr) : NaN;

    // Create player object with all form data
    const playerData = {
      name: (formData.get('name') as string) || '',
      lastname: (formData.get('lastname') as string) || '',
      dateOfBirth: (formData.get('dateOfBirth') as string) || '',
      height,
      position: (formData.get('position') as string) || '',
      jerseyNum,
      team: team._id,
      tel: (formData.get('tel') as string) || '',
      address: (formData.get('address') as string) || '',
      guardian: (formData.get('guardian') as string) || '',
      guardianTel: (formData.get('guardianTel') as string) || '',
      profilePicture: profilePicturePath,
      createdAt: new Date(),
      isActive: true,
    };

    // Create new player (and don't leave an orphaned upload behind if it's invalid)
    let newPlayer;
    try {
      newPlayer = await Player.create(playerData);
    } catch (createError) {
      await deleteUpload(profilePicturePath);
      throw createError;
    }
    await newPlayer.populate('team');

    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: Object.values(error.errors).map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('Error creating player:', error);
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
