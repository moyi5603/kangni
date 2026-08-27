import { describe, expect, it } from 'vitest';
import {
  formatActivityScheduleTime,
  formatPickedSessionsLabel,
  formatScheduleSignupTime,
  generateRecurringSessions,
  listClientSignupSessions,
  isSessionEnded,
  isSessionSignupOpen,
  clientQuotaLabel,
  SIGNUP_HOURS_PLACEHOLDER,
  needsSessionPick,
  shouldShowRecentSessions,
  signupQuotaLabel,
  signupQuotaPlaceholder,
  sessionSignupEndAt,
  syncSessionBounds,
  syncSignupEndAt,
  validateActivitySchedule,
  validateSessionPick,
  weekdayLabel,
} from './activitySchedule';

describe('generateRecurringSessions', () => {
  it('builds one session per matching weekday in the cycle', () => {
    const sessions = generateRecurringSessions({
      repeatWeekday: 3,
      timeStart: '14:00',
      timeEnd: '16:00',
      cycleStart: '2026-08-26',
      cycleEnd: '2026-09-09',
    });
    expect(sessions.map((item) => item.startAt)).toEqual([
      '2026-08-26 14:00',
      '2026-09-02 14:00',
      '2026-09-09 14:00',
    ]);
    expect(sessions[0]?.endAt).toBe('2026-08-26 16:00');
    expect(sessions).toHaveLength(3);
  });

  it('returns empty when the range has no matching weekday', () => {
    expect(
      generateRecurringSessions({
        repeatWeekday: 1,
        timeStart: '09:00',
        timeEnd: '10:00',
        cycleStart: '2026-08-26',
        cycleEnd: '2026-08-27',
      }),
    ).toEqual([]);
  });
});

