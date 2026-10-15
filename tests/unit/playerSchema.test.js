import {describe, expect, it} from 'vitest';
import {playerSchema} from '@/schemas/playerSchema';

const valid = {
    name: 'Luka', lastname: 'Beridze', dateOfBirth: '2010-05-05', height: 180, position: 'Center',
    jerseyNum: 7, teamId: 'abc', tel: '+995 599 00 00 00', address: '24 Chavchavadze Ave', guardian: 'Mother',
    guardianTel: '+995 (599) 11-22-33',
};

describe('playerSchema', () => {
    it('accepts phone numbers written with spaces, dashes and parentheses', () => {
        expect(playerSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects phone numbers without a country code', () => {
        expect(playerSchema.safeParse({...valid, tel: '599 00 00 00'}).success).toBe(false);
    });

    it('requires a known position and guardian type', () => {
        expect(playerSchema.safeParse({...valid, position: ''}).success).toBe(false);
        expect(playerSchema.safeParse({...valid, guardian: 'Uncle'}).success).toBe(false);
    });
});
