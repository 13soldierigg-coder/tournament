import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from './tournamentService';
import { EngineBracketMatch } from '@/engine/types';

export interface PublishDrawParams {
  tournamentId: string;
  eventId: string;
  stage?: 'knockout' | 'group';
  matches: EngineBracketMatch[] | any[];
  courtsCount?: number;
  numCourts?: number;
  tournamentName?: string;
  tournamentSlug?: string;
  eventCategory?: string;
  format?: string;
}

export interface PublishDrawResult {
  success: boolean;
  totalMatches: number;
  courtsAssigned: number;
  message: string;
  error?: string;
}

export interface MatchDisplayItem {
  id: string;
  matchNumber: number;
  courtNumber: number;
  courtInfo: string;
  round: number;
  roundName: string;
  stage: string;
  teamA: string;
  teamB: string;
  clubA?: string;
  clubB?: string;
  currentScoreA: number;
  currentScoreB: number;
  setsA: number;
  setsB: number;
  status: 'pending' | 'ready' | 'warmup' | 'in_progress' | 'completed';
  version: number;
}

const DEFAULT_MOCK_MATCHES: MatchDisplayItem[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    matchNumber: 1,
    courtNumber: 1,
    courtInfo: 'Sân 1',
    round: 3,
    roundName: 'Chung Kết',
    stage: 'knockout',
    teamA: 'Nguyễn Văn A / Lê Hùng',
    teamB: 'Trần Thị B / Mai Lan',
    clubA: 'CLB Ba Đình',
    clubB: 'CLB Cầu Giấy',
    currentScoreA: 20,
    currentScoreB: 19,
    setsA: 1,
    setsB: 1,
    status: 'in_progress',
    version: 4,
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    matchNumber: 2,
    courtNumber: 2,
    courtInfo: 'Sân 2',
    round: 2,
    roundName: 'Bán Kết 1',
    stage: 'knockout',
    teamA: 'Nguyễn Văn A / Lê Hùng',
    teamB: 'Phạm Đức C / Vũ Tuấn',
    clubA: 'CLB Ba Đình',
    clubB: 'CLB Hoàn Kiếm',
    currentScoreA: 21,
    currentScoreB: 15,
    setsA: 2,
    setsB: 0,
    status: 'completed',
    version: 3,
  },
  {
    id: '50000000-0000-0000-0000-000000000003',
    matchNumber: 3,
    courtNumber: 3,
    courtInfo: 'Sân 3',
    round: 2,
    roundName: 'Bán Kết 2',
    stage: 'knockout',
    teamA: 'Trần Thị B / Mai Lan',
    teamB: 'Hoàng Minh D / Đỗ Hải',
    clubA: 'CLB Cầu Giấy',
    clubB: 'CLB Thăng Long',
    currentScoreA: 21,
    currentScoreB: 18,
    setsA: 2,
    setsB: 0,
    status: 'completed',
    version: 3,
  },
];

/**
 * Công bố kết quả bốc thăm và lưu danh sách trận đấu đa sân vào CSDL Supabase
 */
