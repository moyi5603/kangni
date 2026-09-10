import { beforeEach, describe, expect, it } from 'vitest';
import { getLotteries, getLotteryChanceLedger, __resetLotteryStoreForTests, saveLottery } from '../../lottery/model/lotteryStore';
import { initialGrants } from './checkin';
import {
  __resetCheckinStoreForTests,
  distinctCheckinUsers,
  removeTheme,
  setLotteryLinkCounter,
  submitUserCheckin,
} from './checkinStore';

describe('checkinStore', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
    __resetLotteryStoreForTests();
  });

  it('rejects a second checkin on the same day', () => {
    const first = submitUserCheckin({ themeId: 2, userId: 'u9', user: '王五', department: '生产', account: 'wangwu', at: '2026-09-10 10:00' });
    expect(first.ok).toBe(true);
    const second = submitUserCheckin({ themeId: 2, userId: 'u9', user: '王五', department: '生产', account: 'wangwu', at: '2026-09-10 11:00' });
    expect(second.ok).toBe(false);
  });

  it('counts distinct users per theme', () => {
    expect(distinctCheckinUsers(1)).toBe(1);
  });

  it('blocks removeTheme when logs exist', () => {
    expect(removeTheme(1).ok).toBe(false);
  });

  it('blocks removeTheme when lottery links exist', () => {
    setLotteryLinkCounter(() => 1);
    expect(removeTheme(3).ok).toBe(false);
  });

  it('keeps seed theme-2 lottery grant as 未入账', () => {
    const grant = initialGrants.find((item) => item.id === 2);
    expect(grant?.status).toBe('未入账');
    expect(grant?.content).toBe('+1');
  });

  it('credits checkin lottery chance into linked in-progress raffles', () => {
    const [first] = getLotteries();
    saveLottery({
      ...first,
      startAt: '2026-09-01 00:00',
      endAt: '2026-09-30 23:59',
      gainCheckinEnabled: true,
      gainCheckinThemeIds: [2],
    });
    const result = submitUserCheckin({
      themeId: 2,
      userId: 'u9',
      user: '王五',
      department: '生产',
      account: 'wangwu',
      at: '2026-09-10 10:00',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const chanceGrant = result.grants.find((item) => item.rewardKind === '抽奖次数');
    expect(chanceGrant?.status).toBe('成功');
    expect(chanceGrant?.content).toBe('+1');
    const ledger = getLotteryChanceLedger();
    expect(ledger.some((item) => item.source === 'checkin' && item.userId === 'u9' && item.lotteryId === first.id)).toBe(true);
  });

  it('marks grant 未入账 when no lottery lists the theme', () => {
    const result = submitUserCheckin({
      themeId: 2,
      userId: 'u9',
      user: '王五',
      department: '生产',
      account: 'wangwu',
      at: '2026-09-10 10:00',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const chanceGrant = result.grants.find((item) => item.rewardKind === '抽奖次数');
    expect(chanceGrant?.status).toBe('未入账');
    expect(chanceGrant?.content).toContain('（尚未被抽奖关联）');
    expect(getLotteryChanceLedger()).toHaveLength(0);
  });

  it('marks grant 未入账 when linked raffles are unavailable', () => {
    const ended = getLotteries().find((item) => item.id === 3);
    if (!ended) throw new Error('missing seed lottery 3');
    saveLottery({
      ...ended,
      gainCheckinEnabled: true,
      gainCheckinThemeIds: [2],
    });
    const result = submitUserCheckin({
      themeId: 2,
      userId: 'u9',
      user: '王五',
      department: '生产',
      account: 'wangwu',
      at: '2026-09-10 10:00',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const chanceGrant = result.grants.find((item) => item.rewardKind === '抽奖次数');
    expect(chanceGrant?.status).toBe('未入账');
    expect(chanceGrant?.content).toContain('（关联抽奖已不可用）');
    expect(getLotteryChanceLedger()).toHaveLength(0);
  });
});
