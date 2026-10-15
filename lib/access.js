import mongoose from 'mongoose';
import Team from '@/models/Team';
import Player from '@/models/Player';

// Fields any logged-in user may see about a player. Contact details
// (tel, address, guardian, guardianTel) are restricted to admins and coaches.
export const PLAYER_PUBLIC_FIELDS =
    '_id name lastname jerseyNum position height team isFirstTeam isActive profilePicture injuryStatus';

export function canViewPlayerContacts(role) {
    return role === 'admin' || role === 'coach';
}

/**
 * IDs (as strings) of teams where the user is head or assistant coach.
 */
export async function getCoachTeamIds(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];
    const teams = await Team.find({
        $or: [{coach: userId}, {assistantCoach: userId}],
    }).select('_id').lean();
    return teams.map((t) => t._id.toString());
}

function idOf(value) {
    if (!value) return null;
    return (value._id || value).toString();
}

/**
 * Admins can manage every team; coaches only teams they coach.
 */
export async function canManageTeam(session, teamId) {
    if (session.user.role === 'admin') return true;
    if (session.user.role !== 'coach' || !teamId) return false;
    const teamIds = await getCoachTeamIds(session.user.id);
    return teamIds.includes(idOf(teamId));
}

/**
 * True when every player ID belongs to one of the given teams.
 */
async function playersBelongToTeams(playerIds, teamIds) {
    const ids = playerIds.map(idOf).filter(Boolean);
    if (ids.length === 0 || ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) return false;
    const count = await Player.countDocuments({_id: {$in: ids}, team: {$in: teamIds}});
    return count === new Set(ids).size;
}

/**
 * Admins can manage every event. Coaches can manage an event when it belongs to
 * one of their teams, or when it has no team and all its players are on their teams.
 * `event` may be a stored event or an incoming payload ({team, players}).
 */
export async function canManageEvent(session, event) {
    if (session.user.role === 'admin') return true;
    if (session.user.role !== 'coach' || !event) return false;

    const teamIds = await getCoachTeamIds(session.user.id);
    if (teamIds.length === 0) return false;

    const teamId = idOf(event.team);
    if (teamId && !teamIds.includes(teamId)) return false;

    const players = Array.isArray(event.players) ? event.players : [];
    if (players.length > 0) {
        return playersBelongToTeams(players, teamIds);
    }
    return Boolean(teamId);
}
