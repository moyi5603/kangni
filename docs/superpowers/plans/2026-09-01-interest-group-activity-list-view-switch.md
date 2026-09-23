# 兴趣小组活动列表视图切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** B 端兴趣小组「活动管理」列表在表格与封面卡片之间切换，记住上次视图，卡片用「更多」做单条操作，批量勾选只留在列表。

**Architecture:** 视图读写抽到 `interestGroupActivityListView.ts`（localStorage key `interest-group-activity-list-view`）。`InterestGroupActivityListPage` 工具栏加 `Segmented`；筛选结果分页提升为受控 `page`/`pageSize`，两种视图共用。卡片网格是同 feature 组件，行操作由 `buildInterestGroupActivityRowActions` 一份函数供给表格列和卡片菜单。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Vitest（`renderToStaticMarkup`）、现有 `b2bStandards`。

**Spec:** `docs/superpowers/specs/2026-09-01-interest-group-activity-list-view-switch-design.md`

---

## File map

| File | Role |
|---|---|
| Create `src/features/interest-groups/model/interestGroupActivityListView.ts` | `list`/`card` 读写，非法值与无 storage 回落 `list` |
| Create `src/features/interest-groups/model/interestGroupActivityListView.test.ts` | 纯函数测试 |
| Create `src/features/interest-groups/components/InterestGroupActivityCardGrid.tsx` | 响应式图文卡 + 底部分页 + 「更多」菜单 |
| Create `src/features/interest-groups/components/buildInterestGroupActivityRowActions.ts` | 与现表格相同的动作数组 |
| Create `src/features/interest-groups/interestGroupActivityList.css` | 封面 2:1、标题单行、摘要两行 |
| Modify `src/features/interest-groups/pages/InterestGroupActivityListPage.tsx` | Segmented、受控分页、视图分支、切卡片清勾选 |
| Modify `src/features/interest-groups/pages/InterestGroupActivityListPage.test.tsx` | 默认列表回归 + 卡片/非法 storage |

不改：C 端、企业活动应用、`src/shared`、规范 JSON。

Commit 步骤仅在用户明确要求提交时执行；未要求则跳过所有 `git commit`。

---

### Task 1: 视图持久化纯函数

**Files:**
- Create: `src/features/interest-groups/model/interestGroupActivityListView.ts`
- Test: `src/features/interest-groups/model/interestGroupActivityListView.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_LIST_VIEW_KEY,
  readInterestGroupActivityListView,
  writeInterestGroupActivityListView,
} from './interestGroupActivityListView';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('interestGroupActivityListView', () => {
  it('defaults to list when missing, invalid, or storage throws', () => {
    expect(readInterestGroupActivityListView(memoryStorage())).toBe('list');
    expect(readInterestGroupActivityListView(memoryStorage({ [ACTIVITY_LIST_VIEW_KEY]: 'grid' }))).toBe('list');
    expect(
      readInterestGroupActivityListView({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('list');
  });

  it('reads and writes card', () => {
    const storage = memoryStorage();
    writeInterestGroupActivityListView('card', storage);
    expect(storage.getItem(ACTIVITY_LIST_VIEW_KEY)).toBe('card');
    expect(readInterestGroupActivityListView(storage)).toBe('card');
  });

  it('write swallows setItem errors', () => {
    expect(() =>
      writeInterestGroupActivityListView('list', {
        setItem: () => {
          throw new Error('quota');
        },
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/interest-groups/model/interestGroupActivityListView.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: Write minimal implementation**

```ts
export const ACTIVITY_LIST_VIEW_KEY = 'interest-group-activity-list-view';

export type InterestGroupActivityListView = 'list' | 'card';

type Readable = { getItem: (key: string) => string | null };
type Writable = { setItem: (key: string, value: string) => void };

