# 考试管理（对齐课程） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把考试应用「考试管理」做成与课程管理同构的列表壳（左分类树 + 查询/表格/批量 + 详情弹窗）及新建/编辑独立页。

**Architecture:** 先把 `categoryTree` + `CategoryTreePanel` 抽到 `src/shared/category-tree/`，课程改 import。新建 `features/exams`（`exam.ts` / `examStore.ts` / `ExamListPage` / `ExamFormPage`）。导航去掉 `exam-categories`，默认页改 `exam-list`，挂 `exam-create` / `exam-edit`。

**Tech Stack:** React 19、antd 6、Vitest、现有 `ListPage` 共享组件、hash 路由。仓库无 git：跳过所有 commit 步骤。

**Spec:** `docs/superpowers/specs/2026-08-20-exam-management-design.md`

---

## File map

| Path | Action |
|---|---|
| `src/shared/category-tree/categoryTree.ts` | Create（从 training 迁） |
| `src/shared/category-tree/CategoryTreePanel.tsx` | Create（从 training 迁） |
| `src/shared/category-tree/categoryTree.test.ts` | Create（迁并改 import） |
| `src/features/training/model/categoryTree.ts` | Delete（改 re-export 或删除后改引用） |
| `src/features/training/components/CategoryTreePanel.tsx` | Delete |
| `src/features/training/pages/*.tsx` 等 | 改 shared import |
| `src/features/exams/model/exam.ts` | Create |
| `src/features/exams/model/examStore.ts` | Create |
| `src/features/exams/model/examStore.test.ts` | Create |
| `src/features/exams/pages/ExamListPage.tsx` | Create |
| `src/features/exams/pages/ExamFormPage.tsx` | Create |
| `src/app/navigation.ts` | 菜单 / default / extraPages / siderSelectedKey |
| `src/app/navigation.test.ts` | 更新 exam describe |
| `src/app/App.tsx` | 挂载列表与表单 |

---

### Task 1: 抽出 shared 分类树

**Files:**
- Create: `src/shared/category-tree/categoryTree.ts`
- Create: `src/shared/category-tree/CategoryTreePanel.tsx`
- Create: `src/shared/category-tree/categoryTree.test.ts`
- Delete: `src/features/training/model/categoryTree.ts`
- Delete: `src/features/training/model/categoryTree.test.ts`
- Delete: `src/features/training/components/CategoryTreePanel.tsx`
- Modify: training 内所有引用

- [ ] **Step 1: 复制文件到 shared**

```bash
mkdir -p src/shared/category-tree
cp src/features/training/model/categoryTree.ts src/shared/category-tree/categoryTree.ts
cp src/features/training/components/CategoryTreePanel.tsx src/shared/category-tree/CategoryTreePanel.tsx
```

在 `CategoryTreePanel.tsx` 顶部队 import 改为：

```ts
import { collectCategoryIds, filterCategoryTree, type CategoryNode } from './categoryTree';
```

（原路径是 `../model/categoryTree`。）

- [ ] **Step 2: 写 shared 测试并删旧测试**

Create `src/shared/category-tree/categoryTree.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  collectCategoryIds,
  filterCategoryTree,
  findCategoryNode,
  subtreeIdsOf,
  type CategoryNode,
} from './categoryTree';

const tree: CategoryNode[] = [
  { id: 10, name: '根A' },
  {
    id: 20,
    name: '根B',
    children: [
      { id: 21, name: '子1', children: [{ id: 211, name: '精通' }, { id: 212, name: '入门' }] },
      { id: 22, name: '子2' },
    ],
  },
];

describe('categoryTree helpers', () => {
  it('finds nested nodes and collects subtree ids', () => {
    const child = findCategoryNode(tree, 21);
    expect(child?.name).toBe('子1');
    expect(collectCategoryIds([child!])).toEqual([21, 211, 212]);
    expect(subtreeIdsOf(tree, 21)).toEqual([21, 211, 212]);
    expect(subtreeIdsOf(tree, 10)).toEqual([10]);
  });

  it('filters tree by keyword and keeps ancestors of matches', () => {
    const filtered = filterCategoryTree(tree, '精通');
    expect(filtered.map((node) => node.name)).toEqual(['根B']);
    expect(filtered[0]?.children?.map((node) => node.name)).toEqual(['子1']);
    expect(filterCategoryTree(tree, '不存在').length).toBe(0);
  });
});
```

