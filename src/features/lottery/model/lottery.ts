export type LotteryFormKind = '大转盘' | '九宫格' | '砸金蛋';

export type LotteryStatus = '未开始' | '进行中' | '已结束' | '已停用';

export type LotteryVisibilityScope = '全员' | '按部门' | '导入';

export type LotteryPrize = {
  id: number;
  name: string;
  imageUrl: string;
  quantity: number;
  drawn: number;
  probability: number;
};

export type LotteryRecord = {
  id: number;
  title: string;
  coverUrl: string;
  description: string;
  form: LotteryFormKind;
  startAt: string;
  endAt: string;
  dailyChance: number;
  gainInitialEnabled: boolean;
  gainInitialCount: number;
  gainDailyLoginEnabled: boolean;
  gainDailyLoginCount: number;
  gainCheckinEnabled: boolean;
  gainCheckinThemeIds: number[];
  totalChanceEnabled: boolean;
  totalChance: number;
  maxWins: number;
  consumeChanceOnWin: boolean;
  showRemaining: boolean;
  showWinners: boolean;
  missText: string;
  visibilityEnabled: boolean;
  visibilityScope: LotteryVisibilityScope;
  visibilityDepartments: string[];
  visibilityFileName: string;
  enabled: boolean;
  participants: number;
  prizes: LotteryPrize[];
};

export type LotteryWin = {
  id: number;
  lotteryId: number;
  user: string;
  department: string;
  prizeName: string;
  at: string;
};

export type LotteryDraw = {
  id: number;
  lotteryId: number;
  user: string;
  result: '中奖' | '未中奖';
  prizeName: string;
  usedToday: number;
  at: string;
};

export const LOTTERY_STATUS_OPTIONS: LotteryStatus[] = ['未开始', '进行中', '已结束', '已停用'];

export const LOTTERY_FORM_OPTIONS: LotteryFormKind[] = ['大转盘', '九宫格', '砸金蛋'];

export const LOTTERY_VISIBILITY_SCOPES: LotteryVisibilityScope[] = ['全员', '按部门', '导入'];

export function parseLotteryTime(value: string): number {
  return Date.parse(value.replace(' ', 'T'));
}

export function lotteryTimeStatusOf(record: Pick<LotteryRecord, 'startAt' | 'endAt'>, now: number = Date.now()): Exclude<LotteryStatus, '已停用'> {
  const start = parseLotteryTime(record.startAt);
  const end = parseLotteryTime(record.endAt);
  if (Number.isFinite(start) && now < start) return '未开始';
  if (Number.isFinite(end) && now > end) return '已结束';
  return '进行中';
}

export function lotteryStatusOf(record: Pick<LotteryRecord, 'startAt' | 'endAt' | 'enabled'>, now: number = Date.now()): LotteryStatus {
  if (!record.enabled) return '已停用';
  return lotteryTimeStatusOf(record, now);
}

export function canEditLotteryPrizes(record: Pick<LotteryRecord, 'startAt' | 'endAt' | 'enabled'>, now: number = Date.now()): boolean {
  return lotteryStatusOf(record, now) === '未开始';
}

export function canDeleteLottery(record: Pick<LotteryRecord, 'startAt' | 'endAt' | 'enabled'>, now: number = Date.now()): boolean {
  return lotteryStatusOf(record, now) === '未开始';
}

export function prizeProbabilitySum(prizes: LotteryPrize[]): number {
  const sum = prizes.reduce((total, item) => total + item.probability, 0);
  return Math.round(sum * 10) / 10;
}

export function consolationProbability(prizes: LotteryPrize[]): number {
  return Math.round((100 - prizeProbabilitySum(prizes)) * 10) / 10;
}

export function validateLotteryPrizes(prizes: LotteryPrize[]): string | null {
  if (!prizes.length) return '请至少添加一个奖品';
  if (prizes.some((item) => !item.name.trim())) return '请填写奖品名称';
  if (prizeProbabilitySum(prizes) > 100) return '奖品概率合计不能超过 100%';
  return null;
}

