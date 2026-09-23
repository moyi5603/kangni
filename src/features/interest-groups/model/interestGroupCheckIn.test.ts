import { describe, expect, it } from 'vitest';
import { CHECK_IN_ONCE_SESSION_ID, checkInTokenForSession } from '../../activities/model/activityCheckIn';
import { applyInterestGroupCheckIn, getInterestGroupActivity, getInterestGroupSignups } from './interestGroupStore';
import { shouldShowIgCheckInQr, toIgH5CheckInHash, currentIgCheckInUrl, toInterestGroupCheckInActivity } from './interestGroupCheckIn';

describe('interest group check-in', () => {
  it('builds a check-in activity from an interest-group activity', () => {
    const activity = getInterestGroupActivity(101);
    expect(activity?.checkInEnabled).toBe(true);
    const mapped = toInterestGroupCheckInActivity(activity!);
    expect(mapped.scheduleType).toBe('recurring');
    expect(mapped.sessions[0]?.id).toBe('101-s1');
    expect(mapped.sessions[0]?.checkInToken).toBeTruthy();
  });

  it('records a first check-in and then marks already', () => {
    const activity = getInterestGroupActivity(101)!;
    const session = activity.sessions.find((item) => item.id === '101-s1')!;
    const token = checkInTokenForSession(session);
    const now = Date.parse(session.startAt);
    const first = applyInterestGroupCheckIn(101, '101-s1', token, now, '李明');
    expect(first).toEqual({ ok: true, already: false });
    const signup = getInterestGroupSignups().find((item) => item.activityId === 101 && item.name === '李明');
    expect(signup?.checkIns?.['101-s1']).toBeTruthy();
    const second = applyInterestGroupCheckIn(101, '101-s1', token, now + 1000, '李明');
    expect(second).toEqual({ ok: true, already: true });
  });

  it('builds an ig check-in hash', () => {
    expect(toIgH5CheckInHash(101, '101-s1', 'tok')).toBe('#/c/h5/ig-act-101/checkin?s=101-s1&t=tok');
  });

  it('does not throw when Chrome file:// origin is the string null', () => {
    expect(
      currentIgCheckInUrl(101, '101-s1', 'tok', {
        href: 'file:///tmp/demo.html',
        origin: 'null',
        pathname: '/tmp/demo.html',
      }),
    ).toBe('file:///tmp/demo.html#/c/h5/ig-act-101/checkin?s=101-s1&t=tok');
  });

  it('uses the once session id when there are no sessions', () => {
    expect(CHECK_IN_ONCE_SESSION_ID).toBe('once');
  });

  it('seeds a multi-session check-in activity hosted by 林浅', () => {
    const activity = getInterestGroupActivity(604);
    expect(activity?.hostName).toBe('林浅');
    expect(activity?.checkInEnabled).toBe(true);
    expect(activity?.type).toBe('series');
    expect(activity?.sessions.length).toBeGreaterThan(1);
    expect(activity?.sessions.every((session) => session.checkInToken)).toBe(true);
  });
  it('shows check-in QR only to host or group leads', () => {
    const activity = { hostName: '张悦', checkInEnabled: true };
    const group = { leadEmployeeIds: ['张悦'], leadName: '张悦' };
    expect(shouldShowIgCheckInQr(activity, group, '张悦')).toBe(true);
    expect(shouldShowIgCheckInQr({ hostName: '林浅', checkInEnabled: true }, group, '林浅')).toBe(true);
    expect(shouldShowIgCheckInQr(activity, { leadEmployeeIds: ['林浅'], leadName: '林浅' }, '林浅')).toBe(true);
    expect(shouldShowIgCheckInQr(activity, group, '林浅')).toBe(false);
    expect(shouldShowIgCheckInQr({ hostName: '林浅', checkInEnabled: false }, group, '林浅')).toBe(false);
  });
});
