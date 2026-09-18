import { Athlete, TournamentEvent, TournamentRegistration } from './database';

export interface AthletePublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  club: string | null;
}

export interface CreateRegistrationInput {
  tournamentId: string;
  eventId: string;
  athleteId: string;
  partnerId?: string | null;
  partnerName?: string | null;
  teamName: string;
  club?: string | null;
  notes?: string | null;
}

export interface RegistrationWithDetails extends TournamentRegistration {
  event?: TournamentEvent;
  athlete?: Athlete;
  partner?: Athlete | null;
}

export interface SyncFlushResult {
  synced: number;
  conflicts: string[];
}
