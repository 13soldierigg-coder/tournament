import { UserProfile, UserRole, AuthSession, RegisterOrganizerData } from '@/types/auth';
import { isSupabaseConfigured } from './tournamentService';
import { createClient } from '@/lib/supabase/client';

const AUTH_STORAGE_KEY = 'badminton_auth_session';

export const DEMO_ACCOUNTS: UserProfile[] = [
  {
    id: 'user-org-001',
    email: 'btc@badminton.vn',
    fullName: 'Nguyễn Văn Hùng',
    role: 'organizer',
    clubName: 'CLB Cầu Lông Đống Đa - Hà Nội',
    phoneNumber: '0912345678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-ref-001',
    email: 'referee@bwf.org',
    fullName: 'Trần Đình Toàn',
    role: 'referee',
    clubName: 'Tổ Trọng Tài Quốc Gia',
    assignedCourts: [1, 2, 3, 4],
    phoneNumber: '0987654321',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-adm-001',
    email: 'admin@badminton.vn',
    fullName: 'Ban Quản Trị Hệ Thống',
    role: 'admin',
    clubName: 'Badminton Platform Operations',
    phoneNumber: '0900000000',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

let inMemorySession: AuthSession | null = null;
const authListeners: Array<(session: AuthSession | null) => void> = [];

function notifyListeners(session: AuthSession | null) {
  authListeners.forEach((listener) => {
    try {
      listener(session);
    } catch (err) {
      console.error('Auth listener error:', err);
    }
  });
}

/**
 * Lấy session hiện tại từ memory hoặc localStorage
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AuthSession;
        if (session.expiresAt > Date.now()) {
          inMemorySession = session;
          return session;
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          inMemorySession = null;
        }
      }
    } catch {
      // ignore parsing errors
    }
  }
  return inMemorySession;
}

/**
 * Lấy User Profile đang đăng nhập
 */
export function getCurrentUser(): UserProfile | null {
  const session = getCurrentSession();
  return session ? session.user : null;
}

/**
 * Lưu phiên đăng nhập
 */
function setSession(user: UserProfile, customToken?: string): AuthSession {
  const session: AuthSession = {
    user,
    token: customToken || `token_${user.id}_${Date.now()}`,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  inMemorySession = session;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      // Ghi cookie cơ bản để SSR / Middleware nhận diện
      document.cookie = `auth_role=${user.role}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
    } catch {
      // ignore
    }
  }

  notifyListeners(session);
  return session;
}

/**
 * Đăng nhập nhanh bằng vai trò mẫu (Dành riêng cho Môi trường Test / Dev)
 */
export function signInWithQuickRole(role: UserRole): AuthSession {
  const account = DEMO_ACCOUNTS.find((acc) => acc.role === role) || DEMO_ACCOUNTS[0];
  return setSession(account);
}

/**
 * Đăng nhập bằng Email và Mật khẩu (Supabase Auth kết hợp Fallback)
 */
export async function signInWithEmail(
  email: string,
  password?: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const normalized = email.trim().toLowerCase();

  // 1. Nếu cấu hình Supabase hợp lệ, xác thực thực sự với Supabase Auth
  if (isSupabaseConfigured() && password) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });

      if (!error && data?.user) {
        const meta = data.user.user_metadata || {};
        const role: UserRole =
          meta.role || (data.user.app_metadata?.role as UserRole) || 'athlete';

        let fullName = meta.full_name || meta.name || normalized.split('@')[0];
        let clubName = meta.club_name || '';
        let phoneNumber = meta.phone || data.user.phone || '';
        let avatarUrl = meta.avatar_url;

        // Truy vấn bảng tương ứng để lấy thông tin hồ sơ chi tiết
        if (role === 'organizer') {
          const { data: orgData } = await (supabase.from('organizers') as any)
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();
          if (orgData) {
            fullName = orgData.name || fullName;
            clubName = orgData.description || clubName;
            phoneNumber = orgData.contact_phone || phoneNumber;
            avatarUrl = orgData.logo_url || avatarUrl;
          }
        } else if (role === 'athlete') {
          const { data: athData } = await (supabase.from('athletes') as any)
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();
          if (athData) {
            fullName = athData.full_name || fullName;
            clubName = athData.club || clubName;
            phoneNumber = athData.phone || phoneNumber;
            avatarUrl = athData.avatar_url || avatarUrl;
          }
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || normalized,
          fullName,
          role,
          clubName,
          phoneNumber,
          avatarUrl,
          createdAt: data.user.created_at,
        };

        const session = setSession(userProfile, data.session?.access_token);
        return { success: true, session };
      }
    } catch (err) {
      console.warn('Supabase signInWithPassword note:', err);
    }
  }

  // 2. Kiểm tra trong danh sách demo accounts (cho Dev/Test)
  const matched = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalized);
  if (matched) {
    const session = setSession(matched);
    return { success: true, session };
  }

  // 3. Kiểm tra tài khoản tự đăng ký lưu trong localStorage (Offline Fallback)
  if (typeof window !== 'undefined') {
    try {
      const registeredUsersStr = localStorage.getItem('badminton_registered_users');
      if (registeredUsersStr) {
        const users = JSON.parse(registeredUsersStr) as UserProfile[];
        const user = users.find((u) => u.email.toLowerCase() === normalized);
        if (user) {
          const session = setSession(user);
          return { success: true, session };
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Nếu là môi trường thử nghiệm và nhập email hợp lệ có đuôi @, cấp quyền tạm thời
  if (process.env.NODE_ENV !== 'production' && normalized.includes('@') && !password) {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: normalized,
      fullName: normalized.split('@')[0],
      role: 'organizer',
      clubName: 'Câu Lạc Bộ Cầu Lông',
      createdAt: new Date().toISOString(),
    };
    const session = setSession(newUser);
    return { success: true, session };
  }

  return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
}

/**
 * Đăng ký tài khoản Ban Tổ Chức mới (Supabase Auth kết hợp Fallback)
 */
export async function signUpOrganizer(
  data: RegisterOrganizerData
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  if (!data.email || !data.email.includes('@')) {
    return { success: false, error: 'Vui lòng cung cấp email hợp lệ' };
  }
  if (!data.fullName.trim()) {
    return { success: false, error: 'Vui lòng nhập họ và tên người đại diện' };
  }

  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedName = data.fullName.trim();
  const normalizedClub = data.clubName?.trim() || 'CLB Cầu Lông Phong Trào';
  const normalizedPhone = data.phoneNumber?.trim() || '';

  // 1. Nếu có Supabase, tạo tài khoản thật
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password || 'BwfOrganizer2026!@#',
        options: {
          data: {
            role: 'organizer',
            full_name: normalizedName,
            club_name: normalizedClub,
            phone: normalizedPhone,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (authData?.user) {
        const userProfile: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || normalizedEmail,
          fullName: normalizedName,
          role: 'organizer',
          clubName: normalizedClub,
          phoneNumber: normalizedPhone,
          createdAt: authData.user.created_at,
        };
        const session = setSession(userProfile, authData.session?.access_token);
        return { success: true, session };
      }
    } catch (err: any) {
      console.warn('Supabase signUpOrganizer failed, using local fallback:', err);
    }
  }

  // 2. Offline Fallback
  const newUser: UserProfile = {
    id: `user_org_${Date.now()}`,
    email: normalizedEmail,
    fullName: normalizedName,
    role: 'organizer',
    clubName: normalizedClub,
    phoneNumber: normalizedPhone,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem('badminton_registered_users');
      const users: UserProfile[] = existing ? JSON.parse(existing) : [];
      users.push(newUser);
      localStorage.setItem('badminton_registered_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  }

  const session = setSession(newUser);
  return { success: true, session };
}

/**
 * Đăng nhập cho Trọng tài qua Mã PIN sân (RPC kết hợp Fallback an toàn)
 */
export async function signInWithCourtPinAsync(
  courtNumber: number,
  pin: string,
  tournamentId?: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const trimmedPin = pin.trim();

  // 1. Kiểm tra qua Supabase RPC verify_court_pin
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase.rpc as any)('verify_court_pin', {
        p_court_number: courtNumber,
        p_pin: trimmedPin,
        p_tournament_id: tournamentId || null,
      });

      if (!error && data?.success) {
        const refereeUser: UserProfile = {
          id: `referee_court_${courtNumber}`,
          email: `court${courtNumber}@referee.badminton.vn`,
          fullName: data.refereeName || `Trọng Tài Sân ${courtNumber}`,
          role: 'referee',
          clubName: data.tournamentName || 'Ban Trọng Tài Điều Hành',
          assignedCourts: [courtNumber],
          createdAt: new Date().toISOString(),
        };
        const session = setSession(refereeUser);
        return { success: true, session };
      }
    } catch (err) {
      console.warn('Supabase verify_court_pin note:', err);
    }
  }

  // 2. Mã PIN mặc định cho sân đấu mẫu (1234 hoặc 8888)
  if (trimmedPin === '1234' || trimmedPin === '8888') {
    const refereeUser: UserProfile = {
      id: `referee_court_${courtNumber}`,
      email: `court${courtNumber}@referee.badminton.vn`,
      fullName: `Trọng Tài Sân ${courtNumber}`,
      role: 'referee',
      clubName: 'Ban Trọng Tài Điều Hành',
      assignedCourts: [courtNumber],
      createdAt: new Date().toISOString(),
    };
    const session = setSession(refereeUser);
    return { success: true, session };
  }

  return { success: false, error: 'Mã PIN sân không đúng (Gợi ý mã mặc định: 1234)' };
}

/**
 * Đăng nhập đồng bộ cho Trọng tài qua Mã PIN sân (cho UI đồng bộ và test)
 */
export function signInWithCourtPin(
  courtNumber: number,
  pin: string
): { success: boolean; session?: AuthSession; error?: string } {
  const trimmedPin = pin.trim();
  // Mã PIN hợp lệ được cấu hình
  if (trimmedPin === '1234' || trimmedPin === '8888') {
    const refereeUser: UserProfile = {
      id: `referee_court_${courtNumber}`,
      email: `court${courtNumber}@referee.badminton.vn`,
      fullName: `Trọng Tài Sân ${courtNumber}`,
      role: 'referee',
      clubName: 'Ban Trọng Tài Điều Hành',
      assignedCourts: [courtNumber],
      createdAt: new Date().toISOString(),
    };
    const session = setSession(refereeUser);
    return { success: true, session };
  }
  return { success: false, error: 'Mã PIN sân không đúng (Gợi ý mã mặc định: 1234)' };
}

/**
 * Đăng xuất
 */
export function signOut(): void {
  if (isSupabaseConfigured()) {
    try {
      createClient()
        .auth.signOut()
        .catch((err) => {
          console.warn('Supabase signOut note:', err);
        });
    } catch {
      // ignore
    }
  }
  inMemorySession = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      document.cookie = 'auth_role=; path=/; max-age=0; SameSite=Lax';
    } catch {
      // ignore
    }
  }
  notifyListeners(null);
}

/**
 * Đăng ký lắng nghe sự thay đổi trạng thái đăng nhập
 */
export function subscribeToAuthState(callback: (session: AuthSession | null) => void): () => void {
  authListeners.push(callback);
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) {
      authListeners.splice(idx, 1);
    }
  };
}
