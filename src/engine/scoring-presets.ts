import { StageConfig, ScoringPreset } from './types';

export const SCORING_PRESETS: Record<Exclude<ScoringPreset, 'custom'>, StageConfig> = {
  bwf_standard_21_30: {
    gamesPerMatch: 3,
    pointsPerGame: 21,
    maxCapPoints: 30,
    isSuddenDeath: false,
  },
  short_15_21: {
    gamesPerMatch: 3,
    pointsPerGame: 15,
    maxCapPoints: 21,
    isSuddenDeath: false,
  },
  sudden_death_31: {
    gamesPerMatch: 1,
    pointsPerGame: 31,
    maxCapPoints: 31,
    isSuddenDeath: true,
  },
  sudden_death_21: {
    gamesPerMatch: 1,
    pointsPerGame: 21,
    maxCapPoints: 21,
    isSuddenDeath: true,
  },
};

export function getStageConfigFromPreset(
  preset: ScoringPreset,
  customConfig?: Partial<StageConfig>
): StageConfig {
  if (preset === 'custom') {
    return {
      gamesPerMatch: customConfig?.gamesPerMatch ?? 3,
      pointsPerGame: customConfig?.pointsPerGame ?? 21,
      maxCapPoints: customConfig?.maxCapPoints ?? 30,
      isSuddenDeath: customConfig?.isSuddenDeath ?? false,
    };
  }
  return { ...SCORING_PRESETS[preset] };
}
