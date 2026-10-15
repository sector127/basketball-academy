import {describe, expect, it} from 'vitest';
import {getSafeCallbackUrl} from '@/lib/safeRedirect';

const ORIGIN = 'https://academy.example.com';

describe('getSafeCallbackUrl', () => {
    it.each([
        ['/dashboard/coach', '/dashboard/coach'],
        ['/dashboard?tab=1#top', '/dashboard?tab=1#top'],
    ])('keeps same-origin path %s', (input, expected) => {
        expect(getSafeCallbackUrl(input, ORIGIN)).toBe(expected);
    });

    it.each([
        null,
        'javascript:alert(1)',
        'JaVaScRiPt:alert(1)',
        'https://evil.com',
        '//evil.com',
        '/\\evil.com',
        '\\\\evil.com',
        ' /dashboard',
    ])('rejects %s', (input) => {
        expect(getSafeCallbackUrl(input, ORIGIN)).toBe('/dashboard');
    });
});
