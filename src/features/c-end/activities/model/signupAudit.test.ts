import { describe, expect, it } from 'vitest';
import { approvalNodeReviewerLabel, currentSignupAudit, signupAuditText } from './signupAudit';

const NODES = [
  { id: 'n1', assigneeMode: 'people' as const, reviewerIds: ['张悦', '李明'] },
  { id: 'n2', assigneeMode: 'sameLevelLeader' as const, reviewerIds: [] },
];

describe('signup audit view', () => {
  it('returns nothing when the signup is not pending', () => {
    expect(currentSignupAudit({ signupApprovalNodes: NODES }, undefined)).toBeUndefined();
    expect(currentSignupAudit({ signupApprovalNodes: NODES }, { status: '已通过' })).toBeUndefined();
    expect(currentSignupAudit({ signupApprovalNodes: NODES }, { status: '已驳回' })).toBeUndefined();
  });

  it('shows the first node reviewers for a fresh pending signup', () => {
    const view = currentSignupAudit({ signupApprovalNodes: NODES }, { status: '待审核' });
    expect(view).toEqual({ nodeIndex: 0, totalNodes: 2, reviewerLabel: '张悦、李明' });
    expect(signupAuditText(view!)).toBe('报名审核中（第 1/2 节点） · 当前审核：张悦、李明');
  });

  it('advances to the role-based node label', () => {
    const view = currentSignupAudit({ signupApprovalNodes: NODES }, { status: '待审核', currentNodeIndex: 1 });
    expect(view?.reviewerLabel).toBe('本级部门负责人');
    expect(signupAuditText(view!)).toBe('报名审核中（第 2/2 节点） · 当前审核：本级部门负责人');
  });

  it('falls back to plain 审核中 when no nodes configured', () => {
    const view = currentSignupAudit({ signupApprovalNodes: [] }, { status: '待审核' });
    expect(signupAuditText(view!)).toBe('报名审核中');
  });

  it('labels parent-level leader nodes', () => {
    expect(approvalNodeReviewerLabel({ id: 'x', assigneeMode: 'parentLevelLeader', reviewerIds: [] })).toBe(
      '上级部门负责人',
    );
    expect(approvalNodeReviewerLabel({ id: 'y', assigneeMode: 'people', reviewerIds: [] })).toBe('—');
  });
});
