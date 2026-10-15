import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import Team from '@/models/Team';
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/authGuard";
import bcrypt from 'bcrypt';
import {isLocalImagePath} from '@/lib/uploads';
export async function GET(req) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        // Players and guardians see the coaching staff, but not their contact details
        const isStaffView = ['admin', 'coach', 'staff'].includes(session.user.role);
        const url = new URL(req.url, 'http://localhost');
        const includeInactive = isStaffView && url.searchParams.get('all') === 'true';

        const filter = { role: 'coach' };
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
                { assistantCoach: { $in: coachIds } }
            ]
        }).select('_id name description coach assistantCoach').lean();

        const enrichedCoaches = coaches.map((coach) => {
            const assignedTeams = teams.filter((t) =>
                (t.coach && t.coach.toString() === coach._id.toString()) ||
                (t.assistantCoach && t.assistantCoach.toString() === coach._id.toString())
            );
            return {
                ...coach,
                isActive: coach.isActive !== false,
                specialty: coach.specialty || 'Head Coach',
                ...(isStaffView ? {phone: coach.phone || ''} : {}),
                bio: coach.bio || '',
                experience: coach.experience || '',
                assignedTeams,
            };
        });

        return NextResponse.json(enrichedCoaches, {status: 200});
    } catch (error) {
        console.error('Error fetching coaches:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}

export async function POST(req) {
    const {errorResponse} = await requireAuth(['admin']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const body = await req.json();
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
            return NextResponse.json({error: 'Name, last name, and email are required'}, {status: 400});
        }

        if (image && !isLocalImagePath(image)) {
            return NextResponse.json({error: 'Upload the photo instead of linking to another site'}, {status: 400});
        }

        // No default password: every account gets an explicit one
        if (typeof password !== 'string' || password.length < 8) {
            return NextResponse.json({error: 'Password must be at least 8 characters'}, {status: 400});
        }

        const existing = await User.findOne({email: email.toLowerCase()});
        if (existing) {
            return NextResponse.json({error: 'User with this email already exists'}, {status: 400});
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
        const coachData = newCoach.toObject();
        delete coachData.password;

        return NextResponse.json(coachData, {status: 201});
    } catch (error) {
        console.error('Error creating coach:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}
