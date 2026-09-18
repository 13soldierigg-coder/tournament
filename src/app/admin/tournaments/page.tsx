'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  ArrowLeft,
  Calendar,
  MapPin,
  QrCode,
  Users,
  Layers,
  ExternalLink,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Search,
  Pencil,
  Radio,
  Building,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MOCK_TOURNAMENTS, MockTournament } from '@/data/mockTournaments';
import {
  getCustomTournaments,
  deleteCustomTournament,
} from '@/lib/services/tournamentService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/lib/context/AuthContext';

export default function AdminTournamentsPage() {
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const { user } = useAuth();

  const [customTournaments, setCustomTournaments] = useState<MockTournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

  const loadTournaments = () => {
    setCustomTournaments(getCustomTournaments());
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleDelete = (id: string) => {
    deleteCustomTournament(id);
    setDeleteConfirmId(null);
    loadTournaments();
  };

  const allTournaments = useMemo(() => {
    // Custom tournaments appear first
    return [...customTournaments, ...MOCK_TOURNAMENTS];
  }, [customTournaments]);

  // Tournaments belonging to the current organizer
  const myTournaments = useMemo(() => {
    if (!user) return customTournaments;
    if (user.role === 'admin') return allTournaments;
    // An organizer owns custom tournaments they created or matching organizerId
    return allTournaments.filter(
      (tour) =>
        tour.organizerId === user.id ||
        customTournaments.some((c) => c.id === tour.id)
    );
  }, [allTournaments, customTournaments, user]);

  const displayedList = activeTab === 'my' ? myTournaments : allTournaments;

  const filteredTournaments = useMemo(() => {
    if (!searchQuery.trim()) return displayedList;
    const q = searchQuery.toLowerCase();
    return displayedList.filter(
      (tour) =>
        tour.nameVi.toLowerCase().includes(q) ||
        tour.nameEn.toLowerCase().includes(q) ||
        tour.venueVi.toLowerCase().includes(q)
    );
  }, [displayedList, searchQuery]);

  return (
    <ProtectedRoute allowedRoles={['organizer', 'admin']} requiredPermissionName="Quản Lý Giải Đấu & Điều Hành">
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  {isEn ? 'Tournament Management' : 'Quản Lý Giải Đấu & Điều Hành'}
                </h1>
                <p className="text-xs text-slate-400">
                  {user?.clubName ? (
                    <span className="text-emerald-400 font-semibold">{user.clubName}</span>
                  ) : isEn ? (
                    'Organized tournaments & operational control'
                  ) : (
                    'Danh sách các giải đấu & truy cập nhanh cổng đăng ký, bốc thăm, chấm điểm'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tournaments/create"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {isEn ? 'Create Tournament' : 'Tạo Giải Mới'}
              </Link>
              <UserMenu />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-4 pt-8 space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {user?.fullName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {user?.role === 'admin' ? 'Super Admin' : 'Ban Tổ Chức CLB'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {user?.clubName || user?.email} • {isEn ? 'Authorized Organizer' : 'Đơn vị tổ chức đã xác thực'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/prototypes/court-dispatcher"
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                {isEn ? 'Court Dispatcher' : 'Điều Phối Sân'}
              </Link>
              <Link
                href="/prototypes/organizer-draw"
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                {isEn ? 'Draw Engine' : 'Bốc Thăm'}
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isEn ? 'My Tournaments' : 'Giải Của Tôi'}
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{myTournaments.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                {isEn ? 'Open for Registration' : 'Đang Nhận Đăng Ký'}
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {allTournaments.filter((t) => t.status === 'registration_open').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                {isEn ? 'In Progress / Live' : 'Đang Diễn Ra'}
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {allTournaments.filter((t) => t.status === 'in_progress').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isEn ? 'Total System' : 'Tổng Giải Hệ Thống'}
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {allTournaments.length}
              </div>
            </div>
          </div>

          {/* Search & Tabs Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold self-start">
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'my'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isEn ? 'My Tournaments' : 'Giải Đấu Của Tôi'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 text-current">
                  {myTournaments.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isEn ? 'All Platform Tournaments' : 'Tất Cả Giải Thử Nghiệm'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40 text-current">
                  {allTournaments.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search tournaments...' : 'Tìm kiếm giải đấu...'}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Tournament List */}
          {filteredTournaments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {activeTab === 'my'
                    ? isEn
                      ? 'No tournaments created yet by your account'
                      : 'Bạn chưa tạo giải đấu nào trên tài khoản này'
                    : isEn
                    ? 'No tournaments match your search query'
                    : 'Không tìm thấy giải đấu phù hợp với từ khóa'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeTab === 'my'
                    ? isEn
                      ? 'Click the button below to scaffold your first tournament with customized groups and prize rules.'
                      : 'Bấm nút bên dưới để tạo giải đấu đầu tiên với đầy đủ nội dung, chia bảng và tài khoản VietQR.'
                    : 'Vui lòng thử lại với từ khóa khác hoặc chuyển tab.'}
                </p>
              </div>
              {activeTab === 'my' && (
                <Link
                  href="/admin/tournaments/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  {isEn ? '+ Create Your First Tournament' : '+ Tạo Giải Đấu Đầu Tiên Của Bạn'}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTournaments.map((tour) => {
                const isCustom = customTournaments.some((c) => c.id === tour.id);
                const isDeletePending = deleteConfirmId === tour.id;
                const isOwner = isCustom || tour.organizerId === user?.id || user?.role === 'admin';

                return (
                  <div
                    key={tour.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCustom
                        ? 'bg-slate-900/80 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Column: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isCustom && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              {isEn ? 'Custom Created' : 'Giải Do Bạn Tạo'}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tour.status === 'registration_open'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : tour.status === 'in_progress'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {tour.status === 'registration_open'
                              ? isEn ? 'Registration Open' : 'Đang Nhận Đăng Ký'
                              : tour.status === 'in_progress'
                              ? isEn ? 'In Progress' : 'Đang Thi Đấu'
                              : isEn ? 'Completed' : 'Đã Hoàn Thành'}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          {locale === 'en' ? tour.nameEn : tour.nameVi}
                        </h3>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {tour.startDate} ~ {tour.endDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {locale === 'en' ? tour.venueEn : tour.venueVi}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {tour.events.length} {isEn ? 'Events' : 'Nội dung'}
                          </span>
                          {tour.bankAccount && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <QrCode className="w-3.5 h-3.5" />
                              VietQR: {tour.bankAccount.bankId} - {tour.bankAccount.accountNumber}
                            </span>
                          )}
                        </div>

                        {/* Events Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tour.events.map((ev) => (
                            <span
                              key={ev.id}
                              className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300"
                            >
                              {locale === 'en' ? ev.nameEn : ev.nameVi}
                              {ev.entryFee > 0 && (
                                <span className="text-emerald-400 ml-1">
                                  ({ev.entryFee.toLocaleString('vi-VN')}đ)
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
                        <Link
                          href={`/tournaments/${tour.slug}`}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isEn ? 'Public Page' : 'Trang Khách'}
                        </Link>

                        {isOwner && (
                          <Link
                            href={`/admin/tournaments/create?edit=${tour.slug}`}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-semibold text-xs rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-colors flex items-center gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-400" />
                            {isEn ? 'Edit' : 'Chỉnh Sửa'}
                          </Link>
                        )}

                        {tour.status === 'registration_open' && (
                          <Link
                            href={`/tournaments/${tour.slug}/register`}
                            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            {isEn ? 'Register' : 'Cổng ĐK'}
                          </Link>
                        )}

                        <Link
                          href="/prototypes/organizer-draw"
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          {isEn ? 'Draw' : 'Bốc Thăm'}
                        </Link>

                        <Link
                          href="/prototypes/court-dispatcher"
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-xl border border-cyan-500/30 transition-colors flex items-center gap-1.5"
                        >
                          <Radio className="w-3.5 h-3.5 text-cyan-400" />
                          {isEn ? 'Dispatcher' : 'Điều Phối'}
                        </Link>

                        {/* Delete button only for user-created custom tournaments */}
                        {isCustom && (
                          <div className="relative">
                            {isDeletePending ? (
                              <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/50 p-1 rounded-xl">
                                <button
                                  onClick={() => handleDelete(tour.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg transition-colors"
                                >
                                  {isEn ? 'Confirm' : 'Xác Nhận Xóa'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg"
                                >
                                  {isEn ? 'Cancel' : 'Hủy'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(tour.id)}
                                title={isEn ? 'Delete this test tournament' : 'Xóa giải đấu thử nghiệm này'}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
