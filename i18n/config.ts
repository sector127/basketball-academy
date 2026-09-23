export type Locale = (typeof locales)[number];

export const locales = ['en', 'ka'] as const;
export const defaultLocale: Locale = 'en';