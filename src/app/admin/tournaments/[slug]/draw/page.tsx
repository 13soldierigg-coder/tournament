'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import {
  generateKnockoutBracket,
  snakeSeedGroups,
  generateBergerRoundRobin,
  generateGroupToKnockoutBracket,
  calculateGroupStandings,
  getNextPowerOf2,
  EngineEntry,
  GroupAdvancementSlot,
  GroupAdvancementRule,
  CompletedGroupMatch,
  RoundRobinMatch,
} from '@/engine';
import { GroupStandingsTable } from '@/components/GroupStandingsTable';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserMenu } from '@/components/auth/UserMenu';
import { MOCK_TOURNAMENTS, MockTournament } from '@/data/mockTournaments';
import { getTournaments } from '@/lib/services/tournamentService';
import {
  getTournamentRegistrations,
  seedDemoAthletesForTournament,
  TournamentRegistration,
} from '@/lib/services/registrationService';
import {
  publishDrawMatches,
  clearDrawMatches,
  PublishDrawResult,
} from '@/lib/services/drawService';
import { MatchScoreModal, EditingMatchInfo } from '@/components/organizer-draw/MatchScoreModal';
import { DrawHeader } from '@/components/organizer-draw/DrawHeader';
import { ManualDrawPanel } from '@/components/organizer-draw/ManualDrawPanel';
import { GroupStageView, StoredMatchResult } from '@/components/organizer-draw/GroupStageView';
import { KnockoutBracketView } from '@/components/organizer-draw/KnockoutBracketView';

const CLUB_LOCALIZATIONS: Record<string, { vi: string; en: string }> = {
  'CLB Ba Đình': { vi: 'CLB Ba Đình', en: 'Ba Dinh Club' },
  'CLB Cầu Giấy': { vi: 'CLB Cầu Giấy', en: 'Cau Giay Club' },
  'CLB Hoàn Kiếm': { vi: 'CLB Hoàn Kiếm', en: 'Hoan Kiem Club' },
  'CLB Thăng Long': { vi: 'CLB Thăng Long', en: 'Thang Long Club' },
  'CLB Đống Đa': { vi: 'CLB Đống Đa', en: 'Dong Da Club' },
};

