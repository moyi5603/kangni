import { describe, expect, it } from 'vitest';
import {
  canReviewInterestGroup,
  canPublishInterestGroup,
  canRevokeInterestGroup,
  interestGroupEntityAuditStatuses,
  isInterestGroupLead,
  validateInterestGroupForm,
  type InterestGroupFormValues,
} from './interestGroup';

const base: InterestGroupFormValues = {
  name: '测试兴趣圈',
  categoryKey: 'sport',
  leadEmployeeIds: [],
  joinMode: 'free',
  intro: '',
  coverUrl: '/cover.jpg',
};

describe('validateInterestGroupForm', () => {
  it('asks for 兴趣圈负责人 instead of 组长', () => {
    expect(validateInterestGroupForm(base, false)).toBe('请选择兴趣圈负责人');
  });

  it('accepts multiple 兴趣圈负责人', () => {
    expect(validateInterestGroupForm({ ...base, leadEmployeeIds: ['张悦', '赵人事'] }, false)).toBeNull();
  });
});

describe('isInterestGroupLead', () => {
  it('matches any selected lead', () => {
    expect(isInterestGroupLead({ leadEmployeeIds: ['张悦', '赵人事'], leadName: '张悦、赵人事' }, '赵人事')).toBe(true);
    expect(isInterestGroupLead({ leadEmployeeIds: ['张悦'], leadName: '张悦' }, '林浅')).toBe(false);
  });
});

describe('interest group publish', () => {
  it('only unpublished groups can be published', () => {
    expect(canPublishInterestGroup({ publishStatus: '未发布' })).toBe(true);
    expect(canPublishInterestGroup({ publishStatus: '已发布' })).toBe(false);
    expect(canRevokeInterestGroup({ publishStatus: '已发布' })).toBe(true);
    expect(canRevokeInterestGroup({ publishStatus: '未发布' })).toBe(false);
  });
});

describe('interest group audit', () => {
  it('only 待审核 groups can be reviewed', () => {
    expect(interestGroupEntityAuditStatuses).toEqual(['待审核', '已通过', '已驳回', '无需审核']);
    expect(canReviewInterestGroup({ auditStatus: '待审核' })).toBe(true);
    expect(canReviewInterestGroup({ auditStatus: '已通过' })).toBe(false);
    expect(canReviewInterestGroup({ auditStatus: '无需审核' })).toBe(false);
    expect(canReviewInterestGroup({ auditStatus: '已驳回' })).toBe(false);
  });
});
