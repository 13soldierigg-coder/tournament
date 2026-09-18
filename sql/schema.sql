-- ==============================================================================
-- BADMINTON TOURNAMENT PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- 16 Bảng dữ liệu hoàn chỉnh, bảo mật RLS, Indexes & BWF Rules Engine Compatible
-- ==============================================================================

-- Bật các tiện ích mở rộng cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BẢNG ATHLETES (HỒ SƠ VẬN ĐỘNG VIÊN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  avatar_url TEXT,
  club TEXT,
  skill_level TEXT DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  bio TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 2. BẢNG ORGANIZERS (BAN TỔ CHỨC GIẢI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. BẢNG TOURNAMENTS (GIẢI ĐẤU)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  sport_type TEXT DEFAULT 'badminton' NOT NULL,
  description TEXT,
  venue TEXT,
  address TEXT,
  banner_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline TIMESTAMPTZ,
  entry_fee NUMERIC(12, 2) DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'archived')),
  rules_config JSONB DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. NỘI DUNG THI ĐẤU: không lưu trong JSONB để bảo toàn FK, quota và rule.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ms', 'ws', 'md', 'wd', 'xd')),
  format TEXT NOT NULL CHECK (format IN ('group', 'knockout', 'group_knockout')),
  max_entries INT NOT NULL CHECK (max_entries > 1),
  registration_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
  stage_configs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, event_type, name)
);

-- ==============================================================================
-- 5. BẢNG TOURNAMENT_REGISTRATIONS (ĐƠN ĐĂNG KÝ VẬN ĐỘNG VIÊN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES tournament_events(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES athletes(id) ON DELETE SET NULL CHECK (partner_id IS DISTINCT FROM athlete_id),
  partner_name TEXT,
  partner_confirmed_at TIMESTAMPTZ,
  team_name TEXT NOT NULL,
  club TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'waitlisted')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'waived')),
  payment_amount NUMERIC(12, 2) DEFAULT 0 CHECK (payment_amount >= 0),
  payment_ref TEXT,
  waitlist_expires_at TIMESTAMPTZ,
  notes TEXT,
  admin_notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Invite token is stored only as a hash. Raw token is returned once by server.
