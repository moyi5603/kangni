import { describe, expect, it } from 'vitest';
import {
  buildAutoAwardResults,
  buildAwardRewardGrants,
  canDeleteAward,
  canEnterAwardResult,
  canGrantAwardRewards,
  canToggleResultPublic,
  grantAwardRewardsBlockReason,
  resultPublicityBlockReason,
  nominationSortFieldOf,
  resolveAwardResults,
  resolveAwardStatus,
  resolveResultPublicityLabel,
  sortAwardsByPin,
  type AwardRecord,
  validateAwardTimeOrder,
} from './award';
import type { AwardNominationRecord } from './awardNomination';

const base: AwardRecord = {
  id: 1,
  name: '年度优秀员工',
  type: '个人',
  nominateEndAt: '2026-08-10 23:59:59',
  voteEndAt: '2026-08-20 23:59:59',
  intro: '简介',
  criteria: ['业绩'],
  winnerCount: 1,
  ranks: [
    {
      rank: 1,
      title: '一等奖',
      enablePoints: true,
      enableMedal: false,
      enableCertificate: false,
      points: 100,
    },
  ],
  visibility: '全员',
  visibilityDepartments: [],
  visibilityPeople: [],
  visibilityImportFileName: '',
  nominatorMode: '全员',
  nominatorDepartments: [],
  nominatorPeople: [],
  nominatorImportFileName: '',
  nomineeScope: '全员',
  nomineeDepartments: [],
  nomineeImportFileName: '',
  publishStatus: '未发布',
  autoPublishOnEnd: false,
  commentsEnabled: true,
  commentsNeedAudit: false,
  voteSortRule: '按票数',
  coverUrl: '/activities/share.jpg',
  pinned: false,
  results: [],
  rewardsGranted: false,
  rewardGrants: [],
  resultPublic: false,
  publicityLocked: false,
  nominationCount: 0,
  pendingNominationCount: 0,
  creator: '产品管理员',
  createdAt: '2026-07-01 10:00:00',
  updatedAt: '2026-07-01 10:00:00',
};

describe('resolveAwardStatus', () => {
  it('maps nominate / vote windows', () => {
    expect(resolveAwardStatus(base, '2026-08-01 00:00:00')).toBe('征集中');
    expect(resolveAwardStatus(base, '2026-08-10 23:59:59')).toBe('征集中');
    expect(resolveAwardStatus(base, '2026-08-11 00:00:00')).toBe('投票中');
    expect(resolveAwardStatus(base, '2026-08-20 23:59:59')).toBe('投票中');
    expect(resolveAwardStatus(base, '2026-08-21 00:00:00')).toBe('已结束');
  });
});

describe('result publicity', () => {
  it('hides label before the award ends', () => {
    expect(resolveResultPublicityLabel(base, '2026-08-05 12:00:00')).toBe('-');
  });

  it('auto-publishes after end when the switch is on and not locked', () => {
    const record = { ...base, autoPublishOnEnd: true };
    expect(resolveResultPublicityLabel(record, '2026-08-21 00:00:00')).toBe('已公示');
  });

  it('keeps unpublished after end when auto is off', () => {
    expect(resolveResultPublicityLabel(base, '2026-08-21 00:00:00')).toBe('未公示');
  });

  it('honors a locked manual unpublish even if auto is on', () => {
    const record = { ...base, autoPublishOnEnd: true, resultPublic: false, publicityLocked: true };
    expect(resolveResultPublicityLabel(record, '2026-08-21 00:00:00')).toBe('未公示');
  });
});

describe('award guards', () => {
  it('allows delete only during collection and unpublished', () => {
    expect(canDeleteAward({ ...base, publishStatus: '未发布' }, '2026-08-05 12:00:00')).toBe(true);
    expect(canDeleteAward({ ...base, publishStatus: '已发布' }, '2026-08-05 12:00:00')).toBe(false);
    expect(canDeleteAward(base, '2026-08-11 12:00:00')).toBe(false);
  });

  it('allows publicity toggle only after end', () => {
    expect(canToggleResultPublic(base, '2026-08-05 12:00:00')).toBe(false);
    expect(canToggleResultPublic(base, '2026-08-21 12:00:00')).toBe(true);
  });

  it('blocks publishing results until they are entered', () => {
    expect(resultPublicityBlockReason(base, '2026-08-21 12:00:00', true)).toBe('请先录入评优结果');
    expect(resultPublicityBlockReason({ ...base, results: [{ rank: 1, rankTitle: '一等奖', nominationId: 1, nominationTitle: '甲', nominees: ['张悦'], voteCount: 3, nominator: '王芳' }] }, '2026-08-21 12:00:00', true)).toBeNull();
    expect(resultPublicityBlockReason(base, '2026-08-05 12:00:00', true)).toBe('结束后才可公示结果');
    expect(resultPublicityBlockReason({ ...base, publicityLocked: true, resultPublic: true }, '2026-08-21 12:00:00', false)).toBeNull();
  });
});

