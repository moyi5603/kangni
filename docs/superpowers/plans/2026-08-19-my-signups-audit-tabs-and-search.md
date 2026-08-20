# 我的报名审核 Tab + 名称搜索 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「我的报名」五个 pill（待审核 / 待参加 / 进行中 / 已结束 / 已驳回）互斥分组，并在当前 tab 内按活动名称即时搜索；首页预览与「查看全部」不动。

**Architecture:** 扩展 `groupClientSignups` 增加 `pending` / `rejected`，活动 tab 只收 `已通过`。保留 `upcoming` 给首页（不筛审核）。导出 `filterSignupsByTitle`。H5 / PC 本地 `useState` 管 tab 与 query，不写 hash。SSR 用 `initialTab` / `initialQuery`。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 `.c-tab`、原生 `<input type="search">`。

---

## File map

- Modify: `src/features/c-end/activities/model/clientActivity.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

规格：`docs/superpowers/specs/2026-08-19-my-signups-audit-tabs-and-search-design.md`。

目录不是 Git 仓库；每项末尾跳过 commit。

Demo：id 2 进行中已通过、id 6 未开始待审核、id 9 未开始已通过、id 1 已结束已驳回。默认待参加只见晚会。

不要改 `H5ActivityHome` / `PcActivityHome` 的 `upcoming` / `showViewAll` 公式。

---

### Task 1: 分组互斥 + `filterSignupsByTitle`

**Files:**
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.ts`

- [ ] **Step 1: 写失败测试**

`clientActivity.test.ts` 顶部 import 改为：

```ts
import { filterSignupsByTitle, groupClientSignups, SIGNUP_TABS, signupLimit, signupTypes } from './clientActivity';
```

在 `groups signups by activity status and sorts newest first` 现有断言后追加：

```ts
    expect(grouped.pending).toEqual([]);
    expect(grouped.rejected).toEqual([]);
```

把 `splits waiting ongoing and ended including invalid rows` **整测替换**为：

```ts
  it('splits pending waiting ongoing ended and rejected exclusively', () => {
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
    const pendingLiveActivity: Activity = {
      ...baseActivity,
      id: 9,
      activityStatus: '未开始',
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
      {
        activityId: pendingLiveActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '待审核',
        createdAt: '2026-08-16T16:00:00.000Z',
      },
    ];

    const grouped = groupClientSignups(signups, [
      waitingActivity,
      ongoingActivity,
      endedActivity,
      pendingLiveActivity,
    ]);

    expect(grouped.pending.map(({ signup }) => signup.activityId)).toEqual([9, 3]);
    expect(grouped.pending[1].activity).toBeUndefined();
    expect(grouped.waiting.map(({ signup }) => signup.activityId)).toEqual([6]);
    expect(grouped.ongoing.map(({ signup }) => signup.activityId)).toEqual([2]);
    expect(grouped.ended).toEqual([]);
    expect(grouped.rejected.map(({ signup }) => signup.activityId)).toEqual([1]);
    expect(grouped.upcoming.map(({ signup }) => signup.activityId)).toEqual([2, 6, 9]);
  });
```

把 `exposes three signup tabs without counts` 替换为：

```ts
  it('exposes five signup tabs without counts', () => {
    expect(SIGNUP_TABS.map((tab) => tab.label)).toEqual([
      '待审核',
      '待参加',
      '进行中',
      '已结束',
      '已驳回',
    ]);
    expect(SIGNUP_TABS.map((tab) => tab.empty)).toEqual([
      '暂无待审核活动',
      '暂无待参加活动',
      '暂无进行中活动',
      '暂无已结束活动',
      '暂无已驳回活动',
    ]);
    expect(SIGNUP_TABS.every((tab) => !('count' in tab))).toBe(true);
  });
```

同一 describe 末尾加：

