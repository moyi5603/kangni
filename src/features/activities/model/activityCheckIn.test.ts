import { describe, expect, it } from 'vitest';
import {
  CHECK_IN_DYNAMIC_MS,
  CHECK_IN_ONCE_SESSION_ID,
  checkInTokenForSession,
  defaultCheckInSettings,
  dynamicCheckInToken,
  evaluateCheckIn,
  toH5CheckInHash,
  parseCheckInQuery,
  listCheckInSessions,
  type CheckInActivity,
} from './activityCheckIn';

const approved = {
  status: '已通过' as const,
  answers: { 场次: 's-a' },
  checkIns: {} as Record<string, string>,
};

function activity(overrides: Partial<CheckInActivity> = {}): CheckInActivity {
  return {
    scheduleType: 'recurring',
    startAt: '2026-09-02 19:00',
    endAt: '2026-09-02 21:00',
    sessions: [{ id: 's-a', startAt: '2026-09-02 19:00', endAt: '2026-09-02 21:00', checkInToken: 'tok-a' }],
    ...defaultCheckInSettings(),
    checkInEnabled: true,
    ...overrides,
  };
}

describe('listCheckInSessions', () => {
  it('uses a synthetic once session when there is no session list', () => {
    const sessions = listCheckInSessions({
      ...activity({ scheduleType: 'once', sessions: [], checkInToken: 'tok-once' }),
    });
    expect(sessions).toEqual([
      {
        id: CHECK_IN_ONCE_SESSION_ID,
        startAt: '2026-09-02 19:00',
        endAt: '2026-09-02 21:00',
        checkInToken: 'tok-once',
      },
    ]);
  });

  it('keeps distinct tokens per real session', () => {
    const sessions = listCheckInSessions(
      activity({
        sessions: [
          { id: 's-a', startAt: '2026-09-02 19:00', endAt: '2026-09-02 21:00', checkInToken: 'tok-a' },
          { id: 's-b', startAt: '2026-09-09 19:00', endAt: '2026-09-09 21:00', checkInToken: 'tok-b' },
        ],
      }),
    );
    expect(sessions.map((item) => item.checkInToken)).toEqual(['tok-a', 'tok-b']);
  });
});

describe('evaluateCheckIn', () => {
  const now = Date.parse('2026-09-02T19:05:00');

  it('accepts a matching static token inside the window', () => {
    expect(evaluateCheckIn({ activity: activity(), sessionId: 's-a', token: 'tok-a', signup: approved, now })).toEqual({
      ok: true,
      already: false,
    });
  });

  it('rejects another session static token', () => {
    expect(evaluateCheckIn({ activity: activity(), sessionId: 's-a', token: 'tok-b', signup: approved, now }).ok).toBe(
      false,
    );
  });

  it('rejects before the open time', () => {
    const result = evaluateCheckIn({
      activity: activity({ checkInOpenMode: 'before_start', checkInOpenMinutesBefore: 30 }),
      sessionId: 's-a',
      token: 'tok-a',
      signup: approved,
      now: Date.parse('2026-09-02T18:20:00'),
    });
    expect(result).toMatchObject({ ok: false, reason: 'too_early' });
  });

  it('opens 30 minutes before start in before_start mode', () => {
    expect(
      evaluateCheckIn({
        activity: activity({ checkInOpenMode: 'before_start', checkInOpenMinutesBefore: 30 }),
        sessionId: 's-a',
        token: 'tok-a',
        signup: approved,
        now: Date.parse('2026-09-02T18:30:00'),
      }).ok,
    ).toBe(true);
  });

  it('waits until start in after_start mode', () => {
    expect(
      evaluateCheckIn({
        activity: activity({ checkInOpenMode: 'after_start' }),
        sessionId: 's-a',
        token: 'tok-a',
        signup: approved,
        now: Date.parse('2026-09-02T18:59:00'),
      }),
    ).toMatchObject({ ok: false, reason: 'too_early' });
  });

  it('expires after the configured duration from start', () => {
    expect(
      evaluateCheckIn({
        activity: activity({ checkInValidAfterStart: 3, checkInValidAfterStartUnit: 'day' }),
        sessionId: 's-a',
        token: 'tok-a',
        signup: approved,
        now: Date.parse('2026-09-06T19:00:01'),
      }),
    ).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('requires an approved signup for the scanned session', () => {
    expect(
      evaluateCheckIn({ activity: activity(), sessionId: 's-a', token: 'tok-a', signup: undefined, now }),
    ).toMatchObject({ ok: false, reason: 'no_signup' });
    expect(
      evaluateCheckIn({
        activity: activity(),
        sessionId: 's-a',
        token: 'tok-a',
        signup: { ...approved, status: '待审核' },
        now,
      }),
    ).toMatchObject({ ok: false, reason: 'not_approved' });
    expect(
      evaluateCheckIn({
        activity: activity(),
        sessionId: 's-a',
        token: 'tok-a',
        signup: { ...approved, answers: { 场次: 's-b' } },
        now,
      }),
    ).toMatchObject({ ok: false, reason: 'wrong_session' });
  });

  it('marks the same session as already checked in', () => {
    expect(
      evaluateCheckIn({
        activity: activity(),
        sessionId: 's-a',
        token: 'tok-a',
        signup: { ...approved, checkIns: { 's-a': '2026-09-02 19:01:00' } },
        now,
      }),
    ).toEqual({ ok: true, already: true });
  });

  it('requires the current 5-minute bucket when dynamic QR is on', () => {
    const bucketNow = Date.parse('2026-09-02T19:07:00');
    const current = dynamicCheckInToken('tok-a', bucketNow);
    const stale = dynamicCheckInToken('tok-a', bucketNow - CHECK_IN_DYNAMIC_MS);
    expect(
      evaluateCheckIn({
        activity: activity({ checkInDynamicQr: true }),
        sessionId: 's-a',
        token: current,
        signup: approved,
        now: bucketNow,
      }).ok,
    ).toBe(true);
    expect(
      evaluateCheckIn({
        activity: activity({ checkInDynamicQr: true }),
        sessionId: 's-a',
        token: stale,
        signup: approved,
        now: bucketNow,
      }),
    ).toMatchObject({ ok: false, reason: 'bad_token' });
    expect(
      evaluateCheckIn({
        activity: activity({ checkInDynamicQr: true }),
        sessionId: 's-a',
        token: 'tok-a',
        signup: approved,
        now: bucketNow,
      }),
    ).toMatchObject({ ok: false, reason: 'bad_token' });
  });
});

describe('checkInTokenForSession', () => {
  it('reuses an existing token and otherwise derives a stable unique value', () => {
    expect(checkInTokenForSession({ id: 's-a', startAt: '', endAt: '', checkInToken: 'keep' })).toBe('keep');
    expect(checkInTokenForSession({ id: 's-a', startAt: '', endAt: '' })).toBe('ck-s-a');
    expect(checkInTokenForSession({ id: 's-b', startAt: '', endAt: '' })).toBe('ck-s-b');
  });
});

describe('checkIn urls', () => {
  it('encodes session and token in the H5 hash', () => {
    expect(toH5CheckInHash(26, 's-a', 'tok-a')).toBe('#/c/h5/26/checkin?s=s-a&t=tok-a');
    expect(parseCheckInQuery('#/c/h5/26/checkin?s=s-a&t=tok-a')).toEqual({ sessionId: 's-a', token: 'tok-a' });
  });
});
