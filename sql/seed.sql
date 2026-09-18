-- ==============================================================================
-- BADMINTON TOURNAMENT PLATFORM — SEED DATA
-- 3 Giải đấu mẫu, 5 CLB, 10 VĐV, Nội dung thi đấu, Đăng ký & Trận đấu trực tiếp
-- ==============================================================================

-- 1. TẠO BAN TỔ CHỨC (ORGANIZER)
INSERT INTO organizers (id, name, description, contact_email, contact_phone, website, verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Liên Đoàn Cầu Lông Hà Nội',
  'Cơ quan quản lý và phát triển phong trào cầu lông Thủ đô Hà Nội',
  'contact@badminton.hanoi.vn',
  '0912345678',
  'https://badminton.org.vn',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. TẠO HỒ SƠ VẬN ĐỘNG VIÊN (ATHLETES)
INSERT INTO athletes (id, full_name, display_name, email, phone, gender, club, skill_level, city)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Nguyễn Văn A', 'A. Nguyen', 'vana@badminton.vn', '0901111111', 'male', 'CLB Ba Đình', 'advanced', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000002', 'Lê Hùng', 'H. Le', 'lehung@badminton.vn', '0902222222', 'male', 'CLB Ba Đình', 'advanced', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000003', 'Trần Thị B', 'B. Tran', 'thib@badminton.vn', '0903333333', 'female', 'CLB Cầu Giấy', 'advanced', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000004', 'Mai Lan', 'L. Mai', 'mailan@badminton.vn', '0904444444', 'female', 'CLB Cầu Giấy', 'intermediate', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000005', 'Phạm Đức C', 'C. Pham', 'ducc@badminton.vn', '0905555555', 'male', 'CLB Hoàn Kiếm', 'intermediate', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000006', 'Vũ Tuấn', 'T. Vu', 'vutuan@badminton.vn', '0906666666', 'male', 'CLB Hoàn Kiếm', 'intermediate', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000007', 'Hoàng Minh D', 'D. Hoang', 'minhd@badminton.vn', '0907777777', 'male', 'CLB Thăng Long', 'intermediate', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000008', 'Đỗ Hải', 'H. Do', 'dohai@badminton.vn', '0908888888', 'male', 'CLB Thăng Long', 'intermediate', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000009', 'Lê Thanh G', 'G. Le', 'thanhg@badminton.vn', '0909999999', 'male', 'CLB Đống Đa', 'beginner', 'Hà Nội'),
  ('10000000-0000-0000-0000-000000000010', 'Phan Lâm', 'L. Phan', 'phanlam@badminton.vn', '0900000000', 'male', 'CLB Đống Đa', 'beginner', 'Hà Nội')
ON CONFLICT (id) DO NOTHING;

-- 3. TẠO 3 GIẢI ĐẤU MẪU (TOURNAMENTS)
INSERT INTO tournaments (
  id, organizer_id, name, slug, sport_type, description, venue, address,
  start_date, end_date, registration_deadline, entry_fee, is_public, status, timezone
) VALUES
  -- Giải 1: Đang diễn ra (In Progress)
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Giải Cầu Lông Mùa Xuân 2026',
    'spring-championship-2026',
    'badminton',
    'Giải đấu thường niên quy tụ hơn 160 tay vợt phong trào và bán chuyên xuất sắc từ 24 câu lạc bộ miền Bắc.',
    'Nhà Thi Đấu Cầu Giấy',
    '35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội',
    '2026-03-12',
    '2026-03-16',
    '2026-03-08 23:59:59+07',
    500000,
    true,
    'in_progress',
    'Asia/Ho_Chi_Minh'
  ),
  -- Giải 2: Đang mở đăng ký (Registration Open)
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Giải Cầu Lông Mở Rộng Hè 2026',
    'summer-open-2026',
    'badminton',
    'Giải đấu mở rộng quy mô lớn chào hè 2026, tranh cúp vô địch và tổng giải thưởng tiền mặt 60.000.000 VND.',
    'Nhà Thi Đấu Trịnh Hoài Đức',
    '12 Trịnh Hoài Đức, Đống Đa, Hà Nội',
    '2026-06-20',
    '2026-06-23',
    '2026-06-15 23:59:59+07',
    600000,
    true,
    'registration_open',
    'Asia/Ho_Chi_Minh'
  ),
  -- Giải 3: Đã kết thúc / Kỷ yếu (Completed)
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Cúp Cầu Lông Mùa Đông 2025',
    'winter-cup-2025',
    'badminton',
    'Kỷ yếu kết quả Cúp Cầu lông Mùa Đông 2025. Lưu trữ vĩnh viễn bục vinh danh và tỷ số từng trận.',
    'Nhà Thi Đấu Tây Hồ',
    '101 Xuân La, Tây Hồ, Hà Nội',
    '2025-12-18',
    '2025-12-21',
    '2025-12-10 23:59:59+07',
    450000,
    true,
    'completed',
    'Asia/Ho_Chi_Minh'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. TẠO NỘI DUNG THI ĐẤU (TOURNAMENT_EVENTS)
