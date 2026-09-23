# 报名 Tab 场次概况 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 周期/系列活动的报名 Tab 增加场次概况表与场次筛选；单次活动不变。

**Architecture:** 纯函数 `sessionSignupOverview.ts` 统计每场占用；活动 `SignupList` 与兴趣圈 `InterestGroupActivitySignupList` 共用行结构与点击筛选。名单实时统计，不写回 `session.signedCount`。

**Tech Stack:** React, TypeScript, Ant Design 6, Vitest

**Spec:** `docs/superpowers/specs/2026-08-31-signup-tab-session-overview-design.md`

**注意：** 用户未要求 git commit 时不要 commit。

---

## File map

| File | Role |
|---|---|
| Create `src/features/activities/model/sessionSignupOverview.ts` | 占用判定、状态映射、build 行、按场过滤 |
| Create `src/features/activities/model/sessionSignupOverview.test.ts` | 单测 |
| Modify `src/features/activities/pages/ActivityRelatedListPage.tsx` | `SignupList` UI |
| Modify `src/features/activities/pages/ActivityDetailPage.test.tsx` | 报名 Tab 断言（活动 2 是系列） |
| Modify `src/features/interest-groups/pages/InterestGroupActivitySignupList.tsx` | 兴趣圈报名 UI |
| Modify `src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx` | 报名 tab 场次概况 |

---

### Task 1: sessionSignupOverview 纯函数

**Files:**
- Create: `src/features/activities/model/sessionSignupOverview.ts`
- Create: `src/features/activities/model/sessionSignupOverview.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildSessionOverview,
  deriveClockSessionStatus,
  filterBySessionId,
  igStatusToOverview,
  occupiesSignupQuota,
} from './sessionSignupOverview';

describe('occupiesSignupQuota', () => {
  it('counts pending and approved only', () => {
    expect(occupiesSignupQuota('待审核')).toBe(true);
    expect(occupiesSignupQuota('已通过')).toBe(true);
    expect(occupiesSignupQuota('已驳回')).toBe(false);
    expect(occupiesSignupQuota('已取消')).toBe(false);
  });
});

describe('buildSessionOverview', () => {
  const sessions = [
    { id: 'a', startAt: '2026-09-01 09:00', endAt: '2026-09-01 18:00' },
    { id: 'b', startAt: '2026-09-02 09:00', endAt: '2026-09-02 18:00' },
  ];

  it('counts a multi-session signup on every picked session', () => {
    const rows = buildSessionOverview({
      sessions,
      quota: 10,
      statusOf: () => '未开始',
      signups: [{ status: '已通过', sessionIds: ['a', 'b'] }],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 'a', label: '第 1 场', signedCount: 1, pendingCount: 0, quota: 10 });
    expect(rows[1].signedCount).toBe(1);
  });

  it('counts pending in both signed and pending; ignores rejected', () => {
    const rows = buildSessionOverview({
      sessions,
      quota: null,
      statusOf: () => '未开始',
      signups: [
        { status: '待审核', sessionIds: ['a'] },
        { status: '已驳回', sessionIds: ['a'] },
      ],
    });
    expect(rows[0].signedCount).toBe(1);
    expect(rows[0].pendingCount).toBe(1);
    expect(rows[0].quota).toBeNull();
  });
});

describe('filterBySessionId', () => {
  it('keeps all when sessionId empty', () => {
    const rows = [{ sessionIds: ['a'] }, { sessionIds: ['b'] }];
    expect(filterBySessionId(rows, '', (item) => item.sessionIds)).toHaveLength(2);
  });

  it('keeps rows that include the session', () => {
    const rows = [{ sessionIds: ['a', 'b'] }, { sessionIds: ['b'] }];
    expect(filterBySessionId(rows, 'a', (item) => item.sessionIds).map((item) => item.sessionIds)).toEqual([['a', 'b']]);
  });
});

describe('status helpers', () => {
  it('maps ig status', () => {
    expect(igStatusToOverview('upcoming')).toBe('未开始');
    expect(igStatusToOverview('ongoing')).toBe('进行中');
    expect(igStatusToOverview('ended')).toBe('已结束');
    expect(igStatusToOverview('cancelled')).toBe('已取消');
  });

  it('derives clock status and cancelled after terminate', () => {
    const session = { startAt: '2026-09-10 09:00', endAt: '2026-09-10 18:00' };
    const now = new Date('2026-09-01T00:00:00').getTime();
    expect(deriveClockSessionStatus(session, now)).toBe('未开始');
    expect(deriveClockSessionStatus(session, now, '2026-09-01 12:00')).toBe('已取消');
    expect(deriveClockSessionStatus(session, new Date('2026-09-10T12:00:00').getTime())).toBe('进行中');
    expect(deriveClockSessionStatus(session, new Date('2026-09-11T00:00:00').getTime())).toBe('已结束');
  });
});
```

