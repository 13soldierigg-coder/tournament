'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  Trophy,
  ArrowLeft,
  Pencil,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserMenu } from '@/components/auth/UserMenu';
import { useTournamentWizard } from '@/hooks/useTournamentWizard';
import { WizardProgressBar } from '@/components/tournaments/wizard/WizardProgressBar';
import { SuccessBanner } from '@/components/tournaments/wizard/SuccessBanner';
import { GeneralInfoStep } from '@/components/tournaments/wizard/GeneralInfoStep';
import { EventsConfigStep } from '@/components/tournaments/wizard/EventsConfigStep';
import { ScoringRulesStep } from '@/components/tournaments/wizard/ScoringRulesStep';
import { DrawRulesStep } from '@/components/tournaments/wizard/DrawRulesStep';
import { WizardNavigation } from '@/components/tournaments/wizard/WizardNavigation';

function TournamentEditor() {
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const cT = t.adminCreator;

  const wizard = useTournamentWizard();

  return (
    <ProtectedRoute
      allowedRoles={['organizer', 'admin']}
      requiredPermissionName="Tạo & Cài Đặt Giải Đấu"
    >
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tournaments"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  {wizard.isEditMode ? (
                    <>
                      <Pencil className="w-5 h-5 text-amber-400" />
                      {isEn ? 'Edit Tournament' : 'Điều Chỉnh Thông Tin Giải Đấu'}
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 text-amber-400" />
                      {cT.pageTitle}
                    </>
                  )}
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {wizard.isEditMode
                    ? isEn
                      ? 'Update tournament info, venue, VietQR bank account, and competition events'
                      : 'Cập nhật thông tin chi tiết, địa điểm, ngân hàng VietQR và nội dung thi đấu'
                    : cT.pageDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {wizard.isEditMode && (
                <button
                  type="button"
                  onClick={wizard.handleSaveTournament}
                  disabled={wizard.isSubmitting || wizard.isLoadingExisting}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {wizard.isSubmitting
                    ? isEn
                      ? 'Saving...'
                      : 'Đang lưu...'
                    : isEn
                    ? 'Save Changes'
                    : 'Lưu Thay Đổi'}
                </button>
              )}
              <Link
                href="/admin/tournaments"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Quản Lý Giải Đấu
              </Link>
              <UserMenu />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-5xl mx-auto px-4 pt-8">
          {/* Loading / Error / Edit Status Banners */}
          {wizard.isLoadingExisting && (
            <div className="mb-6 p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 animate-pulse">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>
                {isEn
                  ? 'Loading tournament information...'
                  : 'Đang tải thông tin giải đấu để điều chỉnh...'}
              </span>
            </div>
          )}

          {wizard.loadError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{wizard.loadError}</span>
            </div>
          )}

          {wizard.isEditMode && !wizard.isLoadingExisting && !wizard.loadError && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isEn ? 'Editing tournament: ' : 'Đang điều chỉnh giải đấu: '}
                  <strong className="text-white font-bold">{wizard.tournamentName}</strong>
                </span>
              </div>
              {wizard.editSlug && (
                <Link
                  href={`/tournaments/${wizard.editSlug}`}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  {isEn ? 'View Live Page' : 'Xem Trang Công Khai'} &rarr;
                </Link>
              )}
            </div>
          )}

          {/* Step Indicator */}
          <WizardProgressBar
            currentStep={wizard.currentStep}
            setCurrentStep={wizard.setCurrentStep}
          />

          {/* Success Modal / Banner */}
          {wizard.submitResult && (
            <SuccessBanner
              submitResult={wizard.submitResult}
              isEditMode={wizard.isEditMode}
            />
          )}

          {/* STEP 1: General Info */}
          {wizard.currentStep === 1 && (
            <GeneralInfoStep
              tournamentName={wizard.tournamentName}
              setTournamentName={wizard.setTournamentName}
              organizer={wizard.organizer}
              setOrganizer={wizard.setOrganizer}
              venue={wizard.venue}
              setVenue={wizard.setVenue}
              startDate={wizard.startDate}
              setStartDate={wizard.setStartDate}
              endDate={wizard.endDate}
              setEndDate={wizard.setEndDate}
              courtsCount={wizard.courtsCount}
              setCourtsCount={wizard.setCourtsCount}
              description={wizard.description}
              setDescription={wizard.setDescription}
              totalPrizePool={wizard.totalPrizePool}
              setTotalPrizePool={wizard.setTotalPrizePool}
              contactPhone={wizard.contactPhone}
              setContactPhone={wizard.setContactPhone}
              contactEmail={wizard.contactEmail}
              setContactEmail={wizard.setContactEmail}
              prizeFirst={wizard.prizeFirst}
              setPrizeFirst={wizard.setPrizeFirst}
              prizeSecond={wizard.prizeSecond}
              setPrizeSecond={wizard.setPrizeSecond}
              prizeThird={wizard.prizeThird}
              setPrizeThird={wizard.setPrizeThird}
              bankId={wizard.bankId}
              setBankId={wizard.setBankId}
              accountNumber={wizard.accountNumber}
              setAccountNumber={wizard.setAccountNumber}
              accountHolder={wizard.accountHolder}
              setAccountHolder={wizard.setAccountHolder}
              branch={wizard.branch}
              setBranch={wizard.setBranch}
            />
          )}

          {/* STEP 2: Events & Formats */}
          {wizard.currentStep === 2 && (
            <EventsConfigStep
              events={wizard.events}
              addEvent={wizard.addEvent}
              removeEvent={wizard.removeEvent}
              updateEvent={wizard.updateEvent}
            />
          )}

          {/* STEP 3: Scoring Rules */}
          {wizard.currentStep === 3 && (
            <ScoringRulesStep
              events={wizard.events}
              updateEvent={wizard.updateEvent}
            />
          )}

          {/* STEP 4: Draw & Seeding Rules */}
          {wizard.currentStep === 4 && (
            <DrawRulesStep
              events={wizard.events}
              updateEvent={wizard.updateEvent}
            />
          )}

          {/* Navigation Buttons */}
          <WizardNavigation
            currentStep={wizard.currentStep}
            setCurrentStep={wizard.setCurrentStep}
            isEditMode={wizard.isEditMode}
            isSubmitting={wizard.isSubmitting}
            isLoadingExisting={wizard.isLoadingExisting}
            onSave={wizard.handleSaveTournament}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function CreateTournamentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Đang tải biểu mẫu giải đấu...
        </div>
      }
    >
      <TournamentEditor />
    </Suspense>
  );
}
