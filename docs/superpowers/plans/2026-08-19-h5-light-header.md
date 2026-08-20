# H5 浅色标准导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页渐变门户头替换为统一浅色 H5 导航，并把“我的报名”移到首页正文顶部快捷卡。

**Architecture:** 复用 `H5ActivityShell` 现有标准标题模式，不再给首页传自定义 header。首页正文新增单一整卡按钮；CSS 删除失效的门户头规则，并在 `.c-h5-shell` 内统一首页、详情和“我的报名”的浅色导航。

**Tech Stack:** React 19、TypeScript、Vitest、现有 H5 scoped CSS。

---

## File map

- Create: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx` — 首页导航和快捷卡结构回归测试。
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx` — 使用标准 H5 标题头并移动“我的报名”入口。
- Modify: `src/features/c-end/activities/styles.css` — 浅色 H5 导航和正文快捷卡样式，移除未使用门户头样式。

目录不是 Git 仓库；执行时不提交。

### Task 1: 首页标准导航与“我的报名”快捷卡

**Files:**
- Create: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx:3-70`

- [ ] **Step 1: 写失败结构测试**

创建测试：

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { H5ActivityHome } from './H5ActivityHome';

describe('H5 activity home header', () => {
  it('uses the standard H5 header and keeps my signups in main content', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).toContain('<header class="c-h5-top">');
    expect(html).toContain('<h1 class="c-h5-title">员工活动</h1>');
    expect(html).not.toContain('c-h5-portal-head');
    expect(html).toContain('class="c-h5-my-shortcut"');
    expect(html).toContain('我的报名');
    expect(html.indexOf('c-h5-my-shortcut')).toBeGreaterThan(html.indexOf('<main'));
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx
```

Expected: FAIL，当前首页仍渲染 `c-h5-portal-head`，没有 `c-h5-my-shortcut`。

- [ ] **Step 3: 替换首页头部结构**

首页改用标准壳：

```tsx
<H5ActivityShell title="员工活动" onBack={goAdminWorkbench}>
```

删除 `header={...}` 中的渐变欢迎头，移除 `IconBack` import。

在所有首页业务 section 之前加入：

```tsx
<button
  className="c-h5-my-shortcut"
  type="button"
  aria-label={`我的报名，共 ${signups.length} 条`}
  onClick={goH5MySignups}
>
  <span className="c-h5-my-shortcut-icon" aria-hidden>
    <IconTicket />
  </span>
  <span className="c-h5-my-shortcut-copy">
    <strong>我的报名</strong>
    <small>查看已报名活动</small>
  </span>
  <span className="c-h5-my-shortcut-count">{signups.length}</span>
  <IconChevronRight />
</button>
```

从 `Icons` 导入 `IconChevronRight`。入口仍调用 `goH5MySignups`，报名数量逻辑不变。

- [ ] **Step 4: 运行测试和类型检查**

Run:

```bash
npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx
npx tsc -b --pretty false
```

Expected: 新测试 PASS，TypeScript 无错误。

### Task 2: 浅色 H5 导航与快捷卡视觉

**Files:**
- Modify: `src/features/c-end/activities/styles.css:1215-1384,2119-2133`

- [ ] **Step 1: 统一标准 H5 导航**

将 H5 scoped 顶部规则改为：

```css
.c-h5-shell .c-h5-top {
  height: calc(44px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 8px 0;
  border-bottom: 1px solid #e7edf2;
  background: #fff;
  color: #14213d;
  box-shadow: none;
}

.c-h5-shell .c-h5-top .c-icon-btn {
  color: #14213d;
}

.c-h5-shell .c-h5-title {
  min-width: 0;
  padding: 0 6px;
  color: #14213d;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: 0;
}
```

标准头继续保留左侧 44px 返回按钮和右侧 44px 占位，保证标题居中。

- [ ] **Step 2: 删除失效门户头样式**

删除以下未再使用的 scoped 规则及其 359px media 覆盖：

```css
.c-h5-shell .c-h5-portal-head { ... }
.c-h5-shell .c-h5-portal-head::after { ... }
.c-h5-shell .c-h5-brand-back { ... }
.c-h5-shell .c-h5-identity { ... }
.c-h5-shell .c-h5-identity small { ... }
.c-h5-shell .c-h5-portal-title { ... }
.c-h5-shell .c-h5-my-entry { ... }
.c-h5-shell .c-h5-my-entry .c-icon { ... }
.c-h5-shell .c-h5-my-entry > span { ... }
.c-h5-shell .c-h5-my-entry b { ... }
```

删除深色 header 专用浅色 focus ring覆盖；标准头使用现有深青色 focus ring。

- [ ] **Step 3: 增加正文快捷卡样式**

加入：

```css
.c-h5-shell .c-h5-my-shortcut {
  width: 100%;
  min-height: 76px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto 20px;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  border: 1px solid #dfe8ef;
  border-radius: 16px;
  background: #fff;
  color: var(--c-text);
  padding: 12px 14px;
  text-align: left;
  box-shadow: var(--c-shadow);
  cursor: pointer;
}

.c-h5-shell .c-h5-my-shortcut-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #e3f8f5;
  color: #087f73;
}

.c-h5-shell .c-h5-my-shortcut-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.c-h5-shell .c-h5-my-shortcut-copy strong,
.c-h5-shell .c-h5-my-shortcut-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c-h5-shell .c-h5-my-shortcut-copy small {
  color: var(--c-muted);
  font-size: 12px;
}

.c-h5-shell .c-h5-my-shortcut-count {
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e3f8f5;
  color: #06665e;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 700;
}
```

限制计数和文字溢出；快捷卡整卡触控，不增加内部按钮。

- [ ] **Step 4: 全量验证**

Run:

```bash
npm test
npm run build
npm run check:standards
```

Expected: 所有测试通过，构建与规范检查退出码 0；PC scoped 样式未修改。
