'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Trophy,
  LogIn,
  Sparkles,
  ShieldCheck,
  Radio,
  ArrowLeft,
  Mail,
  Lock,
  Building,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { DEMO_ACCOUNTS } from '@/lib/services/authService';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { UserRole } from '@/types/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin/tournaments';

  const { loginWithRole, loginWithEmail, loginWithCourtPin } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const isDev = process.env.NODE_ENV === 'development';
  const [activeTab, setActiveTab] = useState<'demo' | 'email' | 'referee'>(isDev ? 'demo' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [courtNumber, setCourtNumber] = useState(1);
  const [courtPin, setCourtPin] = useState('1234');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = (role: UserRole) => {
    loginWithRole(role);
    router.push(redirectUrl);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage(isEn ? 'Please enter your email' : 'Vui lòng nhập địa chỉ email');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await loginWithEmail(email, password);

    if (res.success) {
      // Do not set isSubmitting(false) here. Next.js router.push takes a moment to fetch the RSC payload.
      // Keeping it true ensures the loading spinner remains visible until the new page renders.
      router.push(redirectUrl);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || (isEn ? 'Login failed' : 'Đăng nhập thất bại'));
    }
  };

  const handleRefereePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const res = loginWithCourtPin(courtNumber, courtPin);
    if (res.success) {
      router.push(`/scoreboard/court/${courtNumber}`);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || 'Mã PIN sân không đúng');
    }
  };

  return (
    <div className="w-full max-w-lg space-y-8">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isEn ? 'Tournament Admin Portal' : 'Cổng Quản Trị & Vận Hành Giải'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          {isEn
            ? 'Sign in to manage your tournaments, configure VietQR fees, dispatch courts, and oversee live matches'
            : 'Đăng nhập để quản lý giải đấu của bạn, cấu hình thu phí VietQR, điều phối sân và giám sát trận đấu'}
        </p>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur space-y-6">
        {/* Tab Selection */}
        <div className={`grid ${isDev ? 'grid-cols-3' : 'grid-cols-2'} gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold`}>
          {isDev && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEn ? '1-Click Test' : 'Test 1-Click'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setErrorMessage('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isEn ? 'Email / BTC' : 'Email / Mật khẩu'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('referee');
              setErrorMessage('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'referee'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isEn ? 'Court PIN' : 'PIN Sân Trọng Tài'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: 1-CLICK DEMO ACCOUNTS (DEV ONLY) */}
        {isDev && activeTab === 'demo' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-xs text-slate-400 font-medium">
              {isEn
                ? 'Select a pre-configured role to immediately experience full platform administrative features:'
                : 'Chọn nhanh vai trò mẫu để trải nghiệm ngay lập tức các tính năng quản trị chuyên sâu:'}
            </div>

            <div className="space-y-3">
              {/* BTC CLB Account */}
              <button
                type="button"
                onClick={() => handleQuickLogin('organizer')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/30">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Nguyễn Văn Hùng
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Ban Tổ Chức
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">CLB Cầu Lông Đống Đa - Hà Nội</div>
                    <div className="text-[10px] text-slate-500 font-mono">btc@badminton.vn</div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  Vào Ngay →
                </div>
              </button>

              {/* Referee Account */}
              <button
                type="button"
                onClick={() => handleQuickLogin('referee')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/30">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        Trần Đình Toàn
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Trọng Tài BWF
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Tổ Trọng Tài Quốc Gia (Sân 1, 2, 3, 4)</div>
                    <div className="text-[10px] text-slate-500 font-mono">referee@bwf.org</div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  Vào Ngay →
                </div>
              </button>

              {/* Super Admin Account */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-purple-500/40 hover:border-purple-400 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm shrink-0 border border-purple-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        Ban Quản Trị Hệ Thống
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Super Admin
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Quản trị toàn bộ giải & tài khoản</div>
                    <div className="text-[10px] text-slate-500 font-mono">admin@badminton.vn</div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-purple-500 text-slate-950 text-xs font-bold shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  Vào Ngay →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD FORM */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                {isEn ? 'Email Address' : 'Địa Chỉ Email Ban Tổ Chức'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="btc@clbcauchuyen.vn"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  {isEn ? 'Password' : 'Mật Khẩu'}
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isEn ? 'Any password for test' : 'Nhập tùy ý ở chế độ test'}
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isEn ? 'Sign In to Dashboard' : 'Đăng Nhập Vào Bàn Quản Trị'}
            </button>
          </form>
        )}

        {/* TAB 3: REFEREE COURT PIN */}
        {activeTab === 'referee' && (
          <form onSubmit={handleRefereePinSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 leading-relaxed">
              Trọng tài tại nhà thi đấu chỉ cần chọn số sân và nhập mã PIN do Ban Tổ Chức cấp để bắt đầu chấm điểm trực tiếp mà không cần đăng ký tài khoản.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  Số Sân Thi Đấu
                </label>
                <select
                  value={courtNumber}
                  onChange={(e) => setCourtNumber(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Sân {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Mã PIN Sân
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={courtPin}
                  onChange={(e) => setCourtPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white text-center font-mono tracking-widest outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Radio className="w-4 h-4" />
              Mở Bảng Chấm Điểm Sân {courtNumber}
            </button>
          </form>
        )}

        {/* Footer info & registration link */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            {isEn ? "Don't have an Organizer account?" : 'Chưa có tài khoản Ban Tổ Chức?'}
          </span>
          <Link
            href="/register/organizer"
            className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
          >
            {isEn ? 'Register Club Account →' : 'Đăng Ký Tài Khoản Mới →'}
          </Link>
        </div>
      </div>

      {/* Back button & Language */}
      <div className="flex items-center justify-between px-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEn ? 'Back to Public Home' : 'Quay lại Trang Chủ'}
        </Link>
        <LanguageSwitcher />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-cyan-400" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
