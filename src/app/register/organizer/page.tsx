'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  UserPlus,
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function RegisterOrganizerPage() {
  const router = useRouter();
  const { registerOrganizer } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clubName, setClubName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !clubName.trim()) {
      setErrorMessage(
        isEn
          ? 'Please fill in all required fields'
          : 'Vui lòng điền đầy đủ họ tên, email và tên câu lạc bộ'
      );
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const res = await registerOrganizer({
      fullName,
      email,
      phoneNumber,
      clubName,
      password,
    });

    setIsSubmitting(false);

    if (res.success) {
      router.push('/admin/tournaments');
    } else {
      setErrorMessage(res.error || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <div className="w-full max-w-lg space-y-8">
        {/* Header Info */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-2 shadow-lg shadow-emerald-500/10">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEn ? 'Register Organizer Account' : 'Đăng Ký Tài Khoản Ban Tổ Chức'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {isEn
              ? 'Join as an official tournament organizer or badminton club to manage registrations, draws, and courts'
              : 'Gia nhập mạng lưới đơn vị tổ chức giải đấu, tự chủ mở giải, cấu hình VietQR và điều hành sân'}
          </p>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Họ và Tên Người Đại Diện <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn Hùng"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            {/* Club Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                Tên Câu Lạc Bộ / Đơn Vị Tổ Chức <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="VD: CLB Cầu Lông Đống Đa - Hà Nội"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Email Đăng Ký <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="btc@clbcau.vn"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Số Điện Thoại
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Mật Khẩu Quản Trị
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Tùy chọn ở chế độ thử nghiệm)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isEn ? 'Complete Registration & Open Dashboard' : 'Hoàn Tất Đăng Ký & Vào Quản Trị'}
            </button>
          </form>

          {/* Login link */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isEn ? 'Already have an account?' : 'Đã có tài khoản Ban Tổ Chức?'}
            </span>
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              {isEn ? 'Sign In →' : 'Đăng Nhập Ngay →'}
            </Link>
          </div>
        </div>

        {/* Back and Language */}
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
    </div>
  );
}
