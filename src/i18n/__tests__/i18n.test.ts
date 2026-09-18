import { describe, it, expect } from 'vitest';
import { vi } from '../dictionaries/vi';
import { en } from '../dictionaries/en';

function compareObjectKeys(objA: Record<string, any>, objB: Record<string, any>, path = ''): string[] {
  const missingKeys: string[] = [];

  for (const key of Object.keys(objA)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in objB)) {
      missingKeys.push(currentPath);
    } else if (
      typeof objA[key] === 'object' &&
      objA[key] !== null &&
      !Array.isArray(objA[key])
    ) {
      missingKeys.push(...compareObjectKeys(objA[key], objB[key], currentPath));
    }
  }

  return missingKeys;
}

describe('i18n Dictionary Integrity', () => {
  it('should have 100% key symmetry between Vietnamese and English dictionaries', () => {
    const missingInEn = compareObjectKeys(vi, en);
    const missingInVi = compareObjectKeys(en, vi);

    expect(missingInEn, `Keys missing in English: ${missingInEn.join(', ')}`).toEqual([]);
    expect(missingInVi, `Keys missing in Vietnamese: ${missingInVi.join(', ')}`).toEqual([]);
  });

  it('should have valid string outputs for round generator functions', () => {
    expect(vi.rounds.roundNumber(2)).toBe('Vòng 2');
    expect(en.rounds.roundNumber(2)).toBe('Round 2');
  });

  it('should have valid string outputs for quota generator functions', () => {
    expect(vi.registration.remainingSlots(3)).toContain('3');
    expect(en.registration.remainingSlots(3)).toContain('3');
  });

  it('should have valid string outputs for draw and scoring generator functions', () => {
    expect(vi.draw.winnerOfMatch(5)).toBe('Thắng Trận 5');
    expect(en.draw.winnerOfMatch(5)).toBe('Winner of Match 5');

    expect(vi.draw.groupTitle('A')).toBe('Bảng A');
    expect(en.draw.groupTitle('A')).toBe('Group A');

    expect(vi.draw.matchCount(4)).toBe('4 trận đấu');
    expect(en.draw.matchCount(1)).toBe('1 match');
    expect(en.draw.matchCount(4)).toBe('4 matches');

    expect(vi.scoring.courtBadge(1)).toBe('SÂN 1');
    expect(en.scoring.courtBadge(1)).toBe('COURT 1');
  });
});
