# 活动详情页 Tab 化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 活动详情页改为 7 个 Tab（详情/报名/评论/精彩瞬间/审批记录/满意度调查/奖品发放），六个相关管理列表去掉独立页面外壳嵌入详情页，列表页「更多」菜单移除相关入口，独立路由废弃。

**Architecture:** hash 路由 `#/app/page/recordId` 扩展第四段 tab；详情页内 `Tabs` 懒加载渲染各列表组件；列表组件删除面包屑/标题/返回外壳，只留业务区。

**Tech Stack:** React + antd Tabs + Vitest。

**Spec:** `docs/superpowers/specs/2026-08-21-activity-detail-tabs-design.md`

**注意：** 全程不 git commit（用户未要求）。

---

### Task 1: navigation 支持 tab 段 + 单测

**Files:**
- Modify: `src/app/navigation.ts:357-384`（`parseLocationHash`、`toLocationHash`）
- Modify: `src/app/navigation.test.ts`（加用例）

- [ ] **Step 1: 加失败测试**

在 `navigation.test.ts` 追加（放进合适的 describe，或新建 `describe('activity detail tab hash', ...)`）：

```ts
it('parses the tab segment of activity-detail hash', () => {
  expect(parseLocationHash('#/activity/activity-detail/3/signups')).toEqual({
    application: 'activity',
    page: 'activity-detail',
    recordId: '3',
    tab: 'signups',
  });
});

it('keeps three-segment activity-detail hash without tab', () => {
  expect(parseLocationHash('#/activity/activity-detail/3')).toEqual({
    application: 'activity',
    page: 'activity-detail',
    recordId: '3',
  });
});

it('writes tab as fourth segment in toLocationHash', () => {
  expect(toLocationHash('activity', 'activity-detail', '3', 'comments')).toBe('#/activity/activity-detail/3/comments');
  expect(toLocationHash('activity', 'activity-detail', '3')).toBe('#/activity/activity-detail/3');
  expect(toLocationHash('activity', 'activity-list')).toBe('#/activity/activity-list');
});
```

先确认 `toLocationHash` 已从此文件导出（navigation.ts:382 有定义）。test import 里补 `toLocationHash`。

