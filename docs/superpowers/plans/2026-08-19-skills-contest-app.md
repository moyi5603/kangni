# 技能大赛应用入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在管理端「全部应用」挂独立应用「技能大赛」，左侧三个一级占位菜单，不建业务模块。

**Architecture:** 只改导航元数据。`applications` 增加 `skills-contest`（员工与组织，插在培训课程后），`applicationMenus` 三个一级叶子。`NavIcon` 增加 `trophy`，`App.tsx` 映射 `TrophyOutlined`。页面继续走现有 `PlaceholderPage`。不改 `applicationDirectVisibleMax`。

**Tech Stack:** TypeScript、现有 hash 路由、Vitest、Ant Design Icons。

---

## File map

- Modify: `src/app/navigation.ts` — `NavIcon`、`applications`、`applicationMenus`
- Modify: `src/app/App.tsx` — `trophy` → `TrophyOutlined`
- Modify: `src/app/navigation.test.ts` — 技能大赛元数据与 hash 测试

目录不是 Git 仓库；执行时不提交。

Spec：`docs/superpowers/specs/2026-08-19-skills-contest-app-design.md`

### Task 1: 技能大赛导航测试（先失败）

**Files:**
- Modify: `src/app/navigation.test.ts`

- [ ] **Step 1: 写失败测试**

在 `src/app/navigation.test.ts` 顶部把 import 改成：

```ts
import { describe, expect, it } from 'vitest';
import {
  applicationMenus,
  getApplication,
  getDirectApplications,
  parseCEndHash,
  parseLocationHash,
  toH5MySignupsHash,
  toPcMySignupsHash,
} from './navigation';
```

在文件末尾追加：

```ts
describe('skills-contest application', () => {
  it('registers the app under 员工与组织 with contest-list as default', () => {
    expect(getApplication('skills-contest')).toEqual({
      key: 'skills-contest',
      label: '技能大赛',
      category: '员工与组织',
      icon: 'trophy',
      defaultPage: 'contest-list',
    });
  });

  it('uses three first-level menus with no children', () => {
    expect(applicationMenus['skills-contest']).toEqual([
      { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
      { key: 'signup-list', icon: 'unorderedList', label: '报名' },
      { key: 'score-list', icon: 'checkCircle', label: '成绩' },
    ]);
  });

  it('parses a leaf hash', () => {
    expect(parseLocationHash('#/skills-contest/signup-list')).toEqual({
      application: 'skills-contest',
      page: 'signup-list',
    });
  });

  it('falls back to contest-list when page is missing or unknown', () => {
    expect(parseLocationHash('#/skills-contest')).toEqual({
      application: 'skills-contest',
      page: 'contest-list',
    });
    expect(parseLocationHash('#/skills-contest/not-a-page')).toEqual({
      application: 'skills-contest',
      page: 'contest-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('skills-contest');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: FAIL。`getApplication('skills-contest')` 为 `undefined`，`applicationMenus['skills-contest']` 为 `undefined`。C-end 原有用例仍应 PASS。

### Task 2: 注册应用与菜单

**Files:**
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: 扩展 `NavIcon`**

在 `NavIcon` union 中按字母序加入 `'trophy'`（放在 `'team'` 与 `'unorderedList'` 之间）：

```ts
  | 'team'
  | 'trophy'
  | 'unorderedList'
  | 'user';
```

- [ ] **Step 2: 追加应用元数据**

在 `applications` 里，`training` 那条之后、`care` 之前插入：

```ts
  { key: 'training', label: '培训课程', category: '员工与组织', icon: 'book', defaultPage: 'training-courses' },
  { key: 'skills-contest', label: '技能大赛', category: '员工与组织', icon: 'trophy', defaultPage: 'contest-list' },
  { key: 'care', label: '人文关怀', category: '员工与组织', icon: 'gift', defaultPage: 'care-plans' },
```

- [ ] **Step 3: 追加左侧菜单**

在 `applicationMenus` 里，`training` 块之后、`care` 块之前插入：

```ts
  'skills-contest': [
    { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
    { key: 'signup-list', icon: 'unorderedList', label: '报名' },
    { key: 'score-list', icon: 'checkCircle', label: '成绩' },
  ],
```

不要新建 `src/features/skills-contest`。不要改 `parseLocationHash`。不要改 `.b2b/b2b-standards.json`。

- [ ] **Step 4: 跑导航测试**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: 全部 PASS。此时 `App.tsx` 的 `Record<NavIcon, ReactNode>` 会缺 `trophy`，`npx tsc -b` 会失败，下一任务补。

### Task 3: 奖杯图标映射

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 导入并映射 `TrophyOutlined`**

在 `@ant-design/icons` 的 import 列表中，`TeamOutlined` 后加入 `TrophyOutlined`：

```ts
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  UserOutlined,
```

在 `navIcons` 中，`team` 与 `unorderedList` 之间加入：

```ts
  team: <TeamOutlined />,
  trophy: <TrophyOutlined />,
  unorderedList: <UnorderedListOutlined />,
```

不改页面分支；`skills-contest` 的三个叶子会自动落到现有 `PlaceholderPage`。

- [ ] **Step 2: 类型检查与规范校验**

Run:

```bash
npx tsc -b --pretty false
npm test -- src/app/navigation.test.ts
npm run check:standards
```

Expected: TypeScript 无错误；导航测试 PASS；`check:standards` 通过（本轮不改页面结构，不应新增 UI 规范违规）。

- [ ] **Step 3: 手工验收（执行者本地打开 `npm run dev`）**

1. 点「全部应用」，「员工与组织」出现「技能大赛」，奖杯图标。
2. 点进去：左侧「赛事管理 / 报名 / 成绩」，默认赛事管理，右侧占位「当前应用「技能大赛」」。
3. 切报名、成绩：面包屑与标题跟着变。
4. 顶栏仍是工作台、组织管理、商品管理、订单管理。
5. 浏览器打开 `#/skills-contest/score-list` 停在成绩。
