import { MatchDisplayItem } from './drawService';

export type CourtStatus = 'available' | 'warmup' | 'in_progress' | 'maintenance';

export interface CourtInfo {
  courtNumber: number;
  courtName: string;
  status: CourtStatus;
  currentMatch?: MatchDisplayItem | null;
  warmupSecondsLeft?: number;
  matchStartedAt?: string | null;
  umpireName?: string | null;
  serviceJudgeName?: string | null;
  nextMatch?: MatchDisplayItem | null;
}

export interface QueueMatchItem extends MatchDisplayItem {
  eventCategory: string;
  isRestWarning?: boolean;
  restMinutesRemaining?: number;
  restingAthleteName?: string;
  feederInfo?: string;
}

const STORAGE_COURTS_KEY = 'badminton_court_dispatcher_courts_v1';
const STORAGE_QUEUE_KEY = 'badminton_court_dispatcher_queue_v1';

// Initial default demo queue
export const INITIAL_DEMO_MATCHES: QueueMatchItem[] = [
  {
    id: 'disp-m-1',
    matchNumber: 1,
    courtNumber: 1,
    courtInfo: 'Sân 1',
    round: 1,
    roundName: 'Tứ Kết 1',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Nguyễn Văn A / Lê Hùng',
    teamB: 'Phạm Đức C / Vũ Tuấn',
    clubA: 'CLB Ba Đình',
    clubB: 'CLB Hoàn Kiếm',
    currentScoreA: 20,
    currentScoreB: 18,
    setsA: 1,
    setsB: 0,
    status: 'in_progress',
    version: 3,
  },
  {
    id: 'disp-m-2',
    matchNumber: 2,
    courtNumber: 2,
    courtInfo: 'Sân 2',
    round: 1,
    roundName: 'Tứ Kết 2',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Trần Thị B / Mai Lan',
    teamB: 'Hoàng Minh D / Đỗ Hải',
    clubA: 'CLB Cầu Giấy',
    clubB: 'CLB Thăng Long',
    currentScoreA: 15,
    currentScoreB: 12,
    setsA: 0,
    setsB: 0,
    status: 'warmup',
    version: 1,
  },
  {
    id: 'disp-m-3',
    matchNumber: 3,
    courtNumber: 3,
    courtInfo: 'Sân 3',
    round: 1,
    roundName: 'Vòng Bảng - Bảng A',
    stage: 'group',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'VIỆT ANH - MINH KHANG',
    teamB: 'HÙNG - TRUNG',
    clubA: 'CLB Ba Đình',
    clubB: 'CLB Cầu Giấy',
    currentScoreA: 21,
    currentScoreB: 17,
    setsA: 1,
    setsB: 0,
    status: 'completed',
    version: 2,
  },
  {
    id: 'disp-m-4',
    matchNumber: 4,
    courtNumber: 0,
    courtInfo: 'Chưa xếp',
    round: 1,
    roundName: 'Tứ Kết 3',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Lý Quốc Bảo / Ngô Thành',
    teamB: 'Đặng Đình Toàn / Bùi Đức',
    clubA: 'CLB Đống Đa',
    clubB: 'CLB Hai Bà Trưng',
    currentScoreA: 0,
    currentScoreB: 0,
    setsA: 0,
    setsB: 0,
    status: 'ready',
    version: 1,
  },
  {
    id: 'disp-m-5',
    matchNumber: 5,
    courtNumber: 0,
    courtInfo: 'Chưa xếp',
    round: 1,
    roundName: 'Tứ Kết 4',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Lương Thế Vinh / Phan Anh',
    teamB: 'Vũ Trọng Phụng / Nam Cao',
    clubA: 'CLB Thanh Xuân',
    clubB: 'CLB Tây Hồ',
    currentScoreA: 0,
    currentScoreB: 0,
    setsA: 0,
    setsB: 0,
    status: 'ready',
    version: 1,
  },
  {
    id: 'disp-m-6',
    matchNumber: 6,
    courtNumber: 0,
    courtInfo: 'Chưa xếp',
    round: 2,
    roundName: 'Bán Kết 1',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Thắng Trận #1',
    teamB: 'Thắng Trận #2',
    currentScoreA: 0,
    currentScoreB: 0,
    setsA: 0,
    setsB: 0,
    status: 'pending',
    version: 1,
    feederInfo: 'Chờ kết quả Trận #1 và Trận #2',
  },
  {
    id: 'disp-m-7',
    matchNumber: 7,
    courtNumber: 0,
    courtInfo: 'Chưa xếp',
    round: 2,
    roundName: 'Bán Kết 2',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Thắng Trận #3',
    teamB: 'Thắng Trận #4',
    currentScoreA: 0,
    currentScoreB: 0,
    setsA: 0,
    setsB: 0,
    status: 'pending',
    version: 1,
    feederInfo: 'Chờ kết quả Trận #3 và Trận #4',
  },
  {
    id: 'disp-m-8',
    matchNumber: 8,
    courtNumber: 0,
    courtInfo: 'Chưa xếp',
    round: 3,
    roundName: 'Chung Kết',
    stage: 'knockout',
    eventCategory: 'Đôi Nam Phong Trào',
    teamA: 'Thắng Bán Kết 1',
    teamB: 'Thắng Bán Kết 2',
    currentScoreA: 0,
    currentScoreB: 0,
    setsA: 0,
    setsB: 0,
    status: 'pending',
    version: 1,
    feederInfo: 'Chờ kết quả 2 trận Bán Kết',
  },
];

