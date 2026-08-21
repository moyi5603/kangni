# 活动详情页操作区 + 指标统计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 详情页 tab 上方加按钮区（编辑修改/复制创建/删除/截止报名）与 6 项指标统计行。

**Architecture:** 指标计算抽纯函数 `activityStats.ts`（TDD）；展示组件 `ActivityStatsRow.tsx` 自取 store 数据；复制创建复用 `activity-create/{id}` 路由，表单 create 模式识别 recordId 预填。

**Tech Stack:** React + antd Statistic + Vitest + dayjs。

**Spec:** `docs/superpowers/specs/2026-08-21-activity-detail-actions-stats-design.md`

**注意：** 全程不 git commit（用户未要求）。

---

### Task 1: `activityStats` 纯函数 + 单测

**Files:**
- Create: `src/features/activities/model/activityStats.ts`
- Test: `src/features/activities/model/activityStats.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { computeActivityStats } from './activityStats';
import type { CommentRecord, SignupRecord, SurveyRecord } from './related';
import type { MomentRecord } from './moment';
import type { SignupSetting } from './activity';

function signup(id: number, status: SignupRecord['status']): SignupRecord {
  return { id, activityId: 1, name: `用户${id}`, phone: '13800000000', signupType: '个人报名', department: '研发中心', status, createdAt: '2026-08-01 10:00:00' };
}

describe('computeActivityStats', () => {
  it('counts signups excluding 已取消, and 待审核 separately', () => {
    const stats = computeActivityStats({
      signups: [signup(1, '已通过'), signup(2, '待审核'), signup(3, '已取消'), signup(4, '待审核')],
      comments: [],
      moments: [],
      surveys: [],
      signupSettings: [],
    });
    expect(stats.signupCount).toBe(3);
    expect(stats.pendingSignupCount).toBe(2);
  });

  it('computes quota usage as rounded percent, null when quota unlimited', () => {
    const settings: SignupSetting[] = [
      { type: '个人报名', limit: 40, needAudit: false },
      { type: '团体报名', limit: 60, needAudit: false },
    ];
    const stats = computeActivityStats({
      signups: [signup(1, '已通过'), signup(2, '已通过'), signup(3, '待审核')],
      comments: [],
      moments: [],
      surveys: [],
      signupSettings: settings,
    });
    expect(stats.quotaUsage).toBe(3);

    const unlimited = computeActivityStats({
      signups: [signup(1, '已通过')],
      comments: [],
      moments: [],
      surveys: [],
      signupSettings: [{ type: '个人报名', limit: null, needAudit: false }],
    });
    expect(unlimited.quotaUsage).toBeNull();
  });

  it('sums comments, moments and survey responses', () => {
    const comments = [
      { id: 1, activityId: 1, content: '好', author: '张悦', createdAt: '2026-08-01 10:00:00', likedBy: [] },
      { id: 2, activityId: 1, content: '顶', author: '李明', parentId: 1, createdAt: '2026-08-01 11:00:00', likedBy: [] },
    ] satisfies CommentRecord[];
    const moments = [
      { id: 1, activityId: 1 },
      { id: 2, activityId: 1 },
      { id: 3, activityId: 1 },
    ] as unknown as MomentRecord[];
    const surveys = [
      { id: 1, activityId: 1, title: 'A', status: '已结束', responseCount: 126, collectStartAt: '', collectEndAt: '', createdAt: '' },
      { id: 2, activityId: 1, title: 'B', status: '收集中', responseCount: 18, collectStartAt: '', collectEndAt: '', createdAt: '' },
    ] satisfies SurveyRecord[];
    const stats = computeActivityStats({ signups: [], comments, moments, surveys, signupSettings: [] });
    expect(stats.commentCount).toBe(2);
    expect(stats.momentCount).toBe(3);
    expect(stats.surveyResponseCount).toBe(144);
  });

  it('returns zeros for empty inputs', () => {
    expect(computeActivityStats({ signups: [], comments: [], moments: [], surveys: [], signupSettings: [] })).toEqual({
      signupCount: 0,
      pendingSignupCount: 0,
      quotaUsage: null,
      commentCount: 0,
      momentCount: 0,
      surveyResponseCount: 0,
    });
  });
});
```

注意：`SignupSetting.limit` 类型若是 `number | undefined` 而非 `null`，测试里 `limit: null` 改 `limit: undefined`（先读 `activity.ts` 的 SignupSetting 定义对齐）。名单数据口径：分子含待审核+已通过+已驳回？按 spec——分子 = 状态≠已取消（同 signupCount），上面用例 3/100=3% 即此口径。

- [ ] **Step 2: 跑确认失败**

