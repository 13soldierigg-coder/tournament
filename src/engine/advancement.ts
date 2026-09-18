import { EngineBracketMatch, EngineEntry, GroupStanding, GroupAdvancementRule } from './types';
import { getNextPowerOf2 } from './bracket';

/**
 * Advances the winner of a match into the appropriate slot of the next round.
 *
 * Advancement mapping:
 * - Next Round = current.round + 1
 * - Next Position = Math.floor(current.position / 2)
 * - If current.position is even -> entry1 of next match
 * - If current.position is odd -> entry2 of next match
 */
export function advanceBracketWinner(
  matches: EngineBracketMatch[],
  round: number,
  position: number,
  winner: EngineEntry
): EngineBracketMatch[] {
  // Deep copy matches to maintain purity
  const updatedMatches = matches.map((m) => ({ ...m }));

  // Set winner in current match
  const currentMatch = updatedMatches.find(
    (m) => m.round === round && m.position === position
  );
  if (!currentMatch) return updatedMatches;

  currentMatch.winner = winner;

  // Find next round match
  const nextRound = round + 1;
  const nextPos = Math.floor(position / 2);
  const nextMatch = updatedMatches.find(
    (m) => m.round === nextRound && m.position === nextPos
  );

  if (nextMatch) {
    if (position % 2 === 0) {
      nextMatch.entry1 = winner;
    } else {
      nextMatch.entry2 = winner;
    }
  }

  return updatedMatches;
}

/**
 * Rolls back a match result and cascades the removal of that participant
 * through all subsequent rounds to prevent orphaned or invalid downstream matches.
 */
export function cascadeRollbackMatch(
  matches: EngineBracketMatch[],
  round: number,
  position: number
): EngineBracketMatch[] {
  const updatedMatches = matches.map((m) => ({ ...m }));

  function rollbackRecursive(r: number, p: number) {
    const targetMatch = updatedMatches.find((m) => m.round === r && m.position === p);
    if (!targetMatch) return;

    const previousWinner = targetMatch.winner;
    targetMatch.winner = undefined;

    // Check next round
    const nextRound = r + 1;
    const nextPos = Math.floor(p / 2);
    const nextMatch = updatedMatches.find(
      (m) => m.round === nextRound && m.position === nextPos
    );

    if (nextMatch) {
      let changed = false;
      if (p % 2 === 0 && nextMatch.entry1) {
        nextMatch.entry1 = undefined;
        changed = true;
      } else if (p % 2 === 1 && nextMatch.entry2) {
        nextMatch.entry2 = undefined;
        changed = true;
      }

      // If next match had already completed with the rolled back participant, cascade further
      if (changed && nextMatch.winner && previousWinner && nextMatch.winner.id === previousWinner.id) {
        rollbackRecursive(nextRound, nextPos);
      }
    }
  }

  rollbackRecursive(round, position);
  return updatedMatches;
}

export interface GroupAdvancementSlot {
  groupIdx: number;
  groupLetter: string;
  rank: number; // 1 = 1st, 2 = 2nd, 3 = 3rd...
  entry?: EngineEntry;
  standing?: GroupStanding;
}

export interface GroupToKnockoutPairing {
  matchIndex: number;
  team1: GroupAdvancementSlot;
  team2: GroupAdvancementSlot;
}

/**
 * Helper to build a multi-round single-elimination bracket from a list of slots.
 * Automatically supports 'BYE' slots and advances opposing entries into Round 2.
 */
