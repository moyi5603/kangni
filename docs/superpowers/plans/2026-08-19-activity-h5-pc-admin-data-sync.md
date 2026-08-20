# 活动 H5 / PC / 后台数据联动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 活动主数据继续共用 `activityStore` 并补发布/标题回归；报名以 `related.signups` 为唯一源，C 端 `signupStore` 改为适配器。

**Architecture:** related 导出 `subscribeRelated` / `restoreRelatedSignups`。signupStore 不再自持数组，snapshot 读 `getRelatedList('signups')`。提交报名 `patchRelated`。陈产品 demo 四条写进 related 种子。`hasApprovedSignup` 只认已通过。

**Tech Stack:** 现有内存 store、Vitest、`renderToStaticMarkup`。不上后端。

---

## File map

- Modify: `src/features/activities/model/related.ts`
- Create: `src/features/activities/model/related.test.ts`
- Modify: `src/features/c-end/activities/model/signupStore.ts`
- Modify: `src/features/c-end/activities/model/signupStore.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`（afterEach 恢复 related）
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Create: `src/features/c-end/activities/model/activityPublishSync.test.ts`
- Modify: `src/features/activities/model/momentStore.ts`
- Create: `src/features/activities/model/momentStore.test.ts`

规格：`docs/superpowers/specs/2026-08-19-activity-h5-pc-admin-data-sync-design.md`。

目录不是 Git 仓库；每项末尾跳过 commit。

测试隔离：C 端 `afterEach` 在 `resetClientSignups()` 之后调用 `restoreRelatedSignups()`，避免陈产品被清空后污染后台/下一文件。`beforeEach` 仍 `resetClientSignups()`，单测默认「陈产品无报名」。

---

### Task 1: related 种子 + 订阅导出

**Files:**
- Modify: `src/features/activities/model/related.ts`
- Create: `src/features/activities/model/related.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/features/activities/model/related.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { getRelatedList, patchRelated, restoreRelatedSignups, subscribeRelated } from './related';

describe('related signups seed and subscribe', () => {
  afterEach(() => {
    restoreRelatedSignups();
  });

  it('seeds 陈产品 with the C-end demo four rows', () => {
    const mine = getRelatedList('signups').filter((item) => item.phone === '13800001111');
    const byActivity = Object.fromEntries(mine.map((item) => [item.activityId, item]));

    expect(mine).toHaveLength(4);
    expect(byActivity[2]).toMatchObject({
      id: 4,
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-08-18 16:00:00',
      department: '职能中心',
    });
    expect(byActivity[6]).toMatchObject({
      id: 15,
      signupType: '个人报名',
      status: '待审核',
      createdAt: '2026-08-17 16:00:00',
    });
    expect(byActivity[9]).toMatchObject({
      id: 16,
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-08-16 16:00:00',
    });
    expect(byActivity[1]).toMatchObject({
      id: 14,
      signupType: '个人报名',
      status: '已驳回',
      createdAt: '2026-04-12 10:00:00',
    });
    expect(getRelatedList('signups').some((item) => item.phone === '13800001001')).toBe(true);
  });

  it('notifies subscribeRelated when signups change', () => {
    let calls = 0;
    const stop = subscribeRelated(() => {
      calls += 1;
    });
    patchRelated('signups', (list) => list);
    stop();
    expect(calls).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/activities/model/related.test.ts
```

Expected: FAIL，`restoreRelatedSignups` / `subscribeRelated` 未导出，或陈产品仍是开放日已通过 + 训练营团体。

- [ ] **Step 3: 最小实现**

`related.ts` 的 `signups` 数组里，**删除**旧的 id 14（开放日已通过）和 id 4（训练营团体），**插入**（保持其他人行不变）：

```ts
    { id: 14, activityId: 1, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已驳回', createdAt: '2026-04-12 10:00:00' },
    { id: 4, activityId: 2, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已通过', createdAt: '2026-08-18 16:00:00' },
    { id: 15, activityId: 6, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '待审核', createdAt: '2026-08-17 16:00:00' },
    { id: 16, activityId: 9, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已通过', createdAt: '2026-08-16 16:00:00' },
```

id 14 / 4 可放在原位置附近，15 / 16 追加在 signups 数组末尾。不要改张悦、李明等行。

在 `emit` 后导出：

```ts
export function subscribeRelated(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function restoreRelatedSignups() {
  related = {
    ...related,
    signups: initialRelated.signups.map((item) => ({ ...item })),
  };
  emit();
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/activities/model/related.test.ts
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: signupStore 改为 related 适配器

**Files:**
- Modify: `src/features/c-end/activities/model/signupStore.ts`
- Modify: `src/features/c-end/activities/model/signupStore.test.ts`

- [ ] **Step 1: 写失败测试**

`signupStore.test.ts` 增加 import：

```ts
import { getRelatedList, patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import { getActivity } from '../../../activities/model/activityStore';
```

`afterEach` 改为：

```ts
  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });
