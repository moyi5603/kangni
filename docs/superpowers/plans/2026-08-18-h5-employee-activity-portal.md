# H5 员工活动门户 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 H5 活动页重构为员工活动门户，突出活动发现、报名和“我的报名”主链路，同时保持 PC 与后台页面不变。

**Architecture:** 保留现有活动模型、内存报名 store 和 hash 路由。新增 H5 专用卡片与“我的报名”页面，扩展纯函数处理报名分组；首页、详情、报名页通过 `H5ActivityShell` 共用移动端框架。新视觉 token 只挂在 H5 壳内，避免改变 PC。

**Tech Stack:** React 19、TypeScript 5.9、Vite 7、Vitest、现有独立 CSS；H5 不使用 Ant Design。

---

## File map

- Modify: `package.json` — 增加 Vitest 测试命令与开发依赖。
- Create: `src/app/navigation.test.ts` — H5 “我的报名”路由测试。
- Modify: `src/app/navigation.ts` — 解析与生成 `#/c/h5/my`。
- Modify: `src/app/App.tsx` — 将 H5 子页面信息传给 C 端入口。
- Modify: `src/app/CEndApp.tsx` — 挂载“我的报名”页面。
- Create: `src/features/c-end/activities/model/clientActivity.test.ts` — 报名分组与限额规则测试。
- Modify: `src/features/c-end/activities/model/clientActivity.ts` — 报名类型去重、限额和报名记录分组纯函数。
- Modify: `src/features/c-end/activities/model/signupStore.ts` — 暴露当前用户全部报名记录与响应式 hook。
- Modify: `src/features/c-end/activities/h5/H5ActivityShell.tsx` — 支持门户自定义页头及标准详情页头。
- Create: `src/features/c-end/activities/h5/H5ActivityCards.tsx` — 推荐卡和活动列表卡。
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx` — 重组门户首页。
- Create: `src/features/c-end/activities/h5/H5MySignups.tsx` — “我的报名”分组页。
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx` — 重排详情信息与固定 CTA。
- Modify: `src/features/c-end/activities/components/Icons.tsx` — 补充页面所需图标。
- Modify: `src/features/c-end/activities/styles.css` — H5 视觉系统、门户、卡片、报名页和详情样式。

目录当前不是 Git 仓库。执行期间不创建提交；如用户之后初始化 Git，再单独请求提交。

### Task 1: 建立测试入口并扩展 H5 路由

**Files:**
- Modify: `package.json`
- Create: `src/app/navigation.test.ts`
- Modify: `src/app/navigation.ts:229-250`
- Modify: `src/app/App.tsx:106-117`
- Modify: `src/app/CEndApp.tsx:9-29`

- [ ] **Step 1: 安装测试依赖并增加测试命令**

Run:

```bash
npm install --save-dev vitest
```

在 `package.json` 的 `scripts` 中加入：

```json
"test": "vitest run"
```

Expected: `package.json` 和 `package-lock.json` 更新，Vitest 使用包管理器解析出的最新兼容版本。

- [ ] **Step 2: 写失败路由测试**

创建 `src/app/navigation.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { parseCEndHash, toH5MySignupsHash } from './navigation';

describe('H5 C-end routes', () => {
  it('parses the my-signups page without treating it as an invalid activity id', () => {
    expect(parseCEndHash('#/c/h5/my')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'my',
    });
  });

  it('keeps numeric activity detail routes unchanged', () => {
    expect(parseCEndHash('#/c/h5/21')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 21,
    });
  });

  it('generates the my-signups hash', () => {
    expect(toH5MySignupsHash()).toBe('#/c/h5/my');
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: FAIL，因为 `toH5MySignupsHash` 和 `h5Page` 尚不存在。

- [ ] **Step 4: 实现路由类型与解析**

将 C 端路由类型改为：

```ts
export type H5Page = 'my';

export type CEndLocation =
  | { kind: 'admin' }
  | { kind: 'c-end'; surface: CEndSurface; activityId?: number; h5Page?: H5Page };
```

在 `parseCEndHash` 数字 id 解析前处理 `my`：

```ts
if (surface === 'h5' && rawId === 'my') {
  return { kind: 'c-end', surface, h5Page: 'my' };
}
```

增加导航函数：

```ts
export function toH5MySignupsHash(): string {
  return '#/c/h5/my';
}

