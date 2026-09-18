export interface GameScore {
  scoreA: number;
  scoreB: number;
}

export interface StageConfig {
  gamesPerMatch: 1 | 3 | 5;
  pointsPerGame: number;
  isSuddenDeath: boolean;
  maxCapPoints?: number;
}

export type ScoringPreset =
  | 'bwf_standard_21_30'
  | 'short_15_21'
  | 'sudden_death_31'
  | 'sudden_death_21'
  | 'custom';

export type EventFormat = 'knockout' | 'group_knockout' | 'round_robin';

export type GroupAdvancementRule =
  | 'best_runner_ups' // Nhất bảng + N đội Nhì tốt nhất để đủ nhánh chuẩn 4, 8, 16 (Không cần Bye)
  | 'all_top_two'     // Lấy trọn Nhất & Nhì mỗi bảng (nhánh luỹ thừa 2 kế tiếp có suất Bye)
  | 'winners_only';   // Chỉ lấy Nhất mỗi bảng (nhánh luỹ thừa 2 kế tiếp có suất Bye)

export type KnockoutMappingMode =
  | 'cross_p1'
  | 'cross_p2'
  | 'cross_p3'
  | 'random'
  | 'seeded';

export interface DrawRulesConfig {
  separateClubsInKnockoutRound1: boolean;
  separateClubsInGroups: boolean;
  bwfSeedPlacement: boolean;
  seedCount: number;
}

export interface TournamentEventConfig {
  format: EventFormat;
  groupCount: number;
  advancingPerGroup: number;
  advancementRule?: GroupAdvancementRule;
  knockoutMapping: KnockoutMappingMode;
  stageConfigs: Record<string, StageConfig>;
  drawRules: DrawRulesConfig;
}

export interface EngineMatchWinner {
  isFinished: boolean;
  winner?: 'A' | 'B';
  setsA: number;
  setsB: number;
  totalPointsA: number;
  totalPointsB: number;
}

export interface EngineEntry {
  id: string;
  name: string;
  club?: string | null;
  seed?: number;
}

export interface EngineBracketMatch {
  round: number; // 1-indexed: 1, 2, 3...
  position: number; // 0-indexed position within the round
  matchNumber: number;
  entry1?: EngineEntry;
  entry2?: EngineEntry;
  winner?: EngineEntry;
  placeholder1?: string;
  placeholder2?: string;
  feederMatch1Number?: number;
  feederMatch2Number?: number;
}

export interface GroupStanding {
  entryId: string;
  entryName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  pointsWon: number;
  pointsLost: number;
  pointDifference: number;
  rank: number;
}
