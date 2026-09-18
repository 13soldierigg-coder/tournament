import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from './tournamentService';
import { GameScore } from '@/types/database';

export interface RecordPointParams {
  matchId: string;
  pointToTeam: 'a' | 'b';
  expectedVersion: number;
  actorId?: string;
}

export interface RecordPointResult {
  success: boolean;
  code?: string;
  version?: number;
  pointsA?: number;
  pointsB?: number;
  setsA?: number;
  setsB?: number;
  gameScores?: GameScore[];
  isSetWon?: boolean;
  isMatchFinished?: boolean;
  winnerId?: string | null;
  winnerTeam?: 'a' | 'b' | null;
  message?: string;
}

/**
 * Ghi điểm an toàn theo Optimistic Concurrency Control (Version check)
 */
export async function recordMatchPoint(params: RecordPointParams): Promise<RecordPointResult> {
  if (!isSupabaseConfigured()) {
    // Giả lập ghi điểm cục bộ (Offline Mock Engine)
    return {
      success: true,
      version: params.expectedVersion + 1,
      pointsA: params.pointToTeam === 'a' ? 21 : 19,
      pointsB: params.pointToTeam === 'b' ? 20 : 19,
      setsA: 1,
      setsB: 1,
      isSetWon: false,
      isMatchFinished: false,
      message: 'Ghi điểm thành công (Local Engine)',
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('record_match_point', {
      p_match_id: params.matchId,
      p_point_to_team: params.pointToTeam,
      p_expected_version: params.expectedVersion,
      p_actor_id: params.actorId || null,
    });

    if (error) {
      return {
        success: false,
        code: error.code || 'RPC_ERROR',
        message: error.message || 'Lỗi khi gọi RPC ghi điểm',
      };
    }

    return {
      success: data.success,
      code: data.code,
      version: data.version,
      pointsA: data.points_a,
      pointsB: data.points_b,
      setsA: data.sets_a,
      setsB: data.sets_b,
      gameScores: data.game_scores,
      isSetWon: data.is_set_won,
      isMatchFinished: data.is_match_finished,
      winnerId: data.winner_id,
      winnerTeam: data.winner_team,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: err?.message || 'Lỗi mạng khi ghi điểm',
    };
  }
}

/**
 * Chốt kết quả trận đấu chính thức
 */
export async function finalizeMatch(
  matchId: string,
  winnerId: string,
  notes?: string,
  actorId?: string
): Promise<{ success: boolean; code?: string; message?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Đã chốt kết quả trận đấu thành công (Mock)' };
  }

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('finalize_match_result', {
      p_match_id: matchId,
      p_winner_id: winnerId,
      p_notes: notes || null,
      p_actor_id: actorId || null,
    });

    if (error) {
      return { success: false, code: error.code, message: error.message };
    }

    return { success: data.success, code: data.code };
  } catch (err: any) {
    return { success: false, code: 'NETWORK_ERROR', message: err?.message };
  }
}

/**
 * Lắng nghe cập nhật điểm số trực tiếp thời gian thực (Supabase Realtime Channel)
 */
export function subscribeToMatchScore(
  matchId: string,
  onUpdate: (payload: any) => void
): () => void {
  if (!isSupabaseConfigured()) {
    // Không làm gì nếu chạy offline
    return () => {};
  }

  const supabase = createClient();
  const channel = supabase
    .channel(`match_${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournament_matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Lấy chi tiết trận đấu theo ID từ Supabase
 */
export async function getMatchById(matchId: string): Promise<any | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = createClient();
    const { data, error } = await (supabase.from('tournament_matches') as any)
      .select('*')
      .eq('id', matchId)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Lắng nghe tất cả cập nhật trận đấu trong 1 giải đấu (Dùng cho Live ticker trang chủ & chi tiết giải)
 */
export function subscribeToTournamentMatches(
  tournamentId: string,
  onUpdate: (payload: any) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = createClient();
  const channel = supabase
    .channel(`tour_matches_${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

