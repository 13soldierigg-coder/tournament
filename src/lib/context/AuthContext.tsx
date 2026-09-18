'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, UserRole, AuthSession, RegisterOrganizerData } from '@/types/auth';
import {
  getCurrentSession,
  getCurrentUser,
  signInWithQuickRole,
  signInWithEmail,
  signUpOrganizer,
  signInWithCourtPin,
  signOut,
  subscribeToAuthState,
} from '@/lib/services/authService';
import { isSupabaseConfigured } from '@/lib/services/tournamentService';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOrganizer: boolean;
  isReferee: boolean;
  isAdmin: boolean;
  loginWithRole: (role: UserRole) => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCourtPin: (courtNumber: number, pin: string) => { success: boolean; error?: string };
  registerOrganizer: (data: RegisterOrganizerData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial hydration from local storage / cache
    const current = getCurrentSession();
    if (current) {
      setSession(current);
      setUser(current.user);
    }

    // 2. Synchronize with real Supabase Auth session if configured
    let supabaseUnsubscribe: (() => void) | undefined;
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
          if (sbSession?.user) {
            const meta = sbSession.user.user_metadata || {};
            const role: UserRole =
              meta.role || (sbSession.user.app_metadata?.role as UserRole) || 'athlete';
            const userProfile: UserProfile = {
              id: sbSession.user.id,
              email: sbSession.user.email || '',
              fullName:
                meta.full_name || meta.name || sbSession.user.email?.split('@')[0] || 'User',
              role,
              clubName: meta.club_name,
              phoneNumber: meta.phone,
              avatarUrl: meta.avatar_url,
              createdAt: sbSession.user.created_at,
            };
            setUser(userProfile);
            setSession({
              user: userProfile,
              token: sbSession.access_token,
              expiresAt: (sbSession.expires_at || 0) * 1000,
            });
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, sbSession) => {
          if (!sbSession) {
            // User signed out in another tab or expired
            const localSession = getCurrentSession();
            // If local session was not a demo account, clear it
            if (localSession && !localSession.user.id.startsWith('user-')) {
              setUser(null);
              setSession(null);
            }
          }
        });

        supabaseUnsubscribe = () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (err) {
        console.warn('Supabase AuthContext sync error:', err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    // 3. Subscribe to auth state updates from authService
    const unsubscribe = subscribeToAuthState((newSession) => {
      setSession(newSession);
      setUser(newSession ? newSession.user : null);
    });

    return () => {
      unsubscribe();
      if (supabaseUnsubscribe) supabaseUnsubscribe();
    };
  }, []);

  const loginWithRole = useCallback((role: UserRole) => {
    const sess = signInWithQuickRole(role);
    setSession(sess);
    setUser(sess.user);
  }, []);

  const loginWithEmailCallback = useCallback(async (email: string, password?: string) => {
    const res = await signInWithEmail(email, password);
    if (res.success && res.session) {
      setSession(res.session);
      setUser(res.session.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Đăng nhập thất bại' };
  }, []);

  const loginWithCourtPinCallback = useCallback((courtNumber: number, pin: string) => {
    const res = signInWithCourtPin(courtNumber, pin);
    if (res.success && res.session) {
      setSession(res.session);
      setUser(res.session.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Mã PIN sân không đúng' };
  }, []);

  const registerOrganizerCallback = useCallback(async (data: RegisterOrganizerData) => {
    const res = await signUpOrganizer(data);
    if (res.success && res.session) {
      setSession(res.session);
      setUser(res.session.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Đăng ký thất bại' };
  }, []);

  const logout = useCallback(() => {
    signOut();
    setSession(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user);
  const isOrganizer = Boolean(user && (user.role === 'organizer' || user.role === 'admin'));
  const isReferee = Boolean(user && (user.role === 'referee' || user.role === 'admin'));
  const isAdmin = Boolean(user && user.role === 'admin');

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated,
      isOrganizer,
      isReferee,
      isAdmin,
      loginWithRole,
      loginWithEmail: loginWithEmailCallback,
      loginWithCourtPin: loginWithCourtPinCallback,
      registerOrganizer: registerOrganizerCallback,
      logout,
    }),
    [
      user,
      session,
      isLoading,
      isAuthenticated,
      isOrganizer,
      isReferee,
      isAdmin,
      loginWithRole,
      loginWithEmailCallback,
      loginWithCourtPinCallback,
      registerOrganizerCallback,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
