'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Trophy, ArrowLeft, Radio, Wifi, Volume2 } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getTournamentMatches, MatchDisplayItem } from '@/lib/services/drawService';
import { subscribeToMatchScore } from '@/lib/services/scoringService';
import { getCourts, CourtInfo } from '@/lib/services/dispatcherService';
import { Timer, Clock, Users, Flame } from 'lucide-react';

export default function CourtScoreboardPage() {
  const params = useParams();
  const courtParam = params?.courtNumber as string;
  const courtNumber = parseInt(courtParam || '1', 10) || 1;

  const { t, locale } = useLanguage();
  const sbT = t.scoreboard;

  const [courtInfo, setCourtInfo] = useState<CourtInfo | null>(null);
  const [warmupTimer, setWarmupTimer] = useState<number>(120);

  const [matchData, setMatchData] = useState<MatchDisplayItem>({
    id: '50000000-0000-0000-0000-000000000001',
    matchNumber: courtNumber,
    courtNumber,
    courtInfo: `Sân ${courtNumber}`,
    round: 3,
    roundName: 'Chung Kết',
    stage: 'knockout',
    teamA: 'Nguyễn Văn A / Lê Hùng',
    teamB: 'Trần Thị B / Mai Lan',
    clubA: 'CLB Ba Đình',
    clubB: 'CLB Cầu Giấy',
    currentScoreA: 20,
    currentScoreB: 19,
    setsA: 1,
    setsB: 1,
    status: 'in_progress',
    version: 4,
  });

  const [server, setServer] = useState<'A' | 'B'>('A');
  const [previousSets, setPreviousSets] = useState<{ a: number; b: number }[]>([
    { a: 21, b: 19 },
    { a: 18, b: 21 },
  ]);

  // Load court data from dispatcher
  const refreshCourtData = async () => {
    try {
      const courts = await getCourts();
      const current = courts.find((c) => c.courtNumber === courtNumber);
      if (current) {
        setCourtInfo(current);
        if (current.currentMatch) {
          setMatchData(current.currentMatch);
        }
        if (typeof current.warmupSecondsLeft === 'number') {
          setWarmupTimer(current.warmupSecondsLeft);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshCourtData();

    const handleUpdate = () => {
      refreshCourtData();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('badminton_court_dispatcher_update', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('badminton_court_dispatcher_update', handleUpdate);
    };
  }, [courtNumber]);

  // Warmup countdown tick
  useEffect(() => {
    if (courtInfo?.status !== 'warmup') return;
    const interval = setInterval(() => {
      setWarmupTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [courtInfo?.status]);

  // Fetch active match on this court if no dispatcher match found
  useEffect(() => {
    if (!courtInfo?.currentMatch) {
      getTournamentMatches('20000000-0000-0000-0000-000000000001').then((matches) => {
        const match = matches.find((m) => m.courtNumber === courtNumber);
        if (match) {
          setMatchData(match);
        }
      });
    }
  }, [courtNumber, courtInfo]);

  // Subscribe to Realtime score updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeToMatchScore(matchData.id, (updated) => {
      if (updated) {
        setMatchData((prev) => ({
          ...prev,
          currentScoreA: updated.points_a ?? prev.currentScoreA,
          currentScoreB: updated.points_b ?? prev.currentScoreB,
          setsA: updated.sets_a ?? prev.setsA,
          setsB: updated.sets_b ?? prev.setsB,
          status: updated.status || prev.status,
          version: updated.version ?? prev.version,
        }));

        if (updated.game_scores && Array.isArray(updated.game_scores)) {
          setPreviousSets(
            updated.game_scores
              .slice(0, 2)
              .map((g: any) => ({ a: g.scoreA || 0, b: g.scoreB || 0 }))
          );
        }
      }
    });

    return () => unsubscribe();
  }, [matchData.id]);

  const effectiveStatus = courtInfo?.status || matchData.status || 'in_progress';
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex flex-col justify-between font-sans select-none p-4 md:p-8">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/prototypes/umpire-scoring"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase">
                {sbT.courtTitle(courtNumber)}
              </h1>
            </div>
            <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
              {matchData.roundName} • Trận #{matchData.matchNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>{sbT.liveTicker}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Center Main Arena Scoreboard */}
      <main className="my-auto py-6 max-w-6xl mx-auto w-full">
        {effectiveStatus === 'warmup' ? (
          /* WARM-UP SCREEN */
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-bold uppercase tracking-widest animate-pulse">
                <Flame className="w-4 h-4 text-amber-400" />
                VẬN ĐỘNG VIÊN ĐANG KHỞI ĐỘNG (BWF 2 PHÚT)
              </div>
              <p className="text-slate-400 text-xs md:text-sm">
                Hai đội vui lòng hoàn tất khởi động và chuẩn bị thực hiện thủ tục bốc thăm giao cầu
              </p>
            </div>

            {/* Giant Countdown */}
            <div className="flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden">
              <div className="text-8xl md:text-9xl font-mono font-black text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]">
                {formatSeconds(warmupTimer)}
              </div>
              <div className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                {warmupTimer > 0 ? 'Đồng hồ đếm ngược khởi động' : 'HẾT GIỜ KHỞI ĐỘNG - MỜI TRỌNG TÀI BẮT ĐẦU'}
              </div>
            </div>

            {/* Match Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="rounded-2xl bg-slate-900/70 border border-cyan-500/30 p-6">
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase">
                  ĐỘI 1
                </span>
                <h3 className="text-2xl font-black text-white mt-3">{matchData.teamA}</h3>
                {matchData.clubA && <p className="text-sm text-cyan-300/80 mt-1">{matchData.clubA}</p>}
              </div>

              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950 border border-slate-700 items-center justify-center font-black text-slate-400 z-10 text-xs">
                VS
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-amber-500/30 p-6">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold uppercase">
                  ĐỘI 2
                </span>
                <h3 className="text-2xl font-black text-white mt-3">{matchData.teamB}</h3>
                {matchData.clubB && <p className="text-sm text-amber-300/80 mt-1">{matchData.clubB}</p>}
              </div>
            </div>
          </div>
        ) : effectiveStatus === 'available' ? (
          /* AVAILABLE / IDLE SCREEN */
          <div className="space-y-8 animate-fadeIn text-center">
            <div className="p-12 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                🏸
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-wide uppercase">
                SÂN {courtNumber} ĐANG TRỐNG
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
                Sân đấu đang trong trạng thái sẵn sàng đón lượt trận tiếp theo từ Ban Tổ Chức
              </p>
            </div>

            {/* On-Deck / Next Match Preview if available */}
            {courtInfo?.nextMatch ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/30 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    ⭐ TRẬN TIẾP THEO (ON-DECK) - MỜI VĐV CHUẨN BỊ
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Trận #{courtInfo.nextMatch.matchNumber} • {courtInfo.nextMatch.roundName}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-lg font-bold text-white">{courtInfo.nextMatch.teamA}</div>
                    {courtInfo.nextMatch.clubA && (
                      <div className="text-xs text-slate-400 mt-0.5">{courtInfo.nextMatch.clubA}</div>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-lg font-bold text-white">{courtInfo.nextMatch.teamB}</div>
                    {courtInfo.nextMatch.clubB && (
                      <div className="text-xs text-slate-400 mt-0.5">{courtInfo.nextMatch.clubB}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* LIVE IN-PROGRESS SCOREBOARD */
          <>
            {/* Teams & Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Team A (Left) */}
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-block px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-cyan-500/30">
                    ĐỘI 1
                  </div>
                  {server === 'A' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                      🏸 {sbT.servingLabel}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight line-clamp-2">
                    {matchData.teamA}
                  </h2>
                  {matchData.clubA && (
                    <p className="text-sm md:text-base text-slate-400 font-semibold mt-1">
                      {matchData.clubA}
                    </p>
                  )}
                </div>

                <div className="flex items-end justify-between border-t border-slate-800/80 pt-6">
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    Số Set Thắng: <span className="text-cyan-400 text-lg font-mono ml-1">{matchData.setsA}</span>
                  </div>
                  {/* Huge LED Number */}
                  <div className="text-7xl md:text-9xl font-mono font-black text-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                    {matchData.currentScoreA}
                  </div>
                </div>
              </div>

              {/* VS Badge in the center on desktop */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-950 border border-slate-700 items-center justify-center font-black text-slate-400 z-10 shadow-2xl text-xs">
                VS
              </div>

              {/* Team B (Right) */}
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-block px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
                    ĐỘI 2
                  </div>
                  {server === 'B' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                      🏸 {sbT.servingLabel}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight line-clamp-2">
                    {matchData.teamB}
                  </h2>
                  {matchData.clubB && (
                    <p className="text-sm md:text-base text-slate-400 font-semibold mt-1">
                      {matchData.clubB}
                    </p>
                  )}
                </div>

                <div className="flex items-end justify-between border-t border-slate-800/80 pt-6">
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    Số Set Thắng: <span className="text-amber-400 text-lg font-mono ml-1">{matchData.setsB}</span>
                  </div>
                  {/* Huge LED Number */}
                  <div className="text-7xl md:text-9xl font-mono font-black text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                    {matchData.currentScoreB}
                  </div>
                </div>
              </div>
            </div>

            {/* Set History Bar */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {sbT.setScoresLabel}:
                </span>
                <div className="flex items-center gap-3">
                  {previousSets.map((s, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200"
                    >
                      Set {idx + 1}: <span className="text-cyan-400">{s.a}</span> -{' '}
                      <span className="text-amber-400">{s.b}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono font-black text-emerald-300">
                    Set {Math.min(3, (matchData.setsA || 0) + (matchData.setsB || 0) + 1)} (Live):{' '}
                    <span className="text-cyan-400">{matchData.currentScoreA}</span> -{' '}
                    <span className="text-amber-400">{matchData.currentScoreB}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Real-time sync #{matchData.version}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-500">
        <div>Badminton Tournament Arena Display System • 2026</div>
        <div className="flex items-center gap-2">
          <Link
            href={`/scoreboard/court/${courtNumber === 3 ? 1 : courtNumber + 1}`}
            className="hover:text-cyan-400 transition-colors"
          >
            Chuyển Sân Kế Tiếp →
          </Link>
        </div>
      </footer>
    </div>
  );
}
