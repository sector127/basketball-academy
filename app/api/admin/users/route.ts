import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/mongoose';
import { requireAuth } from '@/lib/authGuard';
import User from '@/models/User';
import '@/models/Team';
import { MANAGED_ROLES, validatePlayerIds } from '@/lib/accounts';

const USER_FIELDS = 'name lastName email role isActive pendingApproval registrationNote passwordResetRequestedAt players createdAt';

export async function GET(): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const users = await User.find({ role: { $in: MANAGED_ROLES } })
      .select(USER_FIELDS)
      .populate({ path: 'players', select: 'name lastname jerseyNum team isActive', populate: { path: 'team', select: 'name' } })
      .sort({ pendingApproval: -1, passwordResetRequestedAt: -1, createdAt: -1 })
      .lean();
    return NextResponse.json(users, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['staff', 'player', 'guardian']),
  players: z.array(z.string()).optional().default([]),
});

// Admin creates an account directly (already approved)
export async function POST(request: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;

  const json: unknown = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid account details' }, { status: 400 });
  }
  const data = parsed.data;
  try {
    await connectToDatabase();
    const existing = await User.findOne({ email: data.email }).collation({ locale: 'en', strength: 2 });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }
    const players = await validatePlayerIds(data.players);
    if (!players) {
      return NextResponse.json({ error: 'One or more linked players were not found' }, { status: 400 });
    }
    const user = await User.create({
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      role: data.role,
      players,
      specialty: '',
    });
    const created = user.toObject() as unknown as Record<string, unknown>;
    delete created.password;
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
