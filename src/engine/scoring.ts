import { GameScore, StageConfig, EngineMatchWinner } from './types';

export interface ScoreValidationResult {
  valid: boolean;
  reason?: string;
  winner?: 'A' | 'B';
}

/**
 * Validates a single game score according to BWF rules and stage configuration.
 *
 * BWF Scoring Rules:
 * - A game is won by the first side to reach pointsPerGame (normally 21), leading by at least 2 points.
 * - If score reaches (pointsPerGame - 1) tied (e.g. 20-20), side gaining a 2-point lead wins.
 * - Maximum cap: For standard 21-point game, max score is 30 (cap = pointsPerGame + 9).
 *   At 29-29, the side scoring the 30th point wins (Law 7.4). Thus 30-29 and 30-28 are valid winning scores.
 *   30-27 or lower is INVALID because game must have concluded at 29-27 or earlier.
 *   Scores beyond cap (e.g. 31-30) are INVALID.
 * - If isSuddenDeath is true, no deuce applies at cap, or game ends immediately upon reaching pointsPerGame.
 */
export function validateGameScore(
  scoreA: number,
  scoreB: number,
  config: StageConfig
): ScoreValidationResult {
  if (scoreA < 0 || scoreB < 0 || !Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    return { valid: false, reason: 'Invalid score (must be non-negative integers)' };
  }

  const { pointsPerGame, isSuddenDeath } = config;
  const maxCap =
    config.maxCapPoints ??
    (pointsPerGame === 21 ? 30 : pointsPerGame === 15 ? 21 : pointsPerGame + 9);

  // Check scores exceeding cap
  if (!isSuddenDeath && (scoreA > maxCap || scoreB > maxCap)) {
    return { valid: false, reason: `Score exceeds maximum allowed cap (${maxCap})` };
  }

  const maxScore = Math.max(scoreA, scoreB);
  const minScore = Math.min(scoreA, scoreB);
  const diff = maxScore - minScore;
  // If scores are tied, there is no winner yet
  const candidateWinner: 'A' | 'B' | null = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null;

  // If match hasn't reached target points
  if (maxScore < pointsPerGame) {
    return { valid: true }; // In-progress game
  }

  // Sudden death mode (first to target wins)
  if (isSuddenDeath) {
    if (maxScore === pointsPerGame) {
      if (candidateWinner === null) {
        // Tied at target is impossible in sudden death — invalid state
        return { valid: false, reason: `Scores cannot be tied at ${pointsPerGame} in Sudden Death mode` };
      }
      return { valid: true, winner: candidateWinner };
    }
    if (maxScore > pointsPerGame) {
      return { valid: false, reason: `Sudden Death mode concludes at ${pointsPerGame}` };
    }
    return { valid: true };
  }

  // Standard BWF Deuce & Cap Logic
  // Case 1: Won exactly at target without deuce (e.g. 21-19, 21-0)
  if (maxScore === pointsPerGame) {
    if (diff >= 2) {
      return { valid: true, winner: candidateWinner! };
    }
    // 21-20 is still in progress (needs 2-point lead or reach 30)
    return { valid: true };
  }

  // Case 2: In deuce overtime between (target + 1) and (maxCap - 1)
  if (maxScore > pointsPerGame && maxScore < maxCap) {
    if (diff === 2) {
      // Won by 2-point lead (e.g. 22-20, 23-21, 29-27)
      return { valid: true, winner: candidateWinner! };
    }
    if (diff <= 1) {
      // E.g. 22-22 (diff 0), 22-21 (diff 1), 29-29 (diff 0): Still in progress
      return { valid: true };
    }
    // E.g. 24-20: Invalid because game ended at 22-20
    return { valid: false, reason: `Game must conclude when a 2-point lead is reached at ${maxScore - 1}-${minScore}` };
  }

  // Case 3: Reached maxCap (e.g. 30 in 21-point game)
  if (maxScore === maxCap) {
    if (diff === 1) {
      // Law 7.4: 30-29 sudden death at 29-29
      return { valid: true, winner: candidateWinner! };
    }
    if (diff === 2) {
      // Law 7.3: 30-28 won by 2 consecutive points from 28-28
      return { valid: true, winner: candidateWinner! };
    }
    // diff >= 3 (e.g. 30-27) is invalid because it should have ended at 29-27
    return { valid: false, reason: `At cap ${maxCap}, score is only valid at ${maxCap}-${maxCap - 1} or ${maxCap}-${maxCap - 2}` };
  }

  return { valid: false, reason: 'Invalid score according to BWF Law 7' };
}

/**
 * Calculates the current match winner and set tallies from completed game scores.
 */
export function checkMatchWinner(
  gameScores: GameScore[],
  config: StageConfig
): EngineMatchWinner {
  const setsNeeded = Math.floor(config.gamesPerMatch / 2) + 1;
  let setsA = 0;
  let setsB = 0;
  let totalPointsA = 0;
  let totalPointsB = 0;

  for (const game of gameScores) {
    totalPointsA += game.scoreA;
    totalPointsB += game.scoreB;

    const validation = validateGameScore(game.scoreA, game.scoreB, config);
    if (validation.valid && validation.winner) {
      if (validation.winner === 'A') setsA++;
      else setsB++;
    }
  }

  const isFinished = setsA >= setsNeeded || setsB >= setsNeeded;
  const winner = setsA >= setsNeeded ? 'A' : setsB >= setsNeeded ? 'B' : undefined;

  return {
    isFinished,
    winner,
    setsA,
    setsB,
    totalPointsA,
    totalPointsB,
  };
}
