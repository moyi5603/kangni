# 勋章管理列表 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「勋章」默认页从占位换成规范搜索列表：查询、创建/编辑弹窗、有效/失效、删除；发放记录按钮禁用。

**Architecture:** 新建 `src/features/medal`（领域纯函数 + 内存 store + 列表页含弹窗）。`App.tsx` 在 `PlaceholderPage` 之前匹配 `medal-list` / `medal-create` / `medal-edit` / `medal-detail`。不改活动 `medalLibrary`。筛选状态放组件内（与抽奖/打卡列表相同）；hash 只表达弹窗模式。不扩展 `parseLocationHash` 的未知 query——现有路由会丢掉非 `app=` 参数。

**Tech Stack:** React 19、antd 6、Vitest `renderToStaticMarkup`、`ListPage` / `TableRowActions` / `TableEllipsisText`。

**Spec:** `docs/superpowers/specs/2026-09-15-medal-list-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/medal/model/medal.ts` | 类型、种子、过滤、校验、排序 |
| `src/features/medal/model/medal.test.ts` | 纯函数测试 |
| `src/features/medal/model/medalStore.ts` | 内存 CRUD / 启停 / 删除 |
| `src/features/medal/model/medalStore.test.ts` | store 测试 |
| `src/features/medal/pages/MedalFormModal.tsx` | 创建/编辑弹窗 |
| `src/features/medal/pages/MedalFormModal.test.tsx` | 弹窗字段与底栏顺序 |
| `src/features/medal/pages/MedalListPage.tsx` | 列表 + 打开弹窗 |
| `src/features/medal/pages/MedalListPage.test.tsx` | 列表列、行操作、创建入口 |
| `src/app/App.tsx` | 路由接到列表页 |

不改：`medalLibrary.ts`、C 端、`.b2b/b2b-standards.json`、`actionsMaxVisible`。

---

### Task 1: 领域模型

**Files:**
- Create: `src/features/medal/model/medal.ts`
- Create: `src/features/medal/model/medal.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/medal/model/medal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  MEDAL_APPS,
  filterMedals,
  initialMedals,
  sortMedalsByCreatedAtDesc,
  validateMedalDraft,
} from './medal';

describe('medal domain', () => {
  it('seeds at least 18 medals including screenshot names and apps', () => {
    expect(initialMedals.length).toBeGreaterThanOrEqual(18);
    const names = initialMedals.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(['明星员工', '服务标兵', '价值观典范', '匠心品质', '成长之星', '卓越贡献', '成长启航', '协作共赢', '创新进取']));
    expect(MEDAL_APPS).toEqual(['通用', '活动', '课发展', '评优活动', '文化打卡']);
    expect(initialMedals.some((item) => item.app === '评优活动')).toBe(true);
    expect(initialMedals.some((item) => item.app === '文化打卡')).toBe(true);
    expect(initialMedals.every((item) => item.status === '有效' || item.status === '失效')).toBe(true);
  });

  it('filters by name contains, app, status and createdAt day range', () => {
    const rows = sortMedalsByCreatedAtDesc(initialMedals);
    expect(filterMedals(rows, { name: '明星', app: 'all', status: 'all', from: '', to: '' }).every((item) => item.name.includes('明星'))).toBe(true);
    expect(filterMedals(rows, { name: '', app: '文化打卡', status: 'all', from: '', to: '' }).every((item) => item.app === '文化打卡')).toBe(true);
    const disabled = filterMedals(rows, { name: '', app: 'all', status: '失效', from: '', to: '' });
    expect(disabled.every((item) => item.status === '失效')).toBe(true);
    const ranged = filterMedals(rows, { name: '', app: 'all', status: 'all', from: '2026-08-31', to: '2026-08-31' });
    expect(ranged.every((item) => item.createdAt.startsWith('2026-08-31'))).toBe(true);
  });

  it('validates create draft', () => {
    expect(validateMedalDraft({ name: '', imageUrl: '', app: '通用', description: '' })).toEqual({
      imageUrl: '请上传勋章图片',
      name: '请输入勋章名称',
    });
    expect(validateMedalDraft({ name: 'a'.repeat(31), imageUrl: 'x', app: '通用', description: 'd'.repeat(101) })).toEqual({
      name: '名称不超过 30 字',
      description: '描述不超过 100 字',
    });
    expect(validateMedalDraft({ name: '服务标兵', imageUrl: 'data:image/svg+xml,x', app: '活动', description: 'ok' })).toEqual({});
  });

  it('sorts newest createdAt first', () => {
    const sorted = sortMedalsByCreatedAtDesc([
      { ...initialMedals[0], id: 'a', createdAt: '2026-01-01 00:00:00' },
      { ...initialMedals[0], id: 'b', createdAt: '2026-08-31 15:03:58' },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/features/medal/model/medal.test.ts
```

