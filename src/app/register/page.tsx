'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Calendar,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MOCK_TOURNAMENTS, MockTournament } from '@/data/mockTournaments';
import { getCustomTournaments } from '@/lib/services/tournamentService';

function RegisterIndexContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const requestedTourSlug = searchParams?.get('tournament');
  const isEn = locale === 'en';

  const [customTournaments, setCustomTournaments] = useState<MockTournament[]>([]);

  useEffect(() => {
    setCustomTournaments(getCustomTournaments());
  }, []);

  // Kết hợp các giải đấu tự tạo (ưu tiên đứng trước) cùng các giải đấu mẫu
  const activeTournaments = useMemo(() => {
    const combined = [...customTournaments, ...MOCK_TOURNAMENTS];
    return combined.filter(
      (tour) => tour.status === 'registration_open' || tour.status === 'in_progress'
    );
  }, [customTournaments]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans pb-20">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.backToHome}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            {isEn ? 'Tournament Registration Portal' : 'Cổng Đăng Ký Giải Đấu Cầu Lông'}
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {isEn ? 'Choose a Tournament to Register' : 'Chọn Giải Đấu Để Đăng Ký'}
          </h1>
          <p className="text-xs text-slate-400">
            {isEn
              ? 'Select an open tournament below to choose your event and complete entry.'
              : 'Chọn giải đấu đang mở đơn dưới đây để chọn nội dung thi đấu và giữ chỗ tham gia.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTournaments.map((tour) => (
            <div
              key={tour.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    🟢 {isEn ? 'Registration Open' : 'Đang Mở Đăng Ký'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {tour.events.length} {isEn ? 'Events' : 'Nội dung'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isEn ? tour.nameEn : tour.nameVi}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {isEn ? tour.descriptionEn : tour.descriptionVi}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{isEn ? tour.venueEn : tour.venueVi}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{tour.startDate} → {tour.endDate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/tournaments/${tour.slug}`}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {isEn ? 'View Regulations' : 'Xem Điều Lệ'}
                </Link>
                <Link
                  href={`/tournaments/${tour.slug}/register`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
                >
                  {isEn ? 'Register Now' : 'Đăng Ký Ngay'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function RegisterIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
          Đang tải cổng đăng ký...
        </div>
      }
    >
      <RegisterIndexContent />
    </Suspense>
  );
}
