# Implementation Plan — Badminton Tournament Platform

> Dựa trên kết quả audit 21,799 dòng code, 68 files, 18 routes.

---

## Phase 1: 🔴 Critical Fixes — ✅ ĐÃ HOÀN THÀNH
> **Trạng thái:** Đã triển khai & xác minh thành công. Toàn bộ 83/83 unit tests pass, Next.js build 18 routes thành công không có lỗi type.

Mục tiêu ban đầu: Fix bugs làm crash/sai dữ liệu, sửa service layer để data integrity đúng. Đã xử lý:
- ✅ `advancement.ts`: Fix crash 5+ bảng với `all_top_two`, phân bổ Byes đối xứng và swap tránh trùng bảng.
- ✅ `standings.ts`: Bổ sung `gamesLost` và `pointsLost` cho bên thua walkover.
- ✅ `scoring.ts`: Xử lý hoà điểm tại đích ở chế độ sudden death (tránh gán sai winner).
- ✅ `bracket.ts`: Thêm `wouldConflict` check khi đảo vị trí tránh gặp cùng CLB.
- ✅ `tournamentService.ts`: Map dữ liệu từ Supabase thay vì discard; dùng `upsert` cho events thay vì xóa sạch gây hỏng Foreign Key; log structured errors thay vì nuốt lỗi.
- ✅ `AuthContext.tsx`: Memoize `value` object bằng `useMemo` để tránh re-render lãng phí.
- ✅ **Test suite**: Bổ sung 10 test cases mới, tổng test tăng từ 73 lên 83 tests.

---

### Engine Module

#### [MODIFY] [advancement.ts](file:///g:/AppHavuco/tournament-web/src/engine/advancement.ts)

**Bug: Crash khi 5+ groups dùng `all_top_two` (Lines 455-495)**

Hiện tại `firsts[i]` truy cập ngoài mảng khi `byesCount > numGroups`. Ví dụ 5 groups → 10 teams → bracket 16 → 6 byes nhưng `firsts` chỉ có 5 phần tử.

**Sửa:**
- Phân bổ Byes đối xứng giữa upper/lower half thay vì cluster tất cả ở đầu
- Dùng `Math.min(byesCount, firsts.length)` để không truy cập ngoài mảng
- Kiểm tra `BYE vs BYE` pairing — nếu cả 2 slot đều BYE thì tự động advance thay vì tạo match trống
- Fix group separation logic (Lines 477-488): Scan cả forward + backward khi swap

#### [MODIFY] [standings.ts](file:///g:/AppHavuco/tournament-web/src/engine/standings.ts)

**Bug 1: Walkover stats không đầy đủ (Lines 58-71)**

```typescript
// HIỆN TẠI — bên thua không bị trừ gamesLost, pointsLost
if (match.winnerId === match.entryAId) {
  statsA.matchesWon++;
  statsB.matchesLost++;
  statsA.gamesWon += 2;      // ✅
  statsA.pointsWon += 42;    // ✅
  // ❌ THIẾU: statsB.gamesLost += 2
  // ❌ THIẾU: statsB.pointsLost += 42
}
```

**Sửa:**
- Thêm `gamesLost` và `pointsLost` cho bên thua
- Tính games/points dựa trên `stageConfig` thay vì hardcode `2` và `42`

**Bug 2: 3-Way Tie tính sai (Lines 139-171)**

BWF Clause 16.1.3: khi 3+ đội hòa, tie-break phải tính **chỉ từ trận giữa các đội hòa**. Hiện tại dùng tất cả trận trong bảng.

**Sửa:**
- Khi `tiedWithSameWins.length >= 3`: filter matches chỉ giữa tied teams, tính lại game/point difference
- Khi tie giảm xuống 2 teams: apply H2H giữa 2 teams đó

#### [MODIFY] [scoring.ts](file:///g:/AppHavuco/tournament-web/src/engine/scoring.ts)

**Bug: Sudden death tie at target score (Line 43, 51-53)**

`candidateWinner` mặc định là `'B'` khi `scoreA === scoreB`. Nếu 21-21 trong sudden death → sai kết quả.

