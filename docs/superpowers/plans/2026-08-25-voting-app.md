# 投票应用 B 端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** B 端增加独立应用「投票」：概览/规则占位，投票管理列表 / 新建编辑 / 详情结果，本地 mock 计票。

**Architecture:** 导航挂 `voting`。业务在 `src/features/voting`：纯函数模型 + 内存 store（活动/选项/选票）+ 三页。隐藏表单/详情走 `App.tsx` 接线；概览与规则设置仍 `PlaceholderPage`。不碰评优投票、不做 C 端。

**Tech Stack:** React 19、antd 6、Vitest、hash 路由、dayjs（与评优相同，传递依赖）。

**Spec:** `docs/superpowers/specs/2026-08-25-voting-app-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/app/navigation.ts` | 应用、菜单、隐藏页、sider 高亮 |
| `src/app/navigation.test.ts` | 投票应用注册；评优「紧挨课程」断言改为「紧挨投票」 |
| `src/app/App.tsx` | List / Form / Detail 接线 |
| `src/features/voting/model/voting.ts` | 类型、状态、校验、排名、匿名、额度 |
| `src/features/voting/model/voting.test.ts` | 纯函数 |
| `src/features/voting/model/voteStore.ts` | mock store + 种子 |
| `src/features/voting/model/voteStore.test.ts` | CRUD 与级联删除 |
| `src/features/voting/pages/VoteListPage.tsx` | 列表 |
| `src/features/voting/pages/VoteListPage.test.tsx` | 列表文案 |
| `src/features/voting/pages/VoteFormPage.tsx` | 新建编辑 |
| `src/features/voting/pages/VoteFormPage.test.tsx` | 表单文案 |
| `src/features/voting/pages/VoteDetailPage.tsx` | 详情 + 结果 |
| `src/features/voting/pages/VoteDetailPage.test.tsx` | 详情/结果文案 |

不改：`.b2b/b2b-standards.json`、C 端、`features/awards` 业务。

---

### Task 1: 导航元数据

**Files:**
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: Write the failing tests**

在 `src/app/navigation.test.ts` 的 `describe('awards application')` 里，把

```ts
expect(keys.indexOf('awards')).toBe(keys.indexOf('training') - 1);
```

改成：

```ts
expect(keys.indexOf('awards')).toBe(keys.indexOf('voting') - 1);
```

在同一文件、`awards application` 之后追加：

```ts
describe('voting application', () => {
  it('registers the app under 员工与组织 after 评优', () => {
    expect(getApplication('voting')).toEqual({
      key: 'voting',
      label: '投票',
      category: '员工与组织',
      icon: 'checkSquare',
      defaultPage: 'vote-overview',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('voting')).toBe(keys.indexOf('awards') + 1);
    expect(keys.indexOf('voting')).toBe(keys.indexOf('training') - 1);
  });

  it('uses three first-level menus', () => {
    expect(applicationMenus.voting).toEqual([
      { key: 'vote-overview', icon: 'dashboard', label: '概览' },
      { key: 'vote-list', icon: 'checkSquare', label: '投票管理' },
      { key: 'vote-rules', icon: 'fileText', label: '规则设置' },
    ]);
  });

  it('parses leaf hashes, hidden form pages, and falls back to 概览', () => {
    expect(parseLocationHash('#/voting/vote-overview')).toEqual({
      application: 'voting',
      page: 'vote-overview',
    });
    expect(parseLocationHash('#/voting/vote-list')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
    expect(parseLocationHash('#/voting/vote-rules')).toEqual({
      application: 'voting',
      page: 'vote-rules',
    });
    expect(parseLocationHash('#/voting/vote-create')).toEqual({
      application: 'voting',
      page: 'vote-create',
    });
    expect(parseLocationHash('#/voting/vote-edit/2')).toEqual({
      application: 'voting',
      page: 'vote-edit',
      recordId: '2',
    });
    expect(parseLocationHash('#/voting/vote-detail/2')).toEqual({
      application: 'voting',
      page: 'vote-detail',
      recordId: '2',
    });
    expect(parseLocationHash('#/voting/vote-detail/2/results')).toEqual({
      application: 'voting',
      page: 'vote-detail',
      recordId: '2',
      tab: 'results',
    });
    expect(siderSelectedKey('vote-create')).toBe('vote-list');
    expect(siderSelectedKey('vote-edit')).toBe('vote-list');
    expect(siderSelectedKey('vote-detail')).toBe('vote-list');
    expect(parseLocationHash('#/voting')).toEqual({
      application: 'voting',
      page: 'vote-overview',
    });
    expect(parseLocationHash('#/voting/not-a-page')).toEqual({
      application: 'voting',
      page: 'vote-overview',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('voting');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: FAIL。`getApplication('voting')` 为 `undefined`；评优「紧挨 training」断言因改成 `voting` 也失败。

- [ ] **Step 3: Implement navigation**

`src/app/navigation.ts` 的 `applications`：在 `awards` 与 `training` 之间插入：

```ts
{ key: 'voting', label: '投票', category: '员工与组织', icon: 'checkSquare', defaultPage: 'vote-overview' },
```

`applicationMenus`：在 `awards` 块之后、`training` 之前插入：

```ts
voting: [
  { key: 'vote-overview', icon: 'dashboard', label: '概览' },
  { key: 'vote-list', icon: 'checkSquare', label: '投票管理' },
  { key: 'vote-rules', icon: 'fileText', label: '规则设置' },
],
```

`parseLocationHash` 的 `extraPages` 数组末尾追加：`'vote-create'`、`'vote-edit'`、`'vote-detail'`。

`siderSelectedKey` 在 `award-create` 分支之后追加：

```ts
if (page === 'vote-create' || page === 'vote-edit' || page === 'vote-detail') {
  return 'vote-list';
}
```

不改 `App.tsx`（本任务概览/规则/未知页走 `PlaceholderPage`；`checkSquare` 已在 `navIcons`）。

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/app/navigation.ts src/app/navigation.test.ts
git commit -m "$(cat <<'EOF'
feat: register voting admin app

EOF
)"
```

