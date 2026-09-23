import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
import Team from "@/models/Team";
import {NextResponse} from "next/server";
import {writeFile} from "node:fs/promises";
import {join} from 'path';

export async function GET(req) {
    try {
        await connectToDatabase();
        const players = await Player.find({isActive: true}).populate('team');

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
        const existingPlayer = await Player.findOne({jerseyNum, team: teamId});
        if (existingPlayer) {
            return NextResponse.json(
                {error: `Player with jersey number ${jerseyNum} already exists in this team`},
                {status: 409}
            );
        }

        // Only proceed with file upload after all validations pass
        let profilePicturePath = '';
        const profilePicture = formData.get('profilePicture');

        if (profilePicture) {
            try {
                // Validate file type and size (example: only allow JPEG/PNG and limit to 5MB)
                if (!['image/jpeg', 'image/png'].includes(profilePicture.type)) {
                    return NextResponse.json({error: 'Invalid file type'}, {status: 400});
                }
                if (profilePicture.size > 5 * 1024 * 1024) { // 5MB limit
                    return NextResponse.json({error: 'File size exceeds the limit'}, {status: 400});
                }
                const bytes = await profilePicture.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const filename = `${Date.now()}-${profilePicture.name}`;
                const uploadsDir = join(process.cwd(), 'public', 'uploads');

                profilePicturePath = `/uploads/${filename}`;
                await writeFile(join(uploadsDir, filename), buffer);

            } catch (uploadError) {
                console.error('Error uploading file:', uploadError);
                return NextResponse.json({
                    error: 'Failed to upload profile picture'
                }, {status: 500});
            }
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

        // Create new player
        const newPlayer = await Player.create(playerData);
        await newPlayer.populate('team');

        return NextResponse.json(newPlayer, {status: 201});
    } catch (error) {
        console.error('Error creating player:', error);
        return NextResponse.json({error: 'Failed to create player'}, {status: 500});
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
