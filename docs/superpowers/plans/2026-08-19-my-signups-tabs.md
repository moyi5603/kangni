# 我的报名 Tab 分组 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「我的报名」用三个 pill tab（待参加 / 进行中 / 已结束）切换列表；首页预览仍用未开始+进行中合计。

**Architecture:** 扩展 `groupClientSignups` 增加 `waiting` / `ongoing`，保留 `upcoming` 给首页。H5 / PC 我的报名页本地 `useState` 选 tab，不写 hash。无报名仍整页空态。SSR 测切换用可选 `initialTab`。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 `.c-tab`。

---

## File map

- Modify: `src/features/c-end/activities/model/clientActivity.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/styles.css` — 仅当我的报名 tab 需要壳内间距；优先复用 `.c-tabs` / `.c-tab`。

规格：`docs/superpowers/specs/2026-08-19-my-signups-tabs-design.md`。

目录不是 Git 仓库；每项末尾跳过 commit。

Demo 种子（无失效）：id 2 进行中、id 6 未开始、id 9 未开始、id 1 已结束。默认 tab 待参加只应看到体检+晚会。

`SignupGroup` / `PcSignupGroup` 的 card 单测继续直接喂 `items`，可以去掉组标题 `<h2>`（改由 tab 承担标题），避免和「已结束」pill 文案撞车。

---

### Task 1: 分组增加 waiting / ongoing

**Files:**
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.ts`

- [ ] **Step 1: 写失败测试**

在 `groups signups by activity status and sorts newest first` 现有断言后追加：

```ts
    expect(grouped.waiting).toEqual([]);
    expect(grouped.ongoing.map(({ signup }) => signup.createdAt)).toEqual([
      '2026-08-03 09:00',
      '2026-08-02 09:00',
    ]);
    expect(grouped.upcoming).toEqual(grouped.ongoing);
