'use client';

import Link from 'next/link';
import { Users, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function PrototypesIndexPage() {
  const { t, locale } = useLanguage();

  const prototypes = [
    {
      id: 'athlete-registration',
      title: locale === 'vi' ? 'Đăng Ký Vận Động Viên (Doubles Wizard)' : 'Athlete Registration (Doubles Wizard)',
      path: '/admin/tournaments',
      badge: 'Athlete / Mobile UX',
      color: 'cyan',
      description:
        locale === 'vi'
          ? 'Thanh trạng thái dính, đếm ngược số suất còn lại, tạo link/QR mời partner, và bảng checklist nguyên nhân chưa thể chốt đơn (giảm 80% câu hỏi thắc mắc cho BTC).'
          : 'Sticky quota bar, partner invite via QR/Link, and clear blockers checklist eliminating repetitive BTC inquiries.',
      highlights:
        locale === 'vi'
          ? [
              'Chọn nội dung linh hoạt (Đơn / Đôi có báo suất còn lại)',
              '2 chế độ đăng ký đôi: Khai trực tiếp cả 2 VĐV hoặc Mời đồng đội qua QR/Link',
              'Checklist blockers tự động cập nhật theo thể thức đã chọn',
              'Hạn giữ chỗ thanh toán & tự động hủy nếu quá hạn',
            ]
          : [
              'Dynamic event selection (Singles / Doubles with quota counter)',
              '2 doubles modes: Direct entry for both athletes or Invite partner via QR/Link',
              'Blockers checklist dynamically adapted to selected event & mode',
              'Reservation window countdown with auto-cancellation',
            ],
    },
    {
      id: 'organizer-draw',
      title: locale === 'vi' ? 'Bốc Thăm & Phân Bảng (Organizer Draw)' : 'Organizer Draw & Bracket Seeding',
      path: '/admin/tournaments',
      badge: 'Organizer / Ops',
      color: 'amber',
      description:
        locale === 'vi'
          ? 'Công cụ tạo bảng vòng tròn Berger hoặc nhánh đấu Knockout. Hỗ trợ Snake Seeding, tự động tính số Bye và tự động đôn hạt giống vào Vòng 2.'
          : 'BWF Knockout bracket generator & Berger round-robin tool. Supports Snake Seeding, automatic Bye allocation, and R1 club separation.',
      highlights:
        locale === 'vi'
          ? [
              'Tùy chỉnh hạt giống 1-4 và xem phân bố chuẩn BWF',
              'Tạo bảng Round-Robin theo thuật toán Berger',
              'Cây đấu Knockout với Byes và phân tách CLB cùng đơn vị',
              'Tự động đẩy người thắng nhánh vào vòng kế tiếp',
            ]
          : [
              'Customizable Seeds 1-4 with standard BWF quarter placement',
              'Berger cyclic round-robin scheduling algorithm',
              'Knockout tree with Bye allocation and R1 club separation',
              'Automatic winner advancement to subsequent rounds',
            ],
    },
    {
      id: 'umpire-scoring',
      title: locale === 'vi' ? 'Bảng Chấm Điểm Trọng Tài & Live-Score (Court-Side Sheet)' : 'Court-Side Umpire Sheet & Live-Score',
      path: '/prototypes/umpire-scoring',
      badge: 'Umpire / PWA Offline',
      color: 'emerald',
      description:
        locale === 'vi'
          ? 'Giao diện chấm điểm sân đấu công thái học: Nút +1 cỡ lớn (80px), chỉ thị quả cầu giao, 1-tap hoàn tác, đảo sân thị giác không đổi ID dữ liệu, và màn hình khán giả cập nhật đồng thời.'
          : 'Ergonomic court sheet: Giant +1 buttons (80px), shuttlecock server indicator, 1-tap undo, visual end swap without DB data drift, and live-score spectator card.',
      highlights:
        locale === 'vi'
          ? [
              'Nút +1 siêu lớn (≥80px) chống bấm trượt trên sân rung lắc',
              'Icon quả cầu chỉ thị bên giao & tự đảo khi đổi điểm',
              'Nút đổi sân thị giác (chỉ đảo hiển thị, không làm lệch dữ liệu DB)',
              'Xác nhận chốt kết quả độc lập (tuân thủ luật 21 điểm & chạm trần 30)',
              'Mô phỏng mất mạng (Offline Queue) và xử lý xung đột chuẩn máy chủ',
            ]
          : [
              'Giant +1 buttons (≥80px) preventing misclicks on court',
              'Shuttlecock server badge with auto-flip on rally win',
              'Visual ends swap (UI flip only, preserves database integrity)',
              'Finalize match modal adhering strictly to BWF 21 & cap 30 rules',
              'Simulated offline sync queue & server-authoritative conflict dialog',
            ],
    },
    {
      id: 'tournament-creator',
      title: locale === 'vi' ? 'Cổng Cài Đặt Giải Đấu Linh Hoạt (BTC Wizard)' : 'Flexible Tournament Creator (Admin Wizard)',
      path: '/admin/tournaments/create',
      badge: 'Admin / Config Engine',
      color: 'cyan',
      description:
        locale === 'vi'
          ? 'Quy trình 4 bước thiết lập giải đấu: Tùy biến thể thức riêng cho từng nội dung, luật tính điểm linh hoạt theo giai đoạn (15, 21, 31 điểm), và quy tắc bốc thăm tách CLB/hạt giống BWF.'
          : '4-step wizard to configure multi-event formats, stage-specific scoring rules (15, 21, 31 points), and BWF club separation & seeding principles.',
      highlights:
        locale === 'vi'
          ? [
              'Mỗi nội dung chọn thể thức riêng: Knockout, Bảng + Knockout, Vòng tròn',
              'Luật tính điểm riêng từng vòng: Vòng bảng đá 1 set 31, Vòng Knockout đá 3 set 21',
              'Bộ chọn ánh xạ Nhất - Nhì vòng bảng ra Knockout (Pattern 1, Pattern 2, Random)',
              'Bật/tắt tách CLB Vòng 1 và tách CLB chung bảng đấu',
            ]
          : [
              'Individual event format: Knockout, Group+Knockout, Round Robin',
              'Stage-specific scoring: Group stage single 31 pts, Knockout best-of-3 21 pts',
              'Group-to-knockout advancement mapping (Pattern 1, 2, 3, or Random)',
              'Toggles for Round 1 club separation and group club distribution',
            ],
    },
    {
      id: 'court-dispatcher',
      title:
        locale === 'vi'
          ? 'Bàn Điều Phối Sân Đấu & Hàng Đợi Trận (Court Dispatcher)'
          : 'Court Dispatcher & Live Match Queue (Arena Ops)',
      path: '/admin/tournaments',
      badge: 'BTC / Stadium Ops',
      color: 'rose',
      description:
        locale === 'vi'
          ? 'Hệ thống điều phối toàn diện cho nhà thi đấu: Giám sát trạng thái từng sân (Trống, Khởi động 2:00, Đang đấu), hàng đợi trận thông minh, cảnh báo thời gian nghỉ ngơi BWF (<15 phút), gán sân 1 chạm, và đồng bộ tức thì với bảng điểm Tivi LED.'
          : 'Comprehensive stadium operations cockpit: Live court status monitoring (Idle, Warm-up 2:00, In Progress), smart match queue, BWF athlete rest period warning (<15 mins), 1-click dispatch, and instant sync to TV LED scoreboards.',
      highlights:
        locale === 'vi'
          ? [
              'Lưới giám sát trực quan tất cả sân đấu kèm tỷ số trực tiếp và đồng hồ đếm ngược khởi động 120s',
              'Cảnh báo thông minh VĐV chưa đủ 15 phút nghỉ theo điều lệ BWF khi điều phối lên sân',
              'Cơ chế On-Deck chuẩn bị trận kế tiếp cho từng sân giảm thiểu tối đa thời gian trễ',
              'Nút giả lập toàn diện hoạt động cả nhà thi đấu chỉ với 1 click',
            ]
          : [
              'Live visual grid of all arena courts with real-time scoring and 120s warmup countdown',
              'Intelligent BWF 15-minute rest period enforcement warning before dispatching',
              'On-Deck next match queuing for each court minimizing court idle transition time',
              'One-click comprehensive stadium simulation mode for quick ops testing',
            ],
    },
    {
      id: 'court-scoreboard',
      title:
        locale === 'vi'
          ? 'Bảng Điểm Tivi Nhà Thi Đấu (Arena Multi-Court & Court LED)'
          : 'Arena LED Scoreboard (Multi-Court & Single Court Display)',
      path: '/scoreboard',
      badge: 'Spectator / Arena LED',
      color: 'amber',
      description:
        locale === 'vi'
          ? 'Giao diện Full-screen chuyên dụng cho màn hình Tivi lớn trong nhà thi đấu: Chế độ Tổng hợp toàn bộ sân (Multi-Court Grid 4 sân) và Chế độ Phóng to từng sân (Single Court) với chữ số LED phát sáng, bên giao cầu và đếm ngược khởi động.'
          : 'Dedicated full-screen displays for arena TV screens: Central multi-court overview grid for the stadium and focused single-court display with massive LED numerals and live warmup timers.',
      highlights:
        locale === 'vi'
          ? [
              'Chế độ Tổng quan toàn sân (/scoreboard) hiển thị đồng thời tất cả các sân đấu đang chạy',
              'Chế độ Sân đơn (/scoreboard/court/N) phóng to tỷ số LED siêu nét cho Tivi treo đầu sân',
              'Tự động hiển thị màn hình Khởi động 2:00 khi VĐV vào sân và Sân Trống khi chưa có trận',
              'Tự động đồng bộ thời gian thực theo từng cú chạm điểm của Trọng tài',
            ]
          : [
              'Central arena multi-court overview (/scoreboard) displaying all courts in real-time',
              'Single court focused display (/scoreboard/court/N) for court-side ceiling TVs',
              'Dedicated 2:00 warmup countdown screen and standby idle screens',
              'Instant WebSocket & reactive sync on every point recorded by umpires',
            ],
    },
    {
      id: 'match-scoresheet',
      title:
        locale === 'vi'
          ? 'Xuất Biên Bản Trận Đấu BWF & In Ấn (Match Scoresheet Form)'
          : 'Official BWF Match Scoresheet & Print Export Form',
      path: '/prototypes/match-scoresheet',
      badge: 'Referee / Official Print',
      color: 'indigo',
      description:
        locale === 'vi'
          ? 'Biên bản thi đấu chính thức chuẩn BWF xuất trực tiếp từ kết quả trận đấu: Bảng tỷ số từng set kèm thời lượng, nhật ký xử phạt thẻ (Vàng/Đỏ/Đen), tên tổ trọng tài, và 4 ô ký xác nhận (VĐV 1, VĐV 2, Trọng tài chính, Tổng trọng tài). Định dạng hoàn hảo cho in A4 hoặc xuất PDF.'
          : 'Official BWF match scoresheet generated from live match results: Set scores with duration, disciplinary card logs (Yellow/Red/Black), officials roster, and 4 signature verification boxes. Pixel-perfect layout for standard A4 printing and PDF archival.',
      highlights:
        locale === 'vi'
          ? [
              'Chuẩn mẫu văn bản BWF chính thức phục vụ đối soát và lưu trữ hồ sơ giải đấu',
              'Tự động tổng hợp tỷ số các set, thời gian thi đấu và tên VĐV/CLB từ hệ thống điều phối',
              'Bảng nhật ký kỷ luật ghi nhận chi tiết thẻ vàng, thẻ đỏ (+1 điểm) và lý do vi phạm',
              'Chế độ in A4 thông minh: Tự động ẩn menu điều khiển, tối ưu độ tương phản đen trắng',
            ]
          : [
              'Official BWF scoresheet standard for arbitration, verification, and tournament archival',
              'Auto-compiles set breakdown, match duration, and club metadata directly from dispatcher',
              'Disciplinary card log with yellow warnings and red fault penalty points tracking',
              'Smart print CSS: Auto-hides UI toolbars and optimizes black-and-white high contrast',
            ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.backToHome}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {t.prototypesIndex.phaseBadge}
            </span>
            <LanguageSwitcher />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t.prototypesIndex.title}
          </h1>
          <p className="mt-2 text-slate-400 text-sm md:text-base">
            {t.prototypesIndex.desc}
          </p>
        </div>

        <div className="space-y-6">
          {prototypes.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {item.badge}
                  </span>
                  <h2 className="text-xl font-bold text-white">{item.title}</h2>
                </div>
                <Link
                  href={item.path}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold hover:bg-cyan-400 transition-all shadow-md active:scale-95"
                >
                  {t.prototypesIndex.openPrototype}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">{item.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                {item.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