Delete `src/features/training/model/categoryTree.test.ts`.

- [ ] **Step 3: 改 training 引用并删旧文件**

在下列文件把 `../model/categoryTree` / `../components/CategoryTreePanel` 换成 shared：

- `src/features/training/pages/CourseListPage.tsx`
- `src/features/training/pages/CourseFormPage.tsx`
- `src/features/training/pages/CoursewareListPage.tsx`
- `src/features/training/components/CoursewareFormDrawer.tsx`
- `src/features/training/model/trainingStore.ts`
- `src/features/training/model/training.ts`（若 import `CategoryNode`）

示例：

```ts
import { collectCategoryIds, findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';
```

`trainingStore.ts`（相对 path 两级）：

```ts
import {
  collectCategoryIds,
  findCategoryNode,
  findCategorySiblingContext,
  insertCategory,
  isSiblingNameTaken,
  removeCategoryFromTree,
  renameCategoryInTree,
  updateCategoryChildren,
} from '../../../shared/category-tree/categoryTree';
```

`training.ts` 若有 `import type { CategoryNode } from './categoryTree'`，改为：

```ts
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
```

然后删除：

```bash
rm src/features/training/model/categoryTree.ts
cp src/features/training/components/CategoryTreePanel.tsx /dev/null 2>/dev/null; rm -f src/features/training/components/CategoryTreePanel.tsx
```

（直接 `rm` 上述两个源文件。）

可选：在旧路径留一层 re-export 以便过渡——本计划选择硬切，不留 re-export。

- [ ] **Step 4: 跑测试**

Run: `npm test -- src/shared/category-tree/categoryTree.test.ts src/features/training`

Expected: PASS（training 相关 + shared 树测试）。若有失败因漏改 import，按报错补全。

- [ ] **Step 5: Commit** — 跳过（无 git）

---

### Task 2: 导航改默认页并去掉分类管理（TDD）

**Files:**
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: 改失败测试**

把 `describe('exam application')` 改成：

```ts
describe('exam application', () => {
  it('registers the app under 员工与组织 with exam-list as default', () => {
    expect(getApplication('exam')).toEqual({
      key: 'exam',
      label: '考试',
      category: '员工与组织',
      icon: 'fileText',
      defaultPage: 'exam-list',
    });
  });

  it('sits immediately before 人文关怀', () => {
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('exam')).toBe(keys.indexOf('care') - 1);
    expect(keys.indexOf('exam')).toBe(keys.indexOf('skills-contest') + 1);
    expect(keys.indexOf('exam')).toBeGreaterThan(keys.indexOf('training'));
  });

  it('uses four first-level menus without exam-categories', () => {
    expect(applicationMenus['exam']).toEqual([
      { key: 'exam-overview', icon: 'dashboard', label: '概览' },
      { key: 'exam-list', icon: 'unorderedList', label: '考试管理' },
      { key: 'exam-tags', icon: 'tags', label: '考试标签' },
      { key: 'exam-rules', icon: 'fileText', label: '规则设置' },
    ]);
  });

  it('parses a leaf hash', () => {
    expect(parseLocationHash('#/exam/exam-list')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
  });

  it('parses exam-create and exam-edit hashes', () => {
    expect(parseLocationHash('#/exam/exam-create')).toEqual({
      application: 'exam',
      page: 'exam-create',
    });
    expect(parseLocationHash('#/exam/exam-edit/3')).toEqual({
      application: 'exam',
      page: 'exam-edit',
      recordId: '3',
    });
  });

  it('falls back to exam-list when page is missing, unknown, or legacy categories', () => {
    expect(parseLocationHash('#/exam')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
    expect(parseLocationHash('#/exam/not-a-page')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
    expect(parseLocationHash('#/exam/exam-categories')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('exam');
  });
});
```

确保文件顶部仍 import `applications`（若已有则不动）。

- [ ] **Step 2: Run 确认 RED**

