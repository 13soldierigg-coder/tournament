'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  Trophy,
  Plus,
  Radio,
  Shuffle,
  ChevronDown,
  Shield,
  Sparkles,
  LogIn,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/i18n';
import { UserRole } from '@/types/auth';

export function UserMenu() {
  const { user, isAuthenticated, logout, loginWithRole } = useAuth();
  const { t } = useLanguage();
  

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/10 active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5" />
          {t.auth.signIn}
        </Link>
        <Link
          href="/register/organizer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
        >
          {t.auth.registerClub}
        </Link>
      </div>
    );
  }

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    organizer: { label: t.auth.roles.organizer, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    referee: { label: t.auth.roles.referee, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    admin: { label: t.auth.roles.admin, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    athlete: { label: t.auth.roles.athlete, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  };

  const currentRoleInfo = roleLabels[user.role] || roleLabels.organizer;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center overflow-hidden shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            user.fullName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="hidden md:block leading-tight">
          <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-[130px]">
            {user.fullName}
          </div>
          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
            {user.clubName || user.email}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-3 z-50 backdrop-blur-md space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* User Profile Header */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${currentRoleInfo.color}`}>
                {currentRoleInfo.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ID: {user.id.slice(0, 8)}</span>
            </div>
            <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
            <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            {user.clubName && (
              <div className="text-[10px] text-cyan-400 font-medium truncate pt-0.5">
                🏛️ {user.clubName}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 text-xs">
            <Link
              href="/admin/tournaments"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{t.auth.myTournaments}</span>
            </Link>

            <Link
              href="/admin/tournaments/create"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{t.auth.createNewTournament}</span>
            </Link>

            <Link
              href="/prototypes/court-dispatcher"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>{t.auth.courtDispatcher}</span>
            </Link>

            <Link
              href="/prototypes/organizer-draw"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Shuffle className="w-4 h-4 text-indigo-400" />
              <span>{t.auth.tournamentDraw}</span>
            </Link>

            <Link
              href="/prototypes/umpire-scoring"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Layers className="w-4 h-4 text-rose-400" />
              <span>{t.auth.umpirePad}</span>
            </Link>
          </div>

          {/* Quick Switch Role (for demo & testing only in dev) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {t.auth.devSwitchRole}
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    loginWithRole('organizer');
                    setIsOpen(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    user.role === 'organizer'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  BTC CLB
                </button>
                <button
                  onClick={() => {
                    loginWithRole('referee');
                    setIsOpen(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    user.role === 'referee'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Trọng Tài
                </button>
                <button
                  onClick={() => {
                    loginWithRole('admin');
                    setIsOpen(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    user.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.auth.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
