export const locales = ['ca', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ca';

export const localeNames: Record<Locale, string> = {
    ca: 'Català',
    en: 'English',
    es: 'Español',
};
