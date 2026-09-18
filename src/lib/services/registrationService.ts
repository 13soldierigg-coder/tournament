import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from './tournamentService';

export interface HoldSlotParams {
  tournamentId: string;
  tournamentSlug?: string;
  eventId: string;
  eventName?: string;
  athleteId: string;
  athleteName?: string;
  athletePhone?: string;
  athleteEmail?: string;
  partnerId?: string | null;
  partnerName?: string | null;
  partnerPhone?: string | null;
  partnerClub?: string | null;
  partnerEmail?: string | null;
  teamName?: string;
  club?: string | null;
  paymentAmount?: number;
  registrationMode?: 'direct_both' | 'invite_partner' | 'singles';
  reconciliationCode?: string;
  proofImageUrl?: string;
}

export interface HoldSlotResult {
  success: boolean;
  registrationId?: string;
  expiresAt?: string;
  remainingSlots?: number;
  code?: string;
  reconciliationCode?: string;
  message: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  tournamentSlug?: string;
  eventId: string;
  eventName?: string;
  athleteName: string;
  athletePhone?: string;
  athleteEmail?: string;
  athleteClub?: string;
  partnerName?: string | null;
  partnerPhone?: string | null;
  partnerClub?: string | null;
  partnerEmail?: string | null;
  teamName: string;
  club: string;
  seed?: number;
  status: 'confirmed' | 'pending_payment' | 'rejected';
  reconciliationCode: string;
  paymentAmount: number;
  registeredAt: string;
  registrationMode?: 'direct_both' | 'invite_partner' | 'singles';
  proofImageUrl?: string;
}

const REGISTRATIONS_STORAGE_KEY = 'badminton_tournament_registrations';
let inMemoryRegistrations: TournamentRegistration[] = [];

/**
 * Danh sách VĐV mẫu thực chiến cho các giải
 */
const DEFAULT_PRESEEDED_ATHLETES: TournamentRegistration[] = [
  {
    id: 'reg-demo-1',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Nguyễn Văn A',
    partnerName: 'Lê Hùng',
    teamName: 'Nguyễn Văn A / Lê Hùng',
    club: 'CLB Ba Đình',
    seed: 1,
    status: 'confirmed',
    reconciliationCode: 'DK SP26 1101 A1B2',
    paymentAmount: 500000,
    registeredAt: '2026-03-01 08:30',
  },
  {
    id: 'reg-demo-2',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Trần Thị B',
    partnerName: 'Mai Lan',
    teamName: 'Trần Thị B / Mai Lan',
    club: 'CLB Cầu Giấy',
    seed: 2,
    status: 'confirmed',
    reconciliationCode: 'DK SP26 2202 C3D4',
    paymentAmount: 500000,
    registeredAt: '2026-03-01 09:15',
  },
  {
    id: 'reg-demo-3',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Phạm Đức C',
    partnerName: 'Vũ Tuấn',
    teamName: 'Phạm Đức C / Vũ Tuấn',
    club: 'CLB Hoàn Kiếm',
    seed: 3,
    status: 'confirmed',
    reconciliationCode: 'DK SP26 3303 E5F6',
    paymentAmount: 500000,
    registeredAt: '2026-03-01 10:00',
  },
  {
    id: 'reg-demo-4',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Hoàng Minh D',
    partnerName: 'Đỗ Hải',
    teamName: 'Hoàng Minh D / Đỗ Hải',
    club: 'CLB Ba Đình',
    seed: 4,
    status: 'confirmed',
    reconciliationCode: 'DK SP26 4404 G7H8',
    paymentAmount: 500000,
    registeredAt: '2026-03-01 11:20',
  },
  {
    id: 'reg-demo-5',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Vũ Quốc E',
    partnerName: 'Đinh Tùng',
    teamName: 'Vũ Quốc E / Đinh Tùng',
    club: 'CLB Thăng Long',
    status: 'confirmed',
    reconciliationCode: 'DK SP26 5505 I9J0',
    paymentAmount: 500000,
    registeredAt: '2026-03-02 14:10',
  },
  {
    id: 'reg-demo-6',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Đặng Tuấn F',
    partnerName: 'Bùi Long',
    teamName: 'Đặng Tuấn F / Bùi Long',
    club: 'CLB Cầu Giấy',
    status: 'confirmed',
    reconciliationCode: 'DK SP26 6606 K1L2',
    paymentAmount: 500000,
    registeredAt: '2026-03-02 15:45',
  },
  {
    id: 'reg-demo-7',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Lê Thanh G',
    partnerName: 'Phan Lâm',
    teamName: 'Lê Thanh G / Phan Lâm',
    club: 'CLB Đống Đa',
    status: 'confirmed',
    reconciliationCode: 'DK SP26 7707 M3N4',
    paymentAmount: 500000,
    registeredAt: '2026-03-03 08:50',
  },
  {
    id: 'reg-demo-8',
    tournamentId: 't-1',
    tournamentSlug: 'spring-championship-2026',
    eventId: 'e-1',
    eventName: 'Đôi Nam Phong Trào Hạng B',
    athleteName: 'Ngô Việt H',
    partnerName: 'Trịnh Phong',
    teamName: 'Ngô Việt H / Trịnh Phong',
    club: 'CLB Ba Đình',
    status: 'pending_payment',
    reconciliationCode: 'DK SP26 8808 O5P6',
    paymentAmount: 500000,
    registeredAt: '2026-03-03 16:30',
  },
];