Run: `npm test -- src/app/navigation.test.ts`

Expected: FAIL（default 仍是 `exam-overview`，菜单仍含 `exam-categories`）。

- [ ] **Step 3: 改 navigation.ts**

1. `applications` 中 exam 行：

```ts
{ key: 'exam', label: '考试', category: '员工与组织', icon: 'fileText', defaultPage: 'exam-list' },
```

2. `applicationMenus.exam`：

```ts
exam: [
  { key: 'exam-overview', icon: 'dashboard', label: '概览' },
  { key: 'exam-list', icon: 'unorderedList', label: '考试管理' },
  { key: 'exam-tags', icon: 'tags', label: '考试标签' },
  { key: 'exam-rules', icon: 'fileText', label: '规则设置' },
],
```

3. `extraPages` 增加 `'exam-create', 'exam-edit'`。

4. `siderSelectedKey` 增加：

```ts
if (page === 'exam-create' || page === 'exam-edit') {
  return 'exam-list';
}
```

- [ ] **Step 4: Run 确认 GREEN**

Run: `npm test -- src/app/navigation.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit** — 跳过

---

### Task 3: exam 领域模型 + store（TDD）

**Files:**
- Create: `src/features/exams/model/exam.ts`
- Create: `src/features/exams/model/examStore.ts`
- Create: `src/features/exams/model/examStore.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/features/exams/model/examStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { canDeleteExam, type ExamRecord } from './exam';
import {
  __resetExamStoreForTests,
  addExamCategoryNode,
  getExam,
  getExamCategoryUsage,
  removeExam,
  removeExamCategoryNode,
  setExamPublishStatus,
  setExamCategory,
  upsertExam,
  useExams,
} from './examStore';

describe('canDeleteExam', () => {
  it('allows delete only when unpublished', () => {
    expect(canDeleteExam({ publishStatus: '未发布' } as ExamRecord)).toBe(true);
    expect(canDeleteExam({ publishStatus: '已发布' } as ExamRecord)).toBe(false);
  });
});

describe('examStore', () => {
  beforeEach(() => {
    __resetExamStoreForTests();
  });

  it('filters nothing here but publishes and unpublishes', () => {
    const first = getExam(1);
    expect(first).toBeTruthy();
    setExamPublishStatus([1], '已发布');
    expect(getExam(1)?.publishStatus).toBe('已发布');
    setExamPublishStatus([1], '未发布');
    expect(getExam(1)?.publishStatus).toBe('未发布');
  });

  it('blocks delete when published', () => {
    setExamPublishStatus([1], '已发布');
    expect(removeExam(1)).toBe(false);
    setExamPublishStatus([1], '未发布');
    expect(removeExam(1)).toBe(true);
    expect(getExam(1)).toBeUndefined();
  });

  it('sets category on selected exams', () => {
    setExamCategory([1], 10);
    expect(getExam(1)?.categoryId).toBe(10);
  });

  it('blocks category delete when exams use subtree', () => {
    setExamCategory([1], 10);
    expect(getExamCategoryUsage(10).canDelete).toBe(false);
    expect(removeExamCategoryNode(10)).toBe(false);
    setExamCategory([1], null);
    expect(getExamCategoryUsage(10).canDelete).toBe(true);
  });

  it('upserts exam and adds category node', () => {
    const node = addExamCategoryNode('新分类', null);
    upsertExam({
      id: 99,
      name: '单元测考试',
      categoryId: node.id,
      startAt: '2026-08-20 00:00:00',
      endAt: '2026-08-21 00:00:00',
      durationMinutes: 60,
      passScore: 60,
      points: 10,
      publishStatus: '未发布',
      examStatus: '未开始',
      creator: '测试',
      createdAt: '2026-08-20 00:00:00',
      updatedAt: '2026-08-20 00:00:00',
    });
    expect(getExam(99)?.name).toBe('单元测考试');
  });
});
```

（若 `useExams` 未在测试使用可从不 import；上面可删 `useExams` import。）

- [ ] **Step 2: Run RED**

Run: `npm test -- src/features/exams/model/examStore.test.ts`

Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 exam.ts**

Create `src/features/exams/model/exam.ts`:

```ts
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';

