import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Team, { type ITeam } from '@/models/Team';
import { requireAuth } from '@/lib/authGuard';
import type { FilterQuery } from 'mongoose';

export async function GET(_req: NextRequest | Request): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    const userId = session.user.id;
    const userRole = (session.user.role || '').toLowerCase();

    let query: FilterQuery<ITeam> = {};
    if (userRole !== 'admin') {
      query = {
        $or: [{ coach: userId }, { assistantCoach: userId }],
      };
    }

    const teams = await Team.find(query).populate('coach', 'name lastName email');
    return NextResponse.json(teams, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching coach teams:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
