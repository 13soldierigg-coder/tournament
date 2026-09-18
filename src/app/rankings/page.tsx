'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  ArrowLeft,
  Award,
  TrendingUp,
  Users,
  Shield,
  Star,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  MOCK_CLUB_RANKINGS,
  MOCK_ATHLETE_RANKINGS,
  MockClubRanking,
  MockAthleteRanking,
} from '@/data/mockTournaments';
import { getClubRankings, getAthleteRankings } from '@/lib/services/rankingService';

export default function RankingsPage() {
  const { t, locale } = useLanguage();
  const rankT = t.rankings;
  const isEn = locale === 'en';

  const [activeTab, setActiveTab] = useState<'clubs' | 'athletes'>('clubs');
  const [clubRankings, setClubRankings] = useState<MockClubRanking[]>(MOCK_CLUB_RANKINGS);
  const [athleteRankings, setAthleteRankings] = useState<MockAthleteRanking[]>(MOCK_ATHLETE_RANKINGS);

  useEffect(() => {
    getClubRankings().then((data) => {
      if (data && data.length > 0) {
        setClubRankings(data);
      }
    });
    getAthleteRankings().then((data) => {
      if (data && data.length > 0) {
        setAthleteRankings(data);
      }
    });
  }, []);

  const topClub = clubRankings[0] || MOCK_CLUB_RANKINGS[0];
  const topAthlete = athleteRankings[0] || MOCK_ATHLETE_RANKINGS[0];

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            {isEn ? 'Back to Home' : 'Quay Lại Trang Chủ'}
          </Link>

          <LanguageSwitcher />
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 p-6 sm:p-10 shadow-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5" />
            {isEn ? 'Official BWF Performance Index' : 'Chỉ Số Thi Đua Chính Thức'}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {rankT.title}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {rankT.desc}
          </p>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            {/* Top Club */}
            {topClub && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                  🥇
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {isEn ? 'Top Club' : 'CLB Dẫn Đầu'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {isEn ? topClub.nameEn : topClub.nameVi}
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono font-bold">
                    {topClub.totalPoints} {isEn ? 'pts' : 'điểm'} • {topClub.goldMedals} 🥇
                  </div>
                </div>
              </div>
            )}

            {/* Top Athlete */}
            {topAthlete && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/20 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg shrink-0">
                  🏸
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {isEn ? 'Top Athlete' : 'VĐV Xuất Sắc Nhất'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {topAthlete.name}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono font-bold">
                    {topAthlete.winRate}% {isEn ? 'Win Rate' : 'Thắng'} • {topAthlete.goldMedals} 🥇
                  </div>
                </div>
              </div>
            )}

            {/* Formula explanation */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold shrink-0">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {isEn ? 'Points Formula' : 'Công Thức Tính Điểm'}
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-200">
                  {isEn ? 'Gold 10 • Silver 6 • Bronze 3' : 'Vàng 10đ • Bạc 6đ • Đồng 3đ'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isEn ? 'National Badminton Standard' : 'Chuẩn thi đua toàn đoàn'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800 gap-1 w-full sm:w-auto self-start">
          <button
            onClick={() => setActiveTab('clubs')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'clubs'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            {rankT.tabClubs}
          </button>

          <button
            onClick={() => setActiveTab('athletes')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'athletes'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {rankT.tabAthletes}
          </button>
        </div>

        {/* TAB 1: CLUBS RANKINGS TABLE */}
        {activeTab === 'clubs' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  {rankT.tabClubs}
                </h2>
                <p className="text-xs text-slate-400">
                  {isEn
                    ? 'Standings calculated across all official tournaments in current & past seasons.'
                    : 'Bảng tổng sắp xếp hạng theo điểm thành tích tích lũy của các CLB tham dự giải.'}
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {isEn ? 'Updated Season 2026' : 'Cập nhật mùa giải 2026'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 w-16 text-center">#</th>
                    <th className="py-3.5 px-4">{rankT.clubColumn}</th>
                    <th className="py-3.5 px-4 text-center">{rankT.tournamentsPlayed}</th>
                    <th className="py-3.5 px-4 text-center text-amber-400 font-bold">{rankT.gold}</th>
                    <th className="py-3.5 px-4 text-center text-slate-300">{rankT.silver}</th>
                    <th className="py-3.5 px-4 text-center text-orange-400">{rankT.bronze}</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right font-bold text-cyan-400">{rankT.totalPoints}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {clubRankings.map((club) => {
                    const isTop1 = club.rank === 1;
                    const isTop2 = club.rank === 2;
                    const isTop3 = club.rank === 3;

                    return (
                      <tr
                        key={club.rank}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          isTop1 ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-4 px-4 sm:px-6 text-center font-bold">
                          {isTop1 ? (
                            <span className="text-base">🥇</span>
                          ) : isTop2 ? (
                            <span className="text-base">🥈</span>
                          ) : isTop3 ? (
                            <span className="text-base">🥉</span>
                          ) : (
                            <span className="text-slate-400 font-mono">{club.rank}</span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{isEn ? club.nameEn : club.nameVi}</span>
                            {isTop1 && (
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {isEn ? 'Defending Champ' : 'Đương Kim Vô Địch'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center text-slate-300 font-mono">
                          {club.tournamentsCount}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-amber-400">
                          {club.goldMedals}
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-slate-300">
                          {club.silverMedals}
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-orange-400">
                          {club.bronzeMedals}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right font-mono font-extrabold text-sm sm:text-base text-cyan-400">
                          {club.totalPoints} <span className="text-xs font-normal text-slate-400">{isEn ? 'pts' : 'đ'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ATHLETES RANKINGS TABLE */}
        {activeTab === 'athletes' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  {rankT.tabAthletes}
                </h2>
                <p className="text-xs text-slate-400">
                  {isEn
                    ? 'Individual player statistics, win percentages, and medal achievements.'
                    : 'Hồ sơ cá nhân VĐV, tỷ lệ thắng trận và tổng số huy chương đạt được qua các giải đấu.'}
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {isEn ? 'Top Rated Players' : 'VĐV Tiêu Biểu'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 w-16 text-center">#</th>
                    <th className="py-3.5 px-4">{rankT.athleteColumn}</th>
                    <th className="py-3.5 px-4">{rankT.clubColumn}</th>
                    <th className="py-3.5 px-4 text-center">{rankT.tournamentsPlayed}</th>
                    <th className="py-3.5 px-4 text-center">{rankT.matchesRecord}</th>
                    <th className="py-3.5 px-4 text-center">{rankT.winRate}</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right font-bold text-amber-400">{rankT.medalsColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {athleteRankings.map((ath) => {
                    const isTop1 = ath.rank === 1;
                    const isTop2 = ath.rank === 2;
                    const isTop3 = ath.rank === 3;

                    return (
                      <tr
                        key={ath.rank}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          isTop1 ? 'bg-cyan-500/5' : ''
                        }`}
                      >
                        <td className="py-4 px-4 sm:px-6 text-center font-bold">
                          {isTop1 ? (
                            <span className="text-base">🥇</span>
                          ) : isTop2 ? (
                            <span className="text-base">🥈</span>
                          ) : isTop3 ? (
                            <span className="text-base">🥉</span>
                          ) : (
                            <span className="text-slate-400 font-mono">{ath.rank}</span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{ath.name}</span>
                            {isTop1 && (
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                MVP
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-300">
                          {isEn ? ath.clubEn : ath.clubVi}
                        </td>

                        <td className="py-4 px-4 text-center text-slate-300 font-mono">
                          {ath.tournamentsCount}
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-slate-200">
                          <span className="text-emerald-400 font-bold">{ath.matchesWon}</span>
                          <span className="text-slate-500"> / {ath.matchesPlayed}</span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full"
                                style={{ width: `${ath.winRate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-cyan-300">
                              {ath.winRate}%
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right font-mono text-xs sm:text-sm">
                          <span className="text-amber-400 font-bold">{ath.goldMedals}🥇</span>
                          <span className="text-slate-400 ml-1.5">{ath.silverMedals}🥈</span>
                          <span className="text-orange-400 ml-1.5">{ath.bronzeMedals}🥉</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
