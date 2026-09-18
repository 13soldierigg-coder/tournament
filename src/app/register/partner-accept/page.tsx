'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  Trophy,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function PartnerAcceptContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const inviteCode = searchParams?.get('code') || 'BD-8899';
  const partnerParam = searchParams?.get('partner') || 'Nguyễn Văn A';

  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerClub, setPartnerClub] = useState('');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim() || !agreedToRules) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsAccepted(true);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 md:p-12 flex flex-col justify-between">
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800/80">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.backToHome}
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="max-w-xl mx-auto w-full my-auto py-8">
        {isAccepted ? (
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {locale === 'vi' ? 'Ghép Đôi Thành Công!' : 'Partner Pairing Confirmed!'}
              </h2>
              <p className="text-sm text-slate-300">
                {locale === 'vi'
                  ? `Bạn và ${partnerParam} đã chính thức được ghi nhận thành một cặp VĐV tham gia giải đấu.`
                  : `You and ${partnerParam} are now officially paired as a doubles team.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã Xác Nhận:</span>
                <span className="font-mono font-bold text-cyan-400">{inviteCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VĐV 1:</span>
                <span className="font-bold text-white">{partnerParam}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VĐV 2 (Bạn):</span>
                <span className="font-bold text-white">{partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CLB Đại Diện:</span>
                <span className="font-bold text-emerald-400">{partnerClub || 'Tự do'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/tournaments/spring-championship-2026"
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors text-center"
              >
                {locale === 'vi' ? 'Xem Thông Tin Giải Đấu' : 'View Tournament Details'}
              </Link>
              <Link
                href="/prototypes/organizer-draw"
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition-colors border border-slate-700 text-center"
              >
                {locale === 'vi' ? 'Xem Nhánh Bốc Thăm' : 'View Bracket Draw'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  {locale === 'vi' ? 'Lời Mời Ghép Đôi' : 'Doubles Partner Invitation'}
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {locale === 'vi' ? 'Xác Nhận Tham Gia Thi Đấu' : 'Confirm Doubles Partnership'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {locale === 'vi'
                    ? `VĐV ${partnerParam} đã gửi lời mời bạn tham gia nội dung Đôi Nam Hạng B.`
                    : `Athlete ${partnerParam} has invited you to pair up for Mens Doubles.`}
                </p>
              </div>
            </div>

            {/* Tournament Meta Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Trophy className="w-4 h-4" />
                <span>Giải Cầu Lông Mùa Xuân 2026 (Spring Championship)</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Nhà Thi Đấu Cầu Giấy
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 15/04 - 18/04/2026
                </span>
              </div>
            </div>

            {/* Partner Form */}
            <form onSubmit={handleConfirm} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {locale === 'vi' ? 'Họ và tên của bạn' : 'Your Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={locale === 'vi' ? 'VD: Lê Hùng' : 'e.g. John Doe'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {locale === 'vi' ? 'Số điện thoại Zalo' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {locale === 'vi' ? 'Câu lạc bộ (CLB)' : 'Club Name'}
                  </label>
                  <input
                    type="text"
                    value={partnerClub}
                    onChange={(e) => setPartnerClub(e.target.value)}
                    placeholder={locale === 'vi' ? 'VD: CLB Ba Đình' : 'e.g. City Club'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-xs text-slate-400">
                  {locale === 'vi'
                    ? 'Tôi cam kết thông tin trên là chính xác và đồng ý tuân thủ mọi điều lệ giải đấu do Ban Tổ Chức ban hành.'
                    : 'I certify that the information provided is accurate and agree to abide by all tournament regulations.'}
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !partnerName.trim() || !agreedToRules}
                className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-sm transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting
                  ? locale === 'vi'
                    ? 'Đang Xác Nhận...'
                    : 'Confirming...'
                  : locale === 'vi'
                  ? 'Chấp Nhận Lời Mời & Xác Nhận Ghép Đôi'
                  : 'Accept Invitation & Confirm Pairing'}
              </button>
            </form>
          </div>
        )}
      </div>

      <footer className="max-w-xl mx-auto w-full text-center text-xs text-slate-600 pt-6 border-t border-slate-900">
        Badminton Tournament Platform • Secured Registration System
      </footer>
    </main>
  );
}

export default function PartnerAcceptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">Loading...</div>}>
      <PartnerAcceptContent />
    </Suspense>
  );
}
