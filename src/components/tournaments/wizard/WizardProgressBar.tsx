'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface WizardProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void;
}

export function WizardProgressBar({ currentStep, setCurrentStep }: WizardProgressBarProps) {
  const { t } = useLanguage();
  const cT = t.adminCreator;

  const steps = [
    { step: 1 as const, title: cT.step1Title, desc: cT.step1Desc },
    { step: 2 as const, title: cT.step2Title, desc: cT.step2Desc },
    { step: 3 as const, title: cT.step3Title, desc: cT.step3Desc },
    { step: 4 as const, title: cT.step4Title, desc: cT.step4Desc },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {steps.map((item) => (
        <button
          key={item.step}
          type="button"
          onClick={() => setCurrentStep(item.step)}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            currentStep === item.step
              ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 shadow-lg shadow-emerald-950/50'
              : currentStep > item.step
              ? 'border-slate-700 bg-slate-900/50 text-slate-300'
              : 'border-slate-800/80 bg-slate-900/20 text-slate-500'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{item.title}</span>
            {currentStep > item.step && (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="text-[11px] leading-tight truncate">{item.desc}</div>
        </button>
      ))}
    </div>
  );
}
