import { EngineEntry } from './types';

export interface RoundRobinMatch {
  round: number; // 1-indexed round
  matchNumber: number; // Sequential match number
  entryA: EngineEntry;
  entryB: EngineEntry;
}

/**
 * Generates a round-robin schedule using the standard Berger rotation algorithm.
 * Guarantees that every participant plays against every other participant exactly once.
 * If the number of participants is odd, a virtual Bye is assigned each round.
 */
export function generateBergerRoundRobin(entries: EngineEntry[]): RoundRobinMatch[] {
  if (entries.length < 2) return [];

  const participants: (EngineEntry | null)[] = [...entries];
  const isOdd = participants.length % 2 !== 0;

  if (isOdd) {
    participants.push(null); // null represents a Bye
  }

  const numTeams = participants.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const matches: RoundRobinMatch[] = [];
  let matchCounter = 1;

  // We rotate participants while keeping participants[0] fixed
  const rotatingTeams = participants.slice(1);

  for (let round = 0; round < numRounds; round++) {
    // Current round pairing
    const roundLineup = [participants[0], ...rotatingTeams];

    for (let i = 0; i < matchesPerRound; i++) {
      const team1 = roundLineup[i];
      const team2 = roundLineup[numTeams - 1 - i];

      // Skip match if one of the teams is the Bye
      if (team1 !== null && team2 !== null) {
        // Alternate home/away (entryA / entryB) across rounds for fairness
        const isHome = (i + round) % 2 === 0;
        matches.push({
          round: round + 1,
          matchNumber: matchCounter++,
          entryA: isHome ? team1 : team2,
          entryB: isHome ? team2 : team1,
        });
      }
    }

    // Rotate array clockwise: last element goes to front of rotating slice
    const last = rotatingTeams.pop()!;
    rotatingTeams.unshift(last);
  }

  return matches;
}