Expected: FAIL, cannot find module `./medal`.

- [ ] **Step 3: Write `src/features/medal/model/medal.ts`**

```ts
export const MEDAL_APPS = ['通用', '活动', '课发展', '评优活动', '文化打卡'] as const;
export type MedalApp = (typeof MEDAL_APPS)[number];
export type MedalStatus = '有效' | '失效';

export type MedalRecord = {
  id: string;
  name: string;
  imageUrl: string;
  app: MedalApp;
  description: string;
  status: MedalStatus;
  creator: string;
  createdAt: string;
};

export type MedalDraft = {
  name: string;
  imageUrl: string;
  app: MedalApp | '';
  description: string;
};

export type MedalQuery = {
  name: string;
  app: MedalApp | 'all';
  status: MedalStatus | 'all';
  from: string;
  to: string;
};

function badgeUri(fill: string, ring: string, mark: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="${fill}" stroke="${ring}" stroke-width="6"/><text x="40" y="48" text-anchor="middle" font-size="24" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-weight="700" fill="${ring}">${mark}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function row(
  id: string,
  name: string,
  mark: string,
  fill: string,
  ring: string,
  app: MedalApp,
  description: string,
  creator: string,
  createdAt: string,
  status: MedalStatus = '有效',
): MedalRecord {
  return { id, name, imageUrl: badgeUri(fill, ring, mark), app, description, status, creator, createdAt };
}

export const MEDAL_CREATOR = '北玛三十度';

export const initialMedals: MedalRecord[] = [
  row('m1', '明星员工', '星', '#ffe58f', '#d48806', '评优活动', '全年综合表现优异的标杆员工', '李巧', '2026-08-31 15:03:58'),
  row('m2', '服务标兵', '服', '#ffd8bf', '#d4380d', '评优活动', '服务岗位表现优异，口碑突出', '李巧', '2026-08-31 15:03:02'),
  row('m3', '价值观典范', '值', '#ffccc7', '#cf1322', '评优活动', '自觉践行企业核心价值观', '李巧', '2026-08-31 15:02:18'),
  row('m4', '匠心品质', '匠', '#ffe7ba', '#d46b08', '评优活动', '深耕岗位、精益求精的品质典范', '李巧', '2026-08-31 15:02:04'),
  row('m5', '成长之星', '长', '#d9f7be', '#389e0d', '评优活动', '面向新人的成长激励勋章', '李巧', '2026-08-31 14:52:37'),
  row('m6', '卓越贡献', '卓', '#bae0ff', '#0958d9', '评优活动', '为公司发展作出重大贡献', '李巧', '2026-08-31 14:52:03'),
  row('m7', '成长启航', '航', '#d6e4ff', '#2f54eb', '课发展', '迈出系统学习的第一步', '李巧', '2026-08-04 14:40:08'),
  row('m8', '协作共赢', '协', '#efdbff', '#531dab', '文化打卡', '跨部门协作的表彰勋章', '庄珊珊', '2026-07-27 14:21:38'),
  row('m9', '创新进取', '创', '#b5f5ec', '#08979c', '文化打卡', '提出并落地创新提案', '庄珊珊', '2026-07-27 14:20:31'),
  row('m10', '客户至上', '客', '#fff1b8', '#ad6800', '文化打卡', '客户满意度持续领先', '庄珊珊', '2026-07-27 14:15:11'),
  row('m11', '活动参与勋章', '参', '#ffe58f', '#d48806', '活动', '完成活动报名与签到', '李巧', '2026-08-16 11:20:00'),
  row('m12', '结业纪念勋章', '业', '#d6e4ff', '#1d39c4', '活动', '完成系列活动结业', '李巧', '2026-08-16 11:18:00'),
  row('m13', '满勤打卡', '勤', '#ffd6e7', '#c41d7f', '文化打卡', '连续打卡满勤', '庄珊珊', '2026-07-20 09:00:00'),
  row('m14', '学习之星', '学', '#d3adf7', '#531dab', '课发展', '完成指定课程学习', '李巧', '2026-08-04 10:00:00'),
  row('m15', '安全之星', '安', '#fff1b8', '#ad6800', '通用', '安全意识与行为标杆', MEDAL_CREATOR, '2026-06-01 09:00:00'),
  row('m16', '质量标兵', '质', '#eaff8f', '#7cb305', '通用', '质量改进突出贡献', MEDAL_CREATOR, '2026-06-02 09:00:00'),
  row('m17', '组织先锋', '组', '#b5f5ec', '#08979c', '通用', '组织建设先锋', MEDAL_CREATOR, '2026-06-03 09:00:00'),
  row('m18', '志愿者勋章', '志', '#d9f7be', '#389e0d', '活动', '活动志愿服务', '李巧', '2026-05-12 18:00:00', '失效'),
];

export function sortMedalsByCreatedAtDesc(rows: MedalRecord[]): MedalRecord[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function filterMedals(rows: MedalRecord[], query: MedalQuery): MedalRecord[] {
  const keyword = query.name.trim();
  return rows.filter((item) => {
    if (keyword && !item.name.includes(keyword)) return false;
    if (query.app !== 'all' && item.app !== query.app) return false;
    if (query.status !== 'all' && item.status !== query.status) return false;
    const day = item.createdAt.slice(0, 10);
    if (query.from && day < query.from) return false;
    if (query.to && day > query.to) return false;
    return true;
  });
}

export function validateMedalDraft(draft: MedalDraft): Partial<Record<'name' | 'imageUrl' | 'app' | 'description', string>> {
  const errors: Partial<Record<'name' | 'imageUrl' | 'app' | 'description', string>> = {};
  if (!draft.imageUrl.trim()) errors.imageUrl = '请上传勋章图片';
  const name = draft.name.trim();
  if (!name) errors.name = '请输入勋章名称';
  else if (name.length > 30) errors.name = '名称不超过 30 字';
  if (!draft.app) errors.app = '请选择所属应用';
  if (draft.description.length > 100) errors.description = '描述不超过 100 字';
  return errors;
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/features/medal/model/medal.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit** if the user asked. Otherwise skip.

```bash
git add src/features/medal/model/medal.ts src/features/medal/model/medal.test.ts
git commit -m "$(cat <<'EOF'
feat(medal): add medal domain types and filters

