# 报名卡状态行与演示数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** C 端报名卡标题下并排活动状态 + 审核状态；演示用户启动即带 5 条覆盖未开始/进行中/已结束/失效与待审核/已通过/已驳回的报名。

**Architecture:** `signupStore` 模块初始值为 `DEMO_CLIENT_SIGNUPS`，`resetClientSignups()` 仍清空。抽出 `SignupStatusRow`（活动 `StatusPill` + 审核 `AuditPill`）给 H5/PC 首页预览和我的报名用。不改发现活动、详情、后台。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 C 端 CSS。

---

## File map

- Modify: `src/features/c-end/activities/model/signupStore.ts` — 类型、种子、`loadDemoSignups`。
- Modify: `src/features/c-end/activities/model/signupStore.test.ts`
- Create: `src/features/c-end/activities/components/SignupStatusRow.tsx`
- Create: `src/features/c-end/activities/components/SignupStatusRow.test.tsx`
- Modify: `src/features/c-end/activities/styles.css` — `.c-signup-status-row` 与审核 pill，挂 `.c-h5-shell` / `.c-pc-shell`。
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`

规格：`docs/superpowers/specs/2026-08-19-signup-status-row-and-demo-data-design.md`。

目录不是 Git 仓库；每项末尾跳过 commit。

`createdAt` 倒序后待参加顺序必须是 2 → 6 → 9。种子用：

- `2026-08-18T16:00:00.000Z` activity 2 已通过
- `2026-08-17T16:00:00.000Z` activity 6 待审核
- `2026-08-16T16:00:00.000Z` activity 9 已通过
- `2026-04-12T10:00:00.000Z` activity 1 已驳回
- `2026-08-10T10:00:00.000Z` activity 3 待审核（未发布 → 失效）

首页断言必须切「我的活动」区块，避免发现活动里的 `StatusPill` 假阳性。

---

### Task 1: 报名 store 种子与审核类型

**Files:**
- Modify: `src/features/c-end/activities/model/signupStore.ts`
- Modify: `src/features/c-end/activities/model/signupStore.test.ts`

- [ ] **Step 1: 写失败测试**

把 `signupStore.test.ts` 改成：

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_SIGNUP_USER,
  getUserSignups,
  loadDemoSignups,
  resetClientSignups,
  submitSignup,
} from './signupStore';

describe('signup store', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
  });

  it('protects stored records from mutations to returned records', () => {
    expect(submitSignup(9001, '个人报名')).toBe('ok');
    const first = getUserSignups();
    const stored = { ...first.find((signup) => signup.activityId === 9001)! };

    first.find((signup) => signup.activityId === 9001)!.name = '被篡改';
    first.find((signup) => signup.activityId === 9001)!.type = '被篡改';
    first.find((signup) => signup.activityId === 9001)!.createdAt = '2000-01-01';

    expect(getUserSignups().find((signup) => signup.activityId === 9001)).toEqual(stored);
  });

  it('stores signup time as a complete UTC ISO timestamp', () => {
    expect(submitSignup(9002, '个人报名')).toBe('ok');

    const signup = getUserSignups(DEMO_SIGNUP_USER.phone).find(({ activityId }) => activityId === 9002);

    expect(signup?.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it('still rejects duplicate signups for one activity', () => {
    expect(submitSignup(9003, '个人报名')).toBe('ok');
    expect(submitSignup(9003, '团体报名')).toBe('duplicate');
  });

  it('writes new signups as approved', () => {
    expect(submitSignup(9004, '个人报名')).toBe('ok');
    expect(getUserSignups().find((signup) => signup.activityId === 9004)?.status).toBe('已通过');
  });

  it('loads demo records covering activity and audit mixes', () => {
    loadDemoSignups();
    const list = getUserSignups();
    const byId = Object.fromEntries(list.map((signup) => [signup.activityId, signup]));

    expect(list).toHaveLength(5);
    expect(byId[2]?.status).toBe('已通过');
    expect(byId[6]?.status).toBe('待审核');
    expect(byId[9]?.status).toBe('已通过');
    expect(byId[1]?.status).toBe('已驳回');
    expect(byId[3]?.status).toBe('待审核');
    expect(byId[2]!.createdAt > byId[6]!.createdAt).toBe(true);
    expect(byId[6]!.createdAt > byId[9]!.createdAt).toBe(true);
  });

  it('keeps reset as a wipe, not a seed restore', () => {
    loadDemoSignups();
    resetClientSignups();
    expect(getUserSignups()).toEqual([]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/model/signupStore.test.ts
```