---

### Task 2: 领域纯函数

**Files:**
- Create: `src/features/voting/model/voting.ts`
- Create: `src/features/voting/model/voting.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/voting/model/voting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  canDeleteVote,
  canEditVoteField,
  canMutateVoteOption,
  displayVoterName,
  tallyVoteResults,
  validateVoteTimeOrder,
  resolveVoteStatus,
  wouldExceedDailyQuota,
  type VoteBallot,
  type VoteCampaign,
  type VoteOption,
} from './voting';

const campaign: VoteCampaign = {
  id: 1,
  name: '测试投票',
  type: '普通投票',
  anonymous: false,
  startAt: '2026-08-20 09:00:00',
  endAt: '2026-08-30 18:00:00',
  intro: '',
  dailyQuota: 2,
  allowStackOnSameOption: false,
  visibility: '全员',
  departments: [],
  people: [],
};

const options: VoteOption[] = [
  {
    id: 1,
    campaignId: 1,
    sortOrder: 0,
    kind: '文字',
    label: 'A',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  },
  {
    id: 2,
    campaignId: 1,
    sortOrder: 1,
    kind: '文字',
    label: 'B',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  },
  {
    id: 3,
    campaignId: 1,
    sortOrder: 2,
    kind: '文字',
    label: 'C',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  },
];

describe('resolveVoteStatus', () => {
  it('maps now against the window', () => {
    expect(resolveVoteStatus(campaign, '2026-08-19 23:59:59')).toBe('未开始');
    expect(resolveVoteStatus(campaign, '2026-08-20 09:00:00')).toBe('进行中');
    expect(resolveVoteStatus(campaign, '2026-08-30 18:00:00')).toBe('进行中');
    expect(resolveVoteStatus(campaign, '2026-08-30 18:00:01')).toBe('已结束');
  });
});

describe('validateVoteTimeOrder', () => {
  it('requires start before end', () => {
    expect(validateVoteTimeOrder(campaign.startAt, campaign.endAt)).toBe(true);
    expect(validateVoteTimeOrder(campaign.endAt, campaign.startAt)).toBe(false);
    expect(validateVoteTimeOrder(campaign.startAt, campaign.startAt)).toBe(false);
  });
});

describe('edit rights', () => {
  it('allows delete only before start', () => {
    expect(canDeleteVote('未开始')).toBe(true);
    expect(canDeleteVote('进行中')).toBe(false);
    expect(canDeleteVote('已结束')).toBe(false);
  });

  it('locks type/name/start after the campaign begins', () => {
    expect(canEditVoteField('未开始', 'type')).toBe(true);
    expect(canEditVoteField('进行中', 'type')).toBe(false);
    expect(canEditVoteField('进行中', 'name')).toBe(false);
    expect(canEditVoteField('进行中', 'startAt')).toBe(false);
    expect(canEditVoteField('进行中', 'endAt')).toBe(true);
    expect(canEditVoteField('进行中', 'dailyQuota')).toBe(true);
    expect(canEditVoteField('已结束', 'endAt')).toBe(false);
  });

  it('blocks identity edits on options that already have ballots', () => {
    expect(canMutateVoteOption('进行中', false, 'delete')).toBe(true);
    expect(canMutateVoteOption('进行中', true, 'delete')).toBe(false);
    expect(canMutateVoteOption('进行中', true, 'changeIdentity')).toBe(false);
    expect(canMutateVoteOption('进行中', true, 'changeCopy')).toBe(true);
    expect(canMutateVoteOption('进行中', false, 'add')).toBe(true);
    expect(canMutateVoteOption('已结束', false, 'add')).toBe(false);
  });
});

describe('tallyVoteResults', () => {
  it('uses competition ranking and integer percents', () => {
    const ballots: VoteBallot[] = [
      { id: 1, campaignId: 1, optionId: 1, voterId: '张悦', voterName: '张悦', votedAt: '2026-08-21 10:00:00', dayKey: '2026-08-21' },
      { id: 2, campaignId: 1, optionId: 2, voterId: '李明', voterName: '李明', votedAt: '2026-08-21 10:01:00', dayKey: '2026-08-21' },
      { id: 3, campaignId: 1, optionId: 1, voterId: '王芳', voterName: '王芳', votedAt: '2026-08-21 10:02:00', dayKey: '2026-08-21' },
      { id: 4, campaignId: 1, optionId: 2, voterId: '黄码', voterName: '黄码', votedAt: '2026-08-21 10:03:00', dayKey: '2026-08-21' },
    ];
    const rows = tallyVoteResults(options, ballots);
    expect(rows.map((row) => ({ id: row.option.id, rank: row.rank, voteCount: row.voteCount, percent: row.percent }))).toEqual([
      { id: 1, rank: 1, voteCount: 2, percent: 50 },
      { id: 2, rank: 1, voteCount: 2, percent: 50 },
      { id: 3, rank: 3, voteCount: 0, percent: 0 },
    ]);
  });

  it('returns empty percent when there are no ballots', () => {
    const rows = tallyVoteResults(options, []);
    expect(rows.every((row) => row.percent === null && row.voteCount === 0 && row.rank === 1)).toBe(true);
  });
});

describe('displayVoterName', () => {
  it('masks the real name when anonymous', () => {
    expect(displayVoterName(true, '张悦')).toBe('匿名');
    expect(displayVoterName(false, '张悦')).toBe('张悦');
  });
});

describe('wouldExceedDailyQuota', () => {
  it('blocks a third vote and same-option stack when stacking is off', () => {
    const ballots: VoteBallot[] = [
      { id: 1, campaignId: 1, optionId: 1, voterId: '张悦', voterName: '张悦', votedAt: '2026-08-21 10:00:00', dayKey: '2026-08-21' },
      { id: 2, campaignId: 1, optionId: 2, voterId: '张悦', voterName: '张悦', votedAt: '2026-08-21 11:00:00', dayKey: '2026-08-21' },
    ];
    expect(wouldExceedDailyQuota(campaign, ballots, '张悦', 3, '2026-08-21')).toBe(true);
    expect(wouldExceedDailyQuota({ ...campaign, dailyQuota: 3 }, ballots, '张悦', 1, '2026-08-21')).toBe(true);
    expect(wouldExceedDailyQuota({ ...campaign, dailyQuota: 3 }, ballots, '张悦', 3, '2026-08-21')).toBe(false);
    expect(wouldExceedDailyQuota({ ...campaign, dailyQuota: 3, allowStackOnSameOption: true }, ballots, '张悦', 1, '2026-08-21')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/voting/model/voting.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: Write minimal implementation**

Create `src/features/voting/model/voting.ts` with exactly these exports (no extra fields):

```ts
export const voteTypes = ['普通投票', '评选投票'] as const;
export type VoteType = (typeof voteTypes)[number];

