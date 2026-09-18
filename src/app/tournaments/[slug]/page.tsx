'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Trophy,
  Calendar,
  MapPin,
  FileText,
  Download,
  CheckCircle2,
  Radio,
  Users,
  Award,
  ArrowLeft,
  Clock,
  PhoneCall,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Medal,
  Pencil,
  QrCode,
  Search,
  UserPlus,
  Shield,
  X,
  Filter,
  Shuffle,
  Plus,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MOCK_TOURNAMENTS, MockTournament } from '@/data/mockTournaments';
import { getTournamentBySlug } from '@/lib/services/tournamentService';
import { getMatchById, subscribeToTournamentMatches } from '@/lib/services/scoringService';
import {
  getTournamentRegistrations,
  seedDemoAthletesForTournament,
  addManualAthlete,
  TournamentRegistration,
} from '@/lib/services/registrationService';
import { GroupStandingsTable } from '@/components/GroupStandingsTable';
import { BestRunnerUpsTable } from '@/components/BestRunnerUpsTable';
import { calculateGroupStandings, snakeSeedGroups, EngineEntry, GroupStanding, getNextPowerOf2 } from '@/engine';

export default function TournamentDetailPage() {
  const { t, locale } = useLanguage();
  const detailT = t.tournamentDetail;
  const hubT = t.tournamentHub;
  const isEn = locale === 'en';

  const params = useParams();
  const slug = params?.slug as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'athletes' | 'bracket' | 'podium'>('overview');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [tournament, setTournament] = useState<MockTournament | undefined>(() =>
    MOCK_TOURNAMENTS.find((item) => item.slug === slug)
  );

  // Athletes / Registrations state
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [searchAthleteQuery, setSearchAthleteQuery] = useState<string>('');
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualAthleteName, setManualAthleteName] = useState('');
  const [manualPartnerName, setManualPartnerName] = useState('');
  const [manualClub, setManualClub] = useState('');
  const [manualEventId, setManualEventId] = useState('');

  // Bracket & Standings tab state
  const [selectedBracketEventId, setSelectedBracketEventId] = useState<string>('');
  const [bracketViewTab, setBracketViewTab] = useState<'standings' | 'knockout'>('standings');

  useEffect(() => {
    getTournamentBySlug(slug).then((found) => {
      if (found) {
        setTournament(found);
      }
    });
  }, [slug]);

  // Load real registered athletes
  useEffect(() => {
    if (!slug) return;
    getTournamentRegistrations(slug).then((regs) => {
      setRegistrations(regs);
    });
  }, [slug, tournament?.id]);

  const handleSeedDemoAthletes = async () => {
    if (!tournament) return;
    setIsSeedingDemo(true);
    const firstEvent = tournament.events[0];
    const seeded = await seedDemoAthletesForTournament(
      tournament.slug,
      tournament.id,
      firstEvent ? firstEvent.id : 'e-1',
      firstEvent ? (isEn ? firstEvent.nameEn : firstEvent.nameVi) : 'Đôi Nam Phong Trào'
    );
    setRegistrations(seeded);
    setIsSeedingDemo(false);
  };

  const handleAddManualAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !manualAthleteName.trim()) return;
    const evt = tournament.events.find((ev) => ev.id === manualEventId) || tournament.events[0];
    const newReg = await addManualAthlete({
      tournamentId: tournament.id,
      tournamentSlug: tournament.slug,
      eventId: evt ? evt.id : 'e-1',
      eventName: evt ? (isEn ? evt.nameEn : evt.nameVi) : 'Nội Dung Thi Đấu',
      athleteName: manualAthleteName.trim(),
      partnerName: manualPartnerName.trim() || undefined,
      club: manualClub.trim() || 'Tự do',
    });
    setRegistrations((prev) => [newReg, ...prev]);
    setShowAddManualModal(false);
    setManualAthleteName('');
    setManualPartnerName('');
    setManualClub('');
  };

  useEffect(() => {
    if (!tournament) return;

    if (tournament.id === '20000000-0000-0000-0000-000000000001') {
      getMatchById('50000000-0000-0000-0000-000000000001').then((match) => {
        if (match) {
          setTournament((prev) => {
            if (!prev || !prev.liveMatches) return prev;
            const updated = prev.liveMatches.map((m) =>
              m.court === (match.court_number || 1)
                ? {
                    ...m,
                    currentSet: Math.min(3, (match.sets_a || 0) + (match.sets_b || 0) + 1),
                    setsA: match.sets_a ?? m.setsA,
                    setsB: match.sets_b ?? m.setsB,
                    currentScoreA: match.points_a ?? m.currentScoreA,
                    currentScoreB: match.points_b ?? m.currentScoreB,
                  }
                : m
            );
            return { ...prev, liveMatches: updated };
          });
        }
      });

      const unsubscribe = subscribeToTournamentMatches(tournament.id, (updatedMatch) => {
        if (!updatedMatch) return;
        setTournament((prev) => {
          if (!prev || !prev.liveMatches) return prev;
          const updated = prev.liveMatches.map((m) =>
            m.court === (updatedMatch.court_number || 1)
              ? {
                  ...m,
                  currentSet: Math.min(3, (updatedMatch.sets_a || 0) + (updatedMatch.sets_b || 0) + 1),
                  setsA: updatedMatch.sets_a ?? m.setsA,
                  setsB: updatedMatch.sets_b ?? m.setsB,
                  currentScoreA: updatedMatch.points_a ?? m.currentScoreA,
                  currentScoreB: updatedMatch.points_b ?? m.currentScoreB,
                }
              : m
          );
          return { ...prev, liveMatches: updated };
        });
      });

      return () => unsubscribe();
    }
  }, [tournament?.id]);

  if (!tournament) {
    return (
      <main className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isEn ? 'Tournament Not Found' : 'Không Tìm Thấy Giải Đấu'}
          </h1>
          <p className="text-sm text-slate-400">
            {isEn
              ? 'The tournament you are looking for does not exist or has been removed from the platform.'
              : 'Giải đấu bạn đang tìm kiếm không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {detailT.backToHub}
          </Link>
        </div>
      </main>
    );
  }

  const isLive = tournament.status === 'in_progress';
  const isUpcoming = tournament.status === 'registration_open';
  const isCompleted = tournament.status === 'completed' || tournament.status === 'archived';

  const handleDownloadPdf = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

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
            {detailT.backToHub}
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {isUpcoming && (
              <Link
                href={`/tournaments/${tournament.slug}/register`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" />
                {isEn ? 'Register Now' : 'Đăng Ký Thi Đấu'}
              </Link>
            )}
            <Link
              href={`/admin/tournaments/create?edit=${tournament.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/60 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              {isEn ? 'Edit Tournament' : 'Chỉnh Sửa Giải'}
            </Link>
            <Link
              href="/rankings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              <Medal className="w-3.5 h-3.5 text-amber-400" />
              {hubT.viewFullRankings}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Tournament Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Top Status & Prize Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  LIVE COURT
                </span>
              )}
              {isUpcoming && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {hubT.tabUpcoming}
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5" />
                  {hubT.tabCompleted}
                </span>
              )}

              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {detailT.organizer} {isEn ? tournament.organizerEn : tournament.organizerVi}
              </span>
            </div>

            {tournament.totalPrizePool > 0 ? (
              <div className="text-sm font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-xl">
                {hubT.prizePool} {tournament.totalPrizePool.toLocaleString(isEn ? 'en-US' : 'vi-VN')} VND
              </div>
            ) : (
              <div className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {isEn ? 'Trophy & Medal Honors' : 'Cúp & Huy Chương Danh Dự'}
              </div>
            )}
          </div>

          {/* Tournament Title & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {isEn ? tournament.nameEn : tournament.nameVi}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              {isEn ? tournament.descriptionEn : tournament.descriptionVi}
            </p>
          </div>

          {/* Key Facts Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">{hubT.datesLabel}</div>
                <div className="text-xs sm:text-sm font-semibold text-white">
                  {tournament.startDate} ~ {tournament.endDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">{hubT.venueLabel}</div>
                <div className="text-xs sm:text-sm font-semibold text-white truncate">
                  {isEn ? tournament.venueEn : tournament.venueVi}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                  {isEn ? 'Standard' : 'Tiêu Chuẩn'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">
                  BWF Regulation 2026
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            {detailT.tabOverview}
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {detailT.tabEvents}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
              {tournament.events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('athletes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'athletes'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isEn ? 'Athletes Roster' : 'Danh Sách VĐV'}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-emerald-300 font-mono font-bold">
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            {detailT.tabBracket}
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('podium')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'podium'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            {detailT.tabPodium}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & REGULATIONS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Regulations Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    {detailT.regulationsTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isEn
                      ? 'Approved by the Tournament Organizing Committee in accordance with BWF competition standards.'
                      : 'Được phê duyệt bởi Ban Tổ Chức giải theo quy chuẩn điều lệ thi đấu Liên đoàn Cầu lông.'}
                  </p>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  {detailT.downloadPdf}
                </button>
              </div>

              {downloadSuccess && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isEn
                      ? 'Official tournament regulations PDF has been generated and queued for download!'
                      : 'File điều lệ chính thức (.PDF) đã được khởi tạo và sẵn sàng tải về máy!'}
                  </span>
                </div>
              )}

              {/* Regulations list */}
              <div className="space-y-3">
                {(isEn ? tournament.regulationsEn : tournament.regulationsVi).map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Structure & Rewards */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
              <div className="space-y-1 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {detailT.prizeStructureTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {tournament.totalPrizePool > 0
                    ? isEn
                      ? `Total prize purse: ${tournament.totalPrizePool.toLocaleString('en-US')} VND distributed among medalists.`
                      : `Tổng quỹ giải thưởng: ${tournament.totalPrizePool.toLocaleString('vi-VN')} VND trao thưởng cho các thứ hạng xuất sắc.`
                    : isEn
                    ? 'Medals, trophies, and tournament memorabilia awarded to top ranking teams.'
                    : 'Cơ cấu cúp, huy chương và quà tặng kỷ niệm trao cho các đội đạt thành tích xuất sắc.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tournament.prizeStructure.map((prize, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
                      idx === 0
                        ? 'bg-amber-500/5 border-amber-500/30 text-amber-300'
                        : idx === 1
                        ? 'bg-slate-800/40 border-slate-700 text-slate-200'
                        : 'bg-orange-500/5 border-orange-500/20 text-orange-300'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {isEn ? prize.titleEn : prize.titleVi}
                    </div>
                    <div className="text-sm font-semibold text-white leading-relaxed">
                      {isEn ? prize.rewardEn : prize.rewardVi}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue & Organizer Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Venue Map info */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {detailT.venueAndMapTitle}
                </h3>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <div className="font-bold text-white">
                    {isEn ? tournament.venueEn : tournament.venueVi}
                  </div>
                  <div className="text-slate-400">
                    {isEn ? tournament.addressEn : tournament.addressVi}
                  </div>
                  <div className="pt-2 text-xs text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isEn
                      ? `Equipped with ${tournament.courtsCount || 4} BWF taraflex tournament courts, professional LED lighting.`
                      : `Trang bị ${tournament.courtsCount || 4} thảm thi đấu chuẩn BWF, đèn chiếu sáng chuyên dụng.`}
                  </div>
                </div>
              </div>

              {/* BTC Hotline */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  {detailT.contactBtc}
                </h3>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs sm:text-sm">
                  <div className="text-slate-300">
                    {detailT.hotline}
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {tournament.contactPhone || (isEn ? 'Direct Hotline on Check-in' : 'Tiếp nhận trực tiếp tại Bàn Thư Ký')}
                  </div>
                  {tournament.contactEmail && (
                    <div className="text-xs text-slate-400">
                      Email: <span className="text-slate-200">{tournament.contactEmail}</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    {isEn
                      ? 'Inquiries and technical complaints accepted up to 15 minutes post-match.'
                      : 'Tiếp nhận khiếu nại chuyên môn và xác minh tư cách VĐV trong vòng 15 phút sau trận.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVENTS & REGISTRATION QUOTA */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {detailT.tabEvents}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEn
                    ? 'Registration quotas are updated in real-time. Slots are allocated on a first-come, first-served verified basis.'
                    : 'Số lượng đăng ký được cập nhật theo thời gian thực. Suất đấu ưu tiên theo thứ tự hoàn tất hồ sơ.'}
                </p>
              </div>

              {isUpcoming && (
                <Link
                  href={`/tournaments/${slug}/register`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-xs shadow-md shadow-cyan-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {hubT.registerNow}
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournament.events.map((evt) => {
                const isFull = evt.currentEntries >= evt.maxEntries;
                const progressPct = Math.min(100, Math.round((evt.currentEntries / evt.maxEntries) * 100));

                return (
                  <div
                    key={evt.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {evt.eventType.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {detailT.eventFee(evt.entryFee)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">
                          {isEn ? evt.nameEn : evt.nameVi}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {detailT.eventSlots(evt.currentEntries, evt.maxEntries)}
                        </p>
                      </div>

                      {/* Cơ cấu giải thưởng riêng của nội dung (nếu có) */}
                      {evt.prizeStructure && evt.prizeStructure.length > 0 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
                          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            {isEn ? 'Custom Event Prizes' : 'Cơ Cấu Giải Thưởng Nội Dung'}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {evt.prizeStructure.map((pz, idx) => (
                              <div key={idx} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {isEn ? pz.titleEn : pz.titleVi}
                                </div>
                                <div className="text-xs font-bold text-amber-200 truncate">
                                  {isEn ? pz.rewardEn : pz.rewardVi}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quota Progress */}
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isFull
                                ? 'bg-rose-500'
                                : progressPct > 75
                                ? 'bg-amber-400'
                                : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{progressPct}% {isEn ? 'filled' : 'đã đăng ký'}</span>
                          <span>
                            {isFull
                              ? isEn
                                ? 'Full'
                                : 'Hết suất'
                              : `${evt.maxEntries - evt.currentEntries} ${isEn ? 'slots remaining' : 'suất còn lại'}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      {isUpcoming ? (
                        isFull ? (
                          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {detailT.slotsFull}
                          </span>
                        ) : (
                          <Link
                            href={`/tournaments/${slug}/register?event=${evt.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
                          >
                            {detailT.registerForEvent}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          {isLive
                            ? isEn
                              ? 'Competition in progress'
                              : 'Đang diễn ra thi đấu'
                            : isEn
                            ? 'Tournament concluded'
                            : 'Giải đã bế mạc'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ATHLETES ROSTER */}
        {activeTab === 'athletes' && (
          <div className="space-y-6">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  {isEn ? 'Registered Athletes & Teams' : 'Danh Sách Vận Động Viên & Đội Đấu'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn
                    ? 'Official entry list verified by the Organizing Committee. Ready for seeding and technical draw.'
                    : 'Danh sách đăng ký chính thức được Ban Tổ Chức tiếp nhận và chuẩn bị cho phiên bốc thăm chuyên môn.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isUpcoming && (
                  <Link
                    href={`/tournaments/${slug}/register`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-xs shadow-md shadow-cyan-500/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isEn ? 'Register Team' : 'Đăng Ký Đội Mới'}
                  </Link>
                )}

                <button
                  onClick={() => setShowAddManualModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all text-xs border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  {isEn ? 'Add Manually' : 'Thêm VĐV Thủ Công'}
                </button>

                <Link
                  href={`/prototypes/organizer-draw?tournament=${slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all text-xs shadow-md shadow-amber-500/20"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  {isEn ? 'Technical Draw' : 'Bốc Thăm & Chia Bảng'}
                </Link>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchAthleteQuery}
                  onChange={(e) => setSearchAthleteQuery(e.target.value)}
                  placeholder={isEn ? 'Search by athlete, partner, club, or reg code...' : 'Tìm kiếm theo tên VĐV, đồng đội, CLB, hoặc mã đối soát...'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
                {searchAthleteQuery && (
                  <button
                    onClick={() => setSearchAthleteQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="sm:col-span-5 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                >
                  <option value="all">
                    {isEn ? 'All Events' : 'Tất cả nội dung'} ({registrations.length})
                  </option>
                  {tournament.events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {isEn ? ev.nameEn : ev.nameVi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Athlete List Grid */}
            {(() => {
              const filteredAthletes = registrations.filter((reg) => {
                const matchEvent = selectedEventFilter === 'all' || reg.eventId === selectedEventFilter;
                const q = searchAthleteQuery.toLowerCase().trim();
                const matchSearch =
                  !q ||
                  reg.athleteName.toLowerCase().includes(q) ||
                  (reg.partnerName && reg.partnerName.toLowerCase().includes(q)) ||
                  reg.teamName.toLowerCase().includes(q) ||
                  reg.club.toLowerCase().includes(q) ||
                  reg.reconciliationCode.toLowerCase().includes(q);
                return matchEvent && matchSearch;
              });

              if (filteredAthletes.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {isEn ? 'No athletes found matching criteria' : 'Chưa có VĐV nào phù hợp với bộ lọc'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {isEn
                          ? 'You can seed 8 sample athletes to test technical draw, or register a new team directly.'
                          : 'Bạn có thể nạp nhanh 8 VĐV mẫu để thử nghiệm quy trình bốc thăm, hoặc tạo mới VĐV thủ công.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleSeedDemoAthletes}
                        disabled={isSeedingDemo}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold text-xs transition-all flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isSeedingDemo
                          ? (isEn ? 'Seeding...' : 'Đang nạp...')
                          : (isEn ? 'Seed 8 Demo Athletes' : 'Nạp Nhanh 8 VĐV Mẫu')}
                      </button>
                      <button
                        onClick={() => setShowAddManualModal(true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
                      >
                        {isEn ? 'Add Athlete Manually' : 'Thêm VĐV Thủ Công'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredAthletes.map((ath, idx) => (
                    <div
                      key={ath.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                              <span>{ath.teamName}</span>
                              {ath.seed && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Hạt giống #{ath.seed}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-slate-300 font-medium">🏸 {ath.club}</span>
                              {ath.eventName && (
                                <span className="text-[11px] text-slate-500">| {ath.eventName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          {ath.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              {isEn ? 'Confirmed' : 'Đã duyệt'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              {isEn ? 'Pending Check' : 'Chờ đối soát'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{ath.reconciliationCode}</span>
                        </div>
                        {ath.paymentAmount > 0 && (
                          <div className="text-slate-300 font-semibold">
                            {ath.paymentAmount.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: BRACKET & MATCHES */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-400" />
                  {detailT.tabBracket}
                </h3>
                <p className="text-xs text-slate-400">
                  {isLive
                    ? isEn
                      ? 'Live court match feeds synchronized in real time with the umpire devices on court.'
                      : 'Tỷ số sân đấu được đồng bộ thời gian thực theo từng điểm số của trọng tài sân.'
                    : isCompleted
                    ? isEn
                      ? 'Official tournament match outcomes permanently recorded and frozen.'
                      : 'Kết quả các trận đấu chính thức đã được chốt và lưu trữ vĩnh viễn.'
                    : isEn
                    ? 'Public draw will be generated automatically upon registration deadline.'
                    : 'Lễ bốc thăm phân nhánh sẽ diễn ra tự động ngay sau khi chốt sổ đăng ký.'}
                </p>
              </div>

              {isLive && (
                <Link
                  href="/prototypes/umpire-scoring"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-400 transition-all text-xs shadow-md shadow-rose-500/20 self-start sm:self-auto"
                >
                  <Radio className="w-3.5 h-3.5" />
                  {hubT.watchLiveScore}
                </Link>
              )}
            </div>

            {/* In Progress Live Matches Cards */}
            {isLive && tournament.liveMatches && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tournament.liveMatches.map((match, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-rose-950/70 bg-slate-900/90 p-4 space-y-3 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 font-bold text-rose-400">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        {isEn ? `Court ${match.court}` : `Sân ${match.court}`}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {isEn ? match.roundEn : match.roundVi}
                      </span>
                    </div>

                    <div className="text-xs text-cyan-300 font-semibold">
                      {isEn ? match.eventEn : match.eventVi}
                    </div>

                    {/* Team A vs Team B */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-white truncate">{match.teamA}</div>
                          <div className="text-[10px] text-slate-400">{match.clubA}</div>
                        </div>
                        <div className="text-lg font-mono font-bold text-cyan-400">{match.currentScoreA}</div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-white truncate">{match.teamB}</div>
                          <div className="text-[10px] text-slate-400">{match.clubB}</div>
                        </div>
                        <div className="text-lg font-mono font-bold text-amber-400">{match.currentScoreB}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Set {match.currentSet}</span>
                      <span className="font-mono">
                        {isEn ? 'Games' : 'Tỷ số hiệp'}: {match.setsA} - {match.setsB}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* GROUP STANDINGS & KNOCKOUT BRACKET SECTION */}
            {tournament && (
              <div className="space-y-6 pt-4 border-t border-slate-800">
                {/* Event Selector & View Mode Switcher */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-semibold">{isEn ? 'Event' : 'Nội Dung'}:</span>
                    <select
                      value={selectedBracketEventId || tournament.events[0]?.id || ''}
                      onChange={(e) => setSelectedBracketEventId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-semibold outline-none focus:border-cyan-500"
                    >
                      {tournament.events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {isEn ? ev.nameEn : ev.nameVi} ({ev.format === 'knockout' ? 'Knockout' : `${ev.groupCount || 4} Bảng`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setBracketViewTab('standings')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          bracketViewTab === 'standings'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Bảng Xếp Hạng & Điểm Số
                      </button>
                      <button
                        type="button"
                        onClick={() => setBracketViewTab('knockout')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          bracketViewTab === 'knockout'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Cây Nhánh Knockout
                      </button>
                    </div>

                    <Link
                      href={`/prototypes/organizer-draw?tournament=${slug}&event=${selectedBracketEventId || tournament.events[0]?.id || ''}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Score Match' : 'Ghi Điểm & Bốc Thăm'}</span>
                    </Link>
                  </div>
                </div>

                {/* Sub-view 1: Standings */}
                {bracketViewTab === 'standings' && (() => {
                  const currEvt =
                    tournament.events.find((e) => e.id === selectedBracketEventId) ||
                    tournament.events[0];

                  const gCount = currEvt?.groupCount || 4;
                  const advRule = currEvt?.advancementRule || 'best_runner_ups';
                  const targetSize = getNextPowerOf2(gCount);
                  const runnerUpsNeeded = Math.max(0, targetSize - gCount);

                  // Sample / photo-matched group standings
                  const samplePhotoStandings: GroupStanding[] = [
                    {
                      entryId: 'p-1',
                      entryName: 'VIỆT ANH - MINH KHANG',
                      matchesPlayed: 4,
                      matchesWon: 4,
                      matchesLost: 0,
                      gamesWon: 4,
                      gamesLost: 0,
                      gameDifference: 4,
                      pointsWon: 84,
                      pointsLost: 60,
                      pointDifference: 24,
                      rank: 1,
                    },
                    {
                      entryId: 'p-2',
                      entryName: 'HÙNG - TRUNG',
                      matchesPlayed: 4,
                      matchesWon: 3,
                      matchesLost: 1,
                      gamesWon: 3,
                      gamesLost: 1,
                      gameDifference: 2,
                      pointsWon: 79,
                      pointsLost: 63,
                      pointDifference: 16,
                      rank: 2,
                    },
                    {
                      entryId: 'p-3',
                      entryName: 'KHANG - PHONG',
                      matchesPlayed: 4,
                      matchesWon: 2,
                      matchesLost: 2,
                      gamesWon: 2,
                      gamesLost: 2,
                      gameDifference: 0,
                      pointsWon: 74,
                      pointsLost: 64,
                      pointDifference: 10,
                      rank: 3,
                    },
                    {
                      entryId: 'p-4',
                      entryName: 'TÀI - ÂN',
                      matchesPlayed: 4,
                      matchesWon: 1,
                      matchesLost: 3,
                      gamesWon: 1,
                      gamesLost: 3,
                      gameDifference: -2,
                      pointsWon: 55,
                      pointsLost: 82,
                      pointDifference: -27,
                      rank: 4,
                    },
                    {
                      entryId: 'p-5',
                      entryName: 'PHÁT - X.ANH',
                      matchesPlayed: 4,
                      matchesWon: 0,
                      matchesLost: 4,
                      gamesWon: 0,
                      gamesLost: 4,
                      gameDifference: -4,
                      pointsWon: 61,
                      pointsLost: 84,
                      pointDifference: -23,
                      rank: 5,
                    },
                  ];

                  // Build all group standings
                  const allGroups = Array.from({ length: gCount }).map((_, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    if (idx === 0) {
                      return {
                        groupLetter: letter,
                        groupIdx: idx,
                        name: `BẢNG ${letter}`,
                        standings: samplePhotoStandings,
                      };
                    }
                    const standings: GroupStanding[] = [
                      {
                        entryId: `g${idx}-1`,
                        entryName: `ĐỘI ${letter}1 - ${letter}2`,
                        matchesPlayed: 3,
                        matchesWon: 3,
                        matchesLost: 0,
                        gamesWon: 6,
                        gamesLost: 1,
                        gameDifference: 5,
                        pointsWon: 142,
                        pointsLost: 105,
                        pointDifference: 37,
                        rank: 1,
                      },
                      {
                        entryId: `g${idx}-2`,
                        entryName: `ĐỘI ${letter}3 - ${letter}4`,
                        matchesPlayed: 3,
                        matchesWon: 2,
                        matchesLost: 1,
                        gamesWon: 4,
                        gamesLost: 3,
                        gameDifference: 1,
                        pointsWon: 130,
                        pointsLost: 122,
                        pointDifference: 8 + idx * 2,
                        rank: 2,
                      },
                      {
                        entryId: `g${idx}-3`,
                        entryName: `ĐỘI ${letter}5 - ${letter}6`,
                        matchesPlayed: 3,
                        matchesWon: 1,
                        matchesLost: 2,
                        gamesWon: 3,
                        gamesLost: 4,
                        gameDifference: -1,
                        pointsWon: 115,
                        pointsLost: 135,
                        pointDifference: -20,
                        rank: 3,
                      },
                      {
                        entryId: `g${idx}-4`,
                        entryName: `ĐỘI ${letter}7 - ${letter}8`,
                        matchesPlayed: 3,
                        matchesWon: 0,
                        matchesLost: 3,
                        gamesWon: 1,
                        gamesLost: 6,
                        gameDifference: -5,
                        pointsWon: 98,
                        pointsLost: 143,
                        pointDifference: -45,
                        rank: 4,
                      },
                    ];
                    return {
                      groupLetter: letter,
                      groupIdx: idx,
                      name: `BẢNG ${letter}`,
                      standings,
                    };
                  });

                  return (
                    <div className="space-y-6">
                      {/* Best Runner-ups table if needed */}
                      {(runnerUpsNeeded > 0 || advRule === 'best_runner_ups') && (
                        <BestRunnerUpsTable
                          allGroupStandings={allGroups}
                          qualifyingCount={runnerUpsNeeded > 0 ? runnerUpsNeeded : 1}
                        />
                      )}

                      {/* Group Standings Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {allGroups.map((g) => (
                          <GroupStandingsTable
                            key={g.groupLetter}
                            groupName={g.name}
                            standings={g.standings}
                            advancingPerGroup={2}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-view 2: Knockout Bracket summary */}
                {bracketViewTab === 'knockout' && (
                  <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                    <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">
                        Sơ Đồ Phân Nhánh Knockout Tự Động
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Các đội Nhất và Nhì từ các bảng (hoặc Nhì bảng có thành tích tốt nhất) được tự động phân bổ vào cây nhánh trực tiếp.
                      </p>
                    </div>
                    <Link
                      href={`/prototypes/organizer-draw?tournament=${slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Mở Cây Nhánh Tương Tác Đầy Đủ
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Draw & TV Display Links Banner */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  {isEn ? 'Dynamic Knockout & Arena Scoreboard' : 'Xem Cây Nhánh Đấu & Màn Hình Tivi Nhà Thi Đấu'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xl">
                  {isEn
                    ? 'Explore interactive BWF brackets, snake group seeding, and full-screen stadium court scoreboards.'
                    : 'Khám phá sơ đồ bốc thăm nhánh đấu BWF, chia bảng snake seeding và màn hình tỷ số LED tivi nhà thi đấu.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/scoreboard/court/1"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-500/20"
                >
                  <Radio className="w-3.5 h-3.5" />
                  {isEn ? 'Court 1 TV Display' : 'Màn Hình Tivi Sân 1'}
                </Link>
                <Link
                  href="/prototypes/organizer-draw"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isEn ? 'Draw Engine' : 'Sơ Đồ Bốc Thăm'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PODIUM & MEDALISTS */}
        {activeTab === 'podium' && (
          <div className="space-y-6">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                {detailT.podiumTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {detailT.podiumDesc}
              </p>
            </div>

            {tournament.podium && tournament.podium.length > 0 ? (
              <div className="space-y-6">
                {tournament.podium.map((pod, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-sm sm:text-base font-bold text-cyan-300">
                        {isEn ? pod.eventEn : pod.eventVi}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        BWF Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Gold */}
                      <div className="rounded-xl p-4 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                            {detailT.goldMedal}
                          </span>
                          <span className="text-xl">🥇</span>
                        </div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {pod.gold.team}
                        </div>
                        <div className="text-xs text-amber-300/80">
                          {isEn ? pod.gold.clubEn : pod.gold.clubVi}
                        </div>
                      </div>

                      {/* Silver */}
                      <div className="rounded-xl p-4 bg-slate-900/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            {detailT.silverMedal}
                          </span>
                          <span className="text-xl">🥈</span>
                        </div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {pod.silver.team}
                        </div>
                        <div className="text-xs text-slate-400">
                          {isEn ? pod.silver.clubEn : pod.silver.clubVi}
                        </div>
                      </div>

                      {/* Bronze */}
                      <div className="rounded-xl p-4 bg-orange-500/10 border border-orange-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                            {detailT.bronzeMedal}
                          </span>
                          <span className="text-xl">🥉</span>
                        </div>
                        <div className="text-sm font-bold text-white leading-tight">
                          {pod.bronze.team}
                        </div>
                        <div className="text-xs text-orange-300/80">
                          {isEn ? pod.bronze.clubEn : pod.bronze.clubVi}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">
                  {isEn
                    ? 'Podium Unveiled After Tournament Finals'
                    : 'Bục Vinh Danh Sẽ Công Bố Sau Khi Bế Mạc'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isEn
                    ? 'Official medals and certificates will be presented on the awards podium following the completion of final matches on ' + tournament.endDate + '.'
                    : 'Huy chương và phần thưởng chính thức sẽ được công bố và trao thưởng trên bục vinh danh sau khi các trận Chung kết kết thúc vào ngày ' + tournament.endDate + '.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: Thêm VĐV thủ công */}
        {showAddManualModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  {isEn ? 'Add Athlete / Team Manually' : 'Thêm VĐV / Cặp Đấu Thủ Công'}
                </h3>
                <button
                  onClick={() => setShowAddManualModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddManualAthlete} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {isEn ? 'Event Category' : 'Nội Dung Thi Đấu'}
                  </label>
                  <select
                    value={manualEventId}
                    onChange={(e) => setManualEventId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    {tournament.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {isEn ? ev.nameEn : ev.nameVi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {isEn ? 'Athlete Name (Player 1)' : 'Tên Vận Động Viên 1'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualAthleteName}
                    onChange={(e) => setManualAthleteName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {isEn ? 'Partner Name (Player 2 - If Doubles)' : 'Tên Đồng Đội 2 (Nếu đánh đôi)'}
                  </label>
                  <input
                    type="text"
                    value={manualPartnerName}
                    onChange={(e) => setManualPartnerName(e.target.value)}
                    placeholder="VD: Trần Văn B (để trống nếu đánh đơn)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {isEn ? 'Club / Unit' : 'Câu Lạc Bộ / Đoàn Thể Thao'}
                  </label>
                  <input
                    type="text"
                    value={manualClub}
                    onChange={(e) => setManualClub(e.target.value)}
                    placeholder="VD: CLB Cầu Lông Ba Đình"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddManualModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
                  >
                    {isEn ? 'Cancel' : 'Hủy'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-500/20"
                  >
                    {isEn ? 'Save Athlete' : 'Lưu VĐV'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
