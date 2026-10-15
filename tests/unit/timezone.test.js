import {describe, expect, it} from 'vitest';
import {formatAcademyTime, isValidTimeZone, zonedTimeToUtc} from '@/lib/timezone';

describe('zonedTimeToUtc', () => {
    it('converts Tbilisi wall-clock time (UTC+4) to UTC', () => {
        expect(zonedTimeToUtc(2026, 10, 3, 18, 0, 'Asia/Tbilisi').toISOString()).toBe('2026-10-03T14:00:00.000Z');
    });

    it('handles times that fall on the previous UTC day', () => {
        expect(zonedTimeToUtc(2026, 10, 3, 0, 30, 'Asia/Tbilisi').toISOString()).toBe('2026-10-02T20:30:00.000Z');
    });

    it('respects daylight saving time', () => {
        expect(zonedTimeToUtc(2026, 7, 1, 18, 0, 'America/New_York').toISOString()).toBe('2026-07-01T22:00:00.000Z');
        expect(zonedTimeToUtc(2026, 1, 1, 18, 0, 'America/New_York').toISOString()).toBe('2026-01-01T23:00:00.000Z');
        expect(zonedTimeToUtc(2026, 3, 29, 3, 30, 'Europe/Berlin').toISOString()).toBe('2026-03-29T01:30:00.000Z');
    });
});

describe('formatAcademyTime', () => {
    it('formats in the academy time zone, not the server zone', () => {
        expect(formatAcademyTime('2026-10-03T14:00:00Z').replace(/\s/g, ' ')).toBe('06:00 PM');
    });
});

describe('isValidTimeZone', () => {
    it('accepts IANA zones and rejects anything else', () => {
        expect(isValidTimeZone('Asia/Tbilisi')).toBe(true);
        expect(isValidTimeZone('Nope/Zone')).toBe(false);
        expect(isValidTimeZone(undefined)).toBe(false);
    });
});
