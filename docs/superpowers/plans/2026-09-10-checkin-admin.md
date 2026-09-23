# 打卡后台 + 抽奖次数来源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把打卡应用做成主题配置 + 打卡/获奖记录后台，并在抽奖表单增加可叠加的次数获取途径（初始 / 每日登录 / 关联打卡）。

**Architecture:** 打卡领域逻辑放 `features/checkin/model`（状态推导、自然日去重、连续/累计、发奖）。页面学抽奖：列表 / 独立表单 / 详情 Tab。抽奖 `LotteryRecord` 增加获取途径字段，存量把原 `dailyChance` 映射为每日登录发放 + 消耗上限。C 端打卡页本轮不做；发奖与入账用 store 纯函数，页面可「模拟打卡」仅用于后台验收（详情工具栏，不进 C 端）。

**Tech Stack:** React 19、antd 6、Vitest、现有 ListPage / hash 路由、活动 `medalLibrary`。

**Spec:** `docs/superpowers/specs/2026-09-10-checkin-admin-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/checkin/model/checkin.ts` | 类型、状态、校验、连续/累计、发奖计算、mock 种子 |
| `src/features/checkin/model/checkin.test.ts` | 模型单测 |
| `src/features/checkin/model/checkinStore.ts` | 主题/记录/获奖内存 store |
| `src/features/checkin/model/checkinStore.test.ts` | store 单测 |
| `src/features/checkin/pages/CheckinListPage.tsx` | 列表（去掉 Modal） |
| `src/features/checkin/pages/CheckinListPage.test.tsx` | 列表渲染 |
| `src/features/checkin/pages/CheckinFormPage.tsx` | 新建/编辑 |
| `src/features/checkin/pages/CheckinFormPage.test.tsx` | 表单渲染 |
| `src/features/checkin/pages/CheckinDetailPage.tsx` | 详情两 Tab + 导出 |
| `src/features/checkin/pages/CheckinDetailPage.test.tsx` | 详情渲染 |
| `src/features/lottery/model/lottery.ts` | 获取途径字段、校验、存量默认值 |
| `src/features/lottery/model/lottery.test.ts` | 途径校验 + 迁移 |
| `src/features/lottery/pages/LotteryFormPage.tsx` | 机会卡拆获取/消耗 |
| `src/features/lottery/pages/LotteryListPage.test.tsx` | 表单文案 |
| `src/app/navigation.ts` | 隐藏页、query `app`、技能大赛菜单跳转 |
| `src/app/navigation.test.ts` | hash / sider / contest 跳转 |
| `src/app/App.tsx` | 路由打卡三页；技能大赛「打卡」跳打卡应用 |

本轮不改 C 端抽奖页。每日登录入账只提供 `grantDailyLoginChance(lotteryId, user, day)` 纯函数，供后续 C 端调用。

---

### Task 1: 打卡领域模型

**Files:**
- Create: `src/features/checkin/model/checkin.test.ts`
- Modify: `src/features/checkin/model/checkin.ts`（替换现有瘦类型）

- [ ] **Step 1: Write the failing test**

Create `src/features/checkin/model/checkin.test.ts`:

```ts
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
    expect(canDeleteCheckinTheme({ logCount: 0, grantCount: 0, lotteryLinkCount: 1 })).toBe(false);
  });
});

describe('labels', () => {
  it('maps owner apps', () => {
    expect(CHECKIN_OWNER_APP_LABEL.culture).toBe('文化打卡');
    expect(CHECKIN_OWNER_APP_LABEL['skills-contest']).toBe('技能大赛');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/checkin/model/checkin.test.ts`

Expected: FAIL — `submitCheckinResult` / `checkinStatusOf` not exported.

- [ ] **Step 3: Write minimal implementation**

Replace `src/features/checkin/model/checkin.ts` with:

```ts
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

export function nextStreak(previousDays: string[], today: string): number {
  if (!previousDays.length) return 1;
  const last = [...previousDays].sort().at(-1);
  const prev = new Date(`${today}T00:00:00+08:00`);
  prev.setDate(prev.getDate() - 1);
  const expected = prev.toISOString().slice(0, 10);
  return last === expected ? previousDays.length - previousDays.filter((day) => day >= today).length + 1 : 1;
}

export function uniqueUserDays(logs: CheckinLog[], userId: string): string[] {
  return [...new Set(logs.filter((item) => item.userId === userId).map((item) => calendarDayKey(item.checkedAt)))].sort();
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
  const day = calendarDayKey(input.at);
  if (input.logs.some((item) => item.userId === input.userId && calendarDayKey(item.checkedAt) === day)) {
    return { ok: false, reason: '今日已打卡' };
  }
  const days = uniqueUserDays(input.logs, input.userId);
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
      const alreadyGranted = input.grants.some(
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
```