export function readInterestGroupActivityListView(storage?: Readable): InterestGroupActivityListView {
  try {
    const source = storage ?? globalThis.localStorage;
    const value = source.getItem(ACTIVITY_LIST_VIEW_KEY);
    return value === 'card' ? 'card' : 'list';
  } catch {
    return 'list';
  }
}

export function writeInterestGroupActivityListView(view: InterestGroupActivityListView, storage?: Writable) {
  try {
    const target = storage ?? globalThis.localStorage;
    target.setItem(ACTIVITY_LIST_VIEW_KEY, view);
  } catch {
    /* private mode / quota */
  }
}
```

`read` 在 `localStorage` 未定义时也会进 `catch` → `list`。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/interest-groups/model/interestGroupActivityListView.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit（仅用户要求时）**

```bash
git add src/features/interest-groups/model/interestGroupActivityListView.ts src/features/interest-groups/model/interestGroupActivityListView.test.ts
git commit -m "$(cat <<'EOF'
feat(interest-groups): persist activity list view mode

EOF
)"
```

---

### Task 2: 列表页失败测试（开关 + 卡片 + 回落）

**Files:**
- Modify: `src/features/interest-groups/pages/InterestGroupActivityListPage.test.tsx`

页面测试是 SSR HTML。Node 下可能没有 `localStorage`，卡片用例必须在 render 前 stub。

- [ ] **Step 1: Append tests**（保留现有两个用例不动）

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { ACTIVITY_LIST_VIEW_KEY } from '../model/interestGroupActivityListView';

function stubListView(value: string | null) {
  const store = new Map<string, string>();
  if (value != null) store.set(ACTIVITY_LIST_VIEW_KEY, value);
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, next: string) => {
      store.set(key, next);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: localStorage });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});
```

现有 `renders heading...` 开头加 `stubListView(null)`，保证默认列表。或在 `describe` 里 `beforeEach(() => stubListView(null))`，卡片测试里再覆盖。

推荐：`beforeEach(() => stubListView(null))`，卡片测试内部先 `stubListView('card')`。

新增用例全文：

```ts
  it('shows view switch and table selection in list mode', () => {
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('aria-label="展示形式"');
    expect(html).toContain('ant-table');
    expect(html).toContain('ant-table-selection-column');
    expect(html).not.toContain('ig-activity-card-grid');
  });

  it('renders cover cards without row selection when view is card', () => {
    stubListView('card');
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('ig-activity-card-grid');
    expect(html).toContain('/activities/basketball.jpg');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('aria-label="展示形式"');
    expect(html).toContain('更多操作');
    expect(html).not.toContain('ant-table-selection-column');
    expect(html).not.toContain('class="ant-table');
  });

  it('falls back to table when stored view is invalid', () => {
    stubListView('grid');
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('ant-table');
    expect(html).not.toContain('ig-activity-card-grid');
  });

  it('hides group name on cards when embedded in group detail', () => {
    stubListView('card');
    const html = renderPage(<InterestGroupActivityListPage groupId={1} onNavigate={() => undefined} />);
    expect(html).toContain('ig-activity-card-grid');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).not.toContain('夏季共读三期');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/interest-groups/pages/InterestGroupActivityListPage.test.tsx`

Expected: 旧用例仍 PASS；新用例 FAIL（无「展示形式」、无 `ig-activity-card-grid`）。

- [ ] **Step 3: 先不实现页面**（TDD：下一 Task 再写）。本 Task 只提交测试文件如果用户要求 commit。

---

### Task 3: 行操作 builder

**Files:**
- Create: `src/features/interest-groups/components/buildInterestGroupActivityRowActions.ts`

从 `InterestGroupActivityListPage.tsx` 操作列里原样搬出动作顺序与 `can*` 判断。Handlers 由页面注入，builder 不直接调 `modal`/`message`。

- [ ] **Step 1: 实现**

