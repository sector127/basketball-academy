import connectToDatabase from "@/lib/mongoose";
import {NextResponse} from "next/server";
import Venue from "@/models/Venue";

export async function GET() {
    try {
        await connectToDatabase();
        const venues = await Venue.find({})
        return NextResponse.json(venues, {status: 200});
    } catch (error) {
        console.error('Error fetching venues:', error);
        return NextResponse.error();
    }
}

export async function POST(request) {
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