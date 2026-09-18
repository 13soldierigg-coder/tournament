import { EngineEntry, EngineBracketMatch } from './types';
import { generateSeedPositions } from './seeding';

export interface BracketGenerationOptions {
  separateClubs?: boolean;
}

/**
 * Calculates the next power of 2 greater than or equal to n.
 */
export function getNextPowerOf2(n: number): number {
  if (n <= 2) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generates a full single-elimination knockout tournament bracket.
 *
 * Principles:
 * - Deterministic BWF seed placement.
 * - Byes are allocated to highest seeds first.
 * - Automatic advancement of entries with a Bye from Round 1 into Round 2.
 * - Proper match numbering and placeholder tracking for future rounds.
 */
export function generateKnockoutBracket(
  entries: EngineEntry[],
  options: BracketGenerationOptions = {}
): EngineBracketMatch[] {
  if (entries.length === 0) return [];

  const bracketSize = getNextPowerOf2(entries.length);
  const totalRounds = Math.log2(bracketSize);
  const byesCount = bracketSize - entries.length;

  // Separate seeded and unseeded entries
  const seeded = entries
    .filter((e) => e.seed !== undefined && e.seed !== null)
    .sort((a, b) => (a.seed || 0) - (b.seed || 0));

  const unseeded = entries.filter((e) => e.seed === undefined || e.seed === null);

  // Slot array of length bracketSize (0 to bracketSize - 1)
  const slots: (EngineEntry | 'BYE' | null)[] = new Array(bracketSize).fill(null);
  const seedPositions = generateSeedPositions(bracketSize);

  // 1. Place seeded players into their designated positions (seedPositions are 1-indexed)
  for (let i = 0; i < seeded.length; i++) {
    const seedNum = seeded[i].seed!;
    const pos = seedPositions[seedNum - 1];
    if (pos && pos <= bracketSize) {
      slots[pos - 1] = seeded[i];
    }
  }

  // 2. Allocate BYEs opposite to highest seeds
  // In standard knockout, Seed 1's opponent gets Bye 1, Seed 2's opponent gets Bye 2, etc.
  let allocatedByes = 0;
  for (let i = 0; i < bracketSize && allocatedByes < byesCount; i++) {
    const seedNum = i + 1;
    if (seedNum <= seedPositions.length) {
      const pos = seedPositions[seedNum - 1]; // 1-indexed position of seed
      const matchIndex = Math.floor((pos - 1) / 2);
      const opponentPos = (pos - 1) % 2 === 0 ? matchIndex * 2 + 1 : matchIndex * 2;

      if (slots[opponentPos] === null) {
        slots[opponentPos] = 'BYE';
        allocatedByes++;
      }
    }
  }

  // If there are still remaining byes, fill remaining null slots from the bottom
  for (let i = bracketSize - 1; i >= 0 && allocatedByes < byesCount; i--) {
    if (slots[i] === null) {
      slots[i] = 'BYE';
      allocatedByes++;
    }
  }

  // 3. Fill remaining open slots with unseeded entries
  let unseededIdx = 0;
  for (let i = 0; i < bracketSize; i++) {
    if (slots[i] === null) {
      if (unseededIdx < unseeded.length) {
        slots[i] = unseeded[unseededIdx++];
      }
    }
  }

  // 4. Club separation (optional): Avoid same-club matchups in Round 1
  if (options.separateClubs) {
    applyClubSeparation(slots);
  }

  // 5. Generate matches for all rounds
  const allMatches: EngineBracketMatch[] = [];
  let matchNumberCounter = 1;

  // Round 1
  const round1Matches: EngineBracketMatch[] = [];
  const numR1Matches = bracketSize / 2;

  for (let pos = 0; pos < numR1Matches; pos++) {
    const s1 = slots[pos * 2];
    const s2 = slots[pos * 2 + 1];

    const e1 = s1 === 'BYE' || s1 === null ? undefined : s1;
    const e2 = s2 === 'BYE' || s2 === null ? undefined : s2;

    const match: EngineBracketMatch = {
      round: 1,
      position: pos,
      matchNumber: matchNumberCounter++,
      entry1: e1,
      entry2: e2,
      placeholder1: e1?.name || (s1 === 'BYE' ? 'BYE' : 'TBD'),
      placeholder2: e2?.name || (s2 === 'BYE' ? 'BYE' : 'TBD'),
    };

    // If one side is BYE and the other is present, auto-advance
    if (e1 && s2 === 'BYE') {
      match.winner = e1;
    } else if (e2 && s1 === 'BYE') {
      match.winner = e2;
    }

    round1Matches.push(match);
    allMatches.push(match);
  }

  // Subsequent rounds (Round 2 to Final)
  let previousRoundMatches = round1Matches;

  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundMatches: EngineBracketMatch[] = [];
    const numMatches = Math.pow(2, totalRounds - round);

    for (let pos = 0; pos < numMatches; pos++) {
      const feederMatch1 = previousRoundMatches[pos * 2];
      const feederMatch2 = previousRoundMatches[pos * 2 + 1];

      const match: EngineBracketMatch = {
        round,
        position: pos,
        matchNumber: matchNumberCounter++,
        entry1: feederMatch1?.winner,
        entry2: feederMatch2?.winner,
        placeholder1: feederMatch1 ? `Winner M${feederMatch1.matchNumber}` : 'TBD',
        placeholder2: feederMatch2 ? `Winner M${feederMatch2.matchNumber}` : 'TBD',
        feederMatch1Number: feederMatch1?.matchNumber,
        feederMatch2Number: feederMatch2?.matchNumber,
      };

      currentRoundMatches.push(match);
      allMatches.push(match);
    }

    previousRoundMatches = currentRoundMatches;
  }

  return allMatches;
}

/**
 * Attempts to separate athletes from the same club in Round 1 matchups.
 */
function applyClubSeparation(slots: (EngineEntry | 'BYE' | null)[]) {
  const numMatches = slots.length / 2;
  for (let m = 0; m < numMatches; m++) {
    const e1 = slots[m * 2];
    const e2 = slots[m * 2 + 1];

    if (
      e1 &&
      e2 &&
      e1 !== 'BYE' &&
      e2 !== 'BYE' &&
      e1.club &&
      e2.club &&
      e1.club === e2.club
    ) {
      // Conflict: same club in same match!
      // Try to find a slot in another match to swap e2 with
      let swapped = false;
      // Search all other matches (both forward and backward)
      for (let otherM = 0; otherM < numMatches && !swapped; otherM++) {
        if (otherM === m) continue;
        // Try both slots in the other match (slot 0 and slot 1)
        for (const slotOffset of [1, 0]) {
          const candidateSlotIdx = otherM * 2 + slotOffset;
          const candidate = slots[candidateSlotIdx];
          if (
            candidate &&
            candidate !== 'BYE' &&
            !candidate.seed &&
            candidate.club !== e1.club
          ) {
            // Verify swap doesn't create a new conflict in the other match
            const otherSlotIdx = otherM * 2 + (slotOffset === 0 ? 1 : 0);
            const otherOpponent = slots[otherSlotIdx];
            const wouldConflict =
              otherOpponent &&
              otherOpponent !== 'BYE' &&
              otherOpponent.club &&
              e2.club === otherOpponent.club;
            if (!wouldConflict) {
              // Safe to swap
              slots[candidateSlotIdx] = e2;
              slots[m * 2 + 1] = candidate;
              swapped = true;
              break;
            }
          }
        }
      }
    }
  }
}