export const EXAM_MOCK_VERSION = 1;

export const examPublishStatuses = ['未发布', '已发布'] as const;
export type ExamPublishStatus = (typeof examPublishStatuses)[number];

export const examStatuses = ['未开始', '进行中', '已结束'] as const;
export type ExamStatus = (typeof examStatuses)[number];

export type ExamCategoryNode = CategoryNode;

export type ExamRecord = {
  id: number;
  name: string;
  categoryId: number | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  passScore: number;
  points: number;
  publishStatus: ExamPublishStatus;
  examStatus: ExamStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

export function canDeleteExam(record: ExamRecord): boolean {
  return record.publishStatus === '未发布';
}

export const initialExamCategoryTree: ExamCategoryNode[] = [
  { id: 10, name: 'php 考试' },
  {
    id: 20,
    name: 'java 考试',
    children: [{ id: 21, name: 'JAVA1' }],
  },
  {
    id: 30,
    name: '测试考试0708',
    children: [{ id: 31, name: 'AAA' }],
  },
  { id: 40, name: '20260808' },
];

export const initialExams: ExamRecord[] = [
  {
    id: 1,
    name: '20260808',
    categoryId: 40,
    startAt: '2026-08-08 00:00:00',
    endAt: '2026-08-31 00:00:00',
    durationMinutes: 100,
    passScore: 60,
    points: 0,
    publishStatus: '已发布',
    examStatus: '进行中',
    creator: '产品管理员',
    createdAt: '2026-08-08 10:00:00',
    updatedAt: '2026-08-08 10:00:00',
  },
  {
    id: 2,
    name: '测试考试',
    categoryId: 30,
    startAt: '2026-07-08 00:00:00',
    endAt: '2026-07-31 00:00:00',
    durationMinutes: 2,
    passScore: 1,
    points: 0,
    publishStatus: '已发布',
    examStatus: '已结束',
    creator: '产品管理员',
    createdAt: '2026-07-08 10:00:00',
    updatedAt: '2026-07-08 10:00:00',
  },
  {
    id: 3,
    name: '入职测评',
    categoryId: 21,
    startAt: '2026-07-01 09:00:00',
    endAt: '2026-12-31 18:00:00',
    durationMinutes: 90,
    passScore: 60,
    points: 10,
    publishStatus: '未发布',
    examStatus: '未开始',
    creator: '产品管理员',
    createdAt: '2026-07-01 09:00:00',
    updatedAt: '2026-07-01 09:00:00',
  },
  {
    id: 4,
    name: '考生请注意，禁止不带手机',
    categoryId: 10,
    startAt: '2026-06-01 00:00:00',
    endAt: '2026-06-30 23:59:59',
    durationMinutes: 30,
    passScore: 80,
    points: 5,
    publishStatus: '未发布',
    examStatus: '未开始',
    creator: '产品管理员',
    createdAt: '2026-06-01 10:00:00',
    updatedAt: '2026-06-01 10:00:00',
  },
];
```

- [ ] **Step 4: 实现 examStore.ts**

Create `src/features/exams/model/examStore.ts`，模式对齐 `trainingStore`（listeners + emit + useSync 钩子）：

```ts
import { useEffect, useState } from 'react';
import {
  EXAM_MOCK_VERSION,
  canDeleteExam,
  initialExamCategoryTree,
  initialExams,
  type ExamCategoryNode,
  type ExamPublishStatus,
  type ExamRecord,
} from './exam';
import {
  collectCategoryIds,
  findCategoryNode,
  findCategorySiblingContext,
  insertCategory,
  isSiblingNameTaken,
  removeCategoryFromTree,
  renameCategoryInTree,
  updateCategoryChildren,
} from '../../../shared/category-tree/categoryTree';

let mockVersion = EXAM_MOCK_VERSION;
let exams = [...initialExams];
let examCategoryTree: ExamCategoryNode[] = [...initialExamCategoryTree];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function __resetExamStoreForTests() {
  mockVersion = EXAM_MOCK_VERSION;
  exams = [...initialExams];
  examCategoryTree = [...initialExamCategoryTree];
  emit();
}

export function useExams() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return exams;
}

