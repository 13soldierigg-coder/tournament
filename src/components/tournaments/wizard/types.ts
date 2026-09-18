import { GroupAdvancementRule } from '@/engine';

export interface EventFormState {
  id: string;
  name: string;
  eventType: 'ms' | 'ws' | 'md' | 'wd' | 'xd';
  format: 'knockout' | 'group_knockout' | 'round_robin';
  groupCount: number;
  advancingPerGroup: number;
  advancementRule?: GroupAdvancementRule;
  knockoutMapping: 'cross_p1' | 'cross_p2' | 'cross_p3' | 'random';
  scoringPreset: 'bwf_standard_21_30' | 'short_15_21' | 'sudden_death_31' | 'sudden_death_21' | 'custom';
  groupScoringPreset: 'bwf_standard_21_30' | 'short_15_21' | 'sudden_death_31' | 'sudden_death_21' | 'custom';
  gamesPerMatch: 1 | 3 | 5;
  pointsPerGame: number;
  maxCapPoints: number;
  isSuddenDeath: boolean;
  separateClubsR1: boolean;
  separateClubsGroups: boolean;
  bwfSeeding: boolean;
  entryFee: number;
  hasCustomPrizes?: boolean;
  prizeFirst?: string;
  prizeSecond?: string;
  prizeThird?: string;
}

export interface TournamentWizardState {
  // Step 1: General
  tournamentName: string;
  setTournamentName: (val: string) => void;
  organizer: string;
  setOrganizer: (val: string) => void;
  venue: string;
  setVenue: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  courtsCount: number;
  setCourtsCount: (val: number) => void;
  description: string;
  setDescription: (val: string) => void;

  // Step 1: Contact & Prize
  totalPrizePool: number;
  setTotalPrizePool: (val: number) => void;
  contactPhone: string;
  setContactPhone: (val: string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  prizeFirst: string;
  setPrizeFirst: (val: string) => void;
  prizeSecond: string;
  setPrizeSecond: (val: string) => void;
  prizeThird: string;
  setPrizeThird: (val: string) => void;

  // Step 1: VietQR Bank
  bankId: string;
  setBankId: (val: string) => void;
  accountNumber: string;
  setAccountNumber: (val: string) => void;
  accountHolder: string;
  setAccountHolder: (val: string) => void;
  branch: string;
  setBranch: (val: string) => void;

  // Step 2, 3, 4: Events
  events: EventFormState[];
  addEvent: () => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<EventFormState>) => void;

  // Navigation & Submission
  currentStep: 1 | 2 | 3 | 4;
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void;
  isEditMode: boolean;
  editSlug: string | null;
  isLoadingExisting: boolean;
  loadError: string | null;
  isSubmitting: boolean;
  submitResult: any;
  handleSaveTournament: () => Promise<void>;
}