```

把 `stores signup time as a complete UTC ISO timestamp` **整测替换**为：

```ts
  it('stores signup time as a local wall-clock timestamp', () => {
    expect(submitSignup(9002, '个人报名')).toBe('ok');

    const signup = getUserSignups(DEMO_SIGNUP_USER.phone).find(({ activityId }) => activityId === 9002);

    expect(signup?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
```

把 `writes new signups as approved` 保留（假 id 仍已通过），并追加：

```ts
  it('writes into related.signups so admin lists can see the row', () => {
    expect(submitSignup(9005, '个人报名')).toBe('ok');
    const row = getRelatedList('signups').find(
      (item) => item.activityId === 9005 && item.phone === DEMO_SIGNUP_USER.phone,
    );
    expect(row).toMatchObject({
      name: DEMO_SIGNUP_USER.name,
      signupType: '个人报名',
      department: '职能中心',
      status: '已通过',
    });
  });

  it('uses needAudit from the activity signup type', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(getUserSignups().find((item) => item.activityId === 2)?.status).toBe('待审核');
    resetClientSignups();
    expect(submitSignup(2, '团体报名')).toBe('ok');
    expect(getUserSignups().find((item) => item.activityId === 2)?.status).toBe('已通过');
  });

  it('hides cancelled rows and allows signing up again', () => {
    expect(submitSignup(9006, '个人报名')).toBe('ok');
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 9006 && item.phone === DEMO_SIGNUP_USER.phone
          ? { ...item, status: '已取消' }
          : item,
      ),
    );
    expect(getUserSignups().some((item) => item.activityId === 9006)).toBe(false);
    expect(submitSignup(9006, '个人报名')).toBe('ok');
  });

  it('reflects admin status patches on the client list', () => {
    loadDemoSignups();
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 6 && item.phone === DEMO_SIGNUP_USER.phone
          ? { ...item, status: '已通过' }
          : item,
      ),
    );
    expect(getUserSignups().find((item) => item.activityId === 6)?.status).toBe('已通过');
  });

  it('does not delete other people when resetting the demo user', () => {
    loadDemoSignups();
    resetClientSignups();
    expect(getUserSignups()).toEqual([]);
    expect(getRelatedList('signups').some((item) => item.phone === '13800001001')).toBe(true);
  });
```

`writes new signups as approved` 与 `uses needAudit` 不要冲突：假 id 9004 无活动 → 已通过。活动 2 个人 → 待审核。`getActivity` 仅用于确认活动 2 仍存在：

```ts
    expect(getActivity(2)?.signupSettings.some((item) => item.type === '个人报名' && item.needAudit)).toBe(true);
```

可放在 needAudit 测开头。

保留 mutation / duplicate / loadDemo / wipe 测。loadDemo 的时间比较仍成立（`2026-08-18 16:00:00` > `2026-08-17 16:00:00`）。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/model/signupStore.test.ts
```

Expected: FAIL，写入不进 related，或 reset 清空全表，或时间为 ISO。

- [ ] **Step 3: 最小实现**

重写 `signupStore.ts`（保留导出函数名）。完整文件：

