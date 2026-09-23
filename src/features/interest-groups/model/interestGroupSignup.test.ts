import { describe, expect, it } from 'vitest';
import { initialInterestGroupActivities } from './interestGroupActivity';
import {
  canReviewInterestGroupSignup,
  initialInterestGroupSignups,
  interestGroupSignupInitialStatus,
  interestGroupSignupStatuses,
  occupiesInterestGroupSignupSlot,
} from './interestGroupSignup';

describe('interest group activity signup audit', () => {
  it('starts as 待审核 only when the activity requires signup review', () => {
    expect(interestGroupSignupStatuses).toEqual(['待审核', '已通过', '已驳回']);
    expect(interestGroupSignupInitialStatus(true)).toBe('待审核');
    expect(interestGroupSignupInitialStatus(false)).toBe('已通过');
  });

  it('allows review only for 待审核 records on audited activities', () => {
    expect(canReviewInterestGroupSignup({ status: '待审核' }, { needAudit: true })).toBe(true);
    expect(canReviewInterestGroupSignup({ status: '待审核' }, { needAudit: false })).toBe(false);
    expect(canReviewInterestGroupSignup({ status: '已通过' }, { needAudit: true })).toBe(false);
  });

  it('pins occupying recurring/series signups to a real session', () => {
    const byId = Object.fromEntries(initialInterestGroupActivities.map((item) => [item.id, item]));
    const invalid = initialInterestGroupSignups.filter((item) => {
      const activity = byId[item.activityId];
      if (!activity || (activity.type !== 'recurring' && activity.type !== 'series')) return false;
      if (!occupiesInterestGroupSignupSlot(item.status)) return false;
      const allowed = new Set((activity.sessions ?? []).map((session) => session.id));
      return !item.sessionId || !allowed.has(item.sessionId);
    });
    expect(invalid).toEqual([]);
  });

  it('spreads night-run and series seeds across more than the first session', () => {
    const nightRun = initialInterestGroupActivities.find((item) => item.id === 101)!;
    const upcoming = nightRun.sessions.filter((session) => session.status === 'upcoming');
    expect(upcoming.length).toBeGreaterThan(0);
    const sun = initialInterestGroupSignups.find((item) => item.id === 2);
    expect(sun?.sessionId).toBe(upcoming[0]?.id);
    expect(initialInterestGroupSignups.find((item) => item.id === 7)?.sessionId).toBe('201-s1');
    expect(initialInterestGroupSignups.filter((item) => item.activityId === 501).map((item) => item.sessionId).sort()).toEqual([
      '501-s1',
      '501-s2',
      '501-s3',
    ]);
  });
});
