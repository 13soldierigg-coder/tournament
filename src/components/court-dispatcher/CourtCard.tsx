'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Play,
  ExternalLink,
  Tv,
} from 'lucide-react';
import { CourtInfo } from '@/lib/services/dispatcherService';

interface CourtCardProps {
  court: CourtInfo;
  onDispatchClick: (courtNumber: number) => void;
  onStartMatch: (courtNumber: number) => void;
  onOpenFinishModal: (court: CourtInfo) => void;
}

export function CourtCard({
  court,
  onDispatchClick,
  onStartMatch,
  onOpenFinishModal,
}: CourtCardProps) {
  const hasMatch = Boolean(court.currentMatch);
  const match = court.currentMatch;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between space-y-5 transition-all shadow-xl ${
        court.status === 'in_progress'
          ? 'bg-gradient-to-b from-[#0e1726] to-[#090d16] border-emerald-500/40 shadow-emerald-500/10'
          : court.status === 'warmup'
          ? 'bg-gradient-to-b from-[#18150f] to-[#090d16] border-amber-500/40 shadow-amber-500/10'
          : 'bg-[#0d131f]/70 border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Court Top Bar */}
      <div className="space-y-3 border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-black text-white tracking-wide">
            {court.courtName}
          </span>

          {/* Status Pill */}
          {court.status === 'in_progress' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Đang đấu
            </span>
          ) : court.status === 'warmup' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
              <Flame className="w-3.5 h-3.5 animate-bounce" />
              Khởi động ({Math.floor((court.warmupSecondsLeft || 120) / 60)}:
              {String((court.warmupSecondsLeft || 120) % 60).padStart(2, '0')})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
              Sân trống
            </span>
          )}
        </div>

        {court.umpireName && (
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Trọng tài chính:</span>
            <span className="font-semibold text-slate-200">{court.umpireName}</span>
          </div>
        )}
      </div>

      {/* Match Details or Empty State */}
      {hasMatch && match ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono">
            <span>
              #{match.matchNumber} • {match.roundName}
            </span>
            <span className="text-slate-400">
              {match.stage === 'knockout' ? 'Knockout' : 'Vòng Bảng'}
            </span>
          </div>

          {/* Team A */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white truncate">{match.teamA}</div>
              <div className="text-[10px] text-slate-400">{match.clubA}</div>
            </div>
            <div className="text-xl font-mono font-black text-cyan-400">
              {match.currentScoreA}
            </div>
          </div>

          {/* Team B */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white truncate">{match.teamB}</div>
              <div className="text-[10px] text-slate-400">{match.clubB}</div>
            </div>
            <div className="text-xl font-mono font-black text-amber-400">
              {match.currentScoreB}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>
              Tỷ số hiệp: {match.setsA} - {match.setsB}
            </span>
            {court.status === 'in_progress' && (
              <span className="text-emerald-400 font-semibold">Đang cập nhật</span>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center space-y-3 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-300">Sân Sẵn Sàng Nhận Trận</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chưa có trận đấu nào được điều phối lên sân này
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDispatchClick(court.courtNumber)}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-bold text-xs transition-all inline-flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Gọi Trận Lên Sân</span>
          </button>
        </div>
      )}

      {/* On Deck Next Match Preview */}
      {court.nextMatch && (
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] space-y-1">
          <div className="text-slate-400 font-semibold flex items-center justify-between">
            <span className="uppercase text-[10px] tracking-wider text-amber-400 font-bold">
              Trận Kế Tiếp (On Deck):
            </span>
            <span className="font-mono">#{court.nextMatch.matchNumber}</span>
          </div>
          <div className="text-slate-200 font-medium truncate">
            {court.nextMatch.teamA} <span className="text-slate-500">vs</span>{' '}
            {court.nextMatch.teamB}
          </div>
        </div>
      )}

      {/* Court Action Controls */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        {court.status === 'warmup' && (
          <button
            type="button"
            onClick={() => onStartMatch(court.courtNumber)}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Bắt Đầu Trận Đấu (Hết Khởi Động)</span>
          </button>
        )}

        {court.status === 'in_progress' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenFinishModal(court)}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all text-center"
            >
              Chốt Kết Quả
            </button>

            <Link
              href={`/prototypes/umpire-scoring?court=${court.courtNumber}`}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1"
            >
              <span>Ghi Điểm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Public TV Scoreboard link */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <Link
            href={`/scoreboard/court/${court.courtNumber}`}
            target="_blank"
            className="hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Tv className="w-3 h-3 text-cyan-400" />
            <span>Màn hình Tivi Sân {court.courtNumber}</span>
          </Link>

          {court.status === 'available' && (
            <button
              type="button"
              onClick={() => onDispatchClick(court.courtNumber)}
              className="text-cyan-400 hover:underline font-semibold"
            >
              + Gọi Trận
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
