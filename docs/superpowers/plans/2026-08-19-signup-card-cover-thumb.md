# 报名卡左侧封面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 H5 / PC 首页「我的活动」预览卡和「我的报名」有效卡左侧加 72px 方封面，失效卡不加图。

**Architecture:** 现有报名卡 markup 里插入 `c-signup-thumb`（fallback 色块 + 可选 `img`）。H5 / PC 各自改卡片和各自 shell 下的 CSS，不抽公共 SignupCard，不改发现活动、详情、后台。图片失败用 `onError` 把 `img` 设为 `hidden`，露出 fallback。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 C 端 CSS。

---

## File map

- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx` — 首页预览卡加封面。
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx` — 我的报名有效卡加封面。
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/styles.css` — `.c-h5-shell` / `.c-pc-shell` 下 `.c-signup-thumb`。

规格：`docs/superpowers/specs/2026-08-19-signup-card-cover-thumb-design.md`。

目录不是 Git 仓库；每项末尾跳过 commit。

Seed：活动 `id === 2` 标题「新员工入职训练营」，`coverUrl` 为 `/activities/onboarding.jpg`。断言封面时必须切「我的活动」区块，避免命中下方发现活动列表里同一张图。

---

### Task 1: H5 首页「我的活动」封面

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

在 `src/features/c-end/activities/h5/H5ActivityHome.test.tsx` 顶部补：

```ts
import { initialActivities } from '../../../activities/model/activity';
```

在 `describe` 末尾加：

```ts
  it('shows a square cover on my-activity preview cards', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = html.slice(
      html.indexOf('c-h5-my-activities'),
      html.indexOf('id="h5-activity-catalog"'),
    );
    const onboard = initialActivities.find((activity) => activity.id === 2)!;

    expect(mine).toContain('c-signup-thumb');
    expect(mine).toContain(`src="${onboard.coverUrl}"`);
    expect(mine).toContain('c-cover-fallback');
    expect(mine).not.toContain('c-cover-type');
  });
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: FAIL，`mine` 不含 `c-signup-thumb`。

- [ ] **Step 3: 最小实现**

在 `H5ActivityHome.tsx` 的 `HomeSignupPreviewCard` 前加：

```tsx
function SignupThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}
```

`HomeSignupPreviewCard` 改成：

```tsx
function HomeSignupPreviewCard({ activity }: { activity: Activity }) {
  return (
    <button
      className="c-h5-signup-card c-h5-card-button is-preview"
      type="button"
      onClick={() => goCEnd('h5', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-h5-signup-card-body">
        <h3 className="c-h5-signup-title">{activity.title}</h3>
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}
```

在 `styles.css` 的 `.c-h5-shell .c-h5-signup-card.is-preview` 块后加：

```css
.c-h5-shell .c-signup-thumb {
  position: relative;
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border-radius: 8px;
  background: #315570;
}

.c-h5-shell .c-signup-thumb .c-cover-fallback {
  font-size: 8px;
}

.c-h5-shell .c-signup-thumb .c-cover-fallback::after {
  font-size: 8px;
  letter-spacing: 0.04em;
}

.c-h5-shell .c-signup-thumb img {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

`.c-h5-shell .c-cover-fallback` 已是 `position: absolute; inset: 0`，方图里会铺满。不要加 `c-cover-type`。不要改 `.c-h5-list` 发现活动卡。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: H5「我的报名」封面

**Files:**
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5MySignups.tsx`

- [ ] **Step 1: 写失败测试**

改 `renders a valid association as one whole-card button`，在现有断言后加：

```ts
    expect(html).toContain('c-signup-thumb');
    expect(html).toContain(`src="${initialActivities[0].coverUrl}"`);
    expect(html).not.toContain('c-cover-type');
```

改 `renders a missing association as ended, inactive content`，在现有断言后加：

```ts
    expect(html).not.toContain('c-signup-thumb');
    expect(html).not.toContain('<img');
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx
```

Expected: FAIL，有效卡不含 `c-signup-thumb`。

- [ ] **Step 3: 最小实现**

在 `H5MySignups.tsx` 的 `SignupDetails` 前加（不要从 Home 文件 import，按规格 H5 各页自己改卡）：

```tsx
function SignupThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}
```

有效 `SignupCard` 的 button 内，在 `c-h5-signup-card-body` 前插入 `<SignupThumb coverUrl={activity.coverUrl} />`：

```tsx
  return (
    <button
      className="c-h5-signup-card c-h5-card-button"
      type="button"
      onClick={openActivity}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-h5-signup-card-body">
        <div className="c-h5-signup-card-head">
          <h3 className="c-h5-signup-title">{activity.title}</h3>
          <StatusPill status={activity.activityStatus} />
        </div>
        <SignupDetails item={item} />
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
```

失效 `article` 不要加 `SignupThumb`。Task 1 的 CSS 已覆盖 `.c-h5-shell .c-signup-thumb`，本任务不再改 CSS。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 3: PC 首页「我的活动」封面

**Files:**
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

在 `PcActivityHome.test.tsx` 顶部补：