describe('nominationSortFieldOf', () => {
  it('maps vote sort rule to nomination columns', () => {
    expect(nominationSortFieldOf('按时间')).toBe('createdAt');
    expect(nominationSortFieldOf('按票数')).toBe('voteCount');
  });
});

describe('pin and results', () => {
  it('allows entering results only after end and unpublished', () => {
    expect(canEnterAwardResult(base, '2026-08-05 12:00:00')).toBe(false);
    expect(canEnterAwardResult({ ...base, autoPublishOnEnd: true }, '2026-08-21 12:00:00')).toBe(false);
    expect(canEnterAwardResult({ ...base, publicityLocked: true, resultPublic: false }, '2026-08-21 12:00:00')).toBe(true);
    expect(canEnterAwardResult({ ...base, publicityLocked: true, resultPublic: false, rewardsGranted: true }, '2026-08-21 12:00:00')).toBe(false);
  });

  it('sorts pinned awards first', () => {
    const rows = [
      { ...base, id: 1, pinned: false },
      { ...base, id: 2, pinned: true },
      { ...base, id: 3, pinned: false },
    ];
    expect(sortAwardsByPin(rows).map((item) => item.id)).toEqual([2, 1, 3]);
  });

  it('builds auto results from passed nominations by vote', () => {
    const nominations: AwardNominationRecord[] = [
      {
        id: 10,
        awardId: 1,
        title: '乙',
        nominees: ['李明'],
        reason: 'r',
        highlights: ['h'],
        voteCount: 10,
        reviewStatus: '已通过',
        nominator: '王芳',
        createdAt: '2026-08-01 10:00:00',
      },
      {
        id: 11,
        awardId: 1,
        title: '甲',
        nominees: ['张悦'],
        reason: 'r',
        highlights: ['h'],
        voteCount: 30,
        reviewStatus: '已通过',
        nominator: '陈产品',
        createdAt: '2026-08-02 10:00:00',
      },
      {
        id: 12,
        awardId: 1,
        title: '待审',
        nominees: ['陈产品'],
        reason: 'r',
        highlights: ['h'],
        voteCount: 99,
        reviewStatus: '待审核',
        nominator: '张悦',
        createdAt: '2026-08-03 10:00:00',
      },
    ];
    const rows = buildAutoAwardResults(base, nominations);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ rank: 1, rankTitle: '一等奖', nominationId: 11, nominationTitle: '甲', voteCount: 30 });
  });

  it('prefers saved results over auto build', () => {
    const saved = [{ rank: 1, rankTitle: '一等奖', nominationId: 99, nominationTitle: '手工', nominees: ['张悦'], voteCount: 1, nominator: '王芳' }];
    expect(resolveAwardResults({ ...base, results: saved }, [], '2026-08-21 00:00:00').map((item) => item.nominationTitle)).toEqual(['手工']);
  });

  it('grants rank rewards to every nominee and then locks edits', () => {
    const results = [
      { rank: 1, rankTitle: '一等奖', nominationId: 1, nominationTitle: '甲', nominees: ['张悦', '李明'], voteCount: 3, nominator: '王芳' },
    ];
    expect(canGrantAwardRewards(base, '2026-08-05 12:00:00')).toBe(false);
    expect(canGrantAwardRewards(base, '2026-08-21 12:00:00')).toBe(true);
    expect(grantAwardRewardsBlockReason(base, '2026-08-21 12:00:00', [])).toBe('请先录入评优结果');
    expect(grantAwardRewardsBlockReason({ ...base, rewardsGranted: true }, '2026-08-21 12:00:00', results)).toBe('奖励已发放，结果不可修改');
    expect(grantAwardRewardsBlockReason(base, '2026-08-21 12:00:00', results)).toBeNull();
    expect(buildAwardRewardGrants(base, results)).toEqual([
      { name: '张悦', rank: 1, rankTitle: '一等奖', nominationTitle: '甲', points: 100, medalId: undefined, certificateId: undefined },
      { name: '李明', rank: 1, rankTitle: '一等奖', nominationTitle: '甲', points: 100, medalId: undefined, certificateId: undefined },
    ]);
  });
});
