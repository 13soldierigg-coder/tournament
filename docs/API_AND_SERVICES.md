# Tầng Dịch Vụ & Giao Tiếp Dữ Liệu — API & Services Specification

Tài liệu này đặc tả toàn bộ tầng dịch vụ (Service Layer), các giao diện lập trình TypeScript, cấu hình Supabase Client, kênh thời gian thực (Supabase Realtime) và các hàm Edge Functions.

---

## 1. Kiến Trúc Tầng Dịch Vụ (Service Layer Architecture)

Hệ thống tuân thủ mô hình phân tầng chặt chẽ:
- **Server Actions & Server Components**: Sử dụng `@supabase/ssr` với cookie-based auth để đọc dữ liệu bảo mật từ server, tối ưu TTFB và SEO.
- **Client Services**: Dùng `createBrowserClient` để đọc dữ liệu theo RLS và gọi RPC/Server Action. Các thay đổi có hiệu lực nghiệp vụ (chấm điểm, sinh nhánh, duyệt đơn, thanh toán) tuyệt đối không là chuỗi `UPDATE` trực tiếp từ client.
- **Service Interfaces**: Mỗi thực thể nghiệp vụ có một lớp dịch vụ chuyên trách (Single Responsibility Principle).

```
src/
└── lib/
    ├── supabase/
    │   ├── client.ts             # Supabase Client cho Browser (CSR)
    │   ├── server.ts             # Supabase Client cho Server Components (Next.js 15 async cookies)
    │   └── middleware.ts         # Supabase Session Refresh Middleware
    └── services/                 # Tầng dịch vụ nghiệp vụ (Dual-mode: Supabase + Fallback)
        ├── authService.ts        # Quản lý phiên, vai trò người dùng (Chờ nâng cấp Phase 2)
        ├── tournamentService.ts  # Quản lý giải đấu, nội dung thi đấu, map Supabase data
        ├── scoringService.ts     # Chấm điểm, lưu snapshot điểm, RPC finalize_match_result
        ├── registrationService.ts# Đơn đăng ký VĐV, hold_registration_slot RPC
        ├── drawService.ts        # Bốc thăm, lưu lịch và các trận đấu vòng bảng/knockout
        ├── dispatcherService.ts  # Điều phối trận đấu vào sân, FSM trạng thái sân
        └── rankingService.ts     # Thống kê thành tích và bảng xếp hạng CLB/VĐV
```

---

## 2. Đặc Tả Các Lớp Dịch Vụ (TypeScript Service Interfaces)

### 2.1. `TournamentService` — Quản Lý Giải Đấu
```typescript
export interface ITournamentService {
  // Tra cứu công khai
  getPublicTournaments(filter?: { status?: string; sport?: string }): Promise<Tournament[]>;
  getTournamentBySlug(slug: string): Promise<TournamentDetail | null>;
  
  // Quản trị BTC
  getOrganizerTournaments(organizerId: string): Promise<Tournament[]>;
  createTournament(payload: CreateTournamentInput): Promise<Tournament>;
  updateTournament(id: string, payload: Partial<Tournament>): Promise<Tournament>;
  deleteTournament(id: string): Promise<void>;
  
  // Thiết lập bảng đấu & Bốc thăm
  setupGroupStage(tournamentId: string, eventId: string, groups: GroupAssignmentMap): Promise<void>;
  generateKnockoutBracket(tournamentId: string, eventId: string, options: BracketOptions): Promise<void>;
  advanceGroupWinnersToKnockout(tournamentId: string, eventId: string): Promise<void>;
  
  // Bảng xếp hạng & Tổng kết
  getGroupStandings(tournamentId: string, eventId: string): Promise<GroupStanding[]>;
  completeTournament(tournamentId: string): Promise<TournamentPodium>;
}
```

