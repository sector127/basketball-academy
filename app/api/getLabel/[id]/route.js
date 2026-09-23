import {NextResponse} from "next/server";
import connectToDatabase from "@/lib/mongoose";
import {ObjectId} from "mongodb"; // Import this to handle MongoDB ObjectIds
import mongoose from "mongoose";

export async function GET(request, {params}) {
    const {id} = await params
    const segment = id; // Access the actual parameter value
    const {searchParams} = new URL(request.url);
    const paramsCollection = searchParams.get('collection');

    if (!segment || !/^[0-9a-fA-F]{24}$/.test(segment)) {
        return NextResponse.json({error: "Invalid ID format"}, {status: 400});
    }

    try {
        await connectToDatabase();

        // Access the database through mongoose.connection
        const db = mongoose.connection.db;
        const collection = db.collection(`${paramsCollection}`);

        // Fetch the document by _id using proper ObjectId conversion
        const document = await collection.findOne({_id: new ObjectId(segment)});

        if (!document) {
            return NextResponse.json({error: "Document not found"}, {status: 404});
        }

        // Return the user-friendly label
        return NextResponse.json({label: document.lastname ? `${document.name} ${document.lastname}` : document.name || segment});
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({error: "Server error"}, {status: 500});
    }
}