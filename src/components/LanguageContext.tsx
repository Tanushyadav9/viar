'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale, LOCALE_COOKIE_NAME, translate, getLocalizedContent } from '@/i18n';
export type Language = Locale;

interface LanguageContextType {
  language: Language;
  isHi: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  localize: <T extends { title: string; titleHi?: string | null; description?: string | null; descriptionHi?: string | null; shortDescription?: string | null; shortDescriptionHi?: string | null }>(
    item: T
  ) => { title: string; description: string; shortDescription?: string };
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isHi: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
  localize: (item) => ({ title: item.title, description: item.description || '' }),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Deduce initial locale
  const isHiUrl = pathname === '/hi' || pathname.startsWith('/hi/');
  const initialLocale: Locale = isHiUrl ? 'hi' : 'en';

  const [language, setLanguageState] = useState<Language>(initialLocale);

  // Sync state when pathname or window location changes
  useEffect(() => {
    let resolved: Locale = 'en';

    if (typeof window !== 'undefined') {
      const winPath = window.location.pathname || '';
      if (winPath === '/hi' || winPath.startsWith('/hi/')) {
        resolved = 'hi';
      } else if (pathname === '/hi' || pathname.startsWith('/hi/')) {
        resolved = 'hi';
      } else {
        const saved = localStorage.getItem('NEXT_LOCALE');
        if (saved === 'hi') {
          resolved = 'hi';
        } else {
          const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
          if (cookieMatch && cookieMatch[1] === 'hi') {
            resolved = 'hi';
          }
        }
      }
    } else {
      resolved = pathname === '/hi' || pathname.startsWith('/hi/') ? 'hi' : 'en';
    }

    setLanguageState(resolved);
    try {
      document.cookie = `${LOCALE_COOKIE_NAME}=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('NEXT_LOCALE', resolved);
        document.documentElement.lang = resolved;
      }
    } catch {}
  }, [pathname]);

  const switchLanguage = useCallback(
    (targetLang: Language) => {
      setLanguageState(targetLang);

      // Save cookie and local storage
      try {
        document.cookie = `${LOCALE_COOKIE_NAME}=${targetLang}; path=/; max-age=31536000; SameSite=Lax`;
        if (typeof window !== 'undefined') {
          localStorage.setItem('NEXT_LOCALE', targetLang);
          document.documentElement.lang = targetLang;
        }
      } catch {}

      // Calculate new target path while keeping visitor on the same page
      const winPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
      let targetPath = winPath || pathname;
      if (targetLang === 'hi') {
        if (!targetPath.startsWith('/hi')) {
          targetPath = targetPath === '/' ? '/hi' : `/hi${targetPath}`;
        }
      } else {
        if (targetPath === '/hi') {
          targetPath = '/';
        } else if (targetPath.startsWith('/hi/')) {
          targetPath = targetPath.replace(/^\/hi/, '') || '/';
        }
      }

      // Preserve query parameters and hash from browser location
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const destination = `${targetPath}${search}${hash}`;

      router.push(destination);
    },
    [pathname, router]
  );

  const toggleLanguage = () => {
    switchLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      return translate(language, key, defaultText);
    },
    [language]
  );

  const localize = useCallback(
    <T extends { title: string; titleHi?: string | null; description?: string | null; descriptionHi?: string | null; shortDescription?: string | null; shortDescriptionHi?: string | null }>(
      item: T
    ) => {
      return getLocalizedContent(item, language);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHi: language === 'hi',
        setLanguage: switchLanguage,
        toggleLanguage,
        t,
        localize,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Visual Language Selector Pill Component
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      aria-label="Language selection"
      className={`inline-flex items-center rounded-lg xl:rounded-xl p-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] xl:text-xs font-semibold shrink-0 h-8 xl:h-[34px] box-border ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`h-full px-2 xl:px-2.5 rounded-md xl:rounded-lg transition-all flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
          language === 'en'
            ? 'bg-amber-500 text-black font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        aria-pressed={language === 'hi'}
        className={`h-full px-2 xl:px-2.5 rounded-md xl:rounded-lg transition-all flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
          language === 'hi'
            ? 'bg-amber-500 text-black font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