### 2.2. `MatchService` — Điều Hành Trận Đấu & Chấm Điểm
```typescript
export interface IMatchService {
  // Lấy lịch thi đấu
  getMatches(tournamentId: string, filters?: { stage?: string; court?: string; status?: string }): Promise<TournamentMatch[]>;
  getMatchById(matchId: string): Promise<TournamentMatch | null>;
  
  // Điều phối & Sắp lịch (Chỉ dành cho Organizer qua Server Action / RPC)
  updateMatchSchedule(matchId: string, schedule: { courtInfo: string; matchTime: string }): Promise<void>;
  updateMatchStatus(matchId: string, status: MatchStatus): Promise<void>;
  
  // 1. Ghi nhận điểm số trực tiếp từng pha cầu (Live Score Snapshot - gọi khi bấm +1/Undo)
  recordScoreSnapshot(
    matchId: string,
    snapshot: {
      gameScores: GameScore[];
      currentSet: number;
      pointsA: number;
      pointsB: number;
      setsA: number;
      setsB: number;
      serverEntryId?: string; // VĐV/đội đang cầm giao cầu
      courtSideA?: 'left' | 'right'; // Góc nhìn hiển thị trên sân (không đổi ID đội)
      expectedVersion: number;
      requestId: string; // Idempotency key
    }
  ): Promise<{ success: boolean; version: number }>;

  // 2. Chốt kết quả trận đấu hoàn chỉnh (Finalize Match - chỉ gọi sau khi trọng tài xác nhận Modal)
  finalizeMatchResult(
    matchId: string,
    result: {
      gameScores: GameScore[];
      winnerId: string;
      expectedVersion: number;
      requestId: string;
      resultType?: 'normal' | 'walkover' | 'retired';
      notes?: string;
    }
  ): Promise<{ success: boolean; advancedToMatchId?: string; version: number }>;
  
  // 3. Hủy kết quả có Cascade Rollback (Dành riêng cho BTC)
  cancelMatchResult(matchId: string, expectedVersion: number, requestId: string): Promise<{ success: boolean; revertedMatchesCount: number }>;

  // 4. Gửi yêu cầu điều chỉnh điểm khi có xung đột (Umpire Conflict Flow)
  requestScoreCorrection(
    matchId: string,
    payload: {
      localScores: GameScore[];
      reason: string;
      localVersion: number;
    }
  ): Promise<{ requestId: string }>;
}
```

### 2.3. `RegistrationService` — Cổng Đăng Ký VĐV
```typescript
export interface IRegistrationService {
  // VĐV thao tác
  submitRegistration(payload: CreateRegistrationInput): Promise<TournamentRegistration>;
  getAthleteRegistrations(athleteId: string): Promise<TournamentRegistrationWithTournament[]>;
  withdrawRegistration(registrationId: string, reason?: string): Promise<void>;
  
  // Mời đồng đội đánh đôi
  generatePartnerInviteLink(registrationId: string): Promise<string>;
  confirmPartnerInvitation(token: string, partnerAthleteId: string): Promise<void>;

  // Tìm bạn qua SĐT (RPC bảo mật, rate-limit tối đa 5 lần/phút, chỉ trả ID & tên hiển thị/CLB, giấu PII)
  searchPartnerByPhone(phone: string): Promise<AthletePublicProfile | null>;
  
  // Ban tổ chức duyệt
  getRegistrationsForTournament(tournamentId: string, status?: string): Promise<TournamentRegistration[]>;
  reviewRegistration(
    registrationId: string,
    action: 'approve' | 'reject' | 'waitlist',
    adminNotes?: string
  ): Promise<void>;
  updatePaymentStatus(
    registrationId: string,
    paymentStatus: 'paid' | 'unpaid' | 'waived',
    paymentRef?: string
  ): Promise<void>;
  
  // Chốt danh sách sang entries
  convertApprovedRegistrationsToEntries(tournamentId: string, eventId: string): Promise<TournamentEntry[]>;
}
```

### 2.4. `AthleteService` — Hồ Sơ VĐV
```typescript
export interface IAthleteService {
  getCurrentAthleteProfile(): Promise<Athlete | null>;
  updateProfile(athleteId: string, profile: Partial<Athlete>): Promise<Athlete>;
  getAthleteStats(athleteId: string): Promise<AthleteStatsSummary>;
  searchAthletes(query: string): Promise<AthleteBasic[]>;
}
```

### 2.5. `OfflineSyncService` — Quản Lý Hàng Đợi Ngoại Tuyến & Xung Đột (IndexedDB)
```typescript
export interface QueuedMatchMutation {
  id: string;
  matchId: string;
  gameScores: GameScore[];
  winnerId?: string;
  expectedVersion: number;
  requestId: string;
  timestamp: number;
}

export interface IOfflineSyncService {
  // Lưu mutation vào IndexedDB khi mất kết nối
  queueMatchMutation(mutation: QueuedMatchMutation): Promise<void>;
  getPendingMutations(): Promise<QueuedMatchMutation[]>;
  
  // Đồng bộ hàng đợi khi có mạng trở lại
  flushSyncQueue(): Promise<{ synced: number; conflicts: string[] }>;
  
  // Xử lý xung đột phiên bản (Tuyệt đối không có Force Sync từ client trọng tài)
  acceptServerVersion(matchId: string): Promise<void>;
  submitCorrectionRequest(matchId: string, reason: string): Promise<void>;
}
```

---

## 3. Kênh Supabase Realtime & Sự Kiện WebSocket

Hệ thống thiết lập các Kênh (Realtime Channels) để đồng bộ hóa trạng thái tức thì giữa các thiết bị:

### 3.1. Kênh Giải Đấu: `tournament-live:${tournamentId}`
Lắng nghe thay đổi dữ liệu trong bảng `tournament_matches`:
```typescript
import { createBrowserClient } from '@/lib/supabase/client';

export function subscribeToTournamentLive(
  tournamentId: string,
  onMatchUpdated: (match: TournamentMatch) => void
) {
  const supabase = createBrowserClient();
  
  const channel = supabase
    .channel(`tournament-live:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        onMatchUpdated(payload.new as TournamentMatch);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