**Sửa:**
- Thêm check `scoreA === scoreB` trước khi return winner
- Return `{ valid: false, reason: 'Tied at target is impossible in sudden death' }` khi cả hai đạt target

#### [MODIFY] [bracket.ts](file:///g:/AppHavuco/tournament-web/src/engine/bracket.ts)

**Bug: Club separation swap tạo conflict mới (Lines 167-201)**

**Sửa:**
- Check `e2.club !== slots[otherM * 2]?.club` trước khi swap
- Scan cả `otherM * 2` và `otherM * 2 + 1` làm swap candidates
- Scan cả backward (`otherM < m`) không chỉ forward

---

### Test Files cho Engine Bugs

#### [NEW] Thêm tests vào [advancement.test.ts](file:///g:/AppHavuco/tournament-web/src/engine/__tests__/advancement.test.ts)

- Test `all_top_two` với 5 groups (10 teams → 16 bracket) — phải không crash
- Test `all_top_two` với 6 groups (12 teams → 16 bracket)
- Test `all_top_two` với 7 groups (14 teams → 16 bracket)
- Test không có `BYE vs BYE` match trong output

#### [NEW] Thêm tests vào [standings.test.ts](file:///g:/AppHavuco/tournament-web/src/engine/__tests__/standings.test.ts)

- Test walkover: bên thua phải có `gamesLost > 0` và `pointsLost > 0`
- Test walkover: `gameDifference` bên thua phải âm
- Test 3-way circular tie (A beat B, B beat C, C beat A) — chỉ tính trận giữa tied teams
- Test true equal-wins H2H (cả 2 teams có cùng số trận thắng)

#### [NEW] Thêm tests vào [scoring.test.ts](file:///g:/AppHavuco/tournament-web/src/engine/__tests__/scoring.test.ts)

- Test 21-21 sudden death → `valid: false`
- Test 15-15 sudden death → `valid: false`

---

### Service Layer

#### [MODIFY] [tournamentService.ts](file:///g:/AppHavuco/tournament-web/src/lib/services/tournamentService.ts)

**Fix 1: `getTournaments()` — Sử dụng data từ Supabase (Lines 104-110)**

```typescript
// HIỆN TẠI — data bị discard
const { data, error } = await query;
if (error || !data || data.length === 0) {
  return filterTournamentsList(allTournaments, filter?.status);
}
return filterTournamentsList(allTournaments, filter?.status); // ← data không dùng!
```

**Sửa:**
- Map `data` records sang `MockTournament` shape
- Merge với local data (ưu tiên DB records nếu trùng ID)
- Return merged list

**Fix 2: `updateTournamentWithEvents()` — Dùng upsert thay delete-all (Lines 537-565)**

```typescript
// HIỆN TẠI — xóa hết events rồi tạo lại
await supabase.from('tournament_events').delete().eq('tournament_id', tourData.id);
await supabase.from('tournament_events').insert(eventPayloads);
```

**Sửa:**
- Fetch existing events by `tournament_id`
- Update existing events (match by event `id`)
- Insert new events (events không có `id`)
- Không xóa events đã có registrations
- Soft-delete events đã bị user remove (set `status = 'archived'`)

**Fix 3: Xóa silent `success: true` trong catch blocks (Lines 34, 57, 75, 111, 378, 425, 563)**

**Sửa:**
- Remove fake `success: true` returns
- Return actual error: `{ success: false, error: err.message }`
- Đổi `console.warn` thành structured error logging

---

### Performance Quick Fix

#### [MODIFY] [AuthContext.tsx](file:///g:/AppHavuco/tournament-web/src/lib/context/AuthContext.tsx)

**Fix: Memo provider value (Lines 103-122)**

Wrap `value` object trong `useMemo` với proper dependency array để tránh re-render tất cả consumers mỗi khi parent render.

---

### Verification Plan — Phase 1

```bash
# Run all existing + new tests
npm test

# Verify build passes
npm run build

# Manual: Tạo giải 5 bảng với all_top_two → không crash
# Manual: Nhập walkover → kiểm tra standings bên thua có gamesLost
# Manual: Test 21-21 sudden death → phải invalid
```

---

