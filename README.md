# Badminton Tournament Platform (Web & PWA)

> Nền tảng chuyên biệt cho công tác **Tổ chức Giải đấu Cầu Lông & Cổng Đăng Ký Vận Động Viên**, tuân thủ toàn bộ engine thuật toán chuẩn BWF.

---

## 🌟 Giới Thiệu Dự Án

**Badminton Tournament Platform** là giải pháp phần mềm Web/PWA hiện đại, hướng tới việc số hóa toàn diện quy trình tổ chức giải đấu thể thao phong trào và bán chuyên nghiệp (tập trung hàng đầu vào bộ môn **Cầu Lông**).

Hệ thống được phát triển nhằm giải quyết các bài toán then chốt:
1. **Dành cho Ban Tổ Chức (BTC)**: Tiết kiệm 80% thời gian bốc thăm, chia bảng, xếp nhánh knockout, bảo vệ hạt giống theo chuẩn BWF (Liên đoàn Cầu lông Thế giới), cập nhật tỷ số và truyền thông giải đấu theo thời gian thực.
2. **Dành cho Vận Động Viên (VĐV)**: Cung cấp cổng trực tuyến đăng ký tham gia giải, tìm kiếm và ghép cặp đánh đôi, theo dõi tình trạng duyệt hồ sơ, xem lịch thi đấu và thông báo trận đấu tức thì trên điện thoại di động (PWA).
3. **Dành cho Khán Giả & Cổ Động Viên**: Theo dõi kết quả trực tiếp (Live Score), sơ đồ nhánh đấu trực quan (Interactive Bracket Tree), bảng xếp hạng và bục vinh danh vận động viên.

---

## 🛠️ Công Nghệ Chủ Chốt (Tech Stack)

| Lớp kiến trúc | Công nghệ đề xuất | Mô tả chi tiết |
|---|---|---|
| **Frontend Framework** | **Next.js 15 (App Router)** | Hỗ trợ kết hợp Server Components (tối ưu SEO cho trang công khai) và Client Components (tương tác cao cho BTC). |
| **Ngôn ngữ** | **TypeScript 5.x** | Kiểm soát kiểu dữ liệu chặt chẽ, port toàn bộ `TournamentEngine` từ Dart sang TypeScript an toàn 100%. |
| **Giao diện & Styling** | **Tailwind CSS (v3.4 / v4 ready) + shadcn/ui** | Thiết kế phong cách thể thao hiện đại, tối ưu Dark Mode, hiệu năng render vượt trội. |
| **Ứng dụng di động** | **Progressive Web App (PWA)** | Cài đặt trực tiếp lên màn hình chính (Android, iOS, Windows) không cần thông qua App Store, hỗ trợ Web Push Notification. |
| **Sơ đồ nhánh đấu** | **Interactive SVG / React Flow** | Trực quan hóa cây Knockout Bracket mượt mà, hỗ trợ zoom, pan và tương tác cảm ứng. |
| **Kéo thả xếp bảng** | **@dnd-kit** | Bộ thư viện kéo thả chuyên nghiệp cho giao diện phân bổ bảng đấu thủ công. |
| **Backend & Cơ sở dữ liệu** | **Supabase (PostgreSQL 15+)** | Cung cấp Relational Database, Row Level Security (RLS), Supabase Auth và Storage. |
| **Thời gian thực** | **Supabase Realtime** | WebSocket đồng bộ điểm số tức thời (Live Score) trên tất cả màn hình người dùng. |
| **Quản lý State** | **Zustand** | Quản lý state cục bộ cho các tác vụ phức tạp (bốc thăm mô phỏng, chấm điểm nhiều set). |

---

## 📂 Cấu Trúc Tài Liệu Chi Tiết (`docs/`)

Toàn bộ quy chuẩn kiến trúc, cơ sở dữ liệu, thuật toán và tài liệu kỹ thuật đã được soạn thảo đầy đủ trong thư mục `docs/`:

