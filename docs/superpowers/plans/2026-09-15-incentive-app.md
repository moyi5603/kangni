# 即时激励应用入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理端「全部应用」挂独立应用「即时激励」，左侧一个一级占位菜单，页面走现有 `PlaceholderPage`。

**Architecture:** 只改 `src/app/navigation.ts` 元数据与隐藏页映射；`App.tsx` 占位面包屑用 `siderSelectedKey` 找菜单，让 create/edit/detail 显示「激励管理」。不新建 `features/incentive`。`rocket` 已在 `navIcons`。

**Tech Stack:** React 19、antd 6、Vitest、hash 路由 `parseLocationHash` / `toLocationHash`。

**Spec:** `docs/superpowers/specs/2026-09-15-incentive-app-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/app/navigation.test.ts` | 应用注册、菜单、hash、顺序、顶栏直显、隐藏页高亮 |
| `src/app/navigation.ts` | `applications`、`applicationMenus.incentive`、`extraPages`、`siderSelectedKey` |
| `src/app/App.tsx` | 占位页 `findMenuTrail` 改用 `siderSelectedKey(page)` |

不改：`.b2b/b2b-standards.json`、`features/`、C 端。

---

### Task 1: 失败测试

**Files:**
- Modify: `src/app/navigation.test.ts`

- [ ] **Step 1: Write the failing test**

`getApplication` / `applicationMenus` / `applications` / `parseLocationHash` / `getDirectApplications` / `visibleApplications` / `siderSelectedKey` already imported at top of `src/app/navigation.test.ts`. Do not add new imports.

Append this describe after the existing `learning-plan application` block (before `experience application after interest-groups split`):

```ts
describe('incentive application', () => {
  it('registers 即时激励 under 员工与组织 with incentive-list as default', () => {
    expect(getApplication('incentive')).toEqual({
      key: 'incentive',
      label: '即时激励',
      category: '员工与组织',
      icon: 'rocket',
      defaultPage: 'incentive-list',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('incentive')).toBe(keys.indexOf('learning-plan') + 1);
    expect(keys.indexOf('incentive')).toBe(keys.indexOf('care') - 1);
  });

  it('uses a single first-level menu for 激励管理', () => {
    expect(applicationMenus.incentive).toEqual([
      { key: 'incentive-list', icon: 'rocket', label: '激励管理' },
    ]);
  });

  it('parses leaf hash and falls back to 激励管理', () => {
    expect(parseLocationHash('#/incentive/incentive-list')).toEqual({
      application: 'incentive',
      page: 'incentive-list',
    });
    expect(parseLocationHash('#/incentive')).toEqual({
      application: 'incentive',
      page: 'incentive-list',
    });
    expect(parseLocationHash('#/incentive/not-a-page')).toEqual({
      application: 'incentive',
      page: 'incentive-list',
    });
  });

  it('parses create, edit and detail hashes and keeps 激励管理 selected', () => {
    expect(parseLocationHash('#/incentive/incentive-create')).toEqual({
      application: 'incentive',
      page: 'incentive-create',
    });
    expect(parseLocationHash('#/incentive/incentive-edit/2')).toEqual({
      application: 'incentive',
      page: 'incentive-edit',
      recordId: '2',
    });
    expect(parseLocationHash('#/incentive/incentive-detail/2')).toEqual({
      application: 'incentive',
      page: 'incentive-detail',
      recordId: '2',
    });
    expect(siderSelectedKey('incentive-create')).toBe('incentive-list');
    expect(siderSelectedKey('incentive-edit')).toBe('incentive-list');
    expect(siderSelectedKey('incentive-detail')).toBe('incentive-list');
  });

  it('shows 即时激励 in 全部应用 switcher but not in top-bar direct apps', () => {
    expect(visibleApplications().map((item) => item.label)).toContain('即时激励');
    expect(getDirectApplications(4).map((item) => item.key)).not.toContain('incentive');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: FAIL. `getApplication('incentive')` is `undefined`. Do not implement yet.

---

### Task 2: 导航元数据与隐藏页

**Files:**
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: Insert the application after `learning-plan`, before `care`**

In `src/app/navigation.ts`, `applications` currently has:

```ts
  { key: 'learning-plan', label: '学习计划', category: '员工与组织', icon: 'read', defaultPage: 'learning-plan-list' },
  { key: 'care', label: '人文关怀', category: '员工与组织', icon: 'gift', defaultPage: 'care-plans', hiddenFromSwitcher: true },
