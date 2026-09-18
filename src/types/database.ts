// ==============================================================================
// BADMINTON TOURNAMENT PLATFORM — DATABASE TYPES (16 TABLES)
// Corresponds directly to sql/schema.sql
// ==============================================================================

export type SportType = 'badminton';

export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'archived';

export type EventType = 'ms' | 'ws' | 'md' | 'wd' | 'xd';
export type EventFormat = 'group' | 'knockout' | 'group_knockout';

export type RegistrationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'waitlisted';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'waived';

export type EntryStatus = 'confirmed' | 'withdrawn' | 'disqualified';

export type MatchStage = 'group' | 'knockout';

export type MatchStatus =
  | 'pending'
  | 'ready'
  | 'called'
  | 'on_court'
  | 'in_progress'
  | 'completed'
  | 'walkover'
  | 'retired'
  | 'cancelled';

export type MatchResultType = 'normal' | 'walkover' | 'retired' | 'bye';

export type AthleteSkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type Gender = 'male' | 'female';

// 1. ATHLETES
export interface Athlete {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  avatar_url: string | null;
  club: string | null;
  skill_level: AthleteSkillLevel;
  bio: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

// 2. ORGANIZERS
export interface Organizer {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  verified: boolean;
  created_at: string;
}

// 3. TOURNAMENTS
export interface Tournament {
  id: string;
  organizer_id: string | null;
  name: string;
  slug: string;
  sport_type: SportType;
  description: string | null;
  venue: string | null;
  address: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  entry_fee: number;
  is_public: boolean;
  status: TournamentStatus;
  rules_config: Record<string, unknown>;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// 4. TOURNAMENT_EVENTS
export interface TournamentEvent {
  id: string;
  tournament_id: string;
  name: string;
  event_type: EventType;
  format: EventFormat;
  max_entries: number;
  registration_fee: number;
  stage_configs: Record<string, unknown>;
  created_at: string;
}

// 5. TOURNAMENT_REGISTRATIONS
export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  event_id: string;
  athlete_id: string;
  partner_id: string | null;
  partner_name: string | null;
  partner_confirmed_at: string | null;
  team_name: string;
  club: string | null;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  payment_amount: number;
  payment_ref: string | null;
  waitlist_expires_at: string | null;
  notes: string | null;
  admin_notes: string | null;
  registered_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// 6. PARTNER_INVITES
export interface PartnerInvite {
  id: string;
  registration_id: string;
  token_hash: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
}

// 7. PAYMENT_PROOFS
export interface PaymentProof {
  id: string;
  registration_id: string;
  storage_path: string;
  submitted_by: string;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

// 8. TOURNAMENT_ENTRIES
export interface TournamentEntry {
  id: string;
  tournament_id: string;
  event_id: string;
  registration_id: string | null;
  name: string;
  is_seeded: boolean;
  seed_number: number;
  club: string | null;
  status: EntryStatus;
  created_at: string;
}

// 9. TOURNAMENT_ENTRY_MEMBERS
export interface TournamentEntryMember {
  entry_id: string;
  athlete_id: string;
  member_order: 1 | 2;
}

// 10. TOURNAMENT_GROUPS
export interface TournamentGroup {
  id: string;
  tournament_id: string;
  event_id: string;
  group_name: string;
}

// 11. TOURNAMENT_GROUP_MEMBERS
export interface TournamentGroupMember {
  id: string;
  group_id: string;
  entry_id: string;
  seed_in_group: number;
}

// GameScore structure inside game_scores JSONB
export interface GameScore {
  scoreA: number;
  scoreB: number;
}

// 12. TOURNAMENT_MATCHES
export interface TournamentMatch {
  id: string;
  tournament_id: string;
  event_id: string;
  group_id: string | null;
  entry1_id: string | null;
  entry2_id: string | null;
  winner_id: string | null;
  score: string | null;
  stage: MatchStage;
  round: number;
  round_name: string | null;
  bracket_round: number | null;
  bracket_position: number;
  match_number: number;
  sets_a: number;
  sets_b: number;
  points_a: number;
  points_b: number;
  game_scores: GameScore[];
  match_time: string | null;
  court_info: string | null;
  status: MatchStatus;
  result_type: MatchResultType;
  placeholder_entry1: string | null;
  placeholder_entry2: string | null;
  notes: string | null;
  version: number;
  result_request_id: string | null;
  updated_at: string;
}

// 13. NOTIFICATIONS
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// 14. ATHLETE_STATS
export interface AthleteStats {
  id: string;
  athlete_id: string;
  tournament_id: string;
  event_id: string;
  final_ranking: string | null;
  matches_played: number;
  matches_won: number;
  games_won: number;
  games_lost: number;
  points_won: number;
  points_lost: number;
  created_at: string;
}

// 15. ACTIVITY_LOGS
export interface ActivityLog {
  id: string;
  user_id: string | null;
  tournament_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

// 16. SYSTEM_SETTINGS
export interface SystemSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      athletes: { Row: Athlete; Insert: Partial<Athlete>; Update: Partial<Athlete>; Relationships: [] };
      organizers: { Row: Organizer; Insert: Partial<Organizer>; Update: Partial<Organizer>; Relationships: [] };
      tournaments: { Row: Tournament; Insert: Partial<Tournament>; Update: Partial<Tournament>; Relationships: [] };
      tournament_events: { Row: TournamentEvent; Insert: Partial<TournamentEvent>; Update: Partial<TournamentEvent>; Relationships: [] };
      tournament_registrations: { Row: TournamentRegistration; Insert: Partial<TournamentRegistration>; Update: Partial<TournamentRegistration>; Relationships: [] };
      partner_invites: { Row: PartnerInvite; Insert: Partial<PartnerInvite>; Update: Partial<PartnerInvite>; Relationships: [] };
      payment_proofs: { Row: PaymentProof; Insert: Partial<PaymentProof>; Update: Partial<PaymentProof>; Relationships: [] };
      tournament_entries: { Row: TournamentEntry; Insert: Partial<TournamentEntry>; Update: Partial<TournamentEntry>; Relationships: [] };
      tournament_entry_members: { Row: TournamentEntryMember; Insert: Partial<TournamentEntryMember>; Update: Partial<TournamentEntryMember>; Relationships: [] };
      tournament_groups: { Row: TournamentGroup; Insert: Partial<TournamentGroup>; Update: Partial<TournamentGroup>; Relationships: [] };
      tournament_group_members: { Row: TournamentGroupMember; Insert: Partial<TournamentGroupMember>; Update: Partial<TournamentGroupMember>; Relationships: [] };
      tournament_matches: { Row: TournamentMatch; Insert: Partial<TournamentMatch>; Update: Partial<TournamentMatch>; Relationships: [] };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification>; Relationships: [] };
      athlete_stats: { Row: AthleteStats; Insert: Partial<AthleteStats>; Update: Partial<AthleteStats>; Relationships: [] };
      activity_logs: { Row: ActivityLog; Insert: Partial<ActivityLog>; Update: Partial<ActivityLog>; Relationships: [] };
      system_settings: { Row: SystemSetting; Insert: Partial<SystemSetting>; Update: Partial<SystemSetting>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      hold_registration_slot: {
        Args: {
          p_tournament_id: string;
          p_event_id: string;
          p_athlete_id: string;
          p_partner_id?: string | null;
          p_partner_name?: string | null;
          p_team_name?: string;
          p_club?: string | null;
          p_payment_amount?: number;
        };
        Returns: {
          success: boolean;
          code?: string;
          message: string;
          registration_id?: string;
          expires_at?: string;
          remaining_slots?: number;
        };
      };
      record_match_point: {
        Args: {
          p_match_id: string;
          p_point_to_team: 'a' | 'b';
          p_expected_version: number;
          p_actor_id?: string | null;
        };
        Returns: {
          success: boolean;
          code?: string;
          version?: number;
          points_a?: number;
          points_b?: number;
          sets_a?: number;
          sets_b?: number;
          game_scores?: GameScore[];
          is_set_won?: boolean;
          is_match_finished?: boolean;
          winner_id?: string | null;
          winner_team?: 'a' | 'b' | null;
          message?: string;
        };
      };
      finalize_match_result: {
        Args: {
          p_match_id: string;
          p_winner_id: string;
          p_notes?: string | null;
          p_actor_id?: string | null;
        };
        Returns: {
          success: boolean;
          code?: string;
          match_id?: string;
          status?: string;
          version?: number;
        };
      };
      calculate_club_rankings: {
        Args: {
          p_tournament_id?: string | null;
        };
        Returns: {
          rank: number;
          club_name: string;
          tournaments_count: number;
          gold_medals: number;
          silver_medals: number;
          bronze_medals: number;
          total_points: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