1. 🏛️ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): Kiến trúc hệ thống 3 cổng (Admin, Athlete, Public), Next.js App Router layout, PWA Service Worker caching strategy và mô hình bảo mật RBAC.
2. 🗄️ [docs/DATABASE.md](docs/DATABASE.md): Thiết kế 16 bảng PostgreSQL, ERD, ràng buộc toàn vẹn, chỉ mục và chính sách Row Level Security (RLS).
3. 🧮 [docs/TOURNAMENT_ENGINE.md](docs/TOURNAMENT_ENGINE.md): Đặc tả toán học và mã hóa của động cơ giải đấu TypeScript: Luật BWF (21 điểm, deuce, cap 30, sudden death), Snake Seeding, Bye Protection, Club Separation, Berger Round Robin, Knockout Bracket, Winner Auto-Advance & Cascade Rollback, BXH Head-to-Head.
4. 🏸 [docs/REGISTRATION_FLOW.md](docs/REGISTRATION_FLOW.md): Luồng nghiệp vụ Cổng Đăng Ký VĐV: Đăng ký đơn, mời bạn đánh đôi, liên kết đội, quy trình duyệt hồ sơ của BTC, danh sách chờ và thanh toán lệ phí.
5. 🎨 [docs/UI_UX_SPEC.md](docs/UI_UX_SPEC.md): Thiết kế màn hình, công thái học chấm điểm BWF (+1 cực đại, server indicator, offline badge, undo, modal xác nhận), sơ đồ nhánh mobile theo vòng & 'trận của tôi', wizard đăng ký minh bạch quota & blocker, public live-score court-first, 4 trạng thái mạng và kế hoạch 3 interactive prototypes.
6. 🔌 [docs/API_AND_SERVICES.md](docs/API_AND_SERVICES.md): Đặc tả interface của các service layer (`TournamentService`, `MatchService`, `RegistrationService`), Supabase Realtime Channels và các Edge Functions.
7. 🚀 [docs/ROADMAP.md](docs/ROADMAP.md): Lộ trình triển khai 7 giai đoạn (10 tuần), tiêu chí nghiệm thu và kế hoạch kiểm thử tự động (Vitest + Playwright).

---

## 📁 Cấu Trúc Thư Mục Dự Án (Thực tế)

