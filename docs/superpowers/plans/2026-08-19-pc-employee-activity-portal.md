# PC 员工活动门户对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把员工端 PC 活动页对齐 H5 的任务结构：我的活动预览、发现活动网格、我的报名页、双栏详情，配色改为海军蓝/青绿。

**Architecture:** 复用 `clientActivity` 与 `signupStore`，不改 H5 组件。PC 继续用 `PcActivityShell` 顶栏、网格列表和右栏 CTA。`#/c/pc/my` 复用现有 `h5Page: 'my'` 字段（h5/pc 都解析 `my`），由 `CEndApp` 按 `surface` 挂不同页面。Token 只写在 `.c-pc-shell`。

**Tech Stack:** React 19、TypeScript、Vitest、现有 C 端 CSS。

---

## File map

- Modify: `src/app/navigation.ts` — `pc/my` 解析与 `goPcMySignups`。
- Modify: `src/app/navigation.test.ts` — PC 报名路由测试。
- Modify: `src/app/CEndApp.tsx` — PC 挂载报名页。
- Create: `src/features/c-end/activities/pc/PcMySignups.tsx` — PC 我的报名。
- Create: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx` — 我的活动 + 发现活动，去掉横滑和社交数字。
- Create: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityShell.tsx` — 标题改为「员工活动」。
- Create: `src/features/c-end/activities/pc/PcActivityShell.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx` — 左栏信息顺序，右栏只留 CTA。
- Create: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/styles.css` — `.c-pc-shell` 青绿海军蓝、我的活动、报名卡。

目录不是 Git 仓库；每项末尾跳过 commit。

规格：`docs/superpowers/specs/2026-08-19-pc-employee-activity-portal-design.md`。

---

### Task 1: PC「我的报名」路由

**Files:**
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`

- [ ] **Step 1: 写失败测试**

把 `src/app/navigation.test.ts` 改成：

```ts
import { describe, expect, it } from 'vitest';
import { parseCEndHash, toH5MySignupsHash, toPcMySignupsHash } from './navigation';

describe('C-end navigation', () => {
  it('parses the H5 my signups page', () => {
    expect(parseCEndHash('#/c/h5/my')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'my',
    });
  });

  it('parses the PC my signups page', () => {
    expect(parseCEndHash('#/c/pc/my')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'my',
    });
  });

  it('keeps parsing numeric activity details', () => {
    expect(parseCEndHash('#/c/h5/21')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 21,
    });
    expect(parseCEndHash('#/c/pc/21')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      activityId: 21,
    });
  });

  it('builds the my signups hashes', () => {
    expect(toH5MySignupsHash()).toBe('#/c/h5/my');
    expect(toPcMySignupsHash()).toBe('#/c/pc/my');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- src/app/navigation.test.ts
```

Expected: FAIL，`toPcMySignupsHash` 未导出；`#/c/pc/my` 被当成 `activityId: NaN` 或 `-1`。

- [ ] **Step 3: 最小实现**

在 `src/app/navigation.ts` 把解析改成对两个 surface 都认 `my`：

```ts
if (rawId === 'my') return { kind: 'c-end', surface, h5Page: 'my' };
```

在 `goH5MySignups` 后追加：

```ts
export function toPcMySignupsHash(): string {
  return '#/c/pc/my';
}

export function goPcMySignups() {
  window.location.hash = toPcMySignupsHash();
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/app/navigation.test.ts
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

不是 Git 仓库。

---

### Task 2: PC 我的报名页

**Files:**
- Create: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Create: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/app/CEndApp.tsx`

- [ ] **Step 1: 写失败测试**

创建 `src/features/c-end/activities/pc/PcMySignups.test.tsx`：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialActivities } from '../../../activities/model/activity';
import type { ClientSignupView } from '../model/clientActivity';
import { resetClientSignups } from '../model/signupStore';
import { PcMySignups, PcSignupGroup } from './PcMySignups';

const signup = {
  activityId: initialActivities[0].id,
  name: '陈产品',
  phone: '13800001111',
  type: '个人报名',
  status: '已通过' as const,
  createdAt: '2026-08-18T12:00:00.000Z',
};

