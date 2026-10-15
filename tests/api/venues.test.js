import {beforeEach, describe, expect, it} from 'vitest';
import {call, createEvent, createVenue, seedAcademy, signInAs} from '../helpers';
import {DELETE as deleteVenue} from '@/app/api/admin/venues/[id]/route';
import {GET as listVenues} from '@/app/api/admin/venues/route';
import Venue from '@/models/Venue';

describe('deleting a venue', () => {
    beforeEach(async () => {
        const {admin} = await seedAcademy();
        signInAs(admin);
    });

    it('is refused while upcoming events use it', async () => {
        const venue = await createVenue();
        await createEvent({venue: venue._id});
        const res = await call(deleteVenue, {method: 'DELETE', params: {id: venue._id.toString()}});
        expect(res.status).toBe(409);
    });

    it('archives a venue that only past events use, keeping their history', async () => {
        const venue = await createVenue();
        await createEvent({venue: venue._id, startTime: new Date('2025-02-01T10:00:00Z')});
        const res = await call(deleteVenue, {method: 'DELETE', params: {id: venue._id.toString()}});
        expect(res.body.archived).toBe(true);
        expect(await Venue.exists({_id: venue._id})).toBeTruthy();
        expect((await call(listVenues)).body.some((v) => v._id === venue._id.toString())).toBe(false);
    });

    it('deletes an unused venue', async () => {
        const venue = await createVenue();
        await call(deleteVenue, {method: 'DELETE', params: {id: venue._id.toString()}});
        expect(await Venue.exists({_id: venue._id})).toBeNull();
    });
});
