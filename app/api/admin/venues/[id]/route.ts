import connectToDatabase from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import Venue from "@/models/Venue";
import Event from "@/models/Event";

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  _request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { id } = await Promise.resolve(context.params);

    const venue = await Venue.findById(id);

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ venue }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { id } = await Promise.resolve(context.params);
    const data: unknown = await request.json();

    const venue = await Venue.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ venue }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const { id } = await Promise.resolve(context.params);

    const venue = await Venue.findById(id);

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    const upcomingCount = await Event.countDocuments({ venue: venue._id, endTime: { $gte: new Date() } });
    if (upcomingCount > 0) {
      return NextResponse.json(
        { error: `This venue has ${upcomingCount} upcoming event(s). Move or delete them before removing the venue.` },
        { status: 409 }
      );
    }

    // Past events still point at this venue; archive it so their history keeps the venue details
    const hasHistory = await Event.exists({ venue: venue._id });
    if (hasHistory) {
      venue.isActive = false;
      await venue.save();
      return NextResponse.json(
        { message: 'Venue archived (it is referenced by past events)', archived: true },
        { status: 200 }
      );
    }

    await venue.deleteOne();
    return NextResponse.json(
      { message: 'Venue deleted successfully' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete venue' },
      { status: 500 }
    );
  }
}
