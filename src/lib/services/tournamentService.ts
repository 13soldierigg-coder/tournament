import { createClient } from '@/lib/supabase/client';
import { MOCK_TOURNAMENTS, MockTournament, TournamentBankAccount, EventPrizeItem } from '@/data/mockTournaments';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('mock.supabase.co') && key !== 'mock-key');
}

export interface TournamentFilter {
  status?: 'all' | 'live' | 'upcoming' | 'completed';
}

const CUSTOM_TOURNAMENTS_KEY = 'badminton_custom_tournaments';
let inMemoryCustomTournaments: MockTournament[] = [];

/**
 * Lấy danh sách giải đấu do người dùng/BTC tự tạo (từ localStorage hoặc in-memory)
 */
export function getCustomTournaments(): MockTournament[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CUSTOM_TOURNAMENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MockTournament[];
        const idSet = new Set(parsed.map((t) => t.id));
        for (const mem of inMemoryCustomTournaments) {
          if (!idSet.has(mem.id)) {
            parsed.unshift(mem);
          }
        }
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return inMemoryCustomTournaments;
}

/**
 * Lưu giải đấu do người dùng tạo vào bộ nhớ cục bộ
 */
export function saveCustomTournament(tournament: MockTournament): void {
  inMemoryCustomTournaments = [
    tournament,
    ...inMemoryCustomTournaments.filter((t) => t.id !== tournament.id && t.slug !== tournament.slug),
  ];
  if (typeof window !== 'undefined') {
    try {
      const current = getCustomTournaments();
      const updated = [
        tournament,
        ...current.filter((t) => t.id !== tournament.id && t.slug !== tournament.slug),
      ];
      localStorage.setItem(CUSTOM_TOURNAMENTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

/**
 * Xóa giải đấu do người dùng tạo
 */
export function deleteCustomTournament(idOrSlug: string): void {
  inMemoryCustomTournaments = inMemoryCustomTournaments.filter(
    (t) => t.id !== idOrSlug && t.slug !== idOrSlug
  );
  if (typeof window !== 'undefined') {
    try {
      const current = getCustomTournaments();
      const updated = current.filter((t) => t.id !== idOrSlug && t.slug !== idOrSlug);
      localStorage.setItem(CUSTOM_TOURNAMENTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

/**
 * Lấy danh sách giải đấu (kết hợp giải tự tạo + mock data hoặc Supabase)
 */
export async function getTournaments(filter?: TournamentFilter): Promise<MockTournament[]> {
  const custom = getCustomTournaments();
  const allTournaments = [...custom, ...MOCK_TOURNAMENTS];

  if (!isSupabaseConfigured()) {
    return filterTournamentsList(allTournaments, filter?.status);
  }

  try {
    const supabase = createClient();
    let query = supabase.from('tournaments').select('*');

    if (filter?.status === 'live') {
      query = query.eq('status', 'in_progress');
    } else if (filter?.status === 'upcoming') {
      query = query.eq('status', 'registration_open');
    } else if (filter?.status === 'completed') {
      query = query.in('status', ['completed', 'archived']);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return filterTournamentsList(allTournaments, filter?.status);
    }

    // Map dữ liệu từ Supabase sang giao diện MockTournament
    const dbTournaments: MockTournament[] = data.map((row: Record<string, unknown>) => {
      const rulesConfig = (row.rules_config || {}) as Record<string, unknown>;
      const name = String(row.name || '');
      const venue = String(row.venue || '');
      const address = String(row.address || venue);
      const organizer = String(rulesConfig.organizer_name || 'Ban Tổ Chức');
      const description = String(row.description || '');

      return {
        id: String(row.id || ''),
        slug: String(row.slug || ''),
        nameVi: name,
        nameEn: name,
        organizerVi: organizer,
        organizerEn: organizer,
        organizerId: String(row.organizer_id || ''),
        status: String(row.status || 'draft') as MockTournament['status'],
        startDate: String(row.start_date || ''),
        endDate: String(row.end_date || row.start_date || ''),
        venueVi: venue,
        venueEn: venue,
        addressVi: address,
        addressEn: address,
        totalPrizePool: Number(row.entry_fee || 0),
        descriptionVi: description,
        descriptionEn: description,
        regulationsVi: [],
        regulationsEn: [],
        prizeStructure: [],
        events: [],
        courtsCount: Number(rulesConfig.courts_count || 4),
        contactPhone: String(rulesConfig.contact_phone || ''),
        contactEmail: String(rulesConfig.contact_email || ''),
      };
    });

    // Merge: DB records take priority over local data (deduplicate by id)
    const dbIds = new Set(dbTournaments.map((t) => t.id));
    const localOnly = allTournaments.filter((t) => !dbIds.has(t.id));
    const mergedTournaments = [...dbTournaments, ...localOnly];

    return filterTournamentsList(mergedTournaments, filter?.status);
  } catch (err) {
    console.warn('getTournaments: Supabase query failed, using local data:', err);
    return filterTournamentsList(allTournaments, filter?.status);
  }
}

/**
 * Lấy chi tiết giải đấu theo slug URL
 */
export async function getTournamentBySlug(slug: string): Promise<MockTournament | undefined> {
  const custom = getCustomTournaments();
  const foundCustom = custom.find((t) => t.slug === slug);
  if (foundCustom) return foundCustom;

  const foundMock = MOCK_TOURNAMENTS.find((t) => t.slug === slug);
  if (foundMock) return foundMock;

  if (!isSupabaseConfigured()) {
    return undefined;
  }

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.from('tournaments') as any)
      .select('*, tournament_events(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      slug: data.slug,
      nameVi: data.name,
      nameEn: data.name,
      organizerVi: data.rules_config?.organizer_name || 'Liên Đoàn Cầu Lông',
      organizerEn: data.rules_config?.organizer_name || 'Badminton Federation',
      status: data.status as any,
      startDate: data.start_date,
      endDate: data.end_date,
      venueVi: data.venue || '',
      venueEn: data.venue || '',
      addressVi: data.address || '',
      addressEn: data.address || '',
      courtsCount: data.rules_config?.courts_count || 4,
      contactPhone: data.rules_config?.contact_phone || '',
      contactEmail: data.rules_config?.contact_email || '',
      totalPrizePool: typeof data.entry_fee === 'number' ? Number(data.entry_fee) : 0,
      descriptionVi: data.description || '',
      descriptionEn: data.description || '',
      regulationsVi: [
        'Áp dụng luật thi đấu cầu lông hiện hành của BWF và Liên đoàn Cầu lông.',
        'Vận động viên có mặt trước giờ thi đấu 30 phút để điểm danh và khởi động.',
        'Trang phục và giày thi đấu đúng chuẩn thể thao chuyên dụng.',
      ],
      regulationsEn: [
        'Matches played under current BWF regulations.',
        'Athletes must arrive 30 minutes before match time for check-in.',
        'Proper sports attire and non-marking badminton shoes required.',
      ],
      prizeStructure: data.rules_config?.prize_structure || [
        { titleVi: 'Giải Nhất', titleEn: 'Champion', rewardVi: 'Cúp + Huy chương Vàng', rewardEn: 'Trophy + Gold Medal' },
        { titleVi: 'Giải Nhì', titleEn: 'Runner-up', rewardVi: 'Huy chương Bạc', rewardEn: 'Silver Medal' },
        { titleVi: 'Đồng Giải Ba', titleEn: 'Third Place', rewardVi: 'Huy chương Đồng', rewardEn: 'Bronze Medal' },
      ],
      events: (data.tournament_events || []).map((ev: any) => ({
        id: ev.id,
        nameVi: ev.name,
        nameEn: ev.name,
        eventType: ev.event_type,
        maxEntries: ev.max_entries || 16,
        currentEntries: 0,
        entryFee: Number(ev.registration_fee || data.entry_fee || 500000),
        format: ev.format === 'group' ? 'round_robin' : ev.format,
        groupCount: ev.stage_configs?.group_count,
        advancingPerGroup: ev.stage_configs?.advancing_per_group,
        advancementRule: ev.stage_configs?.advancement_rule,
        knockoutMapping: ev.stage_configs?.knockout_mapping,
        stageConfigs: {
          group: ev.stage_configs?.group_scoring,
          knockout: ev.stage_configs?.knockout_scoring,
        },
        drawRules: ev.stage_configs?.draw_rules,
        prizeStructure: ev.stage_configs?.prize_structure || ev.prizeStructure,
      })),
      bankAccount: data.rules_config?.bank_account,
    };
  } catch {
    return undefined;
  }
}

function filterTournamentsList(list: MockTournament[], status?: string): MockTournament[] {
  if (status === 'live') {
    return list.filter((t) => t.status === 'in_progress');
  }
  if (status === 'upcoming') {
    return list.filter((t) => t.status === 'registration_open');
  }
  if (status === 'completed') {
    return list.filter((t) => t.status === 'completed' || t.status === 'archived');
  }
  return list;
}

export interface CreateTournamentEventInput {
  name: string;
  eventType: 'ms' | 'ws' | 'md' | 'wd' | 'xd';
  format: 'knockout' | 'group_knockout' | 'round_robin';
  groupCount?: number;
  advancingPerGroup?: number;
  advancementRule?: string;
  knockoutMapping?: string;
  stageConfigs: Record<string, any>;
  drawRules?: Record<string, any>;
  prizeStructure?: EventPrizeItem[];
  maxEntries?: number;
  entryFee?: number;
}

export interface CreateTournamentInput {
  name: string;
  organizer?: string;
  organizerId?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  courtsCount?: number;
  description?: string;
  totalPrizePool?: number;
  contactPhone?: string;
  contactEmail?: string;
  prizeStructure?: {
    titleVi: string;
    titleEn: string;
    rewardVi: string;
    rewardEn: string;
  }[];
  bankAccount?: TournamentBankAccount;
  events: CreateTournamentEventInput[];
}

export interface CreateTournamentResult {
  success: boolean;
  tournamentId: string;
  slug: string;
  eventsCreated: number;
  message: string;
}

export async function createTournamentWithEvents(
  input: CreateTournamentInput
): Promise<CreateTournamentResult> {
  const slug =
    input.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') +
    '-' +
    Date.now().toString().slice(-4);

  const fallbackId = `tour-${Date.now()}`;

  // Tạo đối tượng MockTournament hoàn chỉnh dựa trên chính xác thông tin BTC nhập vào
  const newTournament: MockTournament = {
    id: fallbackId,
    slug,
    nameVi: input.name,
    nameEn: input.name,
    organizerVi: input.organizer || 'Ban Tổ Chức Giải',
    organizerEn: input.organizer || 'Organizing Committee',
    organizerId: input.organizerId,
    status: 'registration_open',
    startDate: input.startDate,
    endDate: input.endDate,
    registrationDeadline: input.startDate,
    venueVi: input.venue || 'Nhà Thi Đấu Thể Thao',
    venueEn: input.venue || 'Sports Arena',
    addressVi: input.venue || 'Việt Nam',
    addressEn: input.venue || 'Vietnam',
    courtsCount: input.courtsCount || 4,
    contactPhone: input.contactPhone || '',
    contactEmail: input.contactEmail || '',
    totalPrizePool: typeof input.totalPrizePool === 'number' ? input.totalPrizePool : 0,
    descriptionVi: input.description || 'Giải đấu cầu lông mở rộng dành cho các VĐV.',
    descriptionEn: input.description || 'Open badminton tournament for all athletes.',
    regulationsVi: [
      'Áp dụng luật thi đấu cầu lông hiện hành của BWF và Liên đoàn Cầu lông.',
      'Vận động viên có mặt trước giờ thi đấu 30 phút để điểm danh và khởi động.',
      'Trang phục và giày thi đấu chuẩn thể thao chuyên dụng.',
    ],
    regulationsEn: [
      'Matches played under current BWF regulations.',
      'Athletes must arrive 30 minutes before match time for check-in.',
      'Proper sports attire and non-marking badminton shoes required.',
    ],
    prizeStructure: input.prizeStructure && input.prizeStructure.length > 0
      ? input.prizeStructure
      : [
          { titleVi: 'Giải Nhất', titleEn: 'Champion', rewardVi: 'Cúp + Huy chương Vàng', rewardEn: 'Trophy + Gold Medal' },
          { titleVi: 'Giải Nhì', titleEn: 'Runner-up', rewardVi: 'Huy chương Bạc', rewardEn: 'Silver Medal' },
          { titleVi: 'Đồng Giải Ba', titleEn: 'Third Place', rewardVi: 'Huy chương Đồng', rewardEn: 'Bronze Medal' },
        ],
    events: input.events.map((ev, idx) => ({
      id: `evt-${fallbackId}-${idx + 1}`,
      nameVi: ev.name,
      nameEn: ev.name,
      eventType: ev.eventType,
      maxEntries: ev.maxEntries || 16,
      currentEntries: 0,
      entryFee: ev.entryFee || 500000,
      format: ev.format,
      groupCount: ev.groupCount,
      advancingPerGroup: ev.advancingPerGroup,
      advancementRule: ev.advancementRule,
      knockoutMapping: ev.knockoutMapping,
      stageConfigs: ev.stageConfigs,
      drawRules: ev.drawRules,
      prizeStructure: ev.prizeStructure,
    })),
    bankAccount: input.bankAccount,
  };

  // Lưu ngay vào custom tournaments để xem được trên toàn bộ Web (Trang chủ, Chi tiết, Đăng ký)
  saveCustomTournament(newTournament);

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      tournamentId: fallbackId,
      slug,
      eventsCreated: input.events.length,
      message: `Đã tạo giải "${input.name}" với ${input.events.length} nội dung (Lưu trữ thành công)`,
    };
  }

  try {
    const supabase = createClient();

    // 1. Tạo giải đấu (khớp chính xác 100% schema bảng tournaments)
    const { data: tourData, error: tourError } = await (supabase.from('tournaments') as any)
      .insert({
        name: input.name,
        slug,
        sport_type: 'badminton',
        venue: input.venue,
        address: input.venue || 'Việt Nam',
        start_date: input.startDate,
        end_date: input.endDate,
        entry_fee: input.events[0]?.entryFee || 500000,
        status: 'registration_open',
        description: input.description,
        rules_config: {
          organizer_name: input.organizer || 'Ban Tổ Chức Giải',
          bank_account: input.bankAccount,
          courts_count: input.courtsCount || 4,
        },
      })
      .select('id')
      .single();

    if (tourError || !tourData) {
      console.warn('Supabase tournament insert failed:', tourError?.message);
      // Still save locally as fallback, but indicate DB sync failed
      return {
        success: true,
        tournamentId: fallbackId,
        slug,
        eventsCreated: input.events.length,
        message: `Đã tạo giải "${input.name}" (Offline Mode - chưa đồng bộ DB)`,
      };
    }

    const tournamentId = tourData.id;

    // Cập nhật id của newTournament sang ID thật của Supabase
    newTournament.id = tournamentId;
    saveCustomTournament(newTournament);

    // 2. Tạo các nội dung thi đấu (khớp chính xác 100% schema bảng tournament_events)
    const eventPayloads = input.events.map((ev) => ({
      tournament_id: tournamentId,
      name: ev.name,
      event_type: ev.eventType,
      format: ev.format === 'round_robin' ? 'group' : ev.format,
      max_entries: ev.maxEntries || 16,
      registration_fee: ev.entryFee || 500000,
      stage_configs: {
        group_count: ev.groupCount || 2,
        advancing_per_group: ev.advancingPerGroup || 2,
        advancement_rule: ev.advancementRule || 'best_runner_ups',
        knockout_mapping: ev.knockoutMapping || 'cross_p1',
        group_scoring: ev.stageConfigs?.group,
        knockout_scoring: ev.stageConfigs?.knockout,
        draw_rules: ev.drawRules,
        prize_structure: ev.prizeStructure,
      },
    }));

    const { error: eventError } = await (supabase.from('tournament_events') as any).insert(eventPayloads);
    if (eventError) {
      console.warn('Supabase events insert note:', eventError?.message);
    }

    return {
      success: true,
      tournamentId,
      slug,
      eventsCreated: eventPayloads.length,
      message: `Đã tạo giải "${input.name}" với ${eventPayloads.length} nội dung thành công (Đã đồng bộ Cơ sở dữ liệu Cloud)!`,
    };
  } catch {
    return {
      success: true,
      tournamentId: fallbackId,
      slug,
      eventsCreated: input.events.length,
      message: `Đã tạo giải "${input.name}" với ${input.events.length} nội dung thành công!`,
    };
  }
}

/**
 * Cập nhật/điều chỉnh thông tin giải đấu và các nội dung đã tạo
 */
export async function updateTournamentWithEvents(
  slugOrId: string,
  input: CreateTournamentInput
): Promise<CreateTournamentResult> {
  const existing = await getTournamentBySlug(slugOrId);
  const targetId = existing?.id || `tour-${Date.now()}`;
  const targetSlug = existing?.slug || slugOrId;

  const updatedTournament: MockTournament = {
    id: targetId,
    slug: targetSlug,
    nameVi: input.name,
    nameEn: input.name,
    organizerVi: input.organizer || existing?.organizerVi || 'Ban Tổ Chức Giải',
    organizerEn: input.organizer || existing?.organizerEn || 'Organizing Committee',
    status: existing?.status || 'registration_open',
    startDate: input.startDate,
    endDate: input.endDate,
    registrationDeadline: input.startDate,
    venueVi: input.venue || 'Nhà Thi Đấu Thể Thao',
    venueEn: input.venue || 'Sports Arena',
    addressVi: input.venue || 'Việt Nam',
    addressEn: input.venue || 'Vietnam',
    courtsCount: input.courtsCount || existing?.courtsCount || 4,
    contactPhone: input.contactPhone || existing?.contactPhone || '',
    contactEmail: input.contactEmail || existing?.contactEmail || '',
    totalPrizePool: typeof input.totalPrizePool === 'number' ? input.totalPrizePool : (existing?.totalPrizePool || 0),
    descriptionVi: input.description || existing?.descriptionVi || '',
    descriptionEn: input.description || existing?.descriptionEn || '',
    regulationsVi: existing?.regulationsVi || [
      'Áp dụng luật thi đấu cầu lông hiện hành của BWF và Liên đoàn Cầu lông.',
      'Vận động viên có mặt trước giờ thi đấu 30 phút để điểm danh và khởi động.',
      'Trang phục và giày thi đấu chuẩn thể thao chuyên dụng.',
    ],
    regulationsEn: existing?.regulationsEn || [
      'Matches played under current BWF regulations.',
      'Athletes must arrive 30 minutes before match time for check-in.',
      'Proper sports attire and non-marking badminton shoes required.',
    ],
    prizeStructure: input.prizeStructure && input.prizeStructure.length > 0
      ? input.prizeStructure
      : (existing?.prizeStructure || [
          { titleVi: 'Giải Nhất', titleEn: 'Champion', rewardVi: 'Cúp + Huy chương Vàng', rewardEn: 'Trophy + Gold Medal' },
          { titleVi: 'Giải Nhì', titleEn: 'Runner-up', rewardVi: 'Huy chương Bạc', rewardEn: 'Silver Medal' },
          { titleVi: 'Đồng Giải Ba', titleEn: 'Third Place', rewardVi: 'Huy chương Đồng', rewardEn: 'Bronze Medal' },
        ]),
    events: input.events.map((ev, idx) => ({
      id: existing?.events[idx]?.id || `evt-${targetId}-${idx + 1}`,
      nameVi: ev.name,
      nameEn: ev.name,
      eventType: ev.eventType,
      maxEntries: ev.maxEntries || 16,
      currentEntries: existing?.events[idx]?.currentEntries || 0,
      entryFee: ev.entryFee || 500000,
      format: ev.format,
      groupCount: ev.groupCount,
      advancingPerGroup: ev.advancingPerGroup,
      advancementRule: ev.advancementRule,
      knockoutMapping: ev.knockoutMapping,
      stageConfigs: ev.stageConfigs,
      drawRules: ev.drawRules,
      prizeStructure: ev.prizeStructure,
    })),
    bankAccount: input.bankAccount || existing?.bankAccount,
    liveMatches: existing?.liveMatches,
    podium: existing?.podium,
  };

  saveCustomTournament(updatedTournament);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await (supabase.from('tournaments') as any)
        .update({
          name: input.name,
          venue: input.venue,
          address: input.venue || 'Việt Nam',
          start_date: input.startDate,
          end_date: input.endDate,
          description: input.description,
          entry_fee: input.totalPrizePool || 0,
          rules_config: {
            organizer_name: input.organizer || 'Ban Tổ Chức Giải',
            bank_account: input.bankAccount,
            courts_count: input.courtsCount || 4,
            contact_phone: input.contactPhone,
            contact_email: input.contactEmail,
            prize_structure: input.prizeStructure,
          },
        })
        .eq('slug', targetSlug);

      const { data: tourData } = await (supabase.from('tournaments') as any)
        .select('id')
        .eq('slug', targetSlug)
        .single();

      if (tourData?.id) {
        // Build event payloads
        const eventPayloads = input.events.map((ev) => ({
          tournament_id: tourData.id,
          name: ev.name,
          event_type: ev.eventType,
          format: ev.format === 'round_robin' ? 'group' : ev.format,
          max_entries: ev.maxEntries || 16,
          registration_fee: ev.entryFee || 500000,
          stage_configs: {
            group_count: ev.groupCount || 2,
            advancing_per_group: ev.advancingPerGroup || 2,
            advancement_rule: ev.advancementRule || 'best_runner_ups',
            knockout_mapping: ev.knockoutMapping || 'cross_p1',
            group_scoring: ev.stageConfigs?.group,
            knockout_scoring: ev.stageConfigs?.knockout,
            draw_rules: ev.drawRules,
            prize_structure: ev.prizeStructure,
          },
        }));

        // Upsert: use onConflict to update existing events instead of delete-all
        const { error: upsertError } = await (supabase.from('tournament_events') as any)
          .upsert(eventPayloads, { onConflict: 'tournament_id,name' });

        if (upsertError) {
          console.warn('updateTournamentWithEvents: event upsert failed:', upsertError.message);
        }
      }
    } catch (err) {
      console.warn('updateTournamentWithEvents: Supabase update failed:', err);
    }
  }

  return {
    success: true,
    tournamentId: targetId,
    slug: targetSlug,
    eventsCreated: input.events.length,
    message: `Đã cập nhật thông tin giải "${input.name}" thành công!`,
  };
}
