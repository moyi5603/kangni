import { beforeEach, describe, expect, it } from 'vitest';
import { getLotteries, getLotteryChanceLedger, __resetLotteryStoreForTests, saveLottery } from '../../lottery/model/lotteryStore';
import {
  __resetCheckinStoreForTests,
  distinctCheckinUsers,
  removeTheme,
  setLotteryLinkCounter,
  setCheckinMood,
  submitUserCheckin,
} from './checkinStore';

describe('checkinStore', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
    __resetLotteryStoreForTests();
  });

  it('updates mood on an existing log', () => {
    expect(setCheckinMood(1, '惊喜')).toBe(true);
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

  it('credits linked in-progress raffles on successful checkin', () => {
    const [first] = getLotteries();
    saveLottery({
      ...first,
      startAt: '2026-09-01 00:00',
      endAt: '2026-09-30 23:59',
      gainCheckinEnabled: true,
      gainCheckinCount: 2,
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
    expect(result.grants.every((item) => item.rewardKind === '积分' || item.rewardKind === '勋章')).toBe(true);
    const ledger = getLotteryChanceLedger();
    expect(ledger.some((item) => item.source === 'checkin' && item.userId === 'u9' && item.lotteryId === first.id && item.amount === 2)).toBe(true);
  });

  it('does not credit lottery when no raffle lists the theme', () => {
    const result = submitUserCheckin({
      themeId: 2,
      userId: 'u9',
      user: '王五',
      department: '生产',
      account: 'wangwu',
      at: '2026-09-10 10:00',
    });
    expect(result.ok).toBe(true);
    expect(getLotteryChanceLedger()).toHaveLength(0);
  });

  it('does not credit lottery when linked raffles are unavailable', () => {
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
    expect(getLotteryChanceLedger()).toHaveLength(0);
  });
});
