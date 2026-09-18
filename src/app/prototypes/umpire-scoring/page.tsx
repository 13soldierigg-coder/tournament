'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  RotateCcw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Radio,
  AlertCircle,
  RefreshCw,
  Clock,
  Play,
  Tv,
  Timer,
  AlertOctagon,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import {
  validateGameScore,
  checkMatchWinner,
  GameScore,
  StageConfig,
  SCORING_PRESETS,
} from '@/engine';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  recordMatchPoint,
  finalizeMatch,
  getMatchById,
  subscribeToMatchScore,
} from '@/lib/services/scoringService';
import {
  getTournamentMatches,
  MatchDisplayItem,
} from '@/lib/services/drawService';
import {
  getCourts,
  updateCourtScore,
  finishCourtMatch,
  startCourtMatch,
  CourtInfo,
} from '@/lib/services/dispatcherService';

const MATCH_ID = '50000000-0000-0000-0000-000000000001';

export interface CardIncident {
  id: string;
  setIndex: number;
  team: 'A' | 'B';
  teamName: string;
  cardType: 'yellow' | 'red' | 'black';
  reason: string;
  timestamp: string;
}

interface PointHistoryItem {
  setIndex: number;
  scoredBy: 'A' | 'B';
  previousScoreA: number;
  previousScoreB: number;
  previousServer: 'A' | 'B';
}