INSERT INTO tournament_events (id, tournament_id, name, event_type, format, max_entries, registration_fee)
VALUES
  -- Nội dung giải Spring 2026
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Đôi Nam Hạng B', 'md', 'knockout', 32, 500000),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Đôi Nữ Hạng B', 'wd', 'knockout', 16, 500000),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Đôi Nam Nữ Hạng B', 'xd', 'knockout', 24, 500000),
  -- Nội dung giải Summer Open 2026
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Đôi Nam Mở Rộng', 'md', 'knockout', 32, 600000),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'Đôi Nam Nữ Mở Rộng', 'xd', 'knockout', 32, 600000),
  -- Nội dung giải Winter Cup 2025
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'Đôi Nam Hạng B (Kỷ yếu)', 'md', 'knockout', 16, 450000)
ON CONFLICT (id) DO NOTHING;

-- 5. TẠO DANH SÁCH ĐỘI (TOURNAMENT_ENTRIES) CHO GIẢI SPRING 2026
INSERT INTO tournament_entries (id, tournament_id, event_id, name, is_seeded, seed_number, club, status)
VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Nguyễn Văn A / Lê Hùng', true, 1, 'CLB Ba Đình', 'confirmed'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Trần Thị B / Mai Lan', true, 2, 'CLB Cầu Giấy', 'confirmed'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Phạm Đức C / Vũ Tuấn', true, 3, 'CLB Hoàn Kiếm', 'confirmed'),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Hoàng Minh D / Đỗ Hải', true, 4, 'CLB Thăng Long', 'confirmed')
ON CONFLICT (id) DO NOTHING;

-- GÁN THÀNH VIÊN VÀO ĐỘI
INSERT INTO tournament_entry_members (entry_id, athlete_id, member_order)
VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 2),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 1),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 2)
ON CONFLICT (entry_id, athlete_id) DO NOTHING;

-- 6. TẠO TRẬN ĐẤU LIVE VÀ TRẬN ĐÃ CHỐT CHO GIẢI SPRING 2026
INSERT INTO tournament_matches (
  id, tournament_id, event_id, entry1_id, entry2_id, winner_id,
  score, stage, round, round_name, bracket_round, bracket_position, match_number,
  sets_a, sets_b, points_a, points_b, game_scores, court_info, status, version
) VALUES
  -- Trận 1 (Sân 1 - Chung kết đang diễn ra rất kịch tính 20-19)
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    NULL,
    '21-19, 18-21',
    'knockout',
    3,
    'Chung Kết',
    2,
    0,
    1,
    1,
    1,
    20,
    19,
    '[{"scoreA": 21, "scoreB": 19}, {"scoreA": 18, "scoreB": 21}]'::jsonb,
    'Sân 1',
    'in_progress',
    4
  ),
  -- Trận 2 (Sân 2 - Tranh giải Ba)
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000004',
    NULL,
    '21-16',
    'knockout',
    2,
    'Tranh Hạng Ba',
    1,
    1,
    2,
    1,
    0,
    15,
    11,
    '[{"scoreA": 21, "scoreB": 16}]'::jsonb,
    'Sân 2',
    'in_progress',
    2
  )
ON CONFLICT (id) DO NOTHING;

-- 7. TẠO CÀI ĐẶT TOÀN CỤC (SYSTEM_SETTINGS)
INSERT INTO system_settings (key, value)
VALUES (
  'platform_config',
  jsonb_build_object(
    'platform_name', 'Badminton Tournament Platform',
    'version', '1.0.0',
    'maintenance_mode', false,
    'allow_public_registrations', true,
    'default_scoring_rules', 'BWF_21_CAP_30'
  )
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
