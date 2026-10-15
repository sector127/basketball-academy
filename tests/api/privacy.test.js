import {beforeEach, describe, expect, it} from 'vitest';
import {call, createEvent, createUser, seedAcademy, signInAs} from '../helpers';
import {GET as listPlayers} from '@/app/api/admin/players/route';
import {GET as getPlayer} from '@/app/api/admin/players/[playerId]/route';
import {GET as listEvents} from '@/app/api/admin/events/route';
import {GET as listCoaches} from '@/app/api/admin/coaches/route';

const CONTACT_FIELDS = ['tel', 'guardianTel', 'address', 'guardian'];

describe('player contact details', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
        await createEvent({team: academy.team._id, players: [academy.player._id], venue: academy.venue._id});
    });

    it.each(['guardian', 'player', 'staff'])('are hidden from the %s role', async (role) => {
        signInAs(await createUser({role}));
        const players = (await call(listPlayers)).body;
        const single = (await call(getPlayer, {params: {playerId: academy.player._id.toString()}})).body;
        const eventPlayers = (await call(listEvents)).body.flatMap((e) => e.players);
        for (const record of [...players, single, ...eventPlayers]) {
            for (const field of CONTACT_FIELDS) expect(record).not.toHaveProperty(field);
        }
    });

    it('are visible to admins and coaches', async () => {
        for (const user of [academy.admin, academy.coach]) {
            signInAs(user);
            expect((await call(listPlayers)).body[0]).toHaveProperty('guardianTel');
        }
    });
});

describe('coach list for players and guardians', () => {
    it('shows active coaches without contact details', async () => {
        const {otherCoach} = await seedAcademy();
        await otherCoach.updateOne({isActive: false});
        signInAs(await createUser({role: 'guardian'}));
        const res = await call(listCoaches, {url: 'http://localhost/api/admin/coaches?all=true'});
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).not.toHaveProperty('email');
        expect(res.body[0]).not.toHaveProperty('phone');
    });
});
