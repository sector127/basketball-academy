import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';

interface RouteContext {
  params: Promise<{ coachId: string }> | { coachId: string };
}

interface PatchBody {
  isActive?: boolean;
}

export async function PATCH(
  req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { coachId } = await Promise.resolve(context.params);

    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    let explicitState: boolean | undefined;
    try {
      const body = (await req.json()) as PatchBody;
      if (body && typeof body.isActive === 'boolean') {
        explicitState = body.isActive;
      }
    } catch {
      // Body may be empty on plain PATCH toggle
    }

    coach.isActive = explicitState !== undefined ? explicitState : coach.isActive === false;
    await coach.save();

    const coachData = coach.toObject() as unknown as Record<string, unknown>;
    delete coachData.password;

    return NextResponse.json(
      {
        message: coach.isActive ? 'Coach activated successfully' : 'Coach disabled successfully',
        coach: coachData,
        isActive: coach.isActive,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error toggling coach status:', error);
    return NextResponse.json({ error: 'Failed to update coach status' }, { status: 500 });
  }
}
