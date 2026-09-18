import { describe, it, expect } from 'vitest';
import { generateKnockoutBracket, getNextPowerOf2 } from '../bracket';
import { generateSeedPositions, snakeSeedGroups } from '../seeding';
import { EngineEntry } from '../types';

describe('BWF Bracket & Seeding Engine', () => {
  describe('getNextPowerOf2', () => {
    it('should calculate correct power of 2 bounds', () => {
      expect(getNextPowerOf2(1)).toBe(2);
      expect(getNextPowerOf2(2)).toBe(2);
      expect(getNextPowerOf2(3)).toBe(4);
      expect(getNextPowerOf2(4)).toBe(4);
      expect(getNextPowerOf2(5)).toBe(8);
      expect(getNextPowerOf2(14)).toBe(16);
      expect(getNextPowerOf2(17)).toBe(32);
    });
  });

  describe('generateSeedPositions', () => {
    it('should place seeds in correct quarters for 8-draw', () => {
      const positions = generateSeedPositions(8);
      // Seed 1 is always at position 1 (top of bracket)
      expect(positions[0]).toBe(1);
      // Seed 2 is always at position 8 (bottom of bracket)
      expect(positions[1]).toBe(8);
      // Seed 3 and 4 are in opposite quarters (positions 4 and 5)
      expect([positions[2], positions[3]].sort((a, b) => a - b)).toEqual([4, 5]);
    });
  });

  describe('generateKnockoutBracket', () => {
    it('should generate an 8-draw bracket with byes and auto-advance seeds', () => {
      const entries: EngineEntry[] = [
        { id: '1', name: 'Nguyễn Văn A', seed: 1 },
        { id: '2', name: 'Trần Thị B', seed: 2 },
        { id: '3', name: 'Lê Văn C', seed: 3 },
        { id: '4', name: 'Phạm Đức D', seed: 4 },
        { id: '5', name: 'Vũ Quốc E' },
        { id: '6', name: 'Đỗ Hoàng F' },
      ]; // 6 entries -> 8 draw -> 2 byes

      const matches = generateKnockoutBracket(entries);

      // 8-draw has: 4 matches in R1, 2 matches in R2, 1 final = 7 matches
      expect(matches.length).toBe(7);

      const r1 = matches.filter((m) => m.round === 1);
      expect(r1.length).toBe(4);

      const r2 = matches.filter((m) => m.round === 2);
      expect(r2.length).toBe(2);

      const r3 = matches.filter((m) => m.round === 3);
      expect(r3.length).toBe(1);

      // Check Seed 1 and Seed 2 have auto-advanced because of byes
      const seed1Match = r1.find((m) => m.entry1?.id === '1' || m.entry2?.id === '1');
      expect(seed1Match?.winner?.id).toBe('1');

      const seed2Match = r1.find((m) => m.entry1?.id === '2' || m.entry2?.id === '2');
      expect(seed2Match?.winner?.id).toBe('2');

      // Round 2 should already contain Seed 1 and Seed 2
      const seed1InR2 = r2.some((m) => m.entry1?.id === '1' || m.entry2?.id === '1');
      expect(seed1InR2).toBe(true);

      const seed2InR2 = r2.some((m) => m.entry1?.id === '2' || m.entry2?.id === '2');
      expect(seed2InR2).toBe(true);
    });
  });

  describe('snakeSeedGroups', () => {
    it('should snake-distribute seeded players across groups', () => {
      const entries: EngineEntry[] = [
        { id: '1', name: 'Player 1', seed: 1 },
        { id: '2', name: 'Player 2', seed: 2 },
        { id: '3', name: 'Player 3', seed: 3 },
        { id: '4', name: 'Player 4', seed: 4 },
        { id: '5', name: 'Player 5', seed: 5 },
        { id: '6', name: 'Player 6', seed: 6 },
      ];

      // 2 groups:
      // Round 1: G1 gets seed 1, G2 gets seed 2
      // Round 2: G2 gets seed 3, G1 gets seed 4
      // Round 3: G1 gets seed 5, G2 gets seed 6
      const groups = snakeSeedGroups(entries, 2);
      expect(groups.length).toBe(2);

      expect(groups[0].map((e) => e.seed)).toEqual([1, 4, 5]);
      expect(groups[1].map((e) => e.seed)).toEqual([2, 3, 6]);
    });
  });
});