export const voteStatuses = ['未开始', '进行中', '已结束'] as const;
export type VoteStatus = (typeof voteStatuses)[number];

export const voteVisibilities = ['全员', '按部门', '自定义人员'] as const;
export type VoteVisibility = (typeof voteVisibilities)[number];

export const voteOptionKinds = ['文字', '员工', '作品'] as const;
export type VoteOptionKind = (typeof voteOptionKinds)[number];

export type VoteEditField =
  | 'type'
  | 'name'
  | 'startAt'
  | 'endAt'
  | 'intro'
  | 'dailyQuota'
  | 'allowStackOnSameOption'
  | 'anonymous'
  | 'visibility'
  | 'options';

export type VoteOptionAction = 'add' | 'delete' | 'changeIdentity' | 'changeCopy';

export type VoteCampaign = {
  id: number;
  name: string;
  type: VoteType;
  anonymous: boolean;
  startAt: string;
  endAt: string;
  intro: string;
  dailyQuota: number;
  allowStackOnSameOption: boolean;
  visibility: VoteVisibility;
  departments: string[];
  people: string[];
};

export type VoteOption = {
  id: number;
  campaignId: number;
  sortOrder: number;
  kind: VoteOptionKind;
  label: string;
  imageUrl: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  workTitle: string;
  workCover: string;
  workIntro: string;
};

export type VoteBallot = {
  id: number;
  campaignId: number;
  optionId: number;
  voterId: string;
  voterName: string;
  votedAt: string;
  dayKey: string;
};

export type VoteTallyRow = {
  option: VoteOption;
  voteCount: number;
  rank: number;
  percent: number | null;
};

export function parseVoteTime(value: string): number {
  return new Date(value.replace(/-/g, '/')).getTime();
}

export function validateVoteTimeOrder(startAt: string, endAt: string): boolean {
  return parseVoteTime(startAt) < parseVoteTime(endAt);
}

export function resolveVoteStatus(record: Pick<VoteCampaign, 'startAt' | 'endAt'>, now: string): VoteStatus {
  const t = parseVoteTime(now);
  if (t < parseVoteTime(record.startAt)) return '未开始';
  if (t <= parseVoteTime(record.endAt)) return '进行中';
  return '已结束';
}

export function canDeleteVote(status: VoteStatus): boolean {
  return status === '未开始';
}

const ongoingEditable: ReadonlySet<VoteEditField> = new Set([
  'endAt',
  'intro',
  'dailyQuota',
  'allowStackOnSameOption',
  'anonymous',
  'visibility',
  'options',
]);

export function canEditVoteField(status: VoteStatus, field: VoteEditField): boolean {
  if (status === '未开始') return true;
  if (status === '已结束') return false;
  return ongoingEditable.has(field);
}

export function canMutateVoteOption(status: VoteStatus, hasBallots: boolean, action: VoteOptionAction): boolean {
  if (status === '已结束') return false;
  if (status === '未开始') return true;
  if (action === 'add') return true;
  if (action === 'changeCopy') return true;
  return !hasBallots;
}

export function voteOptionTitle(option: VoteOption): string {
  if (option.kind === '员工') return option.employeeName;
  if (option.kind === '作品') return option.workTitle;
  return option.label;
}

