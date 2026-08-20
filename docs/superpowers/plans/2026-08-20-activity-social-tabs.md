# 活动详情评论/瞬间 Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** C 端活动详情评论与精彩瞬间同一行 tab 切换；结束后仍可发瞬间；无可见瞬间且不能发则藏瞬间 tab。

**Architecture:** 纯函数 `shouldShowMomentsTab`。共享 `ActivitySocialTabs`（H5/PC 详情共用）。详情页持有 tab 状态。非当前面板不挂载。`canSubmitMoment` 公式不改。

**Tech Stack:** React 19、TypeScript、Vitest。C 端不用 antd。H5 / PC 仍两套壳。

---

## File map

- Create: `src/features/c-end/activities/model/activitySocialTabs.ts`
- Create: `src/features/c-end/activities/model/activitySocialTabs.test.ts`
- Create: `src/features/c-end/activities/components/ActivitySocialTabs.tsx`
- Create: `src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`
- Create: `src/features/c-end/activities/components/ActivityCommentList.test.tsx`
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/activities/model/related.test.ts`
- Modify: `src/features/c-end/activities/model/signupStore.ts`
- Modify: `src/features/c-end/activities/model/signupStore.test.ts`
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/MomentFeed.tsx`
- Modify: `src/features/c-end/activities/components/MomentFeed.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

规格：`docs/superpowers/specs/2026-08-20-activity-social-tabs-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

C 端不用 antd。不改 `canSubmitMoment`。不给评论全页加 tab。不把 tab 写入 hash。`clientActivity.test.ts` 自造 fixture 的 `rejected → [1]` 不要改。

---

### Task 1: `shouldShowMomentsTab`

**Files:**
- Create: `src/features/c-end/activities/model/activitySocialTabs.ts`
- Create: `src/features/c-end/activities/model/activitySocialTabs.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { shouldShowMomentsTab } from './activitySocialTabs';

describe('shouldShowMomentsTab', () => {
  it('shows when there are moments or the viewer can submit', () => {
    expect(shouldShowMomentsTab(1, false)).toBe(true);
    expect(shouldShowMomentsTab(0, true)).toBe(true);
    expect(shouldShowMomentsTab(2, true)).toBe(true);
  });

  it('hides when empty and the viewer cannot submit', () => {
    expect(shouldShowMomentsTab(0, false)).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/activitySocialTabs.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现**

```ts
export function shouldShowMomentsTab(momentCount: number, canSubmit: boolean): boolean {
  return momentCount > 0 || canSubmit;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/model/activitySocialTabs.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 报名种子（活动 1 已通过，已驳回挪到活动 12）

**Files:**
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/activities/model/related.test.ts`
- Modify: `src/features/c-end/activities/model/signupStore.ts`
- Modify: `src/features/c-end/activities/model/signupStore.test.ts`
- Modify: `src/features/c-end/activities/h5/H5MySignups.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcMySignups.test.tsx`

- [ ] **Step 1: 改失败测试**

`related.test.ts` 用例 `seeds 陈产品 with the C-end demo four rows`：标题可改成 `five rows`。`mine` 长度 **5**。`byActivity[1].status` 改为 `'已通过'`。追加：

```ts
    expect(byActivity[12]).toMatchObject({
      id: 17,
      signupType: '个人报名',
      status: '已驳回',
      createdAt: '2026-04-12 10:00:00',
    });
```

`signupStore.test.ts` `loads demo records covering activity and audit mixes`：

```ts
    expect(list).toHaveLength(5);
    expect(byId[2]?.status).toBe('已通过');
    expect(byId[6]?.status).toBe('待审核');
    expect(byId[9]?.status).toBe('已通过');
    expect(byId[1]?.status).toBe('已通过');
    expect(byId[12]?.status).toBe('已驳回');
    expect(byId[3]).toBeUndefined();
```

`H5MySignups.test.tsx` 与 `PcMySignups.test.tsx` 同步：

- `shows the ended empty copy for demo signups` 改成有开放日：

```ts
  it('shows ended demo signups when that tab is selected', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5MySignups initialTab="ended" />);

    expect(html).toContain('春季员工开放日');
    expect(html).not.toContain('暂无已结束活动');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('年度体检安排');
    expect(html).not.toContain('中秋员工晚会');
    expect(html).not.toContain('秋季消防演练');
  });
```

PC 同结构，组件换成 `PcMySignups`，空态 class 断言可留 `c-pc-signup-tabs` / `c-pc-signup-search`。

- `shows rejected demo signups...`：`春季员工开放日` 换成 `秋季消防演练`，并 `not.toContain('春季员工开放日')`。

- 默认 / pending / ongoing 用例追加 `expect(html).not.toContain('秋季消防演练');`（H5 与 PC 都加）。

不要改 `clientActivity.test.ts`。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/related.test.ts src/features/c-end/activities/model/signupStore.test.ts src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/pc/PcMySignups.test.tsx`