/**
 * Đọc tất cả đăng ký từ LocalStorage hoặc in-memory
 */
export function getStoredRegistrations(): TournamentRegistration[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return inMemoryRegistrations;
}

/**
 * Lưu danh sách đăng ký vào Storage
 */
export function setStoredRegistrations(list: TournamentRegistration[]): void {
  inMemoryRegistrations = list;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

/**
 * Lấy danh sách VĐV đã đăng ký của một giải đấu (và nội dung)
 */
export async function getTournamentRegistrations(
  tournamentIdOrSlug: string,
  eventId?: string
): Promise<TournamentRegistration[]> {
  const allStored = getStoredRegistrations();

  // Tìm các bản ghi khớp với giải đấu
  const matching = allStored.filter(
    (r) =>
      (r.tournamentId === tournamentIdOrSlug || r.tournamentSlug === tournamentIdOrSlug) &&
      (!eventId || r.eventId === eventId)
  );

  if (matching.length > 0) {
    return matching;
  }

  // Nếu là giải đấu mẫu hoặc chưa có ai đăng ký, trả về dữ liệu mẫu thực tế
  const defaultMatching = DEFAULT_PRESEEDED_ATHLETES.filter(
    (r) =>
      (r.tournamentId === tournamentIdOrSlug ||
        r.tournamentSlug === tournamentIdOrSlug ||
        tournamentIdOrSlug.includes('spring') ||
        tournamentIdOrSlug.includes('hanoi') ||
        tournamentIdOrSlug.includes('championship')) &&
      (!eventId || r.eventId === eventId || r.eventId === 'e-1')
  );

  if (defaultMatching.length > 0) {
    return defaultMatching;
  }

  return matching;
}

/**
 * Lưu hoặc cập nhật một bản ghi đăng ký VĐV
 */
export async function saveTournamentRegistration(reg: TournamentRegistration): Promise<void> {
  const allStored = getStoredRegistrations();
  const existingIdx = allStored.findIndex((r) => r.id === reg.id || r.reconciliationCode === reg.reconciliationCode);

  let updated: TournamentRegistration[];
  if (existingIdx >= 0) {
    updated = [...allStored];
    updated[existingIdx] = { ...updated[existingIdx], ...reg };
  } else {
    updated = [reg, ...allStored];
  }

  setStoredRegistrations(updated);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await (supabase.from('registrations') as any).upsert({
        id: reg.id,
        tournament_id: reg.tournamentId,
        event_id: reg.eventId,
        team_name: reg.teamName,
        club: reg.club,
        status: reg.status,
        payment_amount: reg.paymentAmount,
        reconciliation_code: reg.reconciliationCode,
        proof_image_url: reg.proofImageUrl,
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Thêm nhanh một VĐV/Cặp đấu thủ công từ ban tổ chức
 */
export async function addManualAthlete(params: {
  tournamentId: string;
  tournamentSlug?: string;
  eventId: string;
  eventName?: string;
  athleteName: string;
  partnerName?: string;
  club?: string;
  seed?: number;
}): Promise<TournamentRegistration> {
  const teamName = params.partnerName
    ? `${params.athleteName} / ${params.partnerName}`
    : params.athleteName;

  const newReg: TournamentRegistration = {
    id: `reg-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tournamentId: params.tournamentId,
    tournamentSlug: params.tournamentSlug,
    eventId: params.eventId,
    eventName: params.eventName,
    athleteName: params.athleteName,
    partnerName: params.partnerName || null,
    teamName,
    club: params.club || 'Tự do',
    seed: params.seed,
    status: 'confirmed',
    reconciliationCode: `MANUAL-${Date.now().toString().slice(-4)}`,
    paymentAmount: 0,
    registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };

  await saveTournamentRegistration(newReg);
  return newReg;
}

/**
 * Cập nhật hạt giống của một bản ghi đăng ký
 */
export async function updateRegistrationSeed(
  registrationId: string,
  seed: number | undefined
): Promise<void> {
  const all = getStoredRegistrations();
  const updated = all.map((r) => (r.id === registrationId ? { ...r, seed } : r));
  setStoredRegistrations(updated);
}

/**
 * Nạp nhanh danh sách VĐV thử nghiệm cho một giải đấu bất kỳ để test bốc thăm
 */
export async function seedDemoAthletesForTournament(
  tournamentSlug: string,
  tournamentId: string = tournamentSlug,
  eventId: string = 'e-1',
  eventName: string = 'Nội Dung Mặc Định'
): Promise<TournamentRegistration[]> {
  const seeded = DEFAULT_PRESEEDED_ATHLETES.map((a, idx) => ({
    ...a,
    id: `reg-demo-${tournamentSlug}-${idx + 1}`,
    tournamentId,
    tournamentSlug,
    eventId,
    eventName,
    reconciliationCode: generateReconciliationCode(tournamentSlug, `090${idx}12345`),
  }));

  const all = getStoredRegistrations();
  const cleaned = all.filter((r) => r.tournamentSlug !== tournamentSlug && r.tournamentId !== tournamentId);
  const updated = [...seeded, ...cleaned];
  setStoredRegistrations(updated);
  return seeded;
}

/**
 * Sinh mã đối soát chuyển khoản độc nhất (Ví dụ: DK HN26 5678 B82F)
 */
export function generateReconciliationCode(tournamentSlug: string = 'TOURNAMENT', phone: string = ''): string {
  const cleanSlug = tournamentSlug.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const tCode = cleanSlug.slice(0, 4) || 'TOUR';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const pSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DK ${tCode} ${pSuffix} ${rand}`;
}

/**
 * Tạo URL mã VietQR theo chuẩn Napas247
 */
export function buildVietQRUrl(params: {
  bankId: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  reconciliationCode: string;
}): string {
  const { bankId, accountNumber, accountHolder, amount, reconciliationCode } = params;
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    reconciliationCode
  )}&accountName=${encodeURIComponent(accountHolder)}`;
}

/**
 * Gọi RPC hold_registration_slot để khóa Quota chống race-condition trong 15 phút
 */
export async function holdRegistrationSlot(params: HoldSlotParams): Promise<HoldSlotResult> {
  const recCode =
    params.reconciliationCode ||
    generateReconciliationCode(params.tournamentSlug || params.tournamentId, params.athletePhone);

  const teamName =
    params.teamName ||
    (params.partnerName ? `${params.athleteName} / ${params.partnerName}` : params.athleteName || 'VĐV');

  // Lưu đăng ký vào storage ngay
  const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const regRecord: TournamentRegistration = {
    id: regId,
    tournamentId: params.tournamentId,
    tournamentSlug: params.tournamentSlug,
    eventId: params.eventId,
    eventName: params.eventName,
    athleteName: params.athleteName || 'VĐV',
    athletePhone: params.athletePhone,
    athleteEmail: params.athleteEmail,
    partnerName: params.partnerName || null,
    partnerPhone: params.partnerPhone || null,
    partnerClub: params.partnerClub || null,
    partnerEmail: params.partnerEmail || null,
    teamName,
    club: params.club || 'Tự do',
    status: params.proofImageUrl ? 'confirmed' : 'pending_payment',
    reconciliationCode: recCode,
    paymentAmount: params.paymentAmount || 500000,
    registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    registrationMode: params.registrationMode,
    proofImageUrl: params.proofImageUrl,
  };

  saveTournamentRegistration(regRecord);

  if (!isSupabaseConfigured()) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return {
      success: true,
      registrationId: regId,
      reconciliationCode: recCode,
      expiresAt,
      remainingSlots: 3,
      message: 'Đã lưu thông tin đăng ký và giữ chỗ thành công trong 15 phút',
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('hold_registration_slot', {
      p_tournament_id: params.tournamentId,
      p_event_id: params.eventId,
      p_athlete_id: params.athleteId,
      p_partner_id: params.partnerId,
      p_partner_name: params.partnerName,
      p_team_name: teamName,
      p_club: params.club,
      p_payment_amount: params.paymentAmount,
    });

    if (error) {
      return {
        success: false,
        code: error.code || 'RPC_ERROR',
        message: error.message || 'Lỗi khi gọi RPC giữ chỗ',
      };
    }

    return {
      success: data.success,
      registrationId: data.registration_id || regId,
      expiresAt: data.expires_at,
      remainingSlots: data.remaining_slots,
      code: data.code,
      message: data.message,
    };
  } catch (err: any) {
    return {
      success: true,
      registrationId: regId,
      reconciliationCode: recCode,
      message: 'Đã lưu thông tin đăng ký cục bộ thành công',
    };
  }
}

/**
 * Sinh mã mời bạn đánh đôi (Partner Invite Token)
 */
export function generatePartnerInviteToken(registrationId: string): {
  inviteCode: string;
  inviteLink: string;
  expiresAt: string;
} {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return {
    inviteCode,
    inviteLink: `/register/partner-accept?code=${inviteCode}&reg=${registrationId}`,
    expiresAt,
  };
}
