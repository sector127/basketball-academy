import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import Team from '@/models/Team';
import Player from '@/models/Player';
import Event from '@/models/Event';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import bcrypt from 'bcrypt';
import { deleteUpload, isLocalImagePath } from '@/lib/uploads';

interface RouteContext {
  params: Promise<{ coachId: string }> | { coachId: string };
}

interface UpdateCoachBody {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  experience?: string;
  image?: string;
  isActive?: boolean;
  password?: string;
}

interface LeanTeamRef {
  _id: { toString(): string };
  name?: string;
  description?: string;
  coach?: unknown;
  assistantCoach?: unknown;
}

interface LeanPlayerItem {
  _id: unknown;
  name?: string;
  lastname?: string;
  jerseyNum?: number;
  position?: string;
  isFirstTeam?: boolean;
  height?: number;
  team?: unknown;
  profilePicture?: string;
}

export async function GET(
  _req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { coachId } = await Promise.resolve(context.params);

    const coach = await User.findById(coachId).select('-password').lean();
    if (!coach || coach.role !== 'coach') {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Find teams assigned to this coach
    const teams = await Team.find({
      $or: [{ coach: coach._id }, { assistantCoach: coach._id }],
    })
      .select('_id name description coach assistantCoach')
      .lean<LeanTeamRef[]>();

    const teamIds = teams.map((t) => t._id);

    // Get players for these teams
    const players = await Player.find({ team: { $in: teamIds }, isActive: true })
      .select('_id name lastname jerseyNum position isFirstTeam height team profilePicture')
      .lean<LeanPlayerItem[]>();

    // Get events for these teams
    const events = await Event.find({ team: { $in: teamIds } })
      .populate('venue')
      .populate('gameResult')
      .sort({ startTime: -1 })
      .limit(10)
      .lean();

    const teamsWithRosters = teams.map((team) => {
      const roster = players.filter(
        (p) => p.team && String(p.team) === team._id.toString()
      );
      return {
        ...team,
        isHeadCoach: team.coach && String(team.coach) === coach._id.toString(),
        rosterCount: roster.length,
        startersCount: roster.filter((p) => p.isFirstTeam).length,
        players: roster,
      };
    });

    return NextResponse.json(
      {
        coach: {
          ...coach,
          isActive: coach.isActive !== false,
          specialty: coach.specialty || 'Head Coach',
          phone: coach.phone || '',
          bio: coach.bio || '',
          experience: coach.experience || '',
        },
        assignedTeams: teamsWithRosters,
        totalAthletesCount: players.length,
        recentEvents: events,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching coach details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { coachId } = await Promise.resolve(context.params);
    const body = (await req.json()) as UpdateCoachBody;

    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    const {
      name,
      lastName,
      email,
      phone,
      specialty,
      bio,
      experience,
      image,
      isActive,
      password,
    } = body;

    if (name !== undefined) coach.name = name;
    if (lastName !== undefined) coach.lastName = lastName;
    if (phone !== undefined) coach.phone = phone;
    if (specialty !== undefined) coach.specialty = specialty;
    if (bio !== undefined) coach.bio = bio;
    if (experience !== undefined) coach.experience = experience;
    let previousImage: string | null = null;
    if (image !== undefined && image !== coach.image) {
      if (image && !isLocalImagePath(image)) {
        return NextResponse.json({ error: 'Upload the photo instead of linking to another site' }, { status: 400 });
      }
      previousImage = coach.image || null;
      coach.image = image;
    }
    if (isActive !== undefined) coach.isActive = Boolean(isActive);

    if (email && email.toLowerCase() !== coach.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing && existing._id.toString() !== coach._id.toString()) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        );
      }
      coach.email = email.toLowerCase();
    }

    if (password && password.trim().length > 0) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      coach.password = await bcrypt.hash(password, 10);
    }

    await coach.save();
    if (previousImage) await deleteUpload(previousImage);

    const updated = coach.toObject() as unknown as Record<string, unknown>;
    delete updated.password;

    return NextResponse.json(
      { message: 'Coach updated successfully', coach: updated },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating coach:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest | Request,
  context: RouteContext
): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin']);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { coachId } = await Promise.resolve(context.params);

    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Check if coach is assigned to any teams
    const assignedTeams = await Team.find({
      $or: [{ coach: coach._id }, { assistantCoach: coach._id }],
    });

    if (assignedTeams.length > 0) {
      // Soft disable if assigned to teams to prevent orphan references
      coach.isActive = false;
      await coach.save();
      return NextResponse.json(
        {
          message:
            'Coach is assigned to teams and has been deactivated instead of deleted',
          deactivated: true,
        },
        { status: 200 }
      );
    }

    await User.findByIdAndDelete(coachId);
    return NextResponse.json(
      { message: 'Coach deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error deleting coach:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
