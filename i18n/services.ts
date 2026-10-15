'use server';

import {cookies} from 'next/headers';
import {Locale, defaultLocale, locales} from '@/i18n/config';

function isLocale(value: unknown): value is Locale {
    return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {

    // The cookie is user-controlled; an unknown value would make the messages import fail
    const value = (await cookies()).get(COOKIE_NAME)?.value;
    return isLocale(value) ? value : defaultLocale;
}

export async function setUserLocale(locale: Locale) {
    if (!isLocale(locale)) return;
    (await cookies()).set(COOKIE_NAME, locale, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
    });
}