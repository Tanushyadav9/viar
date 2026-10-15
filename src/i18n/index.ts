import enMessages from './locales/en.json' with { type: 'json' };
import hiMessages from './locales/hi.json' with { type: 'json' };
import { type Locale, DEFAULT_LOCALE } from './config.ts';

export * from './config.ts';

export type Messages = typeof enMessages;

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  en: enMessages,
  hi: hiMessages,
};

/**
 * Resolve a nested dot-notation key (e.g. 'checkout.page_title')
 */
export function getMessage(locale: Locale, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];

  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Translation helper with English fallback
 */
export function translate(locale: Locale, key: string, defaultText?: string): string {
  const translated = getMessage(locale, key);
  if (translated) return translated;

  // Fallback to English
  if (locale !== DEFAULT_LOCALE) {
    const fallback = getMessage(DEFAULT_LOCALE, key);
    if (fallback) return fallback;
  }

  return defaultText || key;
}

/**
 * Format currency in Indian numbering (e.g. ₹5,100)
 */
export function formatINR(amount: number, locale: Locale = 'en'): string {
  const formatted = amount.toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN');
  return `₹${formatted}`;
}

/**
 * Helper to extract localized course/module/lesson content with English fallback
 */
export function getLocalizedContent<T extends { title: string; titleHi?: string | null; description?: string | null; descriptionHi?: string | null; shortDescription?: string | null; shortDescriptionHi?: string | null }>(
  item: T,
  locale: Locale
): { title: string; description: string; shortDescription?: string } {
  const isHi = locale === 'hi';
  const title = (isHi && item.titleHi?.trim()) ? item.titleHi.trim() : item.title;
  const description = (isHi && item.descriptionHi?.trim()) ? item.descriptionHi.trim() : (item.description || '');
  const shortDescription = (isHi && item.shortDescriptionHi?.trim()) ? item.shortDescriptionHi.trim() : (item.shortDescription || undefined);

  return { title, description, shortDescription };
}
