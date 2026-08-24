# 评优应用三菜单 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 评优应用侧栏改为概览、评优管理、规则设置三个一级菜单；默认进概览；三页均占位。

**Architecture:** 只改 `applications.defaultPage` 与 `applicationMenus.awards`。未接业务页已由 `App.tsx` 落到 `PlaceholderPage`。不新建 feature 目录、不改 `App.tsx`。

**Tech Stack:** TypeScript、Vitest、现有 hash 路由。

**Spec:** `docs/superpowers/specs/2026-08-24-awards-app-menus-design.md`

---

## File map

- Modify: `src/app/navigation.test.ts` — 评优菜单与默认页断言
- Modify: `src/app/navigation.ts` — `defaultPage` + 三菜单元数据

### Task 1: 导航测试与元数据

**Files:**
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/navigation.ts`

- [x] **Step 1: Update the failing tests**

把 `src/app/navigation.test.ts` 里 `describe('awards application', …)` 整块替换为：

```ts
describe('awards application', () => {
  it('registers the app under 员工与组织 after 兴趣小组', () => {
    expect(getApplication('awards')).toEqual({
      key: 'awards',
      label: '评优',
      category: '员工与组织',
      icon: 'trophy',
      defaultPage: 'award-overview',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('interest-groups') + 1);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('training') - 1);
  });

  it('uses three first-level menus: 概览 / 评优管理 / 规则设置', () => {
    expect(applicationMenus.awards).toEqual([
      { key: 'award-overview', icon: 'dashboard', label: '概览' },
      { key: 'award-list', icon: 'trophy', label: '评优管理' },
      { key: 'award-rules', icon: 'fileText', label: '规则设置' },
    ]);
  });

  it('parses leaf hashes and falls back to 概览', () => {
    expect(parseLocationHash('#/awards/award-overview')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
    expect(parseLocationHash('#/awards/award-list')).toEqual({
      application: 'awards',
      page: 'award-list',
    });
    expect(parseLocationHash('#/awards/award-rules')).toEqual({
      application: 'awards',
      page: 'award-rules',
    });
    expect(parseLocationHash('#/awards')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
    expect(parseLocationHash('#/awards/not-a-page')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).not.toContain('awards');
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: FAIL — `defaultPage` 仍为 `award-list`，菜单仍只有一项。

- [x] **Step 3: Write minimal navigation metadata**

在 `src/app/navigation.ts`：

1. 把评优应用的 `defaultPage` 改为 `award-overview`：

```ts
  { key: 'awards', label: '评优', category: '员工与组织', icon: 'trophy', defaultPage: 'award-overview' },
```

2. 把 `applicationMenus.awards` 替换为：

```ts
  awards: [
    { key: 'award-overview', icon: 'dashboard', label: '概览' },
    { key: 'award-list', icon: 'trophy', label: '评优管理' },
    { key: 'award-rules', icon: 'fileText', label: '规则设置' },
  ],
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: PASS

- [ ] **Step 5: Manual smoke（可选）**

浏览器打开应用 → 全部应用 → 评优。Hash 为 `#/awards/award-overview`。左侧三项：概览 / 评优管理 / 规则设置。点后标题与占位文案跟着变；刷新 `#/awards/award-rules` 仍停在规则设置。

- [ ] **Step 6: Commit only when the user asks**

不自动提交代码。Spec：`docs/superpowers/specs/2026-08-24-awards-app-menus-design.md`。
