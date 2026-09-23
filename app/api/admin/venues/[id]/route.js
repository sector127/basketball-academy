import connectToDatabase from "@/lib/mongoose";
import {NextResponse} from "next/server";
import Venue from "@/models/Venue";

export async function GET(request, {params}) {
    try {
        await connectToDatabase();
        const {id} = await params;

        const venue = await Venue.findById(id)

        if (!venue) {
            return NextResponse.json(
                {error: 'Venue not found'},
                {status: 404}
            );
        }

        return NextResponse.json({venue}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: 'Failed to fetch venue'},
            {status: 500}
        );
    }
}

export async function PUT(request, {params}) {
    try {
        await connectToDatabase();
        const {id} = params;
        const data = await request.json();

        const venue = await Venue.findByIdAndUpdate(
            id,
            data,
            {new: true, runValidators: true}
        );

        if (!venue) {
            return NextResponse.json(
                {error: 'Venue not found'},
                {status: 404}
            );
        }

        return NextResponse.json({venue}, {status: 200});
    } catch (error) {
        return NextResponse.json(
            {error: error.message},
            {status: 400}
        );
    }
}

export async function DELETE(request, {params}) {
    try {
        await connectToDatabase();
        const {id} = params;

        const venue = await Venue.findById(id);

        if (!venue) {
            return NextResponse.json(
                {error: 'Venue not found'},
                {status: 404}
            );
        }

    } catch (error) {
        return NextResponse.json(
            {error: 'Failed to delete event'},
            {status: 500}
        );
    }
}