Terminate rule: if `terminatedAt` is set **and** `session.startAt >= terminatedAt` (ISO comparable as `YYYY-MM-DD HH:mm` strings work lexicographically), status `已取消`. Else clock. Align with `sessionsHeldAfterTerminate` in `activitySchedule.ts` (read it; cancelled = sessions that would be dropped).

- [ ] **Step 2:** `npx vitest run src/features/activities/model/sessionSignupOverview.test.ts` — FAIL missing module

- [ ] **Step 3: Implement**

`src/features/activities/model/sessionSignupOverview.ts`:

```ts
import type { ActivitySession } from './activitySchedule';
import { sessionsHeldAfterTerminate } from './activitySchedule';

export const sessionOverviewStatuses = ['未开始', '进行中', '已结束', '已取消'] as const;
export type SessionOverviewStatus = (typeof sessionOverviewStatuses)[number];

export type SessionOverviewInputSession = {
  id: string;
  startAt: string;
  endAt: string;
};

export type SessionOverviewSignup = {
  status: string;
  sessionIds: string[];
};

export type SessionOverviewRow = {
  id: string;
  label: string;
  startAt: string;
  endAt: string;
  status: SessionOverviewStatus;
  signedCount: number;
  pendingCount: number;
  quota: number | null;
};

export function occupiesSignupQuota(status: string): boolean {
  return status === '待审核' || status === '已通过';
}

export function igStatusToOverview(
  status: 'upcoming' | 'ongoing' | 'ended' | 'cancelled',
): SessionOverviewStatus {
  if (status === 'upcoming') return '未开始';
  if (status === 'ongoing') return '进行中';
  if (status === 'ended') return '已结束';
  return '已取消';
}

export function deriveClockSessionStatus(
  session: Pick<ActivitySession, 'startAt' | 'endAt'>,
  now: number,
  terminatedAt?: string,
): SessionOverviewStatus {
  if (terminatedAt) {
    const kept = sessionsHeldAfterTerminate([session], terminatedAt);
    if (!kept.length) return '已取消';
  }
  const start = new Date(session.startAt.replace(' ', 'T')).getTime();
  const end = new Date(session.endAt.replace(' ', 'T')).getTime();
  if (now < start) return '未开始';
  if (now > end) return '已结束';
  return '进行中';
}

export function buildSessionOverview(input: {
  sessions: SessionOverviewInputSession[];
  signups: SessionOverviewSignup[];
  quota: number | null;
  statusOf: (session: SessionOverviewInputSession, index: number) => SessionOverviewStatus;
}): SessionOverviewRow[] {
  return input.sessions.map((session, index) => {
    const related = input.signups.filter((item) => item.sessionIds.includes(session.id));
    const occupying = related.filter((item) => occupiesSignupQuota(item.status));
    return {
      id: session.id,
      label: `第 ${index + 1} 场`,
      startAt: session.startAt,
      endAt: session.endAt,
      status: input.statusOf(session, index),
      signedCount: occupying.length,
      pendingCount: occupying.filter((item) => item.status === '待审核').length,
      quota: input.quota != null && input.quota > 0 ? input.quota : null,
    };
  });
}

export function filterBySessionId<T>(
  rows: T[],
  sessionId: string,
  sessionIdsOf: (row: T) => string[],
): T[] {
  if (!sessionId) return rows;
  return rows.filter((row) => sessionIdsOf(row).includes(sessionId));
}

export function sessionSelectOptions(sessions: SessionOverviewInputSession[]): { value: string; label: string }[] {
  return [
    { value: '', label: '全部场次' },
    ...sessions.map((session, index) => ({
      value: session.id,
      label: `第 ${index + 1} 场 ${session.startAt} ~ ${session.endAt}`,
    })),
  ];
}

export function formatQuota(quota: number | null): string {
  return quota == null ? '—' : String(quota);
}
```