export function goH5MySignups() {
  window.location.hash = toH5MySignupsHash();
}
```

给 `CEndAppProps` 增加 `h5Page?: H5Page`，并由 `App` 传入：

```tsx
return (
  <CEndApp
    surface={cEnd.surface}
    activityId={cEnd.activityId}
    h5Page={cEnd.h5Page}
  />
);
```

本任务先只传递类型；页面挂载在 Task 5 完成。

- [ ] **Step 5: 运行路由测试**

Run:

```bash
npm test -- src/app/navigation.test.ts
```

Expected: 3 tests PASS。

### Task 2: 用纯函数定义报名限额与记录分组

**Files:**
- Create: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.ts:121-135`
- Modify: `src/features/c-end/activities/model/signupStore.ts:1-55`

- [ ] **Step 1: 写失败规则测试**

创建 `src/features/c-end/activities/model/clientActivity.test.ts`，复用活动种子并覆盖变化字段：

```ts
import { describe, expect, it } from 'vitest';
import { initialActivities } from '../../../activities/model/activity';
import type { ClientSignup } from './signupStore';
import {
  groupClientSignups,
  signupLimit,
  signupTypes,
} from './clientActivity';

const base = initialActivities[0];

describe('client activity signup helpers', () => {
  it('deduplicates signup types and sums configured limits', () => {
    const activity = {
      ...base,
      signupSettings: [
        { type: '个人报名', limit: 20, needAudit: false },
        { type: ' 个人报名 ', limit: 20, needAudit: true },
        { type: '家庭报名', limit: 10, needAudit: false },
      ],
    };

    expect(signupTypes(activity)).toEqual(['个人报名', '家庭报名']);
    expect(signupLimit(activity)).toBe(50);
  });

  it('returns undefined when no signup setting has a limit', () => {
    expect(
      signupLimit({
        ...base,
        signupSettings: [{ type: '个人报名', needAudit: false }],
      }),
    ).toBeUndefined();
  });

  it('groups active, ended, and missing activities deterministically', () => {
    const signups: ClientSignup[] = [
      {
        activityId: 101,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-18 10:00',
      },
      {
        activityId: 102,
        name: '陈产品',
        phone: '13800001111',
        type: '家庭报名',
        status: '已通过',
        createdAt: '2026-08-17 10:00',
      },
      {
        activityId: 999,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-16 10:00',
      },
    ];
    const visible = [
      { ...base, id: 101, activityStatus: '进行中' as const },
      { ...base, id: 102, activityStatus: '已结束' as const },
    ];

    const result = groupClientSignups(signups, visible);
    expect(result.upcoming.map((item) => item.signup.activityId)).toEqual([101]);
    expect(result.ended.map((item) => item.signup.activityId)).toEqual([102, 999]);
    expect(result.ended[1].activity).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm test -- src/features/c-end/activities/model/clientActivity.test.ts
```

Expected: FAIL，因为三个目标函数尚未完整实现。

- [ ] **Step 3: 实现去重、限额与分组**

在 `clientActivity.ts` 导入 `ClientSignup`，实现：

```ts
export function signupTypes(activity: Activity): string[] {
  return [...new Set(activity.signupSettings.map((item) => item.type.trim()).filter(Boolean))];
}

export function signupLimit(activity: Activity): number | undefined {
  const limits = activity.signupSettings
    .map((item) => item.limit)
    .filter((limit): limit is number => typeof limit === 'number');
  return limits.length ? limits.reduce((sum, limit) => sum + limit, 0) : undefined;
}

export type ClientSignupView = {
  signup: ClientSignup;
  activity?: Activity;
};

export function groupClientSignups(
  signups: ClientSignup[],
  activities: Activity[],
): { upcoming: ClientSignupView[]; ended: ClientSignupView[] } {
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const views = signups
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((signup) => ({ signup, activity: activityById.get(signup.activityId) }));

  return {
    upcoming: views.filter(({ activity }) => activity && activity.activityStatus !== '已结束'),
    ended: views.filter(({ activity }) => !activity || activity.activityStatus === '已结束'),
  };
}
```

- [ ] **Step 4: 扩展响应式报名 store**

在 `signupStore.ts` 增加不可变快照和 hook：

```ts
export function getUserSignups(phone = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  return signups.filter((item) => item.phone === phone);
}

export function useUserSignups(phone = DEMO_SIGNUP_USER.phone): ClientSignup[] {
  const [records, setRecords] = useState(() => getUserSignups(phone));
  useEffect(() => {
    const onChange = () => setRecords(getUserSignups(phone));
    onChange();
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [phone]);
  return records;
}
```

- [ ] **Step 5: 运行规则测试与类型检查**

Run:

