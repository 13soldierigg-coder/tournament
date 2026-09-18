import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from './tournamentService';
import {
  MOCK_CLUB_RANKINGS,
  MOCK_ATHLETE_RANKINGS,
  MockClubRanking,
  MockAthleteRanking,
} from '@/data/mockTournaments';

/**
 * Lấy bảng tổng sắp CLB toàn đoàn (gọi RPC calculate_club_rankings hoặc trả về mock)
 */
export async function getClubRankings(tournamentId?: string): Promise<MockClubRanking[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CLUB_RANKINGS;
  }

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('calculate_club_rankings', {
      p_tournament_id: tournamentId || null,
    });

    if (error || !data || data.length === 0) {
      return MOCK_CLUB_RANKINGS;
    }

    return data.map((item: any) => ({
      rank: item.rank,
      nameVi: item.club_name,
      nameEn: item.club_name,
      tournamentsCount: Number(item.tournaments_count || 1),
      goldMedals: Number(item.gold_medals || 0),
      silverMedals: Number(item.silver_medals || 0),
      bronzeMedals: Number(item.bronze_medals || 0),
      totalPoints: Number(item.total_points || 0),
    }));
  } catch {
    return MOCK_CLUB_RANKINGS;
  }
}

/**
 * Lấy danh sách thành tích sự nghiệp VĐV
 */
export async function getAthleteRankings(): Promise<MockAthleteRanking[]> {
  return MOCK_ATHLETE_RANKINGS;
}
