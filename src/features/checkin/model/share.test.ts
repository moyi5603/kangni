import { describe, expect, it } from 'vitest';
import {
  shareImageFileError,
  shareSlotLabel,
  shareSlotPlan,
  swapShareImages,
  validateCultureShare,
} from './share';

describe('shareSlotPlan', () => {
  it('counts inclusive calendar days for 一天一张', () => {
    expect(shareSlotPlan('2026-09-19 08:00', '2026-09-24 18:00', 'daily')).toEqual({
      startDay: '2026-09-19',
      endDay: '2026-09-24',
      count: 6,
      unit: '天',
    });
  });

  it('counts 7 days as one week and rounds a partial week up', () => {
    expect(shareSlotPlan('2026-09-19 00:00', '2026-09-24 23:59', 'weekly')?.count).toBe(1);
    expect(shareSlotPlan('2026-09-19 00:00', '2026-09-25 23:59', 'weekly')?.count).toBe(1);
    expect(shareSlotPlan('2026-09-19 00:00', '2026-09-26 23:59', 'weekly')?.count).toBe(2);
  });

  it('returns null when the range is missing or reversed', () => {
    expect(shareSlotPlan('', '2026-09-24 00:00', 'daily')).toBeNull();
    expect(shareSlotPlan('2026-09-24 00:00', '2026-09-19 00:00', 'daily')).toBeNull();
  });
});

describe('shareSlotLabel', () => {
  it('labels days and weeks from 1', () => {
    expect(shareSlotLabel('daily', 0)).toBe('第1天');
    expect(shareSlotLabel('weekly', 1)).toBe('第2周');
  });
});

describe('swapShareImages', () => {
  it('swaps two slots', () => {
    expect(swapShareImages(['a', 'b', 'c'], 0, 2)).toEqual(['c', 'b', 'a']);
  });
});

describe('shareImageFileError', () => {
  it('accepts a 1000×1470 jpg under 2MB', () => {
    expect(shareImageFileError({ type: 'image/jpeg', name: 'a.jpg', size: 1000, width: 1000, height: 1470 })).toBeNull();
  });

  it('rejects other types, oversized files, and wrong pixels', () => {
    expect(shareImageFileError({ type: 'image/gif', name: 'a.gif', size: 1000, width: 1000, height: 1470 })).toBe('仅支持 JPG、PNG');
    expect(shareImageFileError({ type: 'image/png', name: 'a.png', size: 2 * 1024 * 1024, width: 1000, height: 1470 })).toBe(
      '单张图片需小于 2MB',
    );
    expect(shareImageFileError({ type: 'image/png', name: 'a.png', size: 1000, width: 800, height: 1470 })).toBe(
      '图片尺寸需为 1000×1470 像素',
    );
  });
});

describe('validateCultureShare', () => {
  const base = {
    ownerApp: 'culture' as const,
    startAt: '2026-09-19 00:00',
    endAt: '2026-09-24 23:59',
    shareEnabled: true,
    cardRule: 'daily' as const,
    images: ['1', '2', '3', '4', '5', '6'],
  };

  it('skips skills themes and a closed switch', () => {
    expect(validateCultureShare({ ...base, ownerApp: 'skills-contest', images: [] })).toBeNull();
    expect(validateCultureShare({ ...base, shareEnabled: false, images: [] })).toBeNull();
  });

  it('requires a time range and a full set of images when sharing is on', () => {
    expect(validateCultureShare({ ...base, startAt: '', images: [] })).toBe('请先选择起止时间');
    expect(validateCultureShare({ ...base, images: ['1'] })).toBe('请配齐分享图片');
    expect(validateCultureShare(base)).toBeNull();
    expect(validateCultureShare({ ...base, cardRule: 'weekly', images: ['1'] })).toBeNull();
  });
});