Fix `nextStreak` so tests pass: consecutive day count = 1 + consecutive previous days ending yesterday.

Replace `nextStreak` with:

```ts
export function nextStreak(previousDays: string[], today: string): number {
  const set = new Set(previousDays);
  let count = 1;
  const cursor = new Date(`${today}T00:00:00+08:00`);
  for (;;) {
    cursor.setDate(cursor.getDate() - 1);
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!set.has(key)) break;
    count += 1;
  }
  return count;
}
```

Do **not** keep the old `CheckinRecord` type. List page tests will be updated in Task 4.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/checkin/model/checkin.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/checkin/model/checkin.ts src/features/checkin/model/checkin.test.ts
git commit -m "feat(checkin): add theme rules and grant engine"
```

---

### Task 2: checkin store

**Files:**
- Create: `src/features/checkin/model/checkinStore.ts`
- Create: `src/features/checkin/model/checkinStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetCheckinStoreForTests, distinctCheckinUsers, saveTheme, submitUserCheckin, useCheckinThemes } from './checkinStore';
import { getTheme } from './checkinStore';

describe('checkinStore', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('rejects a second checkin on the same day', () => {
    const first = submitUserCheckin({ themeId: 2, userId: 'u9', user: '王五', department: '生产', account: 'wangwu', at: '2026-09-10 10:00' });
    expect(first.ok).toBe(true);
    const second = submitUserCheckin({ themeId: 2, userId: 'u9', user: '王五', department: '生产', account: 'wangwu', at: '2026-09-10 11:00' });
    expect(first.ok && second.ok).toBe(false);
  });

  it('counts distinct users per theme', () => {
    expect(distinctCheckinUsers(1)).toBe(1);
  });
});
```

Do not import `useCheckinThemes` in the unit test if unused — drop that import.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/checkin/model/checkinStore.test.ts`

Expected: FAIL — module missing.

- [ ] **Step 3: Write minimal implementation**

Create `checkinStore.ts` following `lotteryStore.ts`: module-level `themes/logs/grants`, `subscribe`, `emit`, `__resetCheckinStoreForTests`, `useCheckinThemes`, `useCheckinLogs(themeId)`, `useCheckinGrants(themeId)`, `getTheme`, `nextThemeId`, `saveTheme`, `removeTheme` (return `{ ok: false, reason }` when `canDeleteCheckinTheme` is false; lottery link count read from a callback `countLotteryLinks(themeId)` default 0 until Task 7 injects lottery lookup), `distinctCheckinUsers`, `submitUserCheckin`.

`submitUserCheckin` calls `submitCheckinResult` then appends log + grants.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/checkin/model/checkinStore.test.ts src/features/checkin/model/checkin.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/checkin/model/checkinStore.ts src/features/checkin/model/checkinStore.test.ts
git commit -m "feat(checkin): add in-memory theme and grant store"
```

---

### Task 3: 导航隐藏页 + `?app=`

**Files:**
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: Write the failing tests** in existing `describe('checkin application')`:

```ts
  it('parses create, edit and detail hashes and keeps 打卡管理 selected', () => {
    expect(parseLocationHash('#/checkin/checkin-create')).toEqual({ application: 'checkin', page: 'checkin-create' });
    expect(parseLocationHash('#/checkin/checkin-edit/2')).toEqual({ application: 'checkin', page: 'checkin-edit', recordId: '2' });
    expect(parseLocationHash('#/checkin/checkin-detail/2')).toEqual({ application: 'checkin', page: 'checkin-detail', recordId: '2' });
    expect(siderSelectedKey('checkin-create')).toBe('checkin-list');
    expect(siderSelectedKey('checkin-edit')).toBe('checkin-list');
    expect(siderSelectedKey('checkin-detail')).toBe('checkin-list');
  });

  it('reads owner app query from checkin list hash', () => {
    expect(parseLocationHash('#/checkin/checkin-list?app=skills-contest')).toEqual({
      application: 'checkin',
      page: 'checkin-list',
      ownerApp: 'skills-contest',
    });
    expect(parseLocationHash('#/checkin/checkin-list?app=culture')).toEqual({
      application: 'checkin',
      page: 'checkin-list',
      ownerApp: 'culture',
    });
  });