```ts
import { useMemo, useSyncExternalStore } from 'react';
import { getActivity } from '../../../activities/model/activityStore';
import {
  getRelatedList,
  patchRelated,
  subscribeRelated,
  type SignupRecord,
} from '../../../activities/model/related';

export const DEMO_SIGNUP_USER = { name: '陈产品', phone: '13800001111' } as const;

export type ClientSignupStatus = '待审核' | '已通过' | '已驳回';

export type ClientSignup = {
  activityId: number;
  name: string;
  phone: string;
  type: string;
  status: ClientSignupStatus;
  createdAt: string;
};

const CLIENT_STATUSES: readonly ClientSignupStatus[] = ['待审核', '已通过', '已驳回'];

export const DEMO_CLIENT_SIGNUPS: readonly ClientSignup[] = [
  {
    activityId: 2,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-18 16:00:00',
  },
  {
    activityId: 6,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '待审核',
    createdAt: '2026-08-17 16:00:00',
  },
  {
    activityId: 9,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-16 16:00:00',
  },
  {
    activityId: 1,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已驳回',
    createdAt: '2026-04-12 10:00:00',
  },
];

const DEMO_RELATED_IDS: Record<number, number> = { 2: 4, 6: 15, 9: 16, 1: 14 };

function isClientStatus(status: SignupRecord['status']): status is ClientSignupStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(status);
}

function toClientSignup(record: SignupRecord): ClientSignup {
  return {
    activityId: record.activityId,
    name: record.name,
    phone: record.phone,
    type: record.signupType,
    status: record.status as ClientSignupStatus,
    createdAt: record.createdAt,
  };
}

function visibleRows(phone: string): SignupRecord[] {
  return getRelatedList('signups').filter(
    (item) => item.phone === phone && isClientStatus(item.status),
  );
}

function formatSignupTime(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function nextSignupId(list: SignupRecord[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

function signupStatusFor(activityId: number, type: string): ClientSignupStatus {
  const activity = getActivity(activityId);
  const setting = activity?.signupSettings.find((item) => item.type.trim() === type);
  if (!setting) return '已通过';
  return setting.needAudit ? '待审核' : '已通过';
}

export function hasSignedUp(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return visibleRows(phone).some((item) => item.activityId === activityId);
}

export function getUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  return visibleRows(phone).map(toClientSignup);
}

export function submitSignup(activityId: number, type: string): 'ok' | 'duplicate' | 'no-type' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  if (hasSignedUp(activityId)) return 'duplicate';
  patchRelated('signups', (list) => [
    {
      id: nextSignupId(list),
      activityId,
      name: DEMO_SIGNUP_USER.name,
      phone: DEMO_SIGNUP_USER.phone,
      signupType: trimmed,
      department: '职能中心',
      status: signupStatusFor(activityId, trimmed),
      createdAt: formatSignupTime(),
    },
    ...list,
  ]);
  return 'ok';
}

export function loadDemoSignups() {
  patchRelated('signups', (list) => {
    const others = list.filter((item) => item.phone !== DEMO_SIGNUP_USER.phone);
    const demo = DEMO_CLIENT_SIGNUPS.map((item) => ({
      id: DEMO_RELATED_IDS[item.activityId],
      activityId: item.activityId,
      name: item.name,
      phone: item.phone,
      signupType: item.type,
      department: '职能中心',
      status: item.status,
      createdAt: item.createdAt,
    }));
    return [...demo, ...others];
  });
}

export function resetClientSignups() {
  patchRelated('signups', (list) => list.filter((item) => item.phone !== DEMO_SIGNUP_USER.phone));
}

export function useHasSignedUp(activityId: number): boolean {
  const snapshot = useSyncExternalStore(subscribeRelated, getRelatedList.bind(null, 'signups'), getRelatedList.bind(null, 'signups'));
  return snapshot.some(
    (item) =>
      item.activityId === activityId &&
      item.phone === DEMO_SIGNUP_USER.phone &&
      isClientStatus(item.status),
  );
}

export function useUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  const snapshot = useSyncExternalStore(subscribeRelated, getRelatedList.bind(null, 'signups'), getRelatedList.bind(null, 'signups'));
  return useMemo(
    () =>
      snapshot
        .filter((item) => item.phone === phone && isClientStatus(item.status))
        .map(toClientSignup),
    [snapshot, phone],
  );
}
```

`useSyncExternalStore` 的 getSnapshot 必须返回稳定引用：`getRelatedList('signups')` 在未 patch 时返回同一数组，可以。不要在 getSnapshot 里 `.filter` 出新数组。

若 `getRelatedList.bind(null, 'signups')` 类型别扭，写成：

```ts
function getSignupSnapshot(): SignupRecord[] {
  return getRelatedList('signups');
}
```

然后 `useSyncExternalStore(subscribeRelated, getSignupSnapshot, getSignupSnapshot)`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/model/signupStore.test.ts src/features/activities/model/related.test.ts
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 3: C 端单测 afterEach 恢复 related + 活动发布回归

**Files:**
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Create: `src/features/c-end/activities/model/activityPublishSync.test.ts`

- [ ] **Step 1: 写失败测试**

每个上述已有测试文件：`import { restoreRelatedSignups } from '../../../activities/model/related'`（h5/pc 页测路径是 `../../../activities/model/related` 对 h5 来说是 `src/features/activities`：从 `h5/` 起为 `../../../activities/model/related`）。

`H5MySignups.test.tsx` / `PcMySignups.test.tsx` / `H5ActivityHome.test.tsx` / `PcActivityHome.test.tsx` 路径：`../../../activities/model/related`。  
`clientActivity.test.ts` 路径：`../../../activities/model/related`。

每个文件 `afterEach`：

```ts
  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });
```

