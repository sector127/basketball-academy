import {describe, expect, it} from 'vitest';
import {call, createUser, signInAs} from '../helpers';
import {GET as listTeams} from '@/app/api/admin/teams/route';
import {GET as listUsers} from '@/app/api/admin/users/route';
import User from '@/models/User';

describe('requireAuth', () => {
    it('rejects signed-out requests', async () => {
        signInAs(null);
        expect((await call(listTeams)).status).toBe(401);
    });

    it('rejects roles that are not allowed', async () => {
        signInAs(await createUser({role: 'guardian'}));
        expect((await call(listUsers)).status).toBe(403);
    });

    it('signs out a user as soon as they are disabled', async () => {
        const coach = await createUser({role: 'coach'});
        signInAs(coach);
        expect((await call(listTeams)).status).toBe(200);
        await User.updateOne({_id: coach._id}, {isActive: false});
        expect((await call(listTeams)).status).toBe(401);
    });

    it('uses the role stored in the database, not the one in the session', async () => {
        const user = await createUser({role: 'admin'});
        signInAs(user);
        await User.updateOne({_id: user._id}, {role: 'guardian'});
        expect((await call(listUsers)).status).toBe(403);
    });

    it('rejects sessions that started before the last password change', async () => {
        const user = await createUser({role: 'admin'});
        signInAs(user, {authTime: Date.now() - 60_000});
        user.password = 'changed-hash';
        await user.save();
        expect((await call(listTeams)).status).toBe(401);
        signInAs(user, {authTime: Date.now() + 1000});
        expect((await call(listTeams)).status).toBe(200);
    });
});
