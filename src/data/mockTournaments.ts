export interface EventPrizeItem {
  titleVi: string;
  titleEn: string;
  rewardVi: string;
  rewardEn: string;
}

export interface MockEvent {
  id: string;
  nameVi: string;
  nameEn: string;
  eventType: 'ms' | 'ws' | 'md' | 'wd' | 'xd';
  maxEntries: number;
  currentEntries: number;
  entryFee: number; // in VND
  format?: 'knockout' | 'group_knockout' | 'round_robin';
  groupCount?: number;
  advancingPerGroup?: number;
  advancementRule?: string;
  knockoutMapping?: string;
  stageConfigs?: Record<string, any>;
  drawRules?: Record<string, any>;
  prizeStructure?: EventPrizeItem[];
}

export interface MockPodium {
  eventVi: string;
  eventEn: string;
  gold: { team: string; clubVi: string; clubEn: string };
  silver: { team: string; clubVi: string; clubEn: string };
  bronze: { team: string; clubVi: string; clubEn: string };
}

export interface MockLiveMatch {
  court: number;
  matchNumber: number;
  roundVi: string;
  roundEn: string;
  eventVi: string;
  eventEn: string;
  teamA: string;
  teamB: string;
  clubA: string;
  clubB: string;
  currentScoreA: number;
  currentScoreB: number;
  currentSet: number;
  setsA: number;
  setsB: number;
}

export interface MockTournament {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  organizerVi: string;
  organizerEn: string;
  organizerId?: string;
  status: 'in_progress' | 'registration_open' | 'registration_closed' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  venueVi: string;
  venueEn: string;
  addressVi: string;
  addressEn: string;
  totalPrizePool: number; // in VND
  descriptionVi: string;
  descriptionEn: string;
  regulationsVi: string[];
  regulationsEn: string[];
  prizeStructure: {
    titleVi: string;
    titleEn: string;
    rewardVi: string;
    rewardEn: string;
  }[];
  events: MockEvent[];
  liveMatches?: MockLiveMatch[];
  podium?: MockPodium[];
  bankAccount?: TournamentBankAccount;
  contactPhone?: string;
  contactEmail?: string;
  courtsCount?: number;
}

export interface TournamentBankAccount {
  bankId: string; // 'MB', 'VCB', 'TCB', 'BIDV', 'ICB', 'VPB', 'ACB', 'TPB'
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
}

export const SUPPORTED_BANKS: { id: string; name: string; shortName: string }[] = [
  { id: 'MB', name: 'MBBank - Ngân hàng Quân Đội', shortName: 'MB' },
  { id: 'VCB', name: 'Vietcombank - Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { id: 'TCB', name: 'Techcombank - Kỹ Thương Việt Nam', shortName: 'Techcombank' },
  { id: 'BIDV', name: 'BIDV - Đầu tư và Phát triển', shortName: 'BIDV' },
  { id: 'ICB', name: 'VietinBank - Công Thương Việt Nam', shortName: 'VietinBank' },
  { id: 'VPB', name: 'VPBank - Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { id: 'ACB', name: 'ACB - Á Châu', shortName: 'ACB' },
  { id: 'TPB', name: 'TPBank - Tiên Phong', shortName: 'TPBank' },
];

export interface MockClubRanking {
  rank: number;
  nameVi: string;
  nameEn: string;
  tournamentsCount: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  totalPoints: number;
}

export interface MockAthleteRanking {
  rank: number;
  name: string;
  clubVi: string;
  clubEn: string;
  tournamentsCount: number;
  matchesWon: number;
  matchesPlayed: number;
  winRate: number; // e.g. 86
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
}

export const MOCK_TOURNAMENTS: MockTournament[] = [];

export const MOCK_CLUB_RANKINGS: MockClubRanking[] = [];

export const MOCK_ATHLETE_RANKINGS: MockAthleteRanking[] = [];