```ts
  it('filters signup views by activity title', () => {
    const party: ClientSignupView = {
      signup: {
        activityId: 9,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-16T16:00:00.000Z',
      },
      activity: { ...baseActivity, id: 9, title: '中秋员工晚会' },
    };
    const invalid: ClientSignupView = {
      signup: {
        activityId: -1,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '待审核',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    };

    expect(filterSignupsByTitle([party, invalid], '晚会').map((item) => item.signup.activityId)).toEqual([9]);
    expect(filterSignupsByTitle([party, invalid], ' 晚会 ').map((item) => item.signup.activityId)).toEqual([9]);
    expect(filterSignupsByTitle([party, invalid], '   ')).toEqual([party, invalid]);
    expect(filterSignupsByTitle([party, invalid], '活动已失效').map((item) => item.signup.activityId)).toEqual([-1]);
    expect(filterSignupsByTitle([party], 'PARTY')).toEqual([]);
  });
```

`ClientSignupView` 需在 test import：把 import 扩成：

```ts
import {
  filterSignupsByTitle,
  groupClientSignups,
  SIGNUP_TABS,
  signupLimit,
  signupTypes,
  type ClientSignupView,
} from './clientActivity';
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/model/clientActivity.test.ts
```

Expected: FAIL，`pending` / `filterSignupsByTitle` / 五 tab 不存在，或 `ended` 仍含 id 3 和 1。

- [ ] **Step 3: 最小实现**

`clientActivity.ts` 把 `SIGNUP_TABS` 换成：

```ts
export const SIGNUP_TABS = [
  { id: 'pending', label: '待审核', empty: '暂无待审核活动' },
  { id: 'waiting', label: '待参加', empty: '暂无待参加活动' },
  { id: 'ongoing', label: '进行中', empty: '暂无进行中活动' },
  { id: 'ended', label: '已结束', empty: '暂无已结束活动' },
  { id: 'rejected', label: '已驳回', empty: '暂无已驳回活动' },
] as const;
```

`groupClientSignups` 改成：

```ts
export function groupClientSignups(
  signups: ClientSignup[],
  activities: Activity[],
): {
  pending: ClientSignupView[];
  waiting: ClientSignupView[];
  ongoing: ClientSignupView[];
  upcoming: ClientSignupView[];
  ended: ClientSignupView[];
  rejected: ClientSignupView[];
} {
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  const grouped = signups
    .map((signup): ClientSignupView => ({
      signup,
      activity: activitiesById.get(signup.activityId),
    }))
    .sort((left, right) => right.signup.createdAt.localeCompare(left.signup.createdAt));

  const pending = grouped.filter(({ signup }) => signup.status === '待审核');
  const rejected = grouped.filter(({ signup }) => signup.status === '已驳回');
  const waiting = grouped.filter(
    ({ activity, signup }) => signup.status === '已通过' && activity?.activityStatus === '未开始',
  );
  const ongoing = grouped.filter(
    ({ activity, signup }) => signup.status === '已通过' && activity?.activityStatus === '进行中',
  );
  const upcoming = grouped.filter(
    ({ activity }) => activity && activity.activityStatus !== '已结束',
  );
  const ended = grouped.filter(
    ({ activity, signup }) =>
      signup.status === '已通过' && (!activity || activity.activityStatus === '已结束'),
  );

  return { pending, waiting, ongoing, upcoming, ended, rejected };
}
```

`signupsForTab` 保持 `return groups[tab]`。在其后加：

```ts
export function filterSignupsByTitle(items: ClientSignupView[], query: string): ClientSignupView[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const title = (item.activity?.title ?? '活动已失效').toLowerCase();
    return title.includes(needle);
  });
}
```

不要改 `HOME_SIGNUP_PREVIEW_LIMIT`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: 模型测试 PASS。首页测试必须仍绿（`upcoming` 仍含待审核的未结束活动；「查看全部」公式未改）。此步 H5/PC「我的报名」页测可能红，等 Task 2/3。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: H5 五 tab + 搜索

**Files:**
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

空态测试追加：

```ts
    expect(html).not.toContain('c-h5-signup-search');
    expect(html).not.toContain('搜索活动名称');
```

把 demo 三条 tab 测改成：