export function tallyVoteResults(options: VoteOption[], ballots: VoteBallot[]): VoteTallyRow[] {
  const counts = new Map<number, number>();
  ballots.forEach((ballot) => {
    counts.set(ballot.optionId, (counts.get(ballot.optionId) ?? 0) + 1);
  });
  const total = ballots.length;
  const sorted = [...options].sort((left, right) => {
    const diff = (counts.get(right.id) ?? 0) - (counts.get(left.id) ?? 0);
    return diff || left.id - right.id;
  });
  let lastCount = -1;
  let lastRank = 0;
  return sorted.map((option, index) => {
    const voteCount = counts.get(option.id) ?? 0;
    const rank = voteCount === lastCount ? lastRank : index + 1;
    lastCount = voteCount;
    lastRank = rank;
    return {
      option,
      voteCount,
      rank,
      percent: total === 0 ? null : Math.round((voteCount / total) * 100),
    };
  });
}

export function displayVoterName(anonymous: boolean, voterName: string): string {
  return anonymous ? '匿名' : voterName;
}

export function wouldExceedDailyQuota(
  campaign: Pick<VoteCampaign, 'id' | 'dailyQuota' | 'allowStackOnSameOption'>,
  ballots: VoteBallot[],
  voterId: string,
  optionId: number,
  dayKey: string,
): boolean {
  const today = ballots.filter(
    (item) => item.campaignId === campaign.id && item.voterId === voterId && item.dayKey === dayKey,
  );
  if (today.length >= campaign.dailyQuota) return true;
  if (!campaign.allowStackOnSameOption && today.some((item) => item.optionId === optionId)) return true;
  return false;
}

export function deleteVoteBlockReason(status: VoteStatus): string | null {
  if (status === '进行中') return '进行中的投票不能删除';
  if (status === '已结束') return '已结束的投票不能删除';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/voting/model/voting.test.ts`

Expected: PASS。若并列名次失败，检查 `tallyVoteResults` 用竞赛名次（1、1、3）而不是密集名次（1、1、2）。

- [ ] **Step 5: Commit**

```bash
git add src/features/voting/model/voting.ts src/features/voting/model/voting.test.ts
git commit -m "$(cat <<'EOF'
feat: add voting domain rules

EOF
)"
```

---

### Task 3: mock store 与种子

**Files:**
- Create: `src/features/voting/model/voteStore.ts`
- Create: `src/features/voting/model/voteStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/voting/model/voteStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { canDeleteVote, resolveVoteStatus, type VoteCampaign, type VoteOption } from './voting';
import {
  __resetVoteStoreForTests,
  getVote,
  getVoteBallots,
  getVoteOptions,
  getVotes,
  removeVote,
  upsertVote,
} from './voteStore';

beforeEach(() => {
  __resetVoteStoreForTests();
});

const blankOption = (campaignId: number, id: number, label: string): VoteOption => ({
  id,
  campaignId,
  sortOrder: id - 1,
  kind: '文字',
  label,
  imageUrl: '',
  employeeId: '',
  employeeName: '',
  employeeDept: '',
  workTitle: '',
  workCover: '',
  workIntro: '',
});

