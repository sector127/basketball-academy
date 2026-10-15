import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import bcrypt from 'bcrypt';
import {call, createEvent, createUser, seedAcademy, signInAs} from '../helpers';
import {POST as register} from '@/app/api/register/route';
import {GET as listAccounts} from '@/app/api/admin/users/route';
import {PATCH as updateAccount} from '@/app/api/admin/users/[userId]/route';
import {GET as me} from '@/app/api/me/route';
import {PUT as saveAttendance} from '@/app/api/admin/events/[id]/attendance/route';
import {POST as requestReset} from '@/app/api/password-reset-request/route';
import {POST as completeReset} from '@/app/api/password-reset/route';
import User from '@/models/User';

const signUp = (overrides = {}, ip) => call(register, {
    method: 'POST',
    ip,
    body: {name: 'Maka', lastName: 'Beridze', email: 'Maka@Example.com', password: 'supersecret1', role: 'guardian', note: 'My son plays U18', ...overrides},
});

describe('sign-up and approval', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
    });

    it('creates an inactive account that waits for approval', async () => {
        expect((await signUp()).status).toBe(201);
        const user = await User.findOne({email: 'maka@example.com'});
        expect(user).toMatchObject({pendingApproval: true, isActive: false, role: 'guardian', registrationNote: 'My son plays U18'});
    });

    it('gives the same answer for existing emails without creating anything', async () => {
        await signUp();
        expect((await signUp({role: 'staff'})).status).toBe(201);
        expect(await User.countDocuments({email: 'maka@example.com'})).toBe(1);
    });

    it('cannot be used to create an admin or coach', async () => {
        expect((await signUp({email: 'a@example.com', role: 'admin'})).status).toBe(400);
        expect((await signUp({email: 'b@example.com', role: 'coach'})).status).toBe(400);
    });

    it('is rate limited per client', async () => {
        const statuses = [];
        for (let i = 0; i < 6; i++) statuses.push((await signUp({email: `rl${i}@example.com`}, '203.0.113.7')).status);
        expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
    });

    it('lets an admin approve, link a child, and the guardian then sees that child', async () => {
        await signUp();
        signInAs(academy.admin);
        const pending = (await call(listAccounts)).body.find((u) => u.email === 'maka@example.com');
        const params = {userId: pending._id};

        expect((await call(updateAccount, {method: 'PATCH', params, body: {isActive: true}})).status).toBe(400);
        expect((await call(updateAccount, {method: 'PATCH', params, body: {players: ['000000000000000000000000']}})).status).toBe(400);
        const approved = await call(updateAccount, {method: 'PATCH', params, body: {approve: true, players: [academy.player._id.toString()]}});
        expect(approved.body).toMatchObject({pendingApproval: false, isActive: true});

        // Attendance: 2 present, 1 absent
        signInAs(academy.coach);
        for (const [i, status] of ['present', 'present', 'absent'].entries()) {
            const event = await createEvent({team: academy.team._id, venue: academy.venue._id, startTime: new Date(Date.UTC(2026, 0, 10 + i))});
            await call(saveAttendance, {method: 'PUT', params: {id: event._id.toString()}, body: {attendance: [{player: academy.player._id.toString(), status}]}});
        }
        await createEvent({team: academy.team._id, venue: academy.venue._id});
        await createEvent({team: academy.otherTeam._id, venue: academy.venue._id});

        signInAs(await User.findById(pending._id));
        const {body} = await call(me);
        expect(body.players).toHaveLength(1);
        expect(body.players[0].upcomingEvents).toHaveLength(1);
        expect(body.players[0].attendance).toMatchObject({present: 2, absent: 1, tracked: 3, rate: 67});
    });

    it('does not let the accounts API touch coaches', async () => {
        signInAs(academy.admin);
        const res = await call(updateAccount, {method: 'PATCH', params: {userId: academy.coach._id.toString()}, body: {isActive: false}});
        expect(res.status).toBe(404);
    });
});

describe('forgot password', () => {
    afterEach(() => {
        delete process.env.EMAIL_TRANSPORT;
        delete process.env.APP_URL;
        vi.restoreAllMocks();
    });

    it('without email, flags the account for an admin who sets a new password', async () => {
        const admin = await createUser({role: 'admin'});
        const user = await createUser({role: 'guardian', email: 'parent@example.com'});
        await call(requestReset, {method: 'POST', body: {email: 'PARENT@example.com'}});
        expect((await User.findById(user._id)).passwordResetRequestedAt).toBeInstanceOf(Date);

        signInAs(admin);
        expect((await call(updateAccount, {method: 'PATCH', params: {userId: user._id.toString()}, body: {password: 'short'}})).status).toBe(400);
        await call(updateAccount, {method: 'PATCH', params: {userId: user._id.toString()}, body: {password: 'brandnewpass9'}});
        const updated = await User.findById(user._id);
        expect(updated.passwordResetRequestedAt).toBeNull();
        expect(await bcrypt.compare('brandnewpass9', updated.password)).toBe(true);
    });

    it('with email, sends a one-time link that resets the password and signs out old sessions', async () => {
        process.env.EMAIL_TRANSPORT = 'console';
        process.env.APP_URL = 'https://academy.example.com';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const user = await createUser({role: 'guardian', email: 'parent@example.com'});
        const sessionStart = Date.now() - 1000;

        const unknown = await call(requestReset, {method: 'POST', body: {email: 'nobody@example.com'}});
        const known = await call(requestReset, {method: 'POST', body: {email: 'parent@example.com'}});
        expect(unknown.status).toBe(known.status);

        const email = log.mock.calls.map((args) => String(args[0])).find((line) => line.startsWith('[email]'));
        expect(email).toContain('to=parent@example.com');
        const token = email.match(/https:\/\/academy\.example\.com\/resetPassword\?token=([0-9a-f]{64})/)[1];
        // Only a hash is stored
        expect((await User.findById(user._id)).passwordResetTokenHash).not.toBe(token);

        expect((await call(completeReset, {method: 'POST', body: {token, password: 'short'}})).status).toBe(400);
        expect((await call(completeReset, {method: 'POST', body: {token, password: 'brandnewpass9'}})).status).toBe(200);
        expect((await call(completeReset, {method: 'POST', body: {token, password: 'anotherpass9'}})).status).toBe(400);

        const updated = await User.findById(user._id);
        expect(await bcrypt.compare('brandnewpass9', updated.password)).toBe(true);
        signInAs(updated, {authTime: sessionStart});
        expect((await call(me)).status).toBe(401);
    });

    it('rejects expired links', async () => {
        process.env.EMAIL_TRANSPORT = 'console';
        process.env.APP_URL = 'https://academy.example.com';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const user = await createUser({role: 'guardian', email: 'parent@example.com'});
        await call(requestReset, {method: 'POST', body: {email: 'parent@example.com'}});
        const token = String(log.mock.calls.find((a) => String(a[0]).startsWith('[email]'))[0]).match(/token=([0-9a-f]{64})/)[1];
        await User.updateOne({_id: user._id}, {passwordResetExpires: new Date(Date.now() - 1000)});
        expect((await call(completeReset, {method: 'POST', body: {token, password: 'brandnewpass9'}})).status).toBe(400);
    });
});