export function buildKnockoutFromSlots(
  slots: (GroupAdvancementSlot | 'BYE')[],
  startMatchNumber: number = 1
): EngineBracketMatch[] {
  const bracketSize = slots.length;
  if (bracketSize < 2 || (bracketSize & (bracketSize - 1)) !== 0) {
    throw new Error('Bracket size must be a power of 2 (at least 2)');
  }
  const totalRounds = Math.log2(bracketSize);
  const allMatches: EngineBracketMatch[] = [];
  let matchCounter = startMatchNumber;

  // Round 1
  const round1Matches: EngineBracketMatch[] = [];
  const numR1 = bracketSize / 2;

  for (let pos = 0; pos < numR1; pos++) {
    const s1 = slots[pos * 2];
    const s2 = slots[pos * 2 + 1];

    const isBye1 = s1 === 'BYE';
    const isBye2 = s2 === 'BYE';

    const e1 = isBye1 ? undefined : s1.entry;
    const e2 = isBye2 ? undefined : s2.entry;

    const ph1 = isBye1
      ? 'BYE'
      : s1.entry?.name ||
        (s1.rank === 1
          ? `Nhất ${s1.groupLetter}`
          : s1.rank === 2
          ? `Nhì ${s1.groupLetter}`
          : `Hạng ${s1.rank} ${s1.groupLetter}`);

    const ph2 = isBye2
      ? 'BYE'
      : s2.entry?.name ||
        (s2.rank === 1
          ? `Nhất ${s2.groupLetter}`
          : s2.rank === 2
          ? `Nhì ${s2.groupLetter}`
          : `Hạng ${s2.rank} ${s2.groupLetter}`);

    const match: EngineBracketMatch = {
      round: 1,
      position: pos,
      matchNumber: matchCounter++,
      entry1: e1,
      entry2: e2,
      placeholder1: ph1,
      placeholder2: ph2,
    };

    // Auto-advance if one side is BYE
    if (isBye1 && !isBye2 && e2) {
      match.winner = e2;
    } else if (isBye2 && !isBye1 && e1) {
      match.winner = e1;
    }

    round1Matches.push(match);
    allMatches.push(match);
  }

  // Subsequent rounds
  let prevRound = round1Matches;
  for (let r = 2; r <= totalRounds; r++) {
    const currentRound: EngineBracketMatch[] = [];
    const count = prevRound.length / 2;

    for (let pos = 0; pos < count; pos++) {
      const fm1 = prevRound[pos * 2];
      const fm2 = prevRound[pos * 2 + 1];

      const match: EngineBracketMatch = {
        round: r,
        position: pos,
        matchNumber: matchCounter++,
        entry1: fm1?.winner,
        entry2: fm2?.winner,
        placeholder1: fm1?.winner?.name || (fm1 ? `Thắng M${fm1.matchNumber}` : 'TBD'),
        placeholder2: fm2?.winner?.name || (fm2 ? `Thắng M${fm2.matchNumber}` : 'TBD'),
        feederMatch1Number: fm1?.matchNumber,
        feederMatch2Number: fm2?.matchNumber,
      };

      currentRound.push(match);
      allMatches.push(match);
    }
    prevRound = currentRound;
  }

  return allMatches;
}

/**
 * Sinh sơ đồ ghép cặp và cây Knockout từ các đội vượt qua vòng bảng.
 * Hỗ trợ các pattern chuẩn BWF (cross_p1, cross_p2, cross_p3), bốc thăm ngẫu nhiên có ràng buộc,
 * hoặc xếp hạt giống theo thành tích.
 *
 * Ràng buộc bắt buộc:
 * - Nhất bảng và Nhì bảng của cùng 1 bảng KHÔNG BAO GIỜ gặp nhau ở vòng 1 Knockout.
 * - Nếu separateClubs = true: tránh hai đội cùng CLB gặp nhau ở vòng 1 Knockout.
 *
 * Hỗ trợ mọi số lượng bảng đấu: 2, 3, 4, 5, 6, 7, 8, 12, 16...
 * Với số bảng lẻ hoặc không tròn luỹ thừa 2 (3, 5, 6, 7):
 * - 'best_runner_ups': Tuyển các đội Nhất + N đội Nhì có thành tích tốt nhất để đủ số lượng tròn (4, 8, 16) không có suất Bye.
 * - 'all_top_two': Lấy đủ Nhất và Nhì mỗi bảng vào nhánh luỹ thừa 2 kế tiếp với các suất Bye phân bổ cho các đội Nhất.
 * - 'winners_only': Chỉ lấy Nhất mỗi bảng, có suất Bye nếu số bảng không tròn luỹ thừa 2.
 */
