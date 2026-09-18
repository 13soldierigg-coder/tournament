'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Trophy,
  QrCode,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/i18n';

interface SuccessBannerProps {
  submitResult: {
    message?: string;
    slug?: string;
  };
  isEditMode: boolean;
}

export function SuccessBanner({ submitResult, isEditMode }: SuccessBannerProps) {
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const cT = t.adminCreator;

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/50 shadow-2xl animate-in fade-in">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">
            {isEditMode
              ? isEn
                ? 'Changes Saved Successfully!'
                : 'Cập Nhật Giải Đấu Thành Công!'
              : cT.createSuccessToast}
          </h2>
          <p className="text-sm text-emerald-200/80 mb-4">{submitResult.message}</p>
          <div className="flex flex-wrap gap-2.5">
            {submitResult.slug && (
              <>
                <Link
                  href={`/tournaments/${submitResult.slug}`}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <Trophy className="w-4 h-4" />
                  Xem Trang Giải Đấu
                </Link>
                <Link
                  href={`/tournaments/${submitResult.slug}/register`}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <QrCode className="w-4 h-4" />
                  Đến Cổng Đăng Ký & Quét VietQR
                </Link>
                <Link
                  href={`/prototypes/organizer-draw?tournament=${submitResult.slug}`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  Bốc Thăm & Chia Bảng
                </Link>
              </>
            )}
            <Link
              href="/admin/tournaments"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-slate-400" />
              Quản Lý Danh Sách Giải
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
