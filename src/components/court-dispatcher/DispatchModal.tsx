'use client';

import React from 'react';
import { X } from 'lucide-react';
import { QueueMatchItem } from '@/lib/services/dispatcherService';

interface DispatchModalProps {
  courtNumber: number;
  readyMatches: QueueMatchItem[];
  onClose: () => void;
  onDispatch: (courtNumber: number, matchId: string) => void;
}

export function DispatchModal({
  courtNumber,
  readyMatches,
  onClose,
  onDispatch,
}: DispatchModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0d131f] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              ĐIỀU PHỐI VÀO SÂN {courtNumber}
            </span>
            <h3 className="text-base font-extrabold text-white">
              Chọn Trận Đấu Sẵn Sàng Trong Hàng Đợi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {readyMatches.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Không còn trận đấu nào đang ở trạng thái sẵn sàng
            </div>
          ) : (
            readyMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => onDispatch(courtNumber, match.id)}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-400">
                      #{match.matchNumber}
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {match.roundName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate">
                    {match.teamA} <span className="text-slate-500">vs</span> {match.teamB}
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shrink-0 group-hover:bg-cyan-400 transition-colors"
                >
                  Gọi Lên Sân →
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Hủy Bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
