'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  ArrowLeft,
  Radio,
  Clock,
  Flame,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getCourts, CourtInfo } from '@/lib/services/dispatcherService';

export default function StadiumArenaScoreboardPage() {
  const { t, locale } = useLanguage();
  const [courts, setCourts] = useState<CourtInfo[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);

  // Load and refresh court states
  const refreshCourts = async () => {
    try {
      const data = await getCourts();
      setCourts(data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshCourts();

    const handleUpdate = () => {
      refreshCourts();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('badminton_court_dispatcher_update', handleUpdate);

    // Live clock
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setTick((prev) => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('badminton_court_dispatcher_update', handleUpdate);
      clearInterval(clockInterval);
    };
  }, [locale]);

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatSeconds = (sec?: number) => {
    if (!sec || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeCount = courts.filter((c) => c.status === 'in_progress').length;
  const warmupCount = courts.filter((c) => c.status === 'warmup').length;
  const availableCount = courts.filter((c) => c.status === 'available').length;

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans select-none p-4 md:p-6 lg:p-8">
      {/* Top Arena Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95"
            title="Quay lại Trang Chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl md:text-3xl font-black tracking-widest text-white uppercase">
                {locale === 'vi'
                  ? 'BẢNG ĐIỂM TỔNG HỢP NHÀ THI ĐẤU'
                  : 'ARENA MULTI-COURT SCOREBOARD'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Hệ Thống Màn Hình Tivi Trung Tâm • BWF Tournament Live Hub 2026
            </p>
          </div>
        </div>

        {/* Stadium KPI Counters & Live Time */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Đang đấu:</span>
            <span className="font-bold text-cyan-400 font-mono">{activeCount}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Khởi động:</span>
            <span className="font-bold text-amber-400 font-mono">{warmupCount}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Sân trống:</span>
            <span className="font-bold text-emerald-400 font-mono">{availableCount}</span>
          </div>

          <div className="px-4 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold flex items-center gap-2 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Bật / Tắt Toàn Màn Hình Tivi"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Grid: All Arena Courts */}
      <main className="flex-1 my-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {courts.map((court) => {
            const match = court.currentMatch;
            const isLive = court.status === 'in_progress' && match;
            const isWarmup = court.status === 'warmup';
            const isAvailable = court.status === 'available' || !match;

            return (
              <div
                key={court.courtNumber}
                className={`rounded-3xl border flex flex-col justify-between p-6 shadow-2xl transition-all relative overflow-hidden ${
                  isLive
                    ? 'bg-slate-900/95 border-slate-700/80 hover:border-cyan-500/50'
                    : isWarmup
                    ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Court Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isLive
                          ? 'bg-cyan-400 animate-ping'
                          : isWarmup
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="font-black text-base text-white uppercase tracking-wider">
                      {court.courtName}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isLive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : isWarmup
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isLive
                      ? 'ĐANG THI ĐẤU'
                      : isWarmup
                      ? 'KHỞI ĐỘNG'
                      : 'SÂN TRỐNG'}
                  </span>
                </div>

                {/* Court Main Content Area */}
                <div className="flex-1 flex flex-col justify-center">
                  {isLive ? (
                    /* LIVE MATCH VIEW */
                    <div className="space-y-4">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {match.roundName} • Trận #{match.matchNumber}
                      </div>

                      {/* Team A */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="min-w-0 pr-3">
                          <div className="font-black text-white text-base truncate">
                            {match.teamA}
                          </div>
                          {match.clubA && (
                            <div className="text-xs text-slate-400 truncate">{match.clubA}</div>
                          )}
                        </div>
                        <div className="text-4xl sm:text-5xl font-mono font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
                          {match.currentScoreA}
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="min-w-0 pr-3">
                          <div className="font-black text-white text-base truncate">
                            {match.teamB}
                          </div>
                          {match.clubB && (
                            <div className="text-xs text-slate-400 truncate">{match.clubB}</div>
                          )}
                        </div>
                        <div className="text-4xl sm:text-5xl font-mono font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
                          {match.currentScoreB}
                        </div>
                      </div>

                      {/* Set Tally */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                        <span>Set Thắng:</span>
                        <span className="font-bold text-white">
                          <span className="text-cyan-400">{match.setsA}</span> -{' '}
                          <span className="text-amber-400">{match.setsB}</span>
                        </span>
                      </div>
                    </div>
                  ) : isWarmup ? (
                    /* WARM-UP VIEW */
                    <div className="text-center py-4 space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase">
                        <Flame className="w-3.5 h-3.5" />
                        VĐV Đang Khởi Động
                      </div>

                      <div className="text-6xl font-mono font-black text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                        {formatSeconds(court.warmupSecondsLeft ?? 120)}
                      </div>

                      {match && (
                        <div className="text-xs text-slate-300 font-medium px-2 py-1 rounded-xl bg-slate-950/60 border border-slate-800">
                          <div className="font-bold text-white truncate">{match.teamA}</div>
                          <div className="text-[10px] text-amber-400/90 uppercase font-black my-0.5">
                            VS
                          </div>
                          <div className="font-bold text-white truncate">{match.teamB}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* AVAILABLE / IDLE VIEW */
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                        🏸
                      </div>
                      <div className="text-lg font-bold text-white">Sẵn Sàng Đón Trận</div>

                      {court.nextMatch ? (
                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-left space-y-1">
                          <span className="text-[10px] text-indigo-400 font-bold uppercase">
                            ⭐ On-Deck: Trận #{court.nextMatch.matchNumber}
                          </span>
                          <div className="text-xs text-slate-300 font-semibold truncate">
                            {court.nextMatch.teamA} vs {court.nextMatch.teamB}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Chờ lệnh điều phối từ BTC</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Court Bottom Action Bar */}
                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {court.umpireName ? `TT: ${court.umpireName}` : 'Chưa gán TT'}
                  </div>

                  <Link
                    href={`/scoreboard/court/${court.courtNumber}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>Toàn Sân</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Arena Footer */}
      <footer className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center text-xs text-slate-500 gap-2">
        <div>Badminton Arena Central LED Wall • Live Broadcast Mode 2026</div>
      </footer>
    </div>
  );
}
