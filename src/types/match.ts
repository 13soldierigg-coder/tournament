import { GameScore, MatchResultType, MatchStage, MatchStatus, TournamentMatch } from './database';

export interface MatchScoreSnapshotInput {
  gameScores: GameScore[];
  currentSet: number;
  pointsA: number;
  pointsB: number;
  setsA: number;
  setsB: number;
  serverEntryId?: string;
  courtSideA?: 'left' | 'right';
  expectedVersion: number;
  requestId: string;
}

export interface FinalizeMatchInput {
  gameScores: GameScore[];
  winnerId: string;
  expectedVersion: number;
  requestId: string;
  resultType?: MatchResultType;
  notes?: string;
}

export interface RevertMatchInput {
  expectedVersion: number;
  requestId: string;
}

export interface MatchScoreCorrectionInput {
  reportedScores: GameScore[];
  reason: string;
  localVersion: number;
}

export interface MatchWithEntries extends TournamentMatch {
  entry1?: {
    id: string;
    name: string;
    club: string | null;
    seedNumber: number;
    members?: { id: string; fullName: string; displayName: string | null }[];
  } | null;
  entry2?: {
    id: string;
    name: string;
    club: string | null;
    seedNumber: number;
    members?: { id: string; fullName: string; displayName: string | null }[];
  } | null;
  winner?: {
    id: string;
    name: string;
  } | null;
}
