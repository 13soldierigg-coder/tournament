'use client';

import React from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { EventFormState } from './types';

interface EventsConfigStepProps {
  events: EventFormState[];
  addEvent: () => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<EventFormState>) => void;
}

export function EventsConfigStep({
  events,
  addEvent,
  removeEvent,
  updateEvent,
}: EventsConfigStepProps) {
  const { t } = useLanguage();
  const cT = t.adminCreator;

  return (
    <div className="space-y-6 bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          {cT.step2Title}: {cT.step2Desc}
        </h2>
        <button
          type="button"
          onClick={addEvent}
          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {cT.addEventButton}
        </button>
      </div>

      <div className="space-y-4">
        {events.map((ev, index) => (
          <div
            key={ev.id}
            className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Nội dung #{index + 1}
              </span>
              {events.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEvent(ev.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  title="Xóa nội dung"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  {cT.eventNameLabel}
                </label>
                <input
                  type="text"
                  value={ev.name}
                  onChange={(e) => updateEvent(ev.id, { name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  {cT.eventTypeLabel}
                </label>
                <select
                  value={ev.eventType}
                  onChange={(e) => updateEvent(ev.id, { eventType: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="md">Đôi Nam (MD)</option>
                  <option value="ms">Đơn Nam (MS)</option>
                  <option value="wd">Đôi Nữ (WD)</option>
                  <option value="ws">Đơn Nữ (WS)</option>
                  <option value="xd">Đôi Nam Nữ (XD)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  {cT.formatLabel}
                </label>
                <select
                  value={ev.format}
                  onChange={(e) => updateEvent(ev.id, { format: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="group_knockout">{cT.formatGroupKnockout}</option>
                  <option value="knockout">{cT.formatKnockout}</option>
                  <option value="round_robin">{cT.formatRoundRobin}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  {cT.entryFeeLabel}
                </label>
                <input
                  type="number"
                  step={50000}
                  min={0}
                  value={ev.entryFee}
                  onChange={(e) =>
                    updateEvent(ev.id, { entryFee: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-mono font-semibold outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {ev.format === 'group_knockout' && (
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {cT.groupCountLabel}
                    </label>
                    <select
                      value={ev.groupCount}
                      onChange={(e) =>
                        updateEvent(ev.id, { groupCount: parseInt(e.target.value, 10) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value={2}>2 Bảng (A, B)</option>
                      <option value={3}>3 Bảng (A, B, C)</option>
                      <option value={4}>4 Bảng (A, B, C, D)</option>
                      <option value={5}>5 Bảng (A → E)</option>
                      <option value={6}>6 Bảng (A → F)</option>
                      <option value={7}>7 Bảng (A → G)</option>
                      <option value={8}>8 Bảng (A → H)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {cT.advancingCountLabel}
                    </label>
                    <select
                      value={ev.advancingPerGroup}
                      onChange={(e) =>
                        updateEvent(ev.id, {
                          advancingPerGroup: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value={2}>2 Đội (Nhất & Nhì bảng)</option>
                      <option value={1}>1 Đội (Chỉ Nhất bảng)</option>
                    </select>
                  </div>
                </div>

                {/* Specialized rule for odd or non-power-of-2 groups */}
                <div>
                  <label className="text-[11px] font-semibold text-amber-300 block mb-1">
                    {cT.advancementRuleLabel}
                  </label>
                  <select
                    value={ev.advancementRule || 'best_runner_ups'}
                    onChange={(e) =>
                      updateEvent(ev.id, { advancementRule: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-amber-200 outline-none focus:border-amber-400"
                  >
                    <option value="best_runner_ups">{cT.ruleBestRunnerUps}</option>
                    <option value="all_top_two">{cT.ruleAllTopTwo}</option>
                    <option value="winners_only">{cT.ruleWinnersOnly}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Thiết lập giải thưởng riêng cho nội dung này */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ev.hasCustomPrizes || false}
                    onChange={(e) =>
                      updateEvent(ev.id, { hasCustomPrizes: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Cơ cấu giải thưởng riêng cho nội dung này
                  </span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {ev.hasCustomPrizes ? 'Đang dùng cơ cấu riêng' : 'Kế thừa giải thưởng chung'}
                </span>
              </div>

              {ev.hasCustomPrizes && (
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-amber-400 block mb-1">
                      🥇 Giải Nhất
                    </label>
                    <input
                      type="text"
                      value={ev.prizeFirst || ''}
                      onChange={(e) => updateEvent(ev.id, { prizeFirst: e.target.value })}
                      placeholder="VD: Cúp + 5.000.000 VNĐ"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      🥈 Giải Nhì
                    </label>
                    <input
                      type="text"
                      value={ev.prizeSecond || ''}
                      onChange={(e) => updateEvent(ev.id, { prizeSecond: e.target.value })}
                      placeholder="VD: HCB + 3.000.000 VNĐ"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-amber-600 block mb-1">
                      🥉 Đồng Giải Ba
                    </label>
                    <input
                      type="text"
                      value={ev.prizeThird || ''}
                      onChange={(e) => updateEvent(ev.id, { prizeThird: e.target.value })}
                      placeholder="VD: HCĐ + 1.500.000 VNĐ"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
