# PC 首页顶栏「我的活动」入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PC 活动首页顶栏右侧增加「我的活动」，进入既有报名全页 `#/c/pc/my`。

**Architecture:** `PcActivityShell` 增加可选 `headerActions`，放进已有 `.c-pc-header-actions`（grid 第三列）。仅 `PcActivityHome` 的 `variant="preview"` 传入按钮并调用已有 `goPcMySignups`。`PcMySignups` 把 shell 标题改成「我的活动」。不改路由、store、H5。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 C 端 CSS。

---

## File map

- Modify: `src/features/c-end/activities/pc/PcActivityShell.tsx` — `headerActions?: ReactNode`
- Modify: `src/features/c-end/activities/pc/PcActivityShell.test.tsx`
- Modify: `src/features/c-end/activities/styles.css` — 第三列右对齐 + `.c-pc-header-mine`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx` — preview 传入入口
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx` — 允许首页文案，禁止全部/搜索
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx` — `title="我的活动"`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx` — 断言 h1

规格：`docs/superpowers/specs/2026-09-01-pc-my-activities-header-entry-design.md`。

用户未要求 commit 时不要 `git commit`。

H5 `H5ActivityHome.test.tsx` 仍禁止「我的活动」，本计划不要改那条。

---

### Task 1: Shell 可选顶栏操作区

**Files:**
- Modify: `src/features/c-end/activities/pc/PcActivityShell.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityShell.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: Write the failing test**

在 `src/features/c-end/activities/pc/PcActivityShell.test.tsx` 现有用例后追加：

```tsx
  it('renders optional header actions in the third header column', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell headerActions={<button type="button">我的活动</button>}>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).toContain('c-pc-header-actions');
    expect(html).toContain('>我的活动</button>');
  });

  it('omits the actions slot when headerActions is missing', () => {
    const html = renderToStaticMarkup(
      <PcActivityShell>
        <p>内容</p>
      </PcActivityShell>,
    );

    expect(html).not.toContain('c-pc-header-actions');
    expect(html).not.toContain('我的活动');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/c-end/activities/pc/PcActivityShell.test.tsx
```

Expected: FAIL. `headerActions` is not a valid prop / `c-pc-header-actions` missing.

- [ ] **Step 3: Write minimal implementation**

`src/features/c-end/activities/pc/PcActivityShell.tsx` 全文改为：

```tsx
import type { ReactNode } from 'react';
import { goCEndPortal } from '../../../../app/navigation';

type PcActivityShellProps = {
  children: ReactNode;
  title?: string;
  className?: string;
  headerActions?: ReactNode;
};

export function PcActivityShell({ children, title = '员工活动', className, headerActions }: PcActivityShellProps) {
  const shellClass = className ? `c-pc-shell ${className}` : 'c-pc-shell';
  return (
    <div className={shellClass}>
      <header className="c-pc-header">
        <button className="c-pc-brand" type="button" onClick={goCEndPortal} aria-label="返回 C 端预览">
          <span className="c-pc-mark" />
          <span className="c-pc-brand-name">康尼</span>
        </button>
        <h1 className="c-pc-header-title">{title}</h1>
        {headerActions ? <div className="c-pc-header-actions">{headerActions}</div> : null}
      </header>
      <main className="c-pc-main">{children}</main>
    </div>
  );
}
```

在 `src/features/c-end/activities/styles.css` 的 `.c-pc-header-actions` 块（约 919 行）改成：

```css
.c-pc-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  justify-self: end;
  gap: 8px;
}

.c-pc-header-mine {
  border: 0;
  background: transparent;
  color: var(--c-orange);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  padding: 0 4px;
}
```

`.c-pc-header-mine` 紧挨 `.c-pc-header-actions` 后面插入，不要改 `.c-pc-home`。

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/c-end/activities/pc/PcActivityShell.test.tsx
```

Expected: PASS.

---

### Task 2: 仅首页 preview 放入口

**Files:**
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`

- [ ] **Step 1: Write the failing test**

把 `does not render my-activities or my-favorites` 改名为并改断言（首页现在必须有顶栏「我的活动」，仍禁止预览块和收藏）：

```tsx
  it('does not render my-activities or my-favorites', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).toContain('c-pc-header-actions');
    expect(html).toContain('c-pc-header-mine');
    expect(html).toContain('>我的活动</button>');
    expect(html).not.toContain('c-pc-mine');
    expect(html).not.toContain('我的收藏');
    expect(html).not.toContain('aria-label="我的活动与收藏"');
    expect(html).not.toContain('c-pc-signup-card');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
    const card = html.slice(html.indexOf('c-pc-card'), html.indexOf('c-pc-card-body'));
    expect(card).toContain('c-cover-badges');
    expect(card).toContain('c-cover-badges is-end');
    expect(card).toContain('c-cover-title');
    expect(card).toContain('c-cover-likes');
    expect(card.indexOf('c-cover-badges')).toBeLessThan(card.indexOf('c-cover-title'));
    expect(html).not.toContain('c-cover-type');
    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));

    expect(html).not.toContain('报名中活动');
    expect(html).not.toContain('c-hero-carousel');
    expect(catalog).not.toContain('c-social');
    expect(catalog).not.toContain('aria-label="收藏"');
    expect(catalog).not.toContain('评论');
    expect(catalog).toContain('c-home-quota-bar');
    expect(catalog).toContain('已报名');
    expect(catalog).toContain('余');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
    expect(catalog).not.toContain('>我的活动</button>');
  });
