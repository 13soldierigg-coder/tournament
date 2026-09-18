'use client';

import React from 'react';
import { GroupStanding } from '@/engine/types';
import { calculateBestRunnerUps, RunnerUpStanding } from '@/engine/standings';
import { Star, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface BestRunnerUpsTableProps {
  allGroupStandings: { groupLetter: string; groupIdx: number; standings: GroupStanding[] }[];
  qualifyingCount: number; // Number of runner-ups that advance (e.g. 1 for 3 groups, 2 or 3 for 5, 6, 7 groups)
  className?: string;
}

export function BestRunnerUpsTable({
  allGroupStandings,
  qualifyingCount,
  className = '',
}: BestRunnerUpsTableProps) {
  const { t } = useLanguage();
  const runnerUps: RunnerUpStanding[] = calculateBestRunnerUps(
    allGroupStandings,
    qualifyingCount
  );

  if (runnerUps.length === 0) {
    return null;
  }

  const formatDiff = (val: number) => {
    if (val > 0) return `+${val}`;
    return `${val}`;
  };

  return (
    <div
      className={`rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-[#0d131f] to-[#090d16] overflow-hidden shadow-2xl space-y-0 ${className}`}
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-extrabold text-amber-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{t.standings.bestRunnerUpsTitle}</span>
          </h3>
          <p className="text-xs text-slate-400">
            {t.standings.bestRunnerUpsSubDesc1}
            <strong className="text-emerald-400 font-bold">{qualifyingCount} {t.standings.bestRunnerUpsSubDesc2}</strong>{' '}
            {t.standings.bestRunnerUpsSubDesc3}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono shrink-0">
          <span>{t.standings.ticketsAvailable(qualifyingCount, runnerUps.length)}</span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 tracking-wider bg-slate-950/50">
              <th className="py-2.5 pl-5 pr-2 w-10 text-center">{t.standings.rankLabel}</th>
              <th className="py-2.5 px-3 w-20">{t.standings.groupLabel}</th>
              <th className="py-2.5 px-3 font-semibold">{t.standings.entry}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-10">{t.standings.played}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-10">{t.standings.won}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-10">{t.standings.lost}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-14">{t.standings.gameDiff}</th>
              <th className="py-2.5 px-2.5 text-center font-semibold w-16">{t.standings.pointDiff}</th>
              <th className="py-2.5 pr-5 pl-3 text-center font-semibold w-36">{t.standings.ticketStatusLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {runnerUps.map((team, idx) => {
              const gd = team.gameDifference;
              const pd = team.pointDifference;

              return (
                <tr
                  key={team.entryId}
                  className={`transition-colors ${
                    team.qualifies
                      ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/10'
                      : 'hover:bg-slate-800/30 opacity-75'
                  }`}
                >
                  {/* Rank among runner-ups */}
                  <td
                    className={`py-3 pl-5 pr-2 text-center font-bold text-sm ${
                      team.qualifies ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </td>

                  {/* Group letter */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-800 text-cyan-300 border border-slate-700">
                      {t.standings.groupPrefix} {team.groupLetter}
                    </span>
                  </td>

                  {/* Team Entry Name */}
                  <td className="py-3 px-3 font-sans font-bold text-white text-xs tracking-tight">
                    <span className="uppercase">{team.entryName}</span>
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
                    className={`py-3 px-2.5 text-center font-bold text-xs ${
                      pd > 0
                        ? 'text-emerald-400'
                        : pd < 0
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatDiff(pd)}
                  </td>

                  {/* Ticket Status */}
                  <td className="py-3 pr-5 pl-3 text-center">
                    {team.qualifies ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-sans shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {t.standings.ticketGranted}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 font-sans">
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        {t.standings.ticketDenied}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer explanation */}
      <div className="px-5 py-3 bg-slate-950/50 border-t border-amber-500/20 flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{t.standings.bwfRunnerUpRuleDesc}</span>
      </div>
    </div>
  );
}
