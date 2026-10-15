import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
import Team from "@/models/Team";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/authGuard";
import {UploadError, deleteUpload, isUploadedFile, saveImageUpload} from '@/lib/uploads';
import {PLAYER_PUBLIC_FIELDS, canViewPlayerContacts} from '@/lib/access';

export async function GET(req) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const url = new URL(req.url, 'http://localhost');
        const includeAll = url.searchParams.get('all') === 'true';
        const query = Player.find(includeAll ? {} : {isActive: true}).populate('team');
        if (!canViewPlayerContacts(session.user.role)) query.select(PLAYER_PUBLIC_FIELDS);
        const players = await query;

        return new Response(JSON.stringify(players), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error fetching players:', error);
        return new Response(JSON.stringify({message: 'Internal Server Error'}), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export async function POST(request) {
    const {errorResponse} = await requireAuth(['admin']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();

        // Get form data from the request
        const formData = await request.formData();

        // Extract data for validation first
        const teamId = formData.get('teamId');
        const jerseyNum = parseInt(formData.get('jerseyNum'));

        // Validate team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return NextResponse.json({error: 'Team not found'}, {status: 404});
        }

        // Check for existing player with same jersey number
        const existingPlayer = await Player.findOne({jerseyNum, team: teamId, isActive: {$ne: false}});
        if (existingPlayer) {
            return NextResponse.json(
                {error: `Player with jersey number ${jerseyNum} already exists in this team`},
                {status: 409}
            );
        }

        // Only proceed with file upload after all validations pass
        let profilePicturePath = '/uploads/default-profile-picture.jpg';
        const profilePicture = formData.get('profilePicture');

        if (isUploadedFile(profilePicture)) {
            profilePicturePath = await saveImageUpload(profilePicture);
        }

        // Create player object with all form data
        const playerData = {
            name: formData.get('name'),
            lastname: formData.get('lastname'),
            dateOfBirth: formData.get('dateOfBirth'),
            height: parseFloat(formData.get('height')),
            position: formData.get('position'),
            jerseyNum,
            team: team._id,
            tel: formData.get('tel'),
            address: formData.get('address'),
            guardian: formData.get('guardian'),
            guardianTel: formData.get('guardianTel'),
            profilePicture: profilePicturePath,
            createdAt: new Date(),
            isActive: true
        };

        // Create new player (and don't leave an orphaned upload behind if it's invalid)
        let newPlayer;
        try {
            newPlayer = await Player.create(playerData);
        } catch (createError) {
            await deleteUpload(profilePicturePath);
            throw createError;
        }
        await newPlayer.populate('team');

        return NextResponse.json(newPlayer, {status: 201});
    } catch (error) {
        if (error instanceof UploadError) {
            return NextResponse.json({error: error.message}, {status: error.status});
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({error: Object.values(error.errors).map((e) => e.message).join(', ')}, {status: 400});
        }
        console.error('Error creating player:', error);
        return NextResponse.json({error: 'Failed to create player'}, {status: 500});
    }
}

