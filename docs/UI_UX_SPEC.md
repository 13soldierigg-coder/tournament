# Đặc Tả Giao Diện & Trải Nghiệm Người Dùng — UI/UX Specification

Tài liệu này định nghĩa hệ thống thiết kế (Design System), bố cục các màn hình chính (Screens Breakdown), quy chuẩn công thái học và các tương tác cốt lõi trên nền tảng **Badminton Tournament Platform** (Web & PWA).

---

## 1. Hệ Thống Thiết Kế & Trợ Năng (Design System & Accessibility)

### 1.1. Ngôn Ngữ Thiết Kế
- **Phong cách chủ đạo**: **Modern Sports Cyberpunk** — Thể thao công nghệ cao, hiện đại, năng động, tối ưu độ tương phản cao cho môi trường nhà thi đấu có ánh sáng đèn mạnh.
- **Bảng Màu (Color Palette)**:
  - **Màu nền Dark (Mặc định)**: `slate-950` (`#020617`) kết hợp với thẻ card `slate-900/80` (`#0f172a`) có viền mờ `slate-800` (`#1e293b`).
  - **Màu nhấn thương hiệu (Primary Accent)**: `cyan-400` (`#22d3ee`) tượng trưng cho sự sắc bén, tốc độ của quả cầu lông.
  - **Màu vinh quang (Victory Accent)**: `amber-400` (`#fbbf24`) dành cho hạt giống số 1, danh hiệu vô địch.
  - **Màu hành động (Success / On-Court)**: `emerald-400` (`#34d399`) dành cho trận đang diễn ra hoặc VĐV thắng set.
  - **Màu cảnh báo & hủy (Danger / Walkover)**: `rose-500` (`#f43f5e`) dành cho thẻ phạt, hủy trận, xử thua.
- **Typography**:
  - Font tiêu đề & điểm số: **Outfit** / **Chakra Petch** (Số to, giãn cách rõ, dễ đọc từ khoảng cách 2–3 mét).
  - Font văn bản: **Inter** / **Plus Jakarta Sans** (Đọc tốt ở kích thước nhỏ).

### 1.2. Quy Chuẩn Trợ Năng & Thị Giác (WCAG 2.2 AA)
1. **Không bao giờ dùng màu sắc là tín hiệu duy nhất**:
   - Mọi trạng thái nghiệp vụ bắt buộc phải đi kèm **Icon + Nhãn chữ rõ ràng (Badge)**:
     - `W/O`: Icon 🚫 + Nhãn `Bỏ cuộc (W/O)`.
     - `Retired`: Icon ⚠️ + Nhãn `Chấn thương (Retired)`.
     - `On Court`: Icon 🏸 + Nhãn `Đang đấu (Sân 2)`.
     - `Pending`: Icon ⏳ + Nhãn `Chờ lịch`.
     - `Called`: Icon 📢 + Nhãn `Gọi vào sân`.
2. **Tuyệt đối không dùng hiệu ứng nhấp nháy liên tục (No Blinking / Flashing)**:
   - Tránh gây mỏi mắt, phân tâm cho trọng tài và khán giả trên sân.
   - Khi có sự kiện mới (điểm số thay đổi, gọi vào sân): sử dụng hiệu ứng viền phát sáng (glow border) hoặc pulse nhẹ nhàng **duy nhất 1 lần** trong 1.5 giây rồi trở về trạng thái tĩnh.
3. **Kích thước vùng chạm (Touch Targets)**:
   - Tối thiểu **48x48px** cho các nút thông thường; riêng các nút chấm điểm trận đấu đạt tối thiểu **80x80px**.

### 1.3. Hệ Thống Song Ngữ (Bilingual System — VN / EN)
Nền tảng hỗ trợ 2 ngôn ngữ chính thức: **Tiếng Việt (`vi`)** (mặc định) và **Tiếng Anh (`en`)**, tối ưu cho vận hành tại các giải đấu có trọng tài hoặc VĐV quốc tế.

1. **Bộ chuyển ngữ (Language Switcher)**:
   - Đặt trên thanh điều hướng đầu trang (Header) ở mọi màn hình: `[ 🇻🇳 VN | 🇬🇧 EN ]`.
   - Chuyển đổi ngôn ngữ tức thì phía Client (Instant Toggle) không làm reload trang và không làm đứt đoạn phiên chấm điểm của trọng tài trên sân.
   - Lưu tùy chọn người dùng qua `localStorage` và `cookie` (`badminton_locale`).
