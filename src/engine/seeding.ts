import { EngineEntry } from './types';

/**
 * Generates BWF compliant standard seed positions for a given bracket size.
 * Returns an array where index (seed - 1) gives the 1-indexed position in the bracket.
 * Bracket positions run from 1 to bracketSize.
 *
 * BWF Principles:
 * - Seed 1 -> Position 1 (Top of Upper Half)
 * - Seed 2 -> Position bracketSize (Bottom of Lower Half)
 * - Seed 3 & 4 -> Top of Lower Half & Bottom of Upper Half
 * - Seeds 5-8 -> Remaining Quarter boundaries
 */
export function generateSeedPositions(bracketSize: number): number[] {
  if (bracketSize < 2 || (bracketSize & (bracketSize - 1)) !== 0) {
    throw new Error('Bracket size must be a power of 2 (at least 2)');
  }

  // Recursive construction of seed slots with alternating expansion
  let slots = [1, 2];
  while (slots.length < bracketSize) {
    const nextSlots: number[] = [];
    const sum = slots.length * 2 + 1;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (i % 2 === 0) {
        nextSlots.push(slot);
        nextSlots.push(sum - slot);
      } else {
        nextSlots.push(sum - slot);
        nextSlots.push(slot);
      }
    }
    slots = nextSlots;
  }

  // slots gives which seed is at each position (1-indexed).
  // We invert it so that result[seedIndex] = bracket position (1-indexed).
  const positions: number[] = new Array(bracketSize);
  for (let posIdx = 0; posIdx < slots.length; posIdx++) {
    const seed = slots[posIdx];
    positions[seed - 1] = posIdx + 1;
  }

  return positions;
}

/**
 * Distributes entries into groups using snake (serpentine) seeding.
 * Ensures balanced strength across groups based on entry seeds/ratings.
 *
 * Example with 4 groups (A, B, C, D):
 * Pot 1: A1, B1, C1, D1
 * Pot 2: D2, C2, B2, A2 (reversed)
 * Pot 3: A3, B3, C3, D3
 */
export function snakeSeedGroups(
  entries: EngineEntry[],
  numGroups: number,
  options?: { separateClubs?: boolean }
): EngineEntry[][] {
  if (numGroups <= 0) throw new Error('Number of groups must be positive');

  const groups: EngineEntry[][] = Array.from({ length: numGroups }, () => []);

  // Separate seeded entries and unseeded entries
  const seeded = entries
    .filter((e) => e.seed !== undefined && e.seed !== null && e.seed > 0)
    .sort((a, b) => (a.seed || 0) - (b.seed || 0));

  const unseeded = entries.filter(
    (e) => e.seed === undefined || e.seed === null || e.seed <= 0
  );

  // 1. Distribute seeded entries via Snake Seeding
  seeded.forEach((entry, idx) => {
    const round = Math.floor(idx / numGroups);
    const isReversed = round % 2 === 1;
    const groupIndex = isReversed
      ? numGroups - 1 - (idx % numGroups)
      : idx % numGroups;

    groups[groupIndex].push(entry);
  });

  // 2. Distribute unseeded entries
  if (options?.separateClubs) {
    // Group unseeded entries by club
    const clubMap = new Map<string, EngineEntry[]>();
    const unknownClub: EngineEntry[] = [];

    for (const e of unseeded) {
      if (e.club) {
        if (!clubMap.has(e.club)) clubMap.set(e.club, []);
        clubMap.get(e.club)!.push(e);
      } else {
        unknownClub.push(e);
      }
    }

    // Sort clubs descending by member count to place harder clubs first
    const sortedClubs = Array.from(clubMap.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );

    for (const [, clubEntries] of sortedClubs) {
      for (const entry of clubEntries) {
        // Find candidate groups with the minimum members, prioritizing groups with NO members of this club
        let bestGroupIdx = -1;
        let minSize = Infinity;
        let bestHasClub = true;

        for (let g = 0; g < numGroups; g++) {
          const hasThisClub = groups[g].some((m) => m.club === entry.club);
          const currentSize = groups[g].length;

          if (!hasThisClub) {
            if (bestHasClub || currentSize < minSize) {
              bestGroupIdx = g;
              minSize = currentSize;
              bestHasClub = false;
            }
          } else if (bestHasClub && currentSize < minSize) {
            bestGroupIdx = g;
            minSize = currentSize;
          }
        }

        if (bestGroupIdx === -1) bestGroupIdx = 0;
        groups[bestGroupIdx].push(entry);
      }
    }

    // Distribute entries without club evenly
    for (const entry of unknownClub) {
      let minGroup = 0;
      for (let g = 1; g < numGroups; g++) {
        if (groups[g].length < groups[minGroup].length) {
          minGroup = g;
        }
      }
      groups[minGroup].push(entry);
    }
  } else {
    // Standard snake/round-robin fill for unseeded
    let offset = seeded.length;
    unseeded.forEach((entry, idx) => {
      const overallIdx = offset + idx;
      const round = Math.floor(overallIdx / numGroups);
      const isReversed = round % 2 === 1;
      const groupIndex = isReversed
        ? numGroups - 1 - (overallIdx % numGroups)
        : overallIdx % numGroups;

      groups[groupIndex].push(entry);
    });
  }

  return groups;
}
