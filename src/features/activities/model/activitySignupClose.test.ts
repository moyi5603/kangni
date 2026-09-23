import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  applyCloseActivitySignup,
  applyReopenActivitySignup,
  canCloseActivitySignup,
  canReopenActivitySignup,
  canRevokeActivity,
} from './activity';

const now = dayjs('2026-08-31 10:00');

const onceOpen = {
  publishStatus: '已发布' as const,
  activityStatus: '进行中' as const,
  scheduleType: 'once' as const,
  signupEndAt: '2026-09-30 18:00',
  sessions: [] as Array<{ id: string; startAt: string; endAt: string }>,
};

const seriesOpen = {
  publishStatus: '已发布' as const,
  activityStatus: '进行中' as const,
  scheduleType: 'series' as const,
  signupStartAt: '2026-08-01 09:00',
  signupHoursBefore: 2,
  signupEndAt: '2026-09-09 17:00',
  sessions: [
    { id: 'a', startAt: '2026-09-02 19:00', endAt: '2026-09-02 21:00' },
    { id: 'b', startAt: '2026-09-09 19:00', endAt: '2026-09-09 21:00' },
  ],
};

describe('close and reopen signup', () => {
  it('closes all schedule types by pulling signupEndAt to now', () => {
    const closedOnce = applyCloseActivitySignup(onceOpen, now);
    expect(closedOnce.signupEndAt).toBe('2026-08-31 10:00');
    expect(closedOnce.signupClosedAt).toBe('2026-08-31 10:00');
    expect(closedOnce.signupEndAtBeforeClose).toBe('2026-09-30 18:00');

    const closedSeries = applyCloseActivitySignup(seriesOpen, now);
    expect(closedSeries.signupEndAt).toBe('2026-08-31 10:00');
    expect(closedSeries.signupHoursBefore).toBe(2);
    expect(closedSeries.signupEndAtBeforeClose).toBe('2026-09-09 17:00');
  });

  it('reopens once from the stashed end, series from last session close', () => {
    const once = applyReopenActivitySignup(applyCloseActivitySignup(onceOpen, now), now);
    expect(once.signupEndAt).toBe('2026-09-30 18:00');
    expect(once.signupClosedAt).toBeUndefined();

    const series = applyReopenActivitySignup(applyCloseActivitySignup(seriesOpen, now), now);
    expect(series.signupEndAt).toBe('2026-09-09 17:00');
    expect(series.signupHoursBefore).toBe(2);
    expect(series.signupClosedAt).toBeUndefined();
  });

  it('only allows close when published and signup still open, reopen after operator close', () => {
    expect(canCloseActivitySignup(onceOpen, now)).toBe(true);
    expect(canReopenActivitySignup(onceOpen)).toBe(false);
    const closed = applyCloseActivitySignup(onceOpen, now);
    expect(canCloseActivitySignup(closed, now)).toBe(false);
    expect(canReopenActivitySignup(closed)).toBe(true);
    expect(canReopenActivitySignup({ ...closed, activityStatus: '已终止' })).toBe(false);
  });

  it('allows revoke only for published upcoming activities', () => {
    expect(canRevokeActivity({ publishStatus: '已发布', activityStatus: '未开始' })).toBe(true);
    expect(canRevokeActivity({ publishStatus: '已发布', activityStatus: '进行中' })).toBe(false);
    expect(canRevokeActivity({ publishStatus: '已发布', activityStatus: '已结束' })).toBe(false);
    expect(canRevokeActivity({ publishStatus: '已发布', activityStatus: '已终止' })).toBe(false);
    expect(canRevokeActivity({ publishStatus: '未发布', activityStatus: '未开始' })).toBe(false);
  });
});