Run: `npm test -- src/features/activities/model/activityStats.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

```ts
import type { SignupSetting } from './activity';
import type { MomentRecord } from './moment';
import type { CommentRecord, SignupRecord, SurveyRecord } from './related';

export type ActivityStats = {
  signupCount: number;
  pendingSignupCount: number;
  quotaUsage: number | null;
  commentCount: number;
  momentCount: number;
  surveyResponseCount: number;
};

export function computeActivityStats(input: {
  signups: SignupRecord[];
  comments: CommentRecord[];
  moments: MomentRecord[];
  surveys: SurveyRecord[];
  signupSettings: SignupSetting[];
}): ActivityStats {
  const active = input.signups.filter((item) => item.status !== '已取消');
  const quota = input.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0);
  return {
    signupCount: active.length,
    pendingSignupCount: input.signups.filter((item) => item.status === '待审核').length,
    quotaUsage: quota > 0 ? Math.round((active.length / quota) * 100) : null,
    commentCount: input.comments.length,
    momentCount: input.moments.length,
    surveyResponseCount: input.surveys.reduce((sum, item) => sum + item.responseCount, 0),
  };
}
```

- [ ] **Step 4: 跑确认通过**（4 用例）

---

### Task 2: `ActivityStatsRow` 组件 + 详情页接线

**Files:**
- Create: `src/features/activities/components/ActivityStatsRow.tsx`
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`

- [ ] **Step 1: 组件**

```tsx
import { Card, Col, Row, Statistic } from 'antd';
import type { Activity } from '../model/activity';
import { computeActivityStats } from '../model/activityStats';
import { useMoments } from '../model/momentStore';
import { useRelated } from '../model/related';

export function ActivityStatsRow({ activity }: { activity: Activity }) {
  const signups = useRelated('signups', activity.id);
  const comments = useRelated('comments', activity.id);
  const surveys = useRelated('surveys', activity.id);
  const moments = useMoments(activity.id);
  const stats = computeActivityStats({ signups, comments, moments, surveys, signupSettings: activity.signupSettings });
  const items = [
    { title: '报名人数', value: stats.signupCount },
    { title: '待审核报名', value: stats.pendingSignupCount },
    { title: '报名额使用率', value: stats.quotaUsage === null ? '—' : `${stats.quotaUsage}%` },
    { title: '评论数', value: stats.commentCount },
    { title: '精彩瞬间数', value: stats.momentCount },
    { title: '问卷回收数', value: stats.surveyResponseCount },
  ];
  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col key={item.title} xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic title={item.title} value={item.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
```

（响应式：手机 2 列、平板 3 列、桌面 6 列。）

- [ ] **Step 2: 详情页接线**

`ActivityDetailPage.tsx`：import 组件，在按钮区（Task 3 建，当前先放标题行与 Tabs 之间）渲染 `<ActivityStatsRow activity={activity} />`。

- [ ] **Step 3: typecheck**

Run: `npx tsc --noEmit` — 0 错

---

### Task 3: 详情页按钮区

**Files:**
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`
- Modify: `src/app/App.tsx`（加 onCopy）

- [ ] **Step 1: props 加 onCopy**

```tsx
type ActivityDetailPageProps = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onCopy: (id: number) => void;
  onTabChange: (tab: DetailTab) => void;
};
```

App.tsx detail 分支加 `onCopy={(id) => goToPage('activity-create', String(id))}`。

- [ ] **Step 2: 按钮区独立行**

标题行 `Flex`（`detail-title-row`）右侧现有 `Space`（审核/提交审批/编辑/返回）整段移出，标题行只留左侧标题块。

标题行下新增：

```tsx
<Flex justify="end" gap={8} wrap="wrap">
  {showReview ? <Button type="primary" onClick={() => setReviewOpen(true)}>审核</Button> : null}
  {showSubmit ? <Button type="primary" onClick={submit}>提交审批</Button> : null}
  <Button onClick={() => onEdit(activity.id)}>编辑修改</Button>
  <Button onClick={() => onCopy(activity.id)}>复制创建</Button>
  {signupOpen ? <Button onClick={closeSignup}>截止报名</Button> : null}
  <Button danger onClick={remove}>删除</Button>
  <Button onClick={onBack}>返回</Button>
</Flex>
```

- [ ] **Step 3: 截止报名 + 删除逻辑**

组件内（import `patchActivities` from activityStore）：

```tsx
const signupOpen = !dayjs().isAfter(dayjs(activity.signupEndAt));