describe('listClientSignupSessions', () => {
  const now = Date.parse('2026-08-26T15:00:00');

  it('hides ended sessions and keeps the next five by start time', () => {
    const sessions = [
      { id: 'ended', startAt: '2026-08-19 19:00', endAt: '2026-08-19 21:00' },
      { id: 'a', startAt: '2026-09-02 19:00', endAt: '2026-09-02 21:00' },
      { id: 'b', startAt: '2026-09-09 19:00', endAt: '2026-09-09 21:00' },
      { id: 'c', startAt: '2026-09-16 19:00', endAt: '2026-09-16 21:00' },
      { id: 'd', startAt: '2026-09-23 19:00', endAt: '2026-09-23 21:00' },
      { id: 'e', startAt: '2026-09-30 19:00', endAt: '2026-09-30 21:00' },
      { id: 'f', startAt: '2026-10-07 19:00', endAt: '2026-10-07 21:00' },
    ];
    expect(isSessionEnded(sessions[0]!, now)).toBe(true);
    expect(listClientSignupSessions(sessions, now).map((item) => item.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('formatActivityScheduleTime', () => {
  it('keeps once as start ~ end', () => {
    expect(
      formatActivityScheduleTime({
        scheduleType: 'once',
        startAt: '2026-08-25 09:00',
        endAt: '2026-08-25 17:00',
        sessions: [],
      }),
    ).toBe('2026-08-25 09:00 ~ 2026-08-25 17:00');
  });

  it('summarizes recurring with weekday, clock, span and count', () => {
    expect(
      formatActivityScheduleTime({
        scheduleType: 'recurring',
        startAt: '2026-08-26 14:00',
        endAt: '2026-09-09 16:00',
        repeatWeekday: 3,
        timeStart: '14:00',
        timeEnd: '16:00',
        cycleStart: '2026-08-26',
        cycleEnd: '2026-09-09',
        sessions: generateRecurringSessions({
          repeatWeekday: 3,
          timeStart: '14:00',
          timeEnd: '16:00',
          cycleStart: '2026-08-26',
          cycleEnd: '2026-09-09',
        }),
      }),
    ).toBe(`每${weekdayLabel(3)} ${'14:00-16:00'}（2026-08-26～2026-09-09，共 3 场）`);
  });

  it('summarizes series with first session and count', () => {
    expect(
      formatActivityScheduleTime({
        scheduleType: 'series',
        startAt: '2026-08-26 09:00',
        endAt: '2026-09-10 17:00',
        sessions: [
          { id: 'a', startAt: '2026-08-26 09:00', endAt: '2026-08-26 17:00' },
          { id: 'b', startAt: '2026-09-10 09:00', endAt: '2026-09-10 17:00' },
        ],
      }),
    ).toBe('首场 2026-08-26 09:00 ~ 2026-08-26 17:00 · 共 2 场');
  });
});

describe('validateActivitySchedule', () => {
  it('requires generated sessions for recurring', () => {
    expect(
      validateActivitySchedule({
        scheduleType: 'recurring',
        repeatWeekday: 1,
        timeStart: '09:00',
        timeEnd: '10:00',
        cycleStart: '2026-08-26',
        cycleEnd: '2026-08-27',
        sessions: [],
      }),
    ).toBe('该周期内没有可生成的场次');
  });

  it('requires at least 2 series sessions', () => {
    expect(
      validateActivitySchedule({
        scheduleType: 'series',
        sessions: [{ id: 'a', startAt: '2026-08-26 09:00', endAt: '2026-08-26 17:00' }],
      }),
    ).toBe('系列活动至少需要 2 场');
  });
});

describe('needsSessionPick', () => {
  it('is true for recurring and series', () => {
    expect(needsSessionPick('once')).toBe(false);
    expect(needsSessionPick('recurring')).toBe(true);
    expect(needsSessionPick('series')).toBe(true);
  });
});

describe('shouldShowRecentSessions', () => {
  const now = Date.parse('2026-08-27T11:00:00');
  const live = { id: 'a', startAt: '2026-08-27 14:00', endAt: '2026-08-27 23:00' };
  const next = { id: 'b', startAt: '2026-09-03 14:00', endAt: '2026-09-03 23:00' };
  const ended = { id: 'z', startAt: '2026-08-20 14:00', endAt: '2026-08-20 23:00' };

  it('hides once activities and a single remaining session', () => {
    expect(shouldShowRecentSessions('once', [live, next], now)).toBe(false);
    expect(shouldShowRecentSessions('series', [ended, live], now)).toBe(false);
  });

  it('shows recurring or series with more than one unfinished session', () => {
    expect(shouldShowRecentSessions('recurring', [ended, live, next], now)).toBe(true);
    expect(shouldShowRecentSessions('series', [live, next], now)).toBe(true);
  });
});

describe('signup quota copy', () => {
  it('uses per-session wording for recurring and series', () => {
    expect(signupQuotaLabel('once')).toBe('报名总人数');
    expect(signupQuotaPlaceholder('once')).toBeUndefined();
    expect(signupQuotaLabel('series')).toBe('每场人数上限');
    expect(signupQuotaPlaceholder('recurring')).toBe('各场独立限制，不跨场共用');
    expect(SIGNUP_HOURS_PLACEHOLDER).toBe('0 为开场即停');
    expect(clientQuotaLabel('once')).toBe('总名额');
    expect(clientQuotaLabel('series')).toBe('每场名额');
  });
});

describe('formatPickedSessionsLabel', () => {
  it('maps ids to labeled sessions', () => {
    const sessions = [
      { id: 'a', startAt: '2026-08-26 09:00', endAt: '2026-08-26 12:00' },
      { id: 'b', startAt: '2026-09-10 09:00', endAt: '2026-09-10 17:00' },
    ];
    expect(formatPickedSessionsLabel(sessions, 'b、a')).toBe(
      '第 2 场 2026-09-10 09:00 ~ 2026-09-10 17:00；第 1 场 2026-08-26 09:00 ~ 2026-08-26 12:00',
    );
  });
});

describe('syncSessionBounds', () => {
  it('uses earliest start and latest end', () => {
    expect(
      syncSessionBounds([
        { id: 'b', startAt: '2026-09-10 09:00', endAt: '2026-09-10 17:00' },
        { id: 'a', startAt: '2026-08-26 09:00', endAt: '2026-08-26 12:00' },
      ]),
    ).toEqual({ startAt: '2026-08-26 09:00', endAt: '2026-09-10 17:00' });
  });
});

describe('session signup window', () => {
  const sessions = [
    { id: 'a', startAt: '2026-09-02 19:00', endAt: '2026-09-02 21:00' },
    { id: 'b', startAt: '2026-09-09 19:00', endAt: '2026-09-09 21:00' },
  ];
  const window = {
    signupStartAt: '2026-08-01 09:00',
    signupEndAt: '2026-09-09 19:00',
    signupHoursBefore: 0,
  };

  it('subtracts hours from session start', () => {
    expect(sessionSignupEndAt('2026-09-02 19:00', 2)).toBe('2026-09-02 17:00');
    expect(sessionSignupEndAt('2026-09-02 19:00', 0)).toBe('2026-09-02 19:00');
  });

  it('syncs activity signupEndAt to the latest session close', () => {
    expect(syncSignupEndAt(sessions, 2)).toBe('2026-09-09 17:00');
  });

  it('formats once as range and multi as relative copy', () => {
    expect(
      formatScheduleSignupTime({
        scheduleType: 'once',
        signupStartAt: '2026-08-01 09:00',
        signupEndAt: '2026-08-31 18:00',
      }),
    ).toBe('2026-08-01 09:00 ~ 2026-08-31 18:00');
    expect(
      formatScheduleSignupTime({
        scheduleType: 'series',
        signupStartAt: '2026-08-01 09:00',
        signupEndAt: '2026-09-09 19:00',
        signupHoursBefore: 0,
      }),
    ).toBe('2026-08-01 09:00 起，每场开场时截止');
    expect(
      formatScheduleSignupTime({
        scheduleType: 'recurring',
        signupStartAt: '2026-08-01 09:00',
        signupEndAt: '2026-09-09 17:00',
        signupHoursBefore: 2,
      }),
    ).toBe('2026-08-01 09:00 起，每场开始前 2 小时截止');
  });

  it('opens a session only inside activity start, activity end, and session close', () => {
    const now = Date.parse('2026-09-02T12:00:00');
    expect(isSessionSignupOpen(sessions[0], window, now)).toBe(true);
    expect(isSessionSignupOpen(sessions[0], window, Date.parse('2026-09-02T20:00:00'))).toBe(false);
    expect(isSessionSignupOpen(sessions[0], { ...window, signupEndAt: '2026-09-01 12:00' }, now)).toBe(false);
  });

  it('rejects picking a closed session', () => {
    expect(validateSessionPick('series', sessions, ['a'])).toBeUndefined();
    expect(
      validateSessionPick('series', sessions, ['a'], {
        ...window,
        now: Date.parse('2026-09-02T20:00:00'),
      }),
    ).toBe('请选择仍可报名的场次');
  });
});
