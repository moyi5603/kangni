# 兴趣小组 / 评优应用入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** B 端增加与「员工体验」同级的「兴趣小组」「评优」两个应用，各一个占位菜单页，并删掉员工体验里旧的兴趣小组菜单。

**Architecture:** 只改 `applications` / `applicationMenus`。未接业务页已由 `App.tsx` 落到 `PlaceholderPage`。不新建 feature 目录。

**Tech Stack:** TypeScript、Vitest、现有 hash 路由。

---

## File map

- Modify: `src/app/navigation.test.ts` — 新应用与旧菜单回归
- Modify: `src/app/navigation.ts` — 应用元数据、菜单、删除社群运营

### Task 1: 导航测试与元数据

**Files:**
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: Write the failing tests**

在 `src/app/navigation.test.ts` 文件末尾追加：

```ts
describe('interest-groups application', () => {
  it('registers the app under 员工与组织 after 员工体验', () => {
    expect(getApplication('interest-groups')).toEqual({
      key: 'interest-groups',
      label: '兴趣小组',
      category: '员工与组织',
      icon: 'team',
      defaultPage: 'interest-group-list',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('interest-groups')).toBe(keys.indexOf('experience') + 1);
    expect(keys.indexOf('interest-groups')).toBe(keys.indexOf('awards') - 1);
  });

  it('uses one first-level 小组管理 menu', () => {
    expect(applicationMenus['interest-groups']).toEqual([
      { key: 'interest-group-list', icon: 'team', label: '小组管理' },
    ]);
  });

  it('parses the leaf hash and falls back to 小组管理', () => {
    expect(parseLocationHash('#/interest-groups/interest-group-list')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-list',
    });
    expect(parseLocationHash('#/interest-groups')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-list',
    });
    expect(parseLocationHash('#/interest-groups/not-a-page')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('interest-groups');
  });
});

describe('awards application', () => {
  it('registers the app under 员工与组织 after 兴趣小组', () => {
    expect(getApplication('awards')).toEqual({
      key: 'awards',
      label: '评优',
      category: '员工与组织',
      icon: 'trophy',
      defaultPage: 'award-list',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('interest-groups') + 1);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('training') - 1);
  });

  it('uses one first-level 评优管理 menu', () => {
    expect(applicationMenus.awards).toEqual([
      { key: 'award-list', icon: 'trophy', label: '评优管理' },
    ]);
  });

  it('parses the leaf hash and falls back to 评优管理', () => {
    expect(parseLocationHash('#/awards/award-list')).toEqual({
      application: 'awards',
      page: 'award-list',
    });
    expect(parseLocationHash('#/awards')).toEqual({
      application: 'awards',
      page: 'award-list',
    });
    expect(parseLocationHash('#/awards/not-a-page')).toEqual({
      application: 'awards',
      page: 'award-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).not.toContain('awards');
  });
});

describe('experience application after interest-groups split', () => {
  it('drops 社群运营 / 兴趣小组 from experience menus', () => {
    const keys = applicationMenus.experience.flatMap((node) => [
      node.key,
      ...(node.children ?? []).map((child) => child.key),
    ]);
    expect(keys).not.toContain('experience-groups');
    expect(keys).not.toContain('experience-interest-groups');
  });

  it('falls back legacy interest-group hash to 文章管理', () => {
    expect(parseLocationHash('#/experience/experience-interest-groups')).toEqual({
      application: 'experience',
      page: 'experience-articles',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: FAIL — `getApplication('interest-groups')` / `getApplication('awards')` 为 `undefined`。

- [ ] **Step 3: Write minimal navigation metadata**

在 `src/app/navigation.ts` 的 `applications` 里，把两项插在 `experience` 与 `training` 之间：

```ts
  { key: 'experience', label: '员工体验', category: '员工与组织', icon: 'heart', defaultPage: 'experience-articles' },
  { key: 'interest-groups', label: '兴趣小组', category: '员工与组织', icon: 'team', defaultPage: 'interest-group-list' },
  { key: 'awards', label: '评优', category: '员工与组织', icon: 'trophy', defaultPage: 'award-list' },
  { key: 'training', label: '课程', category: '员工与组织', icon: 'book', defaultPage: 'training-courses' },
```

删掉 `experience` 菜单里整组「社群运营」：

```ts
    {
      key: 'experience-groups',
      icon: 'team',
      label: '社群运营',
      children: [{ key: 'experience-interest-groups', icon: 'team', label: '兴趣小组' }],
    },
```

在 `applicationMenus` 增加：

```ts
  'interest-groups': [
    { key: 'interest-group-list', icon: 'team', label: '小组管理' },
  ],
  awards: [
    { key: 'award-list', icon: 'trophy', label: '评优管理' },
  ],
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit only when the user asks**

不自动提交。文档已写在 `docs/superpowers/specs/2026-08-23-interest-groups-awards-apps-design.md`。