export function generateGroupToKnockoutBracket(
  numGroups: number,
  qualifiedTeams: GroupAdvancementSlot[],
  mappingMode: 'cross_p1' | 'cross_p2' | 'cross_p3' | 'random' | 'seeded' = 'cross_p1',
  options: {
    separateClubs?: boolean;
    advancementRule?: GroupAdvancementRule;
  } = {}
): EngineBracketMatch[] {
  if (numGroups < 2) return [];

  const firsts: GroupAdvancementSlot[] = [];
  const seconds: GroupAdvancementSlot[] = [];

  for (let g = 0; g < numGroups; g++) {
    const letter = String.fromCharCode(65 + g);
    const f = qualifiedTeams.find((t) => t.groupIdx === g && t.rank === 1) || {
      groupIdx: g,
      groupLetter: letter,
      rank: 1,
    };
    const s = qualifiedTeams.find((t) => t.groupIdx === g && t.rank === 2) || {
      groupIdx: g,
      groupLetter: letter,
      rank: 2,
    };
    firsts.push(f);
    seconds.push(s);
  }

  // Determine advancement rule
  // If not provided, for 2, 4, 8 groups default to standard top 2; for odd/non-power-of-2 default to best_runner_ups
  const isPowerOf2 = (numGroups & (numGroups - 1)) === 0;
  const advRule: GroupAdvancementRule =
    options.advancementRule || (isPowerOf2 ? 'all_top_two' : 'best_runner_ups');

  // CASE 1: Standard 2 Groups (4 teams -> Semifinals -> Final)
  if (numGroups === 2) {
    const slots: (GroupAdvancementSlot | 'BYE')[] = [
      firsts[0], seconds[1], // A1 vs B2
      firsts[1], seconds[0], // B1 vs A2
    ];
    return buildKnockoutFromSlots(slots);
  }

  // CASE 2: Standard 4 Groups (8 teams -> Quarterfinals -> Semifinals -> Final)
  if (numGroups === 4 && advRule !== 'winners_only') {
    let slots: (GroupAdvancementSlot | 'BYE')[] = [];

    if (mappingMode === 'cross_p2') {
      // A1-C2, B1-D2 | C1-A2, D1-B2
      slots = [
        firsts[0], seconds[2],
        firsts[1], seconds[3],
        firsts[2], seconds[0],
        firsts[3], seconds[1],
      ];
    } else if (mappingMode === 'cross_p3') {
      // A1-D2, B1-C2 | C1-B2, D1-A2
      slots = [
        firsts[0], seconds[3],
        firsts[1], seconds[2],
        firsts[2], seconds[1],
        firsts[3], seconds[0],
      ];
    } else if (mappingMode === 'random') {
      // Random draw with strict constraint: f.groupIdx !== s.groupIdx
      const shuffledFirsts = [...firsts];
      const shuffledSeconds = [...seconds];
      let valid = false;
      let attempts = 0;

      while (!valid && attempts < 100) {
        attempts++;
        for (let i = shuffledSeconds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledSeconds[i], shuffledSeconds[j]] = [shuffledSeconds[j], shuffledSeconds[i]];
        }

        valid = shuffledFirsts.every((f, idx) => {
          const s = shuffledSeconds[idx];
          if (f.groupIdx === s.groupIdx) return false;
          if (
            options.separateClubs &&
            f.entry?.club &&
            s.entry?.club &&
            f.entry.club === s.entry.club
          ) {
            return false;
          }
          return true;
        });
      }

      if (valid) {
        slots = [
          shuffledFirsts[0], shuffledSeconds[0],
          shuffledFirsts[1], shuffledSeconds[1],
          shuffledFirsts[2], shuffledSeconds[2],
          shuffledFirsts[3], shuffledSeconds[3],
        ];
      } else {
        // Fallback to cross_p1
        slots = [
          firsts[0], seconds[1],
          firsts[2], seconds[3],
          firsts[1], seconds[0],
          firsts[3], seconds[2],
        ];
      }
    } else {
      // Default / Pattern 1: A1-B2, C1-D2 | B1-A2, D1-C2
      slots = [
        firsts[0], seconds[1],
        firsts[2], seconds[3],
        firsts[1], seconds[0],
        firsts[3], seconds[2],
      ];
    }

    return buildKnockoutFromSlots(slots);
  }

  // CASE 3: Standard 8 Groups (16 teams -> Round of 16 -> QF -> SF -> Final)
  if (numGroups === 8 && advRule !== 'winners_only') {
    const slots: (GroupAdvancementSlot | 'BYE')[] = [
      firsts[0], seconds[1], // A1 vs B2
      firsts[2], seconds[3], // C1 vs D2
      firsts[4], seconds[5], // E1 vs F2
      firsts[6], seconds[7], // G1 vs H2
      firsts[1], seconds[0], // B1 vs A2
      firsts[3], seconds[2], // D1 vs C2
      firsts[5], seconds[4], // F1 vs E2
      firsts[7], seconds[6], // H1 vs G2
    ];
    return buildKnockoutFromSlots(slots);
  }

  // CASE 4: Odd or Non-Power-of-2 Groups (3, 5, 6, 7 groups)
  if (advRule === 'best_runner_ups') {
    // Target power of 2 bracket size (e.g. 4 for 3 groups; 8 for 5, 6, 7 groups)
    const targetSize = getNextPowerOf2(numGroups);
    const numRunnerUpsNeeded = targetSize - numGroups;

    // Pick top runner-ups (sorted by standing if available, or by group order)
    const sortedSeconds = [...seconds].sort((a, b) => {
      if (a.standing && b.standing) {
        if (a.standing.matchesWon !== b.standing.matchesWon) {
          return b.standing.matchesWon - a.standing.matchesWon;
        }
        if (a.standing.gameDifference !== b.standing.gameDifference) {
          return b.standing.gameDifference - a.standing.gameDifference;
        }
        return b.standing.pointDifference - a.standing.pointDifference;
      }
      return a.groupIdx - b.groupIdx;
    });

    const selectedRunnerUps = sortedSeconds.slice(0, numRunnerUpsNeeded);
    const numMatches = targetSize / 2;

    // Distribute participants into numMatches pairings ensuring no two teams from the same group meet
    // Pair each selected runner-up with a winner of a different group
    const pairings: { t1: GroupAdvancementSlot; t2: GroupAdvancementSlot }[] = [];
    const usedWinners = new Set<number>();
    const usedRunners = new Set<number>();

    // 1. Pair runner-ups with winners of different groups
    for (let i = 0; i < selectedRunnerUps.length; i++) {
      const runner = selectedRunnerUps[i];
      // Find a winner from a different group that hasn't been used yet
      const eligibleWinnerIdx = firsts.findIndex(
        (f, idx) => !usedWinners.has(idx) && f.groupIdx !== runner.groupIdx
      );

      if (eligibleWinnerIdx !== -1) {
        usedWinners.add(eligibleWinnerIdx);
        usedRunners.add(i);
        pairings.push({ t1: firsts[eligibleWinnerIdx], t2: runner });
      }
    }

    // 2. The remaining winners play against each other
    const remainingWinners = firsts.filter((_, idx) => !usedWinners.has(idx));
    for (let i = 0; i < remainingWinners.length; i += 2) {
      if (i + 1 < remainingWinners.length) {
        pairings.push({ t1: remainingWinners[i], t2: remainingWinners[i + 1] });
      } else if (usedRunners.size < selectedRunnerUps.length) {
        // Fallback for remaining runner-up if any
        const unassignedRunner = selectedRunnerUps.find((_, idx) => !usedRunners.has(idx))!;
        pairings.push({ t1: remainingWinners[i], t2: unassignedRunner });
      }
    }

    // Flatten pairings into bracket slots
    const slots: (GroupAdvancementSlot | 'BYE')[] = [];
    for (const pair of pairings) {
      slots.push(pair.t1);
      slots.push(pair.t2);
    }

    // Pad with BYE if bracket size not yet filled
    while (slots.length < targetSize) {
      slots.push('BYE');
    }

    return buildKnockoutFromSlots(slots);
  }

  if (advRule === 'all_top_two') {
    // Advance all 1st and 2nd places from each group (e.g. 6 teams for 3 groups, 10 for 5 groups)
    const totalTeams = numGroups * 2;
    const bracketSize = getNextPowerOf2(totalTeams); // 8 for 3 groups, 16 for 5, 6, 7 groups
    const byesCount = bracketSize - totalTeams;

    // High seeds get Byes (first byesCount winners)
    const slots: (GroupAdvancementSlot | 'BYE')[] = new Array(bracketSize).fill('BYE');

    // Place winners that receive Byes at the top and bottom of bracket halves
    // For 3 groups (bracket 8, 2 byes): Slot 0 = A1 (vs Slot 1: BYE), Slot 6 = B1 (vs Slot 7: BYE)
    if (numGroups === 3 && bracketSize === 8) {
      slots[0] = firsts[0]; // A1 (Bye to SF1)
      slots[1] = 'BYE';
      slots[2] = firsts[2]; // C1
      slots[3] = seconds[1]; // B2 (C1 vs B2 -> winner meets A1)
      slots[4] = seconds[0]; // A2
      slots[5] = seconds[2]; // C2 (A2 vs C2 -> winner meets B1)
      slots[6] = firsts[1]; // B1 (Bye to SF2)
      slots[7] = 'BYE';
      return buildKnockoutFromSlots(slots);
    }

    // Generic allocation for 4+ groups (except 3 which is hardcoded above)
    // Distribute Byes symmetrically: top seeds (group winners) get Byes
    // Ensure firsts[i] is never accessed out of bounds
    const byeRecipients: GroupAdvancementSlot[] = [];
    const nonByeFirsts: GroupAdvancementSlot[] = [];
    const allSeconds: GroupAdvancementSlot[] = [...seconds];

    // Assign Byes to top group winners (up to byesCount, but never more than firsts.length)
    const actualByes = Math.min(byesCount, firsts.length);
    for (let i = 0; i < firsts.length; i++) {
      if (i < actualByes) {
        byeRecipients.push(firsts[i]);
      } else {
        nonByeFirsts.push(firsts[i]);
      }
    }

    // Build result slots: Bye recipients paired with BYE, then remaining participants
    const resultSlots: (GroupAdvancementSlot | 'BYE')[] = [];

    // Place bye recipients at spread positions (not clustered)
    // Interleave: bye match, then active matches
    const activeParticipants: GroupAdvancementSlot[] = [...nonByeFirsts, ...allSeconds];

    // Simple same-group avoidance for active participants
    for (let i = 0; i < activeParticipants.length - 1; i += 2) {
      const p1 = activeParticipants[i];
      const p2 = activeParticipants[i + 1];
      if (p2 && p1.groupIdx === p2.groupIdx) {
        // Find next participant from different group to swap with
        for (let j = i + 2; j < activeParticipants.length; j++) {
          if (activeParticipants[j].groupIdx !== p1.groupIdx) {
            const temp = activeParticipants[i + 1];
            activeParticipants[i + 1] = activeParticipants[j];
            activeParticipants[j] = temp;
            break;
          }
        }
      }
    }

    // Build: first half = bye recipients + BYEs at top, active matches in middle
    // Distribute byes: half at top, half at bottom for bracket balance
    const topByes = Math.ceil(actualByes / 2);
    const bottomByes = actualByes - topByes;

    // Top bye slots
    for (let i = 0; i < topByes; i++) {
      resultSlots.push(byeRecipients[i]);
      resultSlots.push('BYE');
    }

    // Active participant pairs
    for (let i = 0; i < activeParticipants.length; i++) {
      resultSlots.push(activeParticipants[i]);
    }

    // Bottom bye slots
    for (let i = topByes; i < actualByes; i++) {
      resultSlots.push(byeRecipients[i]);
      resultSlots.push('BYE');
    }

    // Pad remaining with BYEs if needed (should not happen with correct math)
    while (resultSlots.length < bracketSize) {
      resultSlots.push('BYE');
    }

    return buildKnockoutFromSlots(resultSlots);
  }

  // CASE 5: Winners Only
  const targetSize = getNextPowerOf2(numGroups);
  const byesCount = targetSize - numGroups;
  const slots: (GroupAdvancementSlot | 'BYE')[] = [];

  for (let i = 0; i < numGroups; i++) {
    slots.push(firsts[i]);
    if (i < byesCount) {
      slots.push('BYE');
    }
  }

  while (slots.length < targetSize) {
    slots.push('BYE');
  }

  return buildKnockoutFromSlots(slots);
}