```
tournament-web/
├── docs/                      # Toàn bộ tài liệu kiến trúc, database, engine, audit & plan
│   ├── ARCHITECTURE.md        # Kiến trúc hệ thống, phân tầng và luồng dữ liệu
│   ├── DATABASE.md            # Đặc tả 16 bảng PostgreSQL & RLS
│   ├── TOURNAMENT_ENGINE.md   # Thuật toán BWF và công thức tính toán
│   ├── API_AND_SERVICES.md    # Đặc tả các lớp dịch vụ (Service Layer)
│   ├── REGISTRATION_FLOW.md   # Quy trình đăng ký VĐV và mời đánh đôi
│   ├── UI_UX_SPEC.md          # Đặc tả giao diện & công thái học điều hành
│   ├── ROADMAP.md             # Lộ trình tổng thể dự án
│   ├── audit_report.md        # Báo cáo audit toàn diện codebase
│   └── implementation_plan.md # Kế hoạch thực thi 4 Phase (Phase 1 đã hoàn thành)
├── public/                    # Tài nguyên tĩnh, PWA icons, manifest.json
├── sql/                       # File script cơ sở dữ liệu Supabase PostgreSQL
│   ├── schema.sql             # Toàn bộ DDL 16 bảng, RLS và index bootstrap
│   ├── rpcs.sql               # Stored procedures & RPC giao dịch chống race-condition
│   └── seed.sql               # Dữ liệu mẫu khởi tạo
├── src/
│   ├── app/                   # Next.js 15 App Router (18 routes thực tế)
│   │   ├── admin/             # Quản trị giải đấu: danh sách, form tạo giải wizard
│   │   ├── tournaments/       # Công khai: chi tiết giải, đăng ký giải đấu
│   │   ├── scoreboard/        # Bảng điểm điện tử sân đấu trực tiếp
│   │   ├── register/          # Đăng ký VĐV, đăng ký BTC, xác nhận bạn đánh đôi
│   │   ├── login/             # Trang đăng nhập (Email/Pass, Mã PIN sân, Test)
│   │   ├── rankings/          # Bảng xếp hạng VĐV & CLB
│   │   ├── prototypes/        # Giao diện điều hành (bốc thăm, điều phối sân, trọng tài)
│   │   ├── layout.tsx         # Root layout tích hợp AuthProvider, LanguageProvider
│   │   └── page.tsx           # Trang chủ giới thiệu & danh sách giải đấu
│   ├── components/            # UI components tái sử dụng
│   │   ├── auth/              # ProtectedRoute, UserMenu
│   │   ├── ui/                # Nguyên tử UI cơ sở (Radix UI / Tailwind)
│   │   └── ...                # Bảng xếp hạng vòng bảng, đội nhì tốt nhất
│   ├── engine/                # Tournament Engine BWF (TypeScript thuần, 0 dependency)
│   │   ├── scoring.ts         # Validate tỷ số BWF, Deuce, Cap 30, Sudden Death
│   │   ├── seeding.ts         # Snake seeding, phân bổ hạt giống BWF
│   │   ├── round-robin.ts     # Lịch thi đấu vòng tròn theo phương pháp Berger
│   │   ├── bracket.ts         # Nhánh knockout, Bye protection, Club separation
│   │   ├── standings.ts       # Bảng xếp hạng và chỉ số tie-break BWF
│   │   ├── advancement.ts     # Thăng nhánh, rollback cascade, cross-group pairing
│   │   ├── flexible-tournament.ts # Điều phối giải đấu linh hoạt đa thể thức
│   │   └── __tests__/         # 83 unit tests kiểm thử toàn diện engine
│   ├── i18n/                  # Hệ thống đa ngôn ngữ (Tiếng Việt & English)
│   │   ├── dictionaries/      # Từ điển vi.ts và en.ts (100% key parity)
│   │   ├── LanguageContext.tsx
│   │   └── types.ts
│   ├── data/                  # Dữ liệu mock phục vụ offline/hybrid mode
│   │   └── mockTournaments.ts
│   ├── lib/                   # Supabase client/server config, context, utils
│   │   ├── supabase/          # client.ts, server.ts, middleware.ts (@supabase/ssr)
│   │   ├── context/           # AuthContext.tsx (memoized)
│   │   └── services/          # Tầng dịch vụ kết nối Supabase & Mock Fallback
│   │       ├── authService.ts
│   │       ├── tournamentService.ts
│   │       ├── scoringService.ts
│   │       ├── registrationService.ts
│   │       ├── drawService.ts
│   │       ├── dispatcherService.ts
│   │       └── rankingService.ts
│   └── types/                 # Định nghĩa kiểu dữ liệu TypeScript
├── vitest.config.ts           # Cấu hình test runner Vitest
├── package.json               # Cấu hình phụ thuộc Node.js
└── tsconfig.json              # Cấu hình TypeScript (strict mode)
```

---

## ⚡ Hướng Dẫn Thiết Lập Nhanh (Quick Start)

### 1. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 2. Cấu hình biến môi trường
Sao chép `.env.example` thành `.env.local` và điền thông tin Supabase của bạn:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Khởi tạo Cơ sở dữ liệu Supabase
Mở **SQL Editor** trên Supabase Dashboard của **một dự án mới** và chạy `sql/schema.sql` để tạo 16 bảng, khóa ngoại, index và RLS. Với database đã có dữ liệu, dùng migration versioned thay vì chạy lại file bootstrap.

### 4. Chạy môi trường phát triển
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt.