Expected: FAIL，活动 1 仍是已驳回、没有活动 12。

- [ ] **Step 3: 改种子**

`related.ts` 报名 `id: 14` 的 `status` 改为 `'已通过'`。在 `signups` 数组末尾（id 16 那条后面）加：

```ts
    { id: 17, activityId: 12, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已驳回', createdAt: '2026-04-12 10:00:00' },
```

`signupStore.ts`：

- `DEMO_CLIENT_SIGNUPS` 里 `activityId: 1` 那条 `status` 改为 `'已通过'`。
- 再加一条：

```ts
  {
    activityId: 12,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已驳回',
    createdAt: '2026-04-12 10:00:00',
  },
```

- `DEMO_RELATED_IDS` 改为 `{ 2: 4, 6: 15, 9: 16, 1: 14, 12: 17 }`。

- [ ] **Step 4: 跑测试确认通过**

Run: 同 Step 2。

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: `hideTitle`（评论列表 + 瞬间 Feed）

**Files:**
- Create: `src/features/c-end/activities/components/ActivityCommentList.test.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/MomentFeed.tsx`
- Modify: `src/features/c-end/activities/components/MomentFeed.test.tsx`

- [ ] **Step 1: 写失败测试**

`ActivityCommentList.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { commentCount, previewActivityCommentThreads, shouldShowActivityCommentViewAll } from '../model/activityComments';
import { ActivityCommentList } from './ActivityCommentList';

describe('ActivityCommentList hideTitle', () => {
  it('omits the section heading but keeps view-all', () => {
    const html = renderToStaticMarkup(
      <ActivityCommentList
        threads={previewActivityCommentThreads(1)}
        totalCount={commentCount(1)}
        showViewAll={shouldShowActivityCommentViewAll(1)}
        onViewAll={() => undefined}
        onLike={() => undefined}
        onReply={() => undefined}
        onDelete={() => undefined}
        surface="h5"
        hideTitle
      />,
    );
    expect(html).not.toContain('activity-comments-title');
    expect(html).toContain('查看全部');
    expect(html).toContain('开放日讲解很清楚');
  });
});
```

`MomentFeed.test.tsx` 追加：

```tsx
  it('hides the feed heading when hideTitle is set', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />,
    );
    expect(html).not.toMatch(/<h2[^>]*>精彩瞬间/);
    expect(html).toContain('发布瞬间');
    expect(html).toContain('张悦');
  });
```

保留原头像用例。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/components/ActivityCommentList.test.tsx src/features/c-end/activities/components/MomentFeed.test.tsx`

Expected: FAIL，`hideTitle` 不是合法 prop / 标题仍在。

- [ ] **Step 3: 实现 hideTitle**

`ActivityCommentList` props 增加 `hideTitle?: boolean`。section 在 `hideTitle` 时用 `aria-label="评论"`，不要 `aria-labelledby="activity-comments-title"`。head 内：

```tsx
      <div className="c-activity-comments-head">
        {hideTitle ? null : (
          <h2 id="activity-comments-title" className="c-detail-name c-detail-section">
            评论 {totalCount}
          </h2>
        )}
        {showViewAll ? (
          <button type="button" className="c-activity-comments-more" onClick={onViewAll}>
            查看全部
          </button>
        ) : null}
      </div>