export type LotteryChanceSources = Pick<
  LotteryRecord,
  | 'gainInitialEnabled'
  | 'gainInitialCount'
  | 'gainDailyLoginEnabled'
  | 'gainDailyLoginCount'
  | 'gainCheckinEnabled'
  | 'gainCheckinThemeIds'
>;

export function migrateLotteryChanceSources(
  record: Partial<LotteryChanceSources> & { dailyChance?: number },
): LotteryChanceSources {
  const migrated = record.gainInitialEnabled !== undefined
    || record.gainDailyLoginEnabled !== undefined
    || record.gainCheckinEnabled !== undefined;
  if (migrated) {
    return {
      gainInitialEnabled: record.gainInitialEnabled ?? false,
      gainInitialCount: record.gainInitialCount ?? 1,
      gainDailyLoginEnabled: record.gainDailyLoginEnabled ?? false,
      gainDailyLoginCount: record.gainDailyLoginCount ?? 1,
      gainCheckinEnabled: record.gainCheckinEnabled ?? false,
      gainCheckinThemeIds: record.gainCheckinThemeIds ?? [],
    };
  }
  return {
    gainInitialEnabled: false,
    gainInitialCount: 1,
    gainDailyLoginEnabled: true,
    gainDailyLoginCount: record.dailyChance ?? 1,
    gainCheckinEnabled: false,
    gainCheckinThemeIds: [],
  };
}

export function validateLotteryChanceSources(sources: LotteryChanceSources): string | null {
  if (!sources.gainInitialEnabled && !sources.gainDailyLoginEnabled && !sources.gainCheckinEnabled) {
    return '请至少开启一种次数获取途径';
  }
  if (sources.gainCheckinEnabled && sources.gainCheckinThemeIds.length < 1) {
    return '请选择关联打卡主题';
  }
  if (sources.gainInitialEnabled && sources.gainInitialCount < 1) {
    return '请填写每人初始次数';
  }
  if (sources.gainDailyLoginEnabled && sources.gainDailyLoginCount < 1) {
    return '请填写每日登录次数';
  }
  return null;
}

export function countLotteryLinksToTheme(lotteries: LotteryRecord[], themeId: number): number {
  return lotteries.filter((item) => item.gainCheckinEnabled && item.gainCheckinThemeIds.includes(themeId)).length;
}

export function lotteryVisibilityText(record: LotteryRecord): string {
  if (!record.visibilityEnabled) return '不限制';
  if (record.visibilityScope === '按部门') return `按部门（${record.visibilityDepartments.join('、') || '未选择'}）`;
  if (record.visibilityScope === '导入') return `导入名单（${record.visibilityFileName || '未上传'}）`;
  return '全员';
}