注意：`'activity'` 应用 key 若与实际不符，先读 `applicationMenus`/`applications` 定义取真实 key 替换。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/app/navigation.test.ts`
Expected: FAIL（tab 不在返回值 / toLocationHash 不接受第四参）

- [ ] **Step 3: 实现**

`parseLocationHash`（navigation.ts:357-380）：

```ts
export function parseLocationHash(hash: string): { application: string; page: string; recordId?: string; tab?: string } {
  const fallback = { application: 'workbench', page: 'dashboard' };
  const path = hash.replace(/^#\/?/, '').trim();
  if (!path) return fallback;
  const [applicationKey, pageKey, recordId, tab] = path.split('/');
  const application = getApplication(applicationKey);
  if (!application) return fallback;
  const menus = applicationMenus[application.key] ?? [];
  const extraPages = [
    'activity-create',
    'activity-edit',
    'activity-detail',
    'course-create',
    'course-edit',
    'course-comments',
    'exam-create',
    'exam-edit',
    ...relatedPages,
  ];
  if (pageKey && (isLeafMenuKey(menus, pageKey) || extraPages.includes(pageKey))) {
    return tab ? { application: application.key, page: pageKey, recordId, tab } : { application: application.key, page: pageKey, recordId };
  }
  return { application: application.key, page: application.defaultPage };
}
```

（`...relatedPages` 保留到 Task 5 才清理。）

`toLocationHash`（navigation.ts:382-384）：

```ts
export function toLocationHash(application: string, page: string, recordId?: string, tab?: string): string {
  if (recordId && tab) return `#/${application}/${page}/${recordId}/${tab}`;
  return recordId ? `#/${application}/${page}/${recordId}` : `#/${application}/${page}`;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/app/navigation.test.ts`
Expected: 全绿（旧用例不破：无 tab 时返回对象不带 tab 键，toEqual 忽略 undefined 也安全）

---

### Task 2: `ActivityRelatedListPage.tsx` 去壳，导出四个列表组件

**Files:**
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`

原则：删除独立页面外壳，四个列表变纯业务组件。文件不改名。

- [ ] **Step 1: 删除外壳与标题件**

删除：
- `pageMeta`（58-65 行）——先确认 `meta.noun` 在 `RelatedTable` 里是否有用途（如批量按钮文案）。若 `RelatedTable` 用了 `meta.noun`，保留各列表内联的 noun 字符串（直接在调用处写字面量），再删 `pageMeta`。
- `RelatedHeading`（111-139 行）
- `MissingActivity`（141-157 行）
- `ActivityRelatedListPage` 外壳（159-176 行）
- `Breadcrumb`、`Typography`、`Empty` 等随之不再使用的 import；`getActivity` import（外壳专用）；`RelatedPage` 类型 import；`ActivityMomentListPage`/`ActivityPrizeListPage` import（外壳分发专用）。

- [ ] **Step 2: RelatedTable 去掉 heading 渲染**

`RelatedTable`（947 行起）：删除 `RelatedHeading` 渲染及对应 props（`meta` 的 title/subtitle、`onBack`）。保留搜索区、批量栏、表格、分页。

- [ ] **Step 3: 四个列表改签名并导出**

`SurveyList`、`ApprovalList`、`SignupList`、`CommentList`：
- 改 `export function XxxList({ activity }: { activity: Activity })`
- 删除 `onBack` prop 及所有 `onBack={onBack}` 透传（178/260/367/380/405/621/789/872 行附近）

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 仅剩「App.tsx 引用了不存在的 ActivityRelatedListPage」类错误（Task 5 修），本文件自身无错

---

### Task 3: 精彩瞬间 / 奖品发放页去壳

**Files:**
- Modify: `src/features/activities/pages/ActivityMomentListPage.tsx`
- Modify: `src/features/activities/pages/ActivityPrizeListPage.tsx`

- [ ] **Step 1: 识别外壳**

两文件各自渲染：面包屑（活动 > 活动管理 > {title} > 页面名）、`Typography.Title` 标题行、返回逻辑。先读文件找到这些块。

- [ ] **Step 2: 去壳**

- props 改 `{ activity }: { activity: Activity }`，删 `onBack`
- 删除 Breadcrumb、页面标题行、返回按钮及不再用的 import
- 保留搜索区、表格、Drawer/Modal、批量操作全部业务功能
- 导出名不变（`ActivityMomentListPage`、`ActivityPrizeListPage`），减少引用 diff

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 这两文件无新错误

---

### Task 4: 详情页加 Tabs

**Files:**
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`

- [ ] **Step 1: 定义 tab 常量与 props**

文件内（import 之后）：

```tsx
const detailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'signups', label: '报名' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
  { key: 'approvals', label: '审批记录' },
  { key: 'surveys', label: '满意度调查' },
  { key: 'prizes', label: '奖品发放' },
] as const;

type DetailTab = (typeof detailTabs)[number]['key'];

function isDetailTab(value: string | undefined): value is DetailTab {
  return !!value && detailTabs.some((tab) => tab.key === value);
}
```

props 改：

```tsx
type ActivityDetailPageProps = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onTabChange: (tab: DetailTab) => void;
};
```

import 增加：`Tabs`（antd）、`SignupList, CommentList, ApprovalList, SurveyList`（来自 `./ActivityRelatedListPage`）、`ActivityMomentListPage`、`ActivityPrizeListPage`。

- [ ] **Step 2: tab 状态与懒加载**

组件内（拿到 `activity` 之后、return 之前）：

```tsx
const activeTab: DetailTab = isDetailTab(tab) ? tab : 'detail';
const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([activeTab]));
const changeTab = (key: string) => {
  if (!isDetailTab(key)) return;
  setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  onTabChange(key);
};
```

- [ ] **Step 3: 组装 Tabs**

现有两个 `Card`（活动信息、报名设置）包进 detail pane。`ActivityReviewModal` 保持在 Tabs 外。

```tsx
<Tabs
  activeKey={activeTab}
  onChange={changeTab}
  items={[
    {
      key: 'detail',
      label: '详情',
      children: (
        <div className="page-stack">
          <Card title="活动信息">{/* 现有 Descriptions 原样 */}</Card>
          <Card title="报名设置">{/* 现有 Descriptions 原样 */}</Card>
        </div>
      ),
    },
    { key: 'signups', label: '报名', children: visited.has('signups') ? <SignupList activity={activity} /> : null },
    { key: 'comments', label: '评论', children: visited.has('comments') ? <CommentList activity={activity} /> : null },
    { key: 'moments', label: '精彩瞬间', children: visited.has('moments') ? <ActivityMomentListPage activity={activity} /> : null },
    { key: 'approvals', label: '审批记录', children: visited.has('approvals') ? <ApprovalList activity={activity} /> : null },
    { key: 'surveys', label: '满意度调查', children: visited.has('surveys') ? <SurveyList activity={activity} /> : null },
    { key: 'prizes', label: '奖品发放', children: visited.has('prizes') ? <ActivityPrizeListPage activity={activity} /> : null },
  ]}