function UmpireScoringContent() {
  const { t, locale } = useLanguage();
  const scoreT = t.scoring;
  const searchParams = useSearchParams();
  const courtParam = searchParams?.get('court');

  const [scoringPreset, setScoringPreset] = useState<
    'bwf_standard_21_30' | 'short_15_21' | 'sudden_death_31'
  >('bwf_standard_21_30');

  const config: StageConfig = React.useMemo(() => {
    return SCORING_PRESETS[scoringPreset];
  }, [scoringPreset]);

  const [matchId, setMatchId] = useState<string>(MATCH_ID);
  const [availableMatches, setAvailableMatches] = useState<MatchDisplayItem[]>([]);
  const [currentMatchMeta, setCurrentMatchMeta] = useState({
    courtNumber: 1,
    matchNumber: 4,
    roundName: 'Chung Kết',
    teamAName: 'Nguyễn Văn A / Lê Hùng',
    teamBName: 'Trần Thị B / Mai Lan',
    clubAName: locale === 'en' ? 'Ba Dinh Club' : 'CLB Ba Đình',
    clubBName: locale === 'en' ? 'Cau Giay Club' : 'CLB Cầu Giấy',
  });

  // Match state
  const [currentSet, setCurrentSet] = useState<number>(3);
  const [setScores, setSetScores] = useState<GameScore[]>([
    { scoreA: 21, scoreB: 19 },
    { scoreA: 18, scoreB: 21 },
    { scoreA: 20, scoreB: 19 },
  ]);
  const [server, setServer] = useState<'A' | 'B'>('A');
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);
  const [matchVersion, setMatchVersion] = useState<number>(4);
  const [serverScoreDisplay, setServerScoreDisplay] = useState<string>('20 - 19');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Ergonomic UI states
  const [isSwappedEnds, setIsSwappedEnds] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Court Dispatcher state
  const [courtInfo, setCourtInfo] = useState<CourtInfo | null>(null);

  // BWF Interval states (11-pt technical interval & 120s set interval)
  const [showIntervalModal, setShowIntervalModal] = useState<boolean>(false);
  const [intervalSecondsLeft, setIntervalSecondsLeft] = useState<number>(60);
  const [intervalType, setIntervalType] = useState<'11_points' | 'between_sets'>('11_points');
  const [intervalsTriggered, setIntervalsTriggered] = useState<Record<number, boolean>>({});

  // BWF Disciplinary Cards system
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [targetTeamForCard, setTargetTeamForCard] = useState<'A' | 'B'>('A');
  const [cardTypeSelected, setCardTypeSelected] = useState<'yellow' | 'red' | 'black'>('yellow');
  const [cardReason, setCardReason] = useState<string>('Trì hoãn trận đấu không hợp lệ');
  const [cardIncidents, setCardIncidents] = useState<CardIncident[]>([]);

  // Dialogs
  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [isMatchFinalized, setIsMatchFinalized] = useState<boolean>(false);

  const teamA = {
    id: 'team-a',
    name: currentMatchMeta.teamAName,
    club: currentMatchMeta.clubAName,
  };
  const teamB = {
    id: 'team-b',
    name: currentMatchMeta.teamBName,
    club: currentMatchMeta.clubBName,
  };

  const currentScore = setScores[currentSet - 1] || { scoreA: 0, scoreB: 0 };

  // Sync with Dispatcher Court status
  const refreshFromDispatcher = async () => {
    if (!courtParam) return;
    try {
      const courts = await getCourts();
      const targetCourt = courts.find((c) => String(c.courtNumber) === courtParam);
      if (targetCourt) {
        setCourtInfo(targetCourt);
        if (targetCourt.currentMatch) {
          const cm = targetCourt.currentMatch;
          setMatchId(cm.id);
          setCurrentMatchMeta({
            courtNumber: targetCourt.courtNumber,
            matchNumber: cm.matchNumber,
            roundName: cm.roundName,
            teamAName: cm.teamA,
            teamBName: cm.teamB,
            clubAName: cm.clubA || '',
            clubBName: cm.clubB || '',
          });
          setSetScores([
            { scoreA: cm.currentScoreA, scoreB: cm.currentScoreB },
            { scoreA: 0, scoreB: 0 },
            { scoreA: 0, scoreB: 0 },
          ]);
          if (cm.status === 'completed') {
            setIsMatchFinalized(true);
          }
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshFromDispatcher();
    window.addEventListener('badminton_court_dispatcher_update', refreshFromDispatcher);
    window.addEventListener('storage', refreshFromDispatcher);
    return () => {
      window.removeEventListener('badminton_court_dispatcher_update', refreshFromDispatcher);
      window.removeEventListener('storage', refreshFromDispatcher);
    };
  }, [courtParam]);

  // Interval countdown tick
  useEffect(() => {
    if (!showIntervalModal || intervalSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setIntervalSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showIntervalModal, intervalSecondsLeft]);

  // Fetch available matches for the tournament
  useEffect(() => {
    getTournamentMatches('20000000-0000-0000-0000-000000000001').then((matches) => {
      if (matches && matches.length > 0) {
        setAvailableMatches(matches);
        if (courtParam && !courtInfo?.currentMatch) {
          const target = matches.find((m) => String(m.courtNumber) === courtParam);
          if (target) {
            setMatchId(target.id);
          }
        }
      }
    });
  }, [courtParam, courtInfo]);

  // Load live match from Supabase & Subscribe to Realtime WebSocket
  useEffect(() => {
    let unsubscribe = () => {};
    async function loadMatch() {
      const match = await getMatchById(matchId);
      if (match) {
        if (typeof match.version === 'number') {
          setMatchVersion(match.version);
        }
        if (match.placeholder_entry1 || match.placeholder_entry2) {
          const courtNum = parseInt(match.court_info?.replace(/\D/g, '') || '1', 10) || 1;
          setCurrentMatchMeta((prev) => ({
            ...prev,
            courtNumber: courtNum,
            matchNumber: match.match_number || prev.matchNumber,
            roundName: match.round_name || prev.roundName,
            teamAName: match.placeholder_entry1 || prev.teamAName,
            teamBName: match.placeholder_entry2 || prev.teamBName,
          }));
        }
        if (match.game_scores && Array.isArray(match.game_scores) && match.game_scores.length > 0) {
          const loadedScores: GameScore[] = [
            match.game_scores[0] || { scoreA: 0, scoreB: 0 },
            match.game_scores[1] || { scoreA: 0, scoreB: 0 },
            match.game_scores[2] || { scoreA: 0, scoreB: 0 },
          ];
          const activeSet = Math.min(3, (match.sets_a || 0) + (match.sets_b || 0) + 1);
          loadedScores[activeSet - 1] = { scoreA: match.points_a ?? 0, scoreB: match.points_b ?? 0 };
          setCurrentSet(activeSet);
          setSetScores(loadedScores);
        }
        if (match.status === 'completed') {
          setIsMatchFinalized(true);
        } else {
          setIsMatchFinalized(false);
        }
      }

      unsubscribe = subscribeToMatchScore(matchId, (updated) => {
        if (!isOffline && updated) {
          if (typeof updated.version === 'number') {
            setMatchVersion(updated.version);
          }
          if (updated.status === 'completed') {
            setIsMatchFinalized(true);
          }
          if (updated.game_scores && Array.isArray(updated.game_scores)) {
            const activeSet = Math.min(3, (updated.sets_a || 0) + (updated.sets_b || 0) + 1);
            const liveScores: GameScore[] = [
              updated.game_scores[0] || { scoreA: 0, scoreB: 0 },
              updated.game_scores[1] || { scoreA: 0, scoreB: 0 },
              updated.game_scores[2] || { scoreA: 0, scoreB: 0 },
            ];
            liveScores[activeSet - 1] = { scoreA: updated.points_a ?? 0, scoreB: updated.points_b ?? 0 };
            setCurrentSet(activeSet);
            setSetScores(liveScores);
          }
        }
      });
    }

    loadMatch();
    return () => unsubscribe();
  }, [matchId, isOffline]);

  // Check match winner across sets
  const matchEvaluation = checkMatchWinner(setScores, config);

  // Ergonomic +1 point action
  const handleAddPoint = (team: 'A' | 'B') => {
    if (isMatchFinalized) return;

    const currentA = currentScore.scoreA;
    const currentB = currentScore.scoreB;
    const nextA = team === 'A' ? currentA + 1 : currentA;
    const nextB = team === 'B' ? currentB + 1 : currentB;

    // Validate score progression with BWF rules
    const validation = validateGameScore(nextA, nextB, config);
    if (!validation.valid) {
      alert(scoreT.invalidScoreAlert(validation.reason));
      return;
    }

    // Check BWF 11-point interval (or 8-point for 15-pt game)
    const intervalPoint = config.pointsPerGame === 15 ? 8 : 11;
    if (
      !intervalsTriggered[currentSet] &&
      (nextA === intervalPoint || nextB === intervalPoint) &&
      Math.max(currentA, currentB) < intervalPoint
    ) {
      setIntervalsTriggered((prev) => ({ ...prev, [currentSet]: true }));
      setIntervalType('11_points');
      setIntervalSecondsLeft(60);
      setShowIntervalModal(true);
    }

    // Record undo history
    setPointHistory((prev) => [
      ...prev,
      {
        setIndex: currentSet,
        scoredBy: team,
        previousScoreA: currentA,
        previousScoreB: currentB,
        previousServer: server,
      },
    ]);

    // Update score locally
    const updated = [...setScores];
    updated[currentSet - 1] = { scoreA: nextA, scoreB: nextB };
    setSetScores(updated);

    // Auto-update server to side that won the point
    setServer(team);

    // Synchronously update Arena Court Dispatcher & TV Scoreboard
    updateCourtScore(currentMatchMeta.courtNumber, nextA, nextB, matchEvaluation.setsA, matchEvaluation.setsB);

    // If offline, queue mutation
    if (isOffline) {
      setOfflineQueueCount((c) => c + 1);
    } else {
      setIsSyncing(true);
      recordMatchPoint({
        matchId: matchId,
        pointToTeam: team.toLowerCase() as 'a' | 'b',
        expectedVersion: matchVersion,
      })
        .then((res) => {
          setIsSyncing(false);
          if (!res.success && res.code === 'VERSION_CONFLICT') {
            setServerScoreDisplay(`${res.pointsA ?? 20} - ${res.pointsB ?? 19}`);
            setShowConflictModal(true);
          } else if (res.version) {
            setMatchVersion(res.version);
          }
        })
        .catch(() => {
          setIsSyncing(false);
        });
    }
  };

  const handleAcceptServerScore = async () => {
    setShowConflictModal(false);
    setIsSyncing(true);
    try {
      const match = await getMatchById(matchId);
      if (match) {
        if (typeof match.version === 'number') {
          setMatchVersion(match.version);
        }
        if (match.game_scores && Array.isArray(match.game_scores)) {
          const activeSet = Math.min(3, (match.sets_a || 0) + (match.sets_b || 0) + 1);
          const liveScores: GameScore[] = [
            match.game_scores[0] || { scoreA: 0, scoreB: 0 },
            match.game_scores[1] || { scoreA: 0, scoreB: 0 },
            match.game_scores[2] || { scoreA: 0, scoreB: 0 },
          ];
          liveScores[activeSet - 1] = { scoreA: match.points_a ?? 0, scoreB: match.points_b ?? 0 };
          setCurrentSet(activeSet);
          setSetScores(liveScores);
        }
        if (match.status === 'completed') {
          setIsMatchFinalized(true);
        }
      }
      setOfflineQueueCount(0);
      setPointHistory([]);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1-Tap Undo
  const handleUndo = () => {
    if (pointHistory.length === 0 || isMatchFinalized) return;

    const last = pointHistory[pointHistory.length - 1];
    setPointHistory((prev) => prev.slice(0, -1));

    const updated = [...setScores];
    updated[last.setIndex - 1] = {
      scoreA: last.previousScoreA,
      scoreB: last.previousScoreB,
    };
    setSetScores(updated);
    setCurrentSet(last.setIndex);
    setServer(last.previousServer);

    // Sync back to dispatcher
    updateCourtScore(
      currentMatchMeta.courtNumber,
      last.previousScoreA,
      last.previousScoreB,
      matchEvaluation.setsA,
      matchEvaluation.setsB
    );

    if (isOffline && offlineQueueCount > 0) {
      setOfflineQueueCount((c) => Math.max(0, c - 1));
    }
  };

  // Next Set transition with 120s BWF interval
  const handleNextSet = () => {
    const validation = validateGameScore(currentScore.scoreA, currentScore.scoreB, config);
    if (!validation.winner) {
      alert(t.badminton.pending);
      return;
    }
    if (currentSet < 3) {
      setCurrentSet((s) => s + 1);
      // Auto-swap ends on new set
      setIsSwappedEnds(!isSwappedEnds);
      // Trigger BWF 120s interval between sets
      setIntervalType('between_sets');
      setIntervalSecondsLeft(120);
      setShowIntervalModal(true);
    }
  };

  // Finalize Match Result & Free court
  const handleOpenFinalizeModal = () => {
    setFinalizeError(null);
    const validation = validateGameScore(currentScore.scoreA, currentScore.scoreB, config);
    if (!validation.winner && matchEvaluation.setsA < 2 && matchEvaluation.setsB < 2) {
      setFinalizeError(scoreT.matchNotFinished);
    }
    setShowFinalizeModal(true);
  };

  const handleConfirmFinalize = async () => {
    setIsMatchFinalized(true);
    setShowFinalizeModal(false);

    // Free court on Dispatcher
    await finishCourtMatch(currentMatchMeta.courtNumber, {
      scoreA: currentScore.scoreA,
      scoreB: currentScore.scoreB,
      setsA: matchEvaluation.setsA,
      setsB: matchEvaluation.setsB,
    });

    if (!isOffline) {
      await finalizeMatch(matchId, teamA.id);
    }
  };

  // Disciplinary Card Actions
  const handleOpenCardModal = (team: 'A' | 'B') => {
    setTargetTeamForCard(team);
    setCardTypeSelected('yellow');
    setCardReason('Trì hoãn trận đấu không hợp lệ');
    setShowCardModal(true);
  };

  const handleConfirmIssueCard = () => {
    const targetTeamName = targetTeamForCard === 'A' ? teamA.name : teamB.name;
    const opponentTeam = targetTeamForCard === 'A' ? 'B' : 'A';

    const incident: CardIncident = {
      id: `card-${Date.now()}`,
      setIndex: currentSet,
      team: targetTeamForCard,
      teamName: targetTeamName,
      cardType: cardTypeSelected,
      reason: cardReason,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setCardIncidents((prev) => [incident, ...prev]);
    setShowCardModal(false);

    // BWF Fault Rule: Red card awards +1 point directly to opponent!
    if (cardTypeSelected === 'red') {
      handleAddPoint(opponentTeam);
    } else if (cardTypeSelected === 'black') {
      // Disqualification: immediately mark match finalized and free court
      setIsMatchFinalized(true);
      finishCourtMatch(currentMatchMeta.courtNumber, {
        scoreA: targetTeamForCard === 'A' ? 0 : 21,
        scoreB: targetTeamForCard === 'B' ? 0 : 21,
        setsA: targetTeamForCard === 'A' ? 0 : 2,
        setsB: targetTeamForCard === 'B' ? 0 : 2,
      });
    }
  };

  // Start match from warmup
  const handleStartMatchFromWarmup = async () => {
    await startCourtMatch(currentMatchMeta.courtNumber);
    setCourtInfo((prev) => (prev ? { ...prev, status: 'in_progress', warmupSecondsLeft: undefined } : null));
  };

  // BWF Service Court Indicator calculation
  const serverScore = server === 'A' ? currentScore.scoreA : currentScore.scoreB;
  const isServerEven = serverScore % 2 === 0;
  const serviceCourtBoxName = isServerEven
    ? (locale === 'vi' ? 'Ô Phải (Điểm chẵn)' : 'Right Box (Even)')
    : (locale === 'vi' ? 'Ô Trái (Điểm lẻ)' : 'Left Box (Odd)');

  // Visual layout mapping (Left Side vs Right Side)
  const leftTeamKey = isSwappedEnds ? 'B' : 'A';
  const rightTeamKey = isSwappedEnds ? 'A' : 'B';

  const leftTeam = leftTeamKey === 'A' ? teamA : teamB;
  const rightTeam = rightTeamKey === 'A' ? teamA : teamB;

  const leftScore = leftTeamKey === 'A' ? currentScore.scoreA : currentScore.scoreB;
  const rightScore = rightTeamKey === 'A' ? currentScore.scoreA : currentScore.scoreB;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Court Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/prototypes"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.common.prototypes}
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {scoreT.courtBadge(currentMatchMeta.courtNumber)}
              </span>
              <select
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-900 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer max-w-[170px] sm:max-w-none"
              >
                {availableMatches.length > 0 ? (
                  availableMatches.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                      {scoreT.courtOption(m.courtNumber, m.roundName)} ({m.teamA.split('/')[0]} vs {m.teamB.split('/')[0]})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="50000000-0000-0000-0000-000000000001">
                      {scoreT.courtOption(1, locale === 'en' ? 'Final' : 'Chung Kết')}
                    </option>
                    <option value="50000000-0000-0000-0000-000000000002">
                      {scoreT.courtOption(2, locale === 'en' ? 'Semi-Final 1' : 'Bán Kết 1')}
                    </option>
                    <option value="50000000-0000-0000-0000-000000000003">
                      {scoreT.courtOption(3, locale === 'en' ? 'Semi-Final 2' : 'Bán Kết 2')}
                    </option>
                  </>
                )}
              </select>

              {/* Scoring Rule Preset Selector */}
              <select
                value={scoringPreset}
                onChange={(e) => setScoringPreset(e.target.value as any)}
                className="text-[11px] font-bold px-2 py-1 rounded-xl bg-slate-900 text-amber-300 border border-slate-700 hover:border-amber-500/40 focus:outline-none transition-all cursor-pointer"
                title="Luật tính điểm trận đấu"
              >
                <option value="bwf_standard_21_30">3x21 (BWF Cap 30)</option>
                <option value="short_15_21">3x15 (Cap 21)</option>
                <option value="sudden_death_31">1x31 (Sudden Death)</option>
              </select>
            </div>
          </div>

          {/* Network, Language, TV link, Scoresheet & Offline Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/scoreboard/court/${currentMatchMeta.courtNumber}`}
              target="_blank"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/40 transition-all shadow-sm"
              title="Mở Bảng Điểm Tivi LED Sân Này"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tivi Sân {currentMatchMeta.courtNumber}</span>
            </Link>

            <Link
              href={`/prototypes/match-scoresheet?matchId=${matchId}&court=${currentMatchMeta.courtNumber}`}
              target="_blank"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-amber-300 hover:bg-slate-800 hover:border-amber-400 transition-all shadow-sm"
              title="Xem & In Biên Bản Trận Đấu BWF"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Biên Bản</span>
            </Link>

            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                isOffline
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  {scoreT.offlineMode(offlineQueueCount)}
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  {scoreT.onlineLive}
                </>
              )}
            </button>

            <button
              onClick={() => setShowConflictModal(true)}
              className="text-[11px] text-slate-400 hover:text-amber-400 underline decoration-dotted hidden sm:inline"
            >
              {scoreT.simulateConflict}
            </button>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Warmup alert banner if court is in warmup */}
      {courtInfo?.status === 'warmup' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span className="font-semibold">
              Sân {currentMatchMeta.courtNumber} đang trong thời gian khởi động (còn{' '}
              {courtInfo.warmupSecondsLeft ?? 120}s). Hai đội đã sẵn sàng thi đấu?
            </span>
          </div>
          <button
            onClick={handleStartMatchFromWarmup}
            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1 shadow-sm shrink-0 ml-2"
          >
            <Play className="w-3 h-3 fill-current" />
            Bắt Đầu Trận Đấu Ngay
          </button>
        </div>
      )}

      {/* Main Layout: Split between Umpire Sheet (Left/Top) and Public Live Score View (Right/Bottom) */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* UMPIRE COURT-SIDE SCORE SHEET (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sets Bar & Ergonomic Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setCurrentSet(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentSet === s
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {scoreT.setLabel(s, setScores[s - 1].scoreA, setScores[s - 1].scoreB)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Swap Ends visual button */}
              <button
                onClick={() => setIsSwappedEnds(!isSwappedEnds)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 active:scale-95 border border-slate-700 transition-all"
                title={scoreT.swapEndsHelp}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{scoreT.swapEnds}</span>
              </button>

              {/* 1-Tap Undo */}
              <button
                disabled={pointHistory.length === 0 || isMatchFinalized}
                onClick={handleUndo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 active:scale-95 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                {scoreT.undoButton}
              </button>
            </div>
          </div>

          {/* Ergonomic Big-Touch Score Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {isSwappedEnds && (
              <div className="text-center">
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                  {scoreT.swappedEndsIndicator}
                </span>
              </div>
            )}

            {/* Teams & Huge +1 Tap Zones */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8 items-center">
              {/* LEFT SIDE (TEAM A OR TEAM B DEPENDING ON SWAP) */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="space-y-1 min-h-[50px] flex flex-col justify-center items-center">
                  {server === leftTeamKey && (
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse">
                        🏸 {scoreT.servingBadge}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        {serviceCourtBoxName}
                      </span>
                    </div>
                  )}

                  <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {leftTeam.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">{leftTeam.club}</p>

                  {/* Card chips */}
                  {cardIncidents.some((c) => c.team === leftTeamKey) && (
                    <div className="flex items-center gap-1 pt-1">
                      {cardIncidents
                        .filter((c) => c.team === leftTeamKey)
                        .map((c) => (
                          <span
                            key={c.id}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                              c.cardType === 'yellow'
                                ? 'bg-amber-400 text-slate-950'
                                : c.cardType === 'red'
                                ? 'bg-rose-500 text-white'
                                : 'bg-black text-white border border-slate-700'
                            }`}
                            title={`${c.cardType.toUpperCase()}: ${c.reason}`}
                          >
                            {c.cardType === 'yellow' ? '🟨 VÀNG' : c.cardType === 'red' ? '🟥 ĐỎ' : '⬛ ĐEN'}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Score Big Display */}
                <div className="text-6xl sm:text-8xl font-black tracking-tight text-white font-mono select-none">
                  {leftScore}
                </div>

                {/* HUGE +1 BUTTON (≥80px touch target) */}
                <button
                  disabled={isMatchFinalized}
                  onClick={() => handleAddPoint(leftTeamKey)}
                  className="w-full max-w-[180px] h-20 sm:h-24 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-3xl sm:text-4xl shadow-xl shadow-cyan-500/20 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  +1
                </button>

                {/* Actions: Assign Server & Disciplinary Card */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setServer(leftTeamKey)}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {scoreT.assignServer}
                  </button>
                  <span className="text-slate-700">•</span>
                  <button
                    onClick={() => handleOpenCardModal(leftTeamKey)}
                    className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Thẻ phạt
                  </button>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="space-y-1 min-h-[50px] flex flex-col justify-center items-center">
                  {server === rightTeamKey && (
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse">
                        🏸 {scoreT.servingBadge}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        {serviceCourtBoxName}
                      </span>
                    </div>
                  )}

                  <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {rightTeam.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">{rightTeam.club}</p>

                  {/* Card chips */}
                  {cardIncidents.some((c) => c.team === rightTeamKey) && (
                    <div className="flex items-center gap-1 pt-1">
                      {cardIncidents
                        .filter((c) => c.team === rightTeamKey)
                        .map((c) => (
                          <span
                            key={c.id}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                              c.cardType === 'yellow'
                                ? 'bg-amber-400 text-slate-950'
                                : c.cardType === 'red'
                                ? 'bg-rose-500 text-white'
                                : 'bg-black text-white border border-slate-700'
                            }`}
                            title={`${c.cardType.toUpperCase()}: ${c.reason}`}
                          >
                            {c.cardType === 'yellow' ? '🟨 VÀNG' : c.cardType === 'red' ? '🟥 ĐỎ' : '⬛ ĐEN'}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Score Big Display */}
                <div className="text-6xl sm:text-8xl font-black tracking-tight text-white font-mono select-none">
                  {rightScore}
                </div>

                {/* HUGE +1 BUTTON */}
                <button
                  disabled={isMatchFinalized}
                  onClick={() => handleAddPoint(rightTeamKey)}
                  className="w-full max-w-[180px] h-20 sm:h-24 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-3xl sm:text-4xl shadow-xl shadow-cyan-500/20 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  +1
                </button>

                {/* Actions: Assign Server & Disciplinary Card */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setServer(rightTeamKey)}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {scoreT.assignServer}
                  </button>
                  <span className="text-slate-700">•</span>
                  <button
                    onClick={() => handleOpenCardModal(rightTeamKey)}
                    className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Thẻ phạt
                  </button>
                </div>
              </div>
            </div>

            {/* Set Management Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {scoreT.matchScoreTally(matchEvaluation.setsA, matchEvaluation.setsB)} ({t.badminton.bestOfThree})
              </div>

              <div className="flex items-center gap-3">
                {currentSet < 3 && (
                  <button
                    onClick={handleNextSet}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 active:scale-95 transition-all"
                  >
                    {scoreT.nextSetButton(currentSet + 1)}
                  </button>
                )}

                <button
                  onClick={handleOpenFinalizeModal}
                  disabled={isMatchFinalized}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isMatchFinalized ? scoreT.finalizedBadge : scoreT.finalizeButton}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PUBLIC LIVE-SCORE COURT CARD (4 Cols - Live Demonstration) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              {scoreT.spectatorCardTitle}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {scoreT.spectatorCardDesc}
            </p>
          </div>

          {/* Court Public Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {scoreT.courtBadge(1)} • LIVE
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {t.badminton.set} {currentSet}
              </span>
            </div>

            {/* Live Score Display */}
            <div className="space-y-3">
              {/* Team A */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="space-y-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    {server === 'A' && <span className="text-xs">🏸</span>}
                    <span className="text-xs font-bold text-white truncate">
                      {teamA.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{teamA.club}</span>
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {currentScore.scoreA}
                </div>
              </div>

              {/* Team B */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="space-y-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    {server === 'B' && <span className="text-xs">🏸</span>}
                    <span className="text-xs font-bold text-white truncate">
                      {teamB.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{teamB.club}</span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {currentScore.scoreB}
                </div>
              </div>
            </div>

            {/* Set History */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{scoreT.previousSets}</span>
              <span className="font-mono text-slate-200">
                {setScores
                  .filter((_, idx) => idx + 1 < currentSet)
                  .map((s) => `${s.scoreA}-${s.scoreB}`)
                  .join(' | ') || scoreT.noPreviousSets}
              </span>
            </div>

            {/* Next Match on this court */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {scoreT.nextMatchOnCourt}
              </span>
              <p className="text-xs text-slate-300 truncate">
                {scoreT.nextMatchDetails('Vũ Quốc E', 'Đặng Tuấn F', t.rounds.semiFinals, 2)}
              </p>
            </div>
          </div>

          {/* BWF Disciplinary Incident Log */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Nhật Ký Thẻ Phạt BWF ({cardIncidents.length})</span>
              </div>
              <button
                onClick={() => {
                  setIntervalType('11_points');
                  setIntervalSecondsLeft(60);
                  setShowIntervalModal(true);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 font-bold flex items-center gap-1 border border-slate-700"
                title="Bấm để kích hoạt đếm ngược nghỉ ngơi 60s"
              >
                <Timer className="w-3 h-3" />
                Nghỉ 60s
              </button>
            </div>

            {cardIncidents.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                Chưa có thẻ phạt nào được rút. Trận đấu đang diễn ra theo tinh thần thể thao BWF.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {cardIncidents.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${
                          c.cardType === 'yellow'
                            ? 'bg-amber-400 text-slate-950'
                            : c.cardType === 'red'
                            ? 'bg-rose-500 text-white'
                            : 'bg-black text-white border border-slate-700'
                        }`}
                      >
                        {c.cardType.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate text-[11px]">{c.teamName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{c.reason}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      S{c.setIndex} • {c.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* BWF INTERVAL TIMER MODAL (60s at 11 pts or 120s between sets) */}
      {showIntervalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-cyan-500/30 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4 animate-spin text-cyan-400" />
              {intervalType === '11_points'
                ? 'NGHỈ KỸ THUẬT (BWF 60 GIÂY)'
                : 'NGHỈ GIỮA HAI SET (BWF 120 GIÂY)'}
            </div>

            {/* Giant Interval Countdown */}
            <div className="py-4">
              <div className="text-7xl sm:text-8xl font-black font-mono text-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                {Math.floor(intervalSecondsLeft / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(intervalSecondsLeft % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {intervalType === '11_points'
                  ? 'Đã đạt điểm 11. Hai bên được nghỉ ngơi và nhận chỉ đạo chiến thuật từ Huấn luyện viên.'
                  : 'Thời gian nghỉ giữa các set để VĐV hồi phục thể lực và đổi sân đấu.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIntervalSecondsLeft((s) => Math.max(0, s - 10))}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
              >
                -10 Giây
              </button>
              <button
                onClick={() => setShowIntervalModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                Tiếp Tục Trận Đấu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BWF DISCIPLINARY CARDS MODAL */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Xử Phạt Kỹ Thuật & Thẻ Phạt BWF</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Áp dụng cho: <span className="text-white font-bold">{targetTeamForCard === 'A' ? teamA.name : teamB.name}</span>
                </p>
              </div>
            </div>

            {/* Select Card Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Chọn loại thẻ phạt:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCardTypeSelected('yellow')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    cardTypeSelected === 'yellow'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-5 h-7 rounded-xs bg-amber-400 shadow" />
                  <span className="text-xs font-bold mt-1">Thẻ Vàng</span>
                  <span className="text-[10px] text-slate-400">Cảnh cáo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardTypeSelected('red')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    cardTypeSelected === 'red'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-5 h-7 rounded-xs bg-rose-500 shadow" />
                  <span className="text-xs font-bold mt-1">Thẻ Đỏ</span>
                  <span className="text-[10px] text-rose-400 font-bold">+1 điểm đối thủ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardTypeSelected('black')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    cardTypeSelected === 'black'
                      ? 'bg-slate-800 border-slate-500 text-white ring-2 ring-slate-400/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-5 h-7 rounded-xs bg-black border border-slate-600 shadow" />
                  <span className="text-xs font-bold mt-1">Thẻ Đen</span>
                  <span className="text-[10px] text-slate-400">Truất quyền</span>
                </button>
              </div>
            </div>

            {/* Select Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Lý do vi phạm quy chế:</label>
              <select
                value={cardReason}
                onChange={(e) => setCardReason(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="Trì hoãn trận đấu không hợp lệ">Trì hoãn trận đấu không hợp lệ</option>
                <option value="Tranh cãi hoặc bất tuân chỉ đạo của Trọng tài">Tranh cãi hoặc bất tuân chỉ đạo của Trọng tài</option>
                <option value="Đập vợt hoặc ném cầu ra ngoài sân có chủ đích">Đập vợt hoặc ném cầu ra ngoài sân có chủ đích</option>
                <option value="Rời sân đấu mà không có sự cho phép của Trọng tài">Rời sân đấu mà không có sự cho phép của Trọng tài</option>
                <option value="Huấn luyện viên chỉ đạo không đúng thời điểm quy định">Huấn luyện viên chỉ đạo không đúng thời điểm quy định</option>
                <option value="Hành vi phi thể thao khác">Hành vi phi thể thao khác</option>
              </select>
            </div>

            {cardTypeSelected === 'red' && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300">
                ⚠️ <strong>Luật BWF:</strong> Rút Thẻ Đỏ sẽ tự động phạt lỗi và cộng trực tiếp <strong>+1 điểm</strong> cho đối thủ!
              </div>
            )}

            {cardTypeSelected === 'black' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                ⛔ <strong>Truất quyền thi đấu:</strong> VĐV/Đôi bị xử thua trận ngay lập tức theo quyết định của Tổng trọng tài.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmIssueCard}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                Xác Nhận Rút Thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINALIZE CONFIRMATION MODAL */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">{scoreT.finalizeModalTitle}</h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>{scoreT.setScoresSummary}</span>
                <span className="font-bold text-white font-mono">
                  {setScores.map((s) => `${s.scoreA}-${s.scoreB}`).join(' , ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{scoreT.winnerSummary}</span>
                <span className="font-bold text-cyan-400">
                  {matchEvaluation.winner === 'A'
                    ? teamA.name
                    : matchEvaluation.winner === 'B'
                    ? teamB.name
                    : t.badminton.pending}
                </span>
              </div>
            </div>

            {finalizeError && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{finalizeError}</span>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              {scoreT.finalizeWarning}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmFinalize}
                disabled={Boolean(finalizeError)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 transition-all"
              >
                {scoreT.confirmFinalize}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT RESOLUTION MODAL (Strictly NO Force Sync) */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">{scoreT.conflictModalTitle}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {scoreT.conflictModalDesc}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  {scoreT.deviceScore}
                </span>
                <p className="text-base font-mono font-bold text-white">
                  {currentScore.scoreA} - {currentScore.scoreB}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase font-bold">
                  {scoreT.serverAuthoritativeScore}
                </span>
                <p className="text-base font-mono font-bold text-cyan-300">
                  {serverScoreDisplay}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-950/20 border border-amber-900/40 p-3 text-[11px] text-amber-300">
              💡 {scoreT.securityRuleNotice}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleAcceptServerScore}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                {scoreT.acceptServerScore}
              </button>
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  alert(scoreT.correctionSubmittedAlert);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
              >
                {scoreT.submitCorrectionRequest}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UmpireScoringPrototype() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">Loading...</div>}>
      <UmpireScoringContent />
    </Suspense>
  );
}

