import { describe, expect, it } from 'vitest';
import {
  canDeleteCategory,
  canDeleteScope,
  canOperatePendingReview,
  canReviewPeerRecords,
  computeIncentiveOverviewStats,
  DEFAULT_INCENTIVE_SETTINGS,
  displayRecognitionStatus,
  findBadgeOrgNode,
  findQuotaTargetNode,
  QUOTA_TARGET_TREE,
  recognitionHasRiskHit,
  recognitionMatchesRiskFlag,
  parseBadgeDescription,
  parseQuotaBatchRows,
  quotaMonthlyTotal,
  validateBadgeDescription,
  validateCommendationReason,
  type Badge,
  type Recognition,
} from './incentive';

describe('parseBadgeDescription', () => {
  it('requires four titled sections', () => {
    const text = [
      '【行为定义】主动补位',
      '【积分认定标准】- 下班后留下处理故障',
      '【典型场景说明】- 夜班顶岗完成交付',
      '【不计分情形】- 仅口头答应未行动',
    ].join('\n');
    const parsed = parseBadgeDescription(text);
    expect(parsed.definition).toContain('主动补位');
    expect(parsed.criteria.length).toBeGreaterThan(0);
    expect(parsed.examples.length).toBeGreaterThan(0);
    expect(parsed.exclusions.length).toBeGreaterThan(0);
    expect(validateBadgeDescription(text).ok).toBe(true);
    expect(validateBadgeDescription('只有一段').ok).toBe(false);
  });
});

describe('displayRecognitionStatus', () => {
  const peer: Recognition = {
    id: 'RK1',
    type: '同事认可',
    giver: '陈佳',
    receiver: '林晓云',
    department: '轨道交通事业部',
    badgeId: 'b1',
    badgeName: '主动补位',
    points: 20,
    description: '夜班顶岗',
    status: '待审核',
    time: '2026-08-26 09:00',
    riskHits: [],
  };

  it('shows 待审核 when personal review is on', () => {
    expect(displayRecognitionStatus(peer, true)).toBe('待审核');
  });

  it('shows 已发放 when personal review is off', () => {
    expect(displayRecognitionStatus(peer, false)).toBe('已发放');
  });

  it('passes through 已撤回 unchanged', () => {
    const withdrawn: Recognition = {
      ...peer,
      status: '已撤回',
      withdrawnAt: '2026-08-27 10:00',
    };
    expect(displayRecognitionStatus(withdrawn, true)).toBe('已撤回');
    expect(displayRecognitionStatus(withdrawn, false)).toBe('已撤回');
  });
});

describe('recognitionHasRiskHit', () => {
  const rules = DEFAULT_INCENTIVE_SETTINGS.rules;
  const base: Recognition = {
    id: 'RK1',
    type: '同事认可',
    giver: '陈佳',
    receiver: '林晓云',
    department: '轨道交通事业部',
    badgeId: 'b1',
    badgeName: '主动补位',
    points: 20,
    description: '夜班顶岗',
    status: '已发放',
    time: '2026-08-26 09:00',
    riskHits: [],
  };

  it('is false when no hits', () => {
    expect(recognitionHasRiskHit(base, rules)).toBe(false);
  });

  it('is true when an enabled rule hits', () => {
    expect(recognitionHasRiskHit({ ...base, riskHits: [{ rule: 'duplicate', message: '相似' }] }, rules)).toBe(true);
  });

  it('is false when the hit rule is turned off', () => {
    expect(
      recognitionHasRiskHit({ ...base, riskHits: [{ rule: 'duplicate', message: '相似' }] }, { ...rules, duplicate: false }),
    ).toBe(false);
  });

  it('filters by 异常标识', () => {
    const hit = { ...base, riskHits: [{ rule: 'duplicate', message: '相似' }] };
    expect(recognitionMatchesRiskFlag(base, rules, '全部')).toBe(true);
    expect(recognitionMatchesRiskFlag(hit, rules, '异常')).toBe(true);
    expect(recognitionMatchesRiskFlag(base, rules, '异常')).toBe(false);
    expect(recognitionMatchesRiskFlag(base, rules, '正常')).toBe(true);
    expect(recognitionMatchesRiskFlag(hit, rules, '正常')).toBe(false);
  });
});

describe('canDeleteScope', () => {
  it('blocks delete when badges still use the scope', () => {
    const badges: Badge[] = [
      {
        id: 'b1',
        scopeId: 'peer',
        categoryId: 'c1',
        name: '主动补位',
        points: 20,
        iconUrl: '',
        definition: 'd',
        criteria: ['c'],
        examples: ['e'],
        exclusions: ['x'],
        orgIds: ['康尼集团'],
        enabled: true,
        riskLabel: '低风险',
      },
    ];
    expect(canDeleteScope('peer', badges)).toBe(false);
    expect(canDeleteScope('company', badges)).toBe(true);
  });
});

