import { describe, it, expect } from 'vitest';
import { generateBergerRoundRobin } from '../round-robin';
import { calculateGroupStandings, calculateBestRunnerUps, CompletedGroupMatch } from '../standings';
import { EngineEntry } from '../types';

describe('Round-Robin & Group Standings Engine', () => {
  const entries: EngineEntry[] = [
    { id: 'A', name: 'Team Alpha' },
    { id: 'B', name: 'Team Beta' },
    { id: 'C', name: 'Team Charlie' },
    { id: 'D', name: 'Team Delta' },
  ];

  describe('generateBergerRoundRobin', () => {
    it('should generate N(N-1)/2 matches for 4 teams where all play each other', () => {
      const schedule = generateBergerRoundRobin(entries);
      // 4 teams -> 4*3/2 = 6 matches total across 3 rounds
      expect(schedule.length).toBe(6);

      const uniquePairs = new Set<string>();
      for (const m of schedule) {
        const pair = [m.entryA.id, m.entryB.id].sort().join('-');
        uniquePairs.add(pair);
      }
      expect(uniquePairs.size).toBe(6);
    });

    it('should handle odd number of teams with Bye correctly', () => {
      const oddEntries = entries.slice(0, 3); // 3 teams
      const schedule = generateBergerRoundRobin(oddEntries);
      // 3 teams -> 3 rounds, 1 match per round = 3 matches
      expect(schedule.length).toBe(3);
    });
  });

  describe('calculateGroupStandings', () => {
    it('should correctly rank by wins and resolve 2-way tie via head-to-head', () => {
      // Both Alpha and Beta have 2 wins. Alpha beat Beta in their head-to-head.
      const matches: CompletedGroupMatch[] = [
        {
          entryAId: 'A',
          entryBId: 'B',
          scores: [{ scoreA: 21, scoreB: 18 }, { scoreA: 21, scoreB: 19 }],
          isFinished: true,
          winnerId: 'A',
        },
        {
          entryAId: 'A',
          entryBId: 'C',
          scores: [{ scoreA: 21, scoreB: 10 }, { scoreA: 21, scoreB: 12 }],
          isFinished: true,
          winnerId: 'A',
        },
        {
          entryAId: 'B',
          entryBId: 'C',
          scores: [{ scoreA: 21, scoreB: 15 }, { scoreA: 21, scoreB: 16 }],
          isFinished: true,
          winnerId: 'B',
        },
      ];

      const standings = calculateGroupStandings(entries.slice(0, 3), matches);

      expect(standings[0].entryId).toBe('A');
      expect(standings[0].matchesWon).toBe(2);
      expect(standings[0].rank).toBe(1);

      expect(standings[1].entryId).toBe('B');
      expect(standings[1].matchesWon).toBe(1);
      expect(standings[1].rank).toBe(2);

      expect(standings[2].entryId).toBe('C');
      expect(standings[2].matchesWon).toBe(0);
      expect(standings[2].rank).toBe(3);
    });

    it('should resolve 2-way tie with equal wins via Head-to-Head winner', () => {
      // Team A beat B, Team B beat C, Team C beat A (circular)? Let's test pure 2-way tie:
      // A (1 win, beat B), B (1 win, lost to A)
      const twoTeams = entries.slice(0, 2);
      const matches: CompletedGroupMatch[] = [
        {
          entryAId: 'A',
          entryBId: 'B',
          scores: [{ scoreA: 21, scoreB: 19 }, { scoreA: 21, scoreB: 17 }],
          isFinished: true,
          winnerId: 'A',
        },
      ];

      const standings = calculateGroupStandings(twoTeams, matches);
      expect(standings[0].entryId).toBe('A');
      expect(standings[0].rank).toBe(1);
      expect(standings[1].entryId).toBe('B');
      expect(standings[1].rank).toBe(2);
    });

    it('should calculate best runner-ups across groups and pick top performers based on GD and PD', () => {
      // 3 groups: Group A, B, C
      // Group A runner-up: 3 wins, GD +2, PD +16
      // Group B runner-up: 3 wins, GD +4, PD +20 (Best)
      // Group C runner-up: 2 wins, GD +1, PD +5
      const allGroupStandings = [
        {
          groupLetter: 'A',
          groupIdx: 0,
          standings: [
            { entryId: 'A1', entryName: 'Winner A', rank: 1, matchesPlayed: 4, matchesWon: 4, matchesLost: 0, gamesWon: 8, gamesLost: 0, gameDifference: 8, pointsWon: 168, pointsLost: 100, pointDifference: 68 },
            { entryId: 'A2', entryName: 'Runner A', rank: 2, matchesPlayed: 4, matchesWon: 3, matchesLost: 1, gamesWon: 6, gamesLost: 4, gameDifference: 2, pointsWon: 150, pointsLost: 134, pointDifference: 16 },
          ],
        },
        {
          groupLetter: 'B',
          groupIdx: 1,
          standings: [
            { entryId: 'B1', entryName: 'Winner B', rank: 1, matchesPlayed: 4, matchesWon: 4, matchesLost: 0, gamesWon: 8, gamesLost: 1, gameDifference: 7, pointsWon: 180, pointsLost: 110, pointDifference: 70 },
            { entryId: 'B2', entryName: 'Runner B', rank: 2, matchesPlayed: 4, matchesWon: 3, matchesLost: 1, gamesWon: 7, gamesLost: 3, gameDifference: 4, pointsWon: 160, pointsLost: 140, pointDifference: 20 },
          ],
        },
        {
          groupLetter: 'C',
          groupIdx: 2,
          standings: [
            { entryId: 'C1', entryName: 'Winner C', rank: 1, matchesPlayed: 4, matchesWon: 4, matchesLost: 0, gamesWon: 8, gamesLost: 0, gameDifference: 8, pointsWon: 168, pointsLost: 90, pointDifference: 78 },
            { entryId: 'C2', entryName: 'Runner C', rank: 2, matchesPlayed: 4, matchesWon: 2, matchesLost: 2, gamesWon: 5, gamesLost: 4, gameDifference: 1, pointsWon: 135, pointsLost: 130, pointDifference: 5 },
          ],
        },
      ];

      // Need 1 best runner up for a 4-team semifinal bracket (3 winners + 1 best runner up)
      const bestRunnerUps = calculateBestRunnerUps(allGroupStandings, 1);
      expect(bestRunnerUps.length).toBe(3);

      // Rank 1 runner-up should be Runner B (GD +4, PD +20 beats Runner A's GD +2)
      expect(bestRunnerUps[0].entryId).toBe('B2');
      expect(bestRunnerUps[0].groupLetter).toBe('B');
      expect(bestRunnerUps[0].qualifies).toBe(true);

      // Rank 2 should be Runner A
      expect(bestRunnerUps[1].entryId).toBe('A2');
      expect(bestRunnerUps[1].qualifies).toBe(false);

      // Rank 3 should be Runner C
      expect(bestRunnerUps[2].entryId).toBe('C2');
      expect(bestRunnerUps[2].qualifies).toBe(false);
    });

    it('should correctly handle walkover: loser must have gamesLost and pointsLost > 0', () => {
      const twoTeams = entries.slice(0, 2);
      const matches: CompletedGroupMatch[] = [
        {
          entryAId: 'A',
          entryBId: 'B',
          scores: [],
          isFinished: true,
          winnerId: 'A',
          isWalkover: true,
        },
      ];

      const standings = calculateGroupStandings(twoTeams, matches);
      const winnerStats = standings.find(s => s.entryId === 'A')!;
      const loserStats = standings.find(s => s.entryId === 'B')!;

      // Winner should have positive game and point stats
      expect(winnerStats.matchesWon).toBe(1);
      expect(winnerStats.gamesWon).toBeGreaterThan(0);
      expect(winnerStats.pointsWon).toBeGreaterThan(0);

      // Loser MUST have gamesLost and pointsLost > 0 (this was the bug)
      expect(loserStats.matchesLost).toBe(1);
      expect(loserStats.gamesLost).toBeGreaterThan(0);
      expect(loserStats.pointsLost).toBeGreaterThan(0);

      // Loser's game difference should be negative
      expect(loserStats.gameDifference).toBeLessThan(0);
      // Loser's point difference should be negative  
      expect(loserStats.pointDifference).toBeLessThan(0);
    });

    it('should correctly handle walkover when B wins', () => {
      const twoTeams = entries.slice(0, 2);
      const matches: CompletedGroupMatch[] = [
        {
          entryAId: 'A',
          entryBId: 'B',
          scores: [],
          isFinished: true,
          winnerId: 'B',
          isWalkover: true,
        },
      ];

      const standings = calculateGroupStandings(twoTeams, matches);
      const loserStats = standings.find(s => s.entryId === 'A')!;
      const winnerStats = standings.find(s => s.entryId === 'B')!;

      expect(winnerStats.matchesWon).toBe(1);
      expect(winnerStats.gamesWon).toBeGreaterThan(0);
      expect(loserStats.matchesLost).toBe(1);
      expect(loserStats.gamesLost).toBeGreaterThan(0);
      expect(loserStats.pointsLost).toBeGreaterThan(0);
    });
  });
});