// Initial default courts setup
export const INITIAL_DEMO_COURTS: CourtInfo[] = [
  {
    courtNumber: 1,
    courtName: 'Sân 1',
    status: 'available',
    currentMatch: null,
    matchStartedAt: null,
    umpireName: '',
  },
  {
    courtNumber: 2,
    courtName: 'Sân 2',
    status: 'available',
    currentMatch: null,
    matchStartedAt: null,
    umpireName: '',
  },
  {
    courtNumber: 3,
    courtName: 'Sân 3',
    status: 'available',
    currentMatch: null,
    matchStartedAt: null,
    umpireName: '',
  },
  {
    courtNumber: 4,
    courtName: 'Sân 4',
    status: 'available',
    currentMatch: null,
    matchStartedAt: null,
    umpireName: '',
  },
];

/**
 * Kiểm tra xem VĐV có vừa thi đấu xong cách đây dưới `minRestMinutes` (mặc định 15 phút) không.
 */
export function checkAthleteRestTime(
  athleteNames: string[],
  recentFinished: { athleteNames: string[]; finishedAt: number }[],
  minRestMinutes = 15
): { athleteName: string; minutesRemaining: number } | null {
  const now = Date.now();

  for (const name of athleteNames) {
    const cleanName = name.trim().toLowerCase();
    const lastMatch = recentFinished.find((f) =>
      f.athleteNames.some((n) => n.trim().toLowerCase() === cleanName)
    );

    if (lastMatch) {
      const elapsedMinutes = (now - lastMatch.finishedAt) / (1000 * 60);
      if (elapsedMinutes < minRestMinutes) {
        return {
          athleteName: name,
          minutesRemaining: Math.ceil(minRestMinutes - elapsedMinutes),
        };
      }
    }
  }

  return null;
}

/**
 * Lấy danh sách trạng thái các sân
 */
