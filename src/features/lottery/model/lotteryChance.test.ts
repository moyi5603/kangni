import { describe, expect, it } from 'vitest';
import { creditCheckinChance, grantDailyLoginChance, type LotteryChanceLedger } from './lotteryChance';
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
  visibilityEnabled: false,
  visibilityScope: '全员',
  visibilityDepartments: [],
  visibilityFileName: '',
  enabled: true,
  participants: 0,
  prizes: [],
  gainInitialEnabled: false,
  gainInitialCount: 1,
  gainDailyLoginEnabled: false,
  gainDailyLoginCount: 1,
  gainCheckinEnabled: true,
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
      amount: 1,
      at: '2026-09-10 09:00',
      lotteries: [lottery({ id: 1 })],
      ledger,
      now,
    });
    expect(result.creditedLotteryIds).toEqual([1]);
    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0]).toMatchObject({
      lotteryId: 1,
      userId: 'u2',
      source: 'checkin',
      amount: 1,
      at: '2026-09-10 09:00',
    });
  });

  it('skips ended or unlinked lotteries', () => {
    const now = Date.parse('2026-09-10T12:00:00+08:00');
    const result = creditCheckinChance({
      themeId: 2,
      userId: 'u2',
      amount: 1,
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