```ts
import {
  canCloseInterestGroupSignup,
  canDeleteInterestGroupActivity,
  canPublishInterestGroupActivity,
  canReopenInterestGroupSignup,
  canReviewInterestGroupActivity,
  canRevokeInterestGroupActivity,
  canSubmitInterestGroupActivity,
  canTerminateInterestGroupActivity,
  revokeInterestGroupActivityBlockReason,
  type InterestGroupActivity,
} from '../model/interestGroupActivity';
import type { TableRowAction } from '../../../shared/ui/TableRowActions';

export function buildInterestGroupActivityRowActions(
  record: InterestGroupActivity,
  handlers: {
    onDetail: (record: InterestGroupActivity) => void;
    onEdit: (record: InterestGroupActivity) => void;
    onCopy: (record: InterestGroupActivity) => void;
    onSubmit: (record: InterestGroupActivity) => void;
    onReview: (record: InterestGroupActivity) => void;
    onRevoke: (record: InterestGroupActivity) => void;
    onPublish: (record: InterestGroupActivity) => void;
    onPin: (record: InterestGroupActivity) => void;
    onCloseSignup: (record: InterestGroupActivity) => void;
    onReopenSignup: (record: InterestGroupActivity) => void;
    onTerminate: (record: InterestGroupActivity) => void;
    onDelete: (record: InterestGroupActivity) => void;
  },
): TableRowAction[] {
  const statusAction: TableRowAction = canSubmitInterestGroupActivity(record)
    ? {
        key: 'submit',
        label: '提交审批',
        ariaLabel: `提交审批 ${record.title}`,
        onClick: () => handlers.onSubmit(record),
      }
    : canReviewInterestGroupActivity(record)
      ? {
          key: 'review',
          label: '审核',
          ariaLabel: `审核 ${record.title}`,
          onClick: () => handlers.onReview(record),
        }
      : record.publishStatus === '已发布'
        ? {
            key: 'revoke',
            label: '撤销',
            ariaLabel: `撤销 ${record.title}`,
            onClick: () => handlers.onRevoke(record),
            disabled: !canRevokeInterestGroupActivity(record),
            tooltip: revokeInterestGroupActivityBlockReason(record),
          }
        : {
            key: 'publish',
            label: '发布',
            ariaLabel: `发布 ${record.title}`,
            onClick: () => handlers.onPublish(record),
            disabled: !canPublishInterestGroupActivity(record),
            tooltip: canPublishInterestGroupActivity(record) ? undefined : '仅审批通过或无需审核的活动可以发布',
          };

  const actions: TableRowAction[] = [
    {
      key: 'detail',
      label: '详情',
      ariaLabel: `详情 ${record.title}`,
      onClick: () => handlers.onDetail(record),
    },
    {
      key: 'edit',
      label: '编辑',
      ariaLabel: `编辑 ${record.title}`,
      onClick: () => handlers.onEdit(record),
    },
    {
      key: 'copy',
      label: '复制',
      ariaLabel: `复制 ${record.title}`,
      onClick: () => handlers.onCopy(record),
    },
    statusAction,
    {
      key: 'pin',
      label: record.pinned ? '取消置顶' : '置顶',
      ariaLabel: record.pinned ? `取消置顶 ${record.title}` : `置顶 ${record.title}`,
      onClick: () => handlers.onPin(record),
    },
  ];
  if (canCloseInterestGroupSignup(record)) {
    actions.push({
      key: 'close-signup',
      label: '截止报名',
      ariaLabel: `截止报名 ${record.title}`,
      onClick: () => handlers.onCloseSignup(record),
    });
  }
  if (canReopenInterestGroupSignup(record)) {
    actions.push({
      key: 'reopen-signup',
      label: '恢复报名',
      ariaLabel: `恢复报名 ${record.title}`,
      onClick: () => handlers.onReopenSignup(record),
    });
  }
  if (canTerminateInterestGroupActivity(record)) {
    actions.push({
      key: 'terminate',
      label: '终止活动',
      ariaLabel: `终止活动 ${record.title}`,
      onClick: () => handlers.onTerminate(record),
      danger: true,
    });
  }
  actions.push({
    key: 'delete',
    label: '删除',
    ariaLabel: `删除 ${record.title}`,
    onClick: () => handlers.onDelete(record),
    danger: true,
    disabled: !canDeleteInterestGroupActivity(record),
    tooltip: canDeleteInterestGroupActivity(record) ? undefined : '已有人报名，无法删除',
  });
  return actions;
}
```

