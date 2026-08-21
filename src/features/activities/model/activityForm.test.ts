import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  ACTIVITY_DATETIME_FORMAT,
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
} from './activityForm';

describe('activity form date range', () => {
  it('round-trips start/end strings without seconds', () => {
    const range = toDateTimeRange('2026-09-01 09:00', '2026-09-02 18:00');
    expect(formatDateTimeRange(range)).toEqual({
      startAt: '2026-09-01 09:00',
      endAt: '2026-09-02 18:00',
    });
    expect(ACTIVITY_DATETIME_FORMAT).toBe('YYYY-MM-DD HH:mm');
  });

  it('rejects missing or partial range with the required message', async () => {
    await expect(validateDateTimeRange(undefined, { required: '请选择活动时间', order: '结束时间不得早于开始时间' })).rejects.toThrow(
      '请选择活动时间',
    );
    await expect(validateDateTimeRange([dayjs('2026-09-01 09:00'), null], { required: '请选择活动时间', order: 'x' })).rejects.toThrow(
      '请选择活动时间',
    );
    await expect(validateDateTimeRange(null, { required: '请选择报名时间', order: 'x' })).rejects.toThrow('请选择报名时间');
  });

  it('allows equal start and end, rejects end before start', async () => {
    const same = dayjs('2026-09-01 09:00');
    await expect(
      validateDateTimeRange([same, same], { required: '请选择活动时间', order: '结束时间不得早于开始时间' }),
    ).resolves.toBeUndefined();
    await expect(
      validateDateTimeRange([dayjs('2026-09-02 18:00'), dayjs('2026-09-01 09:00')], {
        required: '请选择报名时间',
        order: '报名结束时间不得早于开始时间',
      }),
    ).rejects.toThrow('报名结束时间不得早于开始时间');
  });
});
