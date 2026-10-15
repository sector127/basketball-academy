import connectToDatabase from "@/lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import Venue from "@/models/Venue";

interface VenueLocationInput {
  type?: string;
  coordinates?: [number, number];
}

interface CreateVenueInput {
  name?: string;
  address?: string;
  capacity?: number;
  type?: string;
  description?: string;
  location?: VenueLocationInput;
  [key: string]: unknown;
}

export async function GET(): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    // Archived venues (isActive: false) are kept only for past events' history
    const venues = await Venue.find({ isActive: { $ne: false } });
    return NextResponse.json(venues, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching venues:', error);
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const data = (await request.json()) as CreateVenueInput;

    // Validate the location field
    if (!data.location || !data.location.type || !data.location.coordinates) {
      throw new Error('Invalid location data. Location must be a valid GeoJSON object.');
    }

    // Ensure coordinates are valid numbers
    const [longitude, latitude] = data.location.coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new Error('Invalid coordinates. Longitude and latitude must be numbers.');
    }

    // Create the venue in the database
    const venue = await Venue.create(data);

    // Return the created venue
    return NextResponse.json({ venue }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating venue:', error);
    const message = error instanceof Error ? error.message : 'An error occurred while creating the venue';
    // Return a detailed error response
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
