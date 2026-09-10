export type CheckinStatus = '未开始' | '进行中' | '已结束';
export type CheckinOwnerApp = 'culture' | 'skills-contest';
export type RewardTrigger = 'each' | 'streak' | 'total';
export type RewardRepeat = 'once' | 'repeat';
export type RewardKind = '勋章' | '积分' | '抽奖次数';
export type GrantStatus = '成功' | '失败' | '未入账';

export const CHECKIN_STATUS_OPTIONS: CheckinStatus[] = ['未开始', '进行中', '已结束'];

export const CHECKIN_OWNER_APP_LABEL: Record<CheckinOwnerApp, string> = {
  culture: '文化打卡',
  'skills-contest': '技能大赛',
};

export type RewardRule = {
  id: string;
  trigger: RewardTrigger;
  streakDays?: number;
  totalTimes?: number;
  enableMedal: boolean;
  medalId?: string;
  enablePoints: boolean;
  points: number;
  enableLotteryChance: boolean;
  lotteryChance: number;
  repeat: RewardRepeat;
};

export type CheckinTheme = {
  id: number;
  title: string;
  ownerApp: CheckinOwnerApp;
  tags: string[];
  startAt: string;
  endAt: string;
  rules: RewardRule[];
};

export type CheckinLog = {
  id: number;
  themeId: number;
  userId: string;
  user: string;
  department: string;
  account: string;
  checkedAt: string;
};

export type RewardGrant = {
  id: number;
  themeId: number;
  ruleId: string;
  userId: string;
  user: string;
  department: string;
  rewardKind: RewardKind;
  content: string;
  ruleSummary: string;
  grantedAt: string;
  status: GrantStatus;
};

export function parseCheckinTime(value: string): number {
  return Date.parse(value.replace(' ', 'T') + '+08:00');
}

export function checkinStatusOf(theme: Pick<CheckinTheme, 'startAt' | 'endAt'>, now: number = Date.now()): CheckinStatus {
  const start = parseCheckinTime(theme.startAt);
  const end = parseCheckinTime(theme.endAt);
  if (now < start) return '未开始';
  if (now > end) return '已结束';
  return '进行中';
}

export function calendarDayKey(value: string): string {
  return value.slice(0, 10);
}

