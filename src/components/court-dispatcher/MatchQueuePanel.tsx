'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Radio,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { QueueMatchItem, CourtInfo } from '@/lib/services/dispatcherService';
import { DispatcherMetrics } from './DispatcherStats';

interface MatchQueuePanelProps {
  queue: QueueMatchItem[];
  filteredQueue: QueueMatchItem[];
  activeQueueTab: 'all' | 'ready' | 'active' | 'pending' | 'completed';
  setActiveQueueTab: (tab: 'all' | 'ready' | 'active' | 'pending' | 'completed') => void;
  metrics: DispatcherMetrics;
  availableCourts: CourtInfo[];
  onDispatch: (courtNumber: number, matchId: string) => void;
}

export function MatchQueuePanel({
  queue,
  filteredQueue,
  activeQueueTab,
  setActiveQueueTab,
  metrics,
  availableCourts,
  onDispatch,
}: MatchQueuePanelProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0d131f]/80 p-5 sm:p-6 space-y-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Hàng Đợi Trận Đấu Toàn Giải (Smart Match Queue)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hệ thống tự động theo dõi thời gian hồi phục thể lực của VĐV giữa 2 trận đấu liên tiếp (tối thiểu 15 phút).
          </p>
        </div>

        {/* Queue Filter Tabs */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveQueueTab('ready')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeQueueTab === 'ready'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sẵn Sàng ({metrics.readyMatches})
          </button>
          <button
            type="button"
            onClick={() => setActiveQueueTab('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeQueueTab === 'active'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đang Đấu ({metrics.activeMatches})
          </button>
          <button
            type="button"
            onClick={() => setActiveQueueTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeQueueTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chờ Nhánh ({metrics.pendingMatches})
          </button>
          <button
            type="button"
            onClick={() => setActiveQueueTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeQueueTab === 'completed'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã Xong ({metrics.completedMatches})
          </button>
          <button
            type="button"
            onClick={() => setActiveQueueTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeQueueTab === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất Cả ({queue.length})
          </button>
        </div>
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {filteredQueue.map((match) => {
          const isReady = match.status === 'ready';
          const isInCourt = match.status === 'in_progress' || match.status === 'warmup';
          const isCompleted = match.status === 'completed';
          const isPending = match.status === 'pending';

          return (
            <div
              key={match.id}
              className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isInCourt
                  ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                  : isReady
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : isCompleted
                  ? 'bg-slate-950/30 border-slate-800/60 opacity-80'
                  : 'bg-slate-950/20 border-slate-800/40 opacity-60'
              }`}
            >
              {/* Left: Match Number & Status */}
              <div className="flex items-center gap-3 min-w-[180px]">
                <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                  #{match.matchNumber}
                </span>
                <div>
                  <div className="text-xs font-bold text-white">{match.roundName}</div>
                  <div className="text-[11px] text-slate-400">{match.eventCategory}</div>
                </div>
              </div>

              {/* Center: Team A vs Team B */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                  {/* Team A */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-200 truncate block">
                      {match.teamA}
                    </span>
                    {match.clubA && (
                      <span className="text-[10px] text-slate-500 truncate block">
                        {match.clubA}
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500 font-bold shrink-0">VS</span>

                  {/* Team B */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-200 truncate block">
                      {match.teamB}
                    </span>
                    {match.clubB && (
                      <span className="text-[10px] text-slate-500 truncate block">
                        {match.clubB}
                      </span>
                    )}
                  </div>
                </div>

                {match.feederInfo && (
                  <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
                    ↳ {match.feederInfo}
                  </div>
                )}
              </div>

              {/* Right: Actions & Dispatch Controls */}
              <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
                {isInCourt && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>{match.courtInfo}</span>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Đã xong ({match.setsA}-{match.setsB})
                      </span>
                    </div>
                    <Link
                      href={`/prototypes/match-scoresheet?matchId=${match.id}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 text-amber-300 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                      title="In Biên Bản Trận Đấu BWF"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Biên Bản</span>
                    </Link>
                  </div>
                )}

                {isPending && (
                  <span className="text-xs text-slate-500 font-mono">Chờ nhánh</span>
                )}

                {isReady && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Điều phối:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {availableCourts.slice(0, 3).map((availCourt) => (
                        <button
                          key={availCourt.courtNumber}
                          type="button"
                          onClick={() => onDispatch(availCourt.courtNumber, match.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs border border-cyan-500/30 transition-all"
                        >
                          Sân {availCourt.courtNumber}
                        </button>
                      ))}

                      {availableCourts.length === 0 && (
                        <span className="text-[11px] text-amber-400 font-mono">
                          Hết sân trống (Chờ giải phóng)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
