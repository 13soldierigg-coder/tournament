import { describe, it, expect } from 'vitest';
import {
  validateGameScore,
  checkMatchWinner,
  snakeSeedGroups,
  generateGroupToKnockoutBracket,
  EngineEntry,
  SCORING_PRESETS,
} from '@/engine';

describe('Flexible Tournament Engine - Point 1: Scoring Rules', () => {
  it('validates standard BWF 3x21 (max cap 30)', () => {
    const config = SCORING_PRESETS.bwf_standard_21_30;

    // Won at 21-19
    const res1 = validateGameScore(21, 19, config);
    expect(res1.valid).toBe(true);
    expect(res1.winner).toBe('A');

    // Deuce 20-20 (in progress)
    const res2 = validateGameScore(20, 20, config);
    expect(res2.valid).toBe(true);
    expect(res2.winner).toBeUndefined();

    // Deuce won at 24-22
    const res3 = validateGameScore(22, 24, config);
    expect(res3.valid).toBe(true);
    expect(res3.winner).toBe('B');

    // Max cap won at 30-29
    const res4 = validateGameScore(30, 29, config);
    expect(res4.valid).toBe(true);
    expect(res4.winner).toBe('A');

    // Invalid score past cap (31-30)
    const res5 = validateGameScore(31, 30, config);
    expect(res5.valid).toBe(false);
  });

  it('validates fast format 3x15 (max cap 21)', () => {
    const config = SCORING_PRESETS.short_15_21;

    // Won at 15-10
    const res1 = validateGameScore(15, 10, config);
    expect(res1.valid).toBe(true);
    expect(res1.winner).toBe('A');

    // Deuce won at 17-15
    const res2 = validateGameScore(15, 17, config);
    expect(res2.valid).toBe(true);
    expect(res2.winner).toBe('B');

    // Max cap won at 21-20
    const res3 = validateGameScore(21, 20, config);
    expect(res3.valid).toBe(true);
    expect(res3.winner).toBe('A');

    // Invalid: beyond cap 21
    const res4 = validateGameScore(22, 20, config);
    expect(res4.valid).toBe(false);
  });

  it('validates sudden death single set (1 set 31 points)', () => {
    const config = SCORING_PRESETS.sudden_death_31;

    // Won at 31-30 (no deuce in sudden death)
    const res1 = validateGameScore(31, 30, config);
    expect(res1.valid).toBe(true);
    expect(res1.winner).toBe('A');

    // In progress at 30-30
    const res2 = validateGameScore(30, 30, config);
    expect(res2.valid).toBe(true);
    expect(res2.winner).toBeUndefined();

    // Invalid if exceeding target
    const res3 = validateGameScore(32, 30, config);
    expect(res3.valid).toBe(false);

    // Checks match winner for 1-set match
    const matchRes = checkMatchWinner([{ scoreA: 31, scoreB: 29 }], config);
    expect(matchRes.isFinished).toBe(true);
    expect(matchRes.winner).toBe('A');
    expect(matchRes.setsA).toBe(1);
    expect(matchRes.setsB).toBe(0);
  });
});

describe('Flexible Tournament Engine - Point 2: Seeding & Club Separation', () => {
  const entries: EngineEntry[] = [
    { id: '1', name: 'Player A', club: 'Club Alpha', seed: 1 },
    { id: '2', name: 'Player B', club: 'Club Beta', seed: 2 },
    { id: '3', name: 'Player C', club: 'Club Alpha', seed: 3 },
    { id: '4', name: 'Player D', club: 'Club Beta', seed: 4 },
    { id: '5', name: 'Player E', club: 'Club Alpha' },
    { id: '6', name: 'Player F', club: 'Club Gamma' },
    { id: '7', name: 'Player G', club: 'Club Alpha' },
    { id: '8', name: 'Player H', club: 'Club Gamma' },
  ];

  it('separates club members into different groups when possible', () => {
    const groups = snakeSeedGroups(entries, 4, { separateClubs: true });
    expect(groups).toHaveLength(4);

    // With 4 groups and 4 Club Alpha members, each group should ideally receive exactly 1 Club Alpha member
    const alphaCounts = groups.map(
      (g) => g.filter((e) => e.club === 'Club Alpha').length
    );
    expect(alphaCounts).toEqual([1, 1, 1, 1]);
  });
});

