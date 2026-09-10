import { describe, expect, it } from 'vitest';
import {
  canDeleteLottery,
  canEditLotteryPrizes,
  consolationProbability,
  countLotteryLinksToTheme,
  lotteryStatusOf,
  lotteryVisibilityText,
  migrateLotteryChanceSources,
  validateLotteryChanceSources,
  validateLotteryPrizes,
  type LotteryPrize,
  type LotteryRecord,
} from './lottery';

const base: LotteryRecord = {
  id: 1,
  title: '测试抽奖',
  coverUrl: '',
  description: '',
  form: '大转盘',
  startAt: '2026-09-10 09:00',
  endAt: '2026-09-10 18:00',
  dailyChance: 3,
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
  gainDailyLoginEnabled: true,
  gainDailyLoginCount: 3,
  gainCheckinEnabled: false,
  gainCheckinThemeIds: [],
};

const prizes = (rows: Array<Partial<LotteryPrize>>): LotteryPrize[] =>
  rows.map((item, index) => ({
    id: index + 1,
    name: item.name ?? `奖${index + 1}`,
    imageUrl: '',
    quantity: item.quantity ?? 10,
    drawn: item.drawn ?? 0,
    probability: item.probability ?? 0,
  }));

describe('lotteryStatusOf', () => {
  it('derives 未开始 / 进行中 / 已结束 from time range', () => {
    const during = Date.parse('2026-09-10T12:00');
    const before = Date.parse('2026-09-10T08:00');
    const after = Date.parse('2026-09-10T19:00');
    expect(lotteryStatusOf(base, before)).toBe('未开始');
    expect(lotteryStatusOf(base, during)).toBe('进行中');
    expect(lotteryStatusOf(base, after)).toBe('已结束');
  });

  it('shows 已停用 when enabled is false', () => {
    expect(lotteryStatusOf({ ...base, enabled: false }, Date.parse('2026-09-10T12:00'))).toBe('已停用');
  });
});

describe('lottery prize rules', () => {
  it('assigns remaining probability to 谢谢参与', () => {
    expect(consolationProbability(prizes([{ probability: 10 }, { probability: 25.5 }]))).toBe(64.5);
  });

  it('rejects prize probability sum over 100', () => {
    expect(validateLotteryPrizes(prizes([{ probability: 60 }, { probability: 50 }]))).toBe('奖品概率合计不能超过 100%');
  });

  it('requires at least one prize', () => {
    expect(validateLotteryPrizes([])).toBe('请至少添加一个奖品');
  });

  it('locks prize edits when 进行中', () => {
    const now = Date.parse('2026-09-10T12:00');
    expect(canEditLotteryPrizes(base, now)).toBe(false);
    expect(canEditLotteryPrizes({ ...base, startAt: '2026-09-20 09:00', endAt: '2026-09-20 18:00' }, now)).toBe(true);
    expect(canEditLotteryPrizes({ ...base, startAt: '2026-08-01 09:00', endAt: '2026-08-01 18:00' }, now)).toBe(false);
  });

  it('allows delete only when 未开始', () => {
    const now = Date.parse('2026-09-10T12:00');
    expect(canDeleteLottery(base, now)).toBe(false);
    expect(canDeleteLottery({ ...base, startAt: '2026-09-20 09:00', endAt: '2026-09-20 18:00' }, now)).toBe(true);
    expect(canDeleteLottery({ ...base, enabled: false }, now)).toBe(false);
  });
});

describe('lotteryVisibilityText', () => {
  it('formats 全员 / 按部门 / 导入 / 未开启', () => {
    expect(lotteryVisibilityText(base)).toBe('不限制');
    expect(lotteryVisibilityText({ ...base, visibilityEnabled: true, visibilityScope: '全员' })).toBe('全员');
    expect(
      lotteryVisibilityText({
        ...base,
        visibilityEnabled: true,
        visibilityScope: '按部门',
        visibilityDepartments: ['研发中心'],
      }),
    ).toBe('按部门（研发中心）');
    expect(
      lotteryVisibilityText({
        ...base,
        visibilityEnabled: true,
        visibilityScope: '导入',
        visibilityFileName: '名单.xlsx',
      }),
    ).toBe('导入名单（名单.xlsx）');
  });
});

describe('lottery chance sources', () => {
  it('requires at least one gain switch', () => {
    expect(validateLotteryChanceSources({
      gainInitialEnabled: false,
      gainDailyLoginEnabled: false,
      gainCheckinEnabled: false,
      gainInitialCount: 1,
      gainDailyLoginCount: 1,
      gainCheckinThemeIds: [],
    })).toBe('请至少开启一种次数获取途径');
  });

  it('requires theme ids when checkin gain is on', () => {
    expect(validateLotteryChanceSources({
      gainInitialEnabled: false,
      gainDailyLoginEnabled: false,
      gainCheckinEnabled: true,
      gainInitialCount: 1,
      gainDailyLoginCount: 1,
      gainCheckinThemeIds: [],
    })).toBe('请选择关联打卡主题');
  });

  it('requires initial count when initial gain is on', () => {
    expect(validateLotteryChanceSources({
      gainInitialEnabled: true,
      gainDailyLoginEnabled: false,
      gainCheckinEnabled: false,
      gainInitialCount: 0,
      gainDailyLoginCount: 1,
      gainCheckinThemeIds: [],
    })).toBe('请填写每人初始次数');
  });

  it('requires daily login count when login gain is on', () => {
    expect(validateLotteryChanceSources({
      gainInitialEnabled: false,
      gainDailyLoginEnabled: true,
      gainCheckinEnabled: false,
      gainInitialCount: 1,
      gainDailyLoginCount: 0,
      gainCheckinThemeIds: [],
    })).toBe('请填写每日登录次数');
  });

  it('migrates dailyChance into daily-login grant', () => {
    expect(migrateLotteryChanceSources({ dailyChance: 3 })).toEqual({
      gainInitialEnabled: false,
      gainInitialCount: 1,
      gainDailyLoginEnabled: true,
      gainDailyLoginCount: 3,
      gainCheckinEnabled: false,
      gainCheckinThemeIds: [],
    });
  });

  it('counts lotteries linked to a checkin theme', () => {
    const linked: LotteryRecord = {
      ...base,
      gainCheckinEnabled: true,
      gainCheckinThemeIds: [7, 9],
    };
    expect(countLotteryLinksToTheme([base, linked], 7)).toBe(1);
    expect(countLotteryLinksToTheme([base, linked], 3)).toBe(0);
  });
});
