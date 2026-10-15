import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/authGuard";
import connectToDatabase from '@/lib/mongoose';
import Player from '@/models/Player';
//eslint-disable-next-line
import Team from '@/models/Team';
import {UploadError, deleteUpload, isUploadedFile, saveImageUpload} from "@/lib/uploads";
import {PLAYER_PUBLIC_FIELDS, canManageTeam, canViewPlayerContacts} from "@/lib/access";

export async function GET(req, {params}) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
    if (errorResponse) return errorResponse;
    await connectToDatabase();
    const {playerId} = await params
    const fields = canViewPlayerContacts(session.user.role) ? '' : PLAYER_PUBLIC_FIELDS;

    try {
        if (playerId) {
            const player = await Player.findById(playerId).select(fields).populate('team')
            if (player) {
                // player.age = Math.floor((new Date() - new Date(player.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
                return NextResponse.json(player)
            } else {
                return NextResponse.json({error: 'Player not found'}, {status: 404})
            }
        } else {
            const players = await Player.find({}).select(fields).populate('team')
            return NextResponse.json(players)
        }
    } catch (error) {
        console.error('Error fetching players:', error)
        return NextResponse.json({error: 'Failed to fetch players'}, {status: 500})
    }
}

export async function PUT(req, {params}) {
    const {session, errorResponse} = await requireAuth(['admin', 'coach']);
    if (errorResponse) return errorResponse;
    try {
        await connectToDatabase();
        const {playerId} = await params;

        // Parse form data
        const formData = await req.formData();
        const player = await Player.findById(playerId);

        if (!player) {
            return NextResponse.json({error: 'Player not found'}, {status: 404});
        }

        // Coaches may only edit players on their teams, and only move them between their teams
        // (an empty teamId would unassign the player, so it counts as a team the coach can't manage)
        const targetTeamId = formData.get('teamId');
        if (!(await canManageTeam(session, player.team)) || !(await canManageTeam(session, targetTeamId))) {
            return NextResponse.json({error: 'Forbidden - You do not coach this player\'s team'}, {status: 403});
        }

        // The new photo is stored only after all checks pass (see below)
        const profilePicture = formData.get('profilePicture');

        // Handle team assignment
        const teamId = formData.get('teamId');
        const previousTeamId = player.team ? player.team.toString() : null;
        if (teamId) {
            const team = await Team.findById(teamId);
            if (!team) {
                return NextResponse.json({error: 'Team not found'}, {status: 404});
            }
            player.team = team._id;
        } else {
            player.team = null;
        }
        // A starter on the old team isn't automatically a starter on the new one
        if ((player.team ? player.team.toString() : null) !== previousTeamId) {
            player.isFirstTeam = false;
        }

        // Handle jersey number uniqueness
        const jerseyNum = parseInt(formData.get('jerseyNum'));
        if (!isNaN(jerseyNum) && teamId) {
            const existingPlayer = await Player.findOne({jerseyNum, team: teamId, isActive: {$ne: false}});
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

        // Store the new photo, save, then remove the old photo (or the new one if saving fails)
        let previousPicture = null;
        let newPicture = null;
        if (isUploadedFile(profilePicture)) {
            previousPicture = player.profilePicture;
            newPicture = await saveImageUpload(profilePicture);
            player.profilePicture = newPicture;
        }
        let updatedPlayer;
        try {
            updatedPlayer = await player.save();
        } catch (saveError) {
            if (newPicture) await deleteUpload(newPicture);
            throw saveError;
        }
        if (previousPicture) await deleteUpload(previousPicture);
        await updatedPlayer.populate('team');

        return NextResponse.json(updatedPlayer, {status: 200});
    } catch (error) {
        if (error instanceof UploadError) {
            return NextResponse.json({error: error.message}, {status: error.status});
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json({error: Object.values(error.errors).map((e) => e.message).join(', ')}, {status: 400});
        }
        if (error.code === 11000) {
            return NextResponse.json(
                {error: 'This team already has a starter in that position. Change the position or remove them from the starting five first.'},
                {status: 409}
            );
        }
        console.error('Error updating player:', error);
        return NextResponse.json({error: 'Failed to update player'}, {status: 500});
    }
}