```

在 `opens the search page from CEndApp` 之后追加：

```tsx
  it('hides my-activities entry on search and full catalog', () => {
    const search = renderToStaticMarkup(<PcActivityHome variant="search" />);
    const all = renderToStaticMarkup(<PcActivityHome variant="all" />);

    expect(search).not.toContain('c-pc-header-mine');
    expect(search).not.toContain('>我的活动</button>');
    expect(all).not.toContain('c-pc-header-mine');
    expect(all).not.toContain('>我的活动</button>');
  });
```

在 `opens the full catalog on the activity-list page` 里加：

```tsx
    expect(html).not.toContain('c-pc-header-mine');
    expect(html).not.toContain('>我的活动</button>');
```

在 `opens ended activities on the past-highlights page` 里加：

```tsx
    expect(html).not.toContain('c-pc-header-mine');
    expect(html).not.toContain('>我的活动</button>');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/c-end/activities/pc/PcActivityHome.test.tsx
```

Expected: FAIL. Preview HTML still has no `c-pc-header-mine` / `>我的活动</button>`.

- [ ] **Step 3: Write minimal implementation**

`src/features/c-end/activities/pc/PcActivityHome.tsx`：

1. 把

```ts
import { goCEnd, goCEndActivityList, goCEndActivitySearch, goCEndPastMoments } from '../../../../app/navigation';
```

改成：

```ts
import {
  goCEnd,
  goCEndActivityList,
  goCEndActivitySearch,
  goCEndPastMoments,
  goPcMySignups,
} from '../../../../app/navigation';
```

2. 搜索分支保持 `<PcActivityShell title="搜索">`，不要传 `headerActions`。

3. 主 return 的 shell 改成：

```tsx
    <PcActivityShell
      title={title}
      headerActions={
        preview ? (
          <button className="c-pc-header-mine" type="button" onClick={goPcMySignups}>
            我的活动
          </button>
        ) : undefined
      }
    >
```

不要给 `variant="all"` 传按钮。`preview` 在 `variant === 'preview'` 时已为 true。

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: PASS. H5 首页仍不含「我的活动」。

---

### Task 3: 报名全页标题改为「我的活动」

**Files:**
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.tsx`

- [ ] **Step 1: Write the failing test**

`renders the empty state with a home action` 里把：

```ts
    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
```

改成：

```ts
    expect(html).toContain('<h1 class="c-pc-header-title">我的活动</h1>');
    expect(html).not.toContain('c-pc-header-mine');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/c-end/activities/pc/PcMySignups.test.tsx
```

Expected: FAIL. h1 仍是「员工活动」。

- [ ] **Step 3: Write minimal implementation**

`PcMySignups` 里 `<PcActivityShell>` 改成：

```tsx
    <PcActivityShell title="我的活动">
```

不要传 `headerActions`。返回按钮、tab、搜索、卡片逻辑不动。

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityShell.test.tsx
```

Expected: all PASS.

---

### Task 4: 回归

- [ ] **Step 1: Run the C-end activity PC/H5 suite**

Run:

```bash
npx vitest run src/features/c-end/activities src/app/CEndApp.tsx src/app/navigation.test.ts
```

If `CEndApp.tsx` is not a test file, run:

```bash
npx vitest run src/features/c-end/activities src/app/navigation.test.ts
```

Expected: 0 failed.

手动核对（有浏览器时）：`#/c/pc` 顶栏右侧「我的活动」→ `#/c/pc/my`，列表为自己报名；`#/c/pc/list`、`#/c/pc/search` 顶栏无该按钮。

---

## Spec coverage

| Spec | Task |
|---|---|
| 顶栏第三列入口 | 1, 2 |
| 仅 preview 首页 | 2 |
| 全部/搜索/往期无入口 | 2 |
| `#/c/pc/my` / `goPcMySignups` | 2（复用，不改 navigation） |
| 报名页 h1「我的活动」 | 3 |
| 报名页自己不放入口 | 3 |
| 列表行为不变 | 3 不改 tab/store |
| 不做收藏/H5/预览块 | 2 断言 + 不改 H5 |

无 TBD。`headerActions` 命名 Task 1–3 一致。