```

Extend `parseLocationHash` return type with optional `ownerApp?: 'culture' | 'skills-contest'`.

In `skills-contest application` add:

```ts
  it('adds 打卡 menu that stays a first-level leaf', () => {
    expect(applicationMenus['skills-contest']).toEqual([
      { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
      { key: 'signup-list', icon: 'unorderedList', label: '报名' },
      { key: 'score-list', icon: 'checkCircle', label: '成绩' },
      { key: 'contest-checkin', icon: 'clock', label: '打卡' },
    ]);
  });
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/app/navigation.test.ts`

- [ ] **Step 3: Implement**

1. `parseLocationHash`: split `path` on `?` first. Parse `URLSearchParams` for `app`. If value is `culture` or `skills-contest`, set `ownerApp`. Strip query from `pageKey`.
2. `extraPages` add `checkin-create`, `checkin-edit`, `checkin-detail`.
3. `siderSelectedKey`: checkin create/edit/detail → `checkin-list`.
4. `applicationMenus['skills-contest']` append `{ key: 'contest-checkin', icon: 'clock', label: '打卡' }`.
5. Widen `parseLocationHash` return type. Update any TS callers if needed.

- [ ] **Step 4: Run** `npx vitest run src/app/navigation.test.ts` — PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/navigation.ts src/app/navigation.test.ts
git commit -m "feat(checkin): add hidden pages and owner-app query"
```

---

### Task 4: 列表页去掉 Modal

**Files:**
- Modify: `src/features/checkin/pages/CheckinListPage.test.tsx`
- Modify: `src/features/checkin/pages/CheckinListPage.tsx`

- [ ] **Step 1: Replace list tests**

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckinListPage } from './CheckinListPage';
import { __resetCheckinStoreForTests } from '../model/checkinStore';