If `sessionsHeldAfterTerminate` generic needs `startAt` only, passing `{ startAt, endAt }` is fine.

- [ ] **Step 4:** run same vitest — PASS

---

### Task 2: 活动应用 SignupList

**Files:**
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx` (`SignupList` only)
- Modify: `src/features/activities/pages/ActivityDetailPage.test.tsx`

**Gotcha:** `SignupTab` uses activity **id=2 训练营（系列，3 场）**。概况工具栏会先出现 `共 3 场`，现有测试 `html.indexOf('共 ')` 会命中场次总数而不是人员「共 N 条」，必须改成 `共 ${filtered.length} 条` 或 `indexOf('共 ') 人员侧`. 用 `html.indexOf('条')` 配合导出按钮，或 `expect(html).toContain('共 3 场')` 且人员 `showTotal` 仍 `共 ${total} 条`。

- [ ] **Step 1: Tests**

In `Activity related tabs` describe:

```tsx
it('shows session overview for series camp and hides it for a one-off', () => {
  const series = renderToStaticMarkup(<App><SignupTab /></App>);
  expect(series).toContain('共 3 场');
  expect(series).toContain('第 1 场');
  expect(series).toContain('全部场次');
  expect(series).toContain('待审核');

  const onceActivity = useActivities().find((item) => item.id === 1);
  const once = renderToStaticMarkup(
    <App>{onceActivity ? <SignupList activity={onceActivity} /> : null}</App>,
  );
  expect(once).not.toContain('共 0 场');
  expect(once).not.toContain('全部场次');
  expect(once).not.toContain('共 3 场');
});
```

Fix the existing signup toolbar test: `const total = html.indexOf('共 ');` → find people toolbar. Example: `const total = html.indexOf('添加人员')` already compared after export. Change:

```tsx
const peopleTotal = html.indexOf('条'); // weak
```

Better: people toolbar is `共 {filtered.length} 条` — camp has many signups. Use:

```tsx
expect(html).toMatch(/共 \d+ 条/);
const total = html.search(/共 \d+ 条/);
```

`共 3 场` must not be used as `total`. Order: 共 3 场 (overview) then 共 N 条 (people) then 导出.

```tsx
const sessionTotal = html.indexOf('共 3 场');
const peopleTotal = html.search(/共 \d+ 条/);
expect(peopleTotal).toBeGreaterThan(sessionTotal);
expect(exportBtn).toBeGreaterThan(peopleTotal);
```

- [ ] **Step 2:** run ActivityDetailPage.test — FAIL missing 共 3 场

- [ ] **Step 3: Wire SignupList**

State add `sessionId: ''` on draft and query.

`needsSessionPick(activity.scheduleType)` → show session SearchField + overview table.

Import overview helpers, `needsSessionPick`, `parseSessionIds`, `resolveSignupRecordAnswers`, `lifecycleStatusColor` if Tag colors exist — use same `lifecycleStatusColor` from activity.ts for 未开始/进行中/已结束/已终止. Overview uses 已取消 not 已终止 — add Tag color: 已取消 `error` or reuse 已终止 color. Check `lifecycleStatusColor` keys. If no 已取消, map 已取消 → same as 已终止 (`error`).

```ts
const quota = activity.signupSettings[0]?.limit ?? 0;
const overview = needsPick
  ? buildSessionOverview({
      sessions: activity.sessions ?? [],
      quota,
      statusOf: (session) => deriveClockSessionStatus(session, Date.now(), activity.terminatedAt),
      signups: data.map((item) => ({
        status: item.status,
        sessionIds: parseSessionIds(resolveSignupRecordAnswers(item)['场次']),
      })),
    })
  : [];
