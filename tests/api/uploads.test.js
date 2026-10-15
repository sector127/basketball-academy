import {beforeEach, describe, expect, it} from 'vitest';
import {call, seedAcademy, signInAs} from '../helpers';
import {POST as upload} from '@/app/api/admin/uploads/route';
import {GET as serveUpload} from '@/app/api/uploads/[filename]/route';
import {PUT as updatePlayer} from '@/app/api/admin/players/[playerId]/route';
import {POST as createCoach} from '@/app/api/admin/coaches/route';

// Smallest valid PNG (1x1)
const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);
const file = (bytes, name, type) => new File([bytes], name, {type});

describe('uploads', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
        signInAs(academy.admin);
    });

    it('stores real images outside public/ and serves them', async () => {
        const res = await call(upload, {method: 'POST', form: {file: file(PNG, 'a.png', 'image/png')}});
        expect(res.status).toBe(201);
        expect(res.body.path).toMatch(/^\/api\/uploads\/\d+-[0-9a-f-]{36}\.png$/);

        const served = await call(serveUpload, {params: {filename: res.body.path.split('/').pop()}});
        expect(served.status).toBe(200);
        expect(served.response.headers.get('content-type')).toBe('image/png');
    });

    it('checks the file contents, not the declared type', async () => {
        const res = await call(upload, {method: 'POST', form: {file: file(Buffer.from('<script>alert(1)</script>'), 'x.png', 'image/png')}});
        expect(res.status).toBe(400);
    });

    it('does not serve files outside the upload folder', async () => {
        expect((await call(serveUpload, {params: {filename: '../package.json'}})).status).toBe(404);
        expect((await call(serveUpload, {params: {filename: 'package.json'}})).status).toBe(404);
    });

    it('replaces a player photo and deletes the old file', async () => {
        const params = {playerId: academy.player._id.toString()};
        const teamId = academy.team._id.toString();
        const first = await call(updatePlayer, {method: 'PUT', params, form: {teamId, profilePicture: file(PNG, 'a.png', 'image/png')}});
        const firstName = first.body.profilePicture.split('/').pop();
        await call(updatePlayer, {method: 'PUT', params, form: {teamId, profilePicture: file(PNG, 'b.png', 'image/png')}});
        expect((await call(serveUpload, {params: {filename: firstName}})).status).toBe(404);
    });

    it('rejects coach photos hosted on other sites and coaches without a password', async () => {
        const base = {name: 'N', lastName: 'C', email: 'new.coach@example.com'};
        expect((await call(createCoach, {method: 'POST', body: base})).status).toBe(400);
        expect((await call(createCoach, {method: 'POST', body: {...base, password: 'longenough1', image: 'https://evil.example/x.png'}})).status).toBe(400);
        expect((await call(createCoach, {method: 'POST', body: {...base, password: 'longenough1'}})).status).toBe(201);
    });
});