describe('CheckinListPage', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('lists themes with owner app, tags, derived status and actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinListPage onNavigate={() => {}} />
      </App>,
    );
    expect(html).toContain('打卡管理');
    expect(html).toContain('配置打卡主题、奖励规则，并查看打卡与获奖记录。');
    expect(html).toContain('新建打卡');
    expect(html).toContain('文化晨读');
    expect(html).toContain('技能训练打卡');
    expect(html).toContain('文化打卡');
    expect(html).toContain('技能大赛');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('打卡人数');
    expect(html).toContain('所属应用');
  });
});
```

- [ ] **Step 2: Run — FAIL** (old copy / Modal still there, props missing)

- [ ] **Step 3: Rewrite list** like `LotteryListPage`:

- Props: `onNavigate: (page: string, recordId?: string) => void`, optional `ownerApp?: 'culture' | 'skills-contest'`
- Search: 主题名称、所属应用、状态；展开 RangePicker 起止时间
- Columns: 主题名称（button → detail）、所属应用、标签、起止、状态 Badge、打卡人数 `distinctCheckinUsers`、操作 编辑/删除
- 新建 → `onNavigate('checkin-create')`
- 删除走 `removeTheme`；失败 `message.warning` 用 store 返回 reason（有记录 / 已被抽奖关联）
- 无 Modal
- `layout` 保持 ListPage 默认横向表单，禁止 `layout="vertical"`

If `ownerApp` prop set, default the 所属应用 Select to that value on first render.

- [ ] **Step 4: Run** `npx vitest run src/features/checkin/pages/CheckinListPage.test.tsx` — PASS

- [ ] **Step 5: Commit** `feat(checkin): replace modal list with theme table`

---

### Task 5: 主题表单页

**Files:**
- Create: `src/features/checkin/pages/CheckinFormPage.test.tsx`
- Create: `src/features/checkin/pages/CheckinFormPage.tsx`

- [ ] **Step 1: Failing test**

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckinFormPage } from './CheckinFormPage';
import { __resetCheckinStoreForTests } from '../model/checkinStore';

const noop = () => {};

describe('CheckinFormPage', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('renders base fields and reward rule editor', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建打卡');
    expect(html).toContain('所属应用');
    expect(html).toContain('主题名称');
    expect(html).toContain('标签');
    expect(html).toContain('开始');
    expect(html).toContain('奖励规则');
    expect(html).toContain('添加规则');
    expect(html).toContain('由抽奖活动反向关联后才会入账');
  });

  it('locks ended theme editing', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="edit" recordId="3" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('已结束');
    expect(html).toContain('disabled');
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement form**

Pattern: `LotteryFormPage` + `AwardFormPage` 横向 `layout="horizontal"`、`className="edit-form"`。

Cards:

1. 基础信息：所属应用 Select、主题名称、标签 Select `mode="tags"`、RangePicker 起止
2. 奖励规则：`Form.List`。每行：触发 Radio（每次打卡 / 连续满 x 天 / 累计满 y 次）、奖励 Checkbox.Group（勋章/积分/抽奖次数）、发放 Radio（仅一次/可重复）。条件字段：`InputNumber` x/y、勋章 `Select` from `getMedal`/`useMedals` in `medalLibrary`、积分、抽奖次数。抽奖次数 `extra`：「由抽奖活动反向关联后才会入账；未关联时打卡仍记获奖，但次数不会进入任何抽奖。」

Submit: `validateRewardRule` each row；empty rules allowed。`saveTheme`。进行中保存 `message.success('已保存，新规则仅对之后的打卡生效')`。

已结束：`disabled` 全部控件，隐藏提交，只留返回。

- [ ] **Step 4: Run form tests — PASS**

- [ ] **Step 5: Commit** `feat(checkin): add theme create and edit form`

---

### Task 6: 详情页

**Files:**
- Create: `src/features/checkin/pages/CheckinDetailPage.test.tsx`
- Create: `src/features/checkin/pages/CheckinDetailPage.tsx`

- [ ] **Step 1: Failing test**

Seeded logs for theme 1 include 周洁. Expect tabs `打卡记录` `获奖记录`, export buttons, empty copy for theme 3.

```ts
expect(html).toContain('文化晨读');
expect(html).toContain('打卡记录');
expect(html).toContain('获奖记录');
expect(html).toContain('周洁');
expect(html).toContain('导出');
```

For theme 2 grants expect `+5` and `抽奖次数`.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

Header: title, owner label, status badge, range, distinct users. Buttons: 编辑（已结束 disabled）、返回。

Tabs:

- 打卡记录 Table：姓名、部门、工号/账号、打卡时间。Search 姓名 Input、部门 Input、日期 RangePicker。Toolbar 导出 CSV（`user,department,account,checkedAt`）。Empty: `还没有打卡记录`。
- 获奖记录 Table：姓名、部门、奖励类型、内容、触发规则摘要、发放时间。筛类型 Select。导出 CSV。Empty: `还没有获奖记录`。

Optional toolbar on 打卡记录: 「模拟打卡」Modal（姓名/部门/账号/时间）调 `submitUserCheckin`，方便手工验收连续规则。不配图文。

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit** `feat(checkin): add theme detail records and grants`

---

### Task 7: 抽奖次数获取途径模型

**Files:**
- Modify: `src/features/lottery/model/lottery.ts`
- Modify: `src/features/lottery/model/lottery.test.ts`

- [ ] **Step 1: Add tests**

```ts
import { countLotteryLinksToTheme, migrateLotteryChanceSources, validateLotteryChanceSources } from './lottery';

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
```

`countLotteryLinksToTheme(lotteries, themeId)` counts records with `gainCheckinEnabled && gainCheckinThemeIds.includes(themeId)`.

- [ ] **Step 2: Run lottery.test.ts — FAIL**

- [ ] **Step 3: Extend `LotteryRecord`**

```ts
gainInitialEnabled: boolean;
gainInitialCount: number;
gainDailyLoginEnabled: boolean;
gainDailyLoginCount: number;
gainCheckinEnabled: boolean;
gainCheckinThemeIds: number[];
```

`migrateLotteryChanceSources` as above.

Every `initialLotteries` item: `gainDailyLoginEnabled: true`, `gainDailyLoginCount: item.dailyChance`（年会 1、安全月 2、中秋 1），其它开关 false，`gainCheckinThemeIds: []`。

Update `base` fixture in `lottery.test.ts` with the new fields so existing tests compile.

`validateLotteryChanceSources` as tests.

Export `countLotteryLinksToTheme`.

- [ ] **Step 4: Run** `npx vitest run src/features/lottery/model/lottery.test.ts` — PASS

- [ ] **Step 5: Commit** `feat(lottery): add stackable chance gain sources`

---

### Task 8: 抽奖表单 UI + 打卡删除联动

**Files:**
- Modify: `src/features/lottery/pages/LotteryFormPage.tsx`
- Modify: `src/features/lottery/pages/LotteryListPage.test.tsx`
- Modify: `src/features/checkin/model/checkinStore.ts`

- [ ] **Step 1: Update form test**

In `renders all setting groups for creating a lottery` add:

```ts
expect(html).toContain('次数获取途径');
expect(html).toContain('每人初始');
expect(html).toContain('每日登录');
expect(html).toContain('打卡');
expect(html).toContain('消耗上限');
expect(html).toContain('每人每天次数');
```

- [ ] **Step 2: Run — FAIL**（没有「次数获取途径」）

- [ ] **Step 3: Implement form card split**

Replace single 「抽奖机会」card with two cards:

1. **次数获取途径**  
   Switches: 每人初始、每日登录、打卡。  
   初始打开 → `InputNumber` min 1。  
   登录打开 → `InputNumber` 每天 +n 默认 1。  
   打卡打开 → `Select mode="multiple"` options from `useCheckinThemes()` label=`title`。  
   On submit run `validateLotteryChanceSources`.

2. **消耗上限**  
   Keep `dailyChance`（每人每天次数）、`totalChanceEnabled`、`totalChance`。

Create defaults: `gainDailyLoginEnabled: true`, `gainDailyLoginCount: 1`, `dailyChance: 1`.

Edit: load existing fields.

`checkinStore.removeTheme`: import `useLotteries` is hook-only — use `countLotteryLinksToTheme` from a `getLotteries()` getter. Add `getLotteries()` in `lotteryStore.ts` (non-hook, like `getLottery`) if missing.

```ts
export function getLotteries() {
  return lotteries;
}
```

`removeTheme` uses `countLotteryLinksToTheme(getLotteries(), id)`.

- [ ] **Step 4: Run** `npx vitest run src/features/lottery src/features/checkin` — PASS

- [ ] **Step 5: Commit** `feat(lottery): configure chance sources on lottery form`

---

### Task 9: 打卡发奖写入抽奖钱包 + 入账状态

**Files:**
- Create: `src/features/lottery/model/lotteryChance.ts`
- Create: `src/features/lottery/model/lotteryChance.test.ts`
- Modify: `src/features/checkin/model/checkinStore.ts`

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { creditCheckinChance, type LotteryChanceLedger } from './lotteryChance';
import { lotteryStatusOf, type LotteryRecord } from './lottery';

const lottery = (partial: Partial<LotteryRecord>): LotteryRecord => ({
  /* copy lottery.test base + gain fields */
  gainInitialEnabled: false,
  gainInitialCount: 1,
  gainDailyLoginEnabled: false,
  gainDailyLoginCount: 1,
  gainCheckinEnabled: true,
  gainCheckinThemeIds: [2],
  enabled: true,
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  ...partial,
} as LotteryRecord);

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
});

it('skips ended or unlinked lotteries', () => {
  const now = Date.parse('2026-09-10T12:00:00+08:00');
  const result = creditCheckinChance({
    themeId: 2,
    userId: 'u2',
    amount: 1,
    at: '2026-09-10 09:00',
    lotteries: [lottery({ id: 1, gainCheckinThemeIds: [1] }), lottery({ id: 3, endAt: '2026-09-08 18:00', startAt: '2026-09-01 09:00' })],
    ledger: [],
    now,
  });
  expect(result.creditedLotteryIds).toEqual([]);
});
```

