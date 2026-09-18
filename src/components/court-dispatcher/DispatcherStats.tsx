'use client';

import React from 'react';
import { useLanguage } from '@/i18n';

export interface DispatcherMetrics {
  totalCourts: number;
  inProgressCourts: number;
  warmupCourts: number;
  availableCourts: number;
  readyMatches: number;
  activeMatches: number;
  completedMatches: number;
  pendingMatches: number;
}

interface DispatcherStatsProps {
  metrics: DispatcherMetrics;
}

export function DispatcherStats({ metrics }: DispatcherStatsProps) {
  const { t } = useLanguage();
  

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {t.dispatcher.totalCourts}
        </span>
        <div className="text-xl sm:text-2xl font-black font-mono text-white">
          {metrics.totalCourts}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          {t.dispatcher.inProgress}
        </span>
        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
          {metrics.inProgressCourts} <span className="text-xs text-slate-400 font-normal">{t.dispatcher.courtUnit}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
          {t.dispatcher.inWarmup}
        </span>
        <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">
          {metrics.warmupCourts} <span className="text-xs text-slate-400 font-normal">{t.dispatcher.courtUnit}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
          {t.dispatcher.available}
        </span>
        <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
          {metrics.availableCourts} <span className="text-xs text-slate-400 font-normal">{t.dispatcher.courtUnit}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {t.dispatcher.readyQueue}
        </span>
        <div className="text-xl sm:text-2xl font-black font-mono text-white">
          {metrics.readyMatches} <span className="text-xs text-slate-400 font-normal">{t.dispatcher.matchUnit}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {t.dispatcher.completed}
        </span>
        <div className="text-xl sm:text-2xl font-black font-mono text-slate-300">
          {metrics.completedMatches} <span className="text-xs text-slate-400 font-normal">{t.dispatcher.matchUnit}</span>
        </div>
      </div>
    </div>
  );
}
