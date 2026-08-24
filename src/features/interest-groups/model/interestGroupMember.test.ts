import { describe, expect, it } from 'vitest';
import { initialInterestGroups } from './interestGroup';
import { initialInterestGroupMembers } from './interestGroupMember';

describe('interestGroupMember seed status', () => {
  it('uses 已通过 for every member of a free-join group', () => {
    const freeIds = new Set(initialInterestGroups.filter((group) => group.joinMode === 'free').map((group) => group.id));
    const pendingInFree = initialInterestGroupMembers.filter(
      (member) => freeIds.has(member.groupId) && member.status !== '已通过',
    );
    expect(pendingInFree).toEqual([]);
  });

  it('keeps pending members only on approve-join groups', () => {
    expect(initialInterestGroupMembers.find((member) => member.groupId === 2 && member.employeeId === '林销')?.status).toBe(
      '待审核',
    );
  });
});