```ts
  it('defaults to the waiting tab for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups />);

    expect(html).toContain('c-h5-signup-search');
    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).toContain('c-h5-signup-tabs');
    expect(html).toContain('待审核');
    expect(html).toContain('待参加');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('已驳回');
    expect(html).toContain('中秋员工晚会');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('活动已失效');
  });

  it('shows pending demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="pending" />);

    expect(html).toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
  });

  it('shows ongoing demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ongoing" />);

    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('春季员工开放日');
  });

  it('shows the ended empty copy for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ended" />);

    expect(html).toContain('暂无已结束活动');
    expect(html).toContain('c-h5-signup-tabs');
    expect(html).toContain('c-h5-signup-search');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });

  it('shows rejected demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="rejected" />);

    expect(html).toContain('春季员工开放日');
    expect(html).toContain('已驳回');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });

  it('filters the current tab by activity title', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialQuery="晚会" />);

    expect(html).toContain('中秋员工晚会');
    expect(html).toContain('value="晚会"');
    expect(html).not.toContain('年度体检安排');
  });

  it('keeps the query when showing another tab and reports no matches', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="pending" initialQuery="晚会" />);

    expect(html).toContain('未找到相关活动');
    expect(html).toContain('value="晚会"');
    expect(html).toContain('c-h5-signup-tabs');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });
```

`SignupGroup` 单测保持。title 类型稍后会并入「待审核」「已驳回」，现有 `title="待参加"` / `"已结束"` 仍合法。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx
```

Expected: FAIL，默认页仍出现体检，或没有搜索框 / 待审核 tab。

- [ ] **Step 3: 最小实现**

`H5MySignups.tsx` import 增加 `filterSignupsByTitle`。`SignupGroup` 的 title 改为：

```ts
  title: (typeof SIGNUP_TABS)[number]['label'];