```

若 `hideTitle && !showViewAll`，整块 `c-activity-comments-head` 可不渲染。

`MomentFeed` props 增加 `hideTitle?: boolean`：

```tsx
export function MomentFeed({
  activity,
  onCompose,
  hideTitle,
}: {
  activity: Activity;
  onCompose: (record?: MomentRecord) => void;
  hideTitle?: boolean;
}) {
```

head：

```tsx
      {hideTitle && !canSubmit ? null : (
        <div className="c-moment-head">
          {hideTitle ? null : <h2 className="c-detail-name c-detail-section">精彩瞬间</h2>}
          {canSubmit ? (
            <button className="c-btn c-btn-primary c-moment-publish" type="button" onClick={() => onCompose()}>
              发布瞬间
            </button>
          ) : null}
        </div>
      )}
```

`aria-label="精彩瞬间"` 留在 section 上。

- [ ] **Step 4: 跑测试确认通过**

Run: 同 Step 2。

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: `ActivitySocialTabs` + CSS

**Files:**
- Create: `src/features/c-end/activities/components/ActivitySocialTabs.tsx`
- Create: `src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

`ActivitySocialTabs.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getPublishedActivity } from '../model/clientActivity';
import { ActivitySocialTabs } from './ActivitySocialTabs';
import { MomentFeed } from './MomentFeed';

describe('ActivitySocialTabs', () => {
  it('defaults to comments on activity 1 and keeps moment cards unmounted', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="comments"
        onTabChange={() => undefined}
        comments={<div>开放日讲解很清楚查看全部</div>}
        moments={<MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />}
      />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('评论 6');
    expect(html).toContain('精彩瞬间');
    expect(html).toContain('开放日讲解很清楚');
    expect(html).not.toContain('开场致辞很有感染力');
    expect(html).not.toContain('发布瞬间');
  });

  it('mounts moments and publish on activity 1 when selected', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="moments"
        onTabChange={() => undefined}
        comments={<div>开放日讲解很清楚</div>}
        moments={<MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />}
      />,
    );
    expect(html).toContain('发布瞬间');
    expect(html).toContain('开场致辞很有感染力');
    expect(html).not.toContain('开放日讲解很清楚');
  });

  it('hides the moments tab on activity 12', () => {
    const activity = getPublishedActivity(initialActivities, 12);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="moments"
        onTabChange={() => undefined}
        comments={<div>评论占位</div>}
        moments={<div>瞬间占位</div>}
      />,
    );
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('精彩瞬间');
    expect(html).toContain('评论占位');
    expect(html).not.toContain('瞬间占位');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`

Expected: FAIL，组件不存在。

- [ ] **Step 3: 组件 + CSS**

`ActivitySocialTabs.tsx`：

```tsx
import type { ReactNode } from 'react';
import type { Activity } from '../../../activities/model/activity';
import { useCanSubmitMoment, useClientMoments } from '../../../activities/model/momentStore';
import { commentCount } from '../model/activityComments';
import { shouldShowMomentsTab } from '../model/activitySocialTabs';

export function ActivitySocialTabs({
  activity,
  tab,
  onTabChange,
  comments,
  moments,
}: {
  activity: Activity;
  tab: 'comments' | 'moments';
  onTabChange: (tab: 'comments' | 'moments') => void;
  comments: ReactNode;
  moments: ReactNode;
}) {
  const momentItems = useClientMoments(activity.id);
  const canSubmit = useCanSubmitMoment(activity);
  const showMoments = shouldShowMomentsTab(momentItems.length, canSubmit);
  const current = showMoments && tab === 'moments' ? 'moments' : 'comments';

  return (
    <div className="c-social-tabs" id="activity-social">
      {showMoments ? (
        <div className="c-social-tab-list" role="tablist" aria-label="评论和精彩瞬间">
          <button
            type="button"
            role="tab"
            className={current === 'comments' ? 'c-social-tab is-on' : 'c-social-tab'}
            aria-selected={current === 'comments'}
            onClick={() => onTabChange('comments')}
          >
            评论 {commentCount(activity.id)}
          </button>
          <button
            type="button"
            role="tab"
            className={current === 'moments' ? 'c-social-tab is-on' : 'c-social-tab'}
            aria-selected={current === 'moments'}
            onClick={() => onTabChange('moments')}
          >
            精彩瞬间
          </button>
        </div>
      ) : null}
      {current === 'moments' ? moments : comments}
    </div>
  );
}
```

无 antd。

`styles.css` 在 `.c-activity-comments-more` 之后、`.c-comment-input` 之前插入：

```css
.c-social-tabs {
  margin-top: 8px;
}
.c-social-tab-list {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 0 0 8px;
  border-bottom: 1px solid #e8eef3;
}
.c-social-tab {
  appearance: none;
  min-height: 44px;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: #64748b;
  padding: 0 8px;
  font: inherit;
  cursor: pointer;
}
.c-social-tab.is-on {
  color: #087f73;
  font-weight: 700;
  border-bottom-color: #087f73;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/components/ActivitySocialTabs.test.tsx src/features/c-end/activities/model/activitySocialTabs.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 5: 接到 H5 / PC 详情

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

- [ ] **Step 1: 改失败测试**

`H5ActivityDetail.test.tsx`：

- `puts social actions left of signup CTA and lists comments before moments` 改名为 `puts social actions left of signup CTA and shows comment tabs`。删掉 `moments` index 必须大于 `comments` 的断言。改为：

```ts
    expect(html).toContain('id="activity-social"');
    expect(html).toContain('评论 6');
    expect(html).toContain('精彩瞬间');
    expect(html).toContain('开放日讲解很清楚');
    expect(html).not.toContain('开场致辞很有感染力');
```

保留点赞/收藏/评论/CTA 顺序断言。

- `previews two root comments...`：不要 `slice(..., html.indexOf('精彩瞬间'))`。改为从 `id="activity-comments"` 切到结尾（或整页断言）。仍要：查看全部、无「王芳 回复 张悦」、无「谢谢认可」、有两根预览、有 `c-avatar`、有「张悦」。追加 `expect(html).toContain('c-social-tab');`。

- `shows delete for own comments...`：同样不要 slice 到「精彩瞬间」。

`PcActivityDetail.test.tsx` 追加：

```ts
  it('shows social tabs on activities with moments', () => {
    expect(renderToStaticMarkup(<PcActivityDetail id={1} />)).toContain('c-social-tab');
    expect(renderToStaticMarkup(<PcActivityDetail id={2} />)).toContain('c-social-tab');
  });

  it('hides the moments tab when empty and not submittable', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={12} />);
    expect(html).not.toContain('c-social-tab');
    expect(html).not.toContain('精彩瞬间');
    expect(html).toContain('id="activity-comments"');
  });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: FAIL，详情仍上下叠放、默认 DOM 含瞬间正文。