## Phase 2: 🟠 Auth & Security — ✅ ĐÃ HOÀN THÀNH
> **Trạng thái:** Đã triển khai & kiểm thử toàn diện. Toàn bộ 83/83 unit tests pass, TypeScript compile 0 lỗi. Server-side middleware bảo vệ `/admin/*`, xóa bỏ hoàn toàn quyền bypass ở production.

Mục tiêu đã hoàn tất:
- ✅ `sql/auth_setup.sql`: Thiết lập bảng `court_pins`, RPC `verify_court_pin`, trigger `handle_new_user()` đồng bộ `auth.users` sang `organizers` hoặc `athletes`.
- ✅ `authService.ts`: Tích hợp Supabase Auth thật (`signInWithPassword`, `signUpOrganizer` kèm user metadata), hỗ trợ RPC PIN sân và fallback offline cho môi trường test/dev.
- ✅ `AuthContext.tsx`: Đồng bộ phiên với `supabase.auth.getSession()` và lắng nghe `onAuthStateChange()`.
- ✅ `middleware.ts` & `supabase/middleware.ts`: Bảo vệ phía server, tự động chặn và chuyển hướng người dùng chưa đăng nhập khi truy cập `/admin/*`.
- ✅ `ProtectedRoute.tsx` & `UserMenu.tsx`: Đóng gói các nút bypass quyền (1-click test, đổi role nóng) trong điều kiện `process.env.NODE_ENV === 'development'`.
- ✅ `login/page.tsx`: Giao diện production chỉ hiển thị 2 tab bảo mật (Email/Mật khẩu & PIN Sân), mặc định tab Email; ẩn hoàn toàn tab Test 1-click ở production.

---

### Middleware & Server Protection

#### [NEW] [middleware.ts](file:///g:/AppHavuco/tournament-web/src/middleware.ts)

Tạo Next.js middleware sử dụng `updateSession` từ `@/lib/supabase/middleware`:
- Import và gọi `updateSession(request)` cho mọi request
- Matcher: `['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']`
- Redirect `/admin/*` → `/login` nếu chưa authenticated
- Redirect `/prototypes/organizer-draw`, `/prototypes/court-dispatcher` → `/login`

#### [MODIFY] [supabase/middleware.ts](file:///g:/AppHavuco/tournament-web/src/lib/supabase/middleware.ts)

- Thêm role check logic sau `supabase.auth.getUser()`
- Return redirect response cho protected routes khi user role không đủ quyền

---

### Auth Service Overhaul

#### [MODIFY] [authService.ts](file:///g:/AppHavuco/tournament-web/src/lib/services/authService.ts)

Thay thế toàn bộ mock auth:

| Hiện tại (Mock) | Chuyển sang (Supabase Auth) |
|---|---|
| `signInWithEmail` bỏ qua password | `supabase.auth.signInWithPassword({ email, password })` |
| `signUpOrganizer` tạo fake session | `supabase.auth.signUp()` + insert `user_profiles` |
| `signInWithCourtPin` chấp nhận mọi PIN | Lookup `court_pins` table → verify hashed PIN |
| `localStorage` session | Supabase managed cookies (HTTP-only) |
| Plaintext cookie `auth_role=admin` | Role từ `user_profiles.role` via JWT claims |

- Giữ lại `DEMO_ACCOUNTS` chỉ trong development mode (`process.env.NODE_ENV === 'development'`)
- Xóa `signInWithQuickRole` trong production

#### [MODIFY] [AuthContext.tsx](file:///g:/AppHavuco/tournament-web/src/lib/context/AuthContext.tsx)

- Subscribe Supabase auth state changes: `supabase.auth.onAuthStateChange()`
- Fetch user profile + role từ `user_profiles` table
- Remove `loginWithRole` callback (hoặc chỉ expose khi `NODE_ENV === 'development'`)

---

### UI Cleanup — Remove Security Bypasses

#### [MODIFY] [ProtectedRoute.tsx](file:///g:/AppHavuco/tournament-web/src/components/auth/ProtectedRoute.tsx)

- **Xóa** nút "1-Click Test: Vào Nhanh Với Tư Cách BTC" (Lines 60-66)
- **Xóa** nút "Chuyển Sang Tài Khoản Ban Tổ Chức" (Lines 101-107)
- Thay bằng: Redirect đến `/login` với `?redirect=` URL hiện tại
- i18n hóa tất cả text (sẽ hoàn thiện ở Phase 4)

