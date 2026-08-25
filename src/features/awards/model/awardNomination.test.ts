import { describe, expect, it } from 'vitest';
import {
  canReviewNomination,
  filterNominations,
  formatNominatorInfo,
  nominationCounts,
  sortNominations,
  validateNominees,
  type AwardNominationRecord,
} from './awardNomination';

function item(overrides: Partial<AwardNominationRecord> = {}): AwardNominationRecord {
  return {
    id: 1,
    awardId: 2,
    title: '研发协同小组',
    nominees: ['张悦', '李明'],
    reason: '跨组协作稳定交付',
    highlights: '按时上线评优模块',
    voteCount: 12,
    reviewStatus: '待审核',
    nominator: '产品管理员',
    createdAt: '2026-08-10 10:00:00',
    ...overrides,
  };
}

describe('validateNominees', () => {
  it('requires exactly one person for personal awards', () => {
    expect(validateNominees('个人', [])).toBe('个人评优请选择 1 人');
    expect(validateNominees('个人', ['张悦', '李明'])).toBe('个人评优请选择 1 人');
    expect(validateNominees('个人', ['张悦'])).toBeNull();
  });

  it('requires at least one person for team or project awards', () => {
    expect(validateNominees('团队', [])).toBe('请选择提名名单');
    expect(validateNominees('项目', ['张悦'])).toBeNull();
    expect(validateNominees('团队', ['张悦', '李明'])).toBeNull();
  });
});

describe('canReviewNomination', () => {
  it('only pending nominations can be reviewed', () => {
    expect(canReviewNomination(item())).toBe(true);
    expect(canReviewNomination(item({ reviewStatus: '已通过' }))).toBe(false);
    expect(canReviewNomination(item({ reviewStatus: '已驳回' }))).toBe(false);
  });
});

describe('sortNominations', () => {
  const rows = [
    item({ id: 1, voteCount: 3, createdAt: '2026-08-12 10:00:00' }),
    item({ id: 2, voteCount: 20, createdAt: '2026-08-10 10:00:00' }),
    item({ id: 3, voteCount: 8, createdAt: '2026-08-11 10:00:00' }),
  ];

  it('sorts by vote count', () => {
    expect(sortNominations(rows, 'voteCount', 'descend').map((row) => row.id)).toEqual([2, 3, 1]);
    expect(sortNominations(rows, 'voteCount', 'ascend').map((row) => row.id)).toEqual([1, 3, 2]);
  });

  it('sorts by created time', () => {
    expect(sortNominations(rows, 'createdAt', 'descend').map((row) => row.id)).toEqual([1, 3, 2]);
    expect(sortNominations(rows, 'createdAt', 'ascend').map((row) => row.id)).toEqual([2, 3, 1]);
  });
});

describe('nominationCounts', () => {
  it('counts total and pending', () => {
    expect(
      nominationCounts([
        item({ reviewStatus: '待审核' }),
        item({ reviewStatus: '已通过' }),
        item({ reviewStatus: '已驳回' }),
      ]),
    ).toEqual({ total: 3, pending: 1 });
  });
});

describe('filterNominations', () => {
  const rows = [
    item({ id: 1, title: '研发协同小组', nominator: '张悦', nominees: ['李明'], reviewStatus: '待审核' }),
    item({ id: 2, title: '质量护航', nominator: '陈产品', nominees: ['张悦', '李明'], reviewStatus: '已通过' }),
  ];

  it('filters by title, nominator, nominee and status', () => {
    expect(filterNominations(rows, { title: '协同' }).map((row) => row.id)).toEqual([1]);
    expect(filterNominations(rows, { nominator: '陈' }).map((row) => row.id)).toEqual([2]);
    expect(filterNominations(rows, { nominee: '张悦' }).map((row) => row.id)).toEqual([2]);
    expect(filterNominations(rows, { reviewStatus: '待审核' }).map((row) => row.id)).toEqual([1]);
  });
});

describe('formatNominatorInfo', () => {
  it('shows name with department when known', () => {
    expect(formatNominatorInfo('张悦')).toContain('张悦');
    expect(formatNominatorInfo('张悦')).toMatch(/[（(]/);
  });

  it('falls back to name when person is unknown', () => {
    expect(formatNominatorInfo('产品管理员')).toBe('产品管理员');
  });
});