CREATE TABLE IF NOT EXISTS partner_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES athletes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. BẢNG TOURNAMENT_ENTRIES (DANH SÁCH ĐỘI CHÍNH THỨC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES tournament_events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES tournament_registrations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_seeded BOOLEAN DEFAULT false,
  seed_number INT DEFAULT 0,
  club TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'withdrawn', 'disqualified')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_entry_members (
  entry_id UUID NOT NULL REFERENCES tournament_entries(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE RESTRICT,
  member_order SMALLINT NOT NULL CHECK (member_order IN (1, 2)),
  PRIMARY KEY (entry_id, athlete_id),
  UNIQUE (entry_id, member_order)
);

-- ==============================================================================
-- 6. BẢNG TOURNAMENT_GROUPS (BẢNG ĐẤU VÒNG BẢNG)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournament_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES tournament_events(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  UNIQUE (tournament_id, event_id, group_name)
);

-- ==============================================================================
-- 7. BẢNG TOURNAMENT_GROUP_MEMBERS (ĐỘI THUỘC BẢNG ĐẤU)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournament_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES tournament_groups(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES tournament_entries(id) ON DELETE CASCADE,
  seed_in_group INT DEFAULT 0,
  UNIQUE (group_id, entry_id)
);

-- ==============================================================================
-- 8. BẢNG TOURNAMENT_MATCHES (TRẬN ĐẤU & TỶ SỐ)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES tournament_events(id) ON DELETE CASCADE,
  group_id UUID REFERENCES tournament_groups(id) ON DELETE SET NULL,
  entry1_id UUID REFERENCES tournament_entries(id) ON DELETE SET NULL,
  entry2_id UUID REFERENCES tournament_entries(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_entries(id) ON DELETE SET NULL,
  score TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('group', 'knockout')),
  round INT DEFAULT 1,
  round_name TEXT,
  bracket_round INT,
  bracket_position INT DEFAULT 0,
  match_number INT DEFAULT 1,
  sets_a INT DEFAULT 0,
  sets_b INT DEFAULT 0,
  points_a INT DEFAULT 0,
  points_b INT DEFAULT 0,
  game_scores JSONB DEFAULT '[]'::jsonb,
  match_time TIMESTAMPTZ,
  court_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'called', 'on_court', 'in_progress', 'completed', 'walkover', 'retired', 'cancelled')),
  result_type TEXT DEFAULT 'normal' CHECK (result_type IN ('normal', 'walkover', 'retired', 'bye')),
  placeholder_entry1 TEXT,
  placeholder_entry2 TEXT,
  notes TEXT,
  version INT NOT NULL DEFAULT 0,
  result_request_id UUID UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 9. BẢNG NOTIFICATIONS (HỘP THƯ THÔNG BÁO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 10. BẢNG ATHLETE_STATS (THỐNG KÊ THÀNH TÍCH VĐV)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS athlete_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES tournament_events(id) ON DELETE CASCADE,
  final_ranking TEXT,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  points_won INT DEFAULT 0,
  points_lost INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 11. BẢNG ACTIVITY_LOGS (NHẬT KÝ THAO TÁC / AUDIT TRAIL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 12. BẢNG SYSTEM_SETTINGS (CÀI ĐẶT TOÀN CỤC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- CHỈ MỤC (INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON tournament_matches(tournament_id, stage);
CREATE INDEX IF NOT EXISTS idx_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON tournament_registrations(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_athlete ON tournament_registrations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_entries_tournament ON tournament_entries(tournament_id);
CREATE INDEX IF NOT EXISTS idx_events_tournament ON tournament_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_entry_members_athlete ON tournament_entry_members(athlete_id);
CREATE INDEX IF NOT EXISTS idx_partner_invites_registration ON partner_invites(registration_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ==============================================================================
-- CHÍNH SÁCH BẢO MẬT ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_entry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Public data is limited to published tournaments; PII is never exposed from athletes.
CREATE POLICY "Public can view published tournaments" ON tournaments FOR SELECT
  USING (is_public = true AND status IN ('registration_open', 'registration_closed', 'in_progress', 'completed'));
CREATE POLICY "Public can view published events" ON tournament_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_events.tournament_id AND t.is_public AND t.status IN ('registration_open', 'registration_closed', 'in_progress', 'completed')));
CREATE POLICY "Public can view published entries" ON tournament_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_entries.tournament_id AND t.is_public AND t.status IN ('registration_open', 'registration_closed', 'in_progress', 'completed')));
CREATE POLICY "Public can view published groups" ON tournament_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_groups.tournament_id AND t.is_public AND t.status IN ('registration_closed', 'in_progress', 'completed')));
CREATE POLICY "Public can view published group members" ON tournament_group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM tournament_groups g JOIN tournaments t ON t.id = g.tournament_id WHERE g.id = tournament_group_members.group_id AND t.is_public AND t.status IN ('registration_closed', 'in_progress', 'completed')));
CREATE POLICY "Public can view published matches" ON tournament_matches FOR SELECT
  USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_matches.tournament_id AND t.is_public AND t.status IN ('registration_closed', 'in_progress', 'completed')));
CREATE POLICY "Public can view published entry members" ON tournament_entry_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM tournament_entries e JOIN tournaments t ON t.id = e.tournament_id WHERE e.id = tournament_entry_members.entry_id AND t.is_public AND t.status IN ('registration_open', 'registration_closed', 'in_progress', 'completed')));

-- Quyền của Vận Động Viên
CREATE POLICY "Athletes can create own profile" ON athletes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Athletes can read own profile" ON athletes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Athletes can update own profile" ON athletes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers can read own profile" ON organizers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Athletes can view own registrations" ON tournament_registrations FOR SELECT USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));
CREATE POLICY "Athletes can insert own registration" ON tournament_registrations FOR INSERT WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications read status" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Quyền của Ban Tổ Chức
CREATE POLICY "Organizers have full access to their tournaments" ON tournaments FOR ALL USING (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()));
CREATE POLICY "Organizers can manage events" ON tournament_events FOR ALL USING (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()))) WITH CHECK (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));
CREATE POLICY "Organizers can manage registrations of their tournaments" ON tournament_registrations FOR ALL USING (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));
CREATE POLICY "Organizers can manage tournament entries" ON tournament_entries FOR ALL USING (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));
-- Score, winner, bracket mutations and match rescheduling are handled exclusively by authorized SECURITY DEFINER RPCs / Server Actions to preserve audit trail, concurrency versioning, and bracket cascade integrity.
CREATE POLICY "Organizers can read own tournament matches" ON tournament_matches FOR SELECT USING (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));
CREATE POLICY "Organizers can manage groups" ON tournament_groups FOR ALL USING (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()))) WITH CHECK (tournament_id IN (SELECT id FROM tournaments WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));
CREATE POLICY "Organizers can manage group members" ON tournament_group_members FOR ALL USING (group_id IN (SELECT g.id FROM tournament_groups g JOIN tournaments t ON t.id = g.tournament_id WHERE t.organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()))) WITH CHECK (group_id IN (SELECT g.id FROM tournament_groups g JOIN tournaments t ON t.id = g.tournament_id WHERE t.organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())));
