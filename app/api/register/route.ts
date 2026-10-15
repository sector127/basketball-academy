import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['guardian', 'player', 'staff']),
  note: z.string().trim().max(500).optional().default(''),
});

// Public self-registration. Accounts are created inactive and pending approval;
// an admin approves them (and links players) on the Accounts page.
export async function POST(request: NextRequest | Request): Promise<NextResponse> {
  if (isRateLimited(`register:${getClientIp(request)}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let data: z.infer<typeof registerSchema>;
  try {
    const json: unknown = await request.json();
    data = registerSchema.parse(json);
  } catch {
    return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    // Same response whether or not the email exists, so this can't be used to discover accounts
    const existing = await User.findOne({ email: data.email }).collation({ locale: 'en', strength: 2 });
    if (!existing) {
      await User.create({
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        role: data.role,
        isActive: false,
        pendingApproval: true,
        registrationNote: data.note,
        specialty: '',
      });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
