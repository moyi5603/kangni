# 活动详情 Header 统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 活动应用与兴趣圈应用的活动详情 Tab 上方 Header 共用同一骨架；封面保持原图比例，不裁成方图。

**Architecture:** 新增展示型 `ActivityDetailHeader`（封面、标签、标题+操作 slot、5 行摘要、指标 slot）。两个详情页只传入数据与按钮，不把两边 store 揉进壳里。封面 CSS 只挂在 `.activity-detail-header-card` 下，避免改到兴趣圈「圈子详情」封面。

**Tech Stack:** React, TypeScript, Ant Design 6, Vitest `renderToStaticMarkup`

**Spec:** `docs/superpowers/specs/2026-08-31-activity-detail-header-unify-design.md`

**注意：** 用户未要求 git commit 时不要 commit。

---

## File map

| File | Role |
|---|---|
| Create `src/shared/ui/ActivityDetailHeader.tsx` | Header 壳 |
| Create `src/shared/ui/ActivityDetailHeader.test.tsx` | 骨架 / 封面 class 单测 |
| Modify `src/styles.css` | 封面比例、占位 16:9、header 顶对齐 |
| Modify `src/features/activities/pages/ActivityDetailPage.tsx` | 改用壳 |
| Modify `src/features/activities/pages/ActivityDetailPage.test.tsx` | 断言顺序与封面 |
| Modify `src/features/activities/components/ActivityStatsRow.tsx` | 指标：公共三项在左 |
| Modify `src/features/interest-groups/pages/InterestGroupActivityDetailPage.tsx` | 改用壳；终止隐藏；Modal 确认 |
| Modify `src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx` | Header / 终止 / 指标 |

不改：详情 Tab Descriptions、C 端、列表、`InterestGroupDetailPage`（圈子封面）。

---

### Task 1: ActivityDetailHeader 壳 + 封面 CSS

**Files:**
- Create: `src/shared/ui/ActivityDetailHeader.tsx`
- Create: `src/shared/ui/ActivityDetailHeader.test.tsx`
- Modify: `src/styles.css`（`.activity-detail-header-*` / `.activity-detail-cover-*` 中与 header 卡相关的规则）

- [ ] **Step 1: Write failing tests**

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityDetailHeader } from './ActivityDetailHeader';