function shanghaiYmd(ms: number): string {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function nextStreak(previousDays: string[], today: string): number {
  const set = new Set(previousDays);
  let count = 1;
  let cursor = Date.parse(`${today}T00:00:00+08:00`);
  for (;;) {
    cursor -= 24 * 60 * 60 * 1000;
    const key = shanghaiYmd(cursor);
    if (!set.has(key)) break;
    count += 1;
  }
  return count;
}

export function uniqueUserDays(logs: CheckinLog[], themeId: number, userId: string): string[] {
  return [
    ...new Set(
      logs
        .filter((item) => item.themeId === themeId && item.userId === userId)
        .map((item) => calendarDayKey(item.checkedAt)),
    ),
  ].sort();
}

export function shouldGrantReward(
  rule: RewardRule,
  stats: { streak: number; total: number; alreadyGranted: boolean },
): boolean {
  if (rule.repeat === 'once' && stats.alreadyGranted) return false;
  if (rule.trigger === 'each') return true;
  if (rule.trigger === 'streak') return stats.streak >= (rule.streakDays ?? 1);
  return stats.total >= (rule.totalTimes ?? 1);
}

export function ruleSummary(rule: RewardRule): string {
  if (rule.trigger === 'each') return '每次打卡';
  if (rule.trigger === 'streak') return `连续 ${rule.streakDays ?? 0} 天`;
  return `累计 ${rule.totalTimes ?? 0} 次`;
}

export function validateRewardRule(rule: RewardRule): string | null {
  if (!rule.enableMedal && !rule.enablePoints && !rule.enableLotteryChance) return '请至少选择一种奖励';
  if (rule.enableMedal && !rule.medalId) return '请选择勋章';
  if (rule.enablePoints && rule.points < 1) return '积分须为正整数';
  if (rule.enableLotteryChance && rule.lotteryChance < 1) return '抽奖次数须为正整数';
  if (rule.trigger === 'streak' && (rule.streakDays ?? 0) < 1) return '请填写连续天数';
  if (rule.trigger === 'total' && (rule.totalTimes ?? 0) < 1) return '请填写累计次数';
  return null;
}

export function canDeleteCheckinTheme(input: { logCount: number; grantCount: number; lotteryLinkCount: number }): boolean {
  return input.logCount === 0 && input.grantCount === 0 && input.lotteryLinkCount === 0;
}

type SubmitOk = { ok: true; log: CheckinLog; grants: RewardGrant[] };
type SubmitFail = { ok: false; reason: string };

export function submitCheckinResult(input: {
  theme: CheckinTheme;
  logs: CheckinLog[];
  grants: RewardGrant[];
  userId: string;
  user?: string;
  department?: string;
  account?: string;
  at: string;
  nextLogId?: number;
  nextGrantId?: number;
}): SubmitOk | SubmitFail {
  const status = checkinStatusOf(input.theme, parseCheckinTime(input.at));
  if (status !== '进行中') return { ok: false, reason: status === '未开始' ? '打卡未开始' : '打卡已结束' };
  const themeId = input.theme.id;
  const themeLogs = input.logs.filter((item) => item.themeId === themeId);
  const themeGrants = input.grants.filter((item) => item.themeId === themeId);
  const day = calendarDayKey(input.at);
  if (themeLogs.some((item) => item.userId === input.userId && calendarDayKey(item.checkedAt) === day)) {
    return { ok: false, reason: '今日已打卡' };
  }
  const days = uniqueUserDays(themeLogs, themeId, input.userId);
  const streak = nextStreak(days, day);
  const total = days.length + 1;
  const log: CheckinLog = {
    id: input.nextLogId ?? Math.max(0, ...input.logs.map((item) => item.id)) + 1,
    themeId: input.theme.id,
    userId: input.userId,
    user: input.user ?? '',
    department: input.department ?? '',
    account: input.account ?? '',
    checkedAt: input.at,
  };
  const grants: RewardGrant[] = [];
  let grantId = input.nextGrantId ?? Math.max(0, ...input.grants.map((item) => item.id)) + 1;
  for (const item of input.theme.rules) {
    const kinds: Array<{ kind: RewardKind; enabled: boolean; content: string }> = [
      { kind: '勋章', enabled: item.enableMedal, content: item.medalId ?? '' },
      { kind: '积分', enabled: item.enablePoints, content: item.enablePoints ? `+${item.points}` : '' },
      { kind: '抽奖次数', enabled: item.enableLotteryChance, content: item.enableLotteryChance ? `+${item.lotteryChance}` : '' },
    ];
    for (const reward of kinds) {
      if (!reward.enabled) continue;
      const alreadyGranted = themeGrants.some(
        (grant) =>
          grant.userId === input.userId &&
          grant.ruleId === item.id &&
          grant.rewardKind === reward.kind &&
          grant.status !== '失败',
      );
      if (!shouldGrantReward(item, { streak, total, alreadyGranted })) continue;
      grants.push({
        id: grantId,
        themeId: input.theme.id,
        ruleId: item.id,
        userId: input.userId,
        user: input.user ?? '',
        department: input.department ?? '',
        rewardKind: reward.kind,
        content: reward.content,
        ruleSummary: ruleSummary(item),
        grantedAt: input.at,
        status: '成功',
      });
      grantId += 1;
    }
  }
  return { ok: true, log, grants };
}

export const initialThemes: CheckinTheme[] = [
  {
    id: 1,
    title: '文化晨读',
    ownerApp: 'culture',
    tags: ['阅读', '文化'],
    startAt: '2026-09-01 00:00',
    endAt: '2026-09-30 23:59',
    rules: [
      {
        id: 'c-medal',
        trigger: 'streak',
        streakDays: 7,
        enableMedal: true,
        medalId: 'attend',
        enablePoints: false,
        points: 0,
        enableLotteryChance: false,
        lotteryChance: 0,
        repeat: 'once',
      },
    ],
  },
  {
    id: 2,
    title: '技能训练打卡',
    ownerApp: 'skills-contest',
    tags: ['技能'],
    startAt: '2026-09-01 00:00',
    endAt: '2026-09-30 23:59',
    rules: [
      {
        id: 's-points',
        trigger: 'each',
        enableMedal: false,
        enablePoints: true,
        points: 5,
        enableLotteryChance: true,
        lotteryChance: 1,
        repeat: 'repeat',
      },
    ],
  },
  {
    id: 3,
    title: '暑期阅读打卡',
    ownerApp: 'culture',
    tags: ['阅读'],
    startAt: '2026-07-01 00:00',
    endAt: '2026-08-31 23:59',
    rules: [],
  },
];

export const initialLogs: CheckinLog[] = [
  { id: 1, themeId: 1, userId: 'u1', user: '周洁', department: '品牌文化部', account: 'zhoujie', checkedAt: '2026-09-09 08:10' },
  { id: 2, themeId: 1, userId: 'u1', user: '周洁', department: '品牌文化部', account: 'zhoujie', checkedAt: '2026-09-10 08:12' },
  { id: 3, themeId: 2, userId: 'u2', user: '李工', department: '研发中心 · 前端组', account: 'ligong', checkedAt: '2026-09-10 09:00' },
];

export const initialGrants: RewardGrant[] = [
  {
    id: 1,
    themeId: 2,
    ruleId: 's-points',
    userId: 'u2',
    user: '李工',
    department: '研发中心 · 前端组',
    rewardKind: '积分',
    content: '+5',
    ruleSummary: '每次打卡',
    grantedAt: '2026-09-10 09:00',
    status: '成功',
  },
  {
    id: 2,
    themeId: 2,
    ruleId: 's-points',
    userId: 'u2',
    user: '李工',
    department: '研发中心 · 前端组',
    rewardKind: '抽奖次数',
    content: '+1',
    ruleSummary: '每次打卡',
    grantedAt: '2026-09-10 09:00',
    status: '未入账',
  },
];

// Compatibility shim until Task 4
export type CheckinRecord = {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  status: CheckinStatus;
  checkins: number;
};

export const initialCheckins: CheckinRecord[] = initialThemes.map((item) => ({
  id: item.id,
  title: item.title,
  startAt: item.startAt,
  endAt: item.endAt,
  status: checkinStatusOf(item),
  checkins: new Set(initialLogs.filter((log) => log.themeId === item.id).map((log) => log.userId)).size,
}));