```

People `filtered` also `filterBySessionId(..., query.sessionId, ...)`.

Overview UI between SearchPanel and people Card. `SignupList` uses `RelatedTable` — put overview **inside** `query` after SearchPanel, or above RelatedTable as fragment:

Look at `RelatedTable` props (`query`, `toolbar`, `table`). Easiest: wrap return:

```tsx
<>
  <SearchPanel>...</SearchPanel>
  {needsPick ? (
    <Card className="list-table-card">
      <div className="table-toolbar"><Typography.Text>共 {overview.length} 场</Typography.Text></div>
      <Table
        rowKey="id"
        size="small"
        dataSource={overview}
        pagination={{ pageSize: b2bStandards.table.pageSize, showTotal: (n) => `共 ${n} 场` }}
        onRow={(record) => ({
          onClick: () => {
            const next = query.sessionId === record.id ? '' : record.id;
            setDraft((d) => ({ ...d, sessionId: next }));
            setQuery((q) => ({ ...q, sessionId: next }));
            setSelectedRowKeys([]);
          },
        })}
        rowClassName={(record) => (query.sessionId === record.id ? 'ant-table-row-selected' : '')}
        columns={[
          { title: '场次', dataIndex: 'label', width: 90 },
          { title: '活动时间', render: (_, r) => `${r.startAt} ~ ${r.endAt}` },
          { title: '状态', dataIndex: 'status', width: 110, render: (v) => <Tag>{v}</Tag> },
          { title: '报名人数', dataIndex: 'signedCount', width: 100, align: 'right' },
          { title: '名额', dataIndex: 'quota', width: 90, align: 'right', render: formatQuota },
          { title: '待审核', dataIndex: 'pendingCount', width: 90, align: 'right' },
        ]}
        locale={{ emptyText: <Empty description="暂无场次" /> }}
      />
    </Card>
  ) : null}
  <RelatedTable query={null or leftover filters} ... />
