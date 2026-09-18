import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DrawHeader } from './DrawHeader';
import React from 'react';

vi.mock('@/i18n/context', () => ({
  useLanguage: () => ({
    t: {
      draw: { title: 'Draw title' }, drawHeader: {
        selectedTournament: 'Giải đấu đang bốc thăm:',
        eventCategory: 'Nội dung thi đấu:',
        viewRoster: 'Xem danh sách VĐV',
        autoDraw: 'Bốc Thăm Tự Động',
        manualPlacement: 'Xếp Thăm Thủ Công',
        teams: 'Đội',
        allRegistered: 'Tất cả VĐV đăng ký'
      }
    }
  })
}));

describe('DrawHeader', () => {
  it('renders translations and mock data', () => {
    const mockTournament = {
      id: '1',
      slug: 'test',
      nameVi: 'Test Tournament',
      events: []
    } as any;
    
    render(
      <DrawHeader 
        currentTournament={mockTournament}
        tournaments={[]}
        selectedTournamentSlug="test"
        onSelectTournament={() => {}}
        currentEvent={null}
        eventsList={[]}
        selectedEventId=""
        onSelectEvent={() => {}}
        drawMode="auto"
        setDrawMode={() => {}}
        teamCount={8}
        setTeamCount={() => {}}
      />
    );
    expect(screen.getByText('Giải đấu đang bốc thăm:')).toBeInTheDocument();
  });
});
