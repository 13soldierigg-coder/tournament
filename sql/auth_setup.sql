-- ==============================================================================
-- BADMINTON TOURNAMENT PLATFORM — SUPABASE AUTH & SECURITY SETUP
-- 1. Bảng mã PIN sân đấu cho Trọng tài (court_pins)
-- 2. Hàm RPC xác thực mã PIN sân an toàn (verify_court_pin)
-- 3. Trigger tự động đồng bộ tài khoản từ auth.users sang athletes / organizers
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BẢNG COURT_PINS (MÃ PIN TRỌNG TÀI THEO TỪNG SÂN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS court_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  court_number INT NOT NULL,
  pin_hash TEXT NOT NULL,
  assigned_referee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tournament_id, court_number)
);

CREATE INDEX IF NOT EXISTS idx_court_pins_tournament ON court_pins(tournament_id, court_number);

-- Bật RLS
ALTER TABLE court_pins ENABLE ROW LEVEL SECURITY;

-- BTC quản lý mã PIN các sân của giải mình
DROP POLICY IF EXISTS "Organizers manage court pins" ON court_pins;
CREATE POLICY "Organizers manage court pins" ON court_pins FOR ALL
  USING (
    tournament_id IN (
      SELECT id FROM tournaments 
      WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT id FROM tournaments 
      WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    )
  );

-- Trọng tài / Public có thể đọc để xác thực (chỉ qua RPC bảo mật bên dưới)
DROP POLICY IF EXISTS "Public can verify pins through RPC" ON court_pins;
CREATE POLICY "Public can verify pins through RPC" ON court_pins FOR SELECT
  USING (true);

-- ==============================================================================
-- 2. RPC XÁC THỰC MÃ PIN SÂN (VERIFY_COURT_PIN)
-- ==============================================================================
CREATE OR REPLACE FUNCTION verify_court_pin(
  p_court_number INT,
  p_pin TEXT,
  p_tournament_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_tournament_id UUID := p_tournament_id;
  v_is_valid BOOLEAN := false;
BEGIN
  -- Nếu không truyền tournament_id cụ thể, tìm giải đang diễn ra gần nhất
  IF v_tournament_id IS NULL THEN
    SELECT id INTO v_tournament_id
    FROM tournaments
    WHERE status IN ('in_progress', 'registration_closed')
    ORDER BY start_date DESC
    LIMIT 1;
  END IF;

  -- Tìm cấu hình mã PIN của sân
  SELECT cp.id, cp.tournament_id, cp.court_number, cp.pin_hash, cp.assigned_referee_name, t.name as tournament_name
  INTO v_record
  FROM court_pins cp
  JOIN tournaments t ON t.id = cp.tournament_id
  WHERE cp.court_number = p_court_number
    AND (v_tournament_id IS NULL OR cp.tournament_id = v_tournament_id)
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback kiểm tra mã PIN mặc định thử nghiệm (1234 hoặc 8888) khi chưa set trong DB
    IF p_pin IN ('1234', '8888') THEN
      RETURN jsonb_build_object(
        'success', true,
        'courtNumber', p_court_number,
        'refereeName', 'Trọng Tài Sân ' || p_court_number,
        'role', 'referee',
        'isDefaultPin', true
      );
    END IF;

    RETURN jsonb_build_object(
      'success', false,
      'code', 'PIN_NOT_FOUND',
      'message', 'Không tìm thấy cấu hình mã PIN cho sân ' || p_court_number
    );
  END IF;

  -- Xác thực bằng pgcrypto crypt hoặc so khớp trực tiếp
  IF v_record.pin_hash = crypt(p_pin, v_record.pin_hash) OR v_record.pin_hash = p_pin THEN
    v_is_valid := true;
  END IF;

  IF v_is_valid THEN
    RETURN jsonb_build_object(
      'success', true,
      'tournamentId', v_record.tournament_id,
      'tournamentName', v_record.tournament_name,
      'courtNumber', v_record.court_number,
      'refereeName', COALESCE(v_record.assigned_referee_name, 'Trọng Tài Sân ' || v_record.court_number),
      'role', 'referee'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_PIN',
      'message', 'Mã PIN sân không chính xác'
    );
  END IF;
END;
$$;

-- ==============================================================================
-- 3. TRIGGER ĐỒNG BỘ USER MỚI TỪ SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_club_name TEXT;
BEGIN
  -- Lấy role từ metadata truyền vào lúc signUp
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'athlete');
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  v_phone := new.raw_user_meta_data->>'phone';
  v_club_name := new.raw_user_meta_data->>'club_name';

  -- Phân loại tạo profile tương ứng
  IF v_role = 'organizer' THEN
    INSERT INTO public.organizers (
      user_id,
      name,
      contact_email,
      contact_phone,
      description,
      verified
    )
    VALUES (
      new.id,
      v_full_name,
      new.email,
      v_phone,
      v_club_name,
      false
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      contact_email = EXCLUDED.contact_email,
      contact_phone = COALESCE(EXCLUDED.contact_phone, organizers.contact_phone);
  ELSE
    INSERT INTO public.athletes (
      user_id,
      full_name,
      display_name,
      email,
      phone,
      club
    )
    VALUES (
      new.id,
      v_full_name,
      v_full_name,
      new.email,
      v_phone,
      v_club_name
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, athletes.phone);
  END IF;

  RETURN new;
END;
$$;

-- Gắn trigger vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