```

Change to:

```ts
  { key: 'learning-plan', label: '学习计划', category: '员工与组织', icon: 'read', defaultPage: 'learning-plan-list' },
  { key: 'incentive', label: '即时激励', category: '员工与组织', icon: 'rocket', defaultPage: 'incentive-list' },
  { key: 'care', label: '人文关怀', category: '员工与组织', icon: 'gift', defaultPage: 'care-plans', hiddenFromSwitcher: true },
```

- [ ] **Step 2: Add menus after `learning-plan` menus**

`applicationMenus` currently has:

```ts
  'learning-plan': [
    { key: 'learning-plan-list', icon: 'unorderedList', label: '计划管理' },
  ],
  care: [
```

Change to:

```ts
  'learning-plan': [
    { key: 'learning-plan-list', icon: 'unorderedList', label: '计划管理' },
  ],
  incentive: [
    { key: 'incentive-list', icon: 'rocket', label: '激励管理' },
  ],
  care: [
```

- [ ] **Step 3: Register hidden pages in `extraPages`**

In the `extraPages` array in `parseLocationHash`, after `'learning-plan-preview'`, add:

```ts
    'incentive-create',
    'incentive-edit',
    'incentive-detail',
```

- [ ] **Step 4: Map hidden pages in `siderSelectedKey`**

In `siderSelectedKey`, after the `learning-plan-create` / `learning-plan-edit` / `learning-plan-preview` block, add:

```ts
  if (page === 'incentive-create' || page === 'incentive-edit' || page === 'incentive-detail') {
    return 'incentive-list';
  }
```

- [ ] **Step 5: Run tests and confirm they pass**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: PASS. All `incentive application` cases green. Existing learning-plan / care tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/navigation.ts src/app/navigation.test.ts
git commit -m "$(cat <<'EOF'
feat: add 即时激励 app to 全部应用 switcher

Hang a placeholder admin app under 员工与组织 so operators can switch into 激励管理 without a feature module yet.
EOF
)"
```

Skip this step if the user has not asked to commit.

---

### Task 3: 占位页面包屑跟侧栏

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Resolve trail via `siderSelectedKey`**

`siderSelectedKey` is already imported in `src/app/App.tsx`.

In `AdminApp`, change:

```ts
  const trail = findMenuTrail(sideNodes, page);
```

to:

```ts
  const trail = findMenuTrail(sideNodes, siderSelectedKey(page));
```

Effect: `#/incentive/incentive-create` (and other hidden pages that fall through to `PlaceholderPage`) get breadcrumb `即时激励 > 激励管理` and title `激励管理`. Business pages keep their own headers; they do not use `breadcrumbItems`.

- [ ] **Step 2: Run navigation tests again**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: PASS. This file does not assert `App.tsx` trail; rerun to catch accidental import breakage.

- [ ] **Step 3: Manual check**

Run `npm run dev`. Open 全部应用 → 员工与组织 → 即时激励. Confirm:

- rocket 图标 + 名称「即时激励」
- 不在顶栏直显四应用里
- 左侧仅「激励管理」
- 默认 `#/incentive/incentive-list`，占位文案含「即时激励」
- 手动改 hash 为 `#/incentive/incentive-create`：侧栏仍高亮激励管理，面包屑为 即时激励 > 激励管理

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "$(cat <<'EOF'
fix: map placeholder breadcrumb to sider selected menu

Hidden create/edit/detail hashes should show the parent leaf label instead of only the application name.
EOF
)"
```

Skip this step if the user has not asked to commit.

---

## Spec coverage

| Spec | Task |
|---|---|
| 独立应用 `incentive` / 即时激励 / 员工与组织 / `rocket` | Task 2 Step 1 |
| 插在学习计划后、人文关怀前 | Task 1 + Task 2 Step 1 |
| 不进顶栏直显 | Task 1 last it |
| 一级激励管理 `incentive-list` | Task 2 Step 2 |
| PlaceholderPage、不建 feature | File map（不新增目录） |
| extraPages create/edit/detail | Task 2 Step 3 |
| siderSelectedKey → incentive-list | Task 2 Step 4 |
| 隐藏页面包屑激励管理 | Task 3 |
| 测试清单 | Task 1 |
| 不做 CRUD/C 端/权限/装修 | 无对应实现任务 |
