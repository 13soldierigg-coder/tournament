'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shuffle,
  Pencil,
  CheckCircle,
  Layers,
  Users,
  Trophy,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { MockTournament } from '@/data/mockTournaments';

interface DrawHeaderProps {
  currentTournament: MockTournament | undefined;
  tournaments: MockTournament[];
  selectedTournamentSlug: string;
  onSelectTournament: (slug: string) => void;
  currentEvent: any;
  eventsList: any[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
  drawMode: 'auto' | 'manual';
  setDrawMode: (mode: 'auto' | 'manual') => void;
  teamCount: number;
  setTeamCount: (count: number) => void;
  separateClubs: boolean;
  setSeparateClubs: (val: boolean) => void;
  activeTab: 'group_knockout' | 'knockout' | 'round_robin';
  setActiveTab: (tab: 'group_knockout' | 'knockout' | 'round_robin') => void;
  isPublishing: boolean;
  isPublished: boolean;
  onTogglePublish: () => void;
  onShuffleUnseeded: () => void;
  entriesCount: number;
}

export function DrawHeader({
  currentTournament,
  tournaments,
  selectedTournamentSlug,
  onSelectTournament,
  currentEvent,
  eventsList,
  selectedEventId,
  onSelectEvent,
  drawMode,
  setDrawMode,
  teamCount,
  setTeamCount,
  separateClubs,
  setSeparateClubs,
  activeTab,
  setActiveTab,
  isPublishing,
  isPublished,
  onTogglePublish,
  onShuffleUnseeded,
  entriesCount,
}: DrawHeaderProps) {
  const { t, locale } = useLanguage();
  const drawT = t.draw;
  

  return (
    <div className="space-y-4">
      {/* Tournament Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.drawHeader.selectedTournament}
            </span>
            <select
              value={selectedTournamentSlug}
              onChange={(e) => onSelectTournament(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold outline-none focus:border-cyan-500 max-w-xs sm:max-w-md"
            >
              {tournaments.map((tour) => (
                <option key={tour.id} value={tour.slug}>
                  {tour.nameVi || tour.nameEn}
                </option>
              ))}
            </select>
          </div>

          {eventsList.length > 1 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.drawHeader.eventCategory}
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-semibold outline-none focus:border-emerald-500"
              >
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nameVi || ev.nameEn} ({ev.format})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {currentTournament && (
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTournament.venueVi || currentTournament.venueEn}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTournament.startDate}</span>
            </div>
            <Link
              href={`/tournaments/${currentTournament.slug}?tab=athletes`}
              className="text-cyan-400 hover:underline text-xs flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              {t.drawHeader.viewRoster}
            </Link>
          </div>
        )}
      </div>

      {/* DRAW CONTROLS PANEL */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{drawT.title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {currentEvent?.nameVi || 'Nội Dung'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{drawT.desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Draw Mode Switcher: Auto vs Manual */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setDrawMode('auto')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  drawMode === 'auto'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                {t.drawHeader.autoDraw}
              </button>
              <button
                type="button"
                onClick={() => setDrawMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  drawMode === 'manual'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                {t.drawHeader.manualPlacement}
              </button>
            </div>

            {drawMode === 'auto' && (
              <button
                type="button"
                onClick={onShuffleUnseeded}
                disabled={isPublishing || entriesCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 active:scale-95 transition-all border border-slate-700 disabled:opacity-40"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                {drawT.shuffleButton}
              </button>
            )}

            <button
              type="button"
              onClick={onTogglePublish}
              disabled={isPublishing || entriesCount === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 ${
                isPublishing
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : isPublished
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/25'
              }`}
            >
              {isPublishing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  {drawT.publishingState}
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isPublished ? drawT.unpublishButton : drawT.publishButton}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{drawT.participantsLabel}</span>
            <select
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-semibold outline-none focus:border-cyan-500"
            >
              <option value={4}>4 {t.drawHeader.teams}</option>
              <option value={6}>6 {t.drawHeader.teams}</option>
              <option value={8}>8 {t.drawHeader.teams}</option>
              <option value={12}>12 {t.drawHeader.teams}</option>
              <option value={16}>16 {t.drawHeader.teams}</option>
              {entriesCount > 0 && (
                <option value={entriesCount}>
                  {entriesCount} ({t.drawHeader.allRegistered})
                </option>
              )}
            </select>
          </div>

          {drawMode === 'auto' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={separateClubs}
                onChange={(e) => setSeparateClubs(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 cursor-pointer"
              />
              <span>{drawT.separateClubsOption}</span>
            </label>
          )}

          {/* Mode Switcher */}
          <div className="ml-auto inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('group_knockout')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'group_knockout'
                  ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              {drawT.tabGroupKnockout}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('knockout')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'knockout'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              {drawT.tabKnockout}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('round_robin')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'round_robin'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              {drawT.tabRoundRobin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
