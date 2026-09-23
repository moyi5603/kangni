import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  applyTerminateActivity,
  canEditActivity,
  canTerminateActivity,
  editActivityBlockReason,
  isActivityClosed,
  sessionsHeldAfterTerminate,
} from './activity';

describe('terminate activity', () => {
  it('allows terminate only after published start', () => {
    expect(canTerminateActivity({ publishStatus: '已发布', activityStatus: '进行中' })).toBe(true);
    expect(canTerminateActivity({ publishStatus: '已发布', activityStatus: '未开始' })).toBe(false);
    expect(canTerminateActivity({ publishStatus: '已发布', activityStatus: '已结束' })).toBe(false);
    expect(canTerminateActivity({ publishStatus: '已发布', activityStatus: '已终止' })).toBe(false);
    expect(canTerminateActivity({ publishStatus: '未发布', activityStatus: '进行中' })).toBe(false);
  });

  it('sets closed sibling status, cutoff and signup close', () => {
    const next = applyTerminateActivity(
      {
        activityStatus: '进行中',
        signupEndAt: '2026-12-31 18:00',
      },
      dayjs('2026-08-31 10:00'),
    );
    expect(next.activityStatus).toBe('已终止');
    expect(next.terminatedAt).toBe('2026-08-31 10:00');
    expect(next.signupEndAt).toBe('2026-08-31 10:00');
  });

  it('keeps held sessions and drops unheld ones', () => {
    expect(
      sessionsHeldAfterTerminate(
        [{ startAt: '2026-08-01 10:00' }, { startAt: '2026-09-01 10:00' }],
        '2026-08-31 10:00',
      ),
    ).toEqual([{ startAt: '2026-08-01 10:00' }]);
  });

  it('treats terminate as closed sibling of ended', () => {
    expect(isActivityClosed({ activityStatus: '已终止' })).toBe(true);
    expect(isActivityClosed({ activityStatus: '已结束' })).toBe(true);
    expect(isActivityClosed({ activityStatus: '进行中' })).toBe(false);
  });

  it('blocks edit after ended or terminated', () => {
    expect(canEditActivity({ activityStatus: '未开始' })).toBe(true);
    expect(canEditActivity({ activityStatus: '进行中' })).toBe(true);
    expect(canEditActivity({ activityStatus: '已结束' })).toBe(false);
    expect(canEditActivity({ activityStatus: '已终止' })).toBe(false);
    expect(editActivityBlockReason({ activityStatus: '已结束' })).toBe('活动已结束，不能编辑');
    expect(editActivityBlockReason({ activityStatus: '已终止' })).toBe('活动已终止，不能编辑');
    expect(editActivityBlockReason({ activityStatus: '进行中' })).toBeUndefined();
  });
});