表格列改为 `return <TableRowActions moreAriaLabel={...} actions={buildInterestGroupActivityRowActions(record, handlers)} />`。`handlers` 在组件内用 `useMemo` 包一层稳定引用，依赖 `openDetail` 等函数。

本 Task 改完后旧列表测试仍应 PASS（操作文案顺序不变）。

Run: `npx vitest run src/features/interest-groups/pages/InterestGroupActivityListPage.test.tsx`

Expected: 两个旧用例 PASS；Task 2 新用例仍 FAIL。

---

### Task 4: 卡片网格 + CSS + 页面接入

**Files:**
- Create: `src/features/interest-groups/interestGroupActivityList.css`
- Create: `src/features/interest-groups/components/InterestGroupActivityCardGrid.tsx`
- Modify: `src/features/interest-groups/pages/InterestGroupActivityListPage.tsx`

- [ ] **Step 1: CSS**

```css
.ig-activity-card-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ig-activity-card-grid .ant-card-body {
  padding: 12px;
}

.ig-activity-card-cover {
  aspect-ratio: 2 / 1;
  margin: -12px -12px 12px;
  overflow: hidden;
  background: #f5f5f5;
  cursor: pointer;
  border: 0;
  padding: 0;
  display: block;
  width: calc(100% + 24px);
}

.ig-activity-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ig-activity-card-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: inherit;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  max-width: 100%;
  text-align: left;
}

.ig-activity-card-summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.45);
  min-height: 2.8em;
}

.ig-activity-card-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.ig-activity-card-grid .ig-activity-card-pagination {
  display: flex;
  justify-content: flex-end;
}
```

封面 `aspect-ratio: 2 / 1` 对应 `b2bStandards` `cards.mediaRatio` 2 : `contentRatio` 1。不要给卡片加装饰阴影（不用 `hoverable`）。

- [ ] **Step 2: Card grid component**

