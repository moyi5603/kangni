import { describe, expect, it } from 'vitest';
import { initialInterestGroups } from './interestGroup';
import { initialInterestGroupMembers } from './interestGroupMember';

describe('interestGroupMember seed status', () => {
  it('uses 已通过 for every member because groups are always free-join', () => {
    const pending = initialInterestGroupMembers.filter((member) => member.status !== '已通过');
    expect(pending).toEqual([]);
    expect(initialInterestGroups.every((group) => group.joinMode === 'free')).toBe(true);
  });
});
