'use client';

import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { CourtInfo } from '@/lib/services/dispatcherService';

interface FinishMatchModalProps {
  court: CourtInfo;
  finishSetsA: number;
  setFinishSetsA: (val: number) => void;
  finishSetsB: number;
  setFinishSetsB: (val: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function FinishMatchModal({
  court,
  finishSetsA,
  setFinishSetsA,
  finishSetsB,
  setFinishSetsB,
  onClose,
  onConfirm,
}: FinishMatchModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d131f] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
              SÂN {court.courtNumber} • TRẬN #{court.currentMatch?.matchNumber}
            </span>
            <h3 className="text-base font-extrabold text-white">
              Chốt Kết Quả & Giải Phóng Sân
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

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                {court.currentMatch?.teamA}
              </span>
              <span className="font-mono text-cyan-400 font-bold">Đội A</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                {court.currentMatch?.teamB}
              </span>
              <span className="font-mono text-amber-400 font-bold">Đội B</span>
            </div>
          </div>

          {/* Sets Result */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Tỷ số hiệp (Sets):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={3}
                value={finishSetsA}
                onChange={(e) => setFinishSetsA(Number(e.target.value))}
                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-cyan-400"
              />
              <span className="text-slate-500 font-bold">-</span>
              <input
                type="number"
                min={0}
                max={3}
                value={finishSetsB}
                onChange={(e) => setFinishSetsB(Number(e.target.value))}
                className="w-14 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Xác Nhận & Giải Phóng Sân
          </button>
        </div>
      </div>
    </div>
  );
}