```tsx
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, Card, Col, Dropdown, Empty, Pagination, Row, Space, Tag, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { TableRowAction } from '../../../shared/ui/TableRowActions';
import {
  getInterestGroupLifecycleStatus,
  lifecycleStatusColor,
  type InterestGroupActivity,
  type InterestGroupAuditStatus,
} from '../model/interestGroupActivity';
import '../interestGroupActivityList.css';

const auditColor: Record<InterestGroupAuditStatus, string> = {
  待提交: 'default',
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
  无需审核: 'default',
};

function groupLabel(groupId: number | null, names: Map<number, string>) {
  if (groupId == null) return '未归属兴趣圈';
  return names.get(groupId) ?? '未归属兴趣圈';
}

function toMenuItems(actions: TableRowAction[]): MenuProps['items'] {
  const items: NonNullable<MenuProps['items']> = [];
  actions.forEach((action, index) => {
    if (action.danger && (index === 0 || !actions[index - 1]?.danger)) {
      items.push({ type: 'divider' });
    }
    const label = (
      <span aria-label={action.ariaLabel}>{action.label}</span>
    );
    items.push({
      key: action.key,
      disabled: action.disabled,
      danger: action.danger,
      label: action.tooltip ? <Tooltip title={action.tooltip}>{label}</Tooltip> : label,
      onClick: action.disabled ? undefined : () => action.onClick(),
    });
  });
  return items;
}

export function InterestGroupActivityCardGrid({
  activities,
  groupNames,
  hideGroupName,
  emptyDescription,
  page,
  pageSize,
  total,
  onPageChange,
  onOpenDetail,
  buildActions,
}: {
  activities: InterestGroupActivity[];
  groupNames: Map<number, string>;
  hideGroupName: boolean;
  emptyDescription: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onOpenDetail: (record: InterestGroupActivity) => void;
  buildActions: (record: InterestGroupActivity) => TableRowAction[];
}) {
  if (!activities.length && total === 0) {
    return <Empty description={emptyDescription} />;
  }
  return (
    <div className="ig-activity-card-grid">
      <Row gutter={[16, 16]}>
        {activities.map((record) => {
          const life = getInterestGroupLifecycleStatus(record);
          const time = `${record.startAt ?? ''} ~ ${record.endAt ?? ''}`;
          const summary = hideGroupName ? time : `${groupLabel(record.groupId, groupNames)}\n${time}`;
          const moreAriaLabel = `更多操作 ${record.title}`;
          return (
            <Col key={record.id} xs={24} sm={12} md={8} lg={6}>
              <Card size="small">
                <button type="button" className="ig-activity-card-cover" onClick={() => onOpenDetail(record)}>
                  {record.coverUrl ? <img src={record.coverUrl} alt="" /> : null}
                </button>
                <Space size={4} wrap>
                  {record.pinned ? <Tag color="blue">置顶</Tag> : null}
                  <Tag color={auditColor[record.auditStatus]}>{record.auditStatus}</Tag>
                  <Tag color={lifecycleStatusColor[life]}>{life}</Tag>
                </Space>
                <button
                  type="button"
                  className="ig-activity-card-title"
                  title={record.title}
                  onClick={() => onOpenDetail(record)}
                >
                  {record.title}
                </button>
                <Typography.Paragraph className="ig-activity-card-summary" title={summary}>
                  {hideGroupName ? time : `${groupLabel(record.groupId, groupNames)} ${time}`}
                </Typography.Paragraph>
                <div className="ig-activity-card-foot">
                  <Dropdown trigger={['click']} menu={{ items: toMenuItems(buildActions(record)) }}>
                    <Button type="link" aria-label={moreAriaLabel}>
                      更多
                    </Button>
                  </Dropdown>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
      <Pagination
        className="ig-activity-card-pagination"
        current={page}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={[...b2bStandards.table.pageSizeOptions]}
        showSizeChanger={b2bStandards.table.showSizeChanger}
        showTotal={(count) => `共 ${count} 条`}
        onChange={onPageChange}
      />
    </div>
  );
}

export const activityListViewSegmentedOptions = [
  { value: 'list' as const, icon: <UnorderedListOutlined />, label: '列表' },
  { value: 'card' as const, icon: <AppstoreOutlined />, label: '卡片' },
];
```

`activityListViewSegmentedOptions` 可放页面内，不必从 grid 导出。若放页面，grid 文件不要导入图标。

- [ ] **Step 3: Wire the list page**

Import：`Segmented`、`useState` 已有，加 `useEffect`；`AppstoreOutlined`、`UnorderedListOutlined`；view helpers；`InterestGroupActivityCardGrid`；`buildInterestGroupActivityRowActions`。

组件顶部：

```tsx
const [view, setView] = useState<InterestGroupActivityListView>(() => readInterestGroupActivityListView());
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(b2bStandards.table.pageSize);

const setListView = (next: InterestGroupActivityListView) => {
  setView(next);
  writeInterestGroupActivityListView(next);
  if (next === 'card') setSelectedRowKeys([]);
};

useEffect(() => {
  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  if (page > maxPage) setPage(maxPage);
}, [filtered.length, page, pageSize]);
```

`onSearch` 里 `setQuery(draft); setPage(1)`。`onReset` 同样 `setPage(1)`。切视图**不要** `setPage(1)`。

`handlers` 对象传给 builder。

工具栏 `Space` 最左插入：

