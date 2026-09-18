'use client';

import React from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { GroupStandingsTable } from '@/components/GroupStandingsTable';
import { BestRunnerUpsTable } from '@/components/BestRunnerUpsTable';
import { RoundRobinMatch, GroupStanding, GroupAdvancementRule } from '@/engine';

export interface GroupData {
  name: string;
  entries: any[];
  schedule: RoundRobinMatch[];
}

export interface StoredMatchResult {
  isFinished: boolean;
  winnerId?: string;
  scores?: { scoreA: number; scoreB: number }[];
}

interface GroupStageViewProps {
  finishedGroupMatchesCount: number;
  totalGroupMatchesCount: number;
  onSimulatePhotoGroupA: () => void;
  onSimulateAllGroups: () => void;
  onResetAllScores: () => void;
  runnerUpsNeeded: number;
  advancementRule: GroupAdvancementRule;
  allGroupStandings: {
    groupLetter: string;
    groupIdx: number;
    standings: GroupStanding[];
  }[];
  groups: GroupData[];
  groupMatchScores: Record<string, StoredMatchResult>;
  onOpenScoreModal: (groupLetter: string, groupIdx: number, match: RoundRobinMatch) => void;
}

export function GroupStageView({
  finishedGroupMatchesCount,
  totalGroupMatchesCount,
  onSimulatePhotoGroupA,
  onSimulateAllGroups,
  onResetAllScores,
  runnerUpsNeeded,
  advancementRule,
  allGroupStandings,
  groups,
  groupMatchScores,
  onOpenScoreModal,
}: GroupStageViewProps) {
  return (
    <div className="space-y-6">
      {/* GROUP STAGE CONTROL & SIMULATION ACTION BAR */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Theo Dõi Vòng Bảng & Điểm Số
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {finishedGroupMatchesCount}/{totalGroupMatchesCount} Trận Đã Đấu
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Bảng xếp hạng tự động cập nhật theo quy chuẩn BWF (Thắng → Hiệu số ván GD → Hiệu số điểm PD).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSimulatePhotoGroupA}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Giả Lập Bảng A (Chuẩn Như Ảnh)</span>
          </button>

          <button
            type="button"
            onClick={onSimulateAllGroups}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>⚡ Giả Lập Tất Cả Các Bảng</span>
          </button>

          <button
            type="button"
            onClick={onResetAllScores}
            className="px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs border border-slate-800 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt Lại</span>
          </button>
        </div>
      </div>

      {/* BEST RUNNER-UPS COMPARISON TABLE */}
      {(runnerUpsNeeded > 0 || advancementRule === 'best_runner_ups') && (
        <BestRunnerUpsTable
          allGroupStandings={allGroupStandings}
          qualifyingCount={runnerUpsNeeded > 0 ? runnerUpsNeeded : 1}
        />
      )}

      {/* GROUPS STANDINGS & MATCHES GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {groups.map((group, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const groupStandings = allGroupStandings[idx]?.standings || [];

          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5 shadow-xl"
            >
              {/* Standings Table */}
              <GroupStandingsTable
                groupName={group.name}
                standings={groupStandings}
                advancingPerGroup={2}
              />

              {/* Match Schedule & Scores */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <span>Lịch Thi Đấu & Kết Quả Từng Trận</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {group.schedule.length} Trận
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Bấm &quot;Ghi điểm&quot; để nhập tỷ số từng hiệp
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {group.schedule.map((match) => {
                    const matchKey = `${letter}_${match.entryA.id}_vs_${match.entryB.id}`;
                    const result = groupMatchScores[matchKey];
                    const isFinished = !!result?.isFinished;
                    const winnerId = result?.winnerId;

                    const scoreText = result?.scores
                      ?.map((s) => `${s.scoreA}-${s.scoreB}`)
                      .join(', ');

                    return (
                      <div
                        key={match.matchNumber}
                        className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        {/* Left: Round and Match Number */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 shrink-0">
                            V{match.round} • #{match.matchNumber}
                          </span>

                          {/* Teams matchup */}
                          <div className="text-xs font-semibold truncate">
                            <span
                              className={
                                winnerId === match.entryA.id
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-slate-200'
                              }
                            >
                              {match.entryA.name}
                            </span>
                            <span className="text-slate-500 mx-1.5 font-normal">vs</span>
                            <span
                              className={
                                winnerId === match.entryB.id
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-slate-200'
                              }
                            >
                              {match.entryB.name}
                            </span>
                          </div>
                        </div>

                        {/* Right: Score badge & Action Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          {isFinished ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{scoreText}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              Chưa diễn ra
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenScoreModal(letter, idx, match)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3 text-cyan-400" />
                            <span>{isFinished ? 'Sửa' : 'Ghi điểm'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