Also export `grantDailyLoginChance({ lottery, userId, day, ledger })`：若 `gainDailyLoginEnabled` 且当天未发过则 +n。本轮只测纯函数，不接 C 端。

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `lotteryChance.ts`**

Ledger row: `{ id, lotteryId, userId, source: 'initial' | 'daily-login' | 'checkin', amount, at }`。

`creditCheckinChance`: for each lottery where `gainCheckinEnabled && ids includes themeId && lotteryStatusOf === '进行中'`，append ledger.

Wire `submitUserCheckin` after grants: for each 抽奖次数 grant, call `creditCheckinChance`; if `creditedLotteryIds.length === 0` set grant.status `'未入账'` and append `（尚未被抽奖关联）` or `（关联抽奖已不可用）` to content when links exist but none active.

Add `lotteryChanceLedger` array on `lotteryStore` + `__reset`.

- [ ] **Step 4: Run** `npx vitest run src/features/lottery/model/lotteryChance.test.ts src/features/checkin/model/checkinStore.test.ts` — PASS

- [ ] **Step 5: Commit** `feat(lottery): credit checkin chance into linked raffles`

---

### Task 10: App 路由与技能大赛入口

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/navigation.test.ts` if `contest-checkin` parse needed

- [ ] **Step 1: Add App-level test if one exists for lottery routing; otherwise extend navigation parse:**

```ts
expect(parseLocationHash('#/skills-contest/contest-checkin')).toEqual({
  application: 'skills-contest',
  page: 'contest-checkin',
});
```

`contest-checkin` is a real leaf so parse already works after Task 3 menu add.

Add `src/app/App.checkin.test.tsx` only if other apps have similar; **prefer** a small test in `navigation.test.ts` plus manual App wiring.

If no App test harness, skip extra file. Implement routing.

- [ ] **Step 2: Fail path** — `CheckinFormPage` unused, contest-checkin shows Placeholder.

- [ ] **Step 3: Wire App.tsx**

Imports: `CheckinFormPage`, `CheckinDetailPage`.

Replace checkin branch:

```tsx
) : page === 'checkin-list' ? (
  <CheckinListPage
    ownerApp={ownerApp}
    onNavigate={(next, id) => goToPage(next, id)}
  />
) : page === 'checkin-create' || page === 'checkin-edit' ? (
  <CheckinFormPage
    key={`${page}-${recordId ?? 'new'}`}
    mode={page === 'checkin-edit' ? 'edit' : 'create'}
    recordId={recordId}
    defaultOwnerApp={ownerApp}
    onBack={() => goToPage('checkin-list')}
    onSaved={(id) => goToPage('checkin-detail', String(id))}
  />
) : page === 'checkin-detail' ? (
  <CheckinDetailPage
    recordId={recordId}
    onBack={() => goToPage('checkin-list')}
    onEdit={(id) => goToPage('checkin-edit', String(id))}
  />
) : page === 'contest-checkin' ? (
  <ContestCheckinRedirect />
```

`ContestCheckinRedirect`: `useEffect` → `changeApplication('checkin')` and hash `#/checkin/checkin-list?app=skills-contest`.

Thread `ownerApp` from `parseLocationHash`. Extend App state: when hash parsed, pass `ownerApp`.

Find `parseLocationHash` usage in App; pass through to list/form.

`CheckinFormPage` `defaultOwnerApp` only for create.

- [ ] **Step 4: Run** `npx vitest run src/app/navigation.test.ts src/features/checkin src/features/lottery`

Expected: PASS

- [ ] **Step 5: Commit** `feat(checkin): route form detail and contest shortcut`

---

### Task 11: 回归与规范

- [ ] **Step 1: Run** `npx vitest run src/features/checkin src/features/lottery src/app/navigation.test.ts`

Expected: all PASS

- [ ] **Step 2: UI conformance** on new pages only if repo script supports path filter. Horizontal forms, no vertical layout on new checkin/lottery fields.

- [ ] **Step 3: Manual check**

1. `#/checkin/checkin-list` 筛所属应用
2. `#/checkin/checkin-list?app=skills-contest` 预填技能大赛
3. 技能大赛侧栏「打卡」跳转
4. 主题配连续勋章 + 每次积分；详情模拟两天打卡
5. 抽奖编辑开打卡并勾选「技能训练打卡」；再模拟打卡，获奖次数状态变成功（非未入账）
6. 获取途径全关无法保存

- [ ] **Step 4: Commit** only if conformance edits remain

---

## Spec coverage

| Spec | Task |
|---|---|
| 独立打卡应用、隐藏新建编辑详情 | 3, 4, 5, 6, 10 |
| 所属应用筛选与技能大赛跳转 | 3, 4, 10 |
| 奖励规则三触发、三奖种、仅一次/可重复 | 1, 5 |
| 自然日一次、连续清零、累计保留 | 1, 2 |
| 列表列与删除限制 | 4, 8 |
| 详情两 Tab + 导出 | 6 |
| 抽奖获取途径叠加 + 消耗上限 | 7, 8 |
| 反向关联入账 / 未入账 | 9 |
| 存量 dailyChance → 每日登录 | 7 |
| 进行中改规则向后生效 | 5（文案）+ 1（按提交时规则算） |
| C 端打卡页 | 非目标，不做 |
| 每日登录发放函数 | 9 纯函数，不接 C 端 |

## 注意

- `nextStreak` 必须用东八区日期加减，禁止 `toISOString().slice` 导致前一天错位。
- 旧 `CheckinListPage` 本地 `useState(initialCheckins)` 删除，改 store。
- 更新 `lottery.test.ts` 的 `base` 对象，否则 Task 7 编译失败。
- 文化打卡没有独立应用：只作为 `ownerApp` 枚举。入口只有打卡列表筛选项。