```

Read `RelatedTable` — if `query` is required, keep SearchPanel in `query` and insert overview **cannot** sit between query and toolbar unless RelatedTable supports extra slot.

**Read `RelatedTable` in the same file.** If it is:

```tsx
function RelatedTable({ query, toolbar, batch, table, modal }) {
  return (
    <>
      {query}
      <Card>
        toolbar, batch, table
      </Card>
      {modal}
    </>
  );
}
```

Then pass `query={<> <SearchPanel/> {overviewCard} </>}` so overview sits between search and people card. **Do this.**

Session Select inside SearchPanel after 报名时间:

```tsx
{needsSessionPick(activity.scheduleType) ? (
  <SearchField label="场次">
    <Select
      allowClear
      placeholder="全部场次"
      value={draft.sessionId || undefined}
      onChange={(value) => setDraft((d) => ({ ...d, sessionId: value ?? '' }))}
      options={sessionSelectOptions(activity.sessions ?? [])}
    />
  </SearchField>
) : null}
```

`allowClear` maps to 全部. Options include `{ value: '', label: '全部场次' }` — antd Select empty value + allowClear is enough; **do not** duplicate empty option if allowClear. Spec wants visible「全部场次」. Use `options={sessionSelectOptions}` with `value=""` option, `allowClear={false}`, placeholder 全部场次, value `draft.sessionId`.

Reset sessionId to `''`.

Cursor on overview rows: `style={{ cursor: 'pointer' }}` via onRow.

- [ ] **Step 4:** `npx vitest run src/features/activities/pages/ActivityDetailPage.test.tsx` PASS

---

### Task 3: 兴趣圈报名列表

**Files:**
- Modify: `src/features/interest-groups/pages/InterestGroupActivitySignupList.tsx`
- Modify: `src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx`

Activity 101 is recurring with many sessions. Signup tab test `shows signup list without status or actions` — still no 人员表 状态/操作. Overview **will** contain 状态 / 待审核. Assertions `not.toContain('>状态<')` **will fail**. Change to: people table has no 操作; overview may have 状态. Use `expect(html).not.toContain('批量通过')` keep. For 状态: `expect(html).not.toContain('批量通过')` and drop `>状态<` ban, or scope: people columns still 姓名 部门 场次 报名时间.

```tsx
expect(html).toContain('共 '); // 场
expect(html).toContain('全部场次');
expect(html).toContain('第 1 场');
expect(html).not.toContain('操作');
expect(html).not.toContain('批量通过');
```

If `操作` appears in 更多 elsewhere, header of people table should not have 操作. Overview has no 操作.

- [ ] **Step 1: Tests** — 101 signup tab contains `共 ` and `场`, `全部场次`, `待审核`; still 李明; `not.toContain('批量通过')`.

- [ ] **Step 2:** run IG detail test — FAIL

- [ ] **Step 3: Wire** `needsSessionPick(activity.type)` (IG type is once/recurring/series same union).

```tsx
const [draft, setDraft] = useState({ name: '', sessionId: '' });
const overview = needsSessionPick(activity.type)
  ? buildSessionOverview({
      sessions: activity.sessions ?? [],
      quota: null, // per-session capacity in statusOf/quota map
      statusOf: (session, index) => igStatusToOverview(activity.sessions[index].status),
      signups: signups
        .filter((item) => item.activityId === activity.id)
        .map((item) => ({ status: item.status, sessionIds: item.sessionId ? [item.sessionId] : [] })),
    })
  : [];
```

Quota is **per session** for IG. Extend `buildSessionOverview` in Task 1 if needed:

**If Task 1 quota is a single number, Task 3 must pass per-row quota.** Update `buildSessionOverview` to:

```ts
quotaOf?: (session, index) => number | null;
// if quotaOf provided, use it; else input.quota
```

Do this in Task 1 already to avoid churn:

```ts
quotaOf?: (session: SessionOverviewInputSession, index: number) => number | null;
```

In `buildSessionOverview` row quota = `input.quotaOf?.(session, index) ?? (input.quota != null && input.quota > 0 ? input.quota : null)`.

Task 1 tests: activity-style uses `quota: 10`. IG-style:

```ts
quotaOf: (_s, i) => (i === 0 ? 24 : 0)
```

Add one test in Task 1 for quotaOf. If Task 1 already merged without quotaOf, add it at start of Task 3 and extend tests.

Overview click + Select same as activity.

Per-session quota: `quotaOf: (s) => { const cap = activity.sessions.find(x => x.id === s.id)?.capacity; return cap && cap > 0 ? cap : null }`

- [ ] **Step 4:** `npx vitest run src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx` PASS

---

### Task 4: 回归

```bash
npx vitest run \
  src/features/activities/model/sessionSignupOverview.test.ts \
  src/features/activities/pages/ActivityDetailPage.test.tsx \
  src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx
```

Expected: PASS

Manual: 训练营报名 Tab 3 场；点第 2 场人表过滤；再点取消。夜跑 101 概况可翻页。春季开放日无概况。

---

## Spec coverage

| Spec | Task |
|---|---|
| 纯函数多选计入每场、驳回不占额 | 1 |
| 单次无概况 | 2 once test |
| 活动 SignupList 筛+表 | 2 |
| 兴趣圈 101 分页/概况 | 3 |
| 点行筛选、再点清除 | 2–3 onRow |
| 待审核两边都有 | 2–3 columns |
| 不写回 signedCount | 不写 store |
| Header 指标不改 | 不碰 Header |
