'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, LogIn, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissionName?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles = ['organizer', 'admin'],
  requiredPermissionName = 'Ban Tổ Chức & Điều Hành',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, loginWithRole } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-semibold tracking-wider uppercase">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // 1. Chưa đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 text-center backdrop-blur">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">
              Yêu Cầu Xác Thực Quyền Quản Trị
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Khu vực <span className="text-cyan-400 font-semibold">{requiredPermissionName}</span> chỉ dành riêng cho Ban Tổ Chức, Trọng Tài hoặc Quản Trị Viên giải đấu.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Đăng Nhập Vào Hệ Thống
            </Link>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => loginWithRole('organizer')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                [Dev Only] Vào Nhanh Với Tư Cách BTC
              </button>
            )}

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay Lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Đã đăng nhập nhưng không đủ quyền (Role không nằm trong allowedRoles)
  const hasPermission = allowedRoles.includes(user.role);
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 shadow-2xl space-y-6 text-center backdrop-blur">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">
              Quyền Hạn Không Đủ
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Tài khoản của bạn hiện là <span className="text-rose-400 font-bold uppercase">{user.role}</span>, không đủ quyền để truy cập trang này.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => loginWithRole('organizer')}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                [Dev Only] Chuyển Sang Tài Khoản Ban Tổ Chức
              </button>
            )}

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay Lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
