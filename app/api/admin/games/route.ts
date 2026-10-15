import connectToDatabase from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import Event, { type IEvent } from "@/models/Event";
// Registers the models populated below
import "@/models/Team";
import "@/models/Venue";
import "@/models/GameResult";
import { toGameSummary, type PopulatedEventGame } from "@/lib/games";

// Games are Events with eventType 'game'; create them through POST /api/admin/events
export async function GET(): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const events = await Event.find({ eventType: 'game' })
      .populate('team')
      .populate('venue')
      .populate('gameResult')
      .sort({ startTime: -1 });

    return NextResponse.json((events as unknown as PopulatedEventGame[]).map(toGameSummary), { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
