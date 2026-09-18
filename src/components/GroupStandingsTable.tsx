'use client';

import React from 'react';
import { GroupStanding } from '@/engine/types';
import { useLanguage } from '@/i18n/context';

interface GroupStandingsTableProps {
  groupName: string; // e.g. "BẢNG A" or "A"
  standings: GroupStanding[];
  advancingPerGroup?: number; // default: 2
  className?: string;
}

export function GroupStandingsTable({
  groupName,
  standings,
  advancingPerGroup = 2,
  className = '',
}: GroupStandingsTableProps) {
  const { t } = useLanguage();
  
  // Normalize group title: "# BẢNG A" -> format via i18n
  const cleanName = groupName.replace(/^BẢNG\s*/i, '').replace(/^GROUP\s*/i, '');
  const formattedTitle = t.standings.groupTitle(cleanName);

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-[#0d131f]/90 overflow-hidden shadow-xl ${className}`}
    >
      {/* Header bar matching screenshot */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 tracking-wide">
          <span className="text-cyan-400 font-black text-base sm:text-lg">#</span>
          <span>{formattedTitle}</span>
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          {standings.length} {t.standings.teamsCount}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 tracking-wider">
              <th className="py-2.5 pl-5 pr-2 w-8 text-center">#</th>
              <th className="py-2.5 px-3 font-semibold">{t.standings.entry}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-10">{t.standings.played}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-10">{t.standings.won}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-10">{t.standings.lost}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-12">{t.standings.gameDiff}</th>
              <th className="py-2.5 pr-5 pl-2.5 text-center font-semibold w-14">{t.standings.pointDiff}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {standings.map((team, idx) => {
              const isAdvancing = team.rank <= advancingPerGroup;
              const gd = team.gameDifference;
              const pd = team.pointDifference;

              const formatDiff = (val: number) => {
                if (val > 0) return `+${val}`;
                return `${val}`;
              };

              return (
                <tr
                  key={team.entryId}
                  className={`transition-colors hover:bg-slate-800/30 ${
                    isAdvancing ? 'bg-cyan-500/[0.02]' : ''
                  }`}
                >
                  {/* Rank (#) */}
                  <td
                    className={`py-3 pl-5 pr-2 text-center font-bold text-sm ${
                      isAdvancing ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  >
                    {team.rank}
                  </td>

                  {/* Team Entry Name */}
                  <td className="py-3 px-3 font-sans font-bold text-white text-xs tracking-tight">
                    <div className="flex items-center gap-2">
                      <span className="uppercase">{team.entryName}</span>
                      {isAdvancing && (
                        <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </div>
                  </td>

                  {/* Played (P) */}
                  <td className="py-3 px-2.5 text-center font-bold text-white text-xs">
                    {team.matchesPlayed}
                  </td>

                  {/* Won (W) */}
                  <td className="py-3 px-2.5 text-center font-bold text-cyan-400 text-xs">
                    {team.matchesWon}
                  </td>

                  {/* Lost (L) */}
                  <td className="py-3 px-2.5 text-center font-bold text-rose-500 text-xs">
                    {team.matchesLost}
                  </td>

                  {/* Game Difference (GD) */}
                  <td
                    className={`py-3 px-2.5 text-center font-bold text-xs ${
                      gd > 0
                        ? 'text-emerald-400'
                        : gd < 0
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatDiff(gd)}
                  </td>

                  {/* Point Difference (PD) */}
                  <td
                    className={`py-3 pr-5 pl-2.5 text-center font-bold text-xs ${
                      pd > 0
                        ? 'text-emerald-400'
                        : pd < 0
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatDiff(pd)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Rule Tip */}
      <div className="px-5 py-2.5 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          <span className="text-cyan-400 font-semibold">{t.standings.advancingTip(advancingPerGroup)}</span> {t.standings.advancingDesc}
        </span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          {t.standings.tiebreakerRule}
        </span>
      </div>
    </div>
  );
}
