# 即时激励 B 端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「即时激励」从占位菜单换成可演示的四页后台：数据总览、勋章管理、发放记录、勋章设置（内存 mock）。

**Architecture:** 领域与 mock 放 `src/features/incentive/model`。页面用现有 `ListPage` / `TableRowActions` / `CategoryTreePanel`。角色用本应用 `IncentiveRoleProvider`，不改全局 Header。路由改 `navigation.ts` + `App.tsx`。不建 C 端。

**Tech Stack:** React 19、antd 6、Vitest、hash 路由、现有 B 端 ListPage。

**Spec:** `docs/superpowers/specs/2026-09-15-incentive-admin-design.md`

**Commit:** 用户未要求 commit 则跳过各 Task 的 git commit 步。

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/incentive/model/incentive.ts` | 类型、四段描述解析、KPI、额度、展示状态、校验 |
| `src/features/incentive/model/incentive.test.ts` | 模型单测 |
| `src/features/incentive/model/incentiveStore.ts` | mock 种子 + CRUD |
| `src/features/incentive/model/incentiveStore.test.ts` | store 单测 |
| `src/features/incentive/model/IncentiveRoleContext.tsx` | 集团/单位演示角色 |
| `src/features/incentive/pages/IncentiveDashboardPage.tsx` | 看板 |
| `src/features/incentive/pages/IncentiveDashboardPage.test.tsx` | KPI 卡 + 角色 |
| `src/features/incentive/pages/IncentiveBadgeListPage.tsx` | 左树+列表 |
| `src/features/incentive/pages/IncentiveBadgeListPage.test.tsx` | 单位空态、集团表 |
| `src/features/incentive/pages/IncentiveBadgeFormPage.tsx` | 新建/编辑 |
| `src/features/incentive/pages/IncentiveBadgeFormPage.test.tsx` | 四段校验 |
| `src/features/incentive/pages/IncentiveRecordListPage.tsx` | 发放列表+三抽屉 |
| `src/features/incentive/pages/IncentiveRecordListPage.test.tsx` | 查询、撤回、表彰字数 |
| `src/features/incentive/pages/IncentiveSettingsPage.tsx` | 三 Tab |
| `src/features/incentive/pages/IncentiveSettingsPage.test.tsx` | Tab 与审核开关 |
| `src/app/navigation.ts` | 四菜单、隐藏页、默认总览 |
| `src/app/navigation.test.ts` | 改现有 `incentive application` |
| `src/app/App.tsx` | 路由四页+表单页 |

不改：`.b2b/b2b-standards.json`、C 端、`NavIcon`。`incentive` 与后面的 `medal` 应用顺序保持 `learning-plan` → `incentive` → `medal`。

---

### Task 1: 领域模型

**Files:**
- Create: `src/features/incentive/model/incentive.ts`
- Create: `src/features/incentive/model/incentive.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/incentive/model/incentive.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  canDeleteScope,
  displayRecognitionStatus,
  parseBadgeDescription,
  quotaMonthlyTotal,
  validateBadgeDescription,
  validateCommendationReason,
  type Badge,
  type Recognition,
} from './incentive';

describe('parseBadgeDescription', () => {
  it('requires four titled sections', () => {
    const text = [
      '【定义】主动补位',
      '【认定标准】- 下班后留下处理故障',
      '【正向示例】- 夜班顶岗完成交付',
      '【排除项】- 仅口头答应未行动',
    ].join('\n');
    const parsed = parseBadgeDescription(text);
    expect(parsed.definition).toContain('主动补位');
    expect(parsed.criteria.length).toBeGreaterThan(0);
    expect(parsed.examples.length).toBeGreaterThan(0);
    expect(parsed.exclusions.length).toBeGreaterThan(0);
    expect(validateBadgeDescription(text).ok).toBe(true);
    expect(validateBadgeDescription('只有一段').ok).toBe(false);
  });
});

describe('displayRecognitionStatus', () => {
  const peer: Recognition = {
    id: 'RK1',
    type: '同事认可',
    giver: '陈佳',
    receiver: '林晓云',
    department: '轨道交通事业部',
    badgeId: 'b1',
    badgeName: '主动补位',
    points: 20,
    description: '夜班顶岗',
    status: '待审核',
    time: '2026-08-26 09:00',
    riskHits: [],
  };

  it('shows 待审核 when personal review is on', () => {
    expect(displayRecognitionStatus(peer, true)).toBe('待审核');
  });

  it('shows 已发放 when personal review is off', () => {
    expect(displayRecognitionStatus(peer, false)).toBe('已发放');
  });
});