```bash
npm test -- src/features/c-end/activities/model/clientActivity.test.ts
npx tsc -b --pretty false
```

Expected: tests PASS；TypeScript 无错误。

### Task 3: 重构 H5 壳与活动卡片

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityShell.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityCards.tsx`
- Modify: `src/features/c-end/activities/components/Icons.tsx`

- [ ] **Step 1: 扩展壳接口**

将 `H5ActivityShellProps` 调整为：

```ts
type H5ActivityShellProps = {
  title?: string;
  onBack?: () => void;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  detail?: boolean;
};
```

壳内页头选择规则：

```tsx
{header ?? (
  <header className="c-h5-top">
    {onBack ? (
      <button className="c-icon-btn" type="button" aria-label="返回" onClick={onBack}>
        <IconBack />
      </button>
    ) : (
      <span className="c-icon-btn" aria-hidden />
    )}
    <h1 className="c-h5-title">{title}</h1>
    <span className="c-icon-btn" aria-hidden />
  </header>
)}
```

- [ ] **Step 2: 增加推荐卡与列表卡**

创建 `H5ActivityCards.tsx`，导出：

```ts
type ActivityCardProps = {
  activity: Activity;
  signedUp?: boolean;
  onOpen: () => void;
};

export function H5FeaturedActivityCard(props: ActivityCardProps): JSX.Element;
export function H5ActivityListCard(props: ActivityCardProps): JSX.Element;
```

推荐卡必须包含：

```tsx
<button className="c-h5-feature-card c-card-btn" type="button" onClick={onOpen}>
  <div className="c-h5-feature-cover">
    {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
    <span className="c-h5-type-chip">{activity.type}</span>
    <div className="c-h5-feature-overlay">
      <StatusPill status={activity.activityStatus} />
      <h3>{activity.title}</h3>
      <ActivityMeta activity={activity} compact />
      <span className="c-h5-card-action">{signedUp ? '已报名' : '查看并报名'}</span>
    </div>
  </div>
</button>
```

列表卡使用整卡按钮，包含 16:9 封面、类型/置顶标签、标题、`ActivityMeta`、限额和 CTA 状态。限额通过 `signupLimit(activity)` 获取；不要显示点赞、收藏和评论数字。

- [ ] **Step 3: 增加语义图标**

在 `Icons.tsx` 添加 `IconUser`、`IconTicket`、`IconCalendar`，全部复用 `SvgIcon`，保持 `aria-hidden`：

```tsx
export function IconUser() {
  return (
    <SvgIcon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />
    </SvgIcon>
  );
}
```

- [ ] **Step 4: 类型检查**

Run:

```bash
npx tsc -b --pretty false
```

Expected: 无 TypeScript 错误。

### Task 4: 重组员工活动首页

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`

- [ ] **Step 1: 替换首页结构**

首页状态继续保留 `tab`，新增：

```tsx
const signups = useUserSignups();
const signedIds = useMemo(
  () => new Set(signups.map((signup) => signup.activityId)),
  [signups],
);
const featured = useMemo(
  () => featuredActivities(activities).slice(0, FEATURED_LIMIT),
  [activities],
);
const list = useMemo(
  () => filterByTab(activities, tab),
  [activities, tab],
);
```

传给壳的门户页头：

```tsx
header={
  <header className="c-h5-portal-head">
    <button className="c-h5-brand-back" type="button" onClick={goAdminWorkbench}>
      <IconBack />
      <span>
        <small>你好，陈产品</small>
        <strong>员工活动</strong>
      </span>
    </button>
    <button className="c-h5-my-entry" type="button" onClick={goH5MySignups}>
      <IconTicket />
      <span>我的报名</span>
      <b>{signups.length}</b>
    </button>
  </header>
}
```

正文按以下顺序组装：

1. 推荐模块：标题“正在报名”，横滑渲染 `H5FeaturedActivityCard`。
2. 分类模块：标题“发现活动”，渲染现有 `CLIENT_TABS`。
3. 列表：渲染 `H5ActivityListCard`，传入 `signedIds.has(activity.id)`。
4. 空态：`暂无相关活动`。

- [ ] **Step 2: 移除首页旧依赖**

删除 `SocialRow`、`StatusPill`、`IconFire`、`IconHorn` 和 `toClientActivity` 的首页 import；卡片信息改由新卡片组件处理。

- [ ] **Step 3: 类型检查**

Run:

```bash
npx tsc -b --pretty false
```

Expected: 无 TypeScript 错误。

### Task 5: 新增“我的报名”并挂载路由

**Files:**
- Create: `src/features/c-end/activities/h5/H5MySignups.tsx`
- Modify: `src/app/CEndApp.tsx`

- [ ] **Step 1: 创建报名记录页**

`H5MySignups` 读取：

```tsx
const activities = useActivities();
const signups = useUserSignups();
const groups = useMemo(
  () => groupClientSignups(signups, clientVisibleActivities(activities)),
  [activities, signups],
);
```

页面用标准壳：

```tsx
<H5ActivityShell title="我的报名" onBack={() => goCEnd('h5')}>
  {signups.length === 0 ? (
    <div className="c-h5-signup-empty">
      <IconTicket />
      <h2>还没有报名活动</h2>
      <p>去看看最近有哪些活动值得参加</p>
      <button className="c-btn c-btn-primary" type="button" onClick={() => goCEnd('h5')}>
        去看看活动
      </button>
    </div>
  ) : (
    <>
      <SignupGroup title="待参加" items={groups.upcoming} />
      <SignupGroup title="已结束" items={groups.ended} />
    </>
  )}
</H5ActivityShell>
```

`SignupGroup` 使用 `section > ul > li`。有效活动记录整卡可点并进入详情；失效记录使用非按钮卡片，显示“活动已失效”和报名类型。

- [ ] **Step 2: 在 CEndApp 挂载页面**

H5 分支改为：

```tsx
surface === 'h5' ? (
  h5Page === 'my' ? (
    <H5MySignups />
  ) : activityId == null ? (
    <H5ActivityHome />
  ) : (
    <H5ActivityDetail id={activityId} />
  )
) : activityId == null ? (
  <PcActivityHome />
) : (
  <PcActivityDetail id={activityId} />
);
```

- [ ] **Step 3: 运行路由测试与类型检查**

Run:

```bash
npm test -- src/app/navigation.test.ts
npx tsc -b --pretty false
```

Expected: 路由测试 PASS；TypeScript 无错误。

### Task 6: 重排 H5 活动详情

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`

- [ ] **Step 1: 增加详情核心信息**

保留现有失效态、报名 Sheet、动态 Sheet 和 CTA 状态逻辑。将有效详情正文调整为：

```tsx
<div className="c-detail-cover">
  {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
</div>
<article className="c-h5-detail">
  <div className="c-h5-detail-heading">
    <div className="c-detail-tags">
      <StatusPill status={activity.activityStatus} />
      <span className="c-h5-type-chip">{activity.type}</span>
    </div>
    <h2 className="c-detail-name">{activity.title}</h2>
  </div>
  <section className="c-h5-info-card" aria-label="活动信息">
    <ActivityMeta activity={activity} />
    <div className="c-h5-info-row">发起人：{activity.organizer}</div>
    <a className="c-h5-info-row" href={`tel:${activity.phone}`}>
      联系电话：{activity.phone}
    </a>
    {signupLimit(activity) != null ? (
      <div className="c-h5-info-row">报名限额：{signupLimit(activity)} 人</div>
    ) : null}
  </section>
  <section className="c-h5-detail-section">
    <h2>活动介绍</h2>
    <div className="c-html" dangerouslySetInnerHTML={{ __html: activity.detailHtml }} />
  </section>
  {/* 疗休养行程、额外费用规则及 MomentFeed 保持现有条件和行为 */}
</article>
```

避免在 JSX 中重复调用 `signupLimit`：组件顶部计算 `const limit = signupLimit(activity)`，实际渲染使用 `limit`。

- [ ] **Step 2: 检查 CTA 和安全区结构**

保留：

```tsx
footer={
  <div className="c-h5-cta-bar">
    <button className="c-cta" type="button" disabled={!cta.enabled} onClick={() => setSheetOpen(true)}>
      {cta.label}
    </button>
  </div>
}
```

确认按钮禁用时不会打开 Sheet；正文由 CSS 增加 CTA 避让空间。

- [ ] **Step 3: 类型检查**

Run:

```bash
npx tsc -b --pretty false
```

Expected: 无 TypeScript 错误。

### Task 7: 落地 H5 专属视觉系统

**Files:**
- Modify: `src/features/c-end/activities/styles.css:311-628`
- Modify: `src/features/c-end/activities/styles.css:884-1163`

- [ ] **Step 1: 将新 token 限定在 H5 壳**

在 `.c-h5-shell` 设置：

```css
.c-h5-shell {
  --c-primary: #16324f;
  --c-accent: #14b8a6;
  --c-warning: #f59e0b;
  --c-orange: var(--c-accent);
  --c-bg: #f4f7fa;
  --c-card: #fff;
  --c-text: #14213d;
  --c-muted: #65758b;
  --c-radius: 16px;
  min-height: 100vh;
  background: #dfe7ef;
}
```

不要修改 `.c-end` 的原有橙色 token，确保 PC 保持原视觉。

- [ ] **Step 2: 实现门户页头与推荐卡**

加入完整布局约束：

```css
.c-h5-portal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(18px + env(safe-area-inset-top)) 18px 16px;
  background: linear-gradient(145deg, #16324f, #224d72);
  color: #fff;
}

.c-h5-brand-back,
.c-h5-my-entry {
  min-height: 48px;
  border: 0;
  color: inherit;
}

.c-h5-feature-strip {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  margin: 0 -18px;
  padding: 0 18px 6px;
  list-style: none;
  scrollbar-width: none;
}

.c-h5-feature-strip > li {
  flex: 0 0 88%;
  scroll-snap-align: start;
}

.c-h5-feature-cover {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  background: #dbe3ea;
}

.c-h5-feature-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 18px;
  color: #fff;
  background: linear-gradient(to top, rgb(5 20 34 / 90%), rgb(5 20 34 / 15%) 70%);
}
```

- [ ] **Step 3: 实现分类、列表与报名页**

新增 `.c-h5-section-head`、`.c-h5-list`、`.c-h5-list-card`、`.c-h5-list-cover`、`.c-h5-signup-group`、`.c-h5-signup-card`、`.c-h5-signup-empty`。必须满足：

```css
.c-h5-main {
  flex: 1;
  overflow: visible;
  padding: 18px 18px 32px;
}

.c-h5-list,
.c-h5-signup-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.c-h5-list-card,
.c-h5-signup-card {
  width: 100%;
  overflow: hidden;
  border: 0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(22 50 79 / 8%);
  color: inherit;
  text-align: left;
}

.c-h5-list-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #dbe3ea;
}
```

所有按钮触控高度不小于 44px。320px 宽度下页头允许文字收缩，禁止页面横向滚动。

- [ ] **Step 4: 实现详情分区与 CTA**

详情样式：

```css
.c-h5-main.is-detail {
  padding: 0 0 92px;
}

