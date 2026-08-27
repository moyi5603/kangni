import { describe, expect, it } from 'vitest';
import {
  canReviewInterestGroup,
  interestGroupEntityAuditStatuses,
  validateInterestGroupForm,
  type InterestGroupFormValues,
} from './interestGroup';

const base: InterestGroupFormValues = {
  name: '测试小组',
  categoryKey: 'sport',
  leadEmployeeId: '',
  joinMode: 'free',
  area: '',
  tags: [],
  intro: '',
  coverUrl: '/cover.jpg',
};

describe('validateInterestGroupForm', () => {
  it('asks for 小组负责人 instead of 组长', () => {
    expect(validateInterestGroupForm(base, false)).toBe('请选择小组负责人');
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
