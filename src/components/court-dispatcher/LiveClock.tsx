'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/i18n';

export function LiveClock() {
  const { locale } = useLanguage();
  
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(locale === 'en' ? 'en-US' : 'vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [locale]);

  return (
    <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 font-mono text-xs">
      <Clock className="w-3.5 h-3.5 text-cyan-400" />
      <span className="font-bold text-cyan-300">{currentTime || '12:00:00'}</span>
    </div>
  );
}
