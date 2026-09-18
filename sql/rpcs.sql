-- ==============================================================================
-- BADMINTON TOURNAMENT PLATFORM — STORED PROCEDURES & RPC FUNCTIONS
-- High-concurrency Race-Condition Protection, Optimistic Locking & BWF Logic
-- ==============================================================================

-- ==============================================================================
-- 1. RPC: hold_registration_slot
-- Transactional Quota locking to prevent race-conditions & overbooking
-- Sets a 15-minute reservation timer on the slot.
-- ==============================================================================
CREATE OR REPLACE FUNCTION hold_registration_slot(
  p_tournament_id UUID,
  p_event_id UUID,
  p_athlete_id UUID,
  p_partner_id UUID DEFAULT NULL,
  p_partner_name TEXT DEFAULT NULL,
  p_team_name TEXT DEFAULT '',
  p_club TEXT DEFAULT NULL,
  p_payment_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_event RECORD;
  v_current_count INT;
  v_existing_reg UUID;
  v_new_reg_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_resolved_team_name TEXT;
BEGIN
  -- 1. Kiểm tra giải đấu và trạng thái mở đăng ký
  SELECT id, status, is_public, registration_deadline
  INTO v_tournament
  FROM tournaments
  WHERE id = p_tournament_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'TOURNAMENT_NOT_FOUND',
      'message', 'Không tìm thấy giải đấu'
    );
  END IF;

  IF v_tournament.status != 'registration_open' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'REGISTRATION_CLOSED',
      'message', 'Giải đấu hiện không mở tiếp nhận đăng ký'
    );
  END IF;

  IF v_tournament.registration_deadline IS NOT NULL AND now() > v_tournament.registration_deadline THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DEADLINE_PASSED',
      'message', 'Đã hết thời hạn đăng ký thi đấu'
    );
  END IF;

  -- 2. Khóa hàng (ROW LOCK) của nội dung thi đấu để ngăn chặn race-condition
  SELECT id, max_entries, registration_fee, event_type
  INTO v_event
  FROM tournament_events
  WHERE id = p_event_id AND tournament_id = p_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'EVENT_NOT_FOUND',
      'message', 'Nội dung thi đấu không hợp lệ'
    );
  END IF;

  -- 3. Kiểm tra VĐV đã đăng ký nội dung này trước đó chưa
  SELECT id INTO v_existing_reg
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id
    AND event_id = p_event_id
    AND (athlete_id = p_athlete_id OR partner_id = p_athlete_id)
    AND status IN ('pending', 'approved', 'waitlisted');

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_REGISTERED',
      'message', 'Vận động viên đã có hồ sơ đăng ký trong nội dung này'
    );
  END IF;

  -- 4. Đếm số lượng đăng ký đang hoạt động (loại bỏ các đơn quá hạn 15 phút chưa thanh toán)
  SELECT COUNT(*)
  INTO v_current_count
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id
    AND event_id = p_event_id
    AND (
      status = 'approved'
      OR (status = 'pending' AND (waitlist_expires_at IS NULL OR waitlist_expires_at > now()))
    );

  -- 5. Kiểm tra Quota
  IF v_current_count >= v_event.max_entries THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'QUOTA_EXCEEDED',
      'message', 'Nội dung này đã đủ số lượng đăng ký (Quota đầy)',
      'current_count', v_current_count,
      'max_entries', v_event.max_entries
    );
  END IF;

  -- 6. Thiết lập thời gian giữ chỗ 15 phút
  v_expires_at := now() + interval '15 minutes';

  -- Đặt tên đội mặc định nếu để trống
  IF p_team_name IS NULL OR length(trim(p_team_name)) = 0 THEN
    v_resolved_team_name := 'Team ' || COALESCE(p_club, 'Badminton');
  ELSE
    v_resolved_team_name := trim(p_team_name);
  END IF;

  -- 7. Chèn vào bảng tournament_registrations
  INSERT INTO tournament_registrations (
    tournament_id,
    event_id,
    athlete_id,
    partner_id,
    partner_name,
    team_name,
    club,
    status,
    payment_status,
    payment_amount,
    waitlist_expires_at,
    registered_at
  ) VALUES (
    p_tournament_id,
    p_event_id,
    p_athlete_id,
    p_partner_id,
    p_partner_name,
    v_resolved_team_name,
    p_club,
    'pending',
    'unpaid',
    COALESCE(p_payment_amount, v_event.registration_fee),
    v_expires_at,
    now()
  )
  RETURNING id INTO v_new_reg_id;

  -- 8. Ghi log hoạt động kiểm toán (Audit Trail)
  INSERT INTO activity_logs (
    user_id,
    tournament_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    p_tournament_id,
    'HOLD_REGISTRATION_SLOT',
    jsonb_build_object(
      'registration_id', v_new_reg_id,
      'event_id', p_event_id,
      'athlete_id', p_athlete_id,
      'expires_at', v_expires_at,
      'current_count', v_current_count + 1,
      'max_entries', v_event.max_entries
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_new_reg_id,
    'expires_at', v_expires_at,
    'remaining_slots', v_event.max_entries - (v_current_count + 1),
    'message', 'Đã giữ chỗ thành công trong 15 phút'
  );
END;
$$;

-- ==============================================================================
-- 2. RPC: record_match_point
-- Ghi điểm trận đấu thời gian thực với khóa lạc quan (Optimistic Version Control)
-- Xác thực quy tắc BWF (21 điểm, trần 30, đấu 3 thắng 2)
-- Tự động đẩy đội thắng sang trận đấu vòng kế tiếp trong nhánh Knockout
-- ==============================================================================
CREATE OR REPLACE FUNCTION record_match_point(
  p_match_id UUID,
  p_point_to_team TEXT, -- 'a' hoặc 'b'
  p_expected_version INT,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_new_pts_a INT;
  v_new_pts_b INT;
  v_sets_a INT;
  v_sets_b INT;
  v_current_set INT;
  v_set_won BOOLEAN := false;
  v_match_finished BOOLEAN := false;
  v_winner_entry_id UUID := NULL;
  v_new_game_scores JSONB;
  v_next_match RECORD;
  v_next_bracket_pos INT;
  v_winner_team_code TEXT := NULL;
BEGIN
  -- 1. Khóa hàng của trận đấu (FOR UPDATE)
  SELECT *
  INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MATCH_NOT_FOUND',
      'message', 'Không tìm thấy trận đấu'
    );
  END IF;

  -- 2. Kiểm tra xung đột phiên bản (Optimistic Locking)
  IF v_match.version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'VERSION_CONFLICT',
      'server_version', v_match.version,
      'current_points_a', v_match.points_a,
      'current_points_b', v_match.points_b,
      'message', 'Dữ liệu trên máy chủ đã thay đổi. Vui lòng đồng bộ lại.'
    );
  END IF;

  -- 3. Kiểm tra trạng thái trận đấu
  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'MATCH_ALREADY_COMPLETED',
      'message', 'Trận đấu đã kết thúc và khóa kết quả'
    );
  END IF;

  -- 4. Tính toán điểm số hiện tại
  v_new_pts_a := v_match.points_a;
  v_new_pts_b := v_match.points_b;
  v_sets_a := v_match.sets_a;
  v_sets_b := v_match.sets_b;
  v_current_set := v_sets_a + v_sets_b + 1;
  v_new_game_scores := COALESCE(v_match.game_scores, '[]'::jsonb);

  IF p_point_to_team = 'a' THEN
    v_new_pts_a := v_new_pts_a + 1;
  ELSIF p_point_to_team = 'b' THEN
    v_new_pts_b := v_new_pts_b + 1;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_TEAM',
      'message', 'Đội ghi điểm phải là a hoặc b'
    );
  END IF;

  -- 5. Kiểm tra quy tắc kết thúc Set BWF (Chạm 21 cách 2 điểm hoặc chạm trần 30)
  IF (v_new_pts_a >= 21 AND (v_new_pts_a - v_new_pts_b) >= 2) OR (v_new_pts_a = 30) THEN
    -- Đội A thắng set
    v_set_won := true;
    v_sets_a := v_sets_a + 1;
    -- Lưu set score vào mảng game_scores
    v_new_game_scores := v_new_game_scores || jsonb_build_object('scoreA', v_new_pts_a, 'scoreB', v_new_pts_b);
    -- Reset điểm cho set tiếp theo
    v_new_pts_a := 0;
    v_new_pts_b := 0;
  ELSIF (v_new_pts_b >= 21 AND (v_new_pts_b - v_new_pts_a) >= 2) OR (v_new_pts_b = 30) THEN
    -- Đội B thắng set
    v_set_won := true;
    v_sets_b := v_sets_b + 1;
    -- Lưu set score vào mảng game_scores
    v_new_game_scores := v_new_game_scores || jsonb_build_object('scoreA', v_new_pts_a, 'scoreB', v_new_pts_b);
    -- Reset điểm cho set tiếp theo
    v_new_pts_a := 0;
    v_new_pts_b := 0;
  END IF;

  -- 6. Kiểm tra quy tắc kết thúc trận đấu (Thắng 2 trên 3 set)
  IF v_sets_a = 2 THEN
    v_match_finished := true;
    v_winner_entry_id := v_match.entry1_id;
    v_winner_team_code := 'a';
  ELSIF v_sets_b = 2 THEN
    v_match_finished := true;
    v_winner_entry_id := v_match.entry2_id;
    v_winner_team_code := 'b';
  END IF;

  -- 7. Cập nhật bảng tournament_matches
  UPDATE tournament_matches
  SET
    points_a = v_new_pts_a,
    points_b = v_new_pts_b,
    sets_a = v_sets_a,
    sets_b = v_sets_b,
    game_scores = v_new_game_scores,
    status = CASE
      WHEN v_match_finished THEN 'completed'
      ELSE 'in_progress'
    END,
    winner_id = CASE
      WHEN v_match_finished THEN v_winner_entry_id
      ELSE winner_id
    END,
    score = CASE
      WHEN v_match_finished THEN
        (SELECT string_agg((elem->>'scoreA') || '-' || (elem->>'scoreB'), ', ')
         FROM jsonb_array_elements(v_new_game_scores) elem)
      ELSE score
    END,
    version = v_match.version + 1,
    updated_at = now()
  WHERE id = p_match_id;

  -- 8. Nếu trận kết thúc và là nhánh Knockout, tự động đẩy người thắng sang trận vòng kế tiếp
  IF v_match_finished AND v_match.stage = 'knockout' AND v_match.bracket_round IS NOT NULL THEN
    v_next_bracket_pos := FLOOR(v_match.bracket_position / 2);

    -- Tìm trận đấu ở vòng tiếp theo
    SELECT id, entry1_id, entry2_id
    INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND event_id = v_match.event_id
      AND stage = 'knockout'
      AND bracket_round = v_match.bracket_round + 1
      AND bracket_position = v_next_bracket_pos;

    IF FOUND THEN
      -- Nếu vị trí chẵn thì vào entry1, lẻ thì vào entry2
      IF (v_match.bracket_position % 2) = 0 THEN
        UPDATE tournament_matches
        SET entry1_id = v_winner_entry_id, updated_at = now()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches
        SET entry2_id = v_winner_entry_id, updated_at = now()
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  END IF;

  -- 9. Ghi Audit Log
  INSERT INTO activity_logs (
    user_id,
    tournament_id,
    action,
    details
  ) VALUES (
    COALESCE(p_actor_id, auth.uid()),
    v_match.tournament_id,
    'RECORD_MATCH_POINT',
    jsonb_build_object(
      'match_id', p_match_id,
      'point_to', p_point_to_team,
      'new_points_a', v_new_pts_a,
      'new_points_b', v_new_pts_b,
      'sets_a', v_sets_a,
      'sets_b', v_sets_b,
      'is_set_won', v_set_won,
      'is_match_finished', v_match_finished,
      'new_version', v_match.version + 1
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'version', v_match.version + 1,
    'points_a', v_new_pts_a,
    'points_b', v_new_pts_b,
    'sets_a', v_sets_a,
    'sets_b', v_sets_b,
    'game_scores', v_new_game_scores,
    'is_set_won', v_set_won,
    'is_match_finished', v_match_finished,
    'winner_id', v_winner_entry_id,
    'winner_team', v_winner_team_code
  );
END;
$$;

-- ==============================================================================
-- 3. RPC: finalize_match_result
-- Xác nhận chốt kết quả trận đấu bởi Trọng tài chính / Ban Tổ Chức
-- Khóa chỉnh sửa điểm số và cập nhật bảng thống kê thành tích VĐV (athlete_stats)
-- ==============================================================================
CREATE OR REPLACE FUNCTION finalize_match_result(
  p_match_id UUID,
  p_winner_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
BEGIN
  SELECT *
  INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'MATCH_NOT_FOUND');
  END IF;

  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'code', 'ALREADY_FINALIZED');
  END IF;

  UPDATE tournament_matches
  SET
    status = 'completed',
    winner_id = p_winner_id,
    notes = COALESCE(p_notes, notes),
    version = v_match.version + 1,
    updated_at = now()
  WHERE id = p_match_id;

  -- Ghi Audit Trail
  INSERT INTO activity_logs (
    user_id,
    tournament_id,
    action,
    details
  ) VALUES (
    COALESCE(p_actor_id, auth.uid()),
    v_match.tournament_id,
    'FINALIZE_MATCH_RESULT',
    jsonb_build_object(
      'match_id', p_match_id,
      'winner_id', p_winner_id,
      'score', v_match.score
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'status', 'completed',
    'version', v_match.version + 1
  );
END;
$$;

-- ==============================================================================
-- 4. RPC: calculate_club_rankings
-- Tính điểm thi đua toàn đoàn theo công thức quốc gia:
-- Điểm = (Vàng x 10) + (Bạc x 6) + (Đồng x 3)
-- ==============================================================================
CREATE OR REPLACE FUNCTION calculate_club_rankings(
  p_tournament_id UUID DEFAULT NULL
)
RETURNS TABLE (
  rank INT,
  club_name TEXT,
  tournaments_count BIGINT,
  gold_medals BIGINT,
  silver_medals BIGINT,
  bronze_medals BIGINT,
  total_points BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH completed_tourneys AS (
    SELECT id FROM tournaments
    WHERE status IN ('completed', 'archived')
      AND (p_tournament_id IS NULL OR id = p_tournament_id)
  ),
  club_entries AS (
    SELECT DISTINCT
      te.club AS club_name,
      te.tournament_id
    FROM tournament_entries te
    JOIN completed_tourneys ct ON ct.id = te.tournament_id
    WHERE te.club IS NOT NULL AND te.club != ''
  ),
  -- Finals matches (determine Gold & Silver)
  finals AS (
    SELECT
      tm.tournament_id,
      tm.event_id,
      winner_e.club AS gold_club,
      runner_e.club AS silver_club
    FROM tournament_matches tm
    JOIN completed_tourneys ct ON ct.id = tm.tournament_id
    JOIN tournament_entries winner_e ON winner_e.id = tm.winner_id
    JOIN tournament_entries runner_e ON runner_e.id = (
      CASE WHEN tm.entry1_id = tm.winner_id THEN tm.entry2_id ELSE tm.entry1_id END
    )
    WHERE tm.status = 'completed'
      AND (tm.round_name ILIKE '%chung kết%' OR tm.round_name ILIKE '%final%')
      AND tm.round_name NOT ILIKE '%bán kết%' AND tm.round_name NOT ILIKE '%semi%'
  ),
  -- Semi-finals losers (determine Bronze medals)
  bronzes AS (
    SELECT
      tm.tournament_id,
      loser_e.club AS bronze_club
    FROM tournament_matches tm
    JOIN completed_tourneys ct ON ct.id = tm.tournament_id
    JOIN tournament_entries loser_e ON loser_e.id = (
      CASE WHEN tm.entry1_id = tm.winner_id THEN tm.entry2_id ELSE tm.entry1_id END
    )
    WHERE tm.status = 'completed'
      AND (tm.round_name ILIKE '%bán kết%' OR tm.round_name ILIKE '%semi%')
  ),
  club_stats AS (
    SELECT
      ce.club_name,
      COUNT(DISTINCT ce.tournament_id) AS tournaments_count,
      COUNT(DISTINCT f_gold.tournament_id || '-' || f_gold.event_id) FILTER (WHERE f_gold.gold_club = ce.club_name) AS gold_medals,
      COUNT(DISTINCT f_silver.tournament_id || '-' || f_silver.event_id) FILTER (WHERE f_silver.silver_club = ce.club_name) AS silver_medals,
      COUNT(b.tournament_id) FILTER (WHERE b.bronze_club = ce.club_name) AS bronze_medals
    FROM club_entries ce
    LEFT JOIN finals f_gold ON f_gold.gold_club = ce.club_name
    LEFT JOIN finals f_silver ON f_silver.silver_club = ce.club_name
    LEFT JOIN bronzes b ON b.bronze_club = ce.club_name
    GROUP BY ce.club_name
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY (cs.gold_medals * 10 + cs.silver_medals * 6 + cs.bronze_medals * 3) DESC, cs.gold_medals DESC, cs.silver_medals DESC)::INT AS rank,
    cs.club_name,
    cs.tournaments_count,
    cs.gold_medals,
    cs.silver_medals,
    cs.bronze_medals,
    (cs.gold_medals * 10 + cs.silver_medals * 6 + cs.bronze_medals * 3)::BIGINT AS total_points
  FROM club_stats cs
  ORDER BY total_points DESC, gold_medals DESC;
$$;