.c-h5-detail {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.c-h5-info-card,
.c-h5-detail-section {
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  box-shadow: 0 8px 24px rgb(22 50 79 / 6%);
}

.c-h5-cta-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: rgb(255 255 255 / 94%);
  border-top: 1px solid #e7edf3;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  backdrop-filter: blur(12px);
}

.c-h5-shell .c-cta,
.c-h5-shell .c-btn-primary {
  background: var(--c-accent);
}
```

保留 MomentFeed 与 Sheet 现有行为；只调整间距、边框色和 H5 token，不改变 PC 对应类。

- [ ] **Step 5: 检查移动端 CSS**

Run:

```bash
npm run build
```

Expected: 构建成功，无 CSS 语法错误。

### Task 8: 全量验证与回归

**Files:**
- Verify only

- [ ] **Step 1: 运行自动化测试**

Run:

```bash
npm test
```

Expected: 路由与报名规则测试全部 PASS。

- [ ] **Step 2: 运行构建**

Run:

```bash
npm run build
```

Expected: `tsc -b && vite build` 成功退出。

- [ ] **Step 3: 运行项目规范检查**

Run:

```bash
npm run check:standards
```

Expected: 成功退出；若出现既有问题，记录原始错误并确认本次文件未新增诊断。

- [ ] **Step 4: 手工验收核心路径**

启动：

```bash
npm run dev
```

依次验证：

1. `#/c/h5` 显示门户页头、推荐活动、分类和大图列表。
2. 切换每个分类，列表只显示对应已发布活动。
3. 推荐卡和列表卡进入正确详情，详情返回首页。
4. 报名成功后详情 CTA 变“已报名”，首页“我的报名”数量更新。
5. `#/c/h5/my` 将记录归入待参加或已结束，点有效记录进入详情。
6. 直接打开不存在 id 显示活动失效态。
7. 320px、375px、430px 视口无横向滚动，底部 CTA 不遮挡正文。
8. `#/c/pc` 首页与详情布局、颜色和报名行为无回归。

- [ ] **Step 5: 检查编辑文件诊断**

使用 IDE diagnostics 检查本计划所有新增与修改的 TypeScript/TSX 文件。Expected: 无新增 lint 或类型错误。