2. **Bảng Chuẩn Hóa Thuật Ngữ Cầu Lông BWF (Terminology Matrix)**:
   - **Giao cầu / Service**: Bên thực hiện phát cầu (`🏸 GIAO CẦU` / `🏸 SERVICE`).
   - **Nhận cầu / Receiver**: Bên đỡ quả phát cầu.
   - **Hoàn tác / Undo**: Khôi phục 1 điểm vừa chấm nhầm.
   - **Đổi bên / Swap Ends**: Đảo hướng nhìn Trái/Phải của trọng tài (không làm đảo ID trong CSDL).
   - **Chốt kết quả / Finalize Result**: Xác nhận tỷ số chung cuộc và đôn người thắng nhánh.
   - **Miễn vòng đầu / Bye**: Vị trí nhánh đấu không có đối thủ ở vòng 1.
   - **Hạt giống / Seed**: Thứ hạng phân bổ nhánh đấu theo BWF.
   - **Phân bảng Ziczac / Snake Seeding**: Phân bổ hạt giống cân bằng giữa các bảng tròn.
   - **Lịch xoay vòng / Berger Schedule**: Lịch thi đấu vòng tròn đều đặn.
   - **Tứ kết, Bán kết, Chung kết / Quarter-finals, Semi-finals, Final**: Các vòng nhánh Knockout.
   - **Bỏ cuộc / Walkover (W/O)** & **Chấn thương / Retired (RET)**: Bắt buộc có nhãn chữ kèm icon.

---

## 2. Phân Rã Màn Hình Theo Phân Hệ (Screen Breakdown)

### 2.1. CỔNG BAN TỔ CHỨC & TRỌNG TÀI — MÀN HÌNH CHẤM ĐIỂM LÀ TRỌNG TÂM SỐ 1

#### 🏸 Màn hình 1: Bảng Chấm Điểm Trận Đấu BWF (`TournamentMatchSheet`) — QUAN TRỌNG NHẤT
Màn hình phục vụ trực tiếp cho trọng tài ngồi tại ghế điều khiển trên sân (dùng điện thoại hoặc tablet):

```
┌─────────────────────────────────────────────────────────────┐
│ [← Thoát]       SÂN SỐ 3 — TRẬN #12       🟢 Trực tuyến     │
├─────────────────────────────────────────────────────────────┤
│  Game 1: 21 - 19  │  Game 2: Đang đấu (Set 2)                │
├──────────────────────────────┬──────────────────────────────┤
│  🏸 NGUYỄN VĂN A             │     LÊ HOÀNG C               │
│  (Giao cầu)                  │                              │
│                              │                              │
│             18               │             16               │
│                              │                              │
│   ┌──────────────────────┐   │   ┌──────────────────────┐   │
│   │                      │   │   │                      │   │
│   │      +1 ĐIỂM         │   │   │      +1 ĐIỂM         │   │
│   │    (SIÊU LỚN)        │   │   │    (SIÊU LỚN)        │   │
│   │                      │   │   │                      │   │
│   └──────────────────────┘   │   └──────────────────────┘   │
├──────────────────────────────┴──────────────────────────────┤
│  [ ↩ HOÀN TÁC (UNDO) ]       [ Đổi Bên ]     [ Bỏ cuộc/W.O ] │
├─────────────────────────────────────────────────────────────┤
│                 [ 🏁 CHỐT KẾT QUẢ TRẬN ĐẤU ]                │
└─────────────────────────────────────────────────────────────┘
```

