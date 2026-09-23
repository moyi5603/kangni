import { describe, expect, it } from 'vitest';
import {
  canDeleteLottery,
  canEditLotteryPrizes,
  consolationProbability,
  countLotteryLinksToTheme,
  lotteryStatusOf,
  lotteryAudienceText,
  migrateLotteryChanceSources,
  needsAudienceImport,
  parseLotteryAudienceCsv,
  validateLotteryChanceSources,
  validateLotteryPrizes,
  rollLotteryPrize,
  lotterySpinItems,
  lotterySpinIndex,
  featuredWheelLotteryId,
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
  gainDailyLoginEnabled: true,
  gainDailyLoginCount: 3,
  gainCheckinEnabled: false,
  gainCheckinCount: 1,
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

describe('lotteryAudienceText', () => {
  it('formats org and public audience copy', () => {
    expect(lotteryAudienceText(base)).toBe('组织内 · 全员');
    expect(
      lotteryAudienceText({ ...base, orgScope: 'department', audienceDepartments: ['研发中心'] }),
    ).toBe('组织内 · 按部门（研发中心）');
    expect(lotteryAudienceText({ ...base, orgScope: 'department', audienceDepartments: [] })).toBe(
      '组织内 · 按部门（未选择）',
    );
    expect(
      lotteryAudienceText({
        ...base,
        orgScope: 'import',
        audienceFileName: '名单.csv',
        audiencePeople: [{ name: '张三', phone: '13800001111' }],
      }),
    ).toBe('组织内 · 导入（名单.csv，1 人）');
    expect(lotteryAudienceText({ ...base, orgScope: 'import', audienceFileName: '', audiencePeople: [] })).toBe(
      '组织内 · 导入（未上传）',
    );
    expect(
      lotteryAudienceText({
        ...base,
        audienceKind: 'public',
        orgScope: 'import',
        audienceFileName: '外部.csv',
        audiencePeople: [
          { name: '张三', phone: '13800001111' },
          { name: '李四', phone: '13900002222' },
        ],
      }),
    ).toBe('公开 · 导入（外部.csv，2 人）');
  });
});

describe('parseLotteryAudienceCsv', () => {
  it('fails when name or phone header is missing', () => {
    expect(parseLotteryAudienceCsv('工号,姓名\n1,张三')).toEqual({
      ok: false,
      error: '模板须包含姓名、手机号列',
    });
  });

  it('skips empty rows, counts incomplete rows, and overwrites duplicate phones', () => {
    const text = ['姓名,手机号', '张三,138 0000 1111', '', '李四,', '王五,13800001111', '赵六,13900002222'].join('\n');
    const result = parseLotteryAudienceCsv(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.skipped).toBe(1);
    expect(result.people).toEqual([
      { name: '王五', phone: '13800001111' },
      { name: '赵六', phone: '13900002222' },
    ]);
  });
});

describe('needsAudienceImport', () => {
  it('requires import for public and org import only', () => {
    expect(needsAudienceImport('org', 'all')).toBe(false);
    expect(needsAudienceImport('org', 'department')).toBe(false);
    expect(needsAudienceImport('org', 'import')).toBe(true);
    expect(needsAudienceImport('public', 'all')).toBe(true);
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
      gainCheckinCount: 1,
      gainCheckinThemeIds: [],
    })).toBe('请至少开启一种次数获取途径');
  });

  it('requires checkin count when checkin gain is on', () => {
    expect(validateLotteryChanceSources({
      gainInitialEnabled: false,
      gainDailyLoginEnabled: false,
      gainCheckinEnabled: true,
      gainInitialCount: 1,
      gainDailyLoginCount: 1,
      gainCheckinCount: 0,
      gainCheckinThemeIds: [1],
    })).toBe('请填写每次打卡可得次数');
  });

  it('requires theme ids when checkin gain is on', () => {
    expect(validateLotteryChanceSources({
      gainInitialEnabled: false,
      gainDailyLoginEnabled: false,
      gainCheckinEnabled: true,
      gainInitialCount: 1,
      gainDailyLoginCount: 1,
      gainCheckinCount: 1,
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
      gainCheckinCount: 1,
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
      gainCheckinCount: 1,
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
      gainCheckinCount: 1,
      gainCheckinThemeIds: [],
    });
  });

  it('rolls a prize inside remaining stock and probability', () => {
    const prizes: LotteryPrize[] = [
      { id: 1, name: '耳机', imageUrl: '', quantity: 10, drawn: 0, probability: 20 },
      { id: 2, name: '杯子', imageUrl: '', quantity: 0, drawn: 0, probability: 50 },
    ];
    expect(rollLotteryPrize(prizes, () => 0.1)?.name).toBe('耳机');
    expect(rollLotteryPrize(prizes, () => 0.9)).toBeUndefined();
  });

  it('maps prizes plus miss copy onto a spin board', () => {
    const prizes: LotteryPrize[] = [
      { id: 1, name: '耳机', imageUrl: '', quantity: 10, drawn: 0, probability: 20 },
    ];
    expect(lotterySpinItems(prizes, '谢谢参与').map((item) => item.label)).toEqual(['耳机', '谢谢参与']);
    expect(lotterySpinIndex(lotterySpinItems(prizes, '谢谢参与'), { result: '中奖', prizeName: '耳机' })).toBe(0);
    expect(lotterySpinIndex(lotterySpinItems(prizes, '谢谢参与'), { result: '未中奖', prizeName: '谢谢参与' })).toBe(1);
  });

  it('picks in-progress wheel lottery first', () => {
    expect(
      featuredWheelLotteryId([
        { ...base, id: 2, form: '九宫格' },
        { ...base, id: 8, form: '大转盘', startAt: '2026-09-01 00:00', endAt: '2026-09-30 23:59' },
      ]),
    ).toBe(8);
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
