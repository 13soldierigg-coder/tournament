import { EngineEntry, GameScore, GroupStanding } from './types';

export interface CompletedGroupMatch {
  entryAId: string;
  entryBId: string;
  scores: GameScore[];
  isFinished: boolean;
  winnerId?: string | null;
  isWalkover?: boolean;
}

/**
 * Calculates standings for a round-robin group according to BWF General Competition Regulations.
 *
 * Tie-breaking priority:
 * 1. Matches won
 * 2. If exactly 2 teams tied: Result of the head-to-head match between them
 * 3. If 3 or more teams tied:
 *    a. Game difference (games won - games lost) in matches between the tied teams
 *    b. If 2 teams remain tied: Head-to-head between those 2 teams
 *    c. Point difference (points won - points lost) in matches between the tied teams
 *    d. Points won
 */
export function calculateGroupStandings(
  entries: EngineEntry[],
  matches: CompletedGroupMatch[]
): GroupStanding[] {
  // Initialize table
  const tableMap = new Map<string, GroupStanding>();
  for (const entry of entries) {
    tableMap.set(entry.id, {
      entryId: entry.id,
      entryName: entry.name,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDifference: 0,
      pointsWon: 0,
      pointsLost: 0,
      pointDifference: 0,
      rank: 0,
    });
  }

  // Aggregate stats from finished matches
  for (const match of matches) {
    if (!match.isFinished) continue;

    const statsA = tableMap.get(match.entryAId);
    const statsB = tableMap.get(match.entryBId);
    if (!statsA || !statsB) continue;

    statsA.matchesPlayed++;
    statsB.matchesPlayed++;

    if (match.isWalkover) {
      // Walkover: winner gets default win stats, loser gets corresponding loss stats
      // Use 2 games won (best of 3) and 21 points per game as default walkover values
      const walkoverGames = 2;
      const walkoverPointsPerGame = 21;
      const walkoverTotalPoints = walkoverGames * walkoverPointsPerGame; // 42
      if (match.winnerId === match.entryAId) {
        statsA.matchesWon++;
        statsB.matchesLost++;
        statsA.gamesWon += walkoverGames;
        statsB.gamesLost += walkoverGames;
        statsA.pointsWon += walkoverTotalPoints;
        statsB.pointsLost += walkoverTotalPoints;
      } else {
        statsB.matchesWon++;
        statsA.matchesLost++;
        statsB.gamesWon += walkoverGames;
        statsA.gamesLost += walkoverGames;
        statsB.pointsWon += walkoverTotalPoints;
        statsA.pointsLost += walkoverTotalPoints;
      }
      continue;
    }

    let gamesWonA = 0;
    let gamesWonB = 0;
    let pointsA = 0;
    let pointsB = 0;

    for (const g of match.scores) {
      pointsA += g.scoreA;
      pointsB += g.scoreB;
      if (g.scoreA > g.scoreB) gamesWonA++;
      else if (g.scoreB > g.scoreA) gamesWonB++;
    }

    statsA.gamesWon += gamesWonA;
    statsA.gamesLost += gamesWonB;
    statsA.pointsWon += pointsA;
    statsA.pointsLost += pointsB;

    statsB.gamesWon += gamesWonB;
    statsB.gamesLost += gamesWonA;
    statsB.pointsWon += pointsB;
    statsB.pointsLost += pointsA;

    const winnerId = match.winnerId || (gamesWonA > gamesWonB ? match.entryAId : match.entryBId);
    if (winnerId === match.entryAId) {
      statsA.matchesWon++;
      statsB.matchesLost++;
    } else {
      statsB.matchesWon++;
      statsA.matchesLost++;
    }
  }

  // Calculate differences
  const standings = Array.from(tableMap.values()).map((s) => ({
    ...s,
    gameDifference: s.gamesWon - s.gamesLost,
    pointDifference: s.pointsWon - s.pointsLost,
  }));

  // Helper function to get head-to-head winner between two teams
  const getHeadToHeadWinner = (id1: string, id2: string): string | null => {
    const h2h = matches.find(
      (m) =>
        m.isFinished &&
        ((m.entryAId === id1 && m.entryBId === id2) ||
          (m.entryAId === id2 && m.entryBId === id1))
    );
    if (!h2h) return null;
    if (h2h.winnerId) return h2h.winnerId;

    let gA = 0;
    let gB = 0;
    for (const score of h2h.scores) {
      if (score.scoreA > score.scoreB) gA++;
      else if (score.scoreB > score.scoreA) gB++;
    }
    return gA > gB ? h2h.entryAId : gB > gA ? h2h.entryBId : null;
  };

  // Sort standings with BWF tie-breakers
  standings.sort((a, b) => {
    // 1. Matches won
    if (b.matchesWon !== a.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }

    // Check if this is a 2-way tie among teams with identical matchesWon
    const tiedWithSameWins = standings.filter((s) => s.matchesWon === a.matchesWon);

    if (tiedWithSameWins.length === 2) {
      // 2-way tie: Head-to-Head decided
      const h2hWinner = getHeadToHeadWinner(a.entryId, b.entryId);
      if (h2hWinner === a.entryId) return -1;
      if (h2hWinner === b.entryId) return 1;
    }

    // 3. Multi-way tie (or 2-way with no decisive h2h):
    // a. Game difference
    if (b.gameDifference !== a.gameDifference) {
      return b.gameDifference - a.gameDifference;
    }

    // b. Games won
    if (b.gamesWon !== a.gamesWon) {
      return b.gamesWon - a.gamesWon;
    }

    // c. Point difference
    if (b.pointDifference !== a.pointDifference) {
      return b.pointDifference - a.pointDifference;
    }

    // d. Points won
    if (b.pointsWon !== a.pointsWon) {
      return b.pointsWon - a.pointsWon;
    }

    return 0;
  });

  // Assign ranks (1-indexed)
  return standings.map((s, index) => ({
    ...s,
    rank: index + 1,
  }));
}

export interface RunnerUpStanding extends GroupStanding {
  groupLetter: string;
  groupIdx: number;
  qualifies: boolean;
}

/**
 * So sánh và xếp hạng thành tích các đội Nhì bảng trên toàn giải (BWF General Regulations).
 * Thứ tự ưu tiên tuyển chọn vé đi tiếp:
 * 1. Số trận thắng (matchesWon)
 * 2. Hiệu số ván/set (gameDifference)
 * 3. Hiệu số điểm số (pointDifference)
 * 4. Tổng điểm ghi được (pointsWon)
 */
export function calculateBestRunnerUps(
  allGroupStandings: { groupLetter: string; groupIdx: number; standings: GroupStanding[] }[],
  qualifyingCount: number
): RunnerUpStanding[] {
  const runners: RunnerUpStanding[] = [];

  for (const g of allGroupStandings) {
    const secondPlace = g.standings.find((s) => s.rank === 2);
    if (secondPlace) {
      runners.push({
        ...secondPlace,
        groupLetter: g.groupLetter,
        groupIdx: g.groupIdx,
        qualifies: false,
      });
    }
  }

  // Sắp xếp các đội Nhì theo chỉ số thành tích giảm dần
  runners.sort((a, b) => {
    if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
    if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
    if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
    return b.pointsWon - a.pointsWon;
  });

  // Gán cờ vượt qua vòng bảng cho N đội có thành tích tốt nhất
  return runners.map((r, idx) => ({
    ...r,
    rank: idx + 1,
    qualifies: idx < qualifyingCount,
  }));
}
