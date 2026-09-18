import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAthleteRestTime,
  getCourts,
  getMatchQueue,
  dispatchMatchToCourt,
  startCourtMatch,
  finishCourtMatch,
  resetDispatcherDemo,
} from '../dispatcherService';

describe('dispatcherService', () => {
  beforeEach(() => {
    resetDispatcherDemo();
  });

  describe('checkAthleteRestTime', () => {
    it('should detect when an athlete finished a match less than 15 minutes ago', () => {
      const now = Date.now();
      const recentFinished = [
        {
          athleteNames: ['Nguyễn Văn A', 'Lê Hùng'],
          finishedAt: now - 5 * 60 * 1000, // 5 mins ago
        },
      ];

      const warning = checkAthleteRestTime(['Nguyễn Văn A', 'Trần B'], recentFinished, 15);
      expect(warning).not.toBeNull();
      expect(warning?.athleteName).toBe('Nguyễn Văn A');
      expect(warning?.minutesRemaining).toBe(10);
    });

    it('should return null when athlete has rested for more than minimum rest time', () => {
      const now = Date.now();
      const recentFinished = [
        {
          athleteNames: ['Nguyễn Văn A', 'Lê Hùng'],
          finishedAt: now - 20 * 60 * 1000, // 20 mins ago
        },
      ];

      const warning = checkAthleteRestTime(['Nguyễn Văn A', 'Trần B'], recentFinished, 15);
      expect(warning).toBeNull();
    });

    it('should return null when athlete is not in recent finished matches', () => {
      const now = Date.now();
      const recentFinished = [
        {
          athleteNames: ['Đỗ Hải', 'Mai Lan'],
          finishedAt: now - 5 * 60 * 1000,
        },
      ];

      const warning = checkAthleteRestTime(['Nguyễn Văn A'], recentFinished, 15);
      expect(warning).toBeNull();
    });
  });

  describe('getCourts & getMatchQueue', () => {
    it('should return default court and queue list', async () => {
      const courts = await getCourts(undefined, 4);
      expect(courts.length).toBe(4);
      expect(courts[0].courtNumber).toBe(1);

      const queue = await getMatchQueue();
      expect(queue.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('dispatchMatchToCourt & transitions', () => {
    it('should dispatch match to court in warmup mode', async () => {
      const res = await dispatchMatchToCourt(3, 'disp-m-4', { startWarmupImmediately: true });
      expect(res.success).toBe(true);

      const courts = await getCourts();
      const court3 = courts.find((c) => c.courtNumber === 3);
      expect(court3?.status).toBe('warmup');
      expect(court3?.currentMatch?.id).toBe('disp-m-4');
      expect(court3?.warmupSecondsLeft).toBe(120);
    });

    it('should transition from warmup to in_progress', async () => {
      await dispatchMatchToCourt(3, 'disp-m-4', { startWarmupImmediately: true });
      const resStart = await startCourtMatch(3);
      expect(resStart.success).toBe(true);

      const courts = await getCourts();
      const court3 = courts.find((c) => c.courtNumber === 3);
      expect(court3?.status).toBe('in_progress');
      expect(court3?.matchStartedAt).not.toBeNull();
    });

    it('should finish court match and make court available again', async () => {
      await dispatchMatchToCourt(3, 'disp-m-4', { startWarmupImmediately: false });
      const resFinish = await finishCourtMatch(3, { setsA: 2, setsB: 0, scoreA: 21, scoreB: 15 });
      expect(resFinish.success).toBe(true);

      const courts = await getCourts();
      const court3 = courts.find((c) => c.courtNumber === 3);
      expect(court3?.status).toBe('available');
      expect(court3?.currentMatch).toBeNull();
    });
  });
});