export const initialLotteries: LotteryRecord[] = [
  {
    id: 1,
    title: '年会幸运大奖',
    coverUrl: '',
    description: '年会现场大转盘，抽出年度幸运鹅。',
    form: '大转盘',
    startAt: '2026-09-10 09:00',
    endAt: '2026-09-10 18:00',
    dailyChance: 1,
    gainInitialEnabled: false,
    gainInitialCount: 1,
    gainDailyLoginEnabled: true,
    gainDailyLoginCount: 1,
    gainCheckinEnabled: false,
    gainCheckinThemeIds: [],
    totalChanceEnabled: true,
    totalChance: 3,
    maxWins: 1,
    consumeChanceOnWin: true,
    showRemaining: false,
    showWinners: true,
    missText: '谢谢参与',
    visibilityEnabled: true,
    visibilityScope: '全员',
    visibilityDepartments: [],
    visibilityFileName: '',
    enabled: true,
    participants: 1286,
    prizes: [
      { id: 1, name: 'iPhone 16 Pro', imageUrl: '', quantity: 1, drawn: 0, probability: 0.5 },
      { id: 2, name: '蓝牙耳机', imageUrl: '', quantity: 10, drawn: 3, probability: 8 },
      { id: 3, name: '定制马克杯', imageUrl: '', quantity: 50, drawn: 12, probability: 20 },
    ],
  },
  {
    id: 2,
    title: '安全生产月抽奖',
    coverUrl: '',
    description: '完成安全答题后可抽奖。',
    form: '九宫格',
    startAt: '2026-09-20 09:00',
    endAt: '2026-09-20 17:00',
    dailyChance: 2,
    gainInitialEnabled: false,
    gainInitialCount: 1,
    gainDailyLoginEnabled: true,
    gainDailyLoginCount: 2,
    gainCheckinEnabled: false,
    gainCheckinThemeIds: [],
    totalChanceEnabled: false,
    totalChance: 0,
    maxWins: 1,
    consumeChanceOnWin: true,
    showRemaining: true,
    showWinners: true,
    missText: '谢谢参与',
    visibilityEnabled: true,
    visibilityScope: '按部门',
    visibilityDepartments: ['生产中心'],
    visibilityFileName: '',
    enabled: true,
    participants: 0,
    prizes: [
      { id: 1, name: '安全帽定制礼盒', imageUrl: '', quantity: 20, drawn: 0, probability: 15 },
      { id: 2, name: '反光背心', imageUrl: '', quantity: 40, drawn: 0, probability: 25 },
    ],
  },
  {
    id: 3,
    title: '中秋团圆抽奖',
    coverUrl: '',
    description: '中秋福利砸金蛋。',
    form: '砸金蛋',
    startAt: '2026-09-01 09:00',
    endAt: '2026-09-08 18:00',
    dailyChance: 1,
    gainInitialEnabled: false,
    gainInitialCount: 1,
    gainDailyLoginEnabled: true,
    gainDailyLoginCount: 1,
    gainCheckinEnabled: false,
    gainCheckinThemeIds: [],
    totalChanceEnabled: false,
    totalChance: 0,
    maxWins: 1,
    consumeChanceOnWin: true,
    showRemaining: false,
    showWinners: true,
    missText: '再接再厉',
    visibilityEnabled: false,
    visibilityScope: '全员',
    visibilityDepartments: [],
    visibilityFileName: '',
    enabled: true,
    participants: 842,
    prizes: [
      { id: 1, name: '月饼礼盒', imageUrl: '', quantity: 80, drawn: 80, probability: 30 },
      { id: 2, name: '茶叶礼盒', imageUrl: '', quantity: 20, drawn: 18, probability: 10 },
    ],
  },
];

export const initialLotteryWins: LotteryWin[] = [
  { id: 1, lotteryId: 1, user: '李工', department: '研发中心 · 前端组', prizeName: '蓝牙耳机', at: '2026-09-10 10:12' },
  { id: 2, lotteryId: 1, user: '张敏', department: '生产中心 · 一车间', prizeName: '定制马克杯', at: '2026-09-10 11:03' },
  { id: 3, lotteryId: 3, user: '周洁', department: '品牌文化部', prizeName: '月饼礼盒', at: '2026-09-02 14:20' },
];

export const initialLotteryDraws: LotteryDraw[] = [
  { id: 1, lotteryId: 1, user: '李工', result: '中奖', prizeName: '蓝牙耳机', usedToday: 1, at: '2026-09-10 10:12' },
  { id: 2, lotteryId: 1, user: '赵磊', result: '未中奖', prizeName: '', usedToday: 1, at: '2026-09-10 10:18' },
  { id: 3, lotteryId: 1, user: '张敏', result: '中奖', prizeName: '定制马克杯', usedToday: 1, at: '2026-09-10 11:03' },
  { id: 4, lotteryId: 3, user: '周洁', result: '中奖', prizeName: '月饼礼盒', usedToday: 1, at: '2026-09-02 14:20' },
  { id: 5, lotteryId: 3, user: '陈晨', result: '未中奖', prizeName: '', usedToday: 1, at: '2026-09-03 09:08' },
];
