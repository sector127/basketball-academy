import {beforeEach, describe, expect, it} from 'vitest';
import {call, createEvent, createPlayer, seedAcademy, signInAs} from '../helpers';
import {DELETE as deleteSeries, POST as planSeason} from '@/app/api/admin/events/recurring/route';
import Event from '@/models/Event';

describe('season planner', () => {
    let academy;
    beforeEach(async () => {
        academy = await seedAcademy();
        signInAs(academy.admin);
    });

    const plan = (overrides = {}) => call(planSeason, {
        method: 'POST',
        body: {
            action: 'preview',
            teamId: academy.team._id.toString(),
            venueId: academy.venue._id.toString(),
            startDate: '2027-03-01',
            endDate: '2027-03-07',
            timeZone: 'Asia/Tbilisi',
            schedule: [{dayOfWeek: 1, startTime: '18:00', endTime: '19:30'}],
            ...overrides,
        },
    });

    it('creates sessions at the planner\'s local time, whatever the server time zone', async () => {
        const {body} = await plan();
        expect(body.sessions).toHaveLength(1);
        expect(body.sessions[0]).toMatchObject({
            date: '2027-03-01',
            dayName: 'Monday',
            startDateTime: '2027-03-01T14:00:00.000Z',
            endDateTime: '2027-03-01T15:30:00.000Z',
        });
    });

    it('flags sessions that clash with existing bookings', async () => {
        await createEvent({title: 'Derby', eventType: 'game', opponent: 'X', venue: academy.venue._id,
            startTime: new Date('2027-03-01T14:30:00Z'), endTime: new Date('2027-03-01T16:00:00Z')});
        const {body} = await plan();
        expect(body.conflictCount).toBe(1);
        expect(body.sessions[0].conflictReason).toMatch(/Derby/);
    });

    it('rejects bad input', async () => {
        expect((await plan({endDate: '2030-01-01'})).status).toBe(400);
        expect((await plan({schedule: [{dayOfWeek: 1, startTime: '19:00', endTime: '18:00'}]})).status).toBe(400);
        expect((await plan({schedule: [{dayOfWeek: 1, startTime: '7pm', endTime: '8pm'}]})).status).toBe(400);
    });

    it('books active players only, and deleting the series keeps past sessions', async () => {
        await createPlayer(academy.team, {isActive: false});
        const created = await plan({action: 'create', startDate: '2020-01-06', endDate: '2035-01-01'});
        expect(created.status).toBe(400); // longer than 18 months

        const now = new Date();
        const iso = (d) => d.toISOString().slice(0, 10);
        const res = await plan({
            action: 'create',
            startDate: iso(new Date(now.getTime() - 14 * 864e5)),
            endDate: iso(new Date(now.getTime() + 14 * 864e5)),
            timeZone: 'UTC',
            schedule: [0, 1, 2, 3, 4, 5, 6].map((d) => ({dayOfWeek: d, startTime: '06:00', endTime: '06:30'})),
        });
        expect(res.status).toBe(201);
        const sessions = await Event.find({recurringGroupId: res.body.recurringGroupId});
        expect(sessions.every((s) => s.players.length === 1)).toBe(true);

        const past = sessions.filter((s) => s.startTime < now).length;
        await call(deleteSeries, {
            method: 'DELETE',
            url: `http://localhost/api/admin/events/recurring?groupId=${res.body.recurringGroupId}&futureOnly=true&fromDate=${now.toISOString()}`,
        });
        expect(await Event.countDocuments({recurringGroupId: res.body.recurringGroupId})).toBe(past);
    });
});