function OrganizerDrawContent() {
  const { t, locale } = useLanguage();
  const drawT = t.draw;
  const roundsT = t.rounds;
  const isEn = locale === 'en';

  const searchParams = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  // Tournament & Event selection
  const [tournaments, setTournaments] = useState<MockTournament[]>([]);
  const [selectedTournamentSlug, setSelectedTournamentSlug] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Draw modes: 'auto' (b???c th??m t??? ?????ng) | 'manual' (x???p th??m th??? c??ng)
  const [drawMode, setDrawMode] = useState<'auto' | 'manual'>('auto');

  // General settings
  const [teamCount, setTeamCount] = useState<number>(8);
  const [separateClubs, setSeparateClubs] = useState(true);
  const [activeTab, setActiveTab] = useState<'group_knockout' | 'knockout' | 'round_robin'>('group_knockout');
  const [groupCount, setGroupCount] = useState<number>(4);
  const [advancementRule, setAdvancementRule] = useState<GroupAdvancementRule>('best_runner_ups');
  const [mappingMode, setMappingMode] = useState<'cross_p1' | 'cross_p2' | 'cross_p3' | 'random'>('cross_p1');
  const [groupKnockoutSubTab, setGroupKnockoutSubTab] = useState<'groups' | 'knockout'>('groups');

  // Publication state
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishDrawResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Real registered athletes from tournament registration service
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  // Manual placement state
  const [manualGroupSlots, setManualGroupSlots] = useState<Record<string, string>>({});
  const [manualKnockoutSlots, setManualKnockoutSlots] = useState<Record<number, string>>({});

  // Match Scoring State
  const [editingMatch, setEditingMatch] = useState<EditingMatchInfo | null>(null);
  const [groupMatchScores, setGroupMatchScores] = useState<Record<string, StoredMatchResult>>({});

  // Handle route change when tournament is selected from header
  const handleSelectTournament = (newSlug: string) => {
    setSelectedTournamentSlug(newSlug);
    router.push('/admin/tournaments/' + newSlug + '/draw');
  };

  // 1. Initial Load of Tournaments
  useEffect(() => {
    async function loadTournaments() {
      setIsLoadingData(true);
      try {
        const loaded = await getTournaments();
        const tours = loaded.length > 0 ? loaded : [];
        setTournaments(tours);

        const urlSlug = slug;
        if (urlSlug) {
            const defaultTour = tours.find(t => t.slug === urlSlug);
            if (defaultTour) {
                setSelectedTournamentSlug(defaultTour.slug);
                if (defaultTour.events && defaultTour.events.length > 0) {
                    setSelectedEventId(defaultTour.events[0].id);
                }
            } else if (tours.length > 0) {
                setSelectedTournamentSlug(tours[0].slug);
            }
        } else if (tours.length > 0) {
            setSelectedTournamentSlug(tours[0].slug);
        }
      } catch (err) {
        console.error('Failed to load tournaments:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadTournaments();
  }, [slug]);

  // Current selected tournament & event
  const currentTournament = useMemo(() => {
    return tournaments.find((t) => t.slug === selectedTournamentSlug) || tournaments[0];
  }, [tournaments, selectedTournamentSlug]);

  const currentEvent = useMemo(() => {
    if (!currentTournament?.events || currentTournament.events.length === 0) return null;
    return (
      currentTournament.events.find((e) => e.id === selectedEventId) ||
      currentTournament.events[0]
    );
  }, [currentTournament, selectedEventId]);

  // 2. Fetch Registrations for Selected Tournament & Event
  const loadRegistrations = async () => {
    if (!currentTournament) return;
    try {
      const regs = await getTournamentRegistrations(currentTournament.id);
      const filtered = currentEvent
        ? regs.filter((r) => r.eventId === currentEvent.id && r.status === 'confirmed')
        : regs.filter((r) => r.status === 'confirmed');

      setRegistrations(filtered);
      if (filtered.length >= 4) {
        setTeamCount(filtered.length);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    }
  };

  useEffect(() => {
    if (currentTournament) {
      loadRegistrations();
    }
  }, [currentTournament, currentEvent]);

  // Handle Seeding 8 Demo Athletes
  const handleSeedDemoAthletes = async () => {
    if (!currentTournament) return;
    setIsSeedingDemo(true);
    try {
      await seedDemoAthletesForTournament(currentTournament.id, currentEvent?.id);
      await loadRegistrations();
    } catch (err) {
      console.error('Failed to seed athletes:', err);
    } finally {
      setIsSeedingDemo(false);
    }
  };

  // Convert Registrations to Engine Entries
  const entries: EngineEntry[] = useMemo(() => {
    if (registrations.length === 0) return [];
    return registrations.map((r, index) => {
      let displayName = r.athleteName;
      if (r.partnerName) {
        displayName = `${r.athleteName} / ${r.partnerName}`;
      } else if (r.teamName) {
        displayName = r.teamName;
      }
      return {
        id: r.id,
        name: displayName,
        club: r.club || r.athleteClub || 'CLB Tự Do',
        seed: r.seed || (index < 2 ? index + 1 : undefined),
      };
    });
  }, [registrations]);

  const localizedEntries = useMemo(() => {
    return entries.map((entry) => {
      const locClub = entry.club ? CLUB_LOCALIZATIONS[entry.club] : null;
      return {
        ...entry,
        club: locClub ? (isEn ? locClub.en : locClub.vi) : entry.club,
      };
    });
  }, [entries, isEn]);

  const activeEntries = useMemo(() => {
    return localizedEntries.slice(0, Math.min(teamCount, localizedEntries.length));
  }, [localizedEntries, teamCount]);

  const slotsPerGroup = useMemo(() => {
    return Math.ceil(teamCount / groupCount);
  }, [teamCount, groupCount]);

  // 1. Effective Knockout Entries
  const effectiveKnockoutEntries = useMemo(() => {
    if (drawMode === 'auto') {
      return activeEntries;
    }
    const result: EngineEntry[] = [];
    for (let slotIdx = 0; slotIdx < teamCount; slotIdx++) {
      const entryId = manualKnockoutSlots[slotIdx];
      const entry = activeEntries.find((e) => e.id === entryId);
      if (entry) {
        result.push(entry);
      }
    }
    return result;
  }, [drawMode, activeEntries, manualKnockoutSlots, teamCount]);

  const bracketMatches = useMemo(() => {
    if (effectiveKnockoutEntries.length < 2) return [];
    return generateKnockoutBracket(effectiveKnockoutEntries, {
      separateClubs: drawMode === 'auto' ? separateClubs : false,
    });
  }, [effectiveKnockoutEntries, separateClubs, drawMode]);

  // 2. Effective Groups for Group-Knockout & Round-Robin
  const effectiveGroupKnockoutGroups = useMemo(() => {
    if (drawMode === 'auto') {
      const minEntries = Math.max(activeEntries.length, groupCount * 2);
      const pool = localizedEntries.slice(0, minEntries);
      if (pool.length === 0) return [];
      const groups = snakeSeedGroups(pool, groupCount, { separateClubs });
      return groups.map((gEntries, gIdx) => ({
        name: drawT.groupTitle(String.fromCharCode(65 + gIdx)),
        entries: gEntries,
        schedule: generateBergerRoundRobin(gEntries),
      }));
    }

    // Manual Mode
    const groups = [];
    for (let gIdx = 0; gIdx < groupCount; gIdx++) {
      const letter = String.fromCharCode(65 + gIdx);
      const gEntries: EngineEntry[] = [];
      for (let sIdx = 0; sIdx < slotsPerGroup; sIdx++) {
        const id = manualGroupSlots[`${letter}_${sIdx}`];
        const found = activeEntries.find((e) => e.id === id);
        if (found) {
          gEntries.push(found);
        }
      }
      groups.push({
        name: drawT.groupTitle(letter),
        entries: gEntries,
        schedule: generateBergerRoundRobin(gEntries),
      });
    }
    return groups;
  }, [
    drawMode,
    activeEntries,
    localizedEntries,
    groupCount,
    separateClubs,
    manualGroupSlots,
    slotsPerGroup,
    drawT,
  ]);

  // 3. Round Robin Groups
  const roundRobinGroups = useMemo(() => {
    if (drawMode === 'auto') {
      if (activeEntries.length === 0) return [];
      const groups = snakeSeedGroups(activeEntries, 2, { separateClubs });
      return groups.map((gEntries, gIdx) => ({
        name: drawT.groupTitle(String.fromCharCode(65 + gIdx)),
        entries: gEntries,
        schedule: generateBergerRoundRobin(gEntries),
      }));
    }
    return effectiveGroupKnockoutGroups.slice(0, 2);
  }, [drawMode, activeEntries, separateClubs, effectiveGroupKnockoutGroups, drawT]);

  // Group Standings
  const allGroupStandings = useMemo(() => {
    return effectiveGroupKnockoutGroups.map((g, gIdx) => {
      const letter = String.fromCharCode(65 + gIdx);
      const relevantMatches: CompletedGroupMatch[] = [];
      for (const m of g.schedule) {
        const matchKey = `${letter}_${m.entryA.id}_vs_${m.entryB.id}`;
        const stored = groupMatchScores[matchKey];
        if (stored && stored.isFinished) {
          relevantMatches.push({
            entryAId: m.entryA.id,
            entryBId: m.entryB.id,
            scores: stored.scores || [],
            isFinished: true,
            winnerId: stored.winnerId,
          });
        }
      }

      const standings = calculateGroupStandings(g.entries, relevantMatches);
      return {
        groupLetter: letter,
        groupIdx: gIdx,
        standings,
      };
    });
  }, [effectiveGroupKnockoutGroups, groupMatchScores]);

  const targetKnockoutSize = useMemo(() => getNextPowerOf2(groupCount), [groupCount]);
  const runnerUpsNeeded = useMemo(
    () => Math.max(0, targetKnockoutSize - groupCount),
    [targetKnockoutSize, groupCount]
  );

  const totalGroupMatchesCount = useMemo(() => {
    return effectiveGroupKnockoutGroups.reduce((sum, g) => sum + g.schedule.length, 0);
  }, [effectiveGroupKnockoutGroups]);

  const finishedGroupMatchesCount = useMemo(() => {
    const allScheduleKeys = new Set(
      effectiveGroupKnockoutGroups.flatMap((g, gIdx) => {
        const letter = String.fromCharCode(65 + gIdx);
        return g.schedule.map((m) => `${letter}_${m.entryA.id}_vs_${m.entryB.id}`);
      })
    );
    return Object.entries(groupMatchScores).filter(([k, m]) => allScheduleKeys.has(k) && m.isFinished).length;
  }, [effectiveGroupKnockoutGroups, groupMatchScores]);

  // Standings for Round Robin format
  const allRoundRobinStandings = useMemo(() => {
    return roundRobinGroups.map((g, gIdx) => {
      const letter = String.fromCharCode(65 + gIdx);
      const relevantMatches: CompletedGroupMatch[] = [];
      for (const m of g.schedule) {
        const matchKey = `RR_${letter}_${m.entryA.id}_vs_${m.entryB.id}`;
        const stored = groupMatchScores[matchKey];
        if (stored && stored.isFinished) {
          relevantMatches.push({
            entryAId: m.entryA.id,
            entryBId: m.entryB.id,
            scores: stored.scores || [],
            isFinished: true,
            winnerId: stored.winnerId,
          });
        }
      }

      const standings = calculateGroupStandings(g.entries, relevantMatches);
      return {
        groupLetter: letter,
        groupIdx: gIdx,
        standings,
      };
    });
  }, [roundRobinGroups, groupMatchScores]);

  // 4. Knockout Bracket for Stage 2 of Group-Knockout
  const groupKnockoutBracket = useMemo(() => {
    if (effectiveGroupKnockoutGroups.length === 0) return [];
    const advancementSlots: GroupAdvancementSlot[] = [];

    allGroupStandings.forEach((g) => {
      const rank1 = g.standings.find((s) => s.rank === 1);
      const rank2 = g.standings.find((s) => s.rank === 2);
      const entry1 = rank1
        ? effectiveGroupKnockoutGroups[g.groupIdx]?.entries.find((e) => e.id === rank1.entryId)
        : effectiveGroupKnockoutGroups[g.groupIdx]?.entries[0];
      const entry2 = rank2
        ? effectiveGroupKnockoutGroups[g.groupIdx]?.entries.find((e) => e.id === rank2.entryId)
        : effectiveGroupKnockoutGroups[g.groupIdx]?.entries[1];

      if (entry1 || rank1) {
        advancementSlots.push({
          groupIdx: g.groupIdx,
          groupLetter: g.groupLetter,
          rank: 1,
          entry: entry1,
          standing: rank1,
        });
      }
      if (entry2 || rank2) {
        advancementSlots.push({
          groupIdx: g.groupIdx,
          groupLetter: g.groupLetter,
          rank: 2,
          entry: entry2,
          standing: rank2,
        });
      }
    });

    return generateGroupToKnockoutBracket(
      groupCount,
      advancementSlots,
      mappingMode,
      {
        separateClubs,
        advancementRule,
      }
    );
  }, [
    effectiveGroupKnockoutGroups,
    allGroupStandings,
    groupCount,
    mappingMode,
    separateClubs,
    advancementRule,
  ]);

  // Rounds grouping for Knockout Bracket
  const rounds = useMemo(() => {
    const grouped: Record<number, typeof bracketMatches> = {};
    bracketMatches.forEach((match) => {
      if (!grouped[match.round]) {
        grouped[match.round] = [];
      }
      grouped[match.round].push(match);
    });
    return Object.entries(grouped)
      .map(([round, matches]) => [Number(round), matches] as [number, typeof bracketMatches])
      .sort(([a], [b]) => a - b);
  }, [bracketMatches]);

  const groupKnockoutRounds = useMemo(() => {
    const grouped: Record<number, typeof groupKnockoutBracket> = {};
    groupKnockoutBracket.forEach((match) => {
      if (!grouped[match.round]) {
        grouped[match.round] = [];
      }
      grouped[match.round].push(match);
    });
    return Object.entries(grouped)
      .map(([round, matches]) => [Number(round), matches] as [number, typeof groupKnockoutBracket])
      .sort(([a], [b]) => a - b);
  }, [groupKnockoutBracket]);

  // Simulation Handlers
  const handleSimulatePhotoGroupA = () => {
    const photoScores: Record<string, StoredMatchResult> = {
      'A_team-1_vs_team-2': {
        isFinished: true,
        winnerId: 'team-1',
        scores: [
          { scoreA: 21, scoreB: 18 },
          { scoreA: 21, scoreB: 17 },
        ],
      },
      'A_team-1_vs_team-3': {
        isFinished: true,
        winnerId: 'team-1',
        scores: [
          { scoreA: 21, scoreB: 14 },
          { scoreA: 21, scoreB: 15 },
        ],
      },
      'A_team-1_vs_team-4': {
        isFinished: true,
        winnerId: 'team-1',
        scores: [
          { scoreA: 21, scoreB: 12 },
          { scoreA: 21, scoreB: 16 },
        ],
      },
      'A_team-2_vs_team-3': {
        isFinished: true,
        winnerId: 'team-2',
        scores: [
          { scoreA: 21, scoreB: 19 },
          { scoreA: 21, scoreB: 18 },
        ],
      },
      'A_team-2_vs_team-4': {
        isFinished: true,
        winnerId: 'team-2',
        scores: [
          { scoreA: 21, scoreB: 15 },
          { scoreA: 21, scoreB: 14 },
        ],
      },
      'A_team-3_vs_team-4': {
        isFinished: true,
        winnerId: 'team-3',
        scores: [
          { scoreA: 21, scoreB: 19 },
          { scoreA: 18, scoreB: 21 },
          { scoreA: 21, scoreB: 17 },
        ],
      },
    };
    setGroupMatchScores((prev) => ({ ...prev, ...photoScores }));
  };

  const handleSimulateAllGroups = () => {
    const simulatedScores: Record<string, StoredMatchResult> = {};
    effectiveGroupKnockoutGroups.forEach((group, gIdx) => {
      const letter = String.fromCharCode(65 + gIdx);
      group.schedule.forEach((match, mIdx) => {
        const matchKey = `${letter}_${match.entryA.id}_vs_${match.entryB.id}`;
        const isAWinner = (mIdx + gIdx) % 2 === 0;
        simulatedScores[matchKey] = {
          isFinished: true,
          winnerId: isAWinner ? match.entryA.id : match.entryB.id,
          scores: isAWinner
            ? [
                { scoreA: 21, scoreB: 17 },
                { scoreA: 21, scoreB: 18 },
              ]
            : [
                { scoreA: 18, scoreB: 21 },
                { scoreA: 19, scoreB: 21 },
              ],
        };
      });
    });
    setGroupMatchScores((prev) => ({ ...prev, ...simulatedScores }));
  };

  const handleResetAllScores = () => {
    setGroupMatchScores({});
  };

  // Open Score Modal
  const handleOpenScoreModal = (
    groupLetter: string,
    groupIdx: number,
    match: RoundRobinMatch,
    isRoundRobinFormat = false
  ) => {
    const prefix = isRoundRobinFormat ? 'RR_' : '';
    setEditingMatch({
      groupLetter: `${prefix}${groupLetter}`,
      match,
    });
  };

  // Save Modal Score
  const handleSaveModalScore = (scores: [number, number][], isWalkover = false) => {
    if (!editingMatch) return;
    const matchKey = `${editingMatch.groupLetter}_${editingMatch.match.entryA.id}_vs_${editingMatch.match.entryB.id}`;

    let setsWonA = 0;
    let setsWonB = 0;
    scores.forEach(([a, b]) => {
      if (a > b) setsWonA++;
      else if (b > a) setsWonB++;
    });

    const winnerId =
      setsWonA >= setsWonB ? editingMatch.match.entryA.id : editingMatch.match.entryB.id;

    setGroupMatchScores((prev) => ({
      ...prev,
      [matchKey]: {
        isFinished: true,
        winnerId,
        scores: scores.map(([scoreA, scoreB]) => ({ scoreA, scoreB })),
      },
    }));
    setEditingMatch(null);
  };

  // Delete Modal Score
  const handleDeleteCurrentMatchScore = () => {
    if (!editingMatch) return;
    const matchKey = `${editingMatch.groupLetter}_${editingMatch.match.entryA.id}_vs_${editingMatch.match.entryB.id}`;
    setGroupMatchScores((prev) => {
      const copy = { ...prev };
      delete copy[matchKey];
      return copy;
    });
    setEditingMatch(null);
  };

  // Shuffle & Auto seed handlers
  const handleShuffleUnseeded = () => {
    setGroupMatchScores({});
  };

  const handleManualAutoSeedGroups = () => {
    const newGroupSlots: Record<string, string> = {};
    const seeded = activeEntries.filter((e) => e.seed);
    seeded.forEach((ath) => {
      if (ath.seed && ath.seed <= groupCount) {
        const gLetter = String.fromCharCode(65 + (ath.seed - 1));
        newGroupSlots[`${gLetter}_0`] = ath.id;
      }
    });
    setManualGroupSlots((prev) => ({ ...prev, ...newGroupSlots }));
  };

  const handleManualFillRemainingGroups = () => {
    const assignedIds = new Set(Object.values(manualGroupSlots));
    const unassigned = activeEntries.filter((e) => !assignedIds.has(e.id));
    const newGroupSlots = { ...manualGroupSlots };

    let unassignedIdx = 0;
    for (let sIdx = 0; sIdx < slotsPerGroup; sIdx++) {
      for (let gIdx = 0; gIdx < groupCount; gIdx++) {
        const letter = String.fromCharCode(65 + gIdx);
        const slotKey = `${letter}_${sIdx}`;
        if (!newGroupSlots[slotKey] && unassignedIdx < unassigned.length) {
          newGroupSlots[slotKey] = unassigned[unassignedIdx].id;
          unassignedIdx++;
        }
      }
    }
    setManualGroupSlots(newGroupSlots);
  };

  const handleManualResetGroups = () => {
    setManualGroupSlots({});
  };

  const handleManualAutoSeedKnockout = () => {
    const newKnockoutSlots: Record<number, string> = {};
    const seed1 = activeEntries.find((e) => e.seed === 1);
    const seed2 = activeEntries.find((e) => e.seed === 2);
    if (seed1) newKnockoutSlots[0] = seed1.id;
    if (seed2) newKnockoutSlots[teamCount - 1] = seed2.id;
    setManualKnockoutSlots((prev) => ({ ...prev, ...newKnockoutSlots }));
  };

  const handleManualFillRemainingKnockout = () => {
    const assignedIds = new Set(Object.values(manualKnockoutSlots));
    const unassigned = activeEntries.filter((e) => !assignedIds.has(e.id));
    const newKnockoutSlots = { ...manualKnockoutSlots };

    let uIdx = 0;
    for (let slotIdx = 0; slotIdx < teamCount; slotIdx++) {
      if (!newKnockoutSlots[slotIdx] && uIdx < unassigned.length) {
        newKnockoutSlots[slotIdx] = unassigned[uIdx].id;
        uIdx++;
      }
    }
    setManualKnockoutSlots(newKnockoutSlots);
  };

  const handleManualResetKnockout = () => {
    setManualKnockoutSlots({});
  };

  // Toggle Publish matches to court dispatcher
  const handleTogglePublish = async () => {
    if (isPublished) {
      if (!currentTournament) return;
      setIsPublishing(true);
      try {
        await clearDrawMatches(currentTournament.id, currentEvent?.id);
        setIsPublished(false);
        setPublishResult(null);
      } catch (err: any) {
        setPublishError(err?.message || 'Lỗi khi hủy xuất bản');
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    if (!currentTournament) return;
    setIsPublishing(true);
    setPublishError(null);

    try {
      let matchesToPublish: any[] = [];
      if (activeTab === 'knockout') {
        matchesToPublish = bracketMatches;
      } else if (activeTab === 'group_knockout') {
        matchesToPublish = effectiveGroupKnockoutGroups.flatMap((g, gIdx) => {
          const letter = String.fromCharCode(65 + gIdx);
          return g.schedule.map((m) => ({
            ...m,
            groupLetter: letter,
            roundName: `Vòng Bảng - Bảng ${letter}`,
            stage: 'group',
          }));
        });
      } else {
        matchesToPublish = roundRobinGroups.flatMap((g, gIdx) => {
          const letter = String.fromCharCode(65 + gIdx);
          return g.schedule.map((m) => ({
            ...m,
            groupLetter: letter,
            roundName: `Vòng Tròn - Bảng ${letter}`,
            stage: 'group',
          }));
        });
      }

      const res = await publishDrawMatches({
        tournamentId: currentTournament.id,
        tournamentName: currentTournament.nameVi || currentTournament.nameEn,
        tournamentSlug: currentTournament.slug,
        eventId: currentEvent?.id || selectedEventId || 'evt-default',
        eventCategory: currentEvent?.nameVi || 'Nội Dung Mở Rộng',
        stage: activeTab === 'knockout' ? 'knockout' : 'group',
        format: activeTab,
        matches: matchesToPublish,
        numCourts: currentTournament.courtsCount || 4,
      });

      if (res.success) {
        setIsPublished(true);
        setPublishResult(res);
      } else {
        setPublishError(res.error || 'Xuất bản thất bại');
      }
    } catch (err: any) {
      setPublishError(err?.message || 'Lỗi xuất bản lịch đấu');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={['organizer', 'admin']}
      requiredPermissionName="Bốc Thăm & Chia Bảng Thi Đấu"
    >
      <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Navigation */}
        <header className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tournaments"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <span>Bốc Thăm, Chia Bảng & Nhập Tỷ Số Vòng Bảng</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Quy chuẩn xếp hạt giống BWF & thuật toán vòng tròn Berger tự động
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu />
            <LanguageSwitcher />
          </div>
        </header>

        {/* EMPTY STATE ALERT */}
        {entries.length === 0 && !isLoadingData && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">
                  {isEn
                    ? 'No registered athletes found for this event'
                    : 'Nội dung này chưa có VĐV đăng ký tham gia'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn
                    ? 'You can seed 8 sample athletes to test the draw engine, or register real athletes.'
                    : 'Bạn có thể nạp nhanh 8 VĐV mẫu để thử nghiệm quy trình bốc thăm, hoặc tạo VĐV thủ công.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSeedDemoAthletes}
                disabled={isSeedingDemo}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSeedingDemo
                  ? isEn
                    ? 'Seeding...'
                    : 'Đang nạp...'
                  : isEn
                  ? 'Seed 8 Demo Athletes'
                  : 'Nạp Nhanh 8 VĐV Mẫu'}
              </button>
              {currentTournament && (
                <Link
                  href={`/tournaments/${currentTournament.slug}/register`}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
                >
                  {isEn ? 'Register Team' : 'Đăng Ký Đội'}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Draw Header Controls */}
        <DrawHeader
          currentTournament={currentTournament}
          tournaments={tournaments}
          selectedTournamentSlug={selectedTournamentSlug}
          onSelectTournament={handleSelectTournament}
          currentEvent={currentEvent}
          eventsList={currentTournament?.events || []}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          drawMode={drawMode}
          setDrawMode={setDrawMode}
          teamCount={teamCount}
          setTeamCount={setTeamCount}
          separateClubs={separateClubs}
          setSeparateClubs={setSeparateClubs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isPublishing={isPublishing}
          isPublished={isPublished}
          onTogglePublish={handleTogglePublish}
          onShuffleUnseeded={handleShuffleUnseeded}
          entriesCount={entries.length}
        />

        {/* MANUAL DRAW EDITING PANEL */}
        {drawMode === 'manual' && (
          <ManualDrawPanel
            activeTab={activeTab}
            groupCount={groupCount}
            teamCount={teamCount}
            slotsPerGroup={slotsPerGroup}
            activeEntries={activeEntries}
            manualGroupSlots={manualGroupSlots}
            setManualGroupSlots={setManualGroupSlots}
            manualKnockoutSlots={manualKnockoutSlots}
            setManualKnockoutSlots={setManualKnockoutSlots}
            onAutoSeedGroups={handleManualAutoSeedGroups}
            onFillRemainingGroups={handleManualFillRemainingGroups}
            onResetGroups={handleManualResetGroups}
            onAutoSeedKnockout={handleManualAutoSeedKnockout}
            onFillRemainingKnockout={handleManualFillRemainingKnockout}
            onResetKnockout={handleManualResetKnockout}
          />
        )}

        {/* Error Alert */}
        {publishError && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-center gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-xs font-semibold">{publishError}</span>
          </div>
        )}

        {/* Publication Success Banner */}
        {isPublished && publishResult && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  {drawT.publishSuccessToast(
                    publishResult.totalMatches,
                    publishResult.courtsAssigned
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {locale === 'en'
                    ? 'Matches have been queued and dispatched to courts for active umpire scoring.'
                    : 'Các trận đấu đã được lưu và phân bổ vào sân để trọng tài bắt đầu ghi điểm.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">
                {drawT.openCourtScoring}:
              </span>
              <Link
                href="/prototypes/umpire-scoring?court=1"
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all shadow-sm"
              >
                {drawT.courtLabel(1)} →
              </Link>
              <Link
                href="/prototypes/umpire-scoring?court=2"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                {drawT.courtLabel(2)} →
              </Link>
            </div>
          </div>
        )}

        {/* TAB 1: KNOCKOUT BRACKET */}
        {activeTab === 'knockout' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{drawT.bwfStandardNote}</span>
              {teamCount === 6 && (
                <span className="text-amber-400 font-medium">
                  {drawT.byesAdvanceNotice}
                </span>
              )}
            </div>
            <KnockoutBracketView rounds={rounds} />
          </div>
        )}

        {/* TAB 2: GROUP + KNOCKOUT FORMAT */}
        {activeTab === 'group_knockout' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setGroupKnockoutSubTab('groups')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    groupKnockoutSubTab === 'groups'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Giai Đoạn 1: Vòng Bảng ({groupCount} Bảng)
                </button>
                <button
                  type="button"
                  onClick={() => setGroupKnockoutSubTab('knockout')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    groupKnockoutSubTab === 'knockout'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Giai Đoạn 2: Knockout
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  {isEn ? 'Number of Groups' : 'Số lượng Bảng đấu'}:
                </span>
                <select
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-semibold outline-none focus:border-cyan-500"
                >
                  <option value={2}>2 Bảng (A, B)</option>
                  <option value={3}>3 Bảng (A, B, C)</option>
                  <option value={4}>4 Bảng (A, B, C, D)</option>
                  <option value={5}>5 Bảng (A → E)</option>
                  <option value={6}>6 Bảng (A → F)</option>
                  <option value={7}>7 Bảng (A → G)</option>
                  <option value={8}>8 Bảng (A → H)</option>
                </select>
              </div>
            </div>

            {groupKnockoutSubTab === 'groups' && (
              <GroupStageView
                finishedGroupMatchesCount={finishedGroupMatchesCount}
                totalGroupMatchesCount={totalGroupMatchesCount}
                onSimulatePhotoGroupA={handleSimulatePhotoGroupA}
                onSimulateAllGroups={handleSimulateAllGroups}
                onResetAllScores={handleResetAllScores}
                runnerUpsNeeded={runnerUpsNeeded}
                advancementRule={advancementRule}
                allGroupStandings={allGroupStandings}
                groups={effectiveGroupKnockoutGroups}
                groupMatchScores={groupMatchScores}
                onOpenScoreModal={handleOpenScoreModal}
              />
            )}

            {groupKnockoutSubTab === 'knockout' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Luật đi tiếp:</span>
                    <select
                      value={advancementRule}
                      onChange={(e) => setAdvancementRule(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold outline-none focus:border-amber-500"
                    >
                      <option value="best_runner_ups">
                        Lấy Nhì bảng có thành tích tốt nhất
                      </option>
                      <option value="all_top_two">
                        Lấy toàn bộ Nhất & Nhì bảng (chia nhánh có BYE)
                      </option>
                      <option value="winners_only">Chỉ lấy các đội Nhất bảng</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Khớp cặp Nhất - Nhì:</span>
                    <select
                      value={mappingMode}
                      onChange={(e) => setMappingMode(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-semibold outline-none focus:border-cyan-500"
                    >
                      <option value="cross_p1">Phương án 1 (1A vs 2B, 1B vs 2A...)</option>
                      <option value="cross_p2">Phương án 2 (1A vs 2C, 1B vs 2D...)</option>
                      <option value="cross_p3">Phương án 3 (1A vs 2D, 1B vs 2C...)</option>
                      <option value="random">Bốc thăm ngẫu nhiên không cùng bảng</option>
                    </select>
                  </div>
                </div>

                <KnockoutBracketView
                  rounds={groupKnockoutRounds}
                  isGroupKnockout
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROUND-ROBIN GROUPS */}
        {activeTab === 'round_robin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {roundRobinGroups.map((group, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const groupStandings = allRoundRobinStandings[idx]?.standings || [];

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5 shadow-xl"
                  >
                    <GroupStandingsTable
                      groupName={group.name}
                      standings={groupStandings}
                      advancingPerGroup={1}
                    />

                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <span>{drawT.bergerScheduleTitle}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {group.schedule.length} Trận
                          </span>
                        </h4>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {group.schedule.map((match) => {
                          const matchKey = `RR_${letter}_${match.entryA.id}_vs_${match.entryB.id}`;
                          const result = groupMatchScores[matchKey];
                          const isFinished = !!result?.isFinished;
                          const winnerId = result?.winnerId;

                          const scoreText = result?.scores
                            ?.map((s) => `${s.scoreA}-${s.scoreB}`)
                            .join(', ');

                          return (
                            <div
                              key={match.matchNumber}
                              className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 shrink-0">
                                  V{match.round} • #{match.matchNumber}
                                </span>
                                <div className="text-xs font-semibold truncate">
                                  <span
                                    className={
                                      winnerId === match.entryA.id
                                        ? 'text-cyan-400 font-bold'
                                        : 'text-slate-200'
                                    }
                                  >
                                    {match.entryA.name}
                                  </span>
                                  <span className="text-slate-500 mx-1.5 font-normal">
                                    vs
                                  </span>
                                  <span
                                    className={
                                      winnerId === match.entryB.id
                                        ? 'text-cyan-400 font-bold'
                                        : 'text-slate-200'
                                    }
                                  >
                                    {match.entryB.name}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                                {isFinished ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{scoreText}</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    Chưa diễn ra
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenScoreModal(letter, idx, match, true)
                                  }
                                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1"
                                >
                                  <Pencil className="w-3 h-3 text-cyan-400" />
                                  <span>{isFinished ? 'Sửa' : 'Ghi điểm'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MATCH SCORE EDITING MODAL */}
        <MatchScoreModal
          editingMatch={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSave={handleSaveModalScore}
          onDelete={handleDeleteCurrentMatchScore}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function OrganizerDrawPrototype() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 font-mono">
              Đang tải phân hệ bốc thăm & xếp lịch...
            </p>
          </div>
        </div>
      }
    >
      <OrganizerDrawContent />
    </Suspense>
  );
}