- **Các yếu tố giao diện bắt buộc**:
  1. **Nút `+1 ĐIỂM` cực đại & Tách biệt API ghi điểm**:
     - Chiếm phần lớn diện tích nửa dưới của mỗi bên (tối thiểu 80x80px), giúp trọng tài bấm chuẩn xác bằng ngón cái.
     - **Tách API rõ ràng**: Mỗi lần bấm `+1` hoặc `Undo`, giao diện gọi `recordScoreSnapshot` (lưu vào local queue nếu offline) để cập nhật live score tức thời cho khán giả. Tuyệt đối không gọi `finalizeMatchResult` khi trận đấu chưa kết thúc.
  2. **Chỉ báo bên giao cầu (Server Indicator)**:
     - Hiển thị biểu tượng vợt/cầu 🏸 và nhãn `(Giao cầu)` nổi bật cạnh tên VĐV.
     - **Tự động đổi bên giao cầu**: Sau mỗi điểm số, hệ thống tự động đổi bên giao cầu theo đúng luật BWF (điểm chẵn giao ô bên phải, điểm lẻ giao ô bên trái; bên thắng rally giành quyền giao cầu ván kế tiếp). Trọng tài có thể chạm trực tiếp vào biểu tượng 🏸 để ghi đè (override) nếu có lỗi giao cầu thực tế.
  3. **Nút [ Đổi Bên (Swap Ends) ] — Chỉ đổi góc nhìn hiển thị**:
     - Khi bấm nút này (ví dụ: sau khi hết set 1, hoặc khi chạm 11 điểm ở set 3), hệ thống **chỉ hoán đổi vị trí hiển thị trái/phải** trên màn hình của trọng tài để khớp với hướng nhìn thực tế ra sân đấu.
     - **Ràng buộc toàn vẹn**: Thao tác này TUYỆT ĐỐI KHÔNG làm thay đổi định danh đội (`entry1_id`, `entry2_id`), không đảo lộn dữ liệu gốc hay logic tính điểm trong cơ sở dữ liệu.
  4. **Tên sân & Trận đấu**: Header ghim cố định hiển thị to bản `SÂN SỐ 3 — TRẬN #12`.
  5. **Trạng thái kết nối (Offline Status)**:
     - 🟢 `Trực tuyến`: Dữ liệu đồng bộ tức thời qua WebSocket.
     - 🟡 `Ngoại tuyến (Lưu máy)`: Mạng chập chờn, điểm được lưu an toàn vào IndexedDB và tự động đồng bộ khi có mạng lại.
  6. **Nút Hoàn tác điểm (`UNDO`) cực kỳ dễ tiếp cận**:
     - Nút to, đặt ngay dưới bảng điểm. Bấm 1 chạm là thu hồi ngay điểm vừa nhập nhầm mà không cần mở modal phức tạp.
  7. **Modal Xác Nhận Riêng Biệt (Confirmation Modals) để chống bấm nhầm**:
     - **Chốt kết quả trận đấu (`Finalize Match Dialog`)**: Khi chạm điểm kết thúc set/trận, trọng tài bấm *"CHỐT KẾT QUẢ"*, hệ thống mở modal tóm tắt: *"Đội Nguyễn Văn A thắng (21-19, 21-16). Xác nhận kết quả này?"*. Trọng tài kiểm tra lại rồi mới bấm chốt, lúc này mới gọi RPC `finalize_match_result` để thăng nhánh.
     - **Hủy kết quả trận đấu (`Revert Match Alert Dialog`)**: Nút hủy kết quả chỉ có trong menu nâng cao của BTC; khi bấm sẽ bật cảnh báo mức độ cao (Destructive Warning) giải thích rõ: *"Hủy trận này sẽ tự động rollback kết quả của các vòng kế tiếp trong nhánh đấu. Bạn có chắc chắn không?"*.

#### Màn hình 2: Trình Khởi Tạo Giải Đấu V2 (`/admin/tournaments/create`)
- Thiết lập đa nội dung (Đơn Nam, Đơn Nữ, Đôi Nam, Đôi Nữ, Đôi Nam Nữ) với quota và lệ phí riêng cho từng nội dung.
- Cấu hình luật vòng bảng (1 set 31 Sudden Death) và vòng Knockout (Best of 3 chuẩn BWF 21 điểm).

#### Màn hình 3: Xếp Bảng Đấu & Bốc Thăm (`TournamentGroupAssignmentScreen`)
- Kéo thả phân bổ đội vào bảng qua `@dnd-kit`.
- Nút *"Bốc Thăm Tự Động"* chạy thuật toán Snake Seeding và BWF Seed Positions (tối giản animation để ưu tiên tốc độ và tính chính xác).

---

### 2.2. CỔNG CÔNG KHAI (PUBLIC PORTAL) — COURT-FIRST LIVE SCORE