export async function getCourts(
  _tournamentId?: string,
  courtCount = 4
): Promise<CourtInfo[]> {
  if (typeof window === 'undefined') {
    return INITIAL_DEMO_COURTS.slice(0, courtCount);
  }

  try {
    const raw = localStorage.getItem(STORAGE_COURTS_KEY);
    if (raw) {
      const parsed: CourtInfo[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error and return demo
  }

  const defaults = INITIAL_DEMO_COURTS.slice(0, courtCount);
  saveCourtsState(defaults);
  return defaults;
}

/**
 * Lưu trạng thái các sân vào LocalStorage
 */
export function saveCourtsState(courts: CourtInfo[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_COURTS_KEY, JSON.stringify(courts));
    window.dispatchEvent(new CustomEvent('badminton_court_dispatcher_update', { detail: courts }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Cập nhật điểm số trực tiếp của trận đang thi đấu trên sân
 */
export async function updateCourtScore(
  courtNumber: number,
  scoreA: number,
  scoreB: number,
  setsA?: number,
  setsB?: number
): Promise<boolean> {
  const courts = await getCourts();
  const queue = await getMatchQueue();
  const court = courts.find((c) => c.courtNumber === courtNumber);
  if (!court || !court.currentMatch) return false;

  court.currentMatch.currentScoreA = scoreA;
  court.currentMatch.currentScoreB = scoreB;
  if (setsA !== undefined) court.currentMatch.setsA = setsA;
  if (setsB !== undefined) court.currentMatch.setsB = setsB;

  const matchInQueue = queue.find((m) => m.id === court.currentMatch?.id);
  if (matchInQueue) {
    matchInQueue.currentScoreA = scoreA;
    matchInQueue.currentScoreB = scoreB;
    if (setsA !== undefined) matchInQueue.setsA = setsA;
    if (setsB !== undefined) matchInQueue.setsB = setsB;
    saveQueueState(queue);
  }

  saveCourtsState(courts);
  return true;
}

/**
 * Lấy hàng đợi các trận đấu
 */
export async function getMatchQueue(_tournamentId?: string): Promise<QueueMatchItem[]> {
  if (typeof window === 'undefined') {
    return INITIAL_DEMO_MATCHES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
    if (raw) {
      const parsed: QueueMatchItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback
  }

  saveQueueState(INITIAL_DEMO_MATCHES);
  return INITIAL_DEMO_MATCHES;
}

/**
 * Lưu hàng đợi trận đấu vào LocalStorage
 */
export function saveQueueState(queue: QueueMatchItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('badminton_court_queue_update', { detail: queue }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Điều phối trận đấu lên sân
 */
export async function dispatchMatchToCourt(
  courtNumber: number,
  matchId: string,
  options: {
    startWarmupImmediately?: boolean;
    umpireName?: string;
  } = {}
): Promise<{ success: boolean; message: string }> {
  const courts = await getCourts();
  const queue = await getMatchQueue();

  const targetCourtIdx = courts.findIndex((c) => c.courtNumber === courtNumber);
  const targetMatchIdx = queue.findIndex((m) => m.id === matchId);

  if (targetCourtIdx === -1) {
    return { success: false, message: `Không tìm thấy Sân ${courtNumber}` };
  }
  if (targetMatchIdx === -1) {
    return { success: false, message: `Không tìm thấy trận đấu có ID ${matchId}` };
  }

  const match = queue[targetMatchIdx];
  const court = courts[targetCourtIdx];

  const willWarmup = options.startWarmupImmediately ?? true;
  const newStatus: CourtStatus = willWarmup ? 'warmup' : 'in_progress';

  // Update match record
  match.courtNumber = courtNumber;
  match.courtInfo = `Sân ${courtNumber}`;
  match.status = willWarmup ? 'ready' : 'in_progress';

  // Update court record
  court.status = newStatus;
  court.currentMatch = match;
  court.warmupSecondsLeft = willWarmup ? 120 : undefined;
  court.matchStartedAt = willWarmup ? null : new Date().toISOString();
  if (options.umpireName) {
    court.umpireName = options.umpireName;
  }

  saveCourtsState(courts);
  saveQueueState(queue);

  return {
    success: true,
    message: `Đã gọi Trận #${match.matchNumber} lên Sân ${courtNumber} (${willWarmup ? 'Khởi động 2:00' : 'Bắt đầu ngay'})`,
  };
}

/**
 * Đổi trạng thái từ Khởi Động sang Bắt Đầu Thi Đấu
 */
export async function startCourtMatch(courtNumber: number): Promise<{ success: boolean }> {
  const courts = await getCourts();
  const queue = await getMatchQueue();

  const court = courts.find((c) => c.courtNumber === courtNumber);
  if (!court || !court.currentMatch) return { success: false };

  court.status = 'in_progress';
  court.warmupSecondsLeft = undefined;
  court.matchStartedAt = new Date().toISOString();

  const match = queue.find((m) => m.id === court.currentMatch?.id);
  if (match) {
    match.status = 'in_progress';
  }

  saveCourtsState(courts);
  saveQueueState(queue);
  return { success: true };
}

/**
 * Chốt kết thúc trận đấu trên sân & giải phóng sân
 */
export async function finishCourtMatch(
  courtNumber: number,
  result?: { scoreA?: number; scoreB?: number; setsA?: number; setsB?: number }
): Promise<{ success: boolean; completedMatch?: QueueMatchItem }> {
  const courts = await getCourts();
  const queue = await getMatchQueue();

  const court = courts.find((c) => c.courtNumber === courtNumber);
  if (!court || !court.currentMatch) return { success: false };

  const currentMatch = court.currentMatch;
  const matchInQueue = queue.find((m) => m.id === currentMatch.id);

  if (matchInQueue) {
    matchInQueue.status = 'completed';
    if (result) {
      if (result.setsA !== undefined) matchInQueue.setsA = result.setsA;
      if (result.setsB !== undefined) matchInQueue.setsB = result.setsB;
      if (result.scoreA !== undefined) matchInQueue.currentScoreA = result.scoreA;
      if (result.scoreB !== undefined) matchInQueue.currentScoreB = result.scoreB;
    }
  }

  // If there's an On Deck / nextMatch, we can assign or keep ready
  court.currentMatch = null;
  court.status = 'available';
  court.warmupSecondsLeft = undefined;
  court.matchStartedAt = null;

  saveCourtsState(courts);
  saveQueueState(queue);

  return { success: true, completedMatch: matchInQueue };
}

/**
 * Thiết lập trận chuẩn bị kế tiếp (On Deck) cho sân
 */
export async function setCourtNextMatch(
  courtNumber: number,
  matchId: string | null
): Promise<{ success: boolean }> {
  const courts = await getCourts();
  const queue = await getMatchQueue();

  const court = courts.find((c) => c.courtNumber === courtNumber);
  if (!court) return { success: false };

  if (matchId === null) {
    court.nextMatch = null;
  } else {
    const match = queue.find((m) => m.id === matchId);
    if (match) court.nextMatch = match;
  }

  saveCourtsState(courts);
  return { success: true };
}

/**
 * Reset toàn bộ dữ liệu điều phối về trạng thái mẫu ban đầu
 */
export function resetDispatcherDemo() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_COURTS_KEY);
    localStorage.removeItem(STORAGE_QUEUE_KEY);
  } catch {
    // Ignore
  }
}
