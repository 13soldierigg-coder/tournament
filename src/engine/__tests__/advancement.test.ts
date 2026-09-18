import { describe, it, expect } from 'vitest';
import { advanceBracketWinner, cascadeRollbackMatch, generateGroupToKnockoutBracket, buildKnockoutFromSlots, type GroupAdvancementSlot } from '../advancement';
import { generateKnockoutBracket } from '../bracket';
import { EngineEntry } from '../types';

describe('Bracket Advancement & Rollback Engine', () => {
  const entries: EngineEntry[] = [
    { id: '1', name: 'Player 1' },
    { id: '2', name: 'Player 2' },
    { id: '3', name: 'Player 3' },
    { id: '4', name: 'Player 4' },
  ];

  it('should advance winner into next round correctly', () => {
    let matches = generateKnockoutBracket(entries);

    // Round 1 has 2 matches (pos 0 and pos 1).
    // Round 2 has 1 match (pos 0).
    const winnerR1_0 = entries[0];
    matches = advanceBracketWinner(matches, 1, 0, winnerR1_0);

    const finalMatch = matches.find((m) => m.round === 2 && m.position === 0);
    expect(finalMatch?.entry1?.id).toBe('1');
    expect(finalMatch?.entry2).toBeUndefined();

    const winnerR1_1 = entries[2];
    matches = advanceBracketWinner(matches, 1, 1, winnerR1_1);
    const updatedFinal = matches.find((m) => m.round === 2 && m.position === 0);
    expect(updatedFinal?.entry1?.id).toBe('1');
    expect(updatedFinal?.entry2?.id).toBe('3');
  });

  it('should cascade rollback when a match result is cancelled', () => {
    let matches = generateKnockoutBracket(entries);

    // Advance Round 1 winners to Final
    matches = advanceBracketWinner(matches, 1, 0, entries[0]);
    matches = advanceBracketWinner(matches, 1, 1, entries[2]);

    // Advance Final winner
    matches = advanceBracketWinner(matches, 2, 0, entries[0]);

    const finalMatchBefore = matches.find((m) => m.round === 2 && m.position === 0);
    expect(finalMatchBefore?.winner?.id).toBe('1');

    // Now dispute/rollback Round 1 match 0
    matches = cascadeRollbackMatch(matches, 1, 0);

    const r1_0 = matches.find((m) => m.round === 1 && m.position === 0);
    expect(r1_0?.winner).toBeUndefined();

    const finalMatchAfter = matches.find((m) => m.round === 2 && m.position === 0);
    // entry1 in final must be removed
    expect(finalMatchAfter?.entry1).toBeUndefined();
    // And final winner must be wiped because the winner came from that invalid branch!
    expect(finalMatchAfter?.winner).toBeUndefined();
    // But entry2 (Player 3) should still remain
    expect(finalMatchAfter?.entry2?.id).toBe('3');
  });

  describe('all_top_two advancement with multiple groups', () => {
    function makeQualifiedTeams(numGroups: number): GroupAdvancementSlot[] {
      const teams: GroupAdvancementSlot[] = [];
      for (let g = 0; g < numGroups; g++) {
        const letter = String.fromCharCode(65 + g);
        // 1st place
        teams.push({
          groupIdx: g,
          groupLetter: letter,
          rank: 1,
          entry: { id: `${letter}1`, name: `Winner ${letter}` },
          standing: {
            entryId: `${letter}1`, entryName: `Winner ${letter}`, rank: 1,
            matchesPlayed: 3, matchesWon: 3, matchesLost: 0,
            gamesWon: 6, gamesLost: 1, gameDifference: 5,
            pointsWon: 126, pointsLost: 80, pointDifference: 46,
          },
        });
        // 2nd place
        teams.push({
          groupIdx: g,
          groupLetter: letter,
          rank: 2,
          entry: { id: `${letter}2`, name: `Runner ${letter}` },
          standing: {
            entryId: `${letter}2`, entryName: `Runner ${letter}`, rank: 2,
            matchesPlayed: 3, matchesWon: 2, matchesLost: 1,
            gamesWon: 4, gamesLost: 3, gameDifference: 1,
            pointsWon: 110, pointsLost: 100, pointDifference: 10,
          },
        });
      }
      return teams;
    }

    it('should NOT crash with 5 groups using all_top_two', () => {
      const teams = makeQualifiedTeams(5);
      expect(() => {
        generateGroupToKnockoutBracket(5, teams, 'cross_p1', { separateClubs: false, advancementRule: 'all_top_two' });
      }).not.toThrow();
    });

    it('should NOT crash with 6 groups using all_top_two', () => {
      const teams = makeQualifiedTeams(6);
      expect(() => {
        generateGroupToKnockoutBracket(6, teams, 'cross_p1', { separateClubs: false, advancementRule: 'all_top_two' });
      }).not.toThrow();
    });

    it('should NOT crash with 7 groups using all_top_two', () => {
      const teams = makeQualifiedTeams(7);
      expect(() => {
        generateGroupToKnockoutBracket(7, teams, 'cross_p1', { separateClubs: false, advancementRule: 'all_top_two' });
      }).not.toThrow();
    });

    it('should produce correct bracket size for 5 groups (10 teams -> 16 bracket)', () => {
      const teams = makeQualifiedTeams(5);
      const bracket = generateGroupToKnockoutBracket(5, teams, 'cross_p1', { separateClubs: false, advancementRule: 'all_top_two' });
      // 16-bracket has 8 R1 matches + 4 R2 + 2 R3 + 1 R4 = 15 matches
      expect(bracket.length).toBe(15);
    });

    it('should place all 10 teams into the bracket', () => {
      const teams = makeQualifiedTeams(5);
      const bracket = generateGroupToKnockoutBracket(5, teams, 'cross_p1', { separateClubs: false, advancementRule: 'all_top_two' });
      // Collect all team IDs placed in R1
      const r1Matches = bracket.filter(m => m.round === 1);
      const placedIds = new Set<string>();
      for (const match of r1Matches) {
        if (match.entry1) placedIds.add(match.entry1.id);
        if (match.entry2) placedIds.add(match.entry2.id);
      }
      // All 10 teams should be placed
      expect(placedIds.size).toBe(10);
    });
  });
});
