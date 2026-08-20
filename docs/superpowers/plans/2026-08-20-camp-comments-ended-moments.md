# 训练营评论加种 + 仅已结束可发瞬间 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 活动 2 评论补到 6 条主评（含两层回复）；发布精彩瞬间仅「报名已通过 + 已结束」。

**Architecture:** 改纯函数 `canSubmitMoment` / `submitBlockReason`。`momentStore` 失败文案走 `submitBlockReason`。评论只加 `related.ts` 种子，不改建树。

**Tech Stack:** TypeScript、Vitest、React 19。C 端不用 antd。

---

## File map

- Create: `src/features/activities/model/moment.test.ts`
- Modify: `src/features/activities/model/moment.ts`
- Modify: `src/features/activities/model/momentStore.ts`
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- Modify: `src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`

规格：`docs/superpowers/specs/2026-08-20-camp-comments-ended-moments-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

不改活动 2 的 `activityStatus`。不改瞬间种子。不改 `commentTree`。C 端不用 antd。

---

### Task 1: 仅已结束可发瞬间

**Files:**
- Create: `src/features/activities/model/moment.test.ts`
- Modify: `src/features/activities/model/moment.ts`
- Modify: `src/features/activities/model/momentStore.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { canSubmitMoment, submitBlockReason } from './moment';

