import Player from '@/models/Player';
import connectToDatabase from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";

interface DisablePlayersBody {
  playerIds?: string[];
}

export async function PATCH(req: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();

    const { playerIds } = (await req.json()) as DisablePlayersBody;

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: 'Player IDs are required' }, { status: 400 });
    }

    const players = await Player.updateMany(
      { _id: { $in: playerIds } },
      { isActive: false, isFirstTeam: false }
    );

    return NextResponse.json(players, { status: 200 });
  } catch (error: unknown) {
    console.error('Error disabling players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
