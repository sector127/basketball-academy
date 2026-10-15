import connectToDatabase from '@/lib/mongoose';
import User, { type IUser } from '@/models/User';
import Team from '@/models/Team';
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import bcrypt from 'bcrypt';
import { isLocalImagePath } from '@/lib/uploads';
import type { FilterQuery } from 'mongoose';

interface CreateCoachBody {
  name?: string;
  lastName?: string;
  email?: string;
  password?: string;
  image?: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  experience?: string;
  isActive?: boolean;
}

interface LeanTeamDoc {
  _id: unknown;
  name?: string;
  description?: string;
  coach?: unknown;
  assistantCoach?: unknown;
}

export async function GET(req: NextRequest | Request): Promise<NextResponse> {
  const { session, errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    // Players and guardians see the coaching staff, but not their contact details
    const isStaffView = ['admin', 'coach', 'staff'].includes(session.user.role);
    const url = new URL(req.url, 'http://localhost');
    const includeInactive = isStaffView && url.searchParams.get('all') === 'true';

    const filter: FilterQuery<IUser> = { role: 'coach' };
    if (!includeInactive) {
      filter.isActive = { $ne: false };
    }

    const coaches = await User.find(filter)
      .select(isStaffView ? '-password' : 'name lastName image specialty bio experience isActive')
      .lean();
    const coachIds = coaches.map((c) => c._id);

    const teams = await Team.find({
      $or: [
        { coach: { $in: coachIds } },
        { assistantCoach: { $in: coachIds } },
      ],
    }).select('_id name description coach assistantCoach').lean<LeanTeamDoc[]>();

    const enrichedCoaches = coaches.map((coach) => {
      const assignedTeams = teams.filter((t) =>
        (t.coach && String(t.coach) === String(coach._id)) ||
        (t.assistantCoach && String(t.assistantCoach) === String(coach._id))
      );
      return {
        ...coach,
        isActive: coach.isActive !== false,
        specialty: coach.specialty || 'Head Coach',
        ...(isStaffView ? { phone: coach.phone || '' } : {}),
        bio: coach.bio || '',
        experience: coach.experience || '',
        assignedTeams,
      };
    });

    return NextResponse.json(enrichedCoaches, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;
  try {
    await connectToDatabase();
    const body = (await req.json()) as CreateCoachBody;
    const {
      name,
      lastName,
      email,
      password,
      image,
      phone,
      specialty,
      bio,
      experience,
      isActive,
    } = body;

    if (!name || !lastName || !email) {
      return NextResponse.json({ error: 'Name, last name, and email are required' }, { status: 400 });
    }

    if (image && !isLocalImagePath(image)) {
      return NextResponse.json({ error: 'Upload the photo instead of linking to another site' }, { status: 400 });
    }

    // No default password: every account gets an explicit one
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCoach = await User.create({
      name,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'coach',
      image: image || '',
      phone: phone || '',
      specialty: specialty || 'Head Coach',
      bio: bio || '',
      experience: experience || '',
      isActive: isActive !== false,
    });
    const coachData = newCoach.toObject() as unknown as Record<string, unknown>;
    delete coachData.password;

    return NextResponse.json(coachData, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating coach:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
