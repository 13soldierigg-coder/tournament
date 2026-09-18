'use client';

import React from 'react';
import { EngineBracketMatch } from '@/engine';
import { useLanguage } from '@/i18n';

interface KnockoutBracketViewProps {
  rounds: [number, EngineBracketMatch[]][];
  roundTitles?: Record<number, string>;
  isGroupKnockout?: boolean;
}

export function KnockoutBracketView({
  rounds,
  roundTitles,
  isGroupKnockout = false,
}: KnockoutBracketViewProps) {
  const { t } = useLanguage();
  const drawT = t.draw;
  const roundsT = t.rounds;

  const defaultTitles: Record<number, string> = {
    1: roundsT.roundNumber(1),
    2: roundsT.roundNumber(2),
    3: roundsT.quarterFinals,
    4: roundsT.semiFinals,
    5: roundsT.final,
  };

  const titles = roundTitles || defaultTitles;

  const getSlotLabel = (
    entry?: any,
    feederMatchNumber?: number | null,
    placeholder?: string | null
  ) => {
    if (entry?.name) return entry.name;
    if (entry?.seed) return `Hạt giống #${entry.seed}`;
    if (placeholder === 'BYE') return '--- BYE ---';
    if (placeholder) return placeholder;
    if (feederMatchNumber) return drawT.winnerOfMatch(feederMatchNumber);
    return drawT.emptySlot;
  };

  return (
    <div className="flex items-stretch gap-6 overflow-x-auto pb-4">
      {rounds.map(([roundNum, matches]) => (
        <div key={roundNum} className="flex-1 min-w-[260px] space-y-4">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {titles[roundNum] || roundsT.roundNumber(roundNum)}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {drawT.matchCount(matches.length)}
            </p>
          </div>

          <div className="flex flex-col justify-around h-full space-y-4 py-2">
            {matches.map((match) => {
              const nameA = isGroupKnockout
                ? match.entry1?.name || match.placeholder1
                : getSlotLabel(
                    match.entry1,
                    match.feederMatch1Number,
                    match.placeholder1
                  );
              const nameB = isGroupKnockout
                ? match.entry2?.name || match.placeholder2
                : getSlotLabel(
                    match.entry2,
                    match.feederMatch2Number,
                    match.placeholder2
                  );
              const isByeA = match.placeholder1 === 'BYE';
              const isByeB = match.placeholder2 === 'BYE';

              return (
                <div
                  key={match.matchNumber}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800/80 pb-1.5">
                    <span>{drawT.matchLabel(match.matchNumber)}</span>
                    <span className="text-[10px] text-slate-400">
                      Sân {(match.matchNumber % 3) + 1}
                    </span>
                  </div>

                  {/* Team A */}
                  <div
                    className={`p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isByeA
                        ? 'bg-slate-950/20 text-slate-600'
                        : 'bg-slate-950/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {match.entry1?.seed && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          #{match.entry1.seed}
                        </span>
                      )}
                      {isGroupKnockout && match.placeholder1 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {match.placeholder1}
                        </span>
                      )}
                      <span className="truncate text-slate-300">{nameA}</span>
                    </div>
                    {match.entry1?.club && (
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                        {match.entry1.club}
                      </span>
                    )}
                  </div>

                  {/* Team B */}
                  <div
                    className={`p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isByeB
                        ? 'bg-slate-950/20 text-slate-600'
                        : 'bg-slate-950/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {match.entry2?.seed && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          #{match.entry2.seed}
                        </span>
                      )}
                      {isGroupKnockout && match.placeholder2 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {match.placeholder2}
                        </span>
                      )}
                      <span className="truncate text-slate-300">{nameB}</span>
                    </div>
                    {match.entry2?.club && (
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                        {match.entry2.club}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
