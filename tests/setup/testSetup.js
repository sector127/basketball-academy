import {afterAll, beforeAll, beforeEach, inject, vi} from 'vitest';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import mongoose from 'mongoose';

// Route handlers call auth() from '@/auth'; tests choose the signed-in user with signInAs()
vi.mock('@/auth', () => ({auth: vi.fn(async () => null)}));

const uploadDir = mkdtempSync(join(tmpdir(), 'bba-uploads-'));
process.env.UPLOAD_DIR = uploadDir;
process.env.MONGODB_URI = inject('mongoUri');
process.env.ACADEMY_TIME_ZONE = 'Asia/Tbilisi';

beforeAll(async () => {
    const {default: connectToDatabase} = await import('@/lib/mongoose');
    await connectToDatabase();
    // Make sure unique indexes (e.g. one starter per position) exist before tests rely on them
    const models = await Promise.all([
        import('@/models/User'), import('@/models/Player'), import('@/models/Team'),
        import('@/models/Event'), import('@/models/Venue'), import('@/models/GameResult'),
    ]);
    await Promise.all(models.map((m) => m.default.init()));
});

// Clear documents but keep indexes
beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    global.mongoose = undefined;
    rmSync(uploadDir, {recursive: true, force: true});
});
