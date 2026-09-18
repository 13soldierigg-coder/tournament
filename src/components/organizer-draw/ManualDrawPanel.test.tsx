import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ManualDrawPanel } from './ManualDrawPanel';
import React from 'react';

// Mock the language context
vi.mock('@/i18n/context', () => ({
  useLanguage: () => ({
    t: {
      manualDraw: {
        title: 'Nhập Kết Quả Bốc Thăm Thủ Công',
        desc: 'Gán trực tiếp từng đội hoặc VĐV vào vị trí bảng đấu theo kết quả bốc thăm trực tiếp tại buổi họp kỹ thuật.'
      }
    }
  })
}));

describe('ManualDrawPanel', () => {
  it('renders title from i18n', () => {
    render(
      <ManualDrawPanel 
        activeTab="groups" 
        participants={[]} 
        onAssignSlot={() => {}}
        onAutoFill={() => {}}
        onBwfSeeds={() => {}}
      />
    );
    expect(screen.getByText('Nhập Kết Quả Bốc Thăm Thủ Công')).toBeInTheDocument();
  });
});