describe('PC my signups', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
  });

  it('renders the empty state with a home action', () => {
    const html = renderToStaticMarkup(<PcMySignups />);

    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).toContain('<h2>还没有报名活动</h2>');
    expect(html).toContain('>去看看活动</button>');
  });

  it('takes precedence over an activity id in the PC route branch', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="my" activityId={1} />);

    expect(html).toContain('还没有报名活动');
    expect(html).not.toContain('c-pc-detail');
  });

  it('renders a valid association as one whole-card button', () => {
    const item: ClientSignupView = { signup, activity: initialActivities[0] };
    const html = renderToStaticMarkup(<PcSignupGroup title="待参加" items={[item]} />);

    expect(html).toContain('<button');
    expect(html).toContain(initialActivities[0].title);
    expect(html).toContain('个人报名');
    expect(html).toContain('已通过');
  });

  it('renders a missing association as ended, inactive content', () => {
    const item: ClientSignupView = { signup };
    const html = renderToStaticMarkup(<PcSignupGroup title="已结束" items={[item]} />);

    expect(html).toContain('活动已失效');
    expect(html).not.toContain('<button');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: FAIL，无法解析 `./PcMySignups`。

- [ ] **Step 3: 实现页面并挂路由**

创建 `src/features/c-end/activities/pc/PcMySignups.tsx`：

```tsx
import { useMemo } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight, IconTicket } from '../components/Icons';
import { StatusPill } from '../components/StatusPill';
import {
  clientVisibleActivities,
  groupClientSignups,
  type ClientSignupView,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';

function SignupDetails({ item }: { item: ClientSignupView }) {
  return (
    <>
      <p className="c-pc-signup-type">报名类型：{item.signup.type}</p>
      <span className="c-pc-signup-status">{item.signup.status}</span>
    </>
  );
}

function SignupCard({ item }: { item: ClientSignupView }) {
  const { activity } = item;

  if (!activity) {
    return (
      <article className="c-pc-signup-card is-invalid">
        <div className="c-pc-signup-card-body">
          <h3 className="c-pc-signup-title">活动已失效</h3>
          <SignupDetails item={item} />
        </div>
      </article>
    );
  }

  return (
    <button
      className="c-pc-signup-card c-card-btn"
      type="button"
      onClick={() => goCEnd('pc', activity.id)}
    >
      <div className="c-pc-signup-card-body">
        <div className="c-pc-signup-card-head">
          <h3 className="c-pc-signup-title">{activity.title}</h3>
          <StatusPill status={activity.activityStatus} />
        </div>
        <SignupDetails item={item} />
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}

export function PcSignupGroup({
  title,
  items,
}: {
  title: '待参加' | '已结束';
  items: ClientSignupView[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="c-pc-section c-pc-signup-group">
      <div className="c-pc-section-head">
        <h2 className="c-section-title">{title}</h2>
      </div>
      <ul className="c-pc-signup-list" aria-label={`${title}报名`}>
        {items.map((item) => (
          <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
            <SignupCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PcMySignups() {
  const activities = useActivities();
  const signups = useUserSignups();
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const goHome = () => goCEnd('pc');

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
          <PcSignupGroup title="待参加" items={groups.upcoming} />
          <PcSignupGroup title="已结束" items={groups.ended} />
        </>
      )}
    </PcActivityShell>
  );
}
```

`CEndApp.tsx` 改成：

```tsx
import { PcMySignups } from '../features/c-end/activities/pc/PcMySignups';

export function CEndApp(props: CEndAppProps) {
  const { surface, activityId, h5Page } = props;
  const page =
    surface === 'h5' ? (
      h5Page === 'my' ? (
        <H5MySignups />
      ) : activityId == null ? (
        <H5ActivityHome />
      ) : (
        <H5ActivityDetail id={activityId} />
      )
    ) : h5Page === 'my' ? (
      <PcMySignups />
    ) : activityId == null ? (
      <PcActivityHome />
    ) : (
      <PcActivityDetail id={activityId} />
    );

  return (
    <div className="c-end">
      <CEndToastProvider>{page}</CEndToastProvider>
    </div>
  );
}
```

同一文件保留原有 H5 import。`PcActivityShell` 本任务仍显示「活动广场」；空态测试会因此失败。若失败信息是标题不是「员工活动」，先把 `PcActivityShell` 的 `<h1 className="c-pc-header-title">` 改成「员工活动」。不要改「手机版」按钮。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/h5/H5MySignups.test.tsx
```

Expected: PASS。H5 报名页回归不能坏。

- [ ] **Step 5: 跳过 commit**

---

### Task 3: PC 首页「我的活动」+ 发现活动

**Files:**
- Create: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`

- [ ] **Step 1: 写失败测试**

创建 `src/features/c-end/activities/pc/PcActivityHome.test.tsx`：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resetClientSignups, submitSignup } from '../model/signupStore';
import { PcActivityHome } from './PcActivityHome';

describe('PC activity home', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
  });

  it('renders my-activities above the catalog', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mineIndex = html.indexOf('c-pc-my-activities');
    const catalogIndex = html.indexOf('id="pc-activity-catalog"');

    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(html).toContain('还没有报名活动');
    expect(html).toContain('>去看看活动</button>');
    expect(html).not.toContain('查看全部');
    expect(mineIndex).toBeGreaterThan(-1);
    expect(mineIndex).toBeLessThan(catalogIndex);
  });

  it('does not render the featured signup rail or social counts', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).not.toContain('报名中活动');
    expect(html).not.toContain('c-hero-carousel');
    expect(html).not.toContain('c-social');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
  });

  it('previews up to two upcoming signups without a view-all link', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect((html.match(/class="c-pc-signup-card /g) ?? []).length).toBe(1);
    expect(html).toContain('新员工入职训练营');
    expect(html).toContain('培训中心 3 楼');
    expect(html).not.toContain('查看全部');
  });

  it('shows view-all when upcoming signups exceed the home preview limit', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(submitSignup(6, '个人报名')).toBe('ok');
    expect(submitSignup(9, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('查看全部');
    expect((html.match(/class="c-pc-signup-card /g) ?? []).length).toBe(2);
  });

  it('keeps ended signups off the home preview', () => {
    expect(submitSignup(1, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = html.slice(
      html.indexOf('c-pc-my-activities'),
      html.indexOf('id="pc-activity-catalog"'),
    );

    expect(mine).toContain('查看全部');
    expect(mine).toContain('暂无待参加活动');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('c-pc-signup-card');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: FAIL，首页仍有 `c-hero-carousel` / `c-social`，没有 `c-pc-my-activities`。

- [ ] **Step 3: 重写首页**

用下面整文件替换 `src/features/c-end/activities/pc/PcActivityHome.tsx`：

```tsx
import { useMemo, useState } from 'react';
import type { Activity } from '../../../activities/model/activity';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd, goPcMySignups } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight } from '../components/Icons';
import { StatusPill } from '../components/StatusPill';
import {
  CLIENT_TABS,
  HOME_SIGNUP_PREVIEW_LIMIT,
  clientVisibleActivities,
  filterByTab,
  groupClientSignups,
  signupCta,
  type ClientTabId,
} from '../model/clientActivity';
import { useUserSignups } from '../model/signupStore';
import { PcActivityShell } from './PcActivityShell';

const CATALOG_ID = 'pc-activity-catalog';

function scrollToCatalog() {
  document.getElementById(CATALOG_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function HomeSignupPreviewCard({ activity }: { activity: Activity }) {
  return (
    <button
      className="c-pc-signup-card c-card-btn is-preview"
      type="button"
      onClick={() => goCEnd('pc', activity.id)}
    >
      <div className="c-pc-signup-card-body">
        <h3 className="c-pc-signup-title">{activity.title}</h3>
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}

export function PcActivityHome() {
  const activities = useActivities();
  const signups = useUserSignups();
  const [tab, setTab] = useState<ClientTabId>('all');
  const signedIds = useMemo(
    () => new Set(signups.map((signup) => signup.activityId)),
    [signups],
  );
  const list = useMemo(() => filterByTab(activities, tab), [activities, tab]);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const preview = groups.upcoming.slice(0, HOME_SIGNUP_PREVIEW_LIMIT);
  const showViewAll =
    groups.upcoming.length > HOME_SIGNUP_PREVIEW_LIMIT || groups.ended.length > 0;

  return (
    <PcActivityShell>
      <section className="c-pc-section c-pc-my-activities">
        <div className="c-pc-section-head">
          <h2 className="c-section-title">我的活动</h2>
          {showViewAll ? (
            <button className="c-pc-section-more" type="button" onClick={goPcMySignups}>
              查看全部
            </button>
          ) : null}
        </div>
        {signups.length === 0 ? (
          <div className="c-pc-my-empty">
            <p>还没有报名活动</p>
            <button className="c-btn c-btn-ghost" type="button" onClick={scrollToCatalog}>
              去看看活动
            </button>
          </div>
        ) : preview.length === 0 ? (
          <p className="c-empty">暂无待参加活动</p>
        ) : (
          <ul className="c-pc-preview-list" aria-label="待参加活动">
            {preview.map((item) =>
              item.activity ? (
                <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
                  <HomeSignupPreviewCard activity={item.activity} />
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>

      <section id={CATALOG_ID} className="c-pc-section c-catalog">
        <div className="c-pc-section-head">
          <h2 className="c-section-title">发现活动</h2>
        </div>
        <div className="c-catalog-bar">
          <div className="c-tabs" role="tablist" aria-label="活动类型">
            {CLIENT_TABS.map((item) => {
              const active = item.id === tab;
              return (
                <button
                  key={item.id}
                  className={`c-tab${active ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        {list.length === 0 ? (
          <p className="c-empty">暂无相关活动</p>
        ) : (
          <ul className="c-pc-grid" aria-label="活动列表">
            {list.map((activity) => {
              const cta = signupCta(activity, signedIds.has(activity.id));
              return (
                <li key={activity.id}>
                  <button
                    className="c-pc-card c-card-btn"
                    type="button"
                    aria-label={`活动 ${activity.title}`}
                    onClick={() => goCEnd('pc', activity.id)}
                  >
                    <div className="c-cover">
                      {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
                      <span className="c-cover-type">{activity.type}</span>
                    </div>
                    <div className="c-pc-card-body">
                      <div className="c-title-row">
                        <div className="c-card-title">{activity.title}</div>
                        {activity.pinned ? <span className="c-pin">置顶</span> : null}
                      </div>
                      <ActivityMeta activity={activity} compact />
                      <div className="c-pc-card-foot">
                        <StatusPill status={activity.activityStatus} />
                        <span className={`c-card-action${cta.enabled ? '' : ' is-disabled'}${signedIds.has(activity.id) ? ' is-signed' : ''}`}>
                          {cta.label}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PcActivityShell>
  );
}
```

删除 `HeroCard`、`FeaturedRail`、`SocialRow`、`IconFire`、`IconHorn`、`featuredActivities`、`catalogActivities`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 4: PC 顶栏标题与视觉 token

**Files:**
- Create: `src/features/c-end/activities/pc/PcActivityShell.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityShell.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

创建 `src/features/c-end/activities/pc/PcActivityShell.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PcActivityShell } from './PcActivityShell';

describe('PC activity shell', () => {
  it('keeps the desktop chrome with the employee-activity title', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).toContain('<header class="c-pc-header">');
    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).not.toContain('活动广场');
    expect(html).toContain('手机版');
    expect(html).toContain('内容');
  });
});
```

若 Task 2 已改标题，本测试会直接绿。仍要补 CSS。

- [ ] **Step 2: 运行测试**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityShell.test.tsx
```

Expected: 若标题已改则 PASS；否则 FAIL，仍是「活动广场」。

- [ ] **Step 3: 标题 + CSS**

`PcActivityShell.tsx` 标题：

```tsx
<h1 className="c-pc-header-title">员工活动</h1>
```

在 `styles.css` 的 `.c-pc-shell {` 规则后追加（不要改 `.c-h5-shell` 和后台）：

```css
.c-pc-shell {
  min-height: 100vh;
  background: #f4f7fa;
  color: #16324f;
}

.c-pc-shell .c-pc-header {
  border-bottom: 1px solid #e7edf2;
  background: #fff;
  color: #14213d;
}

.c-pc-shell .c-pc-mark {
  background: #14b8a6;
}

.c-pc-shell .c-pc-phone,
.c-pc-shell .c-pc-section-more {
  color: #087f73;
}

.c-pc-shell .c-pc-section + .c-pc-section,
.c-pc-shell .c-catalog {
  margin-top: 28px;
}

.c-pc-shell .c-pc-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  margin-bottom: 14px;
}

.c-pc-shell .c-pc-section-head .c-section-title,
.c-pc-shell .c-catalog .c-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #16324f;
  font-size: 20px;
  font-weight: 750;
}

.c-pc-shell .c-pc-section-head .c-section-title::before,
.c-pc-shell .c-catalog .c-section-title::before {
  content: "";
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: #14b8a6;
}

.c-pc-shell .c-pc-section-more {
  appearance: none;
  min-height: 44px;
  border: 0;
  background: transparent;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}

.c-pc-shell .c-pc-my-empty,
.c-pc-shell .c-pc-signup-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 76px;
  border: 1px dashed #d5dee8;
  border-radius: 16px;
  background: #fff;
  padding: 14px 16px;
}

.c-pc-shell .c-pc-signup-empty {
  flex-direction: column;
  justify-content: center;
  min-height: 280px;
  text-align: center;
}

.c-pc-shell .c-pc-my-empty p,
.c-pc-shell .c-pc-signup-empty p {
  margin: 0;
  color: #53657a;
}

.c-pc-shell .c-pc-preview-list,
.c-pc-shell .c-pc-signup-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.c-pc-shell .c-pc-signup-card {
  width: 100%;
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e3eaf0;
  border-radius: 16px;
  background: #fff;
  color: inherit;
  padding: 14px;
  text-align: left;
}

.c-pc-shell .c-pc-signup-card.is-invalid {
  border-style: dashed;
  background: #eef2f5;
}

.c-pc-shell .c-pc-signup-title {
  margin: 0;
  font-size: 16px;
  font-weight: 750;
}

.c-pc-shell .c-pc-signup-type {
  margin: 8px 0 0;
  color: #53657a;
  font-size: 13px;
}

.c-pc-shell .c-pc-signup-status {
  display: inline-flex;
  margin-top: 6px;
  border-radius: 999px;
  background: #e3f8f5;
  color: #065f56;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 650;
}

.c-pc-shell .c-tab.is-active {
  background: #16324f;
  color: #fff;
}

.c-pc-shell .c-btn-primary,
.c-pc-shell .c-cta:not(:disabled) {
  background: #14b8a6;
  color: #062e2a;
}

.c-pc-shell .c-btn-ghost {
  background: #edf2f6;
  color: #29445f;
}

.c-pc-shell #pc-activity-catalog {
  scroll-margin-top: 72px;
}

@media (max-width: 900px) {
  .c-pc-shell .c-pc-preview-list,
  .c-pc-shell .c-pc-signup-list {
    grid-template-columns: 1fr;
  }
}
```

如果文件里已有 `.c-pc-shell { min-height: 100vh; background: var(--c-bg); }`，把它替换成上面第一段，不要留两份。保留现有 `.c-pc-detail` 在 `max-width: 900px` 折成单栏的规则。

- [ ] **Step 4: 跑测试**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityShell.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 5: PC 详情双栏内容顺序

**Files:**
- Create: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`

- [ ] **Step 1: 写失败测试**

创建 `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PcActivityDetail } from './PcActivityDetail';

describe('PC activity detail', () => {
  it('keeps a two-column layout with CTA in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const article = html.indexOf('<article');
    const aside = html.indexOf('<aside class="c-pc-side">');
    const cta = html.indexOf('class="c-cta"');

    expect(html).toContain('c-pc-detail');
    expect(html).toContain('c-detail-info-card');
    expect(html).toContain('活动介绍');
    expect(html).toContain('发起人：');
    expect(html).toContain('活动限额：');
    expect(article).toBeGreaterThan(-1);
    expect(aside).toBeGreaterThan(article);
    expect(cta).toBeGreaterThan(aside);
  });

  it('does not keep core activity facts only in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));

    expect(aside).not.toContain('发起人：');
    expect(aside).not.toContain('联系电话：');
    expect(aside).toContain('class="c-cta"');
  });

  it('renders a missing activity as a recovery state', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={999999} />);

    expect(html).toContain('活动不存在');
    expect(html).toContain('返回列表');
    expect(html).not.toContain('c-pc-detail');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityDetail.test.tsx
```

Expected: FAIL，没有 `c-detail-info-card`，侧栏仍有「发起人」。

- [ ] **Step 3: 重排详情**

`PcActivityDetail.tsx` 增加：

```tsx
import { signupCta, signupLimit, signupTypes, getPublishedActivity } from '../model/clientActivity';

function withoutLeadingIntroductionHeading(html: string): string {
  const heading = /^(\s*)<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\2\s*>/i.exec(html);
  if (!heading) return html;
  const headingText = heading[3].replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
  if (headingText !== '活动介绍') return html;
  return `${heading[1]}${html.slice(heading[0].length)}`;
}
```

有效活动的 return 改为（保留现有 modal / toast / confirm 逻辑）：

```tsx
  const limit = signupLimit(activity);
  const cta = signupCta(activity, signedUp);
  const types = signupTypes(activity);
  const detailHtml = withoutLeadingIntroductionHeading(activity.detailHtml);

  return (
    <PcActivityShell>
      <button className="c-back-link" type="button" onClick={() => goCEnd('pc')}>
        ← 返回列表
      </button>
      <div className="c-pc-detail">
        <article>
          <div className="c-detail-cover">
            {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
          </div>
          <div className="c-detail-body c-article-body">
            <header className="c-detail-heading">
              <div className="c-detail-tags">
                <StatusPill status={activity.activityStatus} />
                <span className="c-pin">{activity.type}</span>
              </div>
              <h2 className="c-detail-name">{activity.title}</h2>
            </header>
            <section className="c-detail-info-card" aria-label="活动信息">
              <ActivityMeta activity={activity} />
              <div className="c-meta c-detail-kv">
                <div>发起人：{activity.organizer}</div>
                <div>联系电话：{activity.phone}</div>
                {limit !== undefined ? <div>活动限额：{limit} 人</div> : null}
              </div>
            </section>
            <section className="c-detail-content-section" aria-labelledby="pc-activity-intro">
              <h2 id="pc-activity-intro" className="c-detail-name c-detail-section">
                活动介绍
              </h2>
              <div className="c-html" dangerouslySetInnerHTML={{ __html: detailHtml }} />
            </section>
            {isRecreationActivity(activity.type) ? (
              <>
                <h2 className="c-detail-name c-detail-section">行程安排</h2>
                <div className="c-html" dangerouslySetInnerHTML={{ __html: activity.itinerary || '—' }} />
                <h2 className="c-detail-name c-detail-section">额外费用规则</h2>
                <div className="c-html" dangerouslySetInnerHTML={{ __html: activity.extraFeeRule || '—' }} />
              </>
            ) : null}
            <MomentFeed activity={activity} onCompose={(record) => setComposer(record ?? 'create')} />
          </div>
        </article>
        <aside className="c-pc-side">
          <h2 className="c-detail-name">{activity.title}</h2>
          <div className="c-detail-tags">
            <StatusPill status={activity.activityStatus} />
          </div>
          <button className="c-cta" type="button" disabled={!cta.enabled} onClick={() => setModalOpen(true)}>
            {cta.label}
          </button>
        </aside>
      </div>
      {modalOpen ? <PcSignupModal types={types} onCancel={() => setModalOpen(false)} onConfirm={confirm} /> : null}
      {composer ? (
        <PcMomentModal
          activity={activity}
          editing={composer === 'create' ? undefined : composer}
          onCancel={() => setComposer(undefined)}
          onSuccess={(text) => {
            setComposer(undefined);
            toast.show(text);
          }}
        />
      ) : null}
    </PcActivityShell>
  );
```

不要改成 H5 Sheet。`confirm` 保持现有 toast 文案。

在 `.c-pc-shell` 下补详情信息卡：

```css
.c-pc-shell .c-detail-info-card {
  margin: 16px 0 20px;
  border: 1px solid #e3eaf0;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityDetail.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 6: 全量验证

**Files:** 无新文件。

- [ ] **Step 1: 跑全部测试和类型检查**

```bash
npm test && npx tsc -b --pretty false
```

Expected: 全部 PASS，TypeScript 无错误。H5 测试必须仍在。

- [ ] **Step 2: 手测地址**

- `http://127.0.0.1:5173/#/c/pc`：顶栏「员工活动」，我的活动在上，发现活动网格，无横滑、无点赞数。
- 报名 1 个活动后首页出现预览卡；超过 2 个出现「查看全部」。
- `#/c/pc/my`：待参加 / 已结束。
- `#/c/pc/2`：左信息卡 + 介绍，右 CTA，弹窗报名。
- `#/c/h5`：H5 无回归。

- [ ] **Step 3: 跳过 commit**

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| `#/c/pc/my` 路由 | 1, 2 |
| 顶栏「员工活动」+ 手机版 | 2, 4 |
| 我的活动预览规则 | 3 |
| 去掉报名中横滑和社交数字 | 3 |
| 发现活动网格 | 3 |
| 我的报名分组/失效 | 2 |
| 详情双栏 + 左信息卡 + 右 CTA | 5 |
| `.c-pc-shell` token | 4 |
| 不改 H5 / 后台 | 全程 |
| 窄屏侧栏下折 | 4 保留现有 900px media |

## 类型一致性

- 继续用 `h5Page: 'my'`，不要新造 `pcPage`。
- 预览条数：`HOME_SIGNUP_PREVIEW_LIMIT`。
- 报名卡 class：`c-pc-signup-card`。
- 目录 id：`pc-activity-catalog`。
- 跳转：`goCEnd('pc')` / `goCEnd('pc', id)` / `goPcMySignups()`。
