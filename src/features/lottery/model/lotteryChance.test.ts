import { describe, expect, it } from 'vitest';
import { remainingLotteryChance, grantDailyLoginChance, grantInitialChance, creditCheckinChance, type LotteryChanceLedger } from './lotteryChance';
import type { LotteryRecord } from './lottery';

const lottery = (partial: Partial<LotteryRecord> = {}): LotteryRecord => ({
  id: 1,
  title: '测试抽奖',
  coverUrl: '',
  description: '',
  form: '大转盘',
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  dailyChance: 1,
  totalChanceEnabled: false,
  totalChance: 0,
  maxWins: 1,
  consumeChanceOnWin: true,
  showRemaining: false,
  showWinners: true,
  missText: '谢谢参与',
  audienceKind: 'org',
  orgScope: 'all',
  audienceDepartments: [],
  audienceFileName: '',
  audiencePeople: [],
  enabled: true,
  participants: 0,
  prizes: [],
  gainInitialEnabled: false,
  gainInitialCount: 1,
  gainDailyLoginEnabled: false,
  gainDailyLoginCount: 1,
  gainCheckinEnabled: true,
  gainCheckinCount: 1,
  gainCheckinThemeIds: [2],
  ...partial,
});

describe('creditCheckinChance', () => {
  it('credits each linked in-progress lottery', () => {
    const now = Date.parse('2026-09-10T12:00:00+08:00');
    const ledger: LotteryChanceLedger[] = [];
    const result = creditCheckinChance({
      themeId: 2,
      userId: 'u2',
      at: '2026-09-10 09:00',
      lotteries: [lottery({ id: 1, gainCheckinCount: 3 })],
      ledger,
      now,
    });
    expect(result.creditedLotteryIds).toEqual([1]);
    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0]).toMatchObject({
      lotteryId: 1,
      userId: 'u2',
      source: 'checkin',
      amount: 3,
      at: '2026-09-10 09:00',
    });
  });

  it('skips ended or unlinked lotteries', () => {
    const now = Date.parse('2026-09-10T12:00:00+08:00');
    const result = creditCheckinChance({
      themeId: 2,
      userId: 'u2',
      at: '2026-09-10 09:00',
      lotteries: [
        lottery({ id: 1, gainCheckinThemeIds: [1] }),
        lottery({ id: 3, endAt: '2026-09-08 18:00', startAt: '2026-09-01 09:00' }),
      ],
      ledger: [],
      now,
    });
    expect(result.creditedLotteryIds).toEqual([]);
    expect(result.ledger).toHaveLength(0);
  });
});

describe('grantDailyLoginChance', () => {
  it('appends daily-login once per calendar day', () => {
    const first = grantDailyLoginChance({
      lottery: lottery({ gainDailyLoginEnabled: true, gainDailyLoginCount: 2 }),
      userId: 'u2',
      day: '2026-09-10',
      ledger: [],
    });
    expect(first.ledger).toHaveLength(1);
    expect(first.ledger[0]).toMatchObject({
      lotteryId: 1,
      userId: 'u2',
      source: 'daily-login',
      amount: 2,
    });

    const second = grantDailyLoginChance({
      lottery: lottery({ gainDailyLoginEnabled: true, gainDailyLoginCount: 2 }),
      userId: 'u2',
      day: '2026-09-10 18:00',
      ledger: first.ledger,
    });
    expect(second.ledger).toHaveLength(1);

    const nextDay = grantDailyLoginChance({
      lottery: lottery({ gainDailyLoginEnabled: true, gainDailyLoginCount: 2 }),
      userId: 'u2',
      day: '2026-09-11',
      ledger: second.ledger,
    });
    expect(nextDay.ledger).toHaveLength(2);
  });

  it('skips when daily login source is off', () => {
    const result = grantDailyLoginChance({
      lottery: lottery({ gainDailyLoginEnabled: false, gainDailyLoginCount: 3 }),
      userId: 'u2',
      day: '2026-09-10',
      ledger: [],
    });
    expect(result.ledger).toHaveLength(0);
  });
});

describe('grantInitialChance', () => {
  it('grants once per user', () => {
    const item = lottery({ gainInitialEnabled: true, gainInitialCount: 3 });
    const first = grantInitialChance({ lottery: item, userId: 'u2', ledger: [], at: '2026-09-14 09:00' });
    expect(first.ledger[0]).toMatchObject({ source: 'initial', amount: 3, userId: 'u2' });
    const second = grantInitialChance({ lottery: item, userId: 'u2', ledger: first.ledger, at: '2026-09-14 10:00' });
    expect(second.ledger).toHaveLength(1);
  });
});

describe('remainingLotteryChance', () => {
  it('subtracts draws and caps by dailyChance', () => {
    const item = lottery({ dailyChance: 1, gainDailyLoginEnabled: true, gainDailyLoginCount: 2 });
    const ledger = grantDailyLoginChance({ lottery: item, userId: 'u2', day: '2026-09-14', ledger: [] }).ledger;
    expect(
      remainingLotteryChance({
        lottery: item,
        userId: 'u2',
        userName: '王磊',
        ledger,
        draws: [],
        day: '2026-09-14',
      }),
    ).toBe(1);
    expect(
      remainingLotteryChance({
        lottery: item,
        userId: 'u2',
        userName: '王磊',
        ledger,
        draws: [{ id: 1, lotteryId: 1, user: '王磊', result: '未中奖', prizeName: '', usedToday: 1, at: '2026-09-14 10:00' }],
        day: '2026-09-14',
      }),
    ).toBe(0);
  });
});
