import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import mongoose, { type HydratedDocument } from 'mongoose';
import connectToDatabase from '@/lib/mongoose';
import { requireAuth } from '@/lib/authGuard';
import User, { type IUser, type UserRole } from '@/models/User';
import { MANAGED_ROLES, validatePlayerIds } from '@/lib/accounts';

interface RouteContext {
  params: Promise<{ userId: string }> | { userId: string };
}

const updateSchema = z.object({
  approve: z.literal(true).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['staff', 'player', 'guardian']).optional(),
  players: z.array(z.string()).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
});

async function findManagedUser(userId: string): Promise<HydratedDocument<IUser> | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const user = await User.findById(userId);
  return user && MANAGED_ROLES.includes(user.role as UserRole) ? user : null;
}

export async function PATCH(
  request: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;

  const json: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update' }, { status: 400 });
  }
  const data = parsed.data;
  try {
    await connectToDatabase();
    const { userId } = await Promise.resolve(context.params);
    const user = await findManagedUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (data.approve) {
      user.pendingApproval = false;
      user.isActive = true;
    }
    if (data.isActive !== undefined) {
      if (user.pendingApproval && data.isActive) {
        return NextResponse.json({ error: 'Approve the account first' }, { status: 400 });
      }
      user.isActive = data.isActive;
    }
    if (data.role) user.role = data.role;
    if (data.name) user.name = data.name;
    if (data.lastName) user.lastName = data.lastName;
    if (data.players) {
      const players = await validatePlayerIds(data.players);
      if (!players) {
        return NextResponse.json({ error: 'One or more linked players were not found' }, { status: 400 });
      }
      user.players = players.map((id) => new mongoose.Types.ObjectId(id));
    }
    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10);
      user.passwordResetRequestedAt = undefined;
    }

    await user.save();
    const updated = user.toObject() as unknown as Record<string, unknown>;
    delete updated.password;
    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
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
    const { userId } = await Promise.resolve(context.params);
    const user = await findManagedUser(userId);
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    await user.deleteOne();
    return NextResponse.json({ message: user.pendingApproval ? 'Request rejected' : 'Account deleted' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
