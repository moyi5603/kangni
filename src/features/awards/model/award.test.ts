import { describe, expect, it } from 'vitest';
import {
  canDeleteAward,
  canToggleResultPublic,
  resolveAwardStatus,
  resolveResultPublicityLabel,
  type AwardRecord,
  validateAwardTimeOrder,
} from './award';

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
});

describe('validateAwardTimeOrder', () => {
  it('requires nominate before vote', () => {
    expect(validateAwardTimeOrder('2026-08-10 00:00:00', '2026-08-20 00:00:00')).toBe(true);
    expect(validateAwardTimeOrder('2026-08-20 00:00:00', '2026-08-10 00:00:00')).toBe(false);
  });
});
