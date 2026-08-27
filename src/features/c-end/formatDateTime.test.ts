import { describe, expect, it } from 'vitest';
import { formatCEndDateTime, formatCEndDateTimeInText, formatCEndDateTimeRange } from './formatDateTime';

describe('C-end datetime display', () => {
  const now = new Date('2026-08-26T12:00:00');

  it('drops the current year from a datetime', () => {
    expect(formatCEndDateTime('2026-08-18 09:30', now)).toBe('08-18 09:30');
    expect(formatCEndDateTime('2026-08-03 19:35', now)).toBe('08-03 19:35');
    expect(formatCEndDateTimeRange('2026-08-01 09:00', '2026-08-31 18:00', now)).toBe(
      '08-01 09:00 ~ 08-31 18:00',
    );
  });

  it('keeps other years and strips current year inside mixed text', () => {
    expect(formatCEndDateTime('2025-12-31 23:59', now)).toBe('2025-12-31 23:59');
    expect(formatCEndDateTimeInText('第 1 场 2026-09-01 09:00 ~ 2026-09-01 12:00', now)).toBe(
      '第 1 场 09-01 09:00 ~ 09-01 12:00',
    );
    expect(formatCEndDateTimeInText('2025-12-31 09:00 ~ 2026-01-01 18:00', now)).toBe(
      '2025-12-31 09:00 ~ 01-01 18:00',
    );
  });
});
