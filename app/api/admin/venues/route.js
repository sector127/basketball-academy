import connectToDatabase from "@/lib/mongoose";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/authGuard";
import Venue from "@/models/Venue";

export async function GET() {
    const {errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        // Archived venues (isActive: false) are kept only for past events' history
        const venues = await Venue.find({isActive: {$ne: false}})
        return NextResponse.json(venues, {status: 200});
    } catch (error) {
        console.error('Error fetching venues:', error);
        return NextResponse.json({error: 'Failed to fetch venues'}, {status: 500});
    }
}

export async function POST(request) {
    const {errorResponse} = await requireAuth(['admin']);
    if (errorResponse) return errorResponse;
    try {
        // Connect to the database
        await connectToDatabase();

        // Parse the request body
        const data = await request.json();

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
        return NextResponse.json({venue}, {status: 201});
    } catch (error) {
        console.error('Error creating venue:', error);

        // Return a detailed error response
        return NextResponse.json(
            {error: error.message || 'An error occurred while creating the venue'},
            {status: 400}
        );
    }
}