describe('moment submit rules', () => {
  it('allows submit only when signup is approved and activity has ended', () => {
    expect(canSubmitMoment('已结束', true)).toBe(true);
    expect(canSubmitMoment('已结束', false)).toBe(false);
    expect(canSubmitMoment('进行中', true)).toBe(false);
    expect(canSubmitMoment('未开始', true)).toBe(false);
  });

  it('explains why submit is blocked', () => {
    expect(submitBlockReason('未开始', true)).toBe('活动未开始，暂不能发布瞬间');
    expect(submitBlockReason('进行中', true)).toBe('活动结束后才能发布瞬间');
    expect(submitBlockReason('已结束', false)).toBe('报名通过后才能发布瞬间');
    expect(submitBlockReason('已结束', true)).toBeUndefined();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/moment.test.ts`

Expected: FAIL，`canSubmitMoment('进行中', true)` 仍为 true。

- [ ] **Step 3: 改公式 + store 文案**

`moment.ts` 把两个函数换成规格原文：

```ts
export function canSubmitMoment(activityStatus: ActivityStatus, approvedSignup: boolean): boolean {
  return approvedSignup && activityStatus === '已结束';
}

export function submitBlockReason(activityStatus: ActivityStatus, approvedSignup: boolean): string | undefined {
  if (activityStatus !== '已结束') {
    return activityStatus === '未开始' ? '活动未开始，暂不能发布瞬间' : '活动结束后才能发布瞬间';
  }
  if (!approvedSignup) return '报名通过后才能发布瞬间';
  return undefined;
}
```

`momentStore.ts`：`submitMoment` 与 `resubmitMoment` 里

```ts
    return { ok: false, message: activity.activityStatus === '未开始' ? '活动未开始，暂不能发布瞬间' : '报名通过后才能发布瞬间' };
```

两处都改成：

```ts
    return { ok: false, message: submitBlockReason(activity.activityStatus, approved) ?? '报名通过后才能发布瞬间' };
```

`submitBlockReason` 已从 `./moment` 同文件族导出；`momentStore` 已 import `canSubmitMoment`，在该 import 列表加上 `submitBlockReason`。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/moment.test.ts src/features/c-end/activities/components/ActivitySocialTabs.test.tsx src/features/c-end/activities/components/MomentFeed.test.tsx`

Expected: PASS。活动 1 仍已结束+已通过，「发布瞬间」还在。活动 2 的 hideTitle 用例若断言发布瞬间会失败——`MomentFeed.test.tsx` 的 hideTitle 用的是活动 **1**，应仍 PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 训练营评论种子

**Files:**
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`

- [ ] **Step 1: 改失败测试**

`activityComments.test.ts` `counts root threads in commentCount` 追加：

```ts
    expect(commentCount(2)).toBe(6);
```

同文件再加：

```ts
  it('orders camp roots newest first with two-layer replies', () => {
    const threads = listActivityCommentThreads(2);
    expect(threads.map((item) => item.root.id)).toEqual([19, 18, 17, 16, 15, 3]);
    expect(threads[3]?.replies.map((item) => item.replyLabel)).toEqual(['王芳 回复 苏然', '陈产品 回复 王芳']);
    const preview = previewActivityCommentThreads(2);
    expect(preview.map((item) => item.root.id)).toEqual([19, 18]);
    expect(preview.every((item) => item.replies.length === 0)).toBe(true);
    expect(shouldShowActivityCommentViewAll(2)).toBe(true);
  });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts`

Expected: FAIL，`commentCount(2)` 不是 6。

- [ ] **Step 3: 追加种子**

保留 id 3、13。在 `related.ts` `comments` 数组 id 14 那条**后面**追加（全文如下，勿改 id 1–14）：

```ts
    { id: 15, activityId: 2, content: '导师带教很细。', author: '张悦', createdAt: '2026-08-18 12:40:00', likedBy: ['李明'] },
    { id: 16, activityId: 2, content: '安全课能不能录像？', author: '苏然', createdAt: '2026-08-18 13:10:00', likedBy: [] },
    { id: 17, activityId: 2, content: '团体报名流程顺。', author: '周工', createdAt: '2026-08-18 13:40:00', likedBy: [] },
    { id: 18, activityId: 2, content: '结业证书什么时候发？', author: '赵人事', createdAt: '2026-08-18 14:00:00', likedBy: [] },
    { id: 19, activityId: 2, content: '食堂窗口排队有点长。', author: '钱会', createdAt: '2026-08-18 14:20:00', likedBy: [] },
    { id: 20, activityId: 2, content: '同感，下午跟岗也清楚。', author: '陈产品', createdAt: '2026-08-18 12:55:00', parentId: 15, likedBy: [] },
    { id: 21, activityId: 2, content: '可以问一下培训组。', author: '王芳', createdAt: '2026-08-18 13:20:00', parentId: 16, likedBy: [] },
    { id: 22, activityId: 2, content: '我去群里问。', author: '陈产品', createdAt: '2026-08-18 13:28:00', parentId: 21, likedBy: [] },
    { id: 23, activityId: 2, content: '一般结业当天发。', author: '张悦', createdAt: '2026-08-18 14:08:00', parentId: 18, likedBy: [] },
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: 详情 / 全页 / 瞬间 tab 断言

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- Modify: `src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`

- [ ] **Step 1: 改失败测试**

`H5ActivityDetail.test.tsx` 追加（`afterEach` 已有 `restoreRelatedComments`）：

```ts
  it('previews two camp roots and a root count of 6', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={2} />);
    expect(html).toContain('评论 6');
    expect(html).toContain('查看全部');
    expect(html).toContain('食堂窗口排队有点长。');
    expect(html).toContain('结业证书什么时候发？');
    expect(html).not.toContain('实操课节奏合适');
    expect(html).not.toContain('王芳 回复 苏然');
  });
```

`H5ActivityComments.test.tsx` 追加：

```ts
  it('lists camp roots and two-layer replies', () => {
    const html = renderToStaticMarkup(<H5ActivityComments id={2} />);
    expect(html).toContain('实操课节奏合适');
    expect(html).toContain('陈产品 回复 王芳');
    expect(html).toContain('食堂窗口排队有点长。');
  });
```

`ActivitySocialTabs.test.tsx` 追加：

```ts
  it('shows camp moments without a publish button', () => {
    const activity = getPublishedActivity(initialActivities, 2);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="moments"
        onTabChange={() => undefined}
        comments={<div>评论占位</div>}
        moments={<MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />}
      />,
    );
    expect(html).toContain('小组讨论花絮，导师点评很到位。');
    expect(html).not.toContain('发布瞬间');
    expect(html).toContain('role="tablist"');
  });
```

保留活动 1 `tab="moments"` 仍有「发布瞬间」的用例。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`

Expected: FAIL，详情 id=2 还是「评论 1」或没有食堂窗口文案。

若 Task 2 已落地，详情/全页可能已绿，瞬间 tab 无发布按钮应已因 Task 1 变绿。仍先加断言再跑：该绿的绿、该红的红。

- [ ] **Step 3: 接线**

本任务只加测试。种子与公式已在 Task 1–2。若 Step 2 全绿，Step 3 无代码。若详情仍缺文案，回头检查 `related.ts` 是否写入。

- [ ] **Step 4: 跑测试确认通过**

Run: 同 Step 2。

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 本需求文件无新错。
- [ ] **Step 3:** 硬刷新 `#/c/h5/2`：评论 6、预览食堂/证书、「查看全部」；全页有两层回复。瞬间 tab 无「发布瞬间」。`#/c/h5/1` 瞬间 tab 仍有「发布瞬间」。无浏览器则 SKIP。
- [ ] **Step 4:** 跳过 commit。

---

## 自检

| 规格项 | 任务 |
|---|---|
| `canSubmitMoment` / `submitBlockReason` | Task 1 |
| `momentStore` 走 `submitBlockReason` | Task 1 |
| 活动 2 评论 15–23 | Task 2 |
| `commentCount(2)===6`、建树顺序 | Task 2 |
| H5 详情预览 / 全页两层 | Task 3 |
| 活动 2 无发布瞬间、活动 1 仍有 | Task 1+3 |
| 不改训练营状态、不改瞬间种子 | 约束 |