export function useExamCategoryTree() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return examCategoryTree;
}

export function getExam(id: number) {
  return exams.find((item) => item.id === id);
}

export function upsertExam(record: ExamRecord) {
  const current = exams.find((item) => item.id === record.id);
  exams = current ? exams.map((item) => (item.id === record.id ? record : item)) : [record, ...exams];
  emit();
}

export function removeExam(id: number): boolean {
  const target = exams.find((item) => item.id === id);
  if (!target || !canDeleteExam(target)) return false;
  exams = exams.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setExamPublishStatus(ids: number[], publishStatus: ExamPublishStatus) {
  const idSet = new Set(ids);
  exams = exams.map((item) => (idSet.has(item.id) ? { ...item, publishStatus } : item));
  emit();
}

export function setExamCategory(ids: number[], categoryId: number | null) {
  const idSet = new Set(ids);
  exams = exams.map((item) => (idSet.has(item.id) ? { ...item, categoryId } : item));
  emit();
}

export function getExamCategoryUsage(categoryId: number): { examCount: number; canDelete: boolean } {
  const node = findCategoryNode(examCategoryTree, categoryId);
  if (!node) return { examCount: 0, canDelete: false };
  const idSet = new Set(collectCategoryIds([node]));
  const examCount = exams.filter((item) => item.categoryId != null && idSet.has(item.categoryId)).length;
  return { examCount, canDelete: examCount === 0 };
}

export function getExamCategoryParentId(id: number): number | null {
  return findCategorySiblingContext(examCategoryTree, id)?.parentId ?? null;
}

export function getExamCategorySiblingIndex(id: number): { index: number; total: number } | null {
  const ctx = findCategorySiblingContext(examCategoryTree, id);
  if (!ctx) return null;
  return { index: ctx.index, total: ctx.siblings.length };
}

export function isExamCategoryNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  return isSiblingNameTaken(examCategoryTree, name, parentId, excludeId);
}

export function addExamCategoryNode(name: string, parentId: number | null = null): ExamCategoryNode {
  const node: ExamCategoryNode = { id: Date.now(), name };
  if (parentId == null) examCategoryTree = [...examCategoryTree, node];
  else examCategoryTree = insertCategory(examCategoryTree, parentId, node);
  emit();
  return node;
}

export function renameExamCategory(id: number, name: string): boolean {
  if (!findCategoryNode(examCategoryTree, id)) return false;
  examCategoryTree = renameCategoryInTree(examCategoryTree, id, name);
  emit();
  return true;
}

export function moveExamCategory(id: number, direction: 'up' | 'down'): boolean {
  const ctx = findCategorySiblingContext(examCategoryTree, id);
  if (!ctx) return false;
  const targetIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1;
  if (targetIndex < 0 || targetIndex >= ctx.siblings.length) return false;
  const reorder = (list: ExamCategoryNode[]) => {
    const next = [...list];
    [next[ctx.index], next[targetIndex]] = [next[targetIndex], next[ctx.index]];
    return next;
  };
  if (ctx.parentId == null) examCategoryTree = reorder(examCategoryTree);
  else examCategoryTree = updateCategoryChildren(examCategoryTree, ctx.parentId, reorder);
  emit();
  return true;
}

export function removeExamCategoryNode(id: number): boolean {
  if (!findCategoryNode(examCategoryTree, id)) return false;
  if (!getExamCategoryUsage(id).canDelete) return false;
  examCategoryTree = removeCategoryFromTree(examCategoryTree, id);
  emit();
  return true;
}
```

可按需加 `import.meta.hot` HMR（参考 trainingStore）；非必须。

- [ ] **Step 5: Run GREEN**

Run: `npm test -- src/features/exams/model/examStore.test.ts`

Expected: PASS。

- [ ] **Step 6: Commit** — 跳过

---

### Task 4: ExamListPage

**Files:**
- Create: `src/features/exams/pages/ExamListPage.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 实现列表页**

以 `CourseListPage.tsx` 为骨架复制结构，删掉类型 Tab、封面、评论相关；换成考试字段。关键差异：