describe('Flexible Tournament Engine - Point 3: Group to Knockout Transition', () => {
  const dummySlots = [
    { groupIdx: 0, groupLetter: 'A', rank: 1, entry: { id: 'a1', name: 'A1', club: 'CLB 1' } },
    { groupIdx: 0, groupLetter: 'A', rank: 2, entry: { id: 'a2', name: 'A2', club: 'CLB 2' } },
    { groupIdx: 1, groupLetter: 'B', rank: 1, entry: { id: 'b1', name: 'B1', club: 'CLB 2' } },
    { groupIdx: 1, groupLetter: 'B', rank: 2, entry: { id: 'b2', name: 'B2', club: 'CLB 1' } },
    { groupIdx: 2, groupLetter: 'C', rank: 1, entry: { id: 'c1', name: 'C1', club: 'CLB 3' } },
    { groupIdx: 2, groupLetter: 'C', rank: 2, entry: { id: 'c2', name: 'C2', club: 'CLB 4' } },
    { groupIdx: 3, groupLetter: 'D', rank: 1, entry: { id: 'd1', name: 'D1', club: 'CLB 4' } },
    { groupIdx: 3, groupLetter: 'D', rank: 2, entry: { id: 'd2', name: 'D2', club: 'CLB 3' } },
  ];

  it('generates 2-group advancement (A1-B2, B1-A2)', () => {
    const matches = generateGroupToKnockoutBracket(2, dummySlots.slice(0, 4));
    expect(matches).toHaveLength(3); // 2 SFs + 1 Final

    // Match 1: A1 vs B2
    expect(matches[0].placeholder1).toContain('A1');
    expect(matches[0].placeholder2).toContain('B2');

    // Match 2: B1 vs A2
    expect(matches[1].placeholder1).toContain('B1');
    expect(matches[1].placeholder2).toContain('A2');
  });

  it('generates 4-group advancement with Pattern 1 (A1-B2, C1-D2 | B1-A2, D1-C2)', () => {
    const matches = generateGroupToKnockoutBracket(4, dummySlots, 'cross_p1');
    expect(matches).toHaveLength(7); // 4 QFs + 2 SFs + 1 Final

    const r1 = matches.filter((m) => m.round === 1);
    expect(r1[0].placeholder1).toBe('A1');
    expect(r1[0].placeholder2).toBe('B2');

    expect(r1[1].placeholder1).toBe('C1');
    expect(r1[1].placeholder2).toBe('D2');

    expect(r1[2].placeholder1).toBe('B1');
    expect(r1[2].placeholder2).toBe('A2');

    expect(r1[3].placeholder1).toBe('D1');
    expect(r1[3].placeholder2).toBe('C2');
  });

  it('generates 4-group advancement with Pattern 2 (A1-C2, B1-D2 | C1-A2, D1-B2)', () => {
    const matches = generateGroupToKnockoutBracket(4, dummySlots, 'cross_p2');
    const r1 = matches.filter((m) => m.round === 1);

    expect(r1[0].placeholder1).toBe('A1');
    expect(r1[0].placeholder2).toBe('C2');

    expect(r1[1].placeholder1).toBe('B1');
    expect(r1[1].placeholder2).toBe('D2');

    expect(r1[2].placeholder1).toBe('C1');
    expect(r1[2].placeholder2).toBe('A2');

    expect(r1[3].placeholder1).toBe('D1');
    expect(r1[3].placeholder2).toBe('B2');
  });

  it('generates random draw ensuring no team faces an opponent from the same group in Round 1', () => {
    for (let testRun = 0; testRun < 10; testRun++) {
      const matches = generateGroupToKnockoutBracket(4, dummySlots, 'random');
      const r1 = matches.filter((m) => m.round === 1);

      r1.forEach((m) => {
        // e.g. placeholder1 has group letter, placeholder2 has group letter
        const g1 = m.placeholder1?.[0];
        const g2 = m.placeholder2?.[0];
        // Team from group A cannot play another team from group A
        expect(g1).not.toBe(g2);
      });
    }
  });
});