Expected: FAIL，`loadDemoSignups` 未导出。

- [ ] **Step 3: 最小实现**

把 `signupStore.ts` 改成：

```ts
import { useMemo, useSyncExternalStore } from 'react';

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

type StoredSignup = Readonly<ClientSignup>;

function demoRecord(
  activityId: number,
  status: ClientSignupStatus,
  createdAt: string,
  type = '个人报名',
): StoredSignup {
  return {
    activityId,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type,
    status,
    createdAt,
  };
}

export const DEMO_CLIENT_SIGNUPS: readonly StoredSignup[] = [
  demoRecord(2, '已通过', '2026-08-18T16:00:00.000Z'),
  demoRecord(6, '待审核', '2026-08-17T16:00:00.000Z'),
  demoRecord(9, '已通过', '2026-08-16T16:00:00.000Z'),
  demoRecord(1, '已驳回', '2026-04-12T10:00:00.000Z'),
  demoRecord(3, '待审核', '2026-08-10T10:00:00.000Z'),
];

let signups: readonly StoredSignup[] = DEMO_CLIENT_SIGNUPS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSignupSnapshot(): readonly StoredSignup[] {
  return signups;
}

function cloneSignup(signup: StoredSignup): ClientSignup {
  return { ...signup };
}

export function hasSignedUp(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return signups.some((item) => item.activityId === activityId && item.phone === phone);
}

export function getUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  return signups.filter((item) => item.phone === phone).map(cloneSignup);
}

export function submitSignup(activityId: number, type: string): 'ok' | 'duplicate' | 'no-type' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  if (hasSignedUp(activityId)) return 'duplicate';
  signups = [
    ...signups,
    {
      activityId,
      name: DEMO_SIGNUP_USER.name,
      phone: DEMO_SIGNUP_USER.phone,
      type: trimmed,
      status: '已通过',
      createdAt: new Date().toISOString(),
    },
  ];
  emit();
  return 'ok';
}

export function loadDemoSignups() {
  signups = DEMO_CLIENT_SIGNUPS;
  emit();
}

export function resetClientSignups() {
  signups = [];
  emit();
}

export function useHasSignedUp(activityId: number): boolean {
  const snapshot = useSyncExternalStore(subscribe, getSignupSnapshot, getSignupSnapshot);
  return snapshot.some(
    (item) => item.activityId === activityId && item.phone === DEMO_SIGNUP_USER.phone,
  );
}

export function useUserSignups(phone: string = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  const snapshot = useSyncExternalStore(subscribe, getSignupSnapshot, getSignupSnapshot);
  return useMemo(
    () => snapshot.filter((item) => item.phone === phone).map(cloneSignup),
    [snapshot, phone],
  );
}
```

不要改 `resetClientSignups` 去恢复种子。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/model/signupStore.test.ts src/features/c-end/activities/model/clientActivity.test.ts
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: SignupStatusRow 与 pill CSS

**Files:**
- Create: `src/features/c-end/activities/components/SignupStatusRow.test.tsx`
- Create: `src/features/c-end/activities/components/SignupStatusRow.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

创建 `SignupStatusRow.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SignupStatusRow } from './SignupStatusRow';