Postgres Changes là nguồn đồng bộ chuẩn cho bản ghi `tournament_matches`; UI phải refetch state khi reconnect hoặc khi nhận version bị hổng. Broadcast chỉ dùng cho tín hiệu tạm thời như “gọi vào sân”, không được là nguồn sự thật. Channel phải có authorization/realtime policy cùng điều kiện giải công khai hoặc quyền BTC.

### 3.2. Sự Kiện Gọi VĐV Ra Sân (Broadcast Channel)
Khi trọng tài hoặc ban tổ chức bấm "Gọi vào sân":
```typescript
// Gửi broadcast
channel.send({
  type: 'broadcast',
  event: 'CALL_TO_COURT',
  payload: {
    matchId: '...',
    court: 'Sân số 3',
    team1Name: 'Nguyễn Văn A',
    team2Name: 'Trần Văn B',
  }
});
```

---

## 4. Đặc Tả Các Hàm Supabase Edge Functions

Hệ thống sử dụng các hàm serverless Deno/TypeScript chạy tại biên mạng của Supabase:

### 4.1. `send-notification`
- **Mục đích**: Gửi Email và Web Push khi có sự kiện: đơn đăng ký được duyệt, trận đấu sắp bắt đầu, hoặc có bạn mời đánh đôi.
- **Phương thức**: `POST /functions/v1/send-notification`
- **Payload**:
  ```json
  {
    "userId": "uuid-here",
    "type": "registration_approved",
    "title": "Đơn đăng ký giải đã được duyệt!",
    "body": "Bạn đã có tên trong danh sách thi đấu Giải Cầu Lông Mùa Thu 2026.",
    "actionUrl": "/athlete/dashboard"
  }
  ```

### 4.2. `export-results`
- **Mục đích**: Sinh file PDF tài liệu bế mạc giải đấu:
  - Bảng tổng sắp huy chương và danh sách nhà vô địch.
  - Toàn bộ sơ đồ nhánh đấu Knockout có tỷ số chi tiết.
  - Bảng điểm và thông số các trận vòng bảng.
- **Phương thức**: `GET /functions/v1/export-results?tournamentId=...&format=pdf`

### 4.3. `generate-schedule` (Thuật Toán Sắp Lịch Tự Động)
- **Mục đích**: Tự động phân bổ danh sách trận đấu vào các sân và khung giờ có sẵn.
- **Ràng buộc nghiệp vụ (Constraints)**:
  - **Không trùng sân**: Một sân tại một thời điểm chỉ có 1 trận đấu.
  - **Không xung đột VĐV**: Một VĐV không thể thi đấu 2 trận cùng lúc.
  - **Thời gian nghỉ tối thiểu**: Giữa 2 trận đấu liên tiếp của một VĐV phải có tối thiểu 20 phút nghỉ ngơi theo tiêu chuẩn thể lực.
- **Phương thức**: `POST /functions/v1/generate-schedule`
- **Payload**:
  ```json
  {
    "tournamentId": "...",
    "courts": ["Sân 1", "Sân 2", "Sân 3", "Sân 4"],
    "startTime": "2026-09-20T08:00:00+07:00",
    "matchDurationMinutes": 35,
    "breakBetweenMatchesMinutes": 20
  }
  ```

`startTime` luôn có UTC offset; múi giờ mặc định lấy từ `tournaments.timezone`, không giả định UTC.

### 4.4. RPC có tính toàn vẹn giao dịch (Server-Authoritative Transactions)
- `record_score_snapshot(match_id, game_scores, points_a, points_b, sets_a, sets_b, server_entry_id, expected_version, request_id)`: Ghi nhận điểm từng pha cầu cho trận đang đấu (`in_progress`), tăng `version`, phát sự kiện Realtime CDC tức thì tới màn hình khán giả.
- `finalize_match_result(match_id, game_scores, winner_id, expected_version, request_id, result_type, notes)`: Khóa trận và các trận phụ thuộc, validate thuật toán BWF ở server, gán người thắng, thăng nhánh vòng sau và ghi audit trail trong cùng transaction.
- `cancel_match_result(match_id, expected_version, request_id)`: Rollback đệ quy kết quả và nhánh đấu trong transaction, trả phiên bản mới cho client (chỉ dành cho Organizer).
- `correct_match_score(match_id, target_version, new_scores, reason, admin_user_id)`: RPC cấp cao dành riêng cho Ban tổ chức điều chỉnh điểm số khi có đối soát xung đột hoặc khiếu nại, có audit log chi tiết.
- `finalize_entries(tournament_id, event_id, request_id)`: Kiểm tra partner, payment, quota và tạo entries + members theo một lần chạy idempotent.