#### 🏸 Màn hình 4: Bảng Điểm Trực Tiếp (Public Live Score — `/tournaments/[slug]/live`)
Khán giả và cổ động viên chỉ quan tâm 3 câu hỏi: **Đang đánh ở sân nào? Tỷ số bao nhiêu? Trận kế tiếp là ai?**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 TRỰC TIẾP — GIẢI CẦU LÔNG MÙA THU 2026                   │
│ [Tất cả sân]  [Sân 1]  [Sân 2]  [Sân 3]  [Sân 4]            │
├─────────────────────────────────────────────────────────────┤
│ 🏸 SÂN SỐ 1 — Đơn Nam (Tứ Kết)              🟢 Set 2 đang đấu│
│ ─────────────────────────────────────────────────────────── │
│ Nguyễn Văn A (CLB Hà Nội)        [ 21 ]    18 🏸            │
│ Trần Quốc B (CLB Hải Phòng)      [ 19 ]    16               │
│ ─────────────────────────────────────────────────────────── │
│ ⏳ Trận kế tiếp: Lê C vs Phạm D (Dự kiến 10:45)             │
├─────────────────────────────────────────────────────────────┤
│ 🏸 SÂN SỐ 2 — Đôi Nam (Bán Kết)             🟢 Set 1 đang đấu│
│ ─────────────────────────────────────────────────────────── │
│ Đỗ A / Trần B                    [ 14 ]                     │
│ Hoàng C / Vũ D                   [ 17 ] 🏸                  │
│ ─────────────────────────────────────────────────────────── │
│ ⏳ Trận kế tiếp: Trịnh E / Ngô F vs Đặng G / Bùi H          │
└─────────────────────────────────────────────────────────────┘
```

- **Nguyên tắc tổ chức trang chi tiết giải**:
  - **Tab 1: Trực Tiếp (Live Score & Sân Đấu)**: Mặc định hiển thị danh sách thẻ sân (Court Cards).
  - **Tab 2: Nhánh Đấu (Bracket)**: Sơ đồ thi đấu.
  - **Tab 3: Bảng Xếp Hạng**: BXH vòng bảng.
  - **Tab 4: Danh Sách VĐV**: Danh sách các cặp đấu chính thức.
  - **Tab 5: Điều Lệ & Thông Tin Phụ**: Quy định, cơ cấu giải thưởng, bản đồ nhà thi đấu (để phía sau, không làm cản trở theo dõi tỷ số).

#### 🌳 Màn hình 5: Sơ Đồ Nhánh Đấu (Knockout Bracket) — Tối Ưu Mobile
- **Trên Thiết Bị Di Động (Mobile)**:
  - **Không nhồi nhét toàn bộ cây bracket**: Tránh gây vỡ layout và phải zoom/pan mệt mỏi.
  - **Mặc định xem theo từng vòng**: Hiển thị danh sách trận của vòng hiện tại (ví dụ: `Tứ Kết`).
  - **Bộ chuyển vòng nhanh (Quick Round Switcher)**: Thanh tab ngang: `[Vòng 32] [Vòng 16] [Tứ Kết] [Bán Kết] [Chung Kết]`.
  - **Nút "TRẬN CỦA TÔI" (My Matches)**: Cho phép VĐV/khán giả bấm 1 chạm để hệ thống tự động cuộn và highlight trận đấu của bản thân hoặc CLB của mình.
- **Trên Máy Tính & Tablet (Desktop/Tablet)**:
  - Hiển thị đầy đủ **Full Interactive Bracket Tree** với đường nối trực giao phát sáng nhánh đội thắng, hỗ trợ zoom mượt mà.

---

### 2.3. CỔNG VẬN ĐỘNG VIÊN (ATHLETE PORTAL) — GIẢM TẢI TỐI ĐA CHO BTC

#### 📋 Màn hình 6: Wizard Đăng Ký Giải Đấu (`/athlete/register/[id]`)
Màn hình này được thiết kế để giải đáp toàn bộ thắc mắc của VĐV ngay trên giao diện, triệt tiêu 80% câu hỏi gửi cho BTC:

```
┌─────────────────────────────────────────────────────────────┐
│ ĐĂNG KÝ: GIẢI CẦU LÔNG ĐÔI NAM MÙA THU 2026                 │
├─────────────────────────────────────────────────────────────┤
│ 📊 TÌNH TRẠNG NỘI DUNG THI ĐẤU:                             │
│ • Số suất còn lại: Còn 3/16 suất chính thức (Sau đó vào Waitlist)
│ • Hạn nộp đơn & thanh toán: Còn 1 ngày 08 giờ 30 phút        │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ LÝ DO ĐƠN CHƯA THỂ CHỐT (ACTIONABLE BLOCKERS):           │
│ ❌ Đồng đội chưa xác nhận lời mời (Đã gửi link cho Lê Hoàng C)│
│ ❌ Chưa tải ảnh chứng từ thanh toán lệ phí (500.000 VNĐ)    │
├─────────────────────────────────────────────────────────────┤
│ BƯỚC 1: Chọn nội dung [ Đôi Nam (MD) ]                      │
│ BƯỚC 2: Thông tin VĐV 1 [ Nguyễn Văn A - CLB Cầu Giấy ]     │
│ BƯỚC 3: Đồng đội (Player 2)                                 │
│   Link mời: tournament.local/invite/a9f1... [ Sao chép ] [ Mã QR ] │
│   Trạng thái: ⏳ Đang chờ Lê Hoàng C mở link bấm xác nhận   │
│ BƯỚC 4: Thanh toán VietQR động                              │
│   [ Mã QR Napas 500k tự điền cú pháp: DKGIAI 12 0912345678 ]│
│   [ + Tải ảnh biên lai chuyển khoản ]                       │
├─────────────────────────────────────────────────────────────┤
│ [ LƯU BẢN NHÁP ]                   [ NỘP ĐƠN ĐĂNG KÝ ]      │
└─────────────────────────────────────────────────────────────┘
```

- **4 Chỉ báo then chốt luôn hiển thị rõ**:
  1. **Quota số suất còn lại**: Thông báo rõ nếu hết suất sẽ vào Waitlist.
  2. **Trạng thái đồng đội (Partner Status)**: Hiển thị rõ bạn đã đồng ý hay đang chờ xác nhận.
  3. **Đồng hồ đếm ngược hạn chót (Deadlines Countdown)**: Hạn xác nhận partner và hạn nộp lệ phí.
  4. **Hộp lý do chưa thể duyệt đơn**: Liệt kê trực diện từng gạch đầu dòng còn thiếu để VĐV tự xử lý mà không cần nhắn tin hỏi BTC.

---

## 3. Khả Năng Chịu Lỗi & Trạng Thái Mạng (Resilience & Offline Handling)

Tại các nhà thi đấu cầu lông, tình trạng nghẽn mạng 4G/Wifi xảy ra rất thường xuyên. Hệ thống bắt buộc phải thiết kế hoàn chỉnh 4 trạng thái cho mọi màn hình:

### 3.1. Bốn Trạng Thái Cơ Bản (Core Screen States)
1. **Loading State**: Sử dụng **Skeleton Loaders** giữ nguyên khung hình thẻ sân / tỷ số, không dùng vòng xoay spinner đơn điệu.
2. **Empty State**: Khi chưa có dữ liệu (chưa có giải đấu, chưa có trận đấu), hiển thị hình ảnh minh họa thể thao thân thiện kèm nút hành động (Call To Action: *"Tạo giải đầu tiên"* hoặc *"Xem giải đấu khác"*).
3. **Error State**: Có nút bấm **"Thử lại ngay (Retry)"** kèm mã lỗi dễ đọc, không hiển thị trang trắng (White Screen of Death).
4. **Offline State**: Thanh thông báo màu vàng ghim đầu trang: *"Bạn đang ở chế độ ngoại tuyến. Dữ liệu đang được ghi nhớ cục bộ và sẽ tự động đồng bộ khi có kết nối"*.

### 3.2. Xử Lý Xung Đột Đồng Bộ Điểm Ngoại Tuyến (Offline Conflict Resolution)
- Khi trọng tài đang chấm điểm mà mất mạng:
  - Mọi lượt `+1` và `Undo` được ghi vào hàng đợi **Sync Queue** trong `IndexedDB`.
  - Tỷ số vẫn nhảy mượt mà trên thiết bị của trọng tài.
- Khi có mạng trở lại:
  - Hệ thống tự động gửi các snapshot trong hàng đợi qua RPC `record_score_snapshot` kèm `expectedVersion`.
  - **Trường hợp xung đột (Conflict 409)** (ví dụ: máy chủ đã có version mới hơn do BTC hoặc tổng trọng tài can thiệp từ bàn điều khiển):
    - Hệ thống mở **Hộp Thoại Đối Soát Xung Đột (Conflict Resolution Dialog)** hiển thị bảng so sánh trực quan: *Tỷ số ghi nhận trên máy của bạn* vs *Tỷ số hiện hành trên máy chủ*.
    - **Nguyên tắc Server-Authoritative (TUYỆT ĐỐI KHÔNG CÓ "Force Sync" từ trọng tài)**: Thiết bị trọng tài không được phép tự ý ghi đè dữ liệu máy chủ. Thay vào đó, trọng tài có 2 lựa chọn:
      1. **"Đồng ý dữ liệu máy chủ (Accept Server)"**: Cập nhật lại UI theo dữ liệu chuẩn của máy chủ, dọn sạch hàng đợi cục bộ.
      2. **"Gửi yêu cầu điều chỉnh cho BTC (Submit Correction Request)"**: Gửi gói đối soát kèm điểm số cục bộ và lý do lên Dashboard của BTC. Chỉ tài khoản BTC / Tổng trọng tài mới có thẩm quyền gọi RPC `correct_match_score` (có lưu vết audit log chi tiết) để điều chỉnh kết quả.

---

## 4. Định Hướng Phạm Vi MVP (MVP Scope Prioritization)

Để giải đấu vận hành trơn tru và bàn giao sản phẩm đúng tiến độ, nhóm phát triển phân loại rõ ràng:

| Phân hệ | Tính năng thuộc MVP (Làm Ngay & Đầu Tư Sâu) | Tính năng Hoãn Lại (Post-MVP / Giai đoạn sau) |
|---|---|---|
| **Chấm điểm** | Nút +1 cực đại, bên giao cầu, tên sân, nút Undo 1 chạm, Modal chốt/hủy kết quả, chấm điểm Offline. | Thống kê nâng cao (vị trí rơi cầu, thời gian mỗi pha cầu rally). |
| **Nhánh đấu** | Sơ đồ vòng hiện tại trên mobile, bộ lọc "Trận của tôi", full bracket trên desktop. | Hiệu ứng hoạt hình xáo trộn bốc thăm chia bảng phức tạp (Fancy Shuffle). |
| **Đăng ký** | Wizard 4 bước, link/QR mời bạn, mã VietQR, thanh hiển thị quota & lý do chặn. | Tích hợp cổng thanh toán tự động qua Webhook ngân hàng (MVP dùng upload biên lai). |
| **Live score** | Thẻ sân thi đấu trực tiếp (Court-first), tỷ số realtime, trận kế tiếp. | Livestream camera tích hợp trực tiếp vào trang web. |
| **Tổng kết giải** | Danh sách nhà vô địch, á quân, đồng hạng ba theo chuẩn BWF. | ⏸️ Pháo hoa giấy (Confetti), ⏸️ Xuất ảnh poster podium kỷ niệm có logo chia sẻ mạng xã hội. |

---

## 5. Kế Hoạch Prototype Tương Tác (3 Luồng Trọng Tâm Trước Khi Code)

Trước khi tiến hành code đại trà toàn bộ các trang, nhóm kỹ sư sẽ hoàn thiện **Interactive Clickable Prototype** cho 3 kịch bản nghiệp vụ sống còn:

1. **Prototype Luồng 1 — VĐV Đăng Ký Đánh Đôi**:
   - VĐV A tạo đơn $\rightarrow$ Nhận link mời $\rightarrow$ Giả lập VĐV B mở link bấm đồng ý $\rightarrow$ Xem thanh trạng thái hiển thị "Đã đủ điều kiện, chờ BTC duyệt".
2. **Prototype Luồng 2 — BTC Chốt Danh Sách & Bốc Thăm**:
   - BTC duyệt đơn $\rightarrow$ Bấm chốt danh sách entries $\rightarrow$ Bốc thăm bảng / sinh nhánh Knockout BWF $\rightarrow$ Xếp trận vào Sân 1, Sân 2 $\rightarrow$ Công bố lịch.
3. **Prototype Luồng 3 — Trọng Tài Chấm Điểm Ngoại Tuyến**:
   - Mở màn hình trận đấu $\rightarrow$ Bấm nút +1 $\rightarrow$ Kích hoạt cờ mất mạng (Offline) $\rightarrow$ Bấm Undo điểm nhầm $\rightarrow$ Bật lại mạng $\rightarrow$ Modal chốt kết quả $\rightarrow$ Kết quả nhảy tức thì lên màn hình Live Score.