```ts
type ExamQuery = {
  name: string;
  examStatus?: ExamStatus;
  publishStatus?: ExamPublishStatus;
};

const emptyQuery: ExamQuery = { name: '' };

export function ExamListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  // hooks: useExams, useExamCategoryTree
  // SearchPanel: 考试名称 / 考试状态 / 发布状态
  // CategoryTreePanel createLabel="新增考试分类"
  // ListTableCard: 无 tabs；toolbar 新增考试 → onNavigate('exam-create')
  // batch: 批量发布 / 批量下架 / 设置分类 / 取消选择
  // columns: 名称 link→详情, startAt, endAt, durationMinutes, passScore, points, publishStatus Tag, examStatus Tag, 操作
}
```

批量发布逻辑：

```ts
const targets = selectedRows.filter((item) => item.publishStatus !== '已发布');
// confirm → setExamPublishStatus(targets.map(i => i.id), '已发布')
```

批量下架：仅 `已发布` → `未发布`。

行操作：详情 Modal（Descriptions）；编辑 `onNavigate('exam-edit', String(id))`；发布/下架；更多里设分类、删除（`canDeleteExam`）。

分类 CRUD Modal 文案与课程相同，调用 `addExamCategoryNode` 等。

`ListPageHeading`：

```tsx
<ListPageHeading
  paths={['考试', '考试管理']}
  title="考试管理"
  subtitle="维护考试场次与发布状态，按分类筛选和管理。"
/>
```

空态：`hasActiveQuery ? '没有符合条件的考试' : b2bStandards.table.emptyText`。

- [ ] **Step 2: 挂到 App.tsx**

Import：

```ts
import { ExamListPage } from '../features/exams/pages/ExamListPage';
```

在 Content 分支、`PlaceholderPage` 之前加入：

```tsx
) : page === 'exam-list' ? (
  <ExamListPage onNavigate={goToPage} />
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`

Expected: exit 0。

- [ ] **Step 4: Commit** — 跳过

---

### Task 5: ExamFormPage + 路由接线

**Files:**
- Create: `src/features/exams/pages/ExamFormPage.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 实现表单页**

```tsx
import { useEffect } from 'react';
import { App, Breadcrumb, Button, DatePicker, Form, Input, InputNumber, Select, Space, TreeSelect } from 'antd';
import dayjs from 'dayjs';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  examPublishStatuses,
  examStatuses,
  type ExamPublishStatus,
  type ExamRecord,
  type ExamStatus,
} from '../model/exam';
import { getExam, upsertExam, useExamCategoryTree } from '../model/examStore';

type Props = { mode: 'create' | 'edit'; recordId?: string; onBack: () => void };

type FormValues = {
  name: string;
  categoryId?: number | null;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  durationMinutes: number;
  passScore: number;
  points: number;
  publishStatus: ExamPublishStatus;
  examStatus: ExamStatus;
};

function toTreeData(nodes: CategoryNode[]): { title: string; value: number; key: number; children?: ReturnType<typeof toTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children ? toTreeData(node.children) : undefined,
  }));
}

