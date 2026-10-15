import {NextResponse} from "next/server";
import connectToDatabase from "@/lib/mongoose";
import {ObjectId} from "mongodb";
import mongoose from "mongoose";
import {requireAuth} from "@/lib/authGuard";

const ALLOWED_COLLECTIONS = new Set(['players', 'teams', 'venues', 'events', 'games', 'coaches', 'users']);
export async function GET(request, {params}) {
    const {errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;

    const {id} = await params;
    const segment = id;
    const {searchParams} = new URL(request.url);
    const paramsCollection = searchParams.get('collection');

    if (!paramsCollection || !ALLOWED_COLLECTIONS.has(paramsCollection)) {
        return NextResponse.json({label: segment}, {status: 200});
    }

    if (!segment || !/^[0-9a-fA-F]{24}$/.test(segment)) {
        return NextResponse.json({label: segment}, {status: 200});
    }

    try {
        await connectToDatabase();

        // Access the database through mongoose.connection
        const db = mongoose.connection.db;
        const dbCollectionName = paramsCollection === 'coaches' ? 'users' : paramsCollection;
        const collection = db.collection(dbCollectionName);

        // Fetch the document by _id using proper ObjectId conversion
        const document = await collection.findOne({_id: new ObjectId(segment)});

        if (!document) {
            return NextResponse.json({error: "Document not found"}, {status: 404});
        }

        // Return the user-friendly label
        const fullName = (document.lastName || document.lastname) ? `${document.name} ${document.lastName || document.lastname}` : document.name;
        return NextResponse.json({label: fullName || segment});
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({error: "Server error"}, {status: 500});
    }
}