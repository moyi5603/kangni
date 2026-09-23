import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { initialRecords, initialRules, initialTemplates } from './care';
import {
  buildCareLatestRows,
  careRecordInDateRange,
  computeCareOverviewStats,
  defaultCareOverviewDateRange,
} from './careOverview';

describe('care overview stats', () => {
  it('counts rules, running rules, records, templates and breakdowns', () => {
    const stats = computeCareOverviewStats(initialRules, initialRecords, initialTemplates);
    expect(stats.ruleCount).toBe(7);
    expect(stats.runningRuleCount).toBe(7);
    expect(stats.recordCount).toBe(11);
    expect(stats.templateCount).toBe(9);
    expect(stats.categoryCounts).toEqual([
      { label: '个人关怀', value: 3 },
      { label: '固定日期关怀', value: 2 },
      { label: '事件关怀', value: 2 },
    ]);
    expect(stats.sourceCounts).toEqual([
      { label: '系统关怀', value: 8 },
      { label: '用户关怀', value: 3 },
    ]);
  });

  it('lists latest records by push time', () => {
    const rows = buildCareLatestRows(initialRecords, 3);
    expect(rows.map((item) => item.id)).toEqual(['u1', 'c8', 'c7']);
    expect(rows[0]?.name).toBe('周可心');
  });

  it('filters records by push date range', () => {
    const record = initialRecords.find((item) => item.id === 'u1')!;
    expect(careRecordInDateRange(record, dayjs('2026-08-28'), dayjs('2026-08-28'))).toBe(true);
    expect(careRecordInDateRange(record, dayjs('2026-08-01'), dayjs('2026-08-27'))).toBe(false);
  });

  it('defaults overview range to include seed push dates', () => {
    const [from, to] = defaultCareOverviewDateRange(dayjs('2026-09-20'));
    expect(from.format('YYYY-MM-DD')).toBe('2026-08-01');
    expect(to.format('YYYY-MM-DD')).toBe('2026-09-20');
    expect(careRecordInDateRange(initialRecords.find((item) => item.id === 'u1')!, from, to)).toBe(true);
  });
});
