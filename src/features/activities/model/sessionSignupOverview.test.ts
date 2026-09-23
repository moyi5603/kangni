import { describe, expect, it } from 'vitest';
import {
  buildSessionOverview,
  deriveClockSessionStatus,
  filterBySessionId,
  igStatusToOverview,
  occupiesSignupQuota,
  sessionSelectOptions,
} from './sessionSignupOverview';

describe('occupiesSignupQuota', () => {
  it('counts pending and approved only', () => {
    expect(occupiesSignupQuota('待审核')).toBe(true);
    expect(occupiesSignupQuota('已通过')).toBe(true);
    expect(occupiesSignupQuota('已驳回')).toBe(false);
    expect(occupiesSignupQuota('已取消')).toBe(false);
  });
});

describe('buildSessionOverview', () => {
  const sessions = [
    { id: 'a', startAt: '2026-09-01 09:00', endAt: '2026-09-01 18:00' },
    { id: 'b', startAt: '2026-09-02 09:00', endAt: '2026-09-02 18:00' },
  ];

  it('counts a multi-session signup on every picked session', () => {
    const rows = buildSessionOverview({
      sessions,
      quota: 10,
      statusOf: () => '未开始',
      signups: [{ status: '已通过', sessionIds: ['a', 'b'] }],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 'a', label: '第 1 场', signedCount: 1, pendingCount: 0, quota: 10 });
    expect(rows[1].signedCount).toBe(1);
  });

  it('counts pending in both signed and pending; ignores rejected', () => {
    const rows = buildSessionOverview({
      sessions,
      quota: null,
      statusOf: () => '未开始',
      signups: [
        { status: '待审核', sessionIds: ['a'] },
        { status: '已驳回', sessionIds: ['a'] },
      ],
    });
    expect(rows[0].signedCount).toBe(1);
    expect(rows[0].pendingCount).toBe(1);
    expect(rows[0].quota).toBeNull();
  });

  it('uses quotaOf per session when provided', () => {
    const rows = buildSessionOverview({
      sessions,
      quota: 10,
      quotaOf: (_session, index) => (index === 0 ? 24 : 0),
      statusOf: () => '未开始',
      signups: [],
    });
    expect(rows[0].quota).toBe(24);
    expect(rows[1].quota).toBeNull();
  });
});

describe('filterBySessionId', () => {
  it('keeps all when sessionId empty', () => {
    const rows = [{ sessionIds: ['a'] }, { sessionIds: ['b'] }];
    expect(filterBySessionId(rows, '', (item) => item.sessionIds)).toHaveLength(2);
  });

  it('keeps rows that include the session', () => {
    const rows = [{ sessionIds: ['a', 'b'] }, { sessionIds: ['b'] }];
    expect(filterBySessionId(rows, 'a', (item) => item.sessionIds).map((item) => item.sessionIds)).toEqual([['a', 'b']]);
  });
});

describe('status helpers', () => {
  it('maps ig status', () => {
    expect(igStatusToOverview('upcoming')).toBe('未开始');
    expect(igStatusToOverview('ongoing')).toBe('进行中');
    expect(igStatusToOverview('ended')).toBe('已结束');
    expect(igStatusToOverview('cancelled')).toBe('已取消');
  });

  it('derives clock status and cancelled after terminate', () => {
    const session = { startAt: '2026-09-10 09:00', endAt: '2026-09-10 18:00' };
    const now = new Date('2026-09-01T00:00:00').getTime();
    expect(deriveClockSessionStatus(session, now)).toBe('未开始');
    expect(deriveClockSessionStatus(session, now, '2026-09-01 12:00')).toBe('已取消');
    expect(deriveClockSessionStatus(session, new Date('2026-09-10T12:00:00').getTime())).toBe('进行中');
    expect(deriveClockSessionStatus(session, new Date('2026-09-11T00:00:00').getTime())).toBe('已结束');
  });

  it('keeps clock status when terminatedAt is after session start', () => {
    const session = { startAt: '2026-09-10 09:00', endAt: '2026-09-10 18:00' };
    expect(deriveClockSessionStatus(session, new Date('2026-09-01T00:00:00').getTime(), '2026-09-10 09:00')).toBe(
      '未开始',
    );
    expect(deriveClockSessionStatus(session, new Date('2026-09-10T12:00:00').getTime(), '2026-09-10 12:00')).toBe(
      '进行中',
    );
    expect(deriveClockSessionStatus(session, new Date('2026-09-11T00:00:00').getTime(), '2026-09-11 00:00')).toBe(
      '已结束',
    );
  });

  it('treats now at endAt as ended', () => {
    const session = { startAt: '2026-09-10 09:00', endAt: '2026-09-10 18:00' };
    expect(deriveClockSessionStatus(session, new Date('2026-09-10T18:00:00').getTime())).toBe('已结束');
  });
});

describe('sessionSelectOptions', () => {
  it('keeps full session start and end on the option label', () => {
    expect(
      sessionSelectOptions([
        { id: 'a', startAt: '2026-08-31 09:30', endAt: '2026-08-31 17:30' },
      ]),
    ).toEqual([
      { value: '', label: '全部场次' },
      {
        value: 'a',
        label: '第 1 场 2026-08-31 09:30 ~ 2026-08-31 17:30',
        indexLabel: '第 1 场',
        timeLabel: '2026-08-31 09:30 ~ 2026-08-31 17:30',
      },
    ]);
  });
});