describe('canDeleteCategory', () => {
  it('blocks delete when badges still use the category', () => {
    const badges: Badge[] = [
      {
        id: 'b1',
        scopeId: 'peer',
        categoryId: 'c1',
        name: '主动补位',
        points: 20,
        iconUrl: '',
        definition: 'd',
        criteria: ['c'],
        examples: ['e'],
        exclusions: ['x'],
        orgIds: ['康尼集团'],
        enabled: true,
        riskLabel: '低风险',
      },
    ];
    expect(canDeleteCategory('c1', badges)).toBe(false);
    expect(canDeleteCategory('c2', badges)).toBe(true);
  });
});

describe('quotaMonthlyTotal', () => {
  it('multiplies headcount by per-person quota', () => {
    expect(quotaMonthlyTotal(10, 200)).toBe(2000);
  });
});

describe('validateCommendationReason', () => {
  it('enforces minimum length from settings', () => {
    expect(validateCommendationReason('短', 10).ok).toBe(false);
    expect(validateCommendationReason('发生场景—具体行为—产生结果足够长', 10).ok).toBe(true);
  });
});

describe('parseQuotaBatchRows', () => {
  it('reads name and budget after header', () => {
    const parsed = parseQuotaBatchRows([
      ['对象', '单人月度积分额度'],
      ['轨道交通事业部', 210],
      ['不存在的对象', '80'],
      ['', 1],
      ['生产中心', 'abc'],
    ]);
    expect(parsed.ok).toEqual([
      { name: '轨道交通事业部', budget: 210 },
      { name: '不存在的对象', budget: 80 },
    ]);
    expect(parsed.errors.some((item) => item.includes('生产中心'))).toBe(true);
  });
});

describe('findBadgeOrgNode', () => {
  it('finds nested org by value', () => {
    expect(findBadgeOrgNode('轨道交通事业部-技术部')?.title).toBe('技术部');
    expect(findBadgeOrgNode('不存在')).toBeUndefined();
  });

  it('does not include people under orgs', () => {
    expect(findBadgeOrgNode('林晓云')).toBeUndefined();
  });
});

describe('QUOTA_TARGET_TREE', () => {
  it('keeps org nodes and nests people under matching orgs', () => {
    expect(findQuotaTargetNode('轨道交通事业部-技术部')?.title).toBe('技术部');
    expect(findQuotaTargetNode('林晓云')?.kind).toBe('person');
    expect(QUOTA_TARGET_TREE[0].title).toBe('康尼集团');
  });
});

describe('canReviewPeerRecords', () => {
  it('requires the switch on and the user in reviewerIds', () => {
    expect(
      canReviewPeerRecords(
        { ...DEFAULT_INCENTIVE_SETTINGS, personalReviewEnabled: true, reviewerIds: ['陈佳'] },
        '陈佳',
      ),
    ).toBe(true);
    expect(
      canReviewPeerRecords(
        { ...DEFAULT_INCENTIVE_SETTINGS, personalReviewEnabled: true, reviewerIds: ['陈佳'] },
        '林晓云',
      ),
    ).toBe(false);
    expect(
      canReviewPeerRecords(
        { ...DEFAULT_INCENTIVE_SETTINGS, personalReviewEnabled: false, reviewerIds: ['陈佳'] },
        '陈佳',
      ),
    ).toBe(false);
  });
});

describe('canOperatePendingReview', () => {
  it('only when displayed pending and current user can review', () => {
    expect(canOperatePendingReview('待审核', true)).toBe(true);
    expect(canOperatePendingReview('待审核', false)).toBe(false);
    expect(canOperatePendingReview('已发放', true)).toBe(false);
  });
});

describe('computeIncentiveOverviewStats', () => {
  const rules = DEFAULT_INCENTIVE_SETTINGS.rules;
  const rec = (id: string, extra: Partial<Recognition>): Recognition => ({
    id,
    type: '同事认可',
    giver: '陈佳',
    receiver: '林晓云',
    department: '轨道交通事业部',
    badgeId: 'b1',
    badgeName: '主动补位',
    points: 20,
    description: '夜班顶岗',
    status: '已发放',
    time: '2026-08-26 09:00',
    riskHits: [],
    ...extra,
  });

  it('counts pending, issued, points, risk and badge mix', () => {
    const stats = computeIncentiveOverviewStats({
      recognitions: [
        rec('a', { status: '待审核' }),
        rec('b', { status: '已发放', points: 15, badgeName: '跨部门协作' }),
        rec('c', { status: '已发放', points: 20, riskHits: [{ rule: 'duplicate', message: '相似' }] }),
        rec('d', { status: '已驳回' }),
      ],
      badges: [
        { id: 'b1', enabled: true } as Badge,
        { id: 'b2', enabled: true } as Badge,
        { id: 'b3', enabled: false } as Badge,
      ],
      rules,
    });
    expect(stats.pendingCount).toBe(1);
    expect(stats.issuedCount).toBe(2);
    expect(stats.totalPoints).toBe(35);
    expect(stats.riskCount).toBe(1);
    expect(stats.enabledBadgeCount).toBe(2);
    expect(stats.statusCounts).toEqual({ 已发放: 2, 待审核: 1, 已驳回: 1, 已撤回: 0 });
    expect(stats.badgeCounts).toEqual({ 跨部门协作: 1, 主动补位: 1 });
  });
});

