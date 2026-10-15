import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';

interface RouteContext {
  params: Promise<{ playerId: string }> | { playerId: string };
}

export async function PATCH(
  _req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  await connectToDatabase();

  const { playerId } = await Promise.resolve(context.params);
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Set isActive to false (disable the player)
    player.isActive = false;
    player.isFirstTeam = false; // free the starting spot
    await player.save();

    return NextResponse.json(
      { message: 'Player disabled successfully', player },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error disabling player:', error);
    return NextResponse.json({ error: 'Failed to disable player' }, { status: 500 });
  }
}