```tsx
<Segmented
  aria-label="展示形式"
  value={view}
  options={[
    { value: 'list', icon: <UnorderedListOutlined />, label: '列表' },
    { value: 'card', icon: <AppstoreOutlined />, label: '卡片' },
  ]}
  onChange={(value) => setListView(value as InterestGroupActivityListView)}
/>
```

批量条条件改为 `view === 'list' && selectedRowKeys.length > 0`。

`view === 'list'` 渲染现 `Table`，分页改为受控：

```tsx
pagination={{
  current: page,
  pageSize,
  pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
  showSizeChanger: b2bStandards.table.showSizeChanger,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (nextPage, nextSize) => {
    setPage(nextPage);
    setPageSize(nextSize);
  },
}}
```

`view === 'card'`：

```tsx
<InterestGroupActivityCardGrid
  activities={filtered.slice((page - 1) * pageSize, page * pageSize)}
  groupNames={groupNames}
  hideGroupName={groupId != null}
  emptyDescription={hasQuery ? '没有匹配的活动' : '暂无活动'}
  page={page}
  pageSize={pageSize}
  total={filtered.length}
  onPageChange={(nextPage, nextSize) => {
    setPage(nextPage);
    setPageSize(nextSize);
  }}
  onOpenDetail={openDetail}
  buildActions={(record) => buildInterestGroupActivityRowActions(record, handlers)}
/>
```

卡片模式不要渲染 `Table`。

`auditColor` 若 grid 已复制，页面表格列继续用页面内那份，允许两处小 map，不必抽到 model。

- [ ] **Step 4: Run page tests**

Run: `npx vitest run src/features/interest-groups/pages/InterestGroupActivityListPage.test.tsx src/features/interest-groups/model/interestGroupActivityListView.test.ts`

Expected: 全部 PASS。

若卡片用例找不到 `更多操作`：Dropdown 的 `aria-label` 必须是 ``更多操作 ${title}``，与表格 `moreAriaLabel` 一致。

若找不到 `ant-table-selection-column`：以实际 SSR class 为准，可改断言为 `html.includes('ant-table-selection')`。先 `console` 一段 list HTML 里 checkbox 列 class，再锁断言。不要为了测试去改 antd 内部 class。

---

### Task 5: 规范检查与手工路径

- [ ] **Step 1: Tests + UI conformance**

Run:

```bash
npx vitest run src/features/interest-groups
python3 scripts/apply_standards.py --config .b2b/b2b-standards.json --check
python3 scripts/check_ui_conformance.py --root .
```

Expected: 测试绿；两套 python 打印通过。失败则修页面（禁止 `layout="vertical"`、Modal footer 已有不要动）。

- [ ] **Step 2: 浏览器**（有工具则打开兴趣小组 → 活动管理）

1. 默认表格 +「展示形式」在新建左侧。
2. 切卡片：封面网格、无勾选、无批量条。
3. 刷新仍是卡片。
4. 卡片点标题进详情；「更多」有编辑。
5. 切回列表，勾选出现批量条；再切卡片，批量条消失。
6. 小组详情 → 活动 Tab 同一套切换（共用 storage）。

无法开浏览器时：说明只做了 vitest + conformance。

---

## Spec coverage

| Spec | Task |
|---|---|
| Segmented 位置与 aria | 4 |
| 列表保持勾选/批量 | 4 |
| 卡片 4/3/2/1 列、2:1 封面、标题/摘要 | 4 CSS + Col |
| 审核+生命周期 Tag、置顶 | 4 |
| 封面/标题进详情；更多=全动作 | 3+4 |
| 切卡片清勾选 | 4 `setListView` |
| localStorage key 与回落 | 1+2+4 |
| 共用分页 | 4 受控 page |
| 空态 | 4 Empty |
| 不抽 shared、不改 C 端 | 遵守 file map |
| 测试 | 1、2、5 |

无 TBD。类型名全程 `InterestGroupActivityListView`、`ACTIVITY_LIST_VIEW_KEY`。