```ts
import { initialActivities } from '../../../activities/model/activity';
```

在 `describe` 末尾加：

```ts
  it('shows a square cover on my-activity preview cards', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = html.slice(
      html.indexOf('c-pc-my-activities'),
      html.indexOf('id="pc-activity-catalog"'),
    );
    const onboard = initialActivities.find((activity) => activity.id === 2)!;

    expect(mine).toContain('c-signup-thumb');
    expect(mine).toContain(`src="${onboard.coverUrl}"`);
    expect(mine).toContain('c-cover-fallback');
    expect(mine).not.toContain('c-cover-type');
  });
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: FAIL，`mine` 不含 `c-signup-thumb`。

- [ ] **Step 3: 最小实现**

在 `PcActivityHome.tsx` 的 `HomeSignupPreviewCard` 前加：

```tsx
function SignupThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}
```

`HomeSignupPreviewCard` 改成：

```tsx
function HomeSignupPreviewCard({ activity }: { activity: Activity }) {
  return (
    <button
      className="c-pc-signup-card c-card-btn is-preview"
      type="button"
      onClick={() => goCEnd('pc', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
      <div className="c-pc-signup-card-body">
        <h3 className="c-pc-signup-title">{activity.title}</h3>
        <ActivityMeta activity={activity} compact />
      </div>
      <IconChevronRight />
    </button>
  );
}
```

在 `styles.css` 的 `.c-pc-shell .c-pc-signup-card` 块后加（不要写进 `.c-h5-shell`）：

```css
.c-pc-shell .c-pc-signup-card-body {
  min-width: 0;
  flex: 1;
}

.c-pc-shell .c-signup-thumb {
  position: relative;
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border-radius: 8px;
  background: #315570;
}

.c-pc-shell .c-signup-thumb .c-cover-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgb(20 184 166 / 20%), transparent 52%),
    repeating-linear-gradient(135deg, #294b68 0 18px, #315570 18px 36px);
}

.c-pc-shell .c-signup-thumb .c-cover-fallback::after {
  content: "员工活动";
  color: rgb(255 255 255 / 74%);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.c-pc-shell .c-signup-thumb img {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

不要改 `.c-pc-grid` / `.c-pc-card .c-cover`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 4: PC「我的报名」封面

**Files:**
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`

- [ ] **Step 1: 写失败测试**

改 `renders a valid association as one whole-card button`，在现有断言后加：

```ts
    expect(html).toContain('c-signup-thumb');
    expect(html).toContain(`src="${initialActivities[0].coverUrl}"`);
    expect(html).not.toContain('c-cover-type');
```

改 `renders a missing association as ended, inactive content`，在现有断言后加：

```ts
    expect(html).not.toContain('c-signup-thumb');
    expect(html).not.toContain('<img');
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: FAIL，有效卡不含 `c-signup-thumb`。

- [ ] **Step 3: 最小实现**

在 `PcMySignups.tsx` 的 `SignupDetails` 前加：

```tsx
function SignupThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}
```

有效 `SignupCard`：

```tsx
  return (
    <button
      className="c-pc-signup-card c-card-btn"
      type="button"
      onClick={() => goCEnd('pc', activity.id)}
    >
      <SignupThumb coverUrl={activity.coverUrl} />
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
```

失效 `article` 不加封面。Task 3 的 CSS 已覆盖 `.c-pc-shell .c-signup-thumb`。

- [ ] **Step 4: 跑测试确认通过**

```bash
npm test -- src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 跳过 commit**

---

### Task 5: 全量验证

**Files:** 无新文件。

- [ ] **Step 1: 跑全部测试和类型检查**

```bash
npm test && npx tsc -b --pretty false
```

Expected: 全部 PASS，TypeScript 无错误。H5 发现活动 / 详情测试仍在且通过。

- [ ] **Step 2: 手测地址**

先确认 `127.0.0.1:5173` 只有一个 listener。硬刷新。

- `#/c/h5`：报名活动 2 后，「我的活动」左侧 72px 方图，发现活动仍是 16:9。
- `#/c/h5/my`：有效卡左侧封面；失效卡无图。
- `#/c/pc`：同上，网格发现活动不变。
- `#/c/pc/my`：有效卡有封面，失效卡无图。
- `#/c/h5/2`、`#/c/pc/2`：详情封面布局不变。

- [ ] **Step 3: 跳过 commit**

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| H5 首页预览左侧方图 | 1 |
| H5 我的报名有效卡封面 | 2 |
| PC 首页预览左侧方图 | 3 |
| PC 我的报名有效卡封面 | 4 |
| 72px / 8px / object-fit cover | 1, 3 CSS |
| 无图 / onError fallback | 1, 3（PC 补色块；H5 复用 `.c-cover-fallback`） |
| 无类型角标 | 1–4 测试 `not.toContain('c-cover-type')` |
| 失效卡无图 | 2, 4 |
| 不改发现活动 / 详情 / 后台 | 全程 |
| 不抽公共 SignupCard | 四个文件各写 `SignupThumb` |

无 TBD。类型名 `SignupThumb` / class `c-signup-thumb` 四任务一致。
