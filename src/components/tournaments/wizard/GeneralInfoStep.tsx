'use client';

import React from 'react';
import {
  Trophy,
  MapPin,
  Calendar,
  Award,
  PhoneCall,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/i18n';
import { SUPPORTED_BANKS } from '@/data/mockTournaments';
import { TournamentWizardState } from './types';

type GeneralInfoStepProps = Pick<
  TournamentWizardState,
  | 'tournamentName'
  | 'setTournamentName'
  | 'organizer'
  | 'setOrganizer'
  | 'venue'
  | 'setVenue'
  | 'startDate'
  | 'setStartDate'
  | 'endDate'
  | 'setEndDate'
  | 'courtsCount'
  | 'setCourtsCount'
  | 'description'
  | 'setDescription'
  | 'totalPrizePool'
  | 'setTotalPrizePool'
  | 'contactPhone'
  | 'setContactPhone'
  | 'contactEmail'
  | 'setContactEmail'
  | 'prizeFirst'
  | 'setPrizeFirst'
  | 'prizeSecond'
  | 'setPrizeSecond'
  | 'prizeThird'
  | 'setPrizeThird'
  | 'bankId'
  | 'setBankId'
  | 'accountNumber'
  | 'setAccountNumber'
  | 'accountHolder'
  | 'setAccountHolder'
  | 'branch'
  | 'setBranch'
>;

export function GeneralInfoStep(props: GeneralInfoStepProps) {
  const { t } = useLanguage();
  const cT = t.adminCreator;

  return (
    <div className="space-y-6 bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-2xl">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        {cT.step1Title}: {cT.step1Desc}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            {cT.tournamentNameLabel} *
          </label>
          <input
            type="text"
            value={props.tournamentName}
            onChange={(e) => props.setTournamentName(e.target.value)}
            placeholder={cT.tournamentNamePlaceholder}
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Đơn vị tổ chức
          </label>
          <input
            type="text"
            value={props.organizer}
            onChange={(e) => props.setOrganizer(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            {cT.venueLabel} *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={props.venue}
              onChange={(e) => props.setVenue(e.target.value)}
              placeholder={cT.venuePlaceholder}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            {cT.courtsCountLabel}
          </label>
          <input
            type="number"
            min={1}
            max={24}
            value={props.courtsCount}
            onChange={(e) =>
              props.setCourtsCount(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            {cT.startDateLabel} *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="date"
              value={props.startDate}
              onChange={(e) => props.setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            {cT.endDateLabel} *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="date"
              value={props.endDate}
              onChange={(e) => props.setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">
          Mô tả & Ghi chú điều lệ
        </label>
        <textarea
          rows={3}
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
        />
      </div>

      {/* Prize Pool & Contact Information */}
      <div className="pt-5 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Giải Thưởng & Thông Tin Liên Hệ Ban Tổ Chức
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự do thiết lập tổng quỹ tiền thưởng và hotline chính thức của giải đấu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Tổng giá trị giải thưởng (VNĐ)
            </label>
            <input
              type="number"
              min={0}
              step={500000}
              value={props.totalPrizePool}
              onChange={(e) =>
                props.setTotalPrizePool(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              placeholder="0 nếu chỉ trao cúp/huy chương"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Nhập 0 nếu giải phong trào không có tiền mặt.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Hotline liên hệ BTC *
            </label>
            <div className="relative">
              <PhoneCall className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={props.contactPhone}
                onChange={(e) => props.setContactPhone(e.target.value)}
                placeholder="VD: 0988 123 456"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Hiển thị ở mục hỗ trợ VĐV & điểm danh.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Email liên hệ (Tùy chọn)
            </label>
            <input
              type="email"
              value={props.contactEmail}
              onChange={(e) => props.setContactEmail(e.target.value)}
              placeholder="VD: btc.caulong@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Tiếp nhận khiếu nại & văn bản.
            </p>
          </div>
        </div>

        {/* Prize Details per Place */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-300">
              Phần thưởng Giải Nhất
            </label>
            <input
              type="text"
              value={props.prizeFirst}
              onChange={(e) => props.setPrizeFirst(e.target.value)}
              placeholder="VD: Cúp + Huy chương Vàng + 5.000.000đ"
              className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Phần thưởng Giải Nhì
            </label>
            <input
              type="text"
              value={props.prizeSecond}
              onChange={(e) => props.setPrizeSecond(e.target.value)}
              placeholder="VD: Huy chương Bạc + 3.000.000đ"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-orange-300">
              Phần thưởng Đồng Giải Ba
            </label>
            <input
              type="text"
              value={props.prizeThird}
              onChange={(e) => props.setPrizeThird(e.target.value)}
              placeholder="VD: Huy chương Đồng + 1.500.000đ"
              className="w-full bg-slate-950 border border-orange-500/40 focus:border-orange-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bank Account Settings for VietQR */}
      <div className="pt-5 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              {cT.bankAccountSectionTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {cT.bankAccountSectionDesc}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
            Napas247 / VietQR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {cT.selectBankLabel} *
            </label>
            <select
              value={props.bankId}
              onChange={(e) => props.setBankId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
            >
              {SUPPORTED_BANKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {cT.accountNumberLabel} *
            </label>
            <input
              type="text"
              value={props.accountNumber}
              onChange={(e) => props.setAccountNumber(e.target.value.replace(/\s+/g, ''))}
              placeholder="0988889999"
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {cT.accountHolderLabel} *
            </label>
            <input
              type="text"
              value={props.accountHolder}
              onChange={(e) => props.setAccountHolder(e.target.value.toUpperCase())}
              placeholder="BAN TO CHUC GIAI CAU LONG"
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-sm text-white uppercase outline-none transition-colors"
            />
          </div>
        </div>

        {/* VietQR Preview Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
          <div className="p-2.5 bg-white rounded-xl shadow-lg shrink-0">
            <QRCodeSVG
              value={`https://img.vietqr.io/image/${props.bankId}-${props.accountNumber}-compact2.png?amount=500000&addInfo=DK%20DEMO%201234&accountName=${encodeURIComponent(
                props.accountHolder
              )}`}
              size={90}
            />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              {cT.vietQrPreviewTitle}
            </div>
            <p className="text-slate-300">
              {SUPPORTED_BANKS.find((b) => b.id === props.bankId)?.shortName} • STK:{' '}
              <span className="font-mono font-bold text-white">
                {props.accountNumber || '---'}
              </span>
            </p>
            <p className="text-slate-400">
              Chủ TK:{' '}
              <span className="font-semibold text-slate-200">
                {props.accountHolder || '---'}
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              Nội dung chuyển khoản sẽ được tự động sinh theo mã đối soát (Ví dụ:{' '}
              <code className="text-cyan-400 font-mono">DK HN26 5678 8B2F</code>) khi VĐV đăng ký.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
