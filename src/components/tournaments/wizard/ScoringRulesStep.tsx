'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { EventFormState } from './types';

interface ScoringRulesStepProps {
  events: EventFormState[];
  updateEvent: (id: string, updates: Partial<EventFormState>) => void;
}

export function ScoringRulesStep({ events, updateEvent }: ScoringRulesStepProps) {
  const { t } = useLanguage();
  const cT = t.adminCreator;

  return (
    <div className="space-y-6 bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-2xl">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-cyan-400" />
        {cT.step3Title}: {cT.step3Desc}
      </h2>

      <div className="space-y-6">
        {events.map((ev, index) => (
          <div
            key={ev.id}
            className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-sm font-bold text-emerald-400">
                #{index + 1}: {ev.name} ({ev.format})
              </span>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                {ev.eventType}
              </span>
            </div>

            {ev.format === 'group_knockout' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vòng Bảng */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    {cT.groupScoringLabel}
                  </h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {cT.scoringPresetLabel}
                    </label>
                    <select
                      value={ev.groupScoringPreset}
                      onChange={(e) =>
                        updateEvent(ev.id, { groupScoringPreset: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="sudden_death_31">{cT.presetSuddenDeath31}</option>
                      <option value="short_15_21">{cT.presetShort15}</option>
                      <option value="bwf_standard_21_30">{cT.presetBwf}</option>
                      <option value="sudden_death_21">{cT.presetSuddenDeath21}</option>
                    </select>
                  </div>
                </div>

                {/* Vòng Knockout */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                    {cT.knockoutScoringLabel}
                  </h4>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {cT.scoringPresetLabel}
                    </label>
                    <select
                      value={ev.scoringPreset}
                      onChange={(e) =>
                        updateEvent(ev.id, { scoringPreset: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="bwf_standard_21_30">{cT.presetBwf}</option>
                      <option value="short_15_21">{cT.presetShort15}</option>
                      <option value="sudden_death_31">{cT.presetSuddenDeath31}</option>
                      <option value="custom">{cT.presetCustom}</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* Knockout / Round Robin */
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    {cT.scoringPresetLabel}
                  </label>
                  <select
                    value={ev.scoringPreset}
                    onChange={(e) =>
                      updateEvent(ev.id, { scoringPreset: e.target.value as any })
                    }
                    className="w-full sm:w-80 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="bwf_standard_21_30">{cT.presetBwf}</option>
                    <option value="short_15_21">{cT.presetShort15}</option>
                    <option value="sudden_death_31">{cT.presetSuddenDeath31}</option>
                    <option value="sudden_death_21">{cT.presetSuddenDeath21}</option>
                    <option value="custom">{cT.presetCustom}</option>
                  </select>
                </div>

                {ev.scoringPreset === 'custom' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900 rounded-lg">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        {cT.gamesPerMatchLabel}
                      </label>
                      <select
                        value={ev.gamesPerMatch}
                        onChange={(e) =>
                          updateEvent(ev.id, {
                            gamesPerMatch: parseInt(e.target.value, 10) as any,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value={1}>1 Set</option>
                        <option value={3}>3 Sets (Thắng 2)</option>
                        <option value={5}>5 Sets (Thắng 3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        {cT.pointsPerGameLabel}
                      </label>
                      <input
                        type="number"
                        value={ev.pointsPerGame}
                        onChange={(e) =>
                          updateEvent(ev.id, {
                            pointsPerGame: parseInt(e.target.value, 10) || 21,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        {cT.maxCapLabel}
                      </label>
                      <input
                        type="number"
                        value={ev.maxCapPoints}
                        onChange={(e) =>
                          updateEvent(ev.id, {
                            maxCapPoints: parseInt(e.target.value, 10) || 30,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id={`sd-${ev.id}`}
                        checked={ev.isSuddenDeath}
                        onChange={(e) =>
                          updateEvent(ev.id, { isSuddenDeath: e.target.checked })
                        }
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor={`sd-${ev.id}`} className="text-[11px] text-slate-300">
                        {cT.suddenDeathLabel}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