describe('ActivityDetailHeader', () => {
  it('renders cover, tags, title row, five facts, then metrics', () => {
    const html = renderToStaticMarkup(
      <ActivityDetailHeader
        coverUrl="https://example.com/cover.jpg"
        coverAlt="活动封面"
        tags={[{ text: '运动健身' }, { text: '进行中', color: 'processing' }]}
        title="示例活动"
        actions={<button type="button">编辑</button>}
        facts={[
          { label: '活动时间', value: '2026-09-01 09:00 ~ 2026-09-01 18:00' },
          { label: '报名时间', value: '2026-08-01 ~ 2026-08-31' },
          { label: '活动地点', value: '大厅' },
          { label: '报名截止时间', value: '2026-08-31 18:00' },
          { label: '活动终止时间', value: '—' },
        ]}
        metrics={<div>报名人数 3</div>}
      />,
    );
    const cover = html.indexOf('activity-detail-cover');
    const tags = html.indexOf('运动健身');
    const titleRow = html.indexOf('activity-detail-title-row');
    const fact = html.indexOf('活动时间：');
    const metrics = html.indexOf('activity-detail-header-metrics');
    expect(cover).toBeGreaterThan(-1);
    expect(tags).toBeGreaterThan(cover);
    expect(titleRow).toBeGreaterThan(tags);
    expect(fact).toBeGreaterThan(titleRow);
    expect(metrics).toBeGreaterThan(fact);
    expect(html).toContain('activity-detail-header-card');
    expect(html).toContain('activity-detail-header-actions');
  });

  it('uses 16:9 placeholder when cover is missing', () => {
    const html = renderToStaticMarkup(
      <ActivityDetailHeader
        coverAlt="活动封面"
        tags={[]}
        title="无封面"
        actions={null}
        facts={[]}
        metrics={null}
      />,
    );
    expect(html).toContain('activity-detail-cover-placeholder');
    expect(html).toContain('暂无封面');
    expect(html).toContain('activity-detail-cover-placeholder is-wide');
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
npx vitest run src/shared/ui/ActivityDetailHeader.test.tsx
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: Implement shell**

`src/shared/ui/ActivityDetailHeader.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Card, Flex, Image, Space, Tag, Typography } from 'antd';

export type ActivityDetailHeaderTag = {
  text: string;
  color?: string;
};

export type ActivityDetailHeaderFact = {
  label: string;
  value: string;
};

export function ActivityDetailHeader({
  coverUrl,
  coverAlt,
  tags,
  title,
  actions,
  facts,
  metrics,
}: {
  coverUrl?: string;
  coverAlt: string;
  tags: ActivityDetailHeaderTag[];
  title: string;
  actions: ReactNode;
  facts: ActivityDetailHeaderFact[];
  metrics: ReactNode;
}) {
  return (
    <Card className="activity-detail-header-card">
      <Flex align="flex-start" gap={16} className="activity-detail-header-main" wrap>
        <div className="activity-detail-cover-wrap">
          {coverUrl ? (
            <Image src={coverUrl} alt={coverAlt} className="activity-detail-cover" />
          ) : (
            <div className="activity-detail-cover-placeholder is-wide">暂无封面</div>
          )}
        </div>
        <div className="activity-detail-header-copy">
          <Flex className="activity-detail-title-row" justify="space-between" align="flex-start" gap={16} wrap>
            <div className="activity-detail-title-block">
              {tags.length ? (
                <Space wrap size={[8, 8]}>
                  {tags.map((tag) => (
                    <Tag key={tag.text} color={tag.color}>
                      {tag.text}
                    </Tag>
                  ))}
                </Space>
              ) : null}
              <Typography.Title level={3} style={{ marginTop: tags.length ? 8 : 0, marginBottom: 0 }}>
                {title}
              </Typography.Title>
            </div>
            {actions ? <Space wrap className="activity-detail-header-actions">{actions}</Space> : null}
          </Flex>
          {facts.map((fact) => (
            <Typography.Text key={fact.label} type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {fact.label}：{fact.value}
            </Typography.Text>
          ))}
          {metrics ? <div className="activity-detail-header-metrics">{metrics}</div> : null}
        </div>
      </Flex>
    </Card>
  );
}
```

Fix fact `marginTop`: first fact `marginTop: 8`, later `4`. Use index:

```tsx
{facts.map((fact, index) => (
  <Typography.Text
    key={fact.label}
    type="secondary"
    style={{ display: 'block', marginTop: index === 0 ? 8 : 4 }}
  >
    {fact.label}：{fact.value}
  </Typography.Text>
))}
```

- [ ] **Step 4: CSS — 仅 header 卡内封面保比例**

把现有

```css
.activity-detail-cover-wrap .activity-detail-cover,
.activity-detail-cover-wrap .activity-detail-cover-placeholder {
  width: 100%;
  height: 100%;
  ...
}
.activity-detail-cover-wrap .activity-detail-cover .ant-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  ...
}
```

改成（兴趣圈圈子详情仍用旧 wrap 时不要被方图化的话：新规则加 `.activity-detail-header-card` 前缀）：

```css
.activity-detail-header-main {
  flex: 1;
  min-width: 0;
  align-items: flex-start;
}
.activity-detail-header-card .activity-detail-cover-wrap {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
}
.activity-detail-header-card .activity-detail-cover.ant-image {
  display: block;
  width: 100%;
  max-width: 240px;
}
.activity-detail-header-card .activity-detail-cover .ant-image-img {
  width: 100%;
  height: auto;
  max-height: 180px;
  object-fit: contain;
  object-position: center top;
  display: block;
  border-radius: 8px;
}
.activity-detail-header-card .activity-detail-cover-placeholder.is-wide {
  width: 240px;
  height: 135px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #8c8c8c;
  font-size: 13px;
}
```

保留圈子详情用的旧 `.activity-detail-cover-wrap`（可继续 cover），不要删光全局规则除非确认圈子页要一起变。**本次只给 header 卡加 contain 规则。**

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/shared/ui/ActivityDetailHeader.test.tsx
```

Expected: PASS

---

### Task 2: 活动详情页接入壳 + 指标顺序

**Files:**
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`
- Modify: `src/features/activities/pages/ActivityDetailPage.test.tsx`
- Modify: `src/features/activities/components/ActivityStatsRow.tsx`

- [ ] **Step 1: Update ActivityDetailPage tests first**

在 `keeps one primary action...` 里追加：

```tsx
expect(html).toContain('activity-detail-header-card');
expect(html).toContain('活动时间：');
expect(html).toContain('报名时间：');
expect(html).toContain('活动地点：');
const header = html.slice(html.indexOf('activity-detail-header-card'), html.indexOf('ant-tabs'));
expect(header.indexOf('分类') === -1 || true).toBe(true); // 不要靠这个；用 tag 文本顺序：
const cat = header.indexOf('公司活动'); // recordId 1 的分类，先打开 activity mock 确认 id=1 category
```

先读 `initialActivities` id=1 的 `category`、`title`。用真实种子断言：

```tsx
const header = html.slice(html.indexOf('activity-detail-header-card'), html.indexOf('ant-tabs'));
expect(header.indexOf('活动时间：')).toBeGreaterThan(header.indexOf('activity-detail-title-row'));
expect(header).toContain('报名人数');
expect(header).toContain('评论数');
expect(header).toContain('精彩瞬间数');
expect(html).not.toMatch(/activity-detail-header-card[\s\S]*object-fit: cover/);
```

封面是 class 不是 inline style。断言占位或 Image class 即可。id=1 若有 coverUrl：`expect(header).toContain('activity-detail-cover')`。

不可终止的活动（如春季员工开放日 id=1 若已结束）：`expect(html).not.toContain('aria-label="终止活动"')`。进行中训练营 id=2：`expect(html).toContain('aria-label="终止活动"')`。以 `canTerminateActivity` 与种子为准，写测试前用 store 种子核对。

- [ ] **Step 2: Run, expect FAIL** if header 仍 stretch / IG 结构混在活动页（活动页可能已接近，以断言失败为准）

```bash
npx vitest run src/features/activities/pages/ActivityDetailPage.test.tsx
```

- [ ] **Step 3: Replace header JSX**

`ActivityDetailPage.tsx`：删掉现有 `<Card className="activity-detail-header-card">...</Card>`，改为：

```tsx
import { ActivityDetailHeader } from '../../../shared/ui/ActivityDetailHeader';

function dash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function auditTagColor(status: string): string | undefined {
  if (status === '已驳回') return 'error';
  if (status === '待审核') return 'warning';
  return 'default';
}

const headerTags = [
  { text: activity.category },
  { text: lifecycleStatus, color: lifecycleStatusColor[lifecycleStatus] },
  ...(activity.auditStatus !== '已通过' && activity.auditStatus !== '无需审核'
    ? [{ text: activity.auditStatus, color: auditTagColor(activity.auditStatus) }]
    : []),
];

<ActivityDetailHeader
  coverUrl={activity.coverUrl}
  coverAlt="活动封面"
  tags={headerTags}
  title={activity.title}
  actions={
    <>
      {showReview ? (
        <Button type="primary" aria-label="审核" onClick={() => setReviewOpen(true)}>审核</Button>
      ) : showSubmit ? (
        <Button type="primary" aria-label="提交审批" onClick={submit}>提交审批</Button>
      ) : (
        <Button type="primary" aria-label="编辑" onClick={() => onEdit(activity.id)}>编辑</Button>
      )}
      {showReview || showSubmit ? (
        <Button aria-label="编辑" onClick={() => onEdit(activity.id)}>编辑</Button>
      ) : null}
      <Button aria-label="复制创建" onClick={() => onCopy(activity.id)}>复制创建</Button>
      {activity.checkInEnabled ? (
        <Button aria-label="签到码" onClick={() => changeTab('checkin')}>签到码</Button>
      ) : null}
      {canCloseSignup ? (
        <Button aria-label="截止报名" onClick={closeSignup}>截止报名</Button>
      ) : null}
      {canReopenSignup ? (
        <Button aria-label="恢复报名" onClick={reopenSignup}>恢复报名</Button>
      ) : null}
      {canTerminateActivity(activity) ? (
        <Button danger aria-label="终止活动" onClick={terminate}>终止活动</Button>
      ) : null}
      <Button danger aria-label="删除" onClick={remove}>删除</Button>
    </>
  }
  facts={[
    { label: '活动时间', value: formatActivityTime(activity) },
    { label: '报名时间', value: formatActivitySignupTime(activity) },
    { label: '活动地点', value: dash(activity.location) },
    { label: '报名截止时间', value: dash(activity.signupEndAt) },
    { label: '活动终止时间', value: dash(activity.terminatedAt) },
  ]}
  metrics={<ActivityStatsRow activity={activity} embedded />}
/>
```

活动应用删除保持现有：恒可点（无 `canDelete`）。不要加禁用。

- [ ] **Step 4: Reorder ActivityStatsRow items**

```tsx
const items: { title: string; value: string | number; suffix?: string }[] = [
  {
    title: '报名人数',
    value: stats.signupCount,
    suffix: signupTotalLimit > 0 ? `/ ${signupTotalLimit}` : undefined,
  },
  { title: '评论数', value: stats.commentCount },
  { title: '精彩瞬间数', value: stats.momentCount },
  { title: '待审核报名', value: stats.pendingSignupCount },
  {
    title: '报名额使用率',
    value: stats.quotaUsage === null ? '—' : stats.quotaUsage,
    suffix: stats.quotaUsage === null ? undefined : '%',
  },
  { title: '平均分', value: ratingAverage === null ? '—' : ratingAverage.toFixed(1) },
  { title: '评分人数', value: activityRatingCount(activity.id) },
];
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/features/activities/pages/ActivityDetailPage.test.tsx src/features/activities/components/ActivityStatsRow.test.tsx
```

Expected: PASS

---

### Task 3: 兴趣圈活动详情接入壳

**Files:**
- Modify: `src/features/interest-groups/pages/InterestGroupActivityDetailPage.tsx`
- Modify: `src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx`

- [ ] **Step 1: Failing tests**

在 `renders header and default detail tab` 追加：

```tsx
expect(html).toContain('activity-detail-title-row');
expect(html).toContain('activity-detail-header-actions');
expect(html).toContain('ant-statistic');
expect(html).toContain('报名人数');
expect(html).toContain('点赞');
expect(html).not.toContain('aria-label="终止活动"'); // 101 夜跑为未开始
const header = html.slice(html.indexOf('activity-detail-header-card'), html.indexOf('ant-tabs'));
expect(header.indexOf('所属兴趣圈')).toBe(-1);
expect(header).toContain('活动时间：');
expect(html).toContain('所属兴趣圈'); // 仍在详情 Tab
```

另加一条进行中连营（id=201）可见终止：

```tsx
it('shows terminate only when in progress', () => {
  const html = renderPage(
    <InterestGroupActivityDetailPage recordId="201" onBack={() => undefined} onEdit={() => undefined} onTabChange={() => undefined} />,
  );
  expect(html).toContain('aria-label="终止活动"');
  expect(html).not.toContain('活动开始后方可终止');
});
```

有报名的 101：删除按钮 `disabled`：

```tsx
expect(html).toContain('已有人报名，无法删除');
```

（Tooltip 在 SSR 可能把 title 写在按钮包装上，若没有则断言 `disabled` + `aria-label` 或 class `ant-btn-disabled`。）

- [ ] **Step 2: Run, expect FAIL**（终止仍常驻禁用 / 指标不是 Statistic / 无 title-row）

```bash
npx vitest run src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx
```

- [ ] **Step 3: Wire header**

Import `ActivityDetailHeader`、`Statistic`、`Row`、`Col`。删除 `Popconfirm` 终止/删除（删除改 Modal，与活动页一致）。

`confirmFooter` 抄活动详情（Cancel 在左、Ok 在右，与活动页 `ActivityDetailPage` 的 `confirmFooter` 对齐；若活动页已是 Cancel→Ok 则两边相同）。

终止：

```tsx
const terminate = () => {
  modal.confirm({
    title: `确认终止「${activity.title}」？`,
    content: '未举办场次不再进行，且不可恢复为进行中。',
    okText: '确认',
    cancelText: '取消',
    footer: confirmFooter,
    okButtonProps: { danger: true },
    onOk: () => {
      const result = terminateInterestGroupActivity(activity.id);
      if (!result.ok) {
        message.warning('当前状态不可终止');
        return;
      }
      message.success(`已终止「${activity.title}」`);
    },
  });
};
```

删除：可删才 `modal.confirm`；渲染时 `deletable` 用 Tooltip+disabled，可删用 Button danger `aria-label="删除"` + confirm。

操作 JSX：

```tsx
<>
  <Button type="primary" aria-label="编辑" onClick={() => onEdit(activity.id)}>编辑</Button>
  {onCopy ? <Button aria-label="复制创建" onClick={() => onCopy(activity.id)}>复制创建</Button> : null}
  {activity.checkInEnabled ? (
    <Button aria-label="签到码" onClick={() => changeTab('checkin')}>签到码</Button>
  ) : null}
  {canCloseSignup ? <Button aria-label="截止报名" onClick={closeSignup}>截止报名</Button> : null}
  {canReopenSignup ? <Button aria-label="恢复报名" onClick={reopenSignup}>恢复报名</Button> : null}
  {terminable ? (
    <Button danger aria-label="终止活动" onClick={terminate}>终止活动</Button>
  ) : null}
  {deletable ? (
    <Button danger aria-label="删除" onClick={remove}>删除</Button>
  ) : (
    <Tooltip title="已有人报名，无法删除">
      <Button danger disabled aria-label="删除">删除</Button>
    </Tooltip>
  )}
</>
```

`remove` 改为先 `modal.confirm`（与活动页文案 `确认删除「${title}」？` / `删除后不可恢复。`），`onOk` 再调 `deleteInterestGroupActivity`。

Tags：

```tsx
[
  { text: getInterestGroupCategoryLabel(activity.categoryKey, categories) },
  { text: lifecycleStatus, color: lifecycleStatusColor[lifecycleStatus] },
  ...(activity.auditStatus !== '已通过' && activity.auditStatus !== '无需审核'
    ? [{ text: activity.auditStatus, color: activity.auditStatus === '已驳回' ? 'error' : activity.auditStatus === '待审核' ? 'warning' : 'default' }]
    : []),
]
```

Facts 五条，函数用现有 `formatInterestGroupActivityTime` / `formatInterestGroupSignupTime`。

Metrics：

```tsx
<Row gutter={16}>
  <Col xs={12} sm={8} md={6} lg={3}>
    <Statistic title="报名人数" value={activity.signedCount} suffix={activity.capacity ? `/ ${activity.capacity}` : undefined} />
  </Col>
  <Col xs={12} sm={8} md={6} lg={3}>
    <Statistic title="评论数" value={activityComments.length} />
  </Col>
  <Col xs={12} sm={8} md={6} lg={3}>
    <Statistic title="精彩瞬间数" value={activityMoments.length} />
  </Col>
  <Col xs={12} sm={8} md={6} lg={3}>
    <Statistic title="点赞" value={activity.likeCount} />
  </Col>
</Row>
```

截止/恢复确认补 `footer: confirmFooter`（与活动页一致）。

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx
```

Expected: PASS。若 201 种子不是进行中，改用 `canTerminateInterestGroupActivity` 为 true 的 id（查 `interestGroupActivity.ts` seeds）。

---

### Task 4: 回归

- [ ] **Step 1:**

```bash
npx vitest run \
  src/shared/ui/ActivityDetailHeader.test.tsx \
  src/features/activities/pages/ActivityDetailPage.test.tsx \
  src/features/activities/components/ActivityStatsRow.test.tsx \
  src/features/interest-groups/pages/InterestGroupActivityDetailPage.test.tsx
```

Expected: PASS (all)

- [ ] **Step 2: 手工（有 dev server）**

打开活动详情、兴趣圈活动详情：封面非方裁切；标签顺序分类→生命周期→审核；操作与标题同行；兴趣圈未开始无终止按钮；指标 Statistic。

---

## Spec coverage

| Spec | Task |
|---|---|
| 骨架封面\|标签\|标题+操作\|5 行摘要\|指标 | 1–3 |
| 封面原比例 / contain / 16:9 占位 / 不 stretch | 1 |
| 标签顺序 | 2, 3 |
| 操作顺序、终止隐藏、删除禁用 | 2, 3 |
| 指标公共三项 + 扩展 | 2（StatsRow）, 3 |
| 所属兴趣圈不进 Header | 3 测试 |
| 详情 Tab / 列表不改 | 不碰 |
| 圈子详情封面不被误伤 | 1 CSS 前缀 `.activity-detail-header-card` |