const closeSignup = () => {
  modal.confirm({
    title: `确认截止「${activity.title}」报名？`,
    content: '截止时间将改为现在，C 端立即不可报名。如需恢复，请在编辑页修改报名时间。',
    okText: '确认',
    cancelText: '取消',
    footer: (_, { OkBtn, CancelBtn }) => (<Space><OkBtn /><CancelBtn /></Space>),
    onOk: () => {
      patchActivities((list) =>
        list.map((item) => (item.id === activity.id ? { ...item, signupEndAt: dayjs().format('YYYY-MM-DD HH:mm') } : item)),
      );
      message.success(`已截止「${activity.title}」报名`);
    },
  });
};

const remove = () => {
  modal.confirm({
    title: `确认删除「${activity.title}」？`,
    content: '删除后不可恢复。',
    okText: '确认',
    cancelText: '取消',
    footer: (_, { OkBtn, CancelBtn }) => (<Space><OkBtn /><CancelBtn /></Space>),
    onOk: () => {
      patchActivities((list) => list.filter((item) => item.id !== activity.id));
      message.success(`已删除「${activity.title}」`);
      onBack();
    },
  });
};
```

- [ ] **Step 4: typecheck**

Run: `npx tsc --noEmit` — 0 错

---

### Task 4: 表单复制预填

**Files:**
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

- [ ] **Step 1: 抽映射函数 + copySource**

文件内（组件外）抽：

```tsx
function activityToFormValues(activity: Activity): Partial<FormValues> {
  return {
    coverUrl: activity.coverUrl,
    title: activity.title,
    type: activity.type,
    category: activity.category,
    tags: activity.tags,
    activityRange: toDateTimeRange(activity.startAt, activity.endAt),
    signupRange: toDateTimeRange(activity.signupStartAt, activity.signupEndAt),
    location: activity.location,
    organizer: activity.organizer,
    phone: activity.phone,
    detailHtml: activity.detailHtml,
    visibility: activity.visibility,
    departments: activity.departments,
    customPeople: activity.customPeople,
    visibilityMinSeniorityYears: activity.visibilityMinSeniorityYears,
    importFileName: activity.importFileName,
    signupSettings: activity.signupSettings,
    itinerary: activity.itinerary,
    extraFeeRule: activity.extraFeeRule,
  };
}
```

组件内：

```tsx
const editing = mode === 'edit' ? getActivity(Number(recordId)) : undefined;
const copySource = mode === 'create' && recordId ? getActivity(Number(recordId)) : undefined;
const typeOptions = useMemo(
  () => listCreatableTypeOptions(typeRules, mode === 'edit' ? editing?.type : copySource?.type),
  [typeRules, mode, editing?.type, copySource?.type],
);
```

initialValues 改：

```tsx
const initialValues = useMemo<Partial<FormValues>>(
  () =>
    editing
      ? activityToFormValues(editing)
      : copySource
        ? activityToFormValues(copySource)
        : { /* 现有新建默认原样保留 */ },
  [editing, copySource, typeRules],
);
```

- [ ] **Step 2: 周边引用带上 copySource**

- 封面的 `useEffect`（现依赖 editing）：`editing?.coverUrl ?? copySource?.coverUrl ?? ''`，importList 同理（`editing?.importFileName ?? copySource?.importFileName`），依赖数组加 copySource
- 分类/标签选项的兜底（`item.name === editing?.category`、`editing?.tags`）：加 copySource 兜底（`editing?.category ?? copySource?.category` 等）
- `isRecreation` fallback：`editing?.type ?? copySource?.type ?? '公司活动'`

- [ ] **Step 3: 手动验证点（写进报告）**

- `#/activities/activity-create/3` 打开：全部字段预填活动 3 数据，标题「新建活动」
- 保存生成新 id，状态为草稿/未发布（走新建默认）
- `#/activities/activity-create`（无 id）行为不变

- [ ] **Step 4: typecheck**

Run: `npx tsc --noEmit` — 0 错

---

### Task 5: 回归

- [ ] **Step 1:** `npm test -- src/features/activities src/app` — 全绿
- [ ] **Step 2:** `npx tsc --noEmit` — 0 错
- [ ] **Step 3:** `python3 scripts/check_ui_conformance.py --root .` — 通过
- [ ] **Step 4:** grep 确认无残留旧文案问题；手测清单：按钮区 7 按钮显示/权限逻辑、截止后 C 端「报名已截止」、删除后列表消失+旧 hash 未找到、复制预填完整、指标数字与名单 tab 一致

---

## Self-Review 记录

- Spec 覆盖：按钮 4 项（Task 3）、复制预填（Task 4）、指标 6 项（Task 1/2）、C 端不改（验证）✅
- 类型一致：`computeActivityStats` input 键、`ActivityStats` 字段、`onCopy` 签名前后一致 ✅
- 占位符：无 ✅
- 已知留白：`SignupSetting.limit` 空值形态（null/undefined）Task 1 Step 1 已指示先对齐类型；`useMoments` 已确认按 activityId 过滤并响应式 ✅