- [ ] **Step 3: 接线**

`hideTitle` 必须等于「画出了瞬间 tab」。详情在 early return **前**用 id 拉 hook，return **后**用 `activity` 算 flag。

H5 增加 import：

```ts
import { canSubmitMoment } from '../../../activities/model/moment';
import { useApprovedSignup, useClientMoments } from '../../../activities/model/momentStore';
import { ActivitySocialTabs } from '../components/ActivitySocialTabs';
import { shouldShowMomentsTab } from '../model/activitySocialTabs';
```

`H5ActivityDetail` 在 `if (!activity)` 之前：

```tsx
  const [socialTab, setSocialTab] = useState<'comments' | 'moments'>('comments');
  const momentItems = useClientMoments(id);
  const approvedSignup = useApprovedSignup(id);
```

`if (!activity)` 之后：

```tsx
  const hideSocialTitle = shouldShowMomentsTab(
    momentItems.length,
    canSubmitMoment(activity.activityStatus, approvedSignup),
  );
```

`onComment`：

```ts
            onComment={() => {
              setSocialTab('comments');
              requestAnimationFrame(() => {
                document.getElementById('activity-social')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
              setReplyTo(undefined);
              setCommentOpen(true);
            }}
```

把原来上下叠放的 `ActivityCommentList` + `MomentFeed` 换成：

```tsx
        <ActivitySocialTabs
          activity={activity}
          tab={socialTab}
          onTabChange={setSocialTab}
          comments={
            <ActivityCommentList
              threads={threads}
              totalCount={commentCount(id)}
              showViewAll={shouldShowActivityCommentViewAll(id)}
              onViewAll={() => goH5ActivityComments(id)}
              onLike={(commentId) => toggleCommentLike(commentId)}
              onReply={(commentId, name) => {
                setReplyTo({ id: commentId, name });
                setCommentOpen(true);
              }}
              onDelete={(commentId) => deleteActivityComment(commentId)}
              surface="h5"
              hideTitle={hideSocialTitle}
            />
          }
          moments={
            <MomentFeed
              activity={activity}
              onCompose={(record) => setComposer(record ?? 'create')}
              hideTitle={hideSocialTitle}
            />
          }
        />
```

PC 同样：early return 前 `socialTab` / `useClientMoments(id)` / `useApprovedSignup(id)`；之后算 `hideSocialTitle`；`onComment` 切评论 tab + rAF 滚 `#activity-social` + 开评论 modal；`ActivitySocialTabs` 包两块，`surface="pc"`，`onViewAll={() => goPcActivityComments(id)}`。

评论全页不要传 `hideTitle`。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/components/ActivitySocialTabs.test.tsx src/features/c-end/activities/components/MomentFeed.test.tsx`

Expected: PASS。全页评论仍有「评论」标题。

- [ ] **Step 5: Commit**

跳过。

---

### Task 6: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 本需求改动文件无新错。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：评论/瞬间同一行 tab，默认评论，切瞬间能「发布瞬间」。`#/c/h5/12`：无瞬间 tab。`#/c/h5/my` 已结束=开放日，已驳回=消防演练。无浏览器则 SKIP 并注明。
- [ ] **Step 4:** 跳过 commit。

---

## 自检（写计划后）

| 规格项 | 任务 |
|---|---|
| `shouldShowMomentsTab` | Task 1 |
| 种子 1 已通过 / 12 已驳回 | Task 2 |
| hideTitle | Task 3 |
| ActivitySocialTabs 不挂载非当前面板 | Task 4 |
| H5/PC 接线、底栏切评论 tab | Task 5 |
| 我的报名测试 | Task 2 |
| 详情测试不再 slice 到精彩瞬间 | Task 5 |
| 不改 canSubmitMoment / 评论全页 / hash | 全文约束 |