describe('voteStore', () => {
  it('seeds five campaigns covering types, anonymity and visibilities', () => {
    const rows = getVotes();
    expect(rows).toHaveLength(5);
    expect(rows.map((item) => item.name)).toEqual([
      '午餐口味征集',
      '部门团建目的地',
      '季度明星员工与作品',
      '年度优秀提案评选',
      '工装颜色连投测试',
    ]);
    expect(new Set(rows.map((item) => item.visibility)).size).toBe(3);
    expect(rows.some((item) => item.anonymous)).toBe(true);
    expect(rows.some((item) => item.type === '评选投票')).toBe(true);
  });

  it('upserts and cascade-deletes options and ballots', () => {
    const now = '2099-01-01 00:00:00';
    const record: VoteCampaign = {
      id: 99,
      name: '可删草稿',
      type: '普通投票',
      anonymous: false,
      startAt: '2099-02-01 09:00:00',
      endAt: '2099-03-01 18:00:00',
      intro: '',
      dailyQuota: 1,
      allowStackOnSameOption: false,
      visibility: '全员',
      departments: [],
      people: [],
    };
    upsertVote(record, [blankOption(99, 1, '甲'), blankOption(99, 2, '乙')]);
    expect(getVote(99)?.name).toBe('可删草稿');
    expect(getVoteOptions(99)).toHaveLength(2);
    expect(canDeleteVote(resolveVoteStatus(record, now))).toBe(true);
    expect(removeVote(99)).toBe(true);
    expect(getVote(99)).toBeUndefined();
    expect(getVoteOptions(99)).toHaveLength(0);
    expect(getVoteBallots(99)).toHaveLength(0);
  });

  it('refuses to delete in-progress or ended campaigns', () => {
    const live = getVotes().find((item) => item.name === '部门团建目的地');
    const ended = getVotes().find((item) => item.name === '年度优秀提案评选');
    expect(live).toBeTruthy();
    expect(ended).toBeTruthy();
    expect(removeVote(live!.id)).toBe(false);
    expect(removeVote(ended!.id)).toBe(false);
    expect(getVote(live!.id)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/voting/model/voteStore.test.ts`

Expected: FAIL，`voteStore` 不存在。

- [ ] **Step 3: Write the store**

Create `src/features/voting/model/voteStore.ts`。种子时间必须相对 `dayjs()`，保证「今天」打开时五场状态仍是：未开始、进行中、进行中、已结束、已结束。

```ts
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { VoteBallot, VoteCampaign, VoteOption } from './voting';
import { resolveVoteStatus } from './voting';

export const VOTE_MOCK_VERSION = 1;

function stamp(days: number, time = '09:00:00'): string {
  const [hour, minute, second] = time.split(':').map(Number);
  return dayjs().add(days, 'day').hour(hour).minute(minute).second(second).format('YYYY-MM-DD HH:mm:ss');
}

function dayKeyFrom(value: string): string {
  return value.slice(0, 10);
}

function textOption(id: number, campaignId: number, sortOrder: number, label: string, imageUrl = ''): VoteOption {
  return {
    id,
    campaignId,
    sortOrder,
    kind: '文字',
    label,
    imageUrl,
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: '',
    workCover: '',
    workIntro: '',
  };
}

function personOption(
  id: number,
  campaignId: number,
  sortOrder: number,
  name: string,
  dept: string,
): VoteOption {
  return {
    id,
    campaignId,
    sortOrder,
    kind: '员工',
    label: '',
    imageUrl: '',
    employeeId: name,
    employeeName: name,
    employeeDept: dept,
    workTitle: '',
    workCover: '',
    workIntro: '',
  };
}

function workOption(
  id: number,
  campaignId: number,
  sortOrder: number,
  title: string,
  intro: string,
): VoteOption {
  return {
    id,
    campaignId,
    sortOrder,
    kind: '作品',
    label: '',
    imageUrl: '',
    employeeId: '',
    employeeName: '',
    employeeDept: '',
    workTitle: title,
    workCover: '/activities/share.jpg',
    workIntro: intro,
  };
}

function ballot(
  id: number,
  campaignId: number,
  optionId: number,
  voter: string,
  votedAt: string,
): VoteBallot {
  return { id, campaignId, optionId, voterId: voter, voterName: voter, votedAt, dayKey: dayKeyFrom(votedAt) };
}

const initialCampaigns: VoteCampaign[] = [
  {
    id: 1,
    name: '午餐口味征集',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(3, '09:00:00'),
    endAt: stamp(10, '18:00:00'),
    intro: '收集本季度员工餐厅口味偏好。',
    dailyQuota: 1,
    allowStackOnSameOption: false,
    visibility: '全员',
    departments: [],
    people: [],
  },
  {
    id: 2,
    name: '部门团建目的地',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(-2, '09:00:00'),
    endAt: stamp(5, '18:00:00'),
    intro: '研发中心团建地点投票。',
    dailyQuota: 2,
    allowStackOnSameOption: false,
    visibility: '按部门',
    departments: ['研发中心'],
    people: [],
  },
  {
    id: 3,
    name: '季度明星员工与作品',
    type: '评选投票',
    anonymous: true,
    startAt: stamp(-1, '09:00:00'),
    endAt: stamp(6, '18:00:00'),
    intro: '人与作品可混投。',
    dailyQuota: 3,
    allowStackOnSameOption: false,
    visibility: '自定义人员',
    departments: [],
    people: ['张悦', '李明', '王芳', '黄码'],
  },
  {
    id: 4,
    name: '年度优秀提案评选',
    type: '评选投票',
    anonymous: false,
    startAt: stamp(-20, '09:00:00'),
    endAt: stamp(-2, '18:00:00'),
    intro: '已结束的评选，含并列第一。',
    dailyQuota: 1,
    allowStackOnSameOption: false,
    visibility: '全员',
    departments: [],
    people: [],
  },
  {
    id: 5,
    name: '工装颜色连投测试',
    type: '普通投票',
    anonymous: false,
    startAt: stamp(-10, '09:00:00'),
    endAt: stamp(-1, '18:00:00'),
    intro: '允许对同一颜色连投。',
    dailyQuota: 3,
    allowStackOnSameOption: true,
    visibility: '按部门',
    departments: ['生产中心'],
    people: [],
  },
];

const initialOptions: VoteOption[] = [
  textOption(1, 1, 0, '川菜'),
  textOption(2, 1, 1, '粤菜'),
  textOption(3, 2, 0, '临安'),
  textOption(4, 2, 1, '安吉'),
  textOption(5, 2, 2, '莫干山'),
  personOption(6, 3, 0, '张悦', '前端组'),
  personOption(7, 3, 1, '王芳', '后端组'),
  workOption(8, 3, 2, '门系统轻量化方案', '降本案例'),
  personOption(9, 4, 0, '李明', '前端组'),
  workOption(10, 4, 1, '产线目视化看板', '效率提升'),
  workOption(11, 4, 2, '客服知识库改版', '满意度'),
  textOption(12, 5, 0, '深蓝'),
  textOption(13, 5, 1, '卡其'),
];

const t2 = stamp(-1, '10:15:00');
const t2b = stamp(-1, '11:20:00');
const t3 = stamp(0, '09:30:00');
const t4 = stamp(-5, '14:00:00');
const t5 = stamp(-3, '16:10:00');

const initialBallots: VoteBallot[] = [
  ballot(1, 2, 3, '张悦', t2),
  ballot(2, 2, 4, '张悦', t2b),
  ballot(3, 2, 3, '李明', t2),
  ballot(4, 3, 6, '李明', t3),
  ballot(5, 3, 8, '王芳', t3),
  ballot(6, 4, 9, '张悦', t4),
  ballot(7, 4, 10, '李明', t4),
  ballot(8, 4, 9, '王芳', t4),
  ballot(9, 4, 10, '黄码', t4),
  ballot(10, 5, 12, '苏然', t5),
  ballot(11, 5, 12, '苏然', stamp(-3, '16:20:00')),
  ballot(12, 5, 12, '苏然', stamp(-3, '16:30:00')),
];

let mockVersion = VOTE_MOCK_VERSION;
let campaigns = [...initialCampaigns];
let options = [...initialOptions];
let ballots = [...initialBallots];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetVoteStoreForTests() {
  mockVersion = VOTE_MOCK_VERSION;
  campaigns = [...initialCampaigns];
  options = [...initialOptions];
  ballots = [...initialBallots];
  emit();
}

export function useVotes() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return campaigns;
}

export function getVotes() {
  return campaigns;
}

export function getVote(id: number) {
  return campaigns.find((item) => item.id === id);
}

export function getVoteOptions(campaignId: number) {
  return options.filter((item) => item.campaignId === campaignId).sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getVoteBallots(campaignId: number) {
  return ballots.filter((item) => item.campaignId === campaignId);
}

export function nextVoteId() {
  return Math.max(0, ...campaigns.map((item) => item.id)) + 1;
}

export function nextOptionId() {
  return Math.max(0, ...options.map((item) => item.id)) + 1;
}

export function upsertVote(record: VoteCampaign, nextOptions: VoteOption[]) {
  const current = campaigns.find((item) => item.id === record.id);
  campaigns = current ? campaigns.map((item) => (item.id === record.id ? record : item)) : [record, ...campaigns];
  options = [...options.filter((item) => item.campaignId !== record.id), ...nextOptions];
  emit();
}

export function removeVote(id: number): boolean {
  const current = campaigns.find((item) => item.id === id);
  if (!current) return false;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (resolveVoteStatus(current, now) !== '未开始') return false;
  campaigns = campaigns.filter((item) => item.id !== id);
  options = options.filter((item) => item.campaignId !== id);
  ballots = ballots.filter((item) => item.campaignId !== id);
  emit();
  return true;
}
```

`removeVote` 必须用系统现在时间判断状态，这样种子里进行中/已结束的场次删不掉。

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/voting/model/voteStore.test.ts src/features/voting/model/voting.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/features/voting/model/voteStore.ts src/features/voting/model/voteStore.test.ts
git commit -m "$(cat <<'EOF'
feat: add voting mock store

EOF
)"
```

---

### Task 4: 投票管理列表

**Files:**
- Create: `src/features/voting/pages/VoteListPage.test.tsx`
- Create: `src/features/voting/pages/VoteListPage.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteStoreForTests } from '../model/voteStore';
import { VoteListPage } from './VoteListPage';

beforeEach(() => {
  __resetVoteStoreForTests();
});

describe('VoteListPage', () => {
  it('renders filters, create action and seeded rows', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteListPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('投票管理');
    expect(html).toContain('创建投票');
    expect(html).toContain('投票名称');
    expect(html).toContain('匿名');
    expect(html).toContain('午餐口味征集');
    expect(html).toContain('季度明星员工与作品');
    expect(html).toContain('普通投票');
    expect(html).toContain('评选投票');
    expect(html).not.toContain('本页先占位');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/voting/pages/VoteListPage.test.tsx`

Expected: FAIL。

- [ ] **Step 3: Implement list + wire App**

`VoteListPage` 对齐 `AwardListPage` 骨架（`ListPageHeading` → `SearchPanel` → `ListTableCard`）。查询字段顺序：投票名称、状态、类型、开始时间 RangePicker、结束时间 RangePicker。列：名称链接详情（`table-link` + ellipsis）、状态 Tag、类型、开始、结束、选项数右对齐、总票右对齐、匿名「是/否」、操作。

行为要点：

- `nowStamp()` = `dayjs().format('YYYY-MM-DD HH:mm:ss')`
- 行操作：详情；未结束显示编辑；未开始显示删除。删除走 `modal.confirm`，`okText: 确认删除`，`footer` 为 Ok 在左（复制评优 `modalFooter`），文案「删除后不可恢复。」
- `removeVote` 失败时 `message.info(deleteVoteBlockReason(status))`
- 批量删除：不可删的跳过并写进 confirm content「将跳过 n 项不可删除的投票。」
- 空态：有筛选「没有符合条件的投票」，否则 `b2bStandards.table.emptyText`
- 工具栏主按钮左：`<Button type="primary" icon={<PlusOutlined />}>创建投票</Button>`
- `onNavigate: (page: string, recordId?: string, tab?: string) => void`

完整页面按 `AwardListPage` 的四层结构写，字段换成投票的。不要带置顶/公示/发奖。`App.tsx` 只 import `VoteListPage`（Form/Detail 下个任务才有文件）。

```ts
import { VoteListPage } from '../features/voting/pages/VoteListPage';
```

在 `award-certificates` 分支之后、`PlaceholderPage` 之前插入：

```ts
) : page === 'vote-list' ? (
  <VoteListPage onNavigate={goToPage} />
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/voting/pages/VoteListPage.test.tsx src/app/navigation.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/features/voting/pages/VoteListPage.tsx src/features/voting/pages/VoteListPage.test.tsx src/app/App.tsx
git commit -m "$(cat <<'EOF'
feat: add voting list page

EOF
)"
```

---

### Task 5: 新建 / 编辑表单

**Files:**
- Create: `src/features/voting/pages/VoteFormPage.test.tsx`
- Create: `src/features/voting/pages/VoteFormPage.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VoteFormPage } from './VoteFormPage';

describe('VoteFormPage', () => {
  it('shows grouped create fields', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteFormPage mode="create" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('新建投票');
    expect(html).toContain('投票名称');
    expect(html).toContain('投票类型');
    expect(html).toContain('匿名投票');
    expect(html).toContain('每人每天可投');
    expect(html).toContain('允许对同一选项连投');
    expect(html).toContain('参与范围');
    expect(html).toContain('普通投票');
    expect(html).toContain('评选投票');
    expect(html).not.toContain('导入人群');
    expect(html).not.toContain('本页先占位');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/voting/pages/VoteFormPage.test.tsx`

Expected: FAIL。

- [ ] **Step 3: Implement form + wire App**

页面 class：`page-stack advanced-form-page`。面包屑 `投票 > 投票管理 > 新建投票|编辑投票`。底栏 `sticky-form-actions`：保存（primary 左）、取消。未保存离开：`b2bStandards.form.unsavedChangesGuard` + confirm「未保存的修改将丢失。」

表单分组 Card：`基础信息`、`时间`、`内容`、`选项`、`规则`、`参与范围`。

字段与校验按 spec。默认：`type=普通投票`、`anonymous=false`、`dailyQuota=1`、`allowStackOnSameOption=false`、`visibility=全员`、选项两行空。

实现要点：

- `layout="horizontal"`，`validateTrigger="onBlur"`
- 名称 Input `maxLength={50}` `showCount`
- 简介 TextArea `maxLength={500}` `showCount`
- 类型 Radio。若 `canEditVoteField(status,'type')` 为 false 则 disabled。切换时 `modal.confirm`「切换类型将清空选项，是否继续？」；取消则 `form.setFieldValue('type', prev)`；确认则选项重置为两行（普通=文字；评选=员工空行）
- 选项 `Form.List` name=`options`，最少 2 最多 20。普通行：文案必填 + 可选图片 Upload（`beforeUpload` 读 data URL，写入 `imageUrl`）。评选行：Radio `员工|作品`；员工 `TreeSelect` `orgPeoplePickerTree` `treeDefaultExpandAll` `showSearch`；作品标题+封面必填+简介可选
- 保存时用 `personDepartment(employeeId)` 写入 `employeeDept`；`employeeName = employeeId`（树 value 即姓名）
- 校验：`validateVoteTimeOrder`；普通 `label` 去空白后不重复；评选 `employeeId` 不重复、`workTitle` 不重复；进行中有票选项禁止删、禁止改 kind/员工/作品标题（`canMutateVoteOption` + `getVoteBallots`）
- `visibility===按部门'` → `TreeSelect` 多选 `orgDepartmentTree`；`自定义人员` → 多选 `orgPeoplePickerTree`
- `mode==='edit'` 且记录不存在：`message.error('投票不存在或已删除')` 后 `onBack()`
- 新建 `id = nextVoteId()`，选项 id 从 `nextOptionId()` 起按行分配
- 进行中：名称、开始时间、类型 disabled；已结束整表只读（保存按钮隐藏或 disabled，实际已结束进不了编辑——列表不给编辑入口，但 URL 直达时回详情或只读）

直达已结束编辑：`message.info('已结束的投票不能编辑')` 后 `onNavigate('vote-detail', String(id))`。

空选项工厂：

```ts
function emptyOption(type: VoteType): FormOption {
  return type === '普通投票'
    ? { kind: '文字', label: '', imageUrl: '', employeeId: '', workTitle: '', workCover: '', workIntro: '' }
    : { kind: '员工', label: '', imageUrl: '', employeeId: '', workTitle: '', workCover: '', workIntro: '' };
}
```

部门 TreeSelect：`treeCheckable` `treeDefaultExpandAll` `showCheckedStrategy={TreeSelect.SHOW_PARENT}` `treeData={orgDepartmentTree}`。人员：`SHOW_CHILD` `treeData={orgPeoplePickerTree}`。封面 Upload：`accept="image/*"` `maxCount={1}` `beforeUpload={() => false}`，`onChange` 里 `FileReader.readAsDataURL` 写入对应 Form 字段。

`App.tsx` 增加 import `VoteFormPage`，在 `vote-list` 后插入：

```ts
) : page === 'vote-create' || page === 'vote-edit' ? (
  <VoteFormPage
    key={`${page}-${recordId ?? 'new'}`}
    mode={page === 'vote-edit' ? 'edit' : 'create'}
    recordId={recordId}
    onBack={() => goToPage('vote-list')}
    onNavigate={goToPage}
  />
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/voting/pages/VoteFormPage.test.tsx src/features/voting/pages/VoteListPage.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/features/voting/pages/VoteFormPage.tsx src/features/voting/pages/VoteFormPage.test.tsx src/app/App.tsx
git commit -m "$(cat <<'EOF'
feat: add voting create and edit form

EOF
)"
```

---

### Task 6: 详情与结果

**Files:**
- Create: `src/features/voting/pages/VoteDetailPage.test.tsx`
- Create: `src/features/voting/pages/VoteDetailPage.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test**

种子 id：`1` 午餐未开始无票；`3` 匿名评选进行中；`4` 已结束并列。

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteStoreForTests } from '../model/voteStore';
import { VoteDetailPage } from './VoteDetailPage';

beforeEach(() => {
  __resetVoteStoreForTests();
});

function render(recordId: string, tab?: string) {
  return renderToStaticMarkup(
    <App>
      <VoteDetailPage recordId={recordId} tab={tab} onBack={() => undefined} onEdit={() => undefined} />
    </App>,
  );
}

describe('VoteDetailPage', () => {
  it('shows config fields on the detail tab', () => {
    const html = render('2');
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('详情');
    expect(html).toContain('结果');
    expect(html).toContain('投票类型');
    expect(html).toContain('匿名投票');
    expect(html).toContain('每人每天可投');
    expect(html).toContain('参与范围');
    expect(html).toContain('临安');
  });

  it('shows ranks and voter names on the results tab', () => {
    const html = render('2', 'results');
    expect(html).toContain('名次');
    expect(html).toContain('票数');
    expect(html).toContain('张悦');
    expect(html).toContain('投票记录');
  });

  it('masks voter names when anonymous', () => {
    const html = render('3', 'results');
    expect(html).toContain('匿名');
    expect(html).toContain('张悦');
    expect(html).toContain('门系统轻量化方案');
  });

  it('uses empty copy before any ballots', () => {
    const html = render('1', 'results');
    expect(html).toContain('尚未开始，暂无投票');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/voting/pages/VoteDetailPage.test.tsx`

Expected: FAIL。

- [ ] **Step 3: Implement detail + wire App**

Props：

```ts
type Props = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onTabChange?: (tab: 'detail' | 'results') => void;
};
```

非法 tab 回落 `detail`。缺记录：`message.error` 后 `onBack`。

页头：名称 Title、状态 Tag（未开始 default / 进行中 processing / 已结束 success）、类型、未结束显示编辑（左）、返回（右）。主操作在左。

Tabs：`详情` / `结果`。详情用 `Descriptions`：开始、结束、匿名（是/否）、每日票数、连投（允许/不允许）、参与范围（全员 / 部门 join / 人员 join）、简介、选项只读（员工显示姓名+部门；作品封面 `img` 宽 48 + 标题；文字显示 label）。

结果页：

- 无选票且状态未开始：`Empty` 「尚未开始，暂无投票」
- 有选票或已开始：排名 `Table` 列名次、选项、票数（右对齐）、占比（`percent === null` 显示 `—`，否则 `${percent}%`）
- 投票记录 `Table`：时间、投票人（`displayVoterName`）、选项（`voteOptionTitle`）。无记录：`Empty` 「暂无投票记录」

`App.tsx`：

```ts
) : page === 'vote-detail' ? (
  <VoteDetailPage
    key={recordId ?? 'detail'}
    recordId={recordId}
    tab={tab}
    onBack={() => goToPage('vote-list')}
    onEdit={(id) => goToPage('vote-edit', id)}
    onTabChange={(nextTab) => {
      setTab(nextTab);
      syncLocation(application, 'vote-detail', recordId, nextTab);
    }}
  />
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/voting`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/features/voting/pages/VoteDetailPage.tsx src/features/voting/pages/VoteDetailPage.test.tsx src/app/App.tsx
git commit -m "$(cat <<'EOF'
feat: add voting detail and results

EOF
)"
```

---

### Task 7: 全量验证

**Files:** none new

- [ ] **Step 1: Run unit tests**

Run: `npm test`

Expected: PASS，无失败。

- [ ] **Step 2: Typecheck / standards**

Run: `npx tsc -b --pretty false`  
Expected: 无 error。

Run: `npm run check:standards`  
Expected: exit 0。若 `check_ui_conformance.py` 报按钮顺序或缺规范 class，改投票页而不是放宽脚本。

- [ ] **Step 3: Manual hash smoke**

`npm run dev` 后打开：

- `#/voting` → 概览占位「当前应用「投票」」
- `#/voting/vote-list` → 五条种子，创建投票在工具栏左侧
- `#/voting/vote-create` → 分组表单，切评选出现员工/作品
- `#/voting/vote-detail/3/results` → 投票人显示「匿名」
- `#/voting/vote-detail/4/results` → 并列第一
- 顶栏「全部应用」→ 员工与组织出现「投票」，不进直显四应用

- [ ] **Step 4: Commit only if Step 2 produced extra fixes**

若无文件变更则不要空 commit。

---

## Self-review

| Spec 项 | Task |
|---|---|
| 应用/菜单/隐藏页/不进顶栏 | 1 |
| 状态/编辑权/排名/匿名/额度 | 2 |
| 种子五场、级联删、刷新回种子 | 3 |
| 列表查询/列/批量删 | 4 |
| 独立表单、范围、选项多态、类型切换确认 | 5 |
| 详情两页签、结果、匿名打码 | 6 |
| tsc / 规范 / 路由冒烟 | 7 |
| C 端、代投、奖励、评优打通 | 明确不做 |

无 TBD。类型名全程 `VoteCampaign` / `VoteOption` / `VoteBallot` / `wouldExceedDailyQuota`。
