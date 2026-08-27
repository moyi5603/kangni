import { describe, expect, it } from 'vitest';
import {
  canReviewInterestGroupSignup,
  interestGroupSignupInitialStatus,
  interestGroupSignupStatuses,
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
});
