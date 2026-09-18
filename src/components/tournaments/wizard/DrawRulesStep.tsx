'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { EventFormState } from './types';

interface DrawRulesStepProps {
  events: EventFormState[];
  updateEvent: (id: string, updates: Partial<EventFormState>) => void;
}

export function DrawRulesStep({ events, updateEvent }: DrawRulesStepProps) {
  const { t } = useLanguage();
  const cT = t.adminCreator;

  return (
    <div className="space-y-6 bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-2xl">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-indigo-400" />
        {cT.step4Title}: {cT.step4Desc}
      </h2>

      <div className="space-y-6">
        {events.map((ev, index) => (
          <div
            key={ev.id}
            className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4"
          >
            <span className="text-sm font-bold text-emerald-400 block border-b border-slate-800/80 pb-2">
              #{index + 1}: {ev.name}
            </span>

            {/* Group to Knockout mapping if group_knockout */}
            {ev.format === 'group_knockout' && (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  {t.draw.knockoutMappingLabel}
                </label>
                <select
                  value={ev.knockoutMapping}
                  onChange={(e) =>
                    updateEvent(ev.id, { knockoutMapping: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="cross_p1">{t.draw.mappingPattern1}</option>
                  <option value="cross_p2">{t.draw.mappingPattern2}</option>
                  <option value="cross_p3">{t.draw.mappingPattern3}</option>
                  <option value="random">{t.draw.mappingRandom}</option>
                </select>
                <p className="text-[11px] text-slate-400">{t.draw.mappingNotice}</p>
              </div>
            )}

            {/* Draw Principles Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ev.separateClubsR1}
                  onChange={(e) =>
                    updateEvent(ev.id, { separateClubsR1: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {cT.separateClubsR1Label}
                </span>
              </label>

              {ev.format === 'group_knockout' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ev.separateClubsGroups}
                    onChange={(e) =>
                      updateEvent(ev.id, { separateClubsGroups: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    {cT.separateClubsGroupsLabel}
                  </span>
                </label>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ev.bwfSeeding}
                  onChange={(e) => updateEvent(ev.id, { bwfSeeding: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {cT.bwfSeedingLabel}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
