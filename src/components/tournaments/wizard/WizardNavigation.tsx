'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface WizardNavigationProps {
  currentStep: 1 | 2 | 3 | 4;
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void;
  isEditMode: boolean;
  isSubmitting: boolean;
  isLoadingExisting: boolean;
  onSave: () => void;
}

export function WizardNavigation({
  currentStep,
  setCurrentStep,
  isEditMode,
  isSubmitting,
  isLoadingExisting,
  onSave,
}: WizardNavigationProps) {
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const cT = t.adminCreator;

  return (
    <div className="flex items-center justify-between mt-8">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={() => setCurrentStep((currentStep - 1) as any)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {cT.prevStep}
        </button>
      ) : (
        <div />
      )}

      {currentStep < 4 ? (
        <button
          type="button"
          onClick={() => setCurrentStep((currentStep + 1) as any)}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          {cT.nextStep}
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting || isLoadingExisting}
          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Trophy className="w-4 h-4" />
          {isSubmitting
            ? isEditMode
              ? isEn
                ? 'Saving Changes...'
                : 'Đang Lưu Cập Nhật...'
              : cT.savingButton
            : isEditMode
            ? isEn
              ? 'Save Changes'
              : 'Lưu Thay Đổi Giải Đấu'
            : cT.saveTournamentButton}
        </button>
      )}
    </div>
  );
}
