'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  FileCheck,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Upload,
  UserPlus,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MockTournament, MockEvent } from '@/data/mockTournaments';
import { holdRegistrationSlot, HoldSlotResult, buildVietQRUrl } from '@/lib/services/registrationService';
import { useParams } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/services/tournamentService';

export default function AthleteRegistrationPrototype() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useLanguage();
  const regT = t.registration;
  const isEn = locale === 'en';

  const [tournament, setTournament] = useState<MockTournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournament() {
      if (!slug) return;
      if (Array.isArray(slug)) return;
      const tour = await getTournamentBySlug(slug);
      setTournament(tour || null);
      setLoading(false);
    }
    loadTournament();
  }, [slug]);

  // Event selection state
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  useEffect(() => {
    if (tournament && tournament.events && tournament.events.length > 0 && !selectedEventId) {
      setSelectedEventId(tournament.events[0].id);
    }
  }, [tournament, selectedEventId]);

  const activeEvent = useMemo<MockEvent | null>(() => {
    if (!tournament) return null;
    return tournament.events.find((e) => e.id === selectedEventId) || tournament.events[0] || null;
  }, [tournament, selectedEventId]);

  const isDoubles = useMemo(() => {
    if (!activeEvent) return true;
    return ['md', 'wd', 'xd'].includes(activeEvent.eventType);
  }, [activeEvent]);

  if (loading) {
    return <div className="min-h-screen p-8 text-center">Loading tournament...</div>;
  }
  if (!tournament) {
    return <div className="min-h-screen p-8 text-center text-red-500">Tournament not found!</div>;
  }

  // Doubles registration mode:
  // 'direct_both' = Representative enters info for both athletes (No invite link required!)
  // 'invite_partner' = Representative enters info for athlete 1, generates invite link/QR for athlete 2
  const [doublesMode, setDoublesMode] = useState<'direct_both' | 'invite_partner'>('direct_both');

  // Athlete 1 (Representative / Primary)
  const [athlete1Name, setAthlete1Name] = useState('Nguyễn Văn A');
  const [athlete1Phone, setAthlete1Phone] = useState('0912345678');
  const [athlete1Email, setAthlete1Email] = useState('nguyenvana@gmail.com');
  const [athlete1Club, setAthlete1Club] = useState('CLB Ba Đình');

  // Athlete 2 (Partner - used in direct_both mode)
  const [athlete2Name, setAthlete2Name] = useState('Lê Hùng');
  const [athlete2Phone, setAthlete2Phone] = useState('0987654321');
  const [athlete2Club, setAthlete2Club] = useState('CLB Ba Đình');

  // Partner status in invite_partner mode
  const [partnerConfirmed, setPartnerConfirmed] = useState(false);

  // Common steps
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holdResult, setHoldResult] = useState<HoldSlotResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reconciliation & VietQR Setup
  const [regRandomId] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());
  const reconciliationCode = useMemo(() => {
    const cleanSlug = (tournament?.slug || 'PROTO').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const tCode = cleanSlug.slice(0, 4) || 'PROT';
    const cleanPhone = athlete1Phone.replace(/[^0-9]/g, '');
    const pSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '9999';
    return `DK ${tCode} ${pSuffix} ${regRandomId}`;
  }, [tournament?.slug, athlete1Phone, regRandomId]);

  const bankAccount = useMemo(() => {
    return tournament?.bankAccount || {
      bankId: 'MB',
      bankName: 'MBBank (Ngân hàng Quân Đội)',
      accountNumber: '0988889999',
      accountHolder: 'BAN TO CHUC GIAI CAU LONG',
      branch: 'Chi nhánh Hà Nội',
    };
  }, [tournament]);

  const vietQrUrl = useMemo(() => {
    const fee = activeEvent?.entryFee || 500000;
    return buildVietQRUrl({
      bankId: bankAccount.bankId,
      accountNumber: bankAccount.accountNumber,
      accountHolder: bankAccount.accountHolder,
      amount: fee,
      reconciliationCode,
    });
  }, [bankAccount, activeEvent?.entryFee, reconciliationCode]);

  const handleCopyField = (val: string, fieldKey: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
        setPaymentUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic Invite URL
  const [inviteUrl, setInviteUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pName = encodeURIComponent(athlete1Name || 'VĐV 1');
      const pClub = encodeURIComponent(athlete1Club || 'CLB');
      setInviteUrl(
        `${window.location.origin}/register/partner-accept?code=PROTO-88219&partner=${pName}&club=${pClub}`
      );
    }
  }, [athlete1Name, athlete1Club]);

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step validations
  const isProfileComplete = Boolean(athlete1Name.trim() && athlete1Phone.trim());
  const isPartnerStepComplete = useMemo(() => {
    if (!isDoubles) return true; // Singles does not require partner
    if (doublesMode === 'direct_both') {
      return Boolean(athlete2Name.trim() && athlete2Phone.trim());
    }
    return partnerConfirmed;
  }, [isDoubles, doublesMode, athlete2Name, athlete2Phone, partnerConfirmed]);

  const canFinalize = isProfileComplete && isPartnerStepComplete && rulesAgreed && paymentUploaded;

  interface BlockerItem {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    action?: React.ReactNode;
  }

  const blockers = useMemo(() => {
    const list: BlockerItem[] = [
      {
        id: 'profile',
        title: regT.stepProfile,
        description: isProfileComplete
          ? `${athlete1Name} (${athlete1Phone})`
          : regT.stepProfileDesc,
        completed: isProfileComplete,
        action: null,
      },
    ];

    if (isDoubles) {
      if (doublesMode === 'direct_both') {
        const hasPartnerInfo = Boolean(athlete2Name.trim() && athlete2Phone.trim());
        list.push({
          id: 'partner',
          title: isEn ? "Partner Profile (Direct)" : "Thông tin đồng đội (Khai trực tiếp)",
          description: hasPartnerInfo
            ? `${athlete2Name} (${athlete2Phone}) - ${regT.directBothCompleteNotice}`
            : (isEn ? "Please enter partner full name & phone number" : "Vui lòng nhập họ tên & SĐT của đồng đội"),
          completed: hasPartnerInfo,
          action: null,
        });
      } else {
        list.push({
          id: 'partner',
          title: regT.stepPartner,
          description: partnerConfirmed
            ? regT.stepPartnerConfirmed
            : regT.stepPartnerPending,
          completed: partnerConfirmed,
          action: (
            <button
              onClick={() => setPartnerConfirmed(!partnerConfirmed)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 transition-colors"
            >
              {partnerConfirmed ? regT.simPartnerCancel : regT.simPartnerConfirm}
            </button>
          ),
        });
      }
    }

    list.push({
      id: 'payment',
      title: regT.stepPayment,
      description: paymentUploaded
        ? `${regT.receiptUploadedSuccess} (${reconciliationCode})`
        : regT.stepPaymentPending,
      completed: paymentUploaded,
      action: (
        <button
          onClick={() => setPaymentUploaded(!paymentUploaded)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
        >
          {paymentUploaded ? regT.simPaymentDelete : regT.simPaymentUpload}
        </button>
      ),
    });

    list.push({
      id: 'rules',
      title: regT.stepRules,
      description: rulesAgreed
        ? regT.stepRulesConfirmed
        : regT.stepRulesPending,
      completed: rulesAgreed,
      action: (
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
          <input
            type="checkbox"
            checked={rulesAgreed}
            onChange={(e) => setRulesAgreed(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
          />
          <span>{regT.agreeRulesCheckbox}</span>
        </label>
      ),
    });

    return list;
  }, [
    regT,
    isEn,
    isProfileComplete,
    athlete1Name,
    athlete1Phone,
    isDoubles,
    doublesMode,
    athlete2Name,
    athlete2Phone,
    partnerConfirmed,
    paymentUploaded,
    rulesAgreed,
    reconciliationCode,
  ]);

  const remainingBlockersCount = blockers.filter((b) => !b.completed).length;

  const handleFinalize = async () => {
    if (!canFinalize || isSubmitting || holdResult?.success) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const teamName = isDoubles
      ? (doublesMode === 'direct_both' ? `${athlete1Name} / ${athlete2Name}` : `${athlete1Name} / Đồng đội`)
      : athlete1Name;

    try {
      const result = await holdRegistrationSlot({
        tournamentId: tournament.id,
        eventId: activeEvent?.id || 'proto-event',
        athleteId: 'proto-user-1',
        athleteName: athlete1Name,
        athletePhone: athlete1Phone,
        athleteEmail: athlete1Email,
        partnerName: isDoubles ? (doublesMode === 'direct_both' ? athlete2Name : null) : null,
        partnerPhone: isDoubles ? (doublesMode === 'direct_both' ? athlete2Phone : null) : null,
        partnerClub: isDoubles ? (doublesMode === 'direct_both' ? athlete2Club : null) : null,
        teamName,
        club: athlete1Club,
        paymentAmount: activeEvent?.entryFee || 500000,
        registrationMode: isDoubles ? doublesMode : 'singles',
        reconciliationCode,
        proofImageUrl: receiptPreview || undefined,
      });

      if (result.success) {
        setHoldResult({
          ...result,
          reconciliationCode,
        });
      } else {
        setSubmitError(result.message || (isEn ? 'Unable to hold registration slot' : 'Không thể giữ chỗ đăng ký'));
      }
    } catch (err: any) {
      setSubmitError(err?.message || (isEn ? 'Database connection error' : 'Lỗi kết nối cơ sở dữ liệu'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/prototypes"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.common.prototypes}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {regT.badge}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Tournament Summary Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {isEn ? tournament.nameEn : tournament.nameVi}
              </span>
              <h1 className="text-xl font-bold text-white mt-1">
                {isEn ? 'Athlete Registration Prototype' : 'Cổng Đăng Ký Vận Động Viên'}
              </h1>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {regT.expiringSoon}
              </span>
            </div>
          </div>

          {/* Real-Time Quota Progress */}
          <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{regT.officialQuota}</span>
              <span className="font-semibold text-white">
                {regT.registered}{' '}
                <strong className="text-cyan-400">{activeEvent?.currentEntries || 0}</strong> / {activeEvent?.maxEntries || 0}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full transition-all duration-300"
                style={{
                  width: `${activeEvent && activeEvent.maxEntries > 0 ? Math.min(100, Math.round((activeEvent.currentEntries / activeEvent.maxEntries) * 100)) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Clock className="w-3 h-3" />{' '}
                {regT.remainingSlots(Math.max(0, (activeEvent?.maxEntries || 0) - (activeEvent?.currentEntries || 0)))}
              </span>
              <span>{regT.reservationTimeLeft}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Event Selector */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {regT.selectEventLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tournament.events.map((evt) => {
              const isSelected = evt.id === activeEvent?.id;
              const isEvtDoubles = ['md', 'wd', 'xd'].includes(evt.eventType);
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setHoldResult(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-cyan-300' : 'text-slate-400'
                      }`}
                    >
                      {isEn ? 'Tournament Event' : 'Nội dung thi đấu'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isEvtDoubles
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isEvtDoubles ? (isEn ? 'Doubles' : 'Đôi') : (isEn ? 'Singles' : 'Đơn')}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {isEn ? evt.nameEn : evt.nameVi}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>
                      {evt.currentEntries}/{evt.maxEntries} {isEn ? 'teams' : 'đội'}
                    </span>
                    <span className="font-semibold text-cyan-400">
                      {new Intl.NumberFormat('vi-VN').format(evt.entryFee)} đ
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Singles vs Doubles Form Logic */}
        {!isDoubles ? (
          // Singles Notice & Form
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <User className="w-5 h-5" />
              <span>{regT.singlesEventNotice}</span>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {regT.athlete1Title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.fullNameLabel} *</label>
                  <input
                    type="text"
                    value={athlete1Name}
                    onChange={(e) => setAthlete1Name(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.phoneLabel} *</label>
                  <input
                    type="tel"
                    value={athlete1Phone}
                    onChange={(e) => setAthlete1Phone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.emailLabel}</label>
                  <input
                    type="email"
                    value={athlete1Email}
                    onChange={(e) => setAthlete1Email(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.clubLabel}</label>
                  <input
                    type="text"
                    value={athlete1Club}
                    onChange={(e) => setAthlete1Club(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Doubles Form with Mode Selection
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                {regT.doublesModeTitle}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDoublesMode('direct_both')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    doublesMode === 'direct_both'
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">{regT.modeDirectBoth}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {regT.modeDirectBothDesc}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDoublesMode('invite_partner')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    doublesMode === 'invite_partner'
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">{regT.modeInvitePartner}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {regT.modeInvitePartnerDesc}
                  </p>
                </button>
              </div>
            </div>

            {/* Athlete 1 Form (Representative) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                {regT.athlete1Title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.fullNameLabel} *</label>
                  <input
                    type="text"
                    value={athlete1Name}
                    onChange={(e) => setAthlete1Name(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.phoneLabel} *</label>
                  <input
                    type="tel"
                    value={athlete1Phone}
                    onChange={(e) => setAthlete1Phone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.emailLabel}</label>
                  <input
                    type="email"
                    value={athlete1Email}
                    onChange={(e) => setAthlete1Email(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{regT.clubLabel}</label>
                  <input
                    type="text"
                    value={athlete1Club}
                    onChange={(e) => setAthlete1Club(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Athlete 2: Direct Entry Mode vs Invite Mode */}
            {doublesMode === 'direct_both' ? (
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/10 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    {regT.athlete2Title}
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {regT.directBothCompleteNotice}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{regT.fullNameLabel} *</label>
                    <input
                      type="text"
                      value={athlete2Name}
                      onChange={(e) => setAthlete2Name(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{regT.phoneLabel} *</label>
                    <input
                      type="tel"
                      value={athlete2Phone}
                      onChange={(e) => setAthlete2Phone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">{regT.clubLabel}</label>
                    <input
                      type="text"
                      value={athlete2Club}
                      onChange={(e) => setAthlete2Club(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Invite Partner QR & Link Mode */
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">
                    {regT.invitePartnerTitle}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {regT.invitePartnerDesc}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                    <QRCodeSVG value={inviteUrl || 'https://tournament-hub.vn'} size={110} />
                  </div>

                  <div className="space-y-3 w-full">
                    <div className="text-xs font-medium text-slate-300">
                      {regT.inviteUrlLabel}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 select-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 active:scale-95 transition-all"
                        title={t.common.copy}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> {t.common.copied}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> {t.common.copy}
                          </>
                        )}
                      </button>
                      <Link
                        href={inviteUrl || '#'}
                        target="_blank"
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold transition-all"
                        title={isEn ? "Open partner confirmation test" : "Mở thử nghiệm trang xác nhận đối tác"}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isEn ? 'Open Test' : 'Mở thử'}</span>
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {regT.inviteUrlHelp}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VietQR Payment & Reconciliation Interactive Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                {regT.vietQrPaymentTitle}
              </h2>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Napas247 / VietQR
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {regT.vietQrPaymentDesc}
          </p>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* VietQR Image with SVG fallback */}
              <div className="p-2.5 bg-white rounded-xl shadow-lg shrink-0 text-center">
                <img
                  src={vietQrUrl}
                  alt="VietQR"
                  className="w-36 h-auto rounded-lg mx-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.getElementById('proto-qr-svg-fallback');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div id="proto-qr-svg-fallback" style={{ display: 'none' }} className="p-1">
                  <QRCodeSVG value={vietQrUrl} size={144} />
                </div>
              </div>

              {/* Details and Copy Actions */}
              <div className="space-y-2.5 w-full text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{regT.beneficiaryBank}</span>
                    <span className="font-bold text-white">{bankAccount.bankName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                    {bankAccount.bankId}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{regT.accountNumberLabel}</span>
                    <span className="font-mono font-bold text-cyan-300">{bankAccount.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyField(bankAccount.accountNumber, 'proto-stk')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'proto-stk' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'proto-stk' ? t.common.copied : t.common.copy}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{regT.paymentAmountLabel}</span>
                    <span className="font-bold text-amber-400">
                      {new Intl.NumberFormat('vi-VN').format(activeEvent?.entryFee || 500000)} đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyField((activeEvent?.entryFee || 500000).toString(), 'proto-amount')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'proto-amount' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'proto-amount' ? t.common.copied : t.common.copy}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-300 uppercase">
                      {regT.reconciliationCodeLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField(reconciliationCode, 'proto-memo')}
                      className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold hover:bg-amber-400 flex items-center gap-1 transition-colors"
                    >
                      {copiedField === 'proto-memo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'proto-memo' ? t.common.copied : t.common.copy}</span>
                    </button>
                  </div>
                  <div className="text-sm font-black font-mono text-white bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                    {reconciliationCode}
                  </div>
                  <p className="text-[10px] text-amber-200/80">
                    {regT.reconciliationNotice}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Upload & Preview in Prototype */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  {regT.uploadReceiptButton}
                </span>
                {paymentUploaded && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {regT.receiptUploadedSuccess}
                  </span>
                )}
              </div>

              {receiptPreview ? (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={receiptPreview} alt="Receipt" className="w-10 h-10 object-cover rounded border border-slate-700" />
                    <span className="text-xs text-white font-mono">{reconciliationCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptPreview(null);
                      setPaymentUploaded(false);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded border border-rose-500/30"
                  >
                    {regT.changeReceipt}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/40 text-xs text-slate-300">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{regT.uploadReceiptButton}</span>
                    <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptPreview('/qr-receipt-mock.png');
                      setPaymentUploaded(true);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-slate-700"
                  >
                    {isEn ? '⚡ Simulate Receipt' : '⚡ Nạp ảnh mẫu'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Why can't I finalize? Checklist (Blockers transparency) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                {regT.progressTitle(blockers.length - remainingBlockersCount, blockers.length)}
              </h2>
            </div>
            {remainingBlockersCount > 0 ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {regT.stepsRemaining(remainingBlockersCount)}
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {regT.readyToSubmit}
              </span>
            )}
          </div>

          {remainingBlockersCount > 0 && (
            <div className="rounded-xl bg-rose-950/20 border border-rose-900/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">
                  {regT.whyCannotFinalize}
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-rose-300/90 text-[11px]">
                  {!isProfileComplete && (
                    <li>{isEn ? 'Missing Athlete 1 profile information' : 'Chưa điền đủ thông tin VĐV 1'}</li>
                  )}
                  {isDoubles && !isPartnerStepComplete && <li>{regT.partnerMissingWarning}</li>}
                  {!paymentUploaded && <li>{regT.paymentMissingWarning}</li>}
                  {!rulesAgreed && <li>{regT.rulesMissingWarning}</li>}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {blockers.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.completed
                    ? 'border-emerald-500/20 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center text-[10px] text-slate-400">
                          !
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p
                        className={`text-sm font-semibold ${
                          item.completed ? 'text-emerald-300' : 'text-slate-200'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
                {item.action && (
                  <div className="mt-3 pl-8 flex items-center gap-2">{item.action}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-xs font-semibold">{submitError}</span>
          </div>
        )}

        {/* Successful Finalization Card */}
        {holdResult && (
          <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-emerald-300">
              {holdResult.registrationId
                ? `${isEn ? 'Reservation Reference' : 'Mã giữ chỗ'}: #${holdResult.registrationId.slice(0, 8)}`
                : regT.successMessage}
            </h3>

            {/* Prominent Reconciliation Code Card */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold uppercase tracking-wider">
                  {regT.reconciliationCodeLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyField(holdResult.reconciliationCode || reconciliationCode, 'memo-success')}
                  className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 flex items-center gap-1 transition-colors"
                >
                  {copiedField === 'memo-success' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'memo-success' ? t.common.copied : t.common.copy}</span>
                </button>
              </div>
              <div className="text-base font-black font-mono text-white tracking-widest bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                {holdResult.reconciliationCode || reconciliationCode}
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                {isEn
                  ? 'Please show this reconciliation code or payment receipt at the check-in desk on tournament day.'
                  : 'Vui lòng lưu lại mã đối soát hoặc ảnh biên lai để đối chiếu khi làm thủ tục điểm danh thi đấu.'}
              </p>
            </div>

            <p className="text-xs text-slate-300">
              {isEn
                ? `Successfully reserved slot for ${activeEvent?.nameEn || 'Event'} (${isDoubles && doublesMode === 'direct_both' ? 'Direct Entry' : 'Standard'})`
                : `Đã giữ chỗ thành công cho nội dung ${activeEvent?.nameVi || 'Sự kiện'} (${isDoubles && doublesMode === 'direct_both' ? 'Khai trực tiếp 2 VĐV' : 'Chuẩn'})`}
            </p>
            {holdResult.expiresAt && (
              <p className="text-xs text-emerald-400/90 font-mono">
                {isEn ? 'Slot reserved until:' : 'Suất đăng ký được giữ đến:'}{' '}
                {new Date(holdResult.expiresAt).toLocaleTimeString()}
              </p>
            )}
            {typeof holdResult.remainingSlots === 'number' && (
              <p className="text-xs text-slate-400">
                {regT.remainingSlots(holdResult.remainingSlots)}
              </p>
            )}
          </div>
        )}

        {/* Direct Link to Real Tournament Registration */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>{isEn ? 'Looking for real tournament registration?' : 'Bạn muốn thử trang đăng ký thực tế?'}</span>
          <Link
            href={`/tournaments/${tournament.slug}/register`}
            className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
          >
            {isEn ? 'Go to tournament registration' : 'Đến trang đăng ký chính thức'} &rarr;
          </Link>
        </div>
      </main>

      {/* Sticky Bottom Operational Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">{t.common.status}:</div>
            <div className="text-sm font-bold text-white">
              {canFinalize ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {regT.statusReady}
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {regT.statusWaiting(remainingBlockersCount)}
                </span>
              )}
            </div>
          </div>

          <button
            disabled={!canFinalize || holdResult?.success || isSubmitting}
            onClick={handleFinalize}
            className={`px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
              canFinalize && !holdResult?.success && !isSubmitting
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-cyan-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                {isEn ? 'Holding Slot...' : 'Đang giữ chỗ...'}
              </span>
            ) : holdResult?.success ? (
              regT.finalizedSuccess
            ) : (
              regT.finalizeButton
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
