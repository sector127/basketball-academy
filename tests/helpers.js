import {vi} from 'vitest';
import bcrypt from 'bcrypt';
import {auth} from '@/auth';
import User from '@/models/User';
import Team from '@/models/Team';
import Player from '@/models/Player';
import Venue from '@/models/Venue';
import Event from '@/models/Event';

let counter = 0;
const unique = () => `${Date.now()}${counter++}`;

// ---- Session -------------------------------------------------------------

/** Makes route handlers see `user` as signed in (null signs out). */
export function signInAs(user, {authTime = Date.now()} = {}) {
    vi.mocked(auth).mockResolvedValue(
        user ? {user: {id: user._id.toString(), role: user.role, email: user.email}, authTime} : null
    );
}

// ---- Requests ------------------------------------------------------------

/** Calls a route handler like Next.js would and returns {status, body}. */
export async function call(handler, {method = 'GET', url = 'http://localhost/api/test', body, form, params = {}, ip} = {}) {
    const headers = new Headers();
    // Unique client IP per request unless given, so rate limits don't leak between tests
    headers.set('x-forwarded-for', ip || `10.${counter % 250}.${Math.floor(Math.random() * 250)}.${counter++ % 250}`);
    let requestBody;
    if (form) {
        requestBody = new FormData();
        for (const [key, value] of Object.entries(form)) requestBody.append(key, value);
    } else if (body !== undefined) {
        headers.set('content-type', 'application/json');
        requestBody = JSON.stringify(body);
    }
    const response = await handler(new Request(url, {method, headers, body: requestBody}), {params: Promise.resolve(params)});
    const text = await response.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = text;
    }
    return {status: response.status, body: json, response};
}

// ---- Factories -----------------------------------------------------------

export async function createUser(overrides = {}) {
    const {password = 'password123', ...rest} = overrides;
    return User.create({
        email: `user${unique()}@example.com`,
        name: 'Test',
        lastName: 'User',
        role: 'admin',
        password: await bcrypt.hash(password, 4),
        ...rest,
    });
}

export async function createTeam(coach, overrides = {}) {
    return Team.create({name: `Team ${unique()}`, description: 'Test team', coach: coach._id, ...overrides});
}

export async function createPlayer(team, overrides = {}) {
    return Player.create({
        name: 'Luka',
        lastname: `Player${unique()}`,
        dateOfBirth: new Date('2010-05-05'),
        height: 180,
        position: 'Center',
        jerseyNum: counter++ % 100,
        team: team?._id,
        tel: '+995599000000',
        address: 'Tbilisi',
        guardian: 'Mother',
        guardianTel: '+995599111111',
        ...overrides,
    });
}

export async function createVenue(overrides = {}) {
    return Venue.create({
        name: `Venue ${unique()}`,
        address: 'Tbilisi',
        location: {type: 'Point', coordinates: [44.78, 41.71]},
        ...overrides,
    });
}

export async function createEvent(overrides = {}) {
    const start = overrides.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000);
    return Event.create({
        eventType: 'practice',
        title: 'Practice',
        startTime: start,
        endTime: new Date(new Date(start).getTime() + 60 * 60 * 1000),
        ...overrides,
    });
}

/** Admin + a coach with one team, one player and one venue — the common starting point. */
export async function seedAcademy() {
    const admin = await createUser({role: 'admin'});
    const coach = await createUser({role: 'coach'});
    const otherCoach = await createUser({role: 'coach'});
    const team = await createTeam(coach);
    const otherTeam = await createTeam(otherCoach);
    const player = await createPlayer(team);
    const otherPlayer = await createPlayer(otherTeam);
    const venue = await createVenue();
    return {admin, coach, otherCoach, team, otherTeam, player, otherPlayer, venue};
}