describe('canDeleteScope', () => {
  it('blocks delete when badges still use the scope', () => {
    const badges: Badge[] = [
      {
        id: 'b1',
        scopeId: 'peer',
        categoryId: 'c1',
        name: '主动补位',
        points: 20,
        iconUrl: '',
        definition: 'd',
        criteria: ['c'],
        examples: ['e'],
        exclusions: ['x'],
        riskLabel: '低风险',
      },
    ];
    expect(canDeleteScope('peer', badges)).toBe(false);
    expect(canDeleteScope('company', badges)).toBe(true);
  });
});

describe('quotaMonthlyTotal', () => {
  it('multiplies headcount by per-person quota', () => {
    expect(quotaMonthlyTotal(10, 200)).toBe(2000);
  });
});

describe('validateCommendationReason', () => {
  it('enforces minimum length from settings', () => {
    expect(validateCommendationReason('短', 10).ok).toBe(false);
    expect(validateCommendationReason('发生场景—具体行为—产生结果足够长', 10).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/features/incentive/model/incentive.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/incentive/model/incentive.ts` with types `BadgeScope`, `BadgeCategory`, `Badge`, `Recognition`, `RecognitionStatus`, `RecognitionType`, `RiskHit`, `QuotaRow`, `IncentiveSettings`, plus the functions the tests import.

`parseBadgeDescription`: split on `【定义】` `【认定标准】` `【正向示例】` `【排除项】`. `validateBadgeDescription` fails if any section empty.

`displayRecognitionStatus(record, personalReviewEnabled)`: if type is 同事认可 and status is 待审核 and review off, return 已发放; else `record.status`.

`canDeleteScope(scopeId, badges)`: `!badges.some((b) => b.scopeId === scopeId)`.

`quotaMonthlyTotal(employees, budget)`: `employees * budget`.

`validateCommendationReason(text, min)`: `text.trim().length >= min`.

Also export:

```ts
export const DEFAULT_INCENTIVE_SETTINGS: IncentiveSettings = {
  minimumReasonLength: 10,
  reasonPlaceholder: '建议按“发生场景—具体行为—产生结果”的结构填写，并写清可核验结果',
  personalReviewEnabled: true,
  riskRules: { duplicate: true, frequency: true, mutual: true },
};
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/features/incentive/model/incentive.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit** (skip unless user asked)

---

### Task 2: 内存 store

**Files:**
- Create: `src/features/incentive/model/incentiveStore.ts`
- Create: `src/features/incentive/model/incentiveStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addQuota,
  deleteBadge,
  getBadges,
  getQuotas,
  getRecognitions,
  issueCommendation,
  saveBadge,
  withdrawRecognition,
  __resetIncentiveStoreForTests,
} from './incentiveStore';

describe('incentiveStore', () => {
  beforeEach(() => {
    __resetIncentiveStoreForTests();
  });

  it('seeds peer and company badges and recognitions', () => {
    expect(getBadges().length).toBeGreaterThan(3);
    expect(getRecognitions().some((r) => r.type === '同事认可')).toBe(true);
    expect(getRecognitions().some((r) => r.type === '公司表彰')).toBe(true);
  });

  it('keeps history when a badge is deleted', () => {
    const badge = getBadges()[0];
    const before = getRecognitions().filter((r) => r.badgeId === badge.id).length;
    deleteBadge(badge.id);
    expect(getBadges().find((b) => b.id === badge.id)).toBeUndefined();
    expect(getRecognitions().filter((r) => r.badgeId === badge.id).length).toBe(before);
  });

  it('withdraws an issued record', () => {
    const issued = getRecognitions().find((r) => r.status === '已发放');
    expect(issued).toBeTruthy();
    withdrawRecognition(issued!.id);
    expect(getRecognitions().find((r) => r.id === issued!.id)?.status).toBe('已撤回');
  });

  it('issues one recognition per selected employee', () => {
    const companyBadge = getBadges().find((b) => b.riskLabel === '直接发放');
    expect(companyBadge).toBeTruthy();
    const ids = issueCommendation({
      employeeNames: ['林晓云', '陈佳'],
      badgeId: companyBadge!.id,
      reason: '发生场景—具体行为—产生结果足够长了',
    });
    expect(ids).toHaveLength(2);
    expect(getRecognitions().filter((r) => ids.includes(r.id)).every((r) => r.status === '已发放')).toBe(true);
  });

  it('rejects duplicate quota for the same target', () => {
    const row = getQuotas()[0];
    expect(addQuota({ ...row, key: 'dup', name: row.name })).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('saveBadge upserts by id', () => {
    const first = getBadges()[0];
    saveBadge({ ...first, name: '改名勋章' });
    expect(getBadges().find((b) => b.id === first.id)?.name).toBe('改名勋章');
  });
});
```

Store 照抄 `lotteryStore.ts`：模块级数组、`emit`/`subscribe`、`useStoreTick`、`getBadges`/`getRecognitions`/`getQuotas`/`getIncentiveSettings`，以及 `useBadges` 等 hook。页面测试用 `renderToStaticMarkup` + antd `App`，与 `LotteryListPage.test.tsx` 相同。

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/features/incentive/model/incentiveStore.test.ts
```

- [ ] **Step 3: Implement store**

Seed: two scopes `peer`=`同事认可`, `company`=`公司表彰`; ≥4 categories; ≥8 badges; ≥6 recognitions including 待审核/已发放/带 riskHits；配额含集团下若干组织 + 至少 1 个个人。`issueCommendation` 生成 `RK`+时间戳 id。`deleteBadge` 只从 badges 数组移除。

- [ ] **Step 4: Tests PASS**

```bash
npm test -- src/features/incentive/model/incentiveStore.test.ts src/features/incentive/model/incentive.test.ts
```

- [ ] **Step 5: Commit** (skip unless asked)

---

### Task 3: 导航换成四菜单

**Files:**
- Modify: `src/app/navigation.test.ts` (`describe('incentive application')`)
- Modify: `src/app/navigation.ts`

- [ ] **Step 1: Rewrite the failing tests**

Replace the existing `incentive application` describe so it asserts:

```ts
describe('incentive application', () => {
  it('registers 即时激励 with dashboard default and four menus', () => {
    expect(getApplication('incentive')).toEqual({
      key: 'incentive',
      label: '即时激励',
      category: '员工与组织',
      icon: 'rocket',
      defaultPage: 'incentive-dashboard',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('incentive')).toBe(keys.indexOf('learning-plan') + 1);
    expect(keys.indexOf('incentive')).toBe(keys.indexOf('medal') - 1);
    expect(applicationMenus.incentive).toEqual([
      { key: 'incentive-dashboard', icon: 'dashboard', label: '数据总览' },
      { key: 'incentive-badges', icon: 'trophy', label: '勋章管理' },
      { key: 'incentive-records', icon: 'unorderedList', label: '发放记录' },
      { key: 'incentive-settings', icon: 'appstore', label: '勋章设置' },
    ]);
  });

  it('parses hashes and maps badge form pages to 勋章管理', () => {
    expect(parseLocationHash('#/incentive')).toEqual({ application: 'incentive', page: 'incentive-dashboard' });
    expect(parseLocationHash('#/incentive/not-a-page')).toEqual({ application: 'incentive', page: 'incentive-dashboard' });
    expect(parseLocationHash('#/incentive/incentive-dashboard')).toEqual({
      application: 'incentive',
      page: 'incentive-dashboard',
    });
    expect(parseLocationHash('#/incentive/incentive-badge-create')).toEqual({
      application: 'incentive',
      page: 'incentive-badge-create',
    });
    expect(parseLocationHash('#/incentive/incentive-badge-edit/b1')).toEqual({
      application: 'incentive',
      page: 'incentive-badge-edit',
      recordId: 'b1',
    });
    expect(siderSelectedKey('incentive-badge-create')).toBe('incentive-badges');
    expect(siderSelectedKey('incentive-badge-edit')).toBe('incentive-badges');
  });

  it('shows 即时激励 in 全部应用 but not top-bar direct apps', () => {
    expect(visibleApplications().map((item) => item.label)).toContain('即时激励');
    expect(getDirectApplications(4).map((item) => item.key)).not.toContain('incentive');
  });
});
```

Keep neighboring `medal` order assertions working (`incentive` still immediately before `medal`).

- [ ] **Step 2: Run `npm test -- src/app/navigation.test.ts` — FAIL** on defaultPage / menus.

- [ ] **Step 3: Update navigation.ts**

`applications` incentive `defaultPage: 'incentive-dashboard'`.

```ts
  incentive: [
    { key: 'incentive-dashboard', icon: 'dashboard', label: '数据总览' },
    { key: 'incentive-badges', icon: 'trophy', label: '勋章管理' },
    { key: 'incentive-records', icon: 'unorderedList', label: '发放记录' },
    { key: 'incentive-settings', icon: 'appstore', label: '勋章设置' },
  ],
```

Remove `incentive-list` menu and `incentive-create|edit|detail` extraPages/sider maps. Add extraPages `incentive-badge-create`, `incentive-badge-edit`. `siderSelectedKey` those two → `incentive-badges`.

- [ ] **Step 4: Tests PASS**

```bash
npm test -- src/app/navigation.test.ts
```

- [ ] **Step 5: Commit** (skip unless asked)

---

### Task 4: 角色 + 数据总览

**Files:**
- Create: `src/features/incentive/model/IncentiveRoleContext.tsx`
- Create: `src/features/incentive/pages/IncentiveDashboardPage.tsx`
- Create: `src/features/incentive/pages/IncentiveDashboardPage.test.tsx`
- Modify: `src/app/App.tsx` (only wrap + dashboard route; other incentive pages can still Placeholder until later tasks)

- [ ] **Step 1: Failing page test**

Use `@testing-library/react` the same way `LotteryListPage.test.tsx` does (open that file for render/providers). Assert: heading 数据总览；四张 KPI 文案「员工参与率」「认可次数」「累计发放积分」「跨部门认可占比」；查询/重置按钮存在。

- [ ] **Step 2: FAIL then implement**

`IncentiveRoleContext`: `role: 'group' | 'unit'`, default `group`, `setRole`.

`IncentiveDashboardPage`: `ListPageHeading` paths `['即时激励','数据总览']`，`titleExtra` 放 `Select` 角色。标题行 `extra`：统计周期 `RangePicker`、组织 `TreeSelect`（unit 时 value 锁「轨道交通事业部」disabled）、查询/重置。四 `Card` KPI。勋章分布用简单 `Table` 或条。桑基：发放/接收都未形成不同集合时显示「请分别选择不同的发放团队和接收团队」。排行榜用 `SearchPanel`（排行对象、关键词、勋章）+ `Table` + 完整导出按钮（`message.success` 即可，可写 blob CSV）。

KPI 数字用 store 里已发放记录现算或写死与原型同量级的常量函数 `dashboardKpis(role)` 放 `incentive.ts` 并单测 group vs unit 返回不同 `participationRate`。

App.tsx：`page === 'incentive-dashboard'` → `<IncentiveRoleProvider><IncentiveDashboardPage /></IncentiveRoleProvider>`。Provider 必须包住后续所有即时激励页，所以放在 `AdminApp` 里当 `application==='incentive'` 时包一层，或在每个 page 外包同一 Provider。优先：incentive 分支最外层一个 Provider，避免角色切换丢状态。

- [ ] **Step 3: `npm test -- src/features/incentive/pages/IncentiveDashboardPage.test.tsx src/app/navigation.test.ts` PASS**

- [ ] **Step 4: Commit** (skip unless asked)

---

### Task 5: 勋章管理列表 + 表单

**Files:**
- Create: `src/features/incentive/pages/IncentiveBadgeListPage.tsx`
- Create: `src/features/incentive/pages/IncentiveBadgeListPage.test.tsx`
- Create: `src/features/incentive/pages/IncentiveBadgeFormPage.tsx`
- Create: `src/features/incentive/pages/IncentiveBadgeFormPage.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Tests**

List: 单位角色渲染「勋章由集团统一配置」，无「新增勋章」。集团角色渲染「新增勋章」、表格有种子勋章名。

Form: 描述只填一段时提交出现校验错误（`validateBadgeDescription` 或 form error 文案「请按四个分类标题完整填写描述」）。

- [ ] **Step 2: Implement list**

单位空态 `Empty`。集团：左 `CategoryTreePanel`（把 scope/category 映射为 `CategoryNode`，根「全部」）。右 `SearchPanel` 三项：名称、积分下限、积分上限（无第 4 查询字段则不要展开按钮；`SearchPanel` 按实际字段数）。`ListTableCard` 列：名称链接 `onNavigate('incentive-badge-edit', id)`、归属、分类、积分、风险、`TableRowActions` 详情=编辑、编辑、删除 Confirm。工具栏右主按钮新增 → `incentive-badge-create`。树选中写 URL：复用现有 hash 的 `ownerApp` 或 `tab` 不合适的话，用 `page` 不变、`sessionStorage` 或 parse query。spec 要求树进 URL：扩展 `parseLocationHash` **仅当** 现有 query 机制能挂 `tree=`；若 `toLocationHash` 不好扩展，本轮用 `window.location.hash` 手工 `?tree=scopeId` 且在 `parseLocationHash` 忽略未知 query（列表自己 `URLSearchParams`）。不要破坏 checkin `?app=`。

- [ ] **Step 3: Implement form**

独立页 `ListPageHeading` 面包屑 即时激励 > 勋章管理 > 新建/编辑。`Form` `labelCol` 112px inline。字段：归属 Select、分类 Select（随归属）、名称、积分、Upload 图标、描述 TextArea 初始四段标题。`Form.Item` description validator 调 `validateBadgeDescription`。页脚 Space 取消（回列表）→ 保存。编辑模式图标非必填。未保存离开：`useBlocker` 若项目没有则 `modal.confirm` 在取消时询问。

- [ ] **Step 4: Wire App.tsx** `incentive-badges` / `incentive-badge-create` / `incentive-badge-edit`。

- [ ] **Step 5: Tests PASS** including navigation.

- [ ] **Step 6: Commit** (skip unless asked)

---

### Task 6: 发放记录

**Files:**
- Create: `src/features/incentive/pages/IncentiveRecordListPage.tsx`
- Create: `src/features/incentive/pages/IncentiveRecordListPage.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Tests**

渲染「发放记录」「发布公司表彰」。点击一条编号打开抽屉标题含「认可详情」。`personalReviewEnabled` true 时能看到待审核行的「审核」。撤回确认后该行状态文案「已撤回」。发布抽屉事由 2 个字点确认发放 → 出现字数提示，记录数不增加。

- [ ] **Step 2: Implement**

`SearchPanel` 六字段，默认三项编号/对象/类型，展开部门、时间、状态。按钮查询重置展开。`TableRowActions` 详情、审核（展示状态待审核时）、撤回。三个 `Drawer` 宽 620–720。审核页脚：取消、驳回、通过并发放（主按钮在最左组里按规范：抽屉提交区取消→保存；此处取消 / 驳回危险 / 通过主按钮。顺序：取消 → 驳回 → 通过并发放，通过为 primary 最右）。发布：TreeSelect 人、勋章（仅 `riskLabel==='直接发放'`）、事由；`validateCommendationReason`。单位角色 filter `department==='轨道交通事业部'`。

- [ ] **Step 3: App.tsx `incentive-records`**

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit** (skip unless asked)

---

### Task 7: 勋章设置

**Files:**
- Create: `src/features/incentive/pages/IncentiveSettingsPage.tsx`
- Create: `src/features/incentive/pages/IncentiveSettingsPage.test.tsx`
- Modify: `src/app/App.tsx`、`src/features/incentive/model/incentiveStore.ts`（settings getter/setter）

- [ ] **Step 1: Tests**

三个 Tab 文案。关掉「个人提交审核」出现 Confirm 文案含「直接发放」。填写设置最少字数改成 12 保存后 `getSettings().minimumReasonLength === 12`。

- [ ] **Step 2: Implement**

`ListPageHeading` + `Tabs` items points/content/risk。积分：月份 Select、对象类型、关键词；表额度；新增/调整 `Drawer`；使用明细子视图返回按钮。填写：InputNumber + TextArea + 保存。风控：Switch + 三规则 Switch；关审核 `modal.confirm`。

Hash `?tab=`：settings 页读取 `window.location.hash` 的 search，切换 Tab 时 `history.replaceState` 写 `tab`。`parseLocationHash` 可不认识 tab。

- [ ] **Step 3: App.tsx `incentive-settings`**

- [ ] **Step 4: Tests PASS**

```bash
npm test -- src/features/incentive src/app/navigation.test.ts
```

- [ ] **Step 5: Commit** (skip unless asked)

---

### Task 8: 规范与回归

**Files:** 已有页面按需微调 className，不改 JSON 规范。

- [ ] **Step 1:** `python3 scripts/check_ui_conformance.py --root .`  
Fix any incentive-page violations (查询按钮序、列表四层、危险删除最右)。

- [ ] **Step 2:** `npm test -- src/features/incentive src/app/navigation.test.ts`

- [ ] **Step 3:** 手工 `http://127.0.0.1:5173/#/incentive/incentive-dashboard`：四菜单、单位空态勋章、表彰短事由拦截、撤回。

---

## Spec coverage

| Spec | Task |
|---|---|
| 四菜单、默认总览、删 incentive-list | 3 |
| 角色演示、KPI、桑基空态、排行 | 4 |
| 左树、表单四段、单位空态 | 5 |
| 发放列表、抽屉、撤回、表彰 | 6 |
| 设置三 Tab、额度、风控 Confirm | 7 |
| mock store、删勋章留历史 | 2 |
| 校验函数 | 1 |
| check_ui_conformance | 8 |
| 不做 C 端 | 无对应实现 |

类型名全程：`Badge` `Recognition` `QuotaRow` `IncentiveSettings` `displayRecognitionStatus` `parseBadgeDescription`。
