import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import connectToDatabase from '@/lib/mongoose';
import Player, { type PlayerPosition, type GuardianRelationship } from '@/models/Player';
import Team from '@/models/Team';
import { UploadError, deleteUpload, isUploadedFile, saveImageUpload } from "@/lib/uploads";
import { PLAYER_PUBLIC_FIELDS, canManageTeam, canViewPlayerContacts } from "@/lib/access";
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ playerId: string }> | { playerId: string };
}

interface MongoError extends Error {
  code?: number;
}

export async function GET(
  _req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  await connectToDatabase();
  const { playerId } = await Promise.resolve(context.params);
  const fields = canViewPlayerContacts(session.user.role) ? '' : PLAYER_PUBLIC_FIELDS;

  try {
    if (playerId) {
      const player = await Player.findById(playerId).select(fields).populate('team');
      if (player) {
        return NextResponse.json(player);
      } else {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
    } else {
      const players = await Player.find({}).select(fields).populate('team');
      return NextResponse.json(players);
    }
  } catch (error: unknown) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { playerId } = await Promise.resolve(context.params);

    // Parse form data
    const formData = await req.formData();
    const player = await Player.findById(playerId);

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Coaches may only edit players on their teams, and only move them between their teams
    // (an empty teamId would unassign the player, so it counts as a team the coach can't manage)
    const targetTeamId = formData.get('teamId') as string | null;
    if (
      !(await canManageTeam(session, player.team)) ||
      !(await canManageTeam(session, targetTeamId))
    ) {
      return NextResponse.json(
        { error: "Forbidden - You do not coach this player's team" },
        { status: 403 }
      );
    }

    // The new photo is stored only after all checks pass (see below)
    const profilePicture = formData.get('profilePicture');

    // Handle team assignment
    const previousTeamId = player.team ? player.team.toString() : null;
    if (targetTeamId) {
      const team = await Team.findById(targetTeamId);
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
      player.team = team._id;
    } else {
      player.team = undefined;
    }
    // A starter on the old team isn't automatically a starter on the new one
    if ((player.team ? player.team.toString() : null) !== previousTeamId) {
      player.isFirstTeam = false;
    }

    // Handle jersey number uniqueness
    const jerseyNumStr = formData.get('jerseyNum') as string | null;
    const jerseyNum = jerseyNumStr ? parseInt(jerseyNumStr, 10) : NaN;
    if (!isNaN(jerseyNum) && targetTeamId) {
      const existingPlayer = await Player.findOne({ jerseyNum, team: targetTeamId, isActive: { $ne: false } });
      if (existingPlayer && existingPlayer._id.toString() !== playerId) {
        return NextResponse.json(
          { error: `Player with jersey number ${jerseyNum} already exists in this team` },
          { status: 409 }
        );
      }
      player.jerseyNum = jerseyNum;
    }

    // Update other player details
    const nameVal = formData.get('name') as string | null;
    if (nameVal) player.name = nameVal;

    const lastnameVal = formData.get('lastname') as string | null;
    if (lastnameVal) player.lastname = lastnameVal;

    const dobVal = formData.get('dateOfBirth') as string | null;
    if (dobVal) player.dateOfBirth = new Date(dobVal);

    const heightStr = formData.get('height') as string | null;
    const height = heightStr ? parseFloat(heightStr) : NaN;
    if (!isNaN(height)) player.height = height;

    const posVal = formData.get('position') as string | null;
    if (posVal) player.position = posVal as PlayerPosition;

    const telVal = formData.get('tel') as string | null;
    if (telVal) player.tel = telVal;

    const addrVal = formData.get('address') as string | null;
    if (addrVal) player.address = addrVal;

    const guardVal = formData.get('guardian') as string | null;
    if (guardVal) player.guardian = guardVal as GuardianRelationship;

    const guardTelVal = formData.get('guardianTel') as string | null;
    if (guardTelVal) player.guardianTel = guardTelVal;

    // Store the new photo, save, then remove the old photo (or the new one if saving fails)
    let previousPicture: string | null = null;
    let newPicture: string | null = null;
    if (isUploadedFile(profilePicture)) {
      previousPicture = player.profilePicture || null;
      newPicture = await saveImageUpload(profilePicture);
      player.profilePicture = newPicture;
    }
    let updatedPlayer;
    try {
      updatedPlayer = await player.save();
    } catch (saveError) {
      if (newPicture) await deleteUpload(newPicture);
      throw saveError;
    }
    if (previousPicture) await deleteUpload(previousPicture);
    await updatedPlayer.populate('team');

    return NextResponse.json(updatedPlayer, { status: 200 });
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
    const mongoErr = error as MongoError;
    if (mongoErr.code === 11000) {
      return NextResponse.json(
        { error: 'This team already has a starter in that position. Change the position or remove them from the starting five first.' },
        { status: 409 }
      );
    }
    console.error('Error updating player:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}