export async function publishDrawMatches(params: PublishDrawParams): Promise<PublishDrawResult> {
  const courtsCount = Math.max(1, params.courtsCount || 3);

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      totalMatches: params.matches.length,
      courtsAssigned: courtsCount,
      message: `Đã công bố ${params.matches.length} trận đấu trên ${courtsCount} sân (Mock Engine)`,
    };
  }

  try {
    const supabase = createClient();

    // Map each engine match to a database record
    const matchRows = params.matches.map((m, index) => {
      const courtNumber = ((index % courtsCount) + 1);
      const courtInfo = `Sân ${courtNumber}`;

      const roundName =
        m.round === 1
          ? 'Vòng loại'
          : m.round === 2
          ? 'Bán kết'
          : 'Chung kết';

      const isBye = Boolean(m.winner && (!m.entry1 || !m.entry2));
      const status = isBye
        ? 'completed'
        : m.matchNumber === 1
        ? 'in_progress'
        : 'ready';

      const teamA = m.entry1?.name || m.placeholder1 || 'Trống';
      const teamB = m.entry2?.name || m.placeholder2 || 'Trống';

      return {
        tournament_id: params.tournamentId,
        event_id: params.eventId,
        match_number: m.matchNumber,
        round: m.round,
        round_name: roundName,
        bracket_round: m.round,
        bracket_position: m.position,
        stage: params.stage || 'knockout',
        court_info: courtInfo,
        status,
        result_type: isBye ? 'bye' : 'normal',
        placeholder_entry1: teamA,
        placeholder_entry2: teamB,
        sets_a: isBye ? 2 : 0,
        sets_b: 0,
        points_a: isBye ? 21 : 0,
        points_b: 0,
        version: 1,
      };
    });

    // Lấy danh sách trận đã tồn tại để cập nhật hoặc thêm mới
    const { data: existingMatches } = await (supabase.from('tournament_matches') as any)
      .select('id, match_number')
      .eq('tournament_id', params.tournamentId)
      .eq('event_id', params.eventId);

    const existingMap = new Map<number, string>();
    if (existingMatches && Array.isArray(existingMatches)) {
      for (const em of existingMatches) {
        if (typeof em.match_number === 'number') {
          existingMap.set(em.match_number, em.id);
        }
      }
    }

    const upsertPayload = matchRows.map((row) => {
      const existingId = existingMap.get(row.match_number);
      return existingId ? { ...row, id: existingId } : row;
    });

    const { error: upsertError } = await (supabase.from('tournament_matches') as any)
      .upsert(upsertPayload, { onConflict: 'id' });

    if (upsertError) {
      return {
        success: false,
        totalMatches: 0,
        courtsAssigned: 0,
        message: upsertError.message || 'Lỗi khi lưu các trận đấu',
        error: upsertError.code,
      };
    }

    return {
      success: true,
      totalMatches: matchRows.length,
      courtsAssigned: courtsCount,
      message: `Đã công bố ${matchRows.length} trận đấu trên ${courtsCount} sân thành công!`,
    };
  } catch (err: any) {
    return {
      success: false,
      totalMatches: 0,
      courtsAssigned: 0,
      message: err?.message || 'Lỗi kết nối khi công bố bốc thăm',
    };
  }
}

/**
 * Lấy danh sách trận đấu của giải đấu theo sân và lượt đấu
 */
export async function getTournamentMatches(
  tournamentId: string,
  eventId?: string
): Promise<MatchDisplayItem[]> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_MOCK_MATCHES;
  }

  try {
    const supabase = createClient();
    let query = (supabase.from('tournament_matches') as any)
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('match_number', { ascending: true });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return DEFAULT_MOCK_MATCHES;
    }

    return data.map((item: any) => {
      const courtNumber = parseInt(item.court_info?.replace(/\D/g, '') || '1', 10) || 1;
      return {
        id: item.id,
        matchNumber: item.match_number || 1,
        courtNumber,
        courtInfo: item.court_info || `Sân ${courtNumber}`,
        round: item.round || 1,
        roundName: item.round_name || `Vòng ${item.round || 1}`,
        stage: item.stage || 'knockout',
        teamA: item.placeholder_entry1 || 'Đội A',
        teamB: item.placeholder_entry2 || 'Đội B',
        clubA: undefined,
        clubB: undefined,
        currentScoreA: item.points_a ?? 0,
        currentScoreB: item.points_b ?? 0,
        setsA: item.sets_a ?? 0,
        setsB: item.sets_b ?? 0,
        status: item.status || 'pending',
        version: item.version || 1,
      };
    });
  } catch {
    return DEFAULT_MOCK_MATCHES;
  }
}

/**
 * Hủy công bố kết quả bốc thăm (Reset nhánh đấu)
 */
export async function clearDrawMatches(
  tournamentId: string,
  eventId?: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Đã hủy công bố nhánh đấu (Mock)' };
  }

  try {
    const supabase = createClient();
    let query = (supabase.from('tournament_matches') as any)
      .delete()
      .eq('tournament_id', tournamentId)
      .neq('id', '50000000-0000-0000-0000-000000000001'); // Bảo toàn trận mẫu Sân 1

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { error } = await query;
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Đã hủy công bố các trận đấu thành công' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Lỗi mạng' };
  }
}