describe('SignupStatusRow', () => {
  it('renders activity and audit pills together', () => {
    const html = renderToStaticMarkup(
      <SignupStatusRow activityStatus="进行中" auditStatus="已通过" />,
    );

    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('c-pill is-ongoing');
    expect(html).toContain('进行中');
    expect(html).toContain('c-pill is-audit-passed');
    expect(html).toContain('已通过');
  });

  it('omits the activity pill when the association is missing', () => {
    const html = renderToStaticMarkup(<SignupStatusRow auditStatus="待审核" />);

    expect(html).toContain('待审核');
    expect(html).toContain('is-audit-pending');
    expect(html).not.toContain('未开始');
    expect(html).not.toContain('进行中');
    expect(html).not.toContain('已结束');
    expect(html).not.toContain('c-pill is-upcoming');
    expect(html).not.toContain('c-pill is-ongoing');
    expect(html).not.toContain('c-pill is-ended');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/components/SignupStatusRow.test.tsx
```

Expected: FAIL，模块不存在。

- [ ] **Step 3: 最小实现**

创建 `SignupStatusRow.tsx`：

```tsx
import type { ActivityStatus } from '../../../activities/model/activity';
import type { ClientSignupStatus } from '../model/signupStore';
import { StatusPill } from './StatusPill';

const AUDIT_CLASS: Record<ClientSignupStatus, string> = {
  待审核: 'is-audit-pending',
  已通过: 'is-audit-passed',
  已驳回: 'is-audit-rejected',
};

function AuditPill({ status }: { status: ClientSignupStatus }) {
  return <span className={`c-pill ${AUDIT_CLASS[status]}`}>{status}</span>;
}

export function SignupStatusRow({
  activityStatus,
  auditStatus,
}: {
  activityStatus?: ActivityStatus;
  auditStatus: ClientSignupStatus;
}) {
  return (
    <div className="c-signup-status-row">
      {activityStatus ? <StatusPill status={activityStatus} /> : null}
      <AuditPill status={auditStatus} />
    </div>
  );
}
```

在 `styles.css` 的 `.c-h5-shell .c-pill.is-ended` 块后（H5 token 区）加：

```css
.c-h5-shell .c-signup-status-row,
.c-pc-shell .c-signup-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.c-h5-shell .c-pill.is-upcoming,
.c-pc-shell .c-pill.is-upcoming,
.c-h5-shell .c-pill.is-audit-pending,
.c-pc-shell .c-pill.is-audit-pending {
  background: #f59e0b;
  color: #fff;
}

.c-h5-shell .c-pill.is-ongoing,
.c-pc-shell .c-pill.is-ongoing {
  background: #16324f;
  color: #fff;
}

.c-h5-shell .c-pill.is-ended,
.c-pc-shell .c-pill.is-ended {
  background: #8a99ab;
  color: #fff;
}

.c-h5-shell .c-pill.is-audit-passed,
.c-pc-shell .c-pill.is-audit-passed {
  background: #14b8a6;
  color: #062e2a;
}

.c-h5-shell .c-pill.is-audit-rejected,
.c-pc-shell .c-pill.is-audit-rejected {
  background: #94a3b8;
  color: #fff;
}
```

若 H5 里已有 `.c-h5-shell .c-pill.is-upcoming` 等规则，不要删旧规则；新规则写在后面即可覆盖。不要改发现活动封面或详情 CTA。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/components/SignupStatusRow.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 3: H5 首页预览状态行 + 种子展示

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`

- [ ] **Step 1: 写失败测试**

在 `H5ActivityHome.test.tsx` 的 import 中加入 `loadDemoSignups`。`describe` 末尾加：

```ts
  it('previews demo upcoming cards with paired status pills', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = html.slice(
      html.indexOf('c-h5-my-activities'),
      html.indexOf('id="h5-activity-catalog"'),
    );

    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('年度体检安排');
    expect(mine).toContain('进行中');
    expect(mine).toContain('已通过');
    expect(mine).toContain('未开始');
    expect(mine).toContain('待审核');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('中秋员工晚会');
    expect(mine).not.toContain('还没有报名活动');
  });
```

现有 `reset` 后的空态测试不要改。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: FAIL，预览卡没有 `c-signup-status-row`。

- [ ] **Step 3: 最小实现**

`H5ActivityHome.tsx`：从 `../components/SignupStatusRow` 引入 `SignupStatusRow`；从 `clientActivity` 引入 `ClientSignupView`。

把预览卡改成吃整条 view：

```tsx
function HomeSignupPreviewCard({ item }: { item: ClientSignupView }) {
  const activity = item.activity;
  if (!activity) return null;

  return (
    <button
      className="c-h5-signup-card c-h5-card-button is-preview"
      type="button"
      onClick={() => goCEnd('h5', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-h5-signup-card-body">
        <h3 className="c-h5-signup-title">{activity.title}</h3>
        <SignupStatusRow
          activityStatus={activity.activityStatus}
          auditStatus={item.signup.status}
        />
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}
```

列表处改成 `<HomeSignupPreviewCard item={item} />`。不要给发现活动卡加审核 pill。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS，含原空态 / 封面测试。

- [ ] **Step 5: 跳过 commit**

---

### Task 4: H5 我的报名状态行

**Files:**
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`

- [ ] **Step 1: 写失败测试**

改 `renders a valid association as one whole-card button`，保留标题/报名类型/封面断言，追加：

```ts
    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('已结束');
    expect(html).toContain('已通过');
    expect(html).not.toContain('c-h5-signup-status');
```

`initialActivities[0]` 是春季开放日，活动状态是已结束。

改 `renders a missing association as ended, inactive content` 里的 signup 为待审核，并断言：

```ts
  it('renders a missing association as ended, inactive content', () => {
    const item: ClientSignupView = {
      signup: { ...signup, activityId: -1, status: '待审核' },
    };
    const html = renderToStaticMarkup(<SignupGroup title="已结束" items={[item]} />);

    expect(html).toContain('活动已失效');
    expect(html).toContain('个人报名');
    expect(html).toContain('待审核');
    expect(html).toContain('c-signup-status-row');
    expect(html).not.toContain('未开始');
    expect(html).not.toContain('进行中');
    expect(html).not.toContain('已结束');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('c-signup-thumb');
    expect(html).not.toContain('<img');
  });
```

再加一条用 `loadDemoSignups` 渲染整页：

```ts
  it('lists demo signups including rejected and invalid rows', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups />);

    expect(html).toContain('新员工入职训练营');
    expect(html).toContain('年度体检安排');
    expect(html).toContain('中秋员工晚会');
    expect(html).toContain('春季员工开放日');
    expect(html).toContain('活动已失效');
    expect(html).toContain('已驳回');
    expect(html).toContain('待审核');
  });
```

import `loadDemoSignups`。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx
```

Expected: FAIL，仍有 `c-h5-signup-status` 或没有 `c-signup-status-row`。

- [ ] **Step 3: 最小实现**

`SignupDetails` 只留报名类型：

```tsx
function SignupDetails({ item }: { item: ClientSignupView }) {
  return <p className="c-h5-signup-type">报名类型：{item.signup.type}</p>;
}
```

有效卡：标题单独一行，去掉 head 里的 `StatusPill`。标题下加 `SignupStatusRow`：

```tsx
      <div className="c-h5-signup-card-body">
        <h3 className="c-h5-signup-title">{activity.title}</h3>
        <SignupStatusRow
          activityStatus={activity.activityStatus}
          auditStatus={item.signup.status}
        />
        <SignupDetails item={item} />
        <ActivityMeta activity={activity} compact />
      </div>
```

失效卡：

```tsx
      <article className="c-h5-signup-card is-invalid">
        <div className="c-h5-signup-card-body">
          <h3 className="c-h5-signup-title">活动已失效</h3>
          <SignupStatusRow auditStatus={item.signup.status} />
          <SignupDetails item={item} />
        </div>
      </article>
```

可删未再使用的 `StatusPill` import。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 5: PC 首页预览状态行 + 种子展示

**Files:**
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`

- [ ] **Step 1: 写失败测试**

import `loadDemoSignups`。`describe` 末尾加：

```ts
  it('previews demo upcoming cards with paired status pills', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = html.slice(
      html.indexOf('c-pc-my-activities'),
      html.indexOf('id="pc-activity-catalog"'),
    );

    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('年度体检安排');
    expect(mine).toContain('进行中');
    expect(mine).toContain('已通过');
    expect(mine).toContain('未开始');
    expect(mine).toContain('待审核');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('中秋员工晚会');
  });
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: FAIL，没有 `c-signup-status-row`。

- [ ] **Step 3: 最小实现**

引入 `SignupStatusRow` 与 `ClientSignupView`。预览卡：

```tsx
function HomeSignupPreviewCard({ item }: { item: ClientSignupView }) {
  const activity = item.activity;
  if (!activity) return null;

  return (
    <button
      className="c-pc-signup-card c-card-btn is-preview"
      type="button"
      onClick={() => goCEnd('pc', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-pc-signup-card-body">
        <h3 className="c-pc-signup-title">{activity.title}</h3>
        <SignupStatusRow
          activityStatus={activity.activityStatus}
          auditStatus={item.signup.status}
        />
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}
```

列表改 `<HomeSignupPreviewCard item={item} />`。不要改 `.c-pc-grid` 发现活动卡上的 `StatusPill`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 6: PC 我的报名状态行

**Files:**
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`

- [ ] **Step 1: 写失败测试**

有效卡断言追加：

```ts
    expect(html).toContain('c-signup-status-row');
    expect(html).toContain('已结束');
    expect(html).toContain('已通过');
    expect(html).not.toContain('c-pc-signup-status');
```

失效卡改成待审核并断言无活动状态 pill 文案：

```ts
  it('renders a missing association as ended, inactive content', () => {
    const item: ClientSignupView = {
      signup: { ...signup, status: '待审核' },
    };
    const html = renderToStaticMarkup(<PcSignupGroup title="已结束" items={[item]} />);

    expect(html).toContain('活动已失效');
    expect(html).toContain('待审核');
    expect(html).toContain('c-signup-status-row');
    expect(html).not.toContain('未开始');
    expect(html).not.toContain('进行中');
    expect(html).not.toContain('已结束');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('c-signup-thumb');
    expect(html).not.toContain('<img');
  });
```

整页种子：

```ts
  it('lists demo signups including rejected and invalid rows', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups />);

    expect(html).toContain('新员工入职训练营');
    expect(html).toContain('春季员工开放日');
    expect(html).toContain('活动已失效');
    expect(html).toContain('已驳回');
    expect(html).toContain('待审核');
  });
