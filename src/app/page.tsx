'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Activity,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Medal,
  ExternalLink,
  ChevronRight,
  Flame,
  Radio,
} from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { MOCK_TOURNAMENTS, MOCK_CLUB_RANKINGS, MockTournament, MockClubRanking } from '@/data/mockTournaments';
import { getTournaments } from '@/lib/services/tournamentService';
import { getMatchById, subscribeToTournamentMatches } from '@/lib/services/scoringService';
import { getClubRankings } from '@/lib/services/rankingService';

const LIVE_TOURNAMENT_ID = '20000000-0000-0000-0000-000000000001';
const LIVE_MATCH_ID = '50000000-0000-0000-0000-000000000001';

export default function HomePage() {
  const { t, locale } = useLanguage();
  const hubT = t.tournamentHub;
  const isEn = locale === 'en';

  const [tournaments, setTournaments] = useState<MockTournament[]>(MOCK_TOURNAMENTS);
  const [clubRankings, setClubRankings] = useState<MockClubRanking[]>(MOCK_CLUB_RANKINGS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    // 0. Load created custom tournaments + mock tournaments
    getTournaments().then((list) => {
      if (list && list.length > 0) {
        setTournaments(list);
      }
    });

    // 1. Fetch initial live match state from database
    getMatchById(LIVE_MATCH_ID).then((match) => {
      if (match) {
        setTournaments((prev) =>
          prev.map((tour) => {
            if (tour.id === LIVE_TOURNAMENT_ID && tour.liveMatches && tour.liveMatches.length > 0) {
              const updatedLiveMatches = tour.liveMatches.map((m) => {
                if (m.court === (match.court_number || 1)) {
                  return {
                    ...m,
                    currentSet: Math.min(3, (match.sets_a || 0) + (match.sets_b || 0) + 1),
                    setsA: match.sets_a ?? m.setsA,
                    setsB: match.sets_b ?? m.setsB,
                    currentScoreA: match.points_a ?? m.currentScoreA,
                    currentScoreB: match.points_b ?? m.currentScoreB,
                  };
                }
                return m;
              });
              return { ...tour, liveMatches: updatedLiveMatches };
            }
            return tour;
          })
        );
      }
    });

    // 2. Fetch live club rankings
    getClubRankings().then((rankings) => {
      if (rankings && rankings.length > 0) {
        setClubRankings(rankings);
      }
    });

    // 3. Subscribe to Realtime WebSocket updates for live court scores
    const unsubscribe = subscribeToTournamentMatches(LIVE_TOURNAMENT_ID, (updatedMatch) => {
      if (!updatedMatch) return;
      setTournaments((prev) =>
        prev.map((tour) => {
          if (tour.id === LIVE_TOURNAMENT_ID && tour.liveMatches && tour.liveMatches.length > 0) {
            const updatedLiveMatches = tour.liveMatches.map((m) => {
              if (m.court === (updatedMatch.court_number || 1)) {
                return {
                  ...m,
                  currentSet: Math.min(3, (updatedMatch.sets_a || 0) + (updatedMatch.sets_b || 0) + 1),
                  setsA: updatedMatch.sets_a ?? m.setsA,
                  setsB: updatedMatch.sets_b ?? m.setsB,
                  currentScoreA: updatedMatch.points_a ?? m.currentScoreA,
                  currentScoreB: updatedMatch.points_b ?? m.currentScoreB,
                };
              }
              return m;
            });
            return { ...tour, liveMatches: updatedLiveMatches };
          }
          return tour;
        })
      );
    });

    return () => unsubscribe();
  }, []);

  const filteredTournaments = useMemo(() => {
    if (activeFilter === 'live') {
      return tournaments.filter((tour) => tour.status === 'in_progress');
    }
    if (activeFilter === 'upcoming') {
      return tournaments.filter((tour) => tour.status === 'registration_open');
    }
    if (activeFilter === 'completed') {
      return tournaments.filter((tour) => tour.status === 'completed' || tour.status === 'archived');
    }
    return tournaments;
  }, [tournaments, activeFilter]);

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20">
                <img src="/logo.png" alt="VT Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {t.common.platformName}
                </h1>
                <p className="text-sm text-slate-400">{t.common.tagline}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tournaments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              {isEn ? 'Tournament Admin' : 'Quản Lý Giải'}
            </Link>
            <Link
              href="/rankings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              <Medal className="w-3.5 h-3.5 text-amber-400" />
              {hubT.viewFullRankings}
            </Link>
            <UserMenu />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 p-6 sm:p-10 shadow-2xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {t.home.badge}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {t.home.heroTitle}
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {t.home.heroDesc}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/admin/tournaments/create"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                {locale === 'vi' ? '+ Tạo Giải Đấu Mới' : '+ Create Tournament'}
              </Link>
              <Link
                href="/scoreboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
              >
                {t.home.explorePrototypes}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#tournament-hub"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                {hubT.sectionTitle}
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 1: TOURNAMENT DISCOVERY HUB */}
        <section id="tournament-hub" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                {hubT.sectionBadge}
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                {hubT.sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                {hubT.sectionDesc}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start md:self-auto overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {hubT.tabAll}
              </button>
              <button
                onClick={() => setActiveFilter('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeFilter === 'live'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {hubT.tabLive}
              </button>
              <button
                onClick={() => setActiveFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeFilter === 'upcoming'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {hubT.tabUpcoming}
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeFilter === 'completed'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {hubT.tabCompleted}
              </button>
            </div>
          </div>

          {/* Tournament Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tour) => {
              const isLive = tour.status === 'in_progress';
              const isUpcoming = tour.status === 'registration_open';
              const isArchived = tour.status === 'completed' || tour.status === 'archived';

              return (
                <div
                  key={tour.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all p-5 flex flex-col justify-between space-y-4 shadow-xl relative group"
                >
                  {/* Top Badges */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          LIVE COURT
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {hubT.tabUpcoming}
                        </span>
                      )}
                      {isArchived && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Trophy className="w-3 h-3" />
                          {hubT.tabCompleted}
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        {tour.totalPrizePool.toLocaleString(isEn ? 'en-US' : 'vi-VN')} VND
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        <Link href={`/tournaments/${tour.slug}`}>
                          {isEn ? tour.nameEn : tour.nameVi}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {isEn ? tour.descriptionEn : tour.descriptionVi}
                      </p>
                    </div>

                    {/* Metadata items */}
                    <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{tour.startDate} ~ {tour.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{isEn ? tour.venueEn : tour.venueVi}</span>
                      </div>
                    </div>

                    {/* DYNAMIC MIDDLE CONTENT BASED ON STATUS */}
                    {/* Case 1: In Progress -> Live Court Scores Ticker */}
                    {isLive && tour.liveMatches && tour.liveMatches.length > 0 && (
                      <div className="rounded-xl bg-slate-950/70 border border-rose-950/60 p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-rose-300 font-semibold border-b border-rose-900/30 pb-1">
                          <span className="flex items-center gap-1">
                            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                            {isEn ? `Court ${tour.liveMatches[0].court} • ${tour.liveMatches[0].roundEn}` : `Sân ${tour.liveMatches[0].court} • ${tour.liveMatches[0].roundVi}`}
                          </span>
                          <span className="font-mono text-white">
                            Set {tour.liveMatches[0].currentSet} ({tour.liveMatches[0].setsA}-{tour.liveMatches[0].setsB})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 truncate pr-2 font-medium">
                            {tour.liveMatches[0].teamA.split('/')[0]}
                          </span>
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            {tour.liveMatches[0].currentScoreA}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 truncate pr-2 font-medium">
                            {tour.liveMatches[0].teamB.split('/')[0]}
                          </span>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {tour.liveMatches[0].currentScoreB}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Case 2: Registration Open -> Quota Progress Bar */}
                    {isUpcoming && (
                      <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {hubT.quotaProgress(28, 32)}
                          </span>
                          <span className="font-bold text-amber-300">
                            {hubT.remainingSlots(4)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full w-[87.5%]" />
                        </div>
                      </div>
                    )}

                    {/* Case 3: Completed -> Podium Snapshot */}
                    {isArchived && tour.podium && tour.podium.length > 0 && (
                      <div className="rounded-xl bg-slate-950/70 border border-amber-500/20 p-3 space-y-1 text-xs">
                        <div className="text-[11px] font-bold text-amber-400 uppercase">
                          🥇 {isEn ? 'Champion' : 'Vô Địch'}: {tour.podium[0].gold.team}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          🥈 {isEn ? 'Runner-up' : 'Á Quân'}: {tour.podium[0].silver.team}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      href={`/tournaments/${tour.slug}`}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {hubT.viewRegulations}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {isLive && (
                      <Link
                        href="/prototypes/umpire-scoring"
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition-all flex items-center gap-1 shadow-md shadow-rose-500/20"
                      >
                        <Radio className="w-3 h-3" />
                        {hubT.watchLiveScore}
                      </Link>
                    )}

                    {isUpcoming && (
                      <Link
                        href="/prototypes/athlete-registration"
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20"
                      >
                        {hubT.registerNow}
                      </Link>
                    )}

                    {isArchived && (
                      <Link
                        href={`/tournaments/${tour.slug}?tab=podium`}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
                      >
                        <Trophy className="w-3 h-3" />
                        {hubT.viewBracketResults}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: HALL OF FAME & CLUB LEADERBOARD TEASER */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Medal className="w-4 h-4" />
                {hubT.hallOfFameTitle}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {hubT.hallOfFameDesc}
              </p>
            </div>
            <Link
              href="/rankings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all self-start sm:self-auto"
            >
              {hubT.viewFullRankings}
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clubRankings.slice(0, 3).map((club, idx) => (
              <div
                key={club.rank}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    idx === 0
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-950 font-black'
                      : 'bg-amber-700/60 text-amber-100 font-black'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {isEn ? club.nameEn : club.nameVi}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {club.goldMedals} 🥇 • {club.silverMedals} 🥈 • {club.bronzeMedals} 🥉
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-cyan-400">
                    {club.totalPoints}
                  </span>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">{hubT.pts}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

