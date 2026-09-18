import { describe, it, expect } from 'vitest';
import { validateGameScore, checkMatchWinner } from '../scoring';
import { StageConfig } from '../types';

describe('BWF Scoring Engine', () => {
  const standardConfig: StageConfig = {
    gamesPerMatch: 3,
    pointsPerGame: 21,
    isSuddenDeath: false,
  };

  describe('validateGameScore', () => {
    it('should validate normal winning scores', () => {
      const res1 = validateGameScore(21, 19, standardConfig);
      expect(res1.valid).toBe(true);
      expect(res1.winner).toBe('A');

      const res2 = validateGameScore(15, 21, standardConfig);
      expect(res2.valid).toBe(true);
      expect(res2.winner).toBe('B');

      const res3 = validateGameScore(21, 0, standardConfig);
      expect(res3.valid).toBe(true);
      expect(res3.winner).toBe('A');
    });

    it('should recognise in-progress scores', () => {
      expect(validateGameScore(10, 8, standardConfig)).toEqual({ valid: true });
      expect(validateGameScore(20, 20, standardConfig)).toEqual({ valid: true });
      expect(validateGameScore(21, 20, standardConfig)).toEqual({ valid: true });
      expect(validateGameScore(29, 29, standardConfig)).toEqual({ valid: true });
    });

    it('should validate deuce overtime wins by 2 points', () => {
      const res1 = validateGameScore(22, 20, standardConfig);
      expect(res1.valid).toBe(true);
      expect(res1.winner).toBe('A');

      const res2 = validateGameScore(24, 26, standardConfig);
      expect(res2.valid).toBe(true);
      expect(res2.winner).toBe('B');

      const res3 = validateGameScore(29, 27, standardConfig);
      expect(res3.valid).toBe(true);
      expect(res3.winner).toBe('A');
    });

    it('should validate cap 30 rules (both 30-28 and 30-29)', () => {
      // Law 7.3: 30-28 (reached 28-28, then won by 2 consecutive points)
      const res30_28 = validateGameScore(30, 28, standardConfig);
      expect(res30_28.valid).toBe(true);
      expect(res30_28.winner).toBe('A');

      // Law 7.4: 30-29 (golden 30th point from 29-29)
      const res30_29 = validateGameScore(29, 30, standardConfig);
      expect(res30_29.valid).toBe(true);
      expect(res30_29.winner).toBe('B');
    });

    it('should reject invalid scores at or above cap', () => {
      // 30-27 is invalid because game must finish at 29-27
      const res30_27 = validateGameScore(30, 27, standardConfig);
      expect(res30_27.valid).toBe(false);
      expect(res30_27.reason).toBeDefined();

      // Over 30 is strictly illegal under BWF Law 7
      const res31_30 = validateGameScore(31, 30, standardConfig);
      expect(res31_30.valid).toBe(false);

      const res31_29 = validateGameScore(31, 29, standardConfig);
      expect(res31_29.valid).toBe(false);
    });

    it('should reject negative scores', () => {
      expect(validateGameScore(-1, 21, standardConfig).valid).toBe(false);
      expect(validateGameScore(21, -5, standardConfig).valid).toBe(false);
    });

    it('should support sudden death configuration', () => {
      const suddenDeathConfig: StageConfig = {
        gamesPerMatch: 1,
        pointsPerGame: 31,
        isSuddenDeath: true,
      };

      const res = validateGameScore(31, 30, suddenDeathConfig);
      expect(res.valid).toBe(true);
      expect(res.winner).toBe('A');

      const invalidOver = validateGameScore(32, 30, suddenDeathConfig);
      expect(invalidOver.valid).toBe(false);
    });

    it('should reject tied scores at target in sudden death mode (e.g. 21-21)', () => {
      const suddenDeathConfig21: StageConfig = {
        gamesPerMatch: 1,
        pointsPerGame: 21,
        isSuddenDeath: true,
      };

      const res21 = validateGameScore(21, 21, suddenDeathConfig21);
      expect(res21.valid).toBe(false);
      expect(res21.reason).toBeDefined();
      expect(res21.winner).toBeUndefined();
    });

    it('should reject tied scores at target 15-15 in sudden death mode', () => {
      const suddenDeathConfig15: StageConfig = {
        gamesPerMatch: 1,
        pointsPerGame: 15,
        isSuddenDeath: true,
      };

      const res15 = validateGameScore(15, 15, suddenDeathConfig15);
      expect(res15.valid).toBe(false);
      expect(res15.reason).toBeDefined();
    });

    it('should still allow valid sudden death wins at target', () => {
      const suddenDeathConfig21: StageConfig = {
        gamesPerMatch: 1,
        pointsPerGame: 21,
        isSuddenDeath: true,
      };

      const resA = validateGameScore(21, 20, suddenDeathConfig21);
      expect(resA.valid).toBe(true);
      expect(resA.winner).toBe('A');

      const resB = validateGameScore(18, 21, suddenDeathConfig21);
      expect(resB.valid).toBe(true);
      expect(resB.winner).toBe('B');
    });
  });

  describe('checkMatchWinner', () => {
    it('should declare winner when required sets are won in Best of 3', () => {
      const result = checkMatchWinner(
        [
          { scoreA: 21, scoreB: 18 },
          { scoreA: 21, scoreB: 15 },
        ],
        standardConfig
      );

      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('A');
      expect(result.setsA).toBe(2);
      expect(result.setsB).toBe(0);
      expect(result.totalPointsA).toBe(42);
      expect(result.totalPointsB).toBe(33);
    });

    it('should handle 3-set matches properly', () => {
      const result = checkMatchWinner(
        [
          { scoreA: 21, scoreB: 18 },
          { scoreA: 19, scoreB: 21 },
          { scoreA: 22, scoreB: 24 },
        ],
        standardConfig
      );

      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('B');
      expect(result.setsA).toBe(1);
      expect(result.setsB).toBe(2);
    });

    it('should report match not finished if sets are incomplete', () => {
      const result = checkMatchWinner(
        [
          { scoreA: 21, scoreB: 18 },
          { scoreA: 15, scoreB: 21 },
          { scoreA: 14, scoreB: 12 }, // In progress
        ],
        standardConfig
      );

      expect(result.isFinished).toBe(false);
      expect(result.winner).toBeUndefined();
      expect(result.setsA).toBe(1);
      expect(result.setsB).toBe(1);
    });
  });
});