#### [MODIFY] [UserMenu.tsx](file:///g:/AppHavuco/tournament-web/src/components/auth/UserMenu.tsx)

- **Xóa** Quick Switch Role buttons (Lines 161-208)
- Chỉ hiển thị role hiện tại (read-only)
- Giữ navigation links và logout button
- Dùng `@radix-ui/react-dropdown-menu` thay vì tự code dropdown + `mousedown` listener
- Dùng `next/image` thay vì raw `<img>` cho avatar

#### [MODIFY] [login/page.tsx](file:///g:/AppHavuco/tournament-web/src/app/login/page.tsx)

- Tab "1-Click Test": chỉ render khi `process.env.NODE_ENV === 'development'`
- Tab Email/Password: gọi `supabase.auth.signInWithPassword()`
- Tab Court PIN: gọi service verify PIN thật
- Redirect về `searchParams.redirect` sau khi login thành công

---

### Database & Auth Alignment

> [!NOTE]
> Dự án đã có sẵn mô hình chuẩn trong [`sql/schema.sql`](file:///g:/AppHavuco/tournament-web/sql/schema.sql) gồm bảng `athletes` và `organizers` (đều có `user_id REFERENCES auth.users(id)`), cùng toàn bộ chính sách RLS. Không tạo bảng `user_profiles` riêng biệt để tránh phân mảnh dữ liệu.

#### [NEW] [sql/auth_setup.sql](file:///g:/AppHavuco/tournament-web/sql/auth_setup.sql)

```sql
-- 1. Bảng lưu mã PIN quản lý sân đấu cho Trọng tài
CREATE TABLE IF NOT EXISTS court_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  court_number INT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tournament_id, court_number)
);

ALTER TABLE court_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers manage court pins" ON court_pins FOR ALL
  USING (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));

-- 2. Function & Trigger tự động đồng bộ hồ sơ khi user đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Dựa vào raw_user_meta_data->>'role' được gửi khi signUp
  IF (new.raw_user_meta_data->>'role') = 'organizer' THEN
    INSERT INTO public.organizers (user_id, name, contact_email, contact_phone)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      new.email,
      new.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.athletes (user_id, full_name, email, phone)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      new.email,
      new.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger chạy sau khi auth.users được tạo
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Verification Plan — Phase 2

```bash
npm test
npm run build

# Manual tests:
# 1. Vào /admin/tournaments khi chưa login → redirect /login
# 2. Login với email/password sai → error message
# 3. Login đúng → redirect về trang trước
# 4. Không thấy Quick Switch Role buttons
# 5. Không thấy 1-Click Test buttons (production mode)
# 6. Logout → session cleared, redirect home
```

---

## Phase 3: 🟡 Architecture Refactor — ✅ ĐÃ HOÀN THÀNH
> **Trạng thái:** Đã triển khai & kiểm thử toàn diện. Toàn bộ 83/83 unit tests pass, TypeScript compile 0 lỗi (`npx tsc --noEmit` code 0). Đã module hóa thành công cả 3 "god components" và hợp nhất type definitions.

Mục tiêu đã hoàn tất:
- ✅ **Court Dispatcher Refactor (1,014 → 442 lines)**: Tách `LiveClock` (dập tắt chu kỳ re-render toàn trang 1 lần/giây), `DispatcherStats`, `CourtCard`, `MatchQueuePanel`, `DispatchModal`, `FinishMatchModal`.
- ✅ **Create Tournament Wizard Refactor (1,439 → 250 lines)**: Rút gọn 22 `useState` vào custom hook `useTournamentWizard.ts`, phân tách 4 bước (`GeneralInfoStep`, `EventsConfigStep`, `ScoringRulesStep`, `DrawRulesStep`), kèm `WizardProgressBar`, `SuccessBanner`, `WizardNavigation`.
- ✅ **Organizer Draw Refactor (2,204 → 1,171 lines)**: Tách `MatchScoreModal`, `DrawHeader`, `ManualDrawPanel`, `GroupStageView`, `KnockoutBracketView`. Khắc phục triệt để các xung đột type giữa `StoredMatchResult` và `CompletedGroupMatch`.
- ✅ **Type Consolidation**: Đồng bộ `StageConfig` giữa `src/types/tournament.ts` và `src/engine/types.ts`; mở rộng `PublishDrawParams` chuẩn hóa kết nối dịch vụ bốc thăm.

---

### 3A. Court Dispatcher Refactor (1,014 lines → ~6 files)

#### [NEW] `src/components/court/LiveClock.tsx`

Extract clock ra component riêng — chỉ component này re-render mỗi giây:

```typescript
export function LiveClock({ locale }: { locale: string }) {
  const [time, setTime] = useState('');
  useEffect(() => { /* setInterval 1s */ }, [locale]);
  return <span className="font-bold text-cyan-300">{time}</span>;
}
```

#### [NEW] `src/components/court/CourtCard.tsx`
- Card hiển thị trạng thái 1 sân (available / playing / warmup)
- Props: court data, onDispatch, onStart, onFinish

#### [NEW] `src/components/court/MatchQueue.tsx`
- Danh sách trận chờ với filters

#### [NEW] `src/components/court/DispatchModal.tsx`
- Modal phân sân cho trận tiếp theo

#### [NEW] `src/components/court/FinalizeMatchModal.tsx`
- Modal kết thúc trận, nhập kết quả

#### [MODIFY] [court-dispatcher/page.tsx](file:///g:/AppHavuco/tournament-web/src/app/prototypes/court-dispatcher/page.tsx)
- Giảm từ 1,014 → ~200 lines
- Import và compose các sub-components
- Di chuyển mock data vào `src/data/` hoặc service

---

### 3B. Create Tournament Refactor (1,439 lines → ~8 files)

#### [NEW] `src/stores/useCreateTournamentStore.ts`
- Sử dụng **Zustand** (đã có sẵn trong package.json) để quản lý form state tập trung
- Tránh truyền props qua 4 bước wizard (No prop-drilling)
- Hỗ trợ lưu draft tự động (persist middleware) và validate từng bước

#### [NEW] `src/lib/schemas/tournamentSchema.ts`

Zod schema cho form validation (thay 22 useState):

```typescript
export const tournamentSchema = z.object({
  name: z.string().min(1),
  organizer: z.string().min(1),
  venue: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  courtsCount: z.number().min(1).max(20),
  // ... tất cả fields
  events: z.array(eventSchema),
});
```

#### [NEW] `src/components/tournament-form/StepGeneralInfo.tsx`
- Step 1: Info cơ bản + VietQR preview (Lines 594-895)

#### [NEW] `src/components/tournament-form/StepEvents.tsx`
- Step 2: Quản lý events/nội dung (Lines 897-1121)

#### [NEW] `src/components/tournament-form/StepScoring.tsx`
- Step 3: Cấu hình luật tính điểm (Lines 1123-1293)

#### [NEW] `src/components/tournament-form/StepDrawRules.tsx`
- Step 4: Luật bốc thăm & xếp hạt giống (Lines 1295-1383)

#### [NEW] `src/components/tournament-form/VietQrPreview.tsx`
- QR Code preview component (memo hóa)

#### [NEW] `src/hooks/useCreateTournament.ts`
- Custom hook kết hợp `react-hook-form` + `zod` + `useCreateTournamentStore`
- Thay thế hoàn toàn 22 useState + manual handlers

#### [MODIFY] [create/page.tsx](file:///g:/AppHavuco/tournament-web/src/app/admin/tournaments/create/page.tsx)
- Giảm từ 1,439 → ~150 lines
- Import hook + 4 step components
- Dùng `@radix-ui/react-tabs` cho wizard steps

---

### 3C. Organizer Draw Refactor (2,204 lines → ~8 files)

#### [NEW] `src/stores/useOrganizerDrawStore.ts`
- Zustand store chứa toàn bộ draw state, simulated schedule, matches, và active tabs
- Tách biệt logic tính toán khỏi UI rendering
- Giải quyết 18 `useMemo` bị lặp lại trong 1 component khổng lồ

#### [NEW] `src/hooks/useOrganizerDraw.ts`
- Custom hook bọc store, cung cấp các actions thân thiện cho component
- Export: state + actions + computed values

#### [NEW] `src/components/draw/GroupStageView.tsx`
- Group standings, Berger schedule, simulation controls (Lines 1572-1743)

#### [NEW] `src/components/draw/KnockoutBracketView.tsx`
- Bracket rounds, match cards, winners (Lines 1417-1521)

#### [NEW] `src/components/draw/ManualPlacementGrid.tsx`
- Manual drag-and-drop slot assignment

#### [NEW] `src/components/draw/MatchScoreModal.tsx`
- Score editing modal với quick presets (Lines 1957-2185)

#### [NEW] `src/components/draw/DrawControls.tsx`
- Mode switch, team count, club separation, action buttons (Lines 1034-1364)

#### [MODIFY] [organizer-draw/page.tsx](file:///g:/AppHavuco/tournament-web/src/app/prototypes/organizer-draw/page.tsx)
- Giảm từ 2,204 → ~250 lines
- Import hook + 5 view components

---

### 3D. Type Consolidation

#### [MODIFY] [engine/types.ts](file:///g:/AppHavuco/tournament-web/src/engine/types.ts)
- `GameScore` → export chỉ từ đây, xóa duplicate trong `database.ts`
- `EventFormat` → unify `'round_robin'` vs `'group'` thành 1 enum

#### [MODIFY] [types/tournament.ts](file:///g:/AppHavuco/tournament-web/src/types/tournament.ts)
- Thêm `maxCapPoints` vào `StageConfig` (hoặc re-export từ engine)
- Xóa `CreateTournamentInput` duplicate — chỉ giữ 1 version

#### [MODIFY] [types/database.ts](file:///g:/AppHavuco/tournament-web/src/types/database.ts)
- Xóa `GameScore` duplicate
- Align `EventFormat` với engine

---

### Verification Plan — Phase 3

```bash
npm test
npm run build

# Verify court-dispatcher KHÔNG re-render toàn page mỗi giây
# Verify create form vẫn hoạt động: tạo giải → save → edit
# Verify organizer-draw: bốc thăm → xếp bảng → nhập điểm → tạo nhánh KO
# Verify no TypeScript errors từ type consolidation
```

---

## Phase 4: 🟢 Quality & i18n (Ước tính: 3-4 ngày)

Mục tiêu: Hoàn thiện i18n, thêm tests, setup tooling.

---

### 4A. i18n Completion

#### [MODIFY] [i18n/types.ts](file:///g:/AppHavuco/tournament-web/src/i18n/types.ts)

Thêm 5 missing scopes vào `Dictionary`:

```typescript
auth: {
  loginTitle: string;
  emailTab: string;
  courtPinTab: string;
  quickTestTab: string;
  // ... ~25 keys
};
admin: {
  myTournaments: string;
  allTournaments: string;
  // ... ~15 keys
};
standingsTable: {
  rank: string;
  team: string;
  played: string;
  won: string;
  // ... ~20 keys
};
bestRunnerUps: { /* ~10 keys */ };
scoreModal: { /* ~15 keys */ };
```

#### [MODIFY] [dictionaries/vi.ts](file:///g:/AppHavuco/tournament-web/src/i18n/dictionaries/vi.ts) & [en.ts](file:///g:/AppHavuco/tournament-web/src/i18n/dictionaries/en.ts)

Thêm translations cho 5 scopes mới (~85 keys mỗi file).

#### [MODIFY] 3 components hardcode Vietnamese:
- [GroupStandingsTable.tsx](file:///g:/AppHavuco/tournament-web/src/components/GroupStandingsTable.tsx) — thêm `useLanguage()`, thay text
- [BestRunnerUpsTable.tsx](file:///g:/AppHavuco/tournament-web/src/components/BestRunnerUpsTable.tsx) — thêm `useLanguage()`, thay text
- [ProtectedRoute.tsx](file:///g:/AppHavuco/tournament-web/src/components/auth/ProtectedRoute.tsx) — thêm `useLanguage()`, thay text

#### [MODIFY] 13 files có 228 inline ternaries:

Refactor `{isEn ? '...' : '...'}` → `{t.scope.key}` theo thứ tự impact:

| File | `isEn ?` count | Priority |
|---|:---:|:---:|
| `tournaments/[slug]/page.tsx` | 60 | P1 |
| `admin/tournaments/page.tsx` | 27 | P1 |
| `organizer-draw/page.tsx` | 25 | P2 |
| `athlete-registration/page.tsx` | 19 | P2 |
| `rankings/page.tsx` | 16 | P2 |
| `tournaments/[slug]/register/page.tsx` | 14 | P2 |
| `login/page.tsx` | 13 | P2 |
| `court-dispatcher/page.tsx` | 12 | P3 |
| `UserMenu.tsx` | 10 | P3 |
| Others (4 files) | 32 | P3 |

---

### 4B. Testing

#### [NEW] Component Tests (React Testing Library)

- `src/components/__tests__/GroupStandingsTable.test.tsx`
- `src/components/__tests__/BestRunnerUpsTable.test.tsx`
- `src/components/__tests__/LanguageSwitcher.test.tsx`
- `src/components/auth/__tests__/ProtectedRoute.test.tsx`
- `src/components/auth/__tests__/UserMenu.test.tsx`

#### [NEW] E2E Tests (Playwright — đã install)

- `e2e/login.spec.ts` — Login flow, redirect, logout
- `e2e/create-tournament.spec.ts` — 4-step wizard, save, edit
- `e2e/organizer-draw.spec.ts` — Bốc thăm, xếp bảng, nhập điểm

#### DevDependencies cần thêm:

```json
{
  "@testing-library/react": "^16.x",
  "@testing-library/jest-dom": "^6.x",
  "jsdom": "^25.x"
}
```

Cập nhật `vitest.config.ts` thêm `environment: 'jsdom'` cho component tests.

---

### 4C. Tooling & CI

#### [NEW] `.eslintrc.json`
- Extend `next/core-web-vitals`, `next/typescript`
- Rule: `no-explicit-any: warn`
- Rule: `react-hooks/exhaustive-deps: error`

#### [NEW] `.prettierrc`
- `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`

#### [NEW] `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

#### [NEW] `.husky/pre-commit`
- Run `lint-staged` trước mỗi commit
- Lint + format changed files only

---

### Verification Plan — Phase 4

```bash
# i18n parity test
npm test -- i18n

# Component tests
npm test -- --run src/components

# E2E tests
npx playwright test

# Lint
npm run lint

# Full build
npm run build
```

---

## Tổng Kết Thay Đổi & Tiến Độ

| Phase | Files Modified | Files New | Trạng thái | Ước tính |
|---|:---:|:---:|:---:|---|
| **Phase 1: Critical Fixes** | 6 | 0 (+tests) | ✅ **HOÀN THÀNH (83/83 tests)** | 1-2 ngày |
| **Phase 2: Auth & Security** | 6 | 2 | ⏳ Tiếp theo | 2-3 ngày |
| **Phase 3: Architecture** | 7 | 18 | 📋 Kế hoạch | 4-5 ngày |
| **Phase 4: Quality & i18n** | 19 | 12 | 📋 Kế hoạch | 3-4 ngày |
| **Tổng** | **38** | **32** | **1/4 Phase hoàn thành** | **10-14 ngày** |

> [!IMPORTANT]
> **Khuyến nghị:** Thực hiện theo thứ tự Phase 1 → 2 → 3 → 4. Mỗi phase phải pass `npm test` + `npm run build` trước khi sang phase tiếp theo.
> 
> Phase 1 và Phase 2 là **bắt buộc** trước khi deploy production. Phase 3 và 4 có thể thực hiện song song hoặc chia nhỏ hơn.

> [!NOTE]
> **Câu hỏi cần xác nhận:**
> 1. Supabase Auth: Dùng Email/Password hay thêm cả OAuth (Google, Facebook)?
> 2. Court PIN: Hash với bcrypt trên server hay giữ simple lookup?
> 3. Phase 3 refactor: Muốn giữ nguyên UI/UX hay redesign khi tách component?
> 4. CI/CD: Deploy tự động (Vercel?) hay chỉ CI (test + build)?
