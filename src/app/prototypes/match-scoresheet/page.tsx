'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  Award,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getMatchQueue, getCourts, QueueMatchItem } from '@/lib/services/dispatcherService';

interface ScoresheetDetail {
  matchNumber: number;
  courtName: string;
  roundName: string;
  eventCategory: string;
  tournamentName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  umpireName: string;
  serviceJudgeName: string;
  refereeName: string;
  teamA: {
    players: string[];
    club: string;
  };
  teamB: {
    players: string[];
    club: string;
  };
  scores: {
    set1: { a: number; b: number; duration: number };
    set2: { a: number; b: number; duration: number };
    set3?: { a: number; b: number; duration: number };
  };
  setsA: number;
  setsB: number;
  winner: 'A' | 'B';
  winnerName: string;
  cards: {
    team: 'A' | 'B';
    player: string;
    cardType: 'yellow' | 'red' | 'black';
    reason: string;
    set: number;
  }[];
}

function MatchScoresheetContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const matchParam = searchParams?.get('matchId');
  const courtParam = searchParams?.get('court');

  const [availableMatches, setAvailableMatches] = useState<QueueMatchItem[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matchParam || 'disp-m-1');

  // Load matches from dispatcher
  useEffect(() => {
    async function loadData() {
      const queue = await getMatchQueue();
      setAvailableMatches(queue);

      if (matchParam) {
        setSelectedMatchId(matchParam);
      } else if (courtParam) {
        const courts = await getCourts();
        const court = courts.find((c) => String(c.courtNumber) === courtParam);
        if (court?.currentMatch) {
          setSelectedMatchId(court.currentMatch.id);
        }
      }
    }
    loadData();
  }, [matchParam, courtParam]);

  const activeMatch = availableMatches.find((m) => m.id === selectedMatchId) || availableMatches[0];

  // Derive detailed printable sheet data
  const sheet: ScoresheetDetail = React.useMemo(() => {
    const isCompleted = activeMatch?.status === 'completed';
    const scoreA = activeMatch?.currentScoreA ?? 21;
    const scoreB = activeMatch?.currentScoreB ?? 19;
    const setsA = activeMatch?.setsA ?? (scoreA > scoreB ? 2 : 1);
    const setsB = activeMatch?.setsB ?? (scoreA > scoreB ? 1 : 2);
    const winner: 'A' | 'B' = setsA > setsB ? 'A' : 'B';

    const teamAName = activeMatch?.teamA || 'Nguyễn Văn A / Lê Hùng';
    const teamBName = activeMatch?.teamB || 'Trần Thị B / Mai Lan';

    return {
      matchNumber: activeMatch?.matchNumber ?? 1,
      courtName: activeMatch?.courtInfo ?? 'Sân 1 (Thảm Victor)',
      roundName: activeMatch?.roundName ?? 'Chung Kết',
      eventCategory: activeMatch?.eventCategory ?? 'Đôi Nam Phong Trào Hạng B',
      tournamentName:
        locale === 'vi'
          ? 'GIẢI CẦU LÔNG MỞ RỘNG TOÀN QUỐC 2026'
          : 'NATIONAL OPEN BADMINTON CHAMPIONSHIP 2026',
      date: new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      startTime: '09:15',
      endTime: isCompleted ? '10:05' : 'Đang thi đấu',
      durationMinutes: 50,
      umpireName: 'Hoàng Đình Khoa (Trọng tài Quốc Gia)',
      serviceJudgeName: 'Phạm Minh Tuấn',
      refereeName: 'Nguyễn Tiến Minh (Tổng trọng tài)',
      teamA: {
        players: teamAName.includes('/')
          ? teamAName.split('/').map((s) => s.trim())
          : [teamAName],
        club: activeMatch?.clubA || 'CLB Cầu Lông Ba Đình',
      },
      teamB: {
        players: teamBName.includes('/')
          ? teamBName.split('/').map((s) => s.trim())
          : [teamBName],
        club: activeMatch?.clubB || 'CLB Cầu Lông Cầu Giấy',
      },
      scores: {
        set1: { a: 21, b: 19, duration: 18 },
        set2: { a: 18, b: 21, duration: 19 },
        set3: { a: scoreA, b: scoreB, duration: 13 },
      },
      setsA,
      setsB,
      winner,
      winnerName: winner === 'A' ? teamAName : teamBName,
      cards: [
        {
          team: 'B',
          player: teamBName.split('/')[0] || teamBName,
          cardType: 'yellow',
          reason: 'Trì hoãn thời gian giao cầu quá 10 giây',
          set: 2,
        },
      ],
    };
  }, [activeMatch, locale]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col print:bg-white print:text-black">
      {/* SCREEN CONTROLS BAR (Hidden on Print) */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/prototypes/court-dispatcher"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Bàn Điều Phối</span>
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Chọn trận:</span>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-900 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                {availableMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    Trận #{m.matchNumber} ({m.roundName}) - {m.teamA.split('/')[0]} vs {m.teamB.split('/')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-md shadow-cyan-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên Bản (Print / PDF)</span>
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* MAIN DOCUMENT VIEW (Preview on Screen / Direct Print on Paper) */}
      <main className="flex-1 p-4 sm:p-8 flex items-center justify-center print:p-0">
        {/* A4 PAPER CONTAINER */}
        <div className="w-full max-w-[210mm] bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm print:shadow-none print:p-6 print:max-w-none print:m-0 border border-slate-300 print:border-none font-serif leading-tight">
          {/* HEADER: TOURNAMENT & DOCUMENT TITLE */}
          <div className="text-center pb-4 border-b-2 border-black space-y-1">
            <div className="text-xs font-sans uppercase font-bold tracking-widest text-slate-600 print:text-black">
              LIÊN ĐOÀN CẦU LÔNG / BADMINTON TOURNAMENT PLATFORM
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-sans">
              {sheet.tournamentName}
            </h1>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-800 print:text-black font-sans">
              BIÊN BẢN KẾT QUẢ THI ĐẤU CHÍNH THỨC
            </h2>
            <p className="text-[11px] font-sans italic text-slate-500 print:text-black">
              (Official BWF Match Scoresheet & Result Form)
            </p>
          </div>

          {/* METADATA GRID TABLE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 text-xs font-sans border border-black p-3 bg-slate-50/50 print:bg-transparent">
            <div>
              <span className="font-bold text-slate-600 print:text-black">Nội Dung / Event:</span>
              <div className="font-bold text-sm text-black">{sheet.eventCategory}</div>
            </div>
            <div>
              <span className="font-bold text-slate-600 print:text-black">Vòng Đấu / Round:</span>
              <div className="font-bold text-sm text-black">{sheet.roundName} (Trận #{sheet.matchNumber})</div>
            </div>
            <div>
              <span className="font-bold text-slate-600 print:text-black">Sân Đấu / Court:</span>
              <div className="font-bold text-sm text-black">{sheet.courtName}</div>
            </div>
            <div>
              <span className="font-bold text-slate-600 print:text-black">Thời Gian / Time:</span>
              <div className="font-bold text-sm text-black">{sheet.startTime} - {sheet.endTime} ({sheet.durationMinutes}&apos;)</div>
            </div>
          </div>

          {/* OFFICIALS TABLE */}
          <div className="my-3 text-xs font-sans border-b border-black pb-2 flex flex-wrap justify-between gap-4">
            <div>
              <span className="text-slate-600 print:text-black">Trọng tài chính (Umpire):</span>{' '}
              <strong className="text-black">{sheet.umpireName}</strong>
            </div>
            <div>
              <span className="text-slate-600 print:text-black">Trọng tài giao cầu (Service Judge):</span>{' '}
              <strong className="text-black">{sheet.serviceJudgeName}</strong>
            </div>
            <div>
              <span className="text-slate-600 print:text-black">Tổng trọng tài (Referee):</span>{' '}
              <strong className="text-black">{sheet.refereeName}</strong>
            </div>
          </div>

          {/* TEAMS & SCORES BREAKDOWN TABLE */}
          <div className="my-4">
            <table className="w-full text-xs font-sans border-collapse border border-black text-center">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-black p-2 text-left w-12">Bên</th>
                  <th className="border border-black p-2 text-left">Họ Tên Vận Động Viên (Athletes)</th>
                  <th className="border border-black p-2 text-left">CLB / Đơn Vị</th>
                  <th className="border border-black p-2 w-16">Set 1</th>
                  <th className="border border-black p-2 w-16">Set 2</th>
                  <th className="border border-black p-2 w-16">Set 3</th>
                  <th className="border border-black p-2 w-16 bg-slate-200 print:bg-slate-300 font-black">
                    Tổng Set
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Team A */}
                <tr className={sheet.winner === 'A' ? 'font-bold bg-emerald-50/30 print:bg-transparent' : ''}>
                  <td className="border border-black p-2 text-left font-black">1</td>
                  <td className="border border-black p-2 text-left font-semibold">
                    {sheet.teamA.players.map((p, idx) => (
                      <div key={idx} className="leading-snug">
                        {p}
                      </div>
                    ))}
                  </td>
                  <td className="border border-black p-2 text-left text-slate-700 print:text-black">
                    {sheet.teamA.club}
                  </td>
                  <td className="border border-black p-2 font-mono text-sm">{sheet.scores.set1.a}</td>
                  <td className="border border-black p-2 font-mono text-sm">{sheet.scores.set2.a}</td>
                  <td className="border border-black p-2 font-mono text-sm">
                    {sheet.scores.set3 ? sheet.scores.set3.a : '-'}
                  </td>
                  <td className="border border-black p-2 font-mono text-base font-black bg-slate-100 print:bg-slate-200">
                    {sheet.setsA}
                  </td>
                </tr>

                {/* Team B */}
                <tr className={sheet.winner === 'B' ? 'font-bold bg-emerald-50/30 print:bg-transparent' : ''}>
                  <td className="border border-black p-2 text-left font-black">2</td>
                  <td className="border border-black p-2 text-left font-semibold">
                    {sheet.teamB.players.map((p, idx) => (
                      <div key={idx} className="leading-snug">
                        {p}
                      </div>
                    ))}
                  </td>
                  <td className="border border-black p-2 text-left text-slate-700 print:text-black">
                    {sheet.teamB.club}
                  </td>
                  <td className="border border-black p-2 font-mono text-sm">{sheet.scores.set1.b}</td>
                  <td className="border border-black p-2 font-mono text-sm">{sheet.scores.set2.b}</td>
                  <td className="border border-black p-2 font-mono text-sm">
                    {sheet.scores.set3 ? sheet.scores.set3.b : '-'}
                  </td>
                  <td className="border border-black p-2 font-mono text-base font-black bg-slate-100 print:bg-slate-200">
                    {sheet.setsB}
                  </td>
                </tr>

                {/* Duration row */}
                <tr className="text-[11px] text-slate-500 print:text-black italic">
                  <td colSpan={3} className="border border-black p-1 text-right font-medium">
                    Thời lượng từng set (phút):
                  </td>
                  <td className="border border-black p-1">{sheet.scores.set1.duration}&apos;</td>
                  <td className="border border-black p-1">{sheet.scores.set2.duration}&apos;</td>
                  <td className="border border-black p-1">
                    {sheet.scores.set3 ? `${sheet.scores.set3.duration}'` : '-'}
                  </td>
                  <td className="border border-black p-1 font-bold">{sheet.durationMinutes}&apos;</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* OFFICIAL WINNER BANNER */}
          <div className="p-3 my-3 border-2 border-black bg-slate-100/70 print:bg-transparent flex items-center justify-between font-sans">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-black shrink-0" />
              <div className="text-xs">
                <span className="uppercase font-bold text-slate-600 print:text-black">
                  ĐỘI CHIẾN THẮNG (WINNER):
                </span>
                <div className="text-sm font-black text-black uppercase">
                  {sheet.winnerName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 print:text-black block">Tỷ số chung cuộc</span>
              <span className="text-base font-black font-mono">
                {sheet.setsA} - {sheet.setsB}
              </span>
            </div>
          </div>

          {/* DISCIPLINARY / INCIDENT REPORT */}
          <div className="my-3 text-xs font-sans">
            <div className="font-bold uppercase tracking-wider text-slate-700 print:text-black mb-1 border-b border-black pb-0.5">
              Ghi Nhận Kỷ Luật & Lỗi Kỹ Thuật (Disciplinary & Fault Log)
            </div>
            {sheet.cards.length === 0 ? (
              <p className="italic text-slate-500 print:text-black text-[11px]">
                Không có thẻ phạt hoặc sự cố kỹ thuật nào phát sinh trong trận đấu.
              </p>
            ) : (
              <table className="w-full border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200 text-left">
                    <th className="border border-black p-1 w-20">Loại Thẻ</th>
                    <th className="border border-black p-1">VĐV Vi Phạm</th>
                    <th className="border border-black p-1">Lý Do Vi Phạm Theo Luật BWF</th>
                    <th className="border border-black p-1 w-16 text-center">Tại Set</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.cards.map((c, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-1 font-bold uppercase">
                        {c.cardType === 'yellow'
                          ? 'Thẻ Vàng'
                          : c.cardType === 'red'
                          ? 'Thẻ Đỏ'
                          : 'Thẻ Đen'}
                      </td>
                      <td className="border border-black p-1 font-medium">{c.player}</td>
                      <td className="border border-black p-1">{c.reason}</td>
                      <td className="border border-black p-1 text-center font-mono">Set {c.set}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* SIGNATURES SECTION */}
          <div className="mt-8 pt-4 border-t border-black font-sans">
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div className="space-y-12">
                <div className="font-bold">Đại Diện Đội 1</div>
                <div className="text-[10px] text-slate-400 print:text-slate-600">(Ký & ghi rõ họ tên)</div>
              </div>
              <div className="space-y-12">
                <div className="font-bold">Đại Diện Đội 2</div>
                <div className="text-[10px] text-slate-400 print:text-slate-600">(Ký & ghi rõ họ tên)</div>
              </div>
              <div className="space-y-12">
                <div className="font-bold">Trọng Tài Chính</div>
                <div className="text-[10px] text-slate-400 print:text-slate-600">{sheet.umpireName}</div>
              </div>
              <div className="space-y-12">
                <div className="font-bold">Tổng Trọng Tài</div>
                <div className="text-[10px] text-slate-400 print:text-slate-600">{sheet.refereeName}</div>
              </div>
            </div>

            <div className="mt-8 text-[10px] text-center text-slate-500 print:text-black italic">
              Biên bản được lập thành 02 bản có giá trị pháp lý như nhau: 01 bản lưu hồ sơ Ban Tổ Chức, 01 bản công bố kết quả thi đấu.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MatchScoresheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">Loading scoresheet...</div>}>
      <MatchScoresheetContent />
    </Suspense>
  );
}
