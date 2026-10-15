import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/authGuard";

const ALLOWED_COLLECTIONS = new Set(['players', 'teams', 'venues', 'events', 'games', 'coaches', 'users']);

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

interface GenericDoc {
  name?: string;
  lastName?: string;
  lastname?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest | Request, context: RouteContext): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;

  const { id } = await Promise.resolve(context.params);
  const segment = id;
  const { searchParams } = new URL(request.url);
  const paramsCollection = searchParams.get('collection');

  if (!paramsCollection || !ALLOWED_COLLECTIONS.has(paramsCollection)) {
    return NextResponse.json({ label: segment }, { status: 200 });
  }

  if (!segment || !/^[0-9a-fA-F]{24}$/.test(segment)) {
    return NextResponse.json({ label: segment }, { status: 200 });
  }

  try {
    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    const dbCollectionName = paramsCollection === 'coaches' ? 'users' : paramsCollection;
    const collection = db.collection<GenericDoc>(dbCollectionName);

    const document = await collection.findOne({ _id: new ObjectId(segment) });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const lastName = document.lastName || document.lastname;
    const fullName = lastName ? `${document.name} ${lastName}` : document.name;
    return NextResponse.json({ label: fullName || segment });
  } catch (error: unknown) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
