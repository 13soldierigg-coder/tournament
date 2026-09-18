'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Dictionary } from './types';
import { vi } from './dictionaries/vi';
import { en } from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = {
  vi,
  en,
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    // Read stored language preference on mount
    try {
      const saved = localStorage.getItem('badminton_locale') as Locale | null;
      if (saved && (saved === 'vi' || saved === 'en')) {
        setLocaleState(saved);
      }
    } catch {
      // Ignore localStorage errors in private mode
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('badminton_locale', newLocale);
      document.cookie = `badminton_locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t: dictionaries[locale],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
