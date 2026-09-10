import { describe, expect, it } from 'vitest';
import {
  CHECKIN_OWNER_APP_LABEL,
  canDeleteCheckinTheme,
  checkinStatusOf,
  calendarDayKey,
  nextStreak,
  shouldGrantReward,
  submitCheckinResult,
  type CheckinTheme,
  type CheckinLog,
  type RewardGrant,
  type RewardRule,
} from './checkin';

const now = Date.parse('2026-09-10T12:00:00+08:00');

const rule = (partial: Partial<RewardRule>): RewardRule => ({
  id: 'r1',
  trigger: 'each',
  enableMedal: false,
  enablePoints: true,
  points: 10,
  enableLotteryChance: false,
  lotteryChance: 0,
  repeat: 'repeat',
  ...partial,
});

const theme = (partial: Partial<CheckinTheme> = {}): CheckinTheme => ({
  id: 1,
  title: '文化晨读',
  ownerApp: 'culture',
  tags: ['阅读'],
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  rules: [rule({})],
  ...partial,
});

describe('checkinStatusOf', () => {
  it('derives 未开始 / 进行中 / 已结束 from range', () => {
    expect(checkinStatusOf(theme(), Date.parse('2026-08-31T12:00:00+08:00'))).toBe('未开始');
    expect(checkinStatusOf(theme(), now)).toBe('进行中');
    expect(checkinStatusOf(theme(), Date.parse('2026-10-01T00:00:00+08:00'))).toBe('已结束');
  });
});

describe('calendarDayKey', () => {
  it('uses Asia/Shanghai calendar day', () => {
    expect(calendarDayKey('2026-09-10 00:30')).toBe('2026-09-10');
    expect(calendarDayKey('2026-09-10 23:59')).toBe('2026-09-10');
  });
});

describe('nextStreak', () => {
  it('starts at 1 and increments consecutive days', () => {
    expect(nextStreak([], '2026-09-10')).toBe(1);
    expect(nextStreak(['2026-09-09'], '2026-09-10')).toBe(2);
  });

  it('resets after a missed day', () => {
    expect(nextStreak(['2026-09-08'], '2026-09-10')).toBe(1);
  });

  it('walks consecutive Shanghai calendar days', () => {
    expect(nextStreak(['2026-09-07', '2026-09-08', '2026-09-09'], '2026-09-10')).toBe(4);
  });
});

describe('shouldGrantReward', () => {
  it('grants each-checkin every time when repeatable', () => {
    expect(shouldGrantReward(rule({ trigger: 'each', repeat: 'repeat' }), { streak: 1, total: 1, alreadyGranted: false })).toBe(true);
  });

  it('skips once-only after already granted', () => {
    expect(shouldGrantReward(rule({ trigger: 'streak', streakDays: 7, enablePoints: false, enableMedal: true, medalId: 'attend', repeat: 'once' }), { streak: 7, total: 7, alreadyGranted: true })).toBe(false);
  });

  it('requires streak / total thresholds', () => {
    expect(shouldGrantReward(rule({ trigger: 'streak', streakDays: 7 }), { streak: 6, total: 6, alreadyGranted: false })).toBe(false);
    expect(shouldGrantReward(rule({ trigger: 'total', totalTimes: 5 }), { streak: 1, total: 5, alreadyGranted: false })).toBe(true);
  });
});

describe('submitCheckinResult', () => {
  it('rejects outside range and same calendar day', () => {
    expect(submitCheckinResult({ theme: theme(), logs: [], grants: [], userId: 'u1', at: '2026-08-01 09:00' }).ok).toBe(false);
    const first = submitCheckinResult({
      theme: theme(),
      logs: [],
      grants: [],
      userId: 'u1',
      user: '张三',
      department: '品牌文化部',
      account: 'zhangsan',
      at: '2026-09-10 09:00',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = submitCheckinResult({
      theme: theme(),
      logs: first.log ? [first.log] : [],
      grants: first.grants,
      userId: 'u1',
      at: '2026-09-10 18:00',
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe('今日已打卡');
  });

  it('writes points grant for each checkin and medal once on streak', () => {
    const mixed: CheckinTheme = theme({
      rules: [
        rule({ id: 'points', trigger: 'each', enablePoints: true, points: 2, repeat: 'repeat' }),
        rule({
          id: 'medal',
          trigger: 'streak',
          streakDays: 2,
          enablePoints: false,
          enableMedal: true,
          medalId: 'attend',
          repeat: 'once',
        }),
      ],
    });
    const day1 = submitCheckinResult({
      theme: mixed,
      logs: [],
      grants: [],
      userId: 'u1',
      user: '张三',
      department: '品牌',
      account: 'zhangsan',
      at: '2026-09-09 09:00',
    });
    expect(day1.ok).toBe(true);
    if (!day1.ok) return;
    expect(day1.grants.map((g) => g.rewardKind)).toEqual(['积分']);
    const day2 = submitCheckinResult({
      theme: mixed,
      logs: [day1.log as CheckinLog],
      grants: day1.grants,
      userId: 'u1',
      user: '张三',
      department: '品牌',
      account: 'zhangsan',
      at: '2026-09-10 09:00',
    });
    expect(day2.ok).toBe(true);
    if (!day2.ok) return;
    expect(day2.grants.map((g) => g.rewardKind).sort()).toEqual(['勋章', '积分']);
  });
});

describe('canDeleteCheckinTheme', () => {
  it('blocks delete when logs, grants or lottery links exist', () => {
    expect(canDeleteCheckinTheme({ logCount: 0, grantCount: 0, lotteryLinkCount: 0 })).toBe(true);
    expect(canDeleteCheckinTheme({ logCount: 1, grantCount: 0, lotteryLinkCount: 0 })).toBe(false);
    expect(canDeleteCheckinTheme({ logCount: 0, grantCount: 1, lotteryLinkCount: 0 })).toBe(false);
    expect(canDeleteCheckinTheme({ logCount: 0, grantCount: 0, lotteryLinkCount: 1 })).toBe(false);
  });
});

describe('labels', () => {
  it('maps owner apps', () => {
    expect(CHECKIN_OWNER_APP_LABEL.culture).toBe('文化打卡');
    expect(CHECKIN_OWNER_APP_LABEL['skills-contest']).toBe('技能大赛');
  });
});
