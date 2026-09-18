'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { RoundRobinMatch } from '@/engine';

export interface EditingMatchInfo {
  groupLetter: string;
  match: RoundRobinMatch & { scores?: [number, number][] };
}

interface MatchScoreModalProps {
  editingMatch: EditingMatchInfo | null;
  onClose: () => void;
  onSave: (scores: [number, number][], isWalkover?: boolean) => void;
  onDelete: () => void;
}

export function MatchScoreModal({
  editingMatch,
  onClose,
  onSave,
  onDelete,
}: MatchScoreModalProps) {
  const [isSingleSetMatch, setIsSingleSetMatch] = useState(false);
  const [scoreSet1A, setScoreSet1A] = useState(21);
  const [scoreSet1B, setScoreSet1B] = useState(18);
  const [scoreSet2A, setScoreSet2A] = useState(21);
  const [scoreSet2B, setScoreSet2B] = useState(19);
  const [scoreSet3A, setScoreSet3A] = useState(0);
  const [scoreSet3B, setScoreSet3B] = useState(0);
  const [hasSet3, setHasSet3] = useState(false);

  useEffect(() => {
    if (!editingMatch) return;
    const scores = editingMatch.match.scores || [];
    if (scores.length === 1) {
      setIsSingleSetMatch(true);
      setScoreSet1A(scores[0][0]);
      setScoreSet1B(scores[0][1]);
      setScoreSet2A(21);
      setScoreSet2B(19);
      setHasSet3(false);
    } else if (scores.length >= 2) {
      setIsSingleSetMatch(false);
      setScoreSet1A(scores[0][0]);
      setScoreSet1B(scores[0][1]);
      setScoreSet2A(scores[1][0]);
      setScoreSet2B(scores[1][1]);
      if (scores.length === 3) {
        setHasSet3(true);
        setScoreSet3A(scores[2][0]);
        setScoreSet3B(scores[2][1]);
      } else {
        setHasSet3(false);
        setScoreSet3A(0);
        setScoreSet3B(0);
      }
    } else {
      setIsSingleSetMatch(false);
      setScoreSet1A(21);
      setScoreSet1B(18);
      setScoreSet2A(21);
      setScoreSet2B(19);
      setHasSet3(false);
      setScoreSet3A(0);
      setScoreSet3B(0);
    }
  }, [editingMatch]);

  if (!editingMatch) return null;

  const handleApplyPreset = (type: '2-0' | '2-1' | 'single-a' | '0-2' | '1-2' | 'single-b') => {
    switch (type) {
      case '2-0':
        setIsSingleSetMatch(false);
        setScoreSet1A(21);
        setScoreSet1B(18);
        setScoreSet2A(21);
        setScoreSet2B(17);
        setHasSet3(false);
        break;
      case '2-1':
        setIsSingleSetMatch(false);
        setScoreSet1A(21);
        setScoreSet1B(18);
        setScoreSet2A(19);
        setScoreSet2B(21);
        setScoreSet3A(21);
        setScoreSet3B(16);
        setHasSet3(true);
        break;
      case 'single-a':
        setIsSingleSetMatch(true);
        setScoreSet1A(21);
        setScoreSet1B(16);
        setHasSet3(false);
        break;
      case '0-2':
        setIsSingleSetMatch(false);
        setScoreSet1A(16);
        setScoreSet1B(21);
        setScoreSet2A(18);
        setScoreSet2B(21);
        setHasSet3(false);
        break;
      case '1-2':
        setIsSingleSetMatch(false);
        setScoreSet1A(21);
        setScoreSet1B(19);
        setScoreSet2A(17);
        setScoreSet2B(21);
        setScoreSet3A(18);
        setScoreSet3B(21);
        setHasSet3(true);
        break;
      case 'single-b':
        setIsSingleSetMatch(true);
        setScoreSet1A(16);
        setScoreSet1B(21);
        setHasSet3(false);
        break;
    }
  };

  const handleSave = () => {
    const scores: [number, number][] = [];
    scores.push([scoreSet1A, scoreSet1B]);
    if (!isSingleSetMatch) {
      scores.push([scoreSet2A, scoreSet2B]);
      if (hasSet3) {
        scores.push([scoreSet3A, scoreSet3B]);
      }
    }
    onSave(scores, false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d131f] border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              BẢNG {editingMatch.groupLetter.replace('RR_', '')} • TRẬN #{editingMatch.match.matchNumber}
            </span>
            <h3 className="text-base font-extrabold text-white">
              Cập Nhật Tỷ Số Trận Đấu
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

        {/* Teams Header */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="text-cyan-400">Đội A:</span>
            <span className="text-right truncate max-w-[240px]">
              {editingMatch.match.entryA.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="text-amber-400">Đội B:</span>
            <span className="text-right truncate max-w-[240px]">
              {editingMatch.match.entryB.name}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Gợi Ý Tỷ Số Nhanh:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('2-0')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-medium hover:text-cyan-300 transition-all"
            >
              2 - 0 (A thắng)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('2-1')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-medium hover:text-cyan-300 transition-all"
            >
              2 - 1 (A thắng)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('single-a')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 text-xs font-medium hover:text-cyan-300 transition-all"
            >
              1 Hiệp (21-16)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('0-2')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-medium hover:text-amber-300 transition-all"
            >
              0 - 2 (B thắng)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('1-2')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-medium hover:text-amber-300 transition-all"
            >
              1 - 2 (B thắng)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('single-b')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-medium hover:text-amber-300 transition-all"
            >
              1 Hiệp (16-21)
            </button>
          </div>
        </div>

        {/* Set Scores Inputs */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          {/* Single Set Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Thi đấu 1 hiệp duy nhất (VD: chạm 21/31):
            </span>
            <input
              type="checkbox"
              checked={isSingleSetMatch}
              onChange={(e) => setIsSingleSetMatch(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
            />
          </div>

          {/* Set 1 */}
          <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 w-16">Set 1:</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <input
                type="number"
                min={0}
                max={50}
                value={scoreSet1A}
                onChange={(e) => setScoreSet1A(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-cyan-400 outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500 font-bold">-</span>
              <input
                type="number"
                min={0}
                max={50}
                value={scoreSet1B}
                onChange={(e) => setScoreSet1B(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Set 2 (if not single set) */}
          {!isSingleSetMatch && (
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-xs font-bold text-slate-300 w-16">Set 2:</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={scoreSet2A}
                  onChange={(e) => setScoreSet2A(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-cyan-400 outline-none focus:border-cyan-500"
                />
                <span className="text-slate-500 font-bold">-</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={scoreSet2B}
                  onChange={(e) => setScoreSet2B(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Set 3 (Optional) */}
          {!isSingleSetMatch && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Đấu Set 3 (Hiệp quyết định nếu hòa 1-1):</span>
                <input
                  type="checkbox"
                  checked={hasSet3}
                  onChange={(e) => setHasSet3(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
                />
              </div>

              {hasSet3 && (
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 animate-in fade-in">
                  <span className="text-xs font-bold text-slate-300 w-16">Set 3:</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={scoreSet3A}
                      onChange={(e) => setScoreSet3A(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-cyan-400 outline-none focus:border-cyan-500"
                    />
                    <span className="text-slate-500 font-bold">-</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={scoreSet3B}
                      onChange={(e) => setScoreSet3B(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onDelete}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/30 transition-all"
          >
            Xóa Tỷ Số
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu Kết Quả
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
