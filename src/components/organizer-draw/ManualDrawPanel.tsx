'use client';

import React from 'react';
import { Pencil, Star, Sparkles, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { EngineEntry } from '@/engine';

interface ManualDrawPanelProps {
  activeTab: 'group_knockout' | 'knockout' | 'round_robin';
  groupCount: number;
  teamCount: number;
  slotsPerGroup: number;
  activeEntries: EngineEntry[];
  manualGroupSlots: Record<string, string>;
  setManualGroupSlots: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  manualKnockoutSlots: Record<number, string>;
  setManualKnockoutSlots: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onAutoSeedGroups: () => void;
  onFillRemainingGroups: () => void;
  onResetGroups: () => void;
  onAutoSeedKnockout: () => void;
  onFillRemainingKnockout: () => void;
  onResetKnockout: () => void;
}

export function ManualDrawPanel({
  activeTab,
  groupCount,
  teamCount,
  slotsPerGroup,
  activeEntries,
  manualGroupSlots,
  setManualGroupSlots,
  manualKnockoutSlots,
  setManualKnockoutSlots,
  onAutoSeedGroups,
  onFillRemainingGroups,
  onResetGroups,
  onAutoSeedKnockout,
  onFillRemainingKnockout,
  onResetKnockout,
}: ManualDrawPanelProps) {
  const { t } = useLanguage();
  

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-400" />
            {t.manualDraw?.title || 'Nhập Kết Quả Bốc Thăm Thủ Công'}
          </h2>
          <p className="text-xs text-slate-400">
            {t.manualDraw?.desc || 'Gán trực tiếp từng đội hoặc VĐV vào vị trí bảng đấu theo kết quả bốc thăm trực tiếp tại buổi họp kỹ thuật.'}
          </p>
        </div>

        {/* Quick actions for manual placement */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== 'knockout' ? (
            <>
              <button
                type="button"
                onClick={onAutoSeedGroups}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 flex items-center gap-1.5 transition-all"
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                {t.manualDraw.seed1stInGroups}
              </button>
              <button
                type="button"
                onClick={onFillRemainingGroups}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.manualDraw.autoFillRemaining}
              </button>
              <button
                type="button"
                onClick={onResetGroups}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-medium text-xs border border-slate-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onAutoSeedKnockout}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 flex items-center gap-1.5 transition-all"
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                {t.manualDraw.bwfSeedsPlacement}
              </button>
              <button
                type="button"
                onClick={onFillRemainingKnockout}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.manualDraw.autoFillRemaining}
              </button>
              <button
                type="button"
                onClick={onResetKnockout}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-medium text-xs border border-slate-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Manual Slot Inputs for Group Formats */}
      {activeTab !== 'knockout' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: groupCount }).map((_, gIdx) => {
            const letter = String.fromCharCode(65 + gIdx);
            return (
              <div
                key={letter}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5"
              >
                <div className="text-xs font-bold text-amber-300 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Bảng {letter}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {slotsPerGroup} vị trí
                  </span>
                </div>

                <div className="space-y-2">
                  {Array.from({ length: slotsPerGroup }).map((__, sIdx) => {
                    const slotKey = `${letter}_${sIdx}`;
                    const selectedVal = manualGroupSlots[slotKey] || '';
                    return (
                      <div key={slotKey} className="space-y-0.5">
                        <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                          <span>
                            Vị trí {letter}
                            {sIdx + 1}:
                          </span>
                          {sIdx === 0 && (
                            <span className="text-[9px] text-amber-400">Đầu bảng</span>
                          )}
                        </label>
                        <select
                          value={selectedVal}
                          onChange={(e) =>
                            setManualGroupSlots((prev) => ({
                              ...prev,
                              [slotKey]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                        >
                          <option value="">-- Trống / Chưa xếp --</option>
                          {activeEntries.map((ath) => {
                            const isAssignedElse = Object.entries(manualGroupSlots).some(
                              ([k, v]) => v === ath.id && k !== slotKey
                            );
                            return (
                              <option key={ath.id} value={ath.id}>
                                {ath.seed ? `[#${ath.seed}] ` : ''}
                                {ath.name} ({ath.club})
                                {isAssignedElse ? ' (Đã chọn)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Manual Slot Inputs for Knockout Bracket */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: teamCount }).map((_, slotIdx) => {
            const selectedVal = manualKnockoutSlots[slotIdx] || '';
            return (
              <div
                key={slotIdx}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5"
              >
                <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-between">
                  <span>Nhánh vị trí #{slotIdx + 1}</span>
                  {slotIdx === 0 && (
                    <span className="text-[9px] text-amber-400">Top Seed</span>
                  )}
                  {slotIdx === teamCount - 1 && (
                    <span className="text-[9px] text-amber-400">Bottom Seed</span>
                  )}
                </div>
                <select
                  value={selectedVal}
                  onChange={(e) =>
                    setManualKnockoutSlots((prev) => ({
                      ...prev,
                      [slotIdx]: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="">-- Trống / Chưa xếp --</option>
                  {activeEntries.map((ath) => {
                    const isAssignedElse = Object.entries(manualKnockoutSlots).some(
                      ([k, v]) => v === ath.id && Number(k) !== slotIdx
                    );
                    return (
                      <option key={ath.id} value={ath.id}>
                        {ath.seed ? `[#${ath.seed}] ` : ''}
                        {ath.name} ({ath.club})
                        {isAssignedElse ? ' (Đã chọn)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
