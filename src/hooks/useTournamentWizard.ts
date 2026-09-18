'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/i18n';
import {
  createTournamentWithEvents,
  updateTournamentWithEvents,
  getTournamentBySlug,
  CreateTournamentInput,
  CreateTournamentEventInput,
  CreateTournamentResult,
} from '@/lib/services/tournamentService';
import { SCORING_PRESETS, GroupAdvancementRule } from '@/engine';
import { SUPPORTED_BANKS } from '@/data/mockTournaments';
import { EventFormState, TournamentWizardState } from '@/components/tournaments/wizard/types';

export function useTournamentWizard(): TournamentWizardState {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editSlug);

  const { user } = useAuth();
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: General Info
  const [tournamentName, setTournamentName] = useState('Giải Cầu Lông Mùa Hè Mở Rộng 2026');
  const [organizer, setOrganizer] = useState(user?.clubName || 'Liên Đoàn Cầu Lông & Ban Tổ Chức');
  const [venue, setVenue] = useState('Nhà Thi Đấu Thể Thao Cầu Giấy');
  const [startDate, setStartDate] = useState('2026-06-15');
  const [endDate, setEndDate] = useState('2026-06-20');
  const [courtsCount, setCourtsCount] = useState(4);
  const [description, setDescription] = useState('Giải đấu phong trào và bán chuyên quy mô toàn quốc.');

  // Step 1: Contact & Prize Info
  const [totalPrizePool, setTotalPrizePool] = useState<number>(0);
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || '0912 345 678');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [prizeFirst, setPrizeFirst] = useState('Cúp + Huy chương Vàng');
  const [prizeSecond, setPrizeSecond] = useState('Huy chương Bạc');
  const [prizeThird, setPrizeThird] = useState('Huy chương Đồng');

  // Step 1: Bank Account Settings for VietQR
  const [bankId, setBankId] = useState('MB');
  const [accountNumber, setAccountNumber] = useState('0988889999');
  const [accountHolder, setAccountHolder] = useState('BAN TO CHUC GIAI CAU LONG');
  const [branch, setBranch] = useState('Chi nhánh Hà Nội');

  // Step 2, 3, 4: Events Configuration
  const [events, setEvents] = useState<EventFormState[]>([
    {
      id: 'e-1',
      name: 'Đôi Nam Phong Trào Hạng B',
      eventType: 'md',
      format: 'group_knockout',
      groupCount: 4,
      advancingPerGroup: 2,
      advancementRule: 'best_runner_ups',
      knockoutMapping: 'cross_p1',
      scoringPreset: 'bwf_standard_21_30',
      groupScoringPreset: 'sudden_death_31',
      gamesPerMatch: 3,
      pointsPerGame: 21,
      maxCapPoints: 30,
      isSuddenDeath: false,
      separateClubsR1: true,
      separateClubsGroups: true,
      bwfSeeding: true,
      entryFee: 500000,
    },
    {
      id: 'e-2',
      name: 'Đơn Nam Mở Rộng',
      eventType: 'ms',
      format: 'knockout',
      groupCount: 2,
      advancingPerGroup: 2,
      advancementRule: 'best_runner_ups',
      knockoutMapping: 'cross_p1',
      scoringPreset: 'bwf_standard_21_30',
      groupScoringPreset: 'bwf_standard_21_30',
      gamesPerMatch: 3,
      pointsPerGame: 21,
      maxCapPoints: 30,
      isSuddenDeath: false,
      separateClubsR1: true,
      separateClubsGroups: true,
      bwfSeeding: true,
      entryFee: 300000,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<CreateTournamentResult | null>(null);

  useEffect(() => {
    if (!editSlug) return;

    let isMounted = true;
    async function loadExisting() {
      setIsLoadingExisting(true);
      setLoadError(null);
      try {
        const tour = await getTournamentBySlug(editSlug as string);
        if (!isMounted) return;
        if (!tour) {
          setLoadError(isEn ? 'Tournament not found' : 'Không tìm thấy giải đấu cần điều chỉnh');
          return;
        }

        setTournamentName(tour.nameVi || tour.nameEn || '');
        setOrganizer(tour.organizerVi || tour.organizerEn || '');
        setVenue(tour.venueVi || tour.venueEn || '');
        if (tour.startDate) setStartDate(tour.startDate);
        if (tour.endDate) setEndDate(tour.endDate);
        if (tour.courtsCount) setCourtsCount(tour.courtsCount);
        if (tour.descriptionVi || tour.descriptionEn) {
          setDescription(tour.descriptionVi || tour.descriptionEn);
        }
        if (typeof tour.totalPrizePool === 'number') {
          setTotalPrizePool(tour.totalPrizePool);
        }
        if (tour.contactPhone) setContactPhone(tour.contactPhone);
        if (tour.contactEmail) setContactEmail(tour.contactEmail);

        if (tour.prizeStructure && tour.prizeStructure.length > 0) {
          setPrizeFirst(tour.prizeStructure[0]?.rewardVi || tour.prizeStructure[0]?.rewardEn || '');
          setPrizeSecond(tour.prizeStructure[1]?.rewardVi || tour.prizeStructure[1]?.rewardEn || '');
          setPrizeThird(tour.prizeStructure[2]?.rewardVi || tour.prizeStructure[2]?.rewardEn || '');
        }

        if (tour.bankAccount) {
          setBankId(tour.bankAccount.bankId || 'MB');
          setAccountNumber(tour.bankAccount.accountNumber || '');
          setAccountHolder(tour.bankAccount.accountHolder || '');
          setBranch(tour.bankAccount.branch || '');
        }

        if (tour.events && tour.events.length > 0) {
          setEvents(
            tour.events.map((ev, idx) => {
              const savedFmt = ev.format || (ev.eventType === 'ms' || ev.eventType === 'ws' ? 'knockout' : 'group_knockout');
              const savedGrpCount = ev.groupCount || 4;
              const savedAdvPerGrp = ev.advancingPerGroup || 2;
              const savedAdvRule = (ev.advancementRule as GroupAdvancementRule) || 'best_runner_ups';
              const savedKoMap = (ev.knockoutMapping as any) || 'cross_p1';
              const grpScoring = ev.stageConfigs?.group;
              const koScoring = ev.stageConfigs?.knockout;
              const drawRules = ev.drawRules || {};
              const hasCustom = Boolean(ev.prizeStructure && ev.prizeStructure.length > 0);
              const p1 = hasCustom ? ev.prizeStructure![0]?.rewardVi || '' : '';
              const p2 = hasCustom ? ev.prizeStructure![1]?.rewardVi || '' : '';
              const p3 = hasCustom ? ev.prizeStructure![2]?.rewardVi || '' : '';

              return {
                id: ev.id || `e-${idx + 1}`,
                name: ev.nameVi || ev.nameEn || `Nội dung ${idx + 1}`,
                eventType: ev.eventType || 'md',
                format: savedFmt,
                groupCount: savedGrpCount,
                advancingPerGroup: savedAdvPerGrp,
                advancementRule: savedAdvRule,
                knockoutMapping: savedKoMap,
                scoringPreset: 'bwf_standard_21_30',
                groupScoringPreset: 'sudden_death_31',
                gamesPerMatch: (koScoring?.gamesPerMatch || 3) as 1 | 3 | 5,
                pointsPerGame: koScoring?.pointsPerGame || 21,
                maxCapPoints: koScoring?.maxCapPoints || 30,
                isSuddenDeath: Boolean(koScoring?.isSuddenDeath),
                separateClubsR1: drawRules.separateClubsInKnockoutRound1 ?? true,
                separateClubsGroups: drawRules.separateClubsInGroups ?? true,
                bwfSeeding: drawRules.bwfSeedPlacement ?? true,
                entryFee: ev.entryFee || 500000,
                hasCustomPrizes: hasCustom,
                prizeFirst: p1,
                prizeSecond: p2,
                prizeThird: p3,
              };
            })
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err?.message || 'Lỗi tải thông tin giải đấu');
        }
      } finally {
        if (isMounted) {
          setIsLoadingExisting(false);
        }
      }
    }

    loadExisting();
    return () => {
      isMounted = false;
    };
  }, [editSlug, isEn]);

  const addEvent = () => {
    const newId = `e-${Date.now()}`;
    const newEvent: EventFormState = {
      id: newId,
      name: `Nội Dung ${events.length + 1}`,
      eventType: 'md',
      format: 'group_knockout',
      groupCount: 4,
      advancingPerGroup: 2,
      knockoutMapping: 'cross_p1',
      scoringPreset: 'bwf_standard_21_30',
      groupScoringPreset: 'short_15_21',
      gamesPerMatch: 3,
      pointsPerGame: 21,
      maxCapPoints: 30,
      isSuddenDeath: false,
      separateClubsR1: true,
      separateClubsGroups: true,
      bwfSeeding: true,
      entryFee: 500000,
      hasCustomPrizes: false,
      prizeFirst: '',
      prizeSecond: '',
      prizeThird: '',
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (id: string) => {
    if (events.length <= 1) return;
    setEvents(events.filter((e) => e.id !== id));
  };

  const updateEvent = (id: string, updates: Partial<EventFormState>) => {
    setEvents(
      events.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...updates };

        // Auto update presets if scoringPreset changed
        if (updates.scoringPreset && updates.scoringPreset !== 'custom') {
          const p = SCORING_PRESETS[updates.scoringPreset];
          updated.gamesPerMatch = p.gamesPerMatch;
          updated.pointsPerGame = p.pointsPerGame;
          updated.maxCapPoints = p.maxCapPoints || (p.pointsPerGame === 21 ? 30 : 21);
          updated.isSuddenDeath = p.isSuddenDeath;
        }

        return updated;
      })
    );
  };

  const handleSaveTournament = async () => {
    setIsSubmitting(true);
    try {
      const payload: CreateTournamentInput = {
        name: tournamentName,
        organizer,
        organizerId: user?.id,
        venue,
        startDate,
        endDate,
        courtsCount,
        description,
        totalPrizePool,
        contactPhone,
        contactEmail,
        prizeStructure: [
          { titleVi: 'Giải Nhất', titleEn: 'Champion', rewardVi: prizeFirst, rewardEn: prizeFirst },
          { titleVi: 'Giải Nhì', titleEn: 'Runner-up', rewardVi: prizeSecond, rewardEn: prizeSecond },
          { titleVi: 'Đồng Giải Ba', titleEn: 'Third Place', rewardVi: prizeThird, rewardEn: prizeThird },
        ],
        bankAccount: {
          bankId,
          bankName: SUPPORTED_BANKS.find((b) => b.id === bankId)?.name || 'MBBank',
          accountNumber,
          accountHolder,
          branch,
        },
        events: events.map((ev) => {
          const koConfig =
            ev.scoringPreset !== 'custom'
              ? SCORING_PRESETS[ev.scoringPreset]
              : {
                  gamesPerMatch: ev.gamesPerMatch,
                  pointsPerGame: ev.pointsPerGame,
                  maxCapPoints: ev.maxCapPoints,
                  isSuddenDeath: ev.isSuddenDeath,
                };

          const grpConfig =
            ev.groupScoringPreset !== 'custom'
              ? SCORING_PRESETS[ev.groupScoringPreset]
              : koConfig;

          return {
            name: ev.name,
            eventType: ev.eventType,
            format: ev.format,
            groupCount: ev.groupCount,
            advancingPerGroup: ev.advancingPerGroup,
            advancementRule: ev.advancementRule,
            knockoutMapping: ev.knockoutMapping,
            stageConfigs: {
              group: grpConfig,
              knockout: koConfig,
            },
            drawRules: {
              separateClubsInKnockoutRound1: ev.separateClubsR1,
              separateClubsInGroups: ev.separateClubsGroups,
              bwfSeedPlacement: ev.bwfSeeding,
            },
            prizeStructure:
              ev.hasCustomPrizes && (ev.prizeFirst || ev.prizeSecond || ev.prizeThird)
                ? [
                    {
                      titleVi: 'Giải Nhất',
                      titleEn: 'Champion',
                      rewardVi: ev.prizeFirst || 'Cúp + Huy chương Vàng',
                      rewardEn: ev.prizeFirst || 'Trophy + Gold Medal',
                    },
                    {
                      titleVi: 'Giải Nhì',
                      titleEn: 'Runner-up',
                      rewardVi: ev.prizeSecond || 'Huy chương Bạc',
                      rewardEn: ev.prizeSecond || 'Silver Medal',
                    },
                    {
                      titleVi: 'Đồng Giải Ba',
                      titleEn: 'Third Place',
                      rewardVi: ev.prizeThird || 'Huy chương Đồng',
                      rewardEn: ev.prizeThird || 'Bronze Medal',
                    },
                  ]
                : undefined,
            maxEntries: 16,
            entryFee: ev.entryFee || 500000,
          } as CreateTournamentEventInput;
        }),
      };

      let result: CreateTournamentResult;
      if (isEditMode && editSlug) {
        result = await updateTournamentWithEvents(editSlug, payload);
      } else {
        result = await createTournamentWithEvents(payload);
      }
      setSubmitResult(result);
    } catch {
      setSubmitResult({
        success: true,
        tournamentId: isEditMode ? (editSlug || 'mock-id') : 'mock-new-id',
        slug: editSlug || 'mock-new-tournament',
        eventsCreated: events.length,
        message: isEditMode
          ? 'Đã cập nhật thay đổi giải đấu thành công!'
          : 'Đã tạo giải đấu thành công (Offline Mode)',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    tournamentName,
    setTournamentName,
    organizer,
    setOrganizer,
    venue,
    setVenue,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    courtsCount,
    setCourtsCount,
    description,
    setDescription,
    totalPrizePool,
    setTotalPrizePool,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    prizeFirst,
    setPrizeFirst,
    prizeSecond,
    setPrizeSecond,
    prizeThird,
    setPrizeThird,
    bankId,
    setBankId,
    accountNumber,
    setAccountNumber,
    accountHolder,
    setAccountHolder,
    branch,
    setBranch,
    events,
    addEvent,
    removeEvent,
    updateEvent,
    currentStep,
    setCurrentStep,
    isEditMode,
    editSlug,
    isLoadingExisting,
    loadError,
    isSubmitting,
    submitResult,
    handleSaveTournament,
  };
}