List CRUD needs a store isolated from activity medalLibrary.
EOF
)"
```

---

### Task 2: 内存 store

**Files:**
- Create: `src/features/medal/model/medalStore.ts`
- Create: `src/features/medal/model/medalStore.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetMedalStoreForTests, createMedal, getMedal, listMedals, removeMedal, setMedalStatus, updateMedal } from './medalStore';

describe('medalStore', () => {
  beforeEach(() => {
    __resetMedalStoreForTests();
  });

  it('creates at the front, updates, toggles status and deletes', () => {
    const created = createMedal({
      name: '测试勋章',
      imageUrl: 'data:image/svg+xml,x',
      app: '通用',
      description: 'd',
    });
    expect(listMedals()[0].id).toBe(created.id);
    expect(created.status).toBe('有效');
    expect(created.creator).toBe('北玛三十度');
    updateMedal(created.id, { name: '测试勋章改' });
    expect(getMedal(created.id)?.name).toBe('测试勋章改');
    expect(setMedalStatus(created.id, '失效')).toBe(true);
    expect(getMedal(created.id)?.status).toBe('失效');
    expect(removeMedal(created.id)).toBe(true);
    expect(getMedal(created.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- src/features/medal/model/medalStore.test.ts
```

- [ ] **Step 3: Implement store** (same subscribe/emit pattern as `src/features/lottery/model/lotteryStore.ts`)

```ts
import { useEffect, useState } from 'react';
import {
  MEDAL_CREATOR,
  initialMedals,
  sortMedalsByCreatedAtDesc,
  type MedalApp,
  type MedalDraft,
  type MedalRecord,
  type MedalStatus,
} from './medal';

let medals: MedalRecord[] = sortMedalsByCreatedAtDesc(initialMedals);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function __resetMedalStoreForTests() {
  medals = sortMedalsByCreatedAtDesc(initialMedals);
  emit();
}

export function listMedals() {
  return medals;
}

export function getMedal(id: string) {
  return medals.find((item) => item.id === id);
}

export function createMedal(draft: Omit<MedalDraft, 'app'> & { app: MedalApp }): MedalRecord {
  const record: MedalRecord = {
    id: `m-${Date.now()}`,
    name: draft.name.trim(),
    imageUrl: draft.imageUrl,
    app: draft.app,
    description: draft.description.trim(),
    status: '有效',
    creator: MEDAL_CREATOR,
    createdAt: nowStamp(),
  };
  medals = [record, ...medals];
  emit();
  return record;
}

export function updateMedal(id: string, patch: Partial<Pick<MedalRecord, 'name' | 'imageUrl' | 'app' | 'description'>>) {
  medals = medals.map((item) => (item.id === id ? { ...item, ...patch, name: patch.name?.trim() ?? item.name, description: patch.description?.trim() ?? item.description } : item));
  emit();
  return getMedal(id);
}

export function setMedalStatus(id: string, status: MedalStatus) {
  const current = getMedal(id);
  if (!current) return false;
  medals = medals.map((item) => (item.id === id ? { ...item, status } : item));
  emit();
  return true;
}

export function removeMedal(id: string) {
  const before = medals.length;
  medals = medals.filter((item) => item.id !== id);
  emit();
  return medals.length < before;
}

export function useMedals() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return medals;
}
```

- [ ] **Step 4: Tests PASS**

```bash
npm test -- src/features/medal/model/medalStore.test.ts
```

- [ ] **Step 5: Commit** if asked.

---

### Task 3: 列表页（先红后绿）

**Files:**
- Create: `src/features/medal/pages/MedalListPage.test.tsx`
- Create: `src/features/medal/pages/MedalListPage.tsx`
- Create: `src/features/medal/pages/MedalFormModal.tsx` (minimal stub first if list imports it; prefer implement modal in Task 4 and list opens it in Task 3 with a thin modal)

Implement list + modal together in Task 3–4. Task 3 list can import modal from Task 4; do Task 4 immediately after if compile needs the modal. **Order: write list tests that don't require modal markup; create button text is enough. Modal in Task 4.**

- [ ] **Step 1: Failing list test**

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetMedalStoreForTests } from '../model/medalStore';
import { MedalListPage } from './MedalListPage';

const noop = () => {};

describe('MedalListPage', () => {
  beforeEach(() => {
    __resetMedalStoreForTests();
  });

  it('renders heading, query fields, create action, columns and row actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <MedalListPage page="medal-list" onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('勋章管理');
    expect(html).toContain('创建勋章');
    expect(html).toContain('勋章名称');
    expect(html).toContain('所属应用');
    expect(html).toContain('勋章状态');
    expect(html).toContain('明星员工');
    expect(html).toContain('评优活动');
    expect(html).toContain('编辑');
    expect(html).toContain('发放记录');
    expect(html).toContain('设为失效');
    expect(html).toContain('删除');
    expect(html).toContain('后续开放');
  });
});
```

- [ ] **Step 2: Run FAIL**

```bash
npm test -- src/features/medal/pages/MedalListPage.test.tsx
```

- [ ] **Step 3: Implement `MedalListPage.tsx`**

Follow `src/features/skills-contest/pages/ContestListPage.tsx` toolbar (`Flex` 左共 N 条、右主按钮) and `src/features/lottery/pages/LotteryListPage.tsx` SearchPanel.

Props:

```ts
export function MedalListPage({
  page,
  recordId,
  onNavigate,
}: {
  page: string;
  recordId?: string;
  onNavigate: (nextPage: string, nextRecordId?: string) => void;
})
```

Behavior:

- `ListPageHeading` paths `['勋章', '勋章管理']`，subtitle `维护勋章素材，供活动、打卡等业务选用`
- `SearchPanel` 4 fields: 勋章名称 Input、所属应用 Select（全部+MEDAL_APPS）、勋章状态 Select（全部/有效/失效）、创建时间 RangePicker。Draft vs submitted query like lottery.
- `useMedals()` → `filterMedals` → `sortMedalsByCreatedAtDesc`
- Table columns per spec. Icon: `<img src={record.imageUrl} alt="" width={40} height={40} />`. Name/description: `TableEllipsisText`. Status: `Tag` color `success` / `default`. Empty description `—`.
- Row actions via `TableRowActions`: 编辑 → 发放记录 `disabled` + `tooltip: '后续开放'` + `onClick: () => {}` → 设为失效/有效 confirm → 删除 confirm danger.
- Create button `onNavigate('medal-create')`. Edit `onNavigate('medal-edit', id)`.
- Modal: `open={page === 'medal-create' || page === 'medal-edit'}`；`mode` create vs edit；edit `recordId` missing → `message.error('勋章不存在')` and `onNavigate('medal-list')`.
- `medal-detail`：不打开弹窗，只列表。
- Pagination `pageSize: 10`, `pageSizeOptions: ['10','20','50']`, `showSizeChanger: true`, `showTotal`.
- `scroll={{ x: 1100 }}`.
- Close modal: `onNavigate('medal-list')`.

Copy confirm copy:

- 失效：`确认将勋章「${name}」设为失效？` / `失效后业务侧将不可再发放该勋章。`
- 有效：对偶文案。
- 删除：`确认删除勋章「${name}」？` / `删除后不可恢复。` `okButtonProps: { danger: true }` `okText: '确认删除'`

If `MedalFormModal` does not exist yet, inline a comment and implement it in the same task so the project compiles — **implement Task 4 modal file in this step if needed, then Task 4 tests.**

- [ ] **Step 4: Tests PASS**

```bash
npm test -- src/features/medal/pages/MedalListPage.test.tsx
```

Tooltip on disabled 发放记录 must render `后续开放` in SSR (TableRowActions wraps Tooltip with `title` on span).

- [ ] **Step 5: Commit** if asked.

---

### Task 4: 创建/编辑弹窗

**Files:**
- Create: `src/features/medal/pages/MedalFormModal.tsx` (if not done)
- Create: `src/features/medal/pages/MedalFormModal.test.tsx`

- [ ] **Step 1: Failing test**

```ts
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MedalFormModal } from './MedalFormModal';
import { initialMedals } from '../model/medal';

describe('MedalFormModal', () => {
  it('renders create fields and cancel before save', () => {
    const html = renderToStaticMarkup(
      <App>
        <MedalFormModal open mode="create" onCancel={() => {}} onSaved={() => {}} />
      </App>,
    );
    expect(html).toContain('创建勋章');
    expect(html).toContain('勋章图片');
    expect(html).toContain('勋章名称');
    expect(html).toContain('所属应用');
    expect(html).toContain('勋章描述');
    expect(html).toContain('通用');
    expect(html).toContain('课发展');
    expect(html.indexOf('取消')).toBeLessThan(html.indexOf('保存'));
  });

  it('fills edit title from record', () => {
    const html = renderToStaticMarkup(
      <App>
        <MedalFormModal open mode="edit" record={initialMedals[0]} onCancel={() => {}} onSaved={() => {}} />
      </App>,
    );
    expect(html).toContain('编辑勋章');
    expect(html).toContain('明星员工');
  });
});
```

- [ ] **Step 2: Run FAIL if modal missing fields**

- [ ] **Step 3: Modal implementation**

- antd `Modal` `destroyOnHidden` `maskClosable` `open`
- Footer custom: `<Space><Button onClick={onCancel}>取消</Button><Button type="primary" loading={saving} onClick={submit}>保存</Button></Space>` aligned right (`footer` style `{ textAlign: 'right' }` or Flex justify end)
- Form layout `labelCol: { flex: '112px' }` `wrapperCol: { flex: 1 }` `colon`
- Upload square 96px, `beforeUpload` read as FileReader data URL, `maxCount={1}`, accept `.png,.jpeg,.jpg`
- Hint text: `支持 JPG、PNG 格式，建议尺寸 200×200`（与打卡 `MEDAL_ICON_HINT` 同文案，可本地常量，勿从 checkin 反向依赖）
- TextArea `maxLength={100}` `showCount`
- Select options `MEDAL_APPS`，create default `通用`
- Submit: `validateMedalDraft`；`form.setFields` errors；then `createMedal` / `updateMedal`；`message.success`；`onSaved`
- Do not include antd default footer buttons

- [ ] **Step 4: PASS both page tests**

```bash
npm test -- src/features/medal/pages
```

- [ ] **Step 5: Commit** if asked.

---

### Task 5: 接入 AdminApp

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Import and branch**

Add import next to other feature pages:

```ts
import { MedalListPage } from '../features/medal/pages/MedalListPage';
```

In the page ternary, **immediately before** `page === 'incentive-dashboard'`, insert:

```ts
          ) : page === 'medal-list' || page === 'medal-create' || page === 'medal-edit' || page === 'medal-detail' ? (
            <MedalListPage page={page} recordId={recordId} onNavigate={goToPage} />
```

Keep `incentive-dashboard` and `PlaceholderPage` as they are.

- [ ] **Step 2: Navigation tests still pass**

```bash
npm test -- src/app/navigation.test.ts src/features/medal
```

Expected: PASS. Medal hash cases unchanged.

- [ ] **Step 3: UI conformance**

```bash
python3 scripts/check_ui_conformance.py --root .
```

Expected: no new errors under `src/features/medal`. If the script flags Modal footer or query layout, fix to match skill (取消在保存左侧；SearchPanel 四字段收起)。

- [ ] **Step 4: Manual check**

`npm run dev` → 全部应用 → 勋章。确认：

- 查询三项 + 展开创建时间
- 工具栏右「创建勋章」，弹窗取消在左
- 行：编辑、发放记录禁用、设为失效、更多里删除
- `#/medal/medal-create` 打开创建弹窗；关弹窗回列表

- [ ] **Step 5: Commit** if asked.

```bash
git add src/app/App.tsx src/features/medal
git commit -m "$(cat <<'EOF'
feat(medal): add admin medal list and modal

Replace the placeholder 勋章管理 page with ListPage CRUD so operators can maintain badge assets.
EOF
)"
```

---

## Spec coverage

| Spec | Task |
|---|---|
| `features/medal` mock，不改活动库 | 1–2 |
| 列表四层 ListPage | 3 |
| 查询 4 项默认收起 | 3 SearchPanel |
| 工具栏共 N 条 + 创建 | 3 Contest 同款 Flex |
| 列与行操作顺序 | 3 |
| 发放记录禁用 Tooltip | 3 |
| Modal 取消→保存 | 4 |
| hash 开弹窗 | 3 + 5 |
| 创建时间倒序 | 1 sort + 2 create prepend |
| 分页 10/20/50 | 3 |
| URL 筛选 query | **不做**：与抽奖/打卡相同，hash 路由丢未知 query；本轮仅 hash 表达 create/edit |
| check_ui_conformance | 5 |
| 发放记录页 / 权限 / C 端 | 无任务 |