export function ExamFormPage({ mode, recordId, onBack }: Props) {
  const { message } = App.useApp();
  const tree = useExamCategoryTree();
  const [form] = Form.useForm<FormValues>();
  const editing = mode === 'edit' ? getExam(Number(recordId)) : undefined;

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.warning('考试不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  useEffect(() => {
    if (mode === 'create') {
      form.setFieldsValue({
        publishStatus: '未发布',
        examStatus: '未开始',
        points: 0,
        passScore: 60,
        durationMinutes: 60,
      });
      return;
    }
    if (!editing) return;
    form.setFieldsValue({
      name: editing.name,
      categoryId: editing.categoryId,
      range: [dayjs(editing.startAt), dayjs(editing.endAt)],
      durationMinutes: editing.durationMinutes,
      passScore: editing.passScore,
      points: editing.points,
      publishStatus: editing.publishStatus,
      examStatus: editing.examStatus,
    });
  }, [mode, editing, form]);

  const save = async () => {
    const values = await form.validateFields();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const record: ExamRecord = {
      id: mode === 'edit' && editing ? editing.id : Date.now(),
      name: values.name.trim(),
      categoryId: values.categoryId ?? null,
      startAt: values.range[0].format('YYYY-MM-DD HH:mm:ss'),
      endAt: values.range[1].format('YYYY-MM-DD HH:mm:ss'),
      durationMinutes: values.durationMinutes,
      passScore: values.passScore,
      points: values.points,
      publishStatus: values.publishStatus,
      examStatus: values.examStatus,
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    upsertExam(record);
    message.success(mode === 'edit' ? '已保存考试' : '已创建考试');
    onBack();
  };

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '考试' },
          { title: '考试管理' },
          { title: mode === 'edit' ? '编辑考试' : '新建考试' },
        ]}
      />
      <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
        <Form.Item name="name" label="考试名称" rules={[{ required: true, whitespace: true, message: '请输入考试名称' }, { max: 50, message: '不超过 50 个字' }]}>
          <Input maxLength={50} showCount placeholder="请输入考试名称" />
        </Form.Item>
        <Form.Item name="categoryId" label="分类">
          <TreeSelect allowClear treeData={toTreeData(tree)} placeholder="请选择分类" treeDefaultExpandAll />
        </Form.Item>
        <Form.Item
          name="range"
          label="开考～结束"
          rules={[
            { required: true, message: '请选择开考与结束时间' },
            {
              validator: async (_, value) => {
                if (!value?.[0] || !value?.[1]) return;
                if (!value[1].isAfter(value[0])) throw new Error('结束时间必须晚于开考时间');
              },
            },
          ]}
        >
          <DatePicker.RangePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="durationMinutes" label="总时长（分）" rules={[{ required: true, message: '请输入总时长' }]}>
          <InputNumber min={1} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="passScore" label="及格分数" rules={[{ required: true, message: '请输入及格分数' }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="points" label="获得积分" rules={[{ required: true, message: '请输入积分' }]}>
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="publishStatus" label="发布状态" rules={[{ required: true, message: '请选择发布状态' }]}>
          <Select options={examPublishStatuses.map((v) => ({ value: v, label: v }))} />
        </Form.Item>
        <Form.Item name="examStatus" label="考试状态" rules={[{ required: true, message: '请选择考试状态' }]}>
          <Select options={examStatuses.map((v) => ({ value: v, label: v }))} />
        </Form.Item>
        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" onClick={() => void save()}>
              保存
            </Button>
            <Button onClick={onBack}>取消</Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
```

（`b2bStandards` 若未用可删 import。）

- [ ] **Step 2: App 挂载表单**

```ts
import { ExamFormPage } from '../features/exams/pages/ExamFormPage';
```

```tsx
) : page === 'exam-create' || page === 'exam-edit' ? (
  <ExamFormPage
    key={`${page}-${recordId ?? 'new'}`}
    mode={page === 'exam-edit' ? 'edit' : 'create'}
    recordId={recordId}
    onBack={() => goToPage('exam-list')}
  />
) : page === 'exam-list' ? (
  <ExamListPage onNavigate={goToPage} />
```

- [ ] **Step 3: 全量验证**

Run:

```bash
npm test
npx tsc --noEmit
```

Expected: 全部 PASS / exit 0。

若 `dayjs` 类型报错：项目课程页已在用；确认 `node_modules/dayjs` 存在（antd 依赖）。缺类型则 `npm i -D @types/dayjs` 一般不需要（dayjs 自带类型）。

- [ ] **Step 4: 手工冒烟**

```bash
npm run dev
```

打开 `#/exam/exam-list`：左树、查询、新增、编辑、详情、批量、侧栏无「分类管理」。

- [ ] **Step 5: Commit** — 跳过

---

## Self-review vs spec

| Spec | Task |
|---|---|
| 抽 shared 树 | Task 1 |
| 删分类管理菜单、默认 exam-list、create/edit hash | Task 2 |
| ExamRecord / 种子 / store / 删除约束 | Task 3 |
| 列表壳 + 批量 + 详情 + 分类 CRUD | Task 4 |
| 独立表单页 | Task 5 |
| 非范围：排行/题库/C 端 | 无对应任务 |

Placeholder scan: 无 TBD。类型名 `ExamPublishStatus` / `setExamPublishStatus` 全文一致。