```

再加一测（同一 describe）：

```ts
  it('splits waiting ongoing and ended including invalid rows', () => {
    const waitingActivity: Activity = {
      ...baseActivity,
      id: 6,
      activityStatus: '未开始',
    };
    const ongoingActivity: Activity = {
      ...baseActivity,
      id: 2,
      activityStatus: '进行中',
    };
    const endedActivity: Activity = {
      ...baseActivity,
      id: 1,
      activityStatus: '已结束',
    };
    const signups: ClientSignup[] = [
      {
        activityId: waitingActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-17T16:00:00.000Z',
      },
      {
        activityId: ongoingActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-18T16:00:00.000Z',
      },
      {
        activityId: endedActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已驳回',
        createdAt: '2026-04-12T10:00:00.000Z',
      },
      {
        activityId: 3,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '待审核',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    ];

    const grouped = groupClientSignups(signups, [
      waitingActivity,
      ongoingActivity,
      endedActivity,
    ]);

    expect(grouped.waiting.map(({ signup }) => signup.activityId)).toEqual([6]);
    expect(grouped.ongoing.map(({ signup }) => signup.activityId)).toEqual([2]);
    expect(grouped.upcoming.map(({ signup }) => signup.activityId)).toEqual([2, 6]);
    expect(grouped.ended.map(({ signup }) => signup.activityId)).toEqual([3, 1]);
    expect(grouped.ended[0].activity).toBeUndefined();
  });
```

并在 `clientActivity.ts` 将要导出的常量处，测试文件加：

```ts
import { groupClientSignups, SIGNUP_TABS, signupLimit, signupTypes } from './clientActivity';
```

```ts
  it('exposes three signup tabs without counts', () => {
    expect(SIGNUP_TABS.map((tab) => tab.label)).toEqual(['待参加', '进行中', '已结束']);
    expect(SIGNUP_TABS.every((tab) => !('count' in tab))).toBe(true);
  });
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/model/clientActivity.test.ts
```

Expected: FAIL，`waiting` / `SIGNUP_TABS` 不存在。

- [ ] **Step 3: 最小实现**

在 `clientActivity.ts` 的 `ClientSignupView` 附近加：

```ts
export const SIGNUP_TABS = [
  { id: 'waiting', label: '待参加', empty: '暂无待参加活动' },
  { id: 'ongoing', label: '进行中', empty: '暂无进行中活动' },
  { id: 'ended', label: '已结束', empty: '暂无已结束活动' },
] as const;

export type SignupTabId = (typeof SIGNUP_TABS)[number]['id'];
```

把 `groupClientSignups` 改成：

```ts
export function groupClientSignups(
  signups: ClientSignup[],
  activities: Activity[],
): {
  waiting: ClientSignupView[];
  ongoing: ClientSignupView[];
  upcoming: ClientSignupView[];
  ended: ClientSignupView[];
} {
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  const grouped = signups
    .map((signup): ClientSignupView => ({
      signup,
      activity: activitiesById.get(signup.activityId),
    }))
    .sort((left, right) => right.signup.createdAt.localeCompare(left.signup.createdAt));

  const waiting = grouped.filter(({ activity }) => activity?.activityStatus === '未开始');
  const ongoing = grouped.filter(({ activity }) => activity?.activityStatus === '进行中');
  const upcoming = grouped.filter(
    ({ activity }) => activity && activity.activityStatus !== '已结束',
  );
  const ended = grouped.filter(
    ({ activity }) => !activity || activity.activityStatus === '已结束',
  );

  return { waiting, ongoing, upcoming, ended };
}

export function signupsForTab(
  groups: ReturnType<typeof groupClientSignups>,
  tab: SignupTabId,
): ClientSignupView[] {
  return groups[tab];
}
```

首页继续读 `groups.upcoming`。不要改 `HOME_SIGNUP_PREVIEW_LIMIT`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS。首页测试必须仍绿。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: H5 我的报名三个 tab

**Files:**
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`
- Modify: `src/features/c-end/activities/styles.css`（仅补 `.c-h5-shell .c-h5-signup-tabs` 间距，tab 复用 `.c-tab`）

- [ ] **Step 1: 写失败测试**

`H5MySignups` 增加可选 `initialTab`。把 demo 列表测试改成默认 tab 断言，并加两个 `initialTab` 测试。空态测试加：`expect(html).not.toContain('进行中');` 不够（空态文案可能不含）；改为 `expect(html).not.toContain('c-h5-signup-tabs');`。

改 `lists demo signups including rejected rows` 为：

```ts
  it('defaults to the waiting tab for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups />);

    expect(html).toContain('c-h5-signup-tabs');
    expect(html).toContain('待参加');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('年度体检安排');
    expect(html).toContain('中秋员工晚会');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('活动已失效');
  });

  it('shows ongoing demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ongoing" />);

    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('春季员工开放日');
  });

  it('shows ended demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ended" />);

    expect(html).toContain('春季员工开放日');
    expect(html).toContain('已驳回');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });
```

空态测试追加：

```ts
    expect(html).not.toContain('c-h5-signup-tabs');
```

`SignupGroup` 单测：若实现去掉组内 `<h2>`，把 `expect(html).toContain('<h2');` 从 valid card 测试删掉。失效卡测试保持。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx
```

Expected: FAIL，默认 demo 页仍同时出现训练营和开放日，或没有 `c-h5-signup-tabs`。

- [ ] **Step 3: 最小实现**

`H5MySignups.tsx`：

```tsx
import { useMemo, useState } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight, IconTicket } from '../components/Icons';
import { SignupStatusRow } from '../components/SignupStatusRow';
import {
  SIGNUP_TABS,
  clientVisibleActivities,
  groupClientSignups,
  signupsForTab,
  type ClientSignupView,
  type SignupTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { H5ActivityShell } from './H5ActivityShell';
```

`SignupThumb` / `SignupDetails` / `SignupCard` 保持现状。`SignupGroup` 去掉 section-head / h2，只渲染列表：

```tsx
export function SignupGroup({
  title,
  items,
}: {
  title: '待参加' | '进行中' | '已结束';
  items: ClientSignupView[];
}) {
  if (items.length === 0) return null;

  return (
    <ul className="c-h5-list" aria-label={`${title}报名`}>
      {items.map((item) => (
        <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
          <SignupCard item={item} />
        </li>
      ))}
    </ul>
  );
}
```

页面：

```tsx
export function H5MySignups({ initialTab = 'waiting' }: { initialTab?: SignupTabId } = {}) {
  const activities = useActivities();
  const signups = useUserSignups();
  const [tab, setTab] = useState<SignupTabId>(initialTab);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const goHome = () => goCEnd('h5');
  const items = signupsForTab(groups, tab);
  const activeTab = SIGNUP_TABS.find((item) => item.id === tab) ?? SIGNUP_TABS[0];

  return (
    <H5ActivityShell title="我的报名" onBack={goHome}>
      {signups.length === 0 ? (
        <div className="c-h5-signup-empty">
          <IconTicket />
          <h2>还没有报名活动</h2>
          <p>去看看最近有哪些活动值得参加</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <>
          <div className="c-tabs c-h5-signup-tabs" role="group" aria-label="报名分组">
            {SIGNUP_TABS.map((item) => {
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  className={`c-tab${active ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {items.length === 0 ? (
            <p className="c-empty">{activeTab.empty}</p>
          ) : (
            <SignupGroup title={activeTab.label} items={items} />
          )}
        </>
      )}
    </H5ActivityShell>
  );
}
```

`styles.css` 在 `.c-h5-shell` 下加：

```css
.c-h5-shell .c-h5-signup-tabs {
  margin: 0 0 16px;
}
```

不要给 tab 加数字。不要改发现活动分类 markup。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 3: PC 我的报名三个 tab

**Files:**
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

与 H5 平行。空态：`expect(html).not.toContain('c-pc-signup-tabs');`

```ts
  it('defaults to the waiting tab for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups />);

    expect(html).toContain('c-pc-signup-tabs');
    expect(html).toContain('待参加');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('年度体检安排');
    expect(html).toContain('中秋员工晚会');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('活动已失效');
  });

  it('shows ongoing demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="ongoing" />);

    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('春季员工开放日');
  });

  it('shows ended demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="ended" />);

    expect(html).toContain('春季员工开放日');
    expect(html).toContain('已驳回');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });
```

删掉旧的 `lists demo signups including rejected rows`（被上面三条替代）。`PcSignupGroup` 若去掉 h2，valid 测试不要依赖组标题。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 最小实现**

`PcMySignups` 同样 `initialTab = 'waiting'`。`PcSignupGroup` 只渲染 `ul.c-pc-signup-list`，去掉 section-head。

有数据时：返回列表链接下方放

```tsx
          <div className="c-tabs c-pc-signup-tabs" role="group" aria-label="报名分组">
            {SIGNUP_TABS.map((item) => {
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  className={`c-tab${active ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {items.length === 0 ? (
            <p className="c-empty">{activeTab.empty}</p>
          ) : (
            <PcSignupGroup title={activeTab.label} items={items} />
          )}
```

CSS：

```css
.c-pc-shell .c-pc-signup-tabs {
  margin: 0 0 16px;
}

.c-pc-shell .c-pc-signup-tabs .c-tab {
  min-height: 44px;
}
```

顶栏、返回列表、整页空态不动。不要改 PC 发现活动 `role="tablist"`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 4: 全量验证

**Files:** 无新文件。

- [ ] **Step 1:**

```bash
npm test && npx tsc -b --pretty false
```

Expected: 全部 PASS。

- [ ] **Step 2: 手测**

硬刷新 `#/c/h5/my`、`#/c/pc/my`：三个 tab，默认体检+晚会；进行中训练营；已结束开放日。首页 `#/c/h5`、`#/c/pc` 预览仍是训练营+体检两条。发现活动分类不变。

- [ ] **Step 3: 跳过 commit**

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| waiting / ongoing / ended + 保留 upcoming | 1 |
| SIGNUP_TABS 无数量 | 1 |
| H5 tab + 默认待参加 + empty | 2 |
| PC tab | 3 |
| 无报名不显示 tab | 2, 3 |
| 不改首页预览 | 1 回归 + 4 |
| 不写 URL | 2, 3 本地 state |

无 TBD。`SignupTabId` / `waiting` / `ongoing` / `ended` / `initialTab` 全任务一致。
