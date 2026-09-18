'use client';

import React from 'react';
import { useLanguage } from '@/i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs select-none ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <div className="pl-1.5 pr-1 text-slate-500 flex items-center">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLocale('vi')}
        aria-pressed={locale === 'vi'}
        className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
          locale === 'vi'
            ? 'bg-cyan-500 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <span>🇻🇳</span>
        <span>VI</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
          locale === 'en'
            ? 'bg-cyan-500 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
