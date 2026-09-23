import {NextResponse} from "next/server";
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
//eslint-disable-next-line
import Team from '@/models/Team';
import {unlink, writeFile} from "node:fs/promises";
import {join} from 'path';
import {existsSync} from "node:fs";

export async function GET(req, {params}) {
    await connectToDatabase()

    const {playerId} = await params

    try {
        if (playerId) {
            const player = await Player.findById(playerId).populate('team')
            if (player) {
                // player.age = Math.floor((new Date() - new Date(player.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
                return NextResponse.json(player)
            } else {
                return NextResponse.json({error: 'Player not found'}, {status: 404})
            }
        } else {
            const players = await Player.find({}).populate('team')
            return NextResponse.json(players)
        }
    } catch (error) {
        console.error('Error fetching players:', error)
        return NextResponse.json({error: 'Failed to fetch players'}, {status: 500})
    }
}

export async function PUT(req, {params}) {
    try {
        await connectToDatabase();
        const {playerId} = await params;

        // Parse form data
        const formData = await req.formData();
        const player = await Player.findById(playerId);

        if (!player) {
            return NextResponse.json({error: 'Player not found'}, {status: 404});
        }

        // Ensure upload directory exists
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, {recursive: true});
        }

        // Handle profile picture upload
        const profilePicture = formData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
            if (!['image/jpeg', 'image/png'].includes(profilePicture.type)) {
                return NextResponse.json({error: 'Invalid file type'}, {status: 400});
            }
            if (profilePicture.size > 5 * 1024 * 1024) {
                return NextResponse.json({error: 'File size exceeds the limit'}, {status: 400});
            }

            const filename = `${Date.now()}-${profilePicture.name}`;
            const filePath = join(uploadsDir, filename);
            const bytes = await profilePicture.arrayBuffer();
            await writeFile(filePath, Buffer.from(bytes));

            if (player.profilePicture) {
                try {
                    await unlink(join(process.cwd(), 'public', player.profilePicture));
                } catch (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            }
            player.profilePicture = `/uploads/${filename}`;
        }

        // Handle team assignment
        const teamId = formData.get('teamId');
        if (teamId) {
            const team = await Team.findById(teamId);
            if (!team) {
                return NextResponse.json({error: 'Team not found'}, {status: 404});
            }
            player.team = team._id;
        } else {
            player.team = null;
        }

        // Handle jersey number uniqueness
        const jerseyNum = parseInt(formData.get('jerseyNum'));
        if (!isNaN(jerseyNum)) {
            const existingPlayer = await Player.findOne({jerseyNum, team: teamId});
            if (existingPlayer && existingPlayer._id.toString() !== playerId) {
                return NextResponse.json(
                    {error: `Player with jersey number ${jerseyNum} already exists in this team`},
                    {status: 409}
                );
            }
            player.jerseyNum = jerseyNum;
        }

        // Update other player details
        player.name = formData.get('name') || player.name;
        player.lastname = formData.get('lastname') || player.lastname;
        player.dateOfBirth = formData.get('dateOfBirth') || player.dateOfBirth;

        const height = parseFloat(formData.get('height'));
        player.height = !isNaN(height) ? height : player.height;

        player.position = formData.get('position') || player.position;
        player.tel = formData.get('tel') || player.tel;
        player.address = formData.get('address') || player.address;
        player.guardian = formData.get('guardian') || player.guardian;
        player.guardianTel = formData.get('guardianTel') || player.guardianTel;

        // Save and return updated player
        const updatedPlayer = await player.save();
        await updatedPlayer.populate('team');

        return NextResponse.json(updatedPlayer, {status: 200});
    } catch (error) {
        console.error('Error updating player:', error);
        return NextResponse.json({error: 'Failed to update player'}, {status: 500});
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};