describe('Flexible Tournament Engine - Point 4: Odd & Non-Power-of-2 Groups (3, 5, 6, 7 Groups)', () => {
  const createGroupSlots = (numGroups: number) => {
    const slots = [];
    for (let g = 0; g < numGroups; g++) {
      const letter = String.fromCharCode(65 + g);
      slots.push({
        groupIdx: g,
        groupLetter: letter,
        rank: 1,
        entry: { id: `${letter.toLowerCase()}1`, name: `${letter}1`, club: `Club ${letter}` },
      });
      slots.push({
        groupIdx: g,
        groupLetter: letter,
        rank: 2,
        entry: { id: `${letter.toLowerCase()}2`, name: `${letter}2`, club: `Club ${letter}_2` },
      });
    }
    return slots;
  };

  it('handles 3 groups with best_runner_ups (3 winners + 1 best 2nd = 4 teams, 2 SFs + 1 Final)', () => {
    const slots = createGroupSlots(3);
    const matches = generateGroupToKnockoutBracket(3, slots, 'cross_p1', {
      advancementRule: 'best_runner_ups',
    });

    // Bracket of 4 -> 2 Semifinals + 1 Final = 3 matches
    expect(matches).toHaveLength(3);
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(2);

    // Verify each Semifinal has no same-group clash
    r1.forEach((m) => {
      const g1 = m.placeholder1?.[0];
      const g2 = m.placeholder2?.[0];
      expect(g1).not.toBe(g2);
    });
  });

  it('handles 3 groups with all_top_two (6 teams into bracket of 8 with 2 Byes)', () => {
    const slots = createGroupSlots(3);
    const matches = generateGroupToKnockoutBracket(3, slots, 'cross_p1', {
      advancementRule: 'all_top_two',
    });

    // Bracket of 8 -> 4 QFs + 2 SFs + 1 Final = 7 matches
    expect(matches).toHaveLength(7);
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(4);

    // 2 matches have Byes, 2 matches are played
    const byeMatches = r1.filter((m) => m.placeholder1 === 'BYE' || m.placeholder2 === 'BYE');
    expect(byeMatches).toHaveLength(2);

    // Opponent of Bye is auto-advanced to round 2
    byeMatches.forEach((m) => {
      expect(m.winner).toBeDefined();
    });

    // The non-bye matches do not have same-group clashes
    const playedMatches = r1.filter((m) => m.placeholder1 !== 'BYE' && m.placeholder2 !== 'BYE');
    playedMatches.forEach((m) => {
      const g1 = m.placeholder1?.[0];
      const g2 = m.placeholder2?.[0];
      expect(g1).not.toBe(g2);
    });
  });

  it('handles 5 groups with best_runner_ups (5 winners + 3 best 2nd = 8 teams, 4 QFs, 0 Byes)', () => {
    const slots = createGroupSlots(5);
    const matches = generateGroupToKnockoutBracket(5, slots, 'cross_p1', {
      advancementRule: 'best_runner_ups',
    });

    // 8 teams -> 4 QFs + 2 SFs + 1 Final = 7 matches
    expect(matches).toHaveLength(7);
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(4);

    r1.forEach((m) => {
      const g1 = m.placeholder1?.[0];
      const g2 = m.placeholder2?.[0];
      expect(g1).not.toBe(g2);
    });
  });

  it('handles 6 groups with best_runner_ups (6 winners + 2 best 2nd = 8 teams, 4 QFs, 0 Byes)', () => {
    const slots = createGroupSlots(6);
    const matches = generateGroupToKnockoutBracket(6, slots, 'cross_p1', {
      advancementRule: 'best_runner_ups',
    });

    expect(matches).toHaveLength(7);
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(4);

    r1.forEach((m) => {
      const g1 = m.placeholder1?.[0];
      const g2 = m.placeholder2?.[0];
      expect(g1).not.toBe(g2);
    });
  });

  it('handles 7 groups with best_runner_ups (7 winners + 1 best 2nd = 8 teams, 4 QFs, 0 Byes)', () => {
    const slots = createGroupSlots(7);
    const matches = generateGroupToKnockoutBracket(7, slots, 'cross_p1', {
      advancementRule: 'best_runner_ups',
    });

    expect(matches).toHaveLength(7);
    const r1 = matches.filter((m) => m.round === 1);
    expect(r1).toHaveLength(4);

    r1.forEach((m) => {
      const g1 = m.placeholder1?.[0];
      const g2 = m.placeholder2?.[0];
      expect(g1).not.toBe(g2);
    });
  });

  it('handles serpentine snake seeding across 3, 5, 6, 7 groups', () => {
    const entries: EngineEntry[] = Array.from({ length: 21 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      seed: i + 1,
    }));

    // 3 groups
    const g3 = snakeSeedGroups(entries, 3);
    expect(g3).toHaveLength(3);
    expect(g3[0][0].name).toBe('Player 1');
    expect(g3[1][0].name).toBe('Player 2');
    expect(g3[2][0].name).toBe('Player 3');
    // Round 2 is reversed (Serpentine)
    expect(g3[2][1].name).toBe('Player 4');
    expect(g3[1][1].name).toBe('Player 5');
    expect(g3[0][1].name).toBe('Player 6');

    // 5 groups
    const g5 = snakeSeedGroups(entries, 5);
    expect(g5).toHaveLength(5);

    // 7 groups
    const g7 = snakeSeedGroups(entries, 7);
    expect(g7).toHaveLength(7);
  });
});
