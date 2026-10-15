import {beforeEach, describe, expect, it} from 'vitest';
import {call, createEvent, seedAcademy, signInAs} from '../helpers';
import {POST as createEventRoute} from '@/app/api/admin/events/route';
import {DELETE as deleteEvent, PUT as updateEvent} from '@/app/api/admin/events/[id]/route';
import {PUT as saveAttendance} from '@/app/api/admin/events/[id]/attendance/route';
import {PUT as saveResult} from '@/app/api/admin/games/[eventId]/result/route';
import {PUT as updatePlayer} from '@/app/api/admin/players/[playerId]/route';
import GameResult from '@/models/GameResult';

// Coaches may only manage their own teams' players and sessions
describe('coach ownership', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
    });

    const training = (team, player, venue) => ({
        eventType: 'individualTraining',
        title: 'Shooting',
        team: team._id.toString(),
        players: [player._id.toString()],
        venue: venue._id.toString(),
        startTime: '2027-01-05T10:00:00Z',
        endTime: '2027-01-05T11:00:00Z',
    });

    it('lets a coach schedule training for their own players only', async () => {
        const {coach, team, player, otherPlayer, venue} = academy;
        signInAs(coach);
        expect((await call(createEventRoute, {method: 'POST', body: training(team, player, venue)})).status).toBe(201);
        const foreign = {...training(team, otherPlayer, venue), startTime: '2027-01-06T10:00:00Z', endTime: '2027-01-06T11:00:00Z'};
        expect((await call(createEventRoute, {method: 'POST', body: foreign})).status).toBe(403);
    });

    it('stops a coach from editing, moving or deleting another coach\'s sessions', async () => {
        const {coach, otherCoach, team, otherTeam, player, venue} = academy;
        const event = await createEvent({eventType: 'individualTraining', team: team._id, players: [player._id], venue: venue._id});
        const params = {id: event._id.toString()};

        signInAs(otherCoach);
        expect((await call(updateEvent, {method: 'PUT', params, body: {title: 'Hacked'}})).status).toBe(403);
        expect((await call(deleteEvent, {method: 'DELETE', params})).status).toBe(403);

        signInAs(coach);
        expect((await call(updateEvent, {method: 'PUT', params, body: {team: otherTeam._id.toString()}})).status).toBe(403);
        expect((await call(updateEvent, {method: 'PUT', params, body: {title: 'Shooting'}})).status).toBe(200);
    });

    it('keeps coaches out of team practices and matches', async () => {
        const {coach, team, venue} = academy;
        const practice = await createEvent({eventType: 'practice', team: team._id, venue: venue._id});
        signInAs(coach);
        expect((await call(updateEvent, {method: 'PUT', params: {id: practice._id.toString()}, body: {title: 'x'}})).status).toBe(403);
        expect((await call(createEventRoute, {method: 'POST', body: {eventType: 'game', opponent: 'X'}})).status).toBe(403);
    });

    it('limits attendance and results to the team\'s coaches', async () => {
        const {coach, otherCoach, team, player} = academy;
        const game = await createEvent({eventType: 'game', opponent: 'Dinamo', team: team._id, isAwayGame: true, location: 'Kutaisi'});
        await GameResult.create({event: game._id});
        const params = {id: game._id.toString(), eventId: game._id.toString()};

        signInAs(otherCoach);
        expect((await call(saveAttendance, {method: 'PUT', params, body: {attendance: []}})).status).toBe(403);
        expect((await call(saveResult, {method: 'PUT', params, body: {homeTeamScore: 0, awayTeamScore: 99}})).status).toBe(403);

        signInAs(coach);
        const attendance = {attendance: [{player: player._id.toString(), status: 'absent'}]};
        expect((await call(saveAttendance, {method: 'PUT', params, body: attendance})).status).toBe(200);
        expect((await call(saveResult, {method: 'PUT', params, body: {homeTeamScore: 70, awayTeamScore: 80, status: 'completed'}})).status).toBe(200);
    });

    it('ignores attempts to re-link a game result to another event', async () => {
        const {coach, team, player} = academy;
        const game = await createEvent({eventType: 'game', opponent: 'Dinamo', team: team._id, isAwayGame: true, location: 'Kutaisi'});
        const other = await createEvent({eventType: 'individualTraining', team: team._id, players: [player._id], venue: academy.venue._id});
        await GameResult.create({event: game._id});
        signInAs(coach);
        const res = await call(saveResult, {method: 'PUT', params: {eventId: game._id.toString()}, body: {event: other._id.toString(), status: 'completed'}});
        expect(res.status).toBe(200);
        expect(res.body.gameResult.event).toBe(game._id.toString());
    });

    it('lets coaches edit only players on their teams, and not move or unassign them', async () => {
        const {coach, otherCoach, team, otherTeam, player} = academy;
        const params = {playerId: player._id.toString()};

        signInAs(otherCoach);
        expect((await call(updatePlayer, {method: 'PUT', params, form: {teamId: team._id.toString(), name: 'Hacked'}})).status).toBe(403);
        expect((await call(updatePlayer, {method: 'PUT', params, form: {teamId: otherTeam._id.toString()}})).status).toBe(403);

        signInAs(coach);
        expect((await call(updatePlayer, {method: 'PUT', params, form: {name: 'NoTeam'}})).status).toBe(403);
        expect((await call(updatePlayer, {method: 'PUT', params, form: {teamId: team._id.toString(), name: 'Renamed'}})).status).toBe(200);
    });
});
