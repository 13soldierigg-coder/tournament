import { EventFormat, EventType, Tournament, TournamentEvent } from './database';

import type { StageConfig } from '../engine/types';
export type { StageConfig };

export interface KnockoutRuleConfig extends StageConfig {
  hasThirdPlaceMatch: boolean;
  seedingMode: 'bwf' | 'random';
}

export interface GroupRuleConfig extends StageConfig {
  advancePerGroup: number;
  pattern: 'firstA_secondB' | 'random_draw';
}

export interface TournamentWithEvents extends Tournament {
  events: TournamentEvent[];
}

export interface CreateTournamentInput {
  name: string;
  slug?: string;
  organizerId?: string;
  organizer_id?: string;
  sport_type?: 'badminton';
  description?: string;
  venue?: string;
  address?: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  entry_fee?: number;
  is_public?: boolean;
  rules_config?: Record<string, unknown>;
  timezone?: string;
  events?: {
    name: string;
    event_type: EventType;
    format: EventFormat;
    max_entries: number;
    registration_fee: number;
    stage_configs: Record<string, unknown>;
  }[];
}