创建 `activityPublishSync.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getActivities, upsertActivity } from '../../../activities/model/activityStore';
import { catalogActivities, getPublishedActivity } from './clientActivity';
import { PcActivityDetail } from '../pc/PcActivityDetail';

const onboard = initialActivities.find((item) => item.id === 2)!;

describe('activity publish sync to C-end', () => {
  afterEach(() => {
    upsertActivity(onboard);
  });

  it('shows an admin title edit on the published C-end detail', () => {
    upsertActivity({ ...onboard, title: '入职营改名' });

    expect(getPublishedActivity(getActivities(), 2)?.title).toBe('入职营改名');
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    expect(html).toContain('入职营改名');
    expect(html).not.toContain('新员工入职训练营');
  });

  it('drops an unpublished activity from the C-end catalog', () => {
    upsertActivity({ ...onboard, publishStatus: '未发布' });

    expect(getPublishedActivity(getActivities(), 2)).toBeUndefined();
    expect(catalogActivities(getActivities(), 'all').some((item) => item.id === 2)).toBe(false);
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    expect(html).toContain('活动不存在');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/model/activityPublishSync.test.ts
```

Expected: 文件新建后，若实现已共用 store 则可能直接 PASS。若 FAIL，按报错修 upsert/详情读取。不要为了让测失败去改生产逻辑。

先跑全套 C 端报名相关测，确认 afterEach 恢复后不再串数据：

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS（demo 四条已在 related）。

- [ ] **Step 3: 最小实现**

活动同步已存在，只需 afterEach 与新测。`PcActivityDetail` 已 `useActivities` + `getPublishedActivity`，不必改页面。若标题测失败，检查详情是否写死旧标题（不应）。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/model/activityPublishSync.test.ts src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/model/clientActivity.test.ts
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 4: 瞬间只认已通过

**Files:**
- Modify: `src/features/activities/model/momentStore.ts`
- Create: `src/features/activities/model/momentStore.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { restoreRelatedSignups } from './related';
import { hasApprovedSignup } from './momentStore';
import { loadDemoSignups, resetClientSignups, submitSignup } from '../../c-end/activities/model/signupStore';

describe('hasApprovedSignup', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });

  it('is true only for approved rows', () => {
    loadDemoSignups();
    expect(hasApprovedSignup(2)).toBe(true);
    expect(hasApprovedSignup(9)).toBe(true);
    expect(hasApprovedSignup(6)).toBe(false);
    expect(hasApprovedSignup(1)).toBe(false);
  });

  it('is false for a pending new signup', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(hasApprovedSignup(2)).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/activities/model/momentStore.test.ts
```

Expected: FAIL，`hasApprovedSignup(6)` 或待审核新报名仍为 true（旧逻辑 `hasSignedUp` 短路）。

- [ ] **Step 3: 最小实现**

`momentStore.ts` 去掉对 `hasSignedUp` / `useHasSignedUp` 的 import（若不再使用）。改为：

```ts
export function hasApprovedSignup(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return getRelatedList('signups').some(
    (item) => item.activityId === activityId && item.phone === phone && item.status === '已通过',
  );
}

export function useApprovedSignup(activityId: number): boolean {
  const signups = useRelated('signups', activityId);
  return signups.some((item) => item.phone === DEMO_SIGNUP_USER.phone && item.status === '已通过');
}
```

保留 `DEMO_SIGNUP_USER` import。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/activities/model/momentStore.test.ts
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 5: 全量验证

**Files:** 无新文件。

- [ ] **Step 1:**

```bash
npm test && npx tsc -b --pretty false
```

Expected: 全部 PASS。

- [ ] **Step 2: 手测**

1. `#/c/h5/my` 与 `#/c/pc/my`：demo 五 tab 仍对（晚会 / 体检 / 训练营 / 已结束空 / 开放日已驳回）。
2. 后台活动报名名单：训练营里陈产品为个人已通过；体检待审核；晚会已通过；开放日已驳回。张悦仍在。
3. C 端对需审核类型新报一次 → 后台出现待审核；后台点通过 → 刷新我的报名进对应活动 tab。
4. 后台改已发布活动标题 → H5/PC 详情新标题。下架 → 详情「活动不存在」，发现活动列表无该项。

- [ ] **Step 3: 跳过 commit**

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| 活动共用 + 仅已发布 + 标题/下架回归 | 3 |
| related 陈产品四条种子 | 1 |
| subscribeRelated / restoreRelatedSignups | 1, 2, 3 |
| signupStore 适配器、needAudit、已取消、reset 只删陈产品 | 2 |
| 时间格式后台墙钟 | 2 |
| 五 tab demo 不破 | 3 回归 |
| hasApprovedSignup 只认已通过 | 4 |
| 全量 + 手测 | 5 |

无 TBD。`restoreRelatedSignups` / `subscribeRelated` / `DEMO_RELATED_IDS` 全任务一致。