/>
```

detail pane 内容即现有 JSX 平移，不改动。

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 详情页无错（App.tsx 未接线导致的报错归 Task 5）

---

### Task 5: App 接线 + 菜单清理 + 路由废弃

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/features/activities/pages/ActivityListPage.tsx`
- Modify: `src/app/navigation.ts`（extraPages 去掉 relatedPages）
- Modify: `src/features/activities/model/related.ts`（删 `relatedPages`、`RelatedPage`，若无其他引用）

- [ ] **Step 1: App.tsx 加 tab state 与接线**

```tsx
const initial = parseLocationHash(window.location.hash);
const [tab, setTab] = useState(initial.tab);
```

`syncLocation` 加第四参：

```tsx
const syncLocation = (nextApplication: string, nextPage: string, nextRecordId?: string, nextTab?: string) => {
  const nextHash = toLocationHash(nextApplication, nextPage, nextRecordId, nextTab);
  if (window.location.hash !== nextHash) {
    beginSuppressHash();
    window.location.hash = nextHash;
  }
};
```

hashchange 监听里 `setTab(next.tab);` 与 setPage/setRecordId 并列。

activity-detail 分支：

```tsx
) : page === 'activity-detail' ? (
  <ActivityDetailPage
    recordId={recordId}
    tab={tab}
    onBack={() => goToPage('activity-list')}
    onEdit={(id) => goToPage('activity-edit', String(id))}
    onTabChange={(nextTab) => {
      setTab(nextTab);
      syncLocation(application, 'activity-detail', recordId, nextTab);
    }}
  />
)
```

（`application` 用当前 state 值。）

删除 relatedPages 路由分支（366-372 行）及 `ActivityRelatedListPage`、`relatedPages`、`RelatedPage` import。

- [ ] **Step 2: 列表页「更多」菜单移除 6 入口**

`ActivityListPage.tsx`：
- 删 `relatedActionItems`（48-55 行）及菜单里 `...relatedActionItems.map(...)` 渲染与前缀 divider（394-398 行附近）
- 删 `RelatedPage` import（若不再用）
- 菜单 onClick 里对应分支清理

- [ ] **Step 3: navigation.ts 清理**

- extraPages 删 `...relatedPages`
- `siderSelectedKey` 删 relatedPages 分支（386-402 行）
- relatedPages import 删

- [ ] **Step 4: related.ts 清理**

grep 全仓 `relatedPages`、`RelatedPage`：无引用后从 `related.ts` 删除数组与类型。

- [ ] **Step 5: 全量类型检查 + 测试**

Run: `npx tsc --noEmit`
Expected: 无错（允许存在与本次无关的历史报错；有则记录不动）

Run: `npm test -- src/app`
Expected: 全绿（旧 hash 如 `#/activity/activity-signups/3` 现落到 activity-list 默认页——若有测试钉死旧行为，更新该用例预期为回落）

---

### Task 6: 回归

- [ ] **Step 1:** Run: `npm test -- src/features/activities src/app` — 全绿
- [ ] **Step 2:** Run: `python3 scripts/check_ui_conformance.py --root .` — 通过
- [ ] **Step 3:** 手测清单（写进报告）：
  - 列表 → 详情：默认「详情」tab，内容同改造前
  - 逐 tab 切换：报名增删导/审核、评论删除、精彩瞬间审核、审批记录、问卷、奖品发放均可用
  - 切 tab 地址栏出现第四段；刷新保持当前 tab
  - 列表页「更多」无 6 个相关入口
  - 详情页操作按钮（审核/提交审批/编辑/返回）在任意 tab 可用

---

## Self-Review 记录

- Spec 覆盖：7 tab(Task 4)、去壳(Task 2/3)、导航(Task 5)、懒加载(Task 4)、测试回归(Task 1/5/6)✅
- 类型一致：`DetailTab`、四个列表组件签名 `{ activity }`、`onTabChange(tab: DetailTab)`、navigation 第四参 `tab` 前后一致 ✅
- 占位符：无 ✅
- 已知留白：Moment/Prize 外壳具体行号未钉死（结构清晰描述，由执行者定位）；Task 2 `meta.noun` 用途需现场确认——两种情况都给了处理路径