```

页面改为：

```tsx
export function H5MySignups({
  initialTab = 'waiting',
  initialQuery = '',
}: {
  initialTab?: SignupTabId;
  initialQuery?: string;
} = {}) {
  const activities = useActivities();
  const signups = useUserSignups();
  const [tab, setTab] = useState<SignupTabId>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const goHome = () => goCEnd('h5');
  const items = filterSignupsByTitle(signupsForTab(groups, tab), query);
  const activeTab = SIGNUP_TABS.find((item) => item.id === tab) ?? SIGNUP_TABS[0];
  const emptyCopy = query.trim() ? '未找到相关活动' : activeTab.empty;

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
          <input
            className="c-h5-signup-search"
            type="search"
            value={query}
            placeholder="搜索活动名称"
            aria-label="搜索活动名称"
            onChange={(event) => setQuery(event.target.value)}
          />
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
            <p className="c-empty">{emptyCopy}</p>
          ) : (
            <SignupGroup title={activeTab.label} items={items} />
          )}
        </>
      )}
    </H5ActivityShell>
  );
}
```

卡片 / `SignupThumb` 不改。不要给 tab 加数字。不要改发现活动分类 markup。

`styles.css` 在 `.c-h5-shell .c-h5-signup-tabs` **之前**加：

```css
.c-h5-shell .c-h5-signup-search {
  display: block;
  width: 100%;
  min-height: 44px;
  margin: 0 0 12px;
  box-sizing: border-box;
  border: 1px solid #e3eaf0;
  border-radius: 12px;
  padding: 0 14px;
  font: inherit;
  color: var(--c-text);
  background: #fff;
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 3: PC 五 tab + 搜索

**Files:**
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

空态追加：

```ts
    expect(html).not.toContain('c-pc-signup-search');
    expect(html).not.toContain('搜索活动名称');
```

把 PC demo tab 测改成：

```ts
  it('defaults to the waiting tab for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups />);

    expect(html).toContain('c-pc-signup-search');
    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).toContain('c-pc-signup-tabs');
    expect(html).toContain('待审核');
    expect(html).toContain('待参加');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('已驳回');
    expect(html).toContain('中秋员工晚会');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('活动已失效');
  });

  it('shows pending demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="pending" />);

    expect(html).toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
  });

  it('shows ongoing demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="ongoing" />);

    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('春季员工开放日');
  });

  it('shows the ended empty copy for demo signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="ended" />);

    expect(html).toContain('暂无已结束活动');
    expect(html).toContain('c-pc-signup-tabs');
    expect(html).toContain('c-pc-signup-search');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });

  it('shows rejected demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="rejected" />);

    expect(html).toContain('春季员工开放日');
    expect(html).toContain('已驳回');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });

  it('filters the current tab by activity title', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialQuery="晚会" />);

    expect(html).toContain('中秋员工晚会');
    expect(html).toContain('value="晚会"');
    expect(html).not.toContain('年度体检安排');
  });

  it('keeps the query when showing another tab and reports no matches', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcMySignups initialTab="pending" initialQuery="晚会" />);

    expect(html).toContain('未找到相关活动');
    expect(html).toContain('value="晚会"');
    expect(html).toContain('c-pc-signup-tabs');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
  });
```

删掉旧的 `shows ended demo signups when that tab is selected`（被 ended 空文案 + rejected 两条替代）。`PcSignupGroup` 卡片测保持。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 最小实现**

`PcMySignups.tsx` import `filterSignupsByTitle`。`PcSignupGroup` title：

```ts
  title: (typeof SIGNUP_TABS)[number]['label'];
```

页面：

```tsx
export function PcMySignups({
  initialTab = 'waiting',
  initialQuery = '',
}: {
  initialTab?: SignupTabId;
  initialQuery?: string;
} = {}) {
  const activities = useActivities();
  const signups = useUserSignups();
  const [tab, setTab] = useState<SignupTabId>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const goHome = () => goCEnd('pc');
  const items = filterSignupsByTitle(signupsForTab(groups, tab), query);
  const activeTab = SIGNUP_TABS.find((item) => item.id === tab) ?? SIGNUP_TABS[0];
  const emptyCopy = query.trim() ? '未找到相关活动' : activeTab.empty;

  return (
    <PcActivityShell>
      <button className="c-back-link" type="button" onClick={goHome}>
        ← 返回列表
      </button>
      {signups.length === 0 ? (
        <div className="c-pc-signup-empty">
          <IconTicket />
          <h2>还没有报名活动</h2>
          <p>去看看最近有哪些活动值得参加</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <>
          <input
            className="c-pc-signup-search"
            type="search"
            value={query}
            placeholder="搜索活动名称"
            aria-label="搜索活动名称"
            onChange={(event) => setQuery(event.target.value)}
          />
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
            <p className="c-empty">{emptyCopy}</p>
          ) : (
            <PcSignupGroup title={activeTab.label} items={items} />
          )}
        </>
      )}
    </PcActivityShell>
  );
}
```

顶栏、返回列表、整页空态不动。不要改 PC 发现活动 `role="tablist"`。

`styles.css` 在 `.c-pc-shell .c-pc-signup-tabs` **之前**加：

```css
.c-pc-shell .c-pc-signup-search {
  display: block;
  width: 100%;
  max-width: 420px;
  min-height: 44px;
  margin: 0 0 12px;
  box-sizing: border-box;
  border: 1px solid #d7e0ea;
  border-radius: 10px;
  padding: 0 14px;
  font: inherit;
  color: #16324f;
  background: #fff;
}
```

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

硬刷新 `#/c/h5/my`、`#/c/pc/my`：搜索在 tab 上；五 tab 顺序待审核→待参加→进行中→已结束→已驳回；默认晚会；待审核体检；进行中训练营；已结束空；已驳回开放日。搜「晚会」待参加命中，切待审核「未找到相关活动」。首页 `#/c/h5`、`#/c/pc` 预览仍训练营+体检，「查看全部」仍在。发现活动分类不变。

- [ ] **Step 3: 跳过 commit**

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| pending / rejected 互斥；活动 tab 仅已通过 | 1 |
| `upcoming` 不筛审核 | 1 + 首页回归 |
| `SIGNUP_TABS` 五枚无数量 | 1 |
| `filterSignupsByTitle` | 1 |
| H5 搜索在 tab 上 + 输入即筛 + 空文案 | 2 |
| PC 同上 | 3 |
| 无报名无 tab 无搜索 | 2, 3 |
| 默认待参加；demo 映射 | 2, 3 |
| 不改首页预览 / 查看全部 | 1 回归 + 4 |
| 不写 URL | 2, 3 本地 state |

无 TBD。`pending` / `rejected` / `filterSignupsByTitle` / `initialQuery` 全任务一致。