```

import `loadDemoSignups`。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 最小实现**

```tsx
function SignupDetails({ item }: { item: ClientSignupView }) {
  return <p className="c-pc-signup-type">报名类型：{item.signup.type}</p>;
}
```

有效卡去掉 head 里 `StatusPill`：

```tsx
      <div className="c-pc-signup-card-body">
        <h3 className="c-pc-signup-title">{activity.title}</h3>
        <SignupStatusRow
          activityStatus={activity.activityStatus}
          auditStatus={item.signup.status}
        />
        <SignupDetails item={item} />
        <ActivityMeta activity={activity} compact />
      </div>
```

失效卡：

```tsx
      <article className="c-pc-signup-card is-invalid">
        <div className="c-pc-signup-card-body">
          <h3 className="c-pc-signup-title">活动已失效</h3>
          <SignupStatusRow auditStatus={item.signup.status} />
          <SignupDetails item={item} />
        </div>
      </article>
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 7: 全量验证

**Files:** 无新文件。

- [ ] **Step 1:**

```bash
npm test && npx tsc -b --pretty false
```

Expected: 全部 PASS，无 TS 错误。H5 发现活动 / 详情测试仍在。

- [ ] **Step 2: 手测**

硬刷新 `http://127.0.0.1:5173/#/c/h5` 与 `#/c/pc`（不要先点会 `reset` 的测试页逻辑；这是内存种子，冷启动即有数据）。

- 首页「我的活动」两条：训练营 = 进行中+已通过，体检 = 未开始+待审核，有查看全部。
- `#/c/h5/my` 与 `#/c/pc/my`：晚会未开始+已通过，开放日已结束+已驳回，公益讲座失效+待审核。
- 发现活动 / 详情 pill 仍只有活动状态，没有审核 pill。

- [ ] **Step 3: 跳过 commit**

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| 种子 5 条与 createdAt 顺序 | 1 |
| reset 仍清空 | 1 |
| submitSignup 仍已通过 | 1 |
| 状态行组件 + 颜色 | 2 |
| H5 首页预览双 pill | 3 |
| H5 我的报名 / 失效无活动状态 | 4 |
| PC 首页 | 5 |
| PC 我的报名 | 6 |
| 不改发现活动 / 详情 / 后台 | 全程 |
| 不 mock 已取消 | 1 类型不含已取消 |

无 TBD。`loadDemoSignups` / `DEMO_CLIENT_SIGNUPS` / `c-signup-status-row` 名称全任务一致。
