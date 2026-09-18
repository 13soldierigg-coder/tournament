'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Radio,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserMenu } from '@/components/auth/UserMenu';
import {
  CourtInfo,
  QueueMatchItem,
  getCourts,
  getMatchQueue,
  dispatchMatchToCourt,
  startCourtMatch,
  finishCourtMatch,
  resetDispatcherDemo,
  saveCourtsState,
} from '@/lib/services/dispatcherService';
import { LiveClock } from '@/components/court-dispatcher/LiveClock';
import { DispatcherStats, DispatcherMetrics } from '@/components/court-dispatcher/DispatcherStats';
import { CourtCard } from '@/components/court-dispatcher/CourtCard';
import { MatchQueuePanel } from '@/components/court-dispatcher/MatchQueuePanel';
import { DispatchModal } from '@/components/court-dispatcher/DispatchModal';
import { FinishMatchModal } from '@/components/court-dispatcher/FinishMatchModal';

function CourtDispatcherContent() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  // Data state
  const [courts, setCourts] = useState<CourtInfo[]>([]);
  const [queue, setQueue] = useState<QueueMatchItem[]>([]);
  const [activeQueueTab, setActiveQueueTab] = useState<
    'all' | 'ready' | 'active' | 'pending' | 'completed'
  >('ready');

  // Modal states
  const [dispatchTargetCourt, setDispatchTargetCourt] = useState<number | null>(null);
  const [finishingCourt, setFinishingCourt] = useState<CourtInfo | null>(null);
  const [finishSetsA, setFinishSetsA] = useState(2);
  const [finishSetsB, setFinishSetsB] = useState(1);
  const [finishScoreA, setFinishScoreA] = useState(21);
  const [finishScoreB, setFinishScoreB] = useState(18);

  // Load courts & queue
  const reloadData = async () => {
    const loadedCourts = await getCourts();
    const loadedQueue = await getMatchQueue();
    setCourts(loadedCourts);
    setQueue(loadedQueue);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Warmup timer countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCourts((prev) =>
        prev.map((court) => {
          if (court.status === 'warmup' && court.warmupSecondsLeft && court.warmupSecondsLeft > 0) {
            return { ...court, warmupSecondsLeft: court.warmupSecondsLeft - 1 };
          }
          return court;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Summary Metrics
  const metrics: DispatcherMetrics = useMemo(() => {
    const totalCourts = courts.length;
    const inProgressCourts = courts.filter((c) => c.status === 'in_progress').length;
    const warmupCourts = courts.filter((c) => c.status === 'warmup').length;
    const availableCourts = courts.filter((c) => c.status === 'available').length;

    const readyMatches = queue.filter((m) => m.status === 'ready').length;
    const activeMatches = queue.filter((m) => m.status === 'in_progress' || (m.status as string) === 'warmup').length;
    const completedMatches = queue.filter((m) => m.status === 'completed').length;
    const pendingMatches = queue.filter((m) => m.status === 'pending').length;

    return {
      totalCourts,
      inProgressCourts,
      warmupCourts,
      availableCourts,
      readyMatches,
      activeMatches,
      completedMatches,
      pendingMatches,
    };
  }, [courts, queue]);

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    if (activeQueueTab === 'all') return queue;
    if (activeQueueTab === 'ready') return queue.filter((m) => m.status === 'ready');
    if (activeQueueTab === 'active')
      return queue.filter((m) => m.status === 'in_progress' || m.status === 'warmup');
    if (activeQueueTab === 'pending') return queue.filter((m) => m.status === 'pending');
    if (activeQueueTab === 'completed') return queue.filter((m) => m.status === 'completed');
    return queue;
  }, [queue, activeQueueTab]);

  // Dispatch Action
  const handleDispatch = async (courtNumber: number, matchId: string) => {
    await dispatchMatchToCourt(courtNumber, matchId, { startWarmupImmediately: true });
    await reloadData();
    setDispatchTargetCourt(null);
  };

  // Start Match Action
  const handleStartMatch = async (courtNumber: number) => {
    await startCourtMatch(courtNumber);
    await reloadData();
  };

  // Open Finish Modal
  const handleOpenFinishModal = (court: CourtInfo) => {
    setFinishingCourt(court);
    setFinishScoreA(court.currentMatch?.currentScoreA || 21);
    setFinishScoreB(court.currentMatch?.currentScoreB || 18);
    setFinishSetsA(court.currentMatch?.setsA || 2);
    setFinishSetsB(court.currentMatch?.setsB || 1);
  };

  // Finish Match Action
  const handleFinishMatch = async () => {
    if (!finishingCourt) return;
    await finishCourtMatch(finishingCourt.courtNumber, {
      setsA: finishSetsA,
      setsB: finishSetsB,
      scoreA: finishScoreA,
      scoreB: finishScoreB,
    });
    await reloadData();
    setFinishingCourt(null);
  };

  // Full Stadium Simulation Action
  const handleSimulateStadium = async () => {
    const freshCourts: CourtInfo[] = [
      {
        courtNumber: 1,
        courtName: 'Sân 1 (Thảm Yonex)',
        status: 'in_progress',
        currentMatch: {
          id: 'disp-m-1',
          matchNumber: 1,
          courtNumber: 1,
          courtInfo: 'Sân 1',
          round: 1,
          roundName: 'Tứ Kết 1',
          stage: 'knockout',
          teamA: 'Nguyễn Văn A / Lê Hùng',
          teamB: 'Phạm Đức C / Vũ Tuấn',
          clubA: 'CLB Ba Đình',
          clubB: 'CLB Hoàn Kiếm',
          currentScoreA: 20,
          currentScoreB: 19,
          setsA: 1,
          setsB: 1,
          status: 'in_progress',
          version: 5,
        },
        matchStartedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        umpireName: 'Trần Văn Quyết',
        serviceJudgeName: 'Lê Thu Trang',
        nextMatch: {
          id: 'disp-m-4',
          matchNumber: 4,
          courtNumber: 0,
          courtInfo: 'Chưa xếp',
          round: 1,
          roundName: 'Tứ Kết 3',
          stage: 'knockout',
          teamA: 'Lý Quốc Bảo / Ngô Thành',
          teamB: 'Đặng Đình Toàn / Bùi Đức',
          clubA: 'CLB Đống Đa',
          clubB: 'CLB Hai Bà Trưng',
          currentScoreA: 0,
          currentScoreB: 0,
          setsA: 0,
          setsB: 0,
          status: 'ready',
          version: 1,
        },
      },
      {
        courtNumber: 2,
        courtName: 'Sân 2 (Thảm Victor)',
        status: 'warmup',
        currentMatch: {
          id: 'disp-m-2',
          matchNumber: 2,
          courtNumber: 2,
          courtInfo: 'Sân 2',
          round: 1,
          roundName: 'Tứ Kết 2',
          stage: 'knockout',
          teamA: 'Trần Thị B / Mai Lan',
          teamB: 'Hoàng Minh D / Đỗ Hải',
          clubA: 'CLB Cầu Giấy',
          clubB: 'CLB Thăng Long',
          currentScoreA: 0,
          currentScoreB: 0,
          setsA: 0,
          setsB: 0,
          status: 'warmup',
          version: 1,
        },
        warmupSecondsLeft: 95,
        matchStartedAt: null,
        umpireName: 'Hoàng Đình Khoa',
        nextMatch: {
          id: 'disp-m-5',
          matchNumber: 5,
          courtNumber: 0,
          courtInfo: 'Chưa xếp',
          round: 1,
          roundName: 'Tứ Kết 4',
          stage: 'knockout',
          teamA: 'Lương Thế Vinh / Phan Anh',
          teamB: 'Vũ Trọng Phụng / Nam Cao',
          clubA: 'CLB Thanh Xuân',
          clubB: 'CLB Tây Hồ',
          currentScoreA: 0,
          currentScoreB: 0,
          setsA: 0,
          setsB: 0,
          status: 'ready',
          version: 1,
        },
      },
      {
        courtNumber: 3,
        courtName: 'Sân 3 (Thảm Li-Ning)',
        status: 'in_progress',
        currentMatch: {
          id: 'disp-m-3',
          matchNumber: 3,
          courtNumber: 3,
          courtInfo: 'Sân 3',
          round: 1,
          roundName: 'Vòng Bảng - Bảng A',
          stage: 'group',
          teamA: 'VIỆT ANH - MINH KHANG',
          teamB: 'HÙNG - TRUNG',
          clubA: 'CLB Ba Đình',
          clubB: 'CLB Cầu Giấy',
          currentScoreA: 18,
          currentScoreB: 15,
          setsA: 1,
          setsB: 0,
          status: 'in_progress',
          version: 3,
        },
        matchStartedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        umpireName: 'Phạm Minh Tuấn',
      },
      {
        courtNumber: 4,
        courtName: 'Sân 4 (Thảm Lining)',
        status: 'available',
        currentMatch: null,
        matchStartedAt: null,
        umpireName: 'Vũ Đức Thịnh',
      },
    ];

    saveCourtsState(freshCourts);
    setCourts(freshCourts);
  };

  const handleReset = () => {
    resetDispatcherDemo();
    reloadData();
  };

  const availableCourts = useMemo(
    () => courts.filter((c) => c.status === 'available'),
    [courts]
  );

  const readyMatches = useMemo(
    () => queue.filter((m) => m.status === 'ready'),
    [queue]
  );

  return (
    <ProtectedRoute
      allowedRoles={['organizer', 'referee', 'admin']}
      requiredPermissionName="Bàn Điều Phối Sân & Vận Hành"
    >
      <div className="min-h-screen bg-[#06080e] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TOP HEADER */}
        <header className="rounded-2xl border border-slate-800 bg-[#0d131f]/90 backdrop-blur p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tournaments"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  {isEn
                    ? 'Court Dispatcher & Stadium Operations'
                    : 'Bàn Điều Phối Sân Đấu & Vận Hành Nhà Thi Đấu'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEn
                  ? 'Central control tower for court allocation, match queueing, and umpire dispatching.'
                  : 'Trung tâm chỉ huy điều phối trận đấu lên sân, quản lý hàng đợi và thời gian nghỉ ngơi của VĐV.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Digital Clock */}
            <LiveClock />

            {/* Quick Stadium Simulation */}
            <button
              type="button"
              onClick={handleSimulateStadium}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ {isEn ? 'Simulate Stadium Activity' : 'Mô Phỏng Nhà Thi Đấu'}</span>
            </button>

            {/* Reset button */}
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
            </button>

            <UserMenu />
            <LanguageSwitcher />
          </div>
        </header>

        {/* SUMMARY KPI METRICS BAR */}
        <DispatcherStats metrics={metrics} />

        {/* SECTION 1: COURT GRID */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                {isEn ? 'Live Stadium Courts' : 'Trạng Thái Trực Tiếp Các Sân'}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {isEn
                ? 'Click court cards to dispatch, start or finalize matches.'
                : 'Bấm vào từng sân để gọi trận, bắt đầu hoặc chốt kết quả.'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {courts.map((court) => (
              <CourtCard
                key={court.courtNumber}
                court={court}
                onDispatchClick={(courtNumber) => setDispatchTargetCourt(courtNumber)}
                onStartMatch={handleStartMatch}
                onOpenFinishModal={handleOpenFinishModal}
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: SMART MATCH QUEUE */}
        <MatchQueuePanel
          queue={queue}
          filteredQueue={filteredQueue}
          activeQueueTab={activeQueueTab}
          setActiveQueueTab={setActiveQueueTab}
          metrics={metrics}
          availableCourts={availableCourts}
          onDispatch={handleDispatch}
        />

        {/* MODAL 1: CHỌN TRẬN GỌI LÊN SÂN */}
        {dispatchTargetCourt !== null && (
          <DispatchModal
            courtNumber={dispatchTargetCourt}
            readyMatches={readyMatches}
            onClose={() => setDispatchTargetCourt(null)}
            onDispatch={handleDispatch}
          />
        )}

        {/* MODAL 2: CHỐT KẾT QUẢ & GIẢI PHÓNG SÂN */}
        {finishingCourt !== null && (
          <FinishMatchModal
            court={finishingCourt}
            finishSetsA={finishSetsA}
            setFinishSetsA={setFinishSetsA}
            finishSetsB={finishSetsB}
            setFinishSetsB={setFinishSetsB}
            onClose={() => setFinishingCourt(null)}
            onConfirm={handleFinishMatch}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function CourtDispatcherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080e] text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CourtDispatcherContent />
    </Suspense>
  );
}
