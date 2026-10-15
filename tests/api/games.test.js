import {beforeEach, describe, expect, it} from 'vitest';
import {call, createEvent, seedAcademy, signInAs} from '../helpers';
import {GET as getGame, PUT as updateGame, DELETE as deleteGame} from '@/app/api/admin/games/[eventId]/route';
import {GET as listGames} from '@/app/api/admin/games/route';
import {GET as playerStats} from '@/app/api/admin/players/[playerId]/stats/route';
import GameResult from '@/models/GameResult';

describe('games', () => {
    let academy;
    let game;
    beforeEach(async () => {
        academy = await seedAcademy();
        signInAs(academy.admin);
        game = await createEvent({
            eventType: 'game', title: 'g', opponent: 'Dinamo', team: academy.team._id, venue: academy.venue._id,
            startTime: new Date('2027-03-01T15:00:00Z'), endTime: new Date('2027-03-01T16:30:00Z'),
        });
    });
    const params = () => ({eventId: game._id.toString()});

    it('returns what the edit form needs: ISO times and the venue with its id', async () => {
        const {body} = await call(getGame, {params: params()});
        expect(new Date(body.startTime).toISOString()).toBe('2027-03-01T15:00:00.000Z');
        expect(new Date(body.endTime).toISOString()).toBe('2027-03-01T16:30:00.000Z');
        expect(body.venue._id).toBe(academy.venue._id.toString());
    });

    it('keeps the game length when only the start moves, and saves the description', async () => {
        const {status, body} = await call(updateGame, {method: 'PUT', params: params(), body: {startTime: '2027-03-01T17:00:00Z', description: 'Derby'}});
        expect(status).toBe(200);
        expect(new Date(body.event.endTime).toISOString()).toBe('2027-03-01T18:30:00.000Z');
        expect(body.event.description).toBe('Derby');
        expect(body.event.title).toBe(`${academy.team.name} vs Dinamo`);
    });

    it('switches between home and away cleanly', async () => {
        const away = await call(updateGame, {method: 'PUT', params: params(), body: {isAwayGame: true, location: 'Kutaisi Arena'}});
        expect(away.body.event.venue).toBeUndefined();
        expect(away.body.event.location).toBe('Kutaisi Arena');
        const homeWithoutVenue = await call(updateGame, {method: 'PUT', params: params(), body: {isAwayGame: false}});
        expect(homeWithoutVenue.status).toBe(400);
    });

    it('refuses to double-book a venue and invalid times', async () => {
        await createEvent({venue: academy.venue._id, startTime: new Date('2027-03-02T15:00:00Z'), endTime: new Date('2027-03-02T17:00:00Z')});
        expect((await call(updateGame, {method: 'PUT', params: params(), body: {startTime: '2027-03-02T16:00:00Z'}})).status).toBe(409);
        expect((await call(updateGame, {method: 'PUT', params: params(), body: {startTime: '2027-03-01T17:00:00Z', endTime: '2027-03-01T16:00:00Z'}})).status).toBe(400);
    });

    it('reports scores from the academy\'s side for away games', async () => {
        await game.updateOne({isAwayGame: true, location: 'Batumi', $unset: {venue: 1}});
        await GameResult.create({event: game._id, homeTeamScore: 70, awayTeamScore: 80, status: 'completed', boxScores: [{player: academy.player._id, points: 25}]});

        const listed = (await call(listGames)).body.find((g) => g._id === game._id.toString());
        expect(listed.score).toEqual({ourTeam: 80, opponentTeam: 70});

        const stats = (await call(playerStats, {params: {playerId: academy.player._id.toString()}})).body;
        expect(stats.recentGames[0]).toMatchObject({ourScore: 80, opponentScore: 70});
    });

    it('deletes the game and its result', async () => {
        await GameResult.create({event: game._id});
        expect((await call(deleteGame, {method: 'DELETE', params: params()})).status).toBe(200);
        expect(await GameResult.countDocuments({event: game._id})).toBe(0);
        expect((await call(deleteGame, {method: 'DELETE', params: params()})).status).toBe(404);
    });
});
