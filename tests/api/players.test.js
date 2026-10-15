import {beforeEach, describe, expect, it} from 'vitest';
import {call, createPlayer, seedAcademy, signInAs} from '../helpers';
import {POST as createPlayerRoute} from '@/app/api/admin/players/route';
import {PUT as updatePlayer} from '@/app/api/admin/players/[playerId]/route';
import {PATCH as disablePlayer} from '@/app/api/admin/players/[playerId]/disable/route';
import {PATCH as setStarter} from '@/app/api/admin/teams/[teamId]/firstTeam/route';
import Player from '@/models/Player';

const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];

describe('players', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
        signInAs(academy.admin);
    });

    it('accepts phone numbers as people type them and stores them normalized', async () => {
        const res = await call(createPlayerRoute, {
            method: 'POST',
            form: {
                name: 'Luka', lastname: 'Beridze', dateOfBirth: '2010-05-05', height: '170', position: 'Center',
                jerseyNum: '77', teamId: academy.team._id.toString(), tel: '+995 599 12-34-56', address: 'Tbilisi',
                guardian: 'Mother', guardianTel: '+995 (599) 11 22 33',
            },
        });
        expect(res.status).toBe(201);
        expect(res.body.tel).toBe('+995599123456');
        expect(res.body.guardianTel).toBe('+995599112233');
    });

    it('returns a 400 with the reason for invalid data', async () => {
        const res = await call(createPlayerRoute, {
            method: 'POST',
            form: {
                name: 'A', lastname: 'B', dateOfBirth: '2010-05-05', height: '170', position: 'Center', jerseyNum: '78',
                teamId: academy.team._id.toString(), tel: '12', address: 'x', guardian: 'Mother', guardianTel: '+995599000000',
            },
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/phone/);
    });

    it('takes a player out of the starting five when they move team or are disabled', async () => {
        const {team, otherTeam, player} = academy;
        await player.updateOne({isFirstTeam: true});
        await call(updatePlayer, {method: 'PUT', params: {playerId: player._id.toString()}, form: {teamId: otherTeam._id.toString()}});
        expect((await Player.findById(player._id)).isFirstTeam).toBe(false);

        const starter = await createPlayer(team, {isFirstTeam: true, position: 'Point Guard'});
        await call(disablePlayer, {method: 'PATCH', params: {playerId: starter._id.toString()}});
        expect((await Player.findById(starter._id)).isFirstTeam).toBe(false);
    });
});

describe('starting five', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
        signInAs(academy.admin);
    });

    const promote = (team, player) =>
        call(setStarter, {method: 'PATCH', params: {teamId: team._id.toString()}, body: {playerId: player._id.toString(), isFirstTeam: true}});

    it('allows one starter per position, five in total', async () => {
        const {team} = academy;
        await Player.deleteMany({team: team._id});
        for (const position of POSITIONS) {
            expect((await promote(team, await createPlayer(team, {position}))).status).toBe(200);
        }
        const sixth = await createPlayer(team, {position: 'Center'});
        expect((await promote(team, sixth)).status).toBe(400);
        expect(await Player.countDocuments({team: team._id, isFirstTeam: true})).toBe(5);
    });

    it('never ends up with two starters in one position, even with simultaneous requests', async () => {
        const {team} = academy;
        await Player.deleteMany({team: team._id});
        // 20 at once reliably reproduces the race: without the unique index this ends with ~15 starters
        const candidates = await Promise.all(
            Array.from({length: 20}, () => createPlayer(team, {position: 'Center'}))
        );
        const results = await Promise.all(candidates.map((p) => promote(team, p)));
        expect(results.filter((r) => r.status === 200)).toHaveLength(1);
        expect(results.every((r) => [200, 400, 409].includes(r.status))).toBe(true);
        expect(await Player.countDocuments({team: team._id, isFirstTeam: true, position: 'Center'})).toBe(1);
    });

    it('rejects changing a starter\'s position to one that is already taken', async () => {
        const {team} = academy;
        await createPlayer(team, {position: 'Center', isFirstTeam: true});
        const guard = await createPlayer(team, {position: 'Point Guard', isFirstTeam: true});
        const res = await call(updatePlayer, {
            method: 'PUT',
            params: {playerId: guard._id.toString()},
            form: {teamId: team._id.toString(), position: 'Center'},
        });
        expect(res.status).toBe(409);
    });

    it('does not let disabled players start', async () => {
        const {team} = academy;
        const disabled = await createPlayer(team, {position: 'Point Guard', isActive: false});
        expect((await promote(team, disabled)).status).toBe(400);
    });
});
