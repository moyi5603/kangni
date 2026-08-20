# 详情只出主评并加厚评论种子 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 详情评论预览只出最新 2 条主评、不展开回复；活动 1/2/6 加厚种子。全页仍两层。

**Architecture:** `previewCommentThreads` 在 slice(0,2) 后把每条 `replies` 置 `[]`。`shouldShowActivityCommentViewAll`：主评>2 或任一线有回复。种子只改 `related.ts`。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`。C 端不用 antd。

---

## File map

- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/activities/model/commentTree.ts`
- Modify: `src/features/activities/model/commentTree.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

规格：`docs/superpowers/specs/2026-08-20-detail-comments-roots-only-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

C 端不用 antd。不要改瞬间评论。不要改 `HOME_COMMENT_PREVIEW_LIMIT`（仍 2）。不要改全页组件、删除确认、点赞图标、后台删除。保留种子 id 1–6 原文案。

活动 1 加完后：`commentCount(1) === 10`。主评新→旧 `2, 1, 7, 9, 6, 8`。`listActivityComments(1)` ids `[11, 2, 10, 5, 1, 12, 7, 9, 6, 8]`。详情预览根仍是李明+张悦。

---

### Task 1: 加厚种子 + 更新计数测试

**Files:**
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

本任务**还不**剥回复。详情暂时仍能看到「王芳 回复 张悦」。只改计数和排序。

- [ ] **Step 1: 改会失败的测试**

`activityComments.test.ts`：

`lists comments newest first`：

```ts
    expect(list.map((item) => item.id)).toEqual([11, 2, 10, 5, 1, 12, 7, 9, 6, 8]);
    expect(list[0]?.author).toBe('苏然');
```

（id 11 是苏然回李明，时间 19:15，比李明主评 19:05 新。）

`builds threads...`：

```ts
    expect(threads.map((item) => item.root.id)).toEqual([2, 1, 7, 9, 6, 8]);
    expect(threads[1]?.replies.map((item) => item.replyLabel)).toEqual(['王芳 回复 张悦', '陈产品 回复 王芳']);
    expect(previewActivityCommentThreads(1).map((item) => item.root.id)).toEqual([2, 1]);
```

`counts replies in commentCount`：

```ts
    expect(commentCount(1)).toBe(10);
```

`clientActivity.test.ts`：

```ts
    expect(toClientActivity(activity).comments).toBe(10);
```

只滤 id 1：

```ts
    expect(toClientActivity(activity).comments).toBe(9);
```

`H5ActivityDetail.test.tsx`：`评论 4` 改成 `评论 10`。不要改「王芳 回复 张悦」断言（Task 2 再改）。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

Expected: FAIL，活动 1 仍 4 条、没有 id 7–12。

- [ ] **Step 3: 追加种子**

`related.ts` 的 `comments` 数组，**保留 1–6 不动**，在数组末尾追加：

```ts
    { id: 7, activityId: 1, content: '带家属参观体验很好。', author: '赵人事', createdAt: '2026-04-12 18:00:00', likedBy: [] },
    { id: 8, activityId: 1, content: '园区指引牌再大一点。', author: '钱会', createdAt: '2026-04-12 16:40:00', likedBy: [] },
    { id: 9, activityId: 1, content: '希望有英文导览。', author: '吴工', createdAt: '2026-04-12 17:30:00', likedBy: [] },
    { id: 10, activityId: 1, content: '谢谢认可。', author: '陈产品', createdAt: '2026-04-12 18:50:00', parentId: 5, likedBy: [] },
    { id: 11, activityId: 1, content: '分流可以再明确。', author: '苏然', createdAt: '2026-04-12 19:15:00', parentId: 2, likedBy: [] },
    { id: 12, activityId: 1, content: '同意，孩子也喜欢。', author: '王芳', createdAt: '2026-04-12 18:10:00', parentId: 7, likedBy: [] },
    { id: 13, activityId: 2, content: '讲义能下载就更好。', author: '李明', createdAt: '2026-08-18 13:00:00', parentId: 3, likedBy: [] },
    { id: 14, activityId: 6, content: '周六场次我们内部排一下。', author: '张悦', createdAt: '2026-08-16 15:00:00', parentId: 4, likedBy: [] },
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/pc/PcActivityComments.test.tsx`

Expected: PASS。全页仍含「希望增加名额」「王芳 回复 张悦」。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 预览剥回复 + 查看全部条件

**Files:**
- Modify: `src/features/activities/model/commentTree.ts`
- Modify: `src/features/activities/model/commentTree.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

- [ ] **Step 1: 写/改失败测试**

`commentTree.test.ts` 的 `previews two root threads` 改成：

```ts
  it('previews two root threads without replies', () => {
    const preview = previewCommentThreads(buildCommentThreads(list));
    expect(preview.map((item) => item.root.id)).toEqual([2, 1]);
    expect(preview.every((item) => item.replies.length === 0)).toBe(true);
  });
```

`activityComments.test.ts` 的 `builds threads...` 末尾追加（保留全量 threads 的回复断言）：

```ts
    const preview = previewActivityCommentThreads(1);
    expect(preview.map((item) => item.root.id)).toEqual([2, 1]);
    expect(preview.every((item) => item.replies.length === 0)).toBe(true);
    expect(shouldShowActivityCommentViewAll(1)).toBe(true);
```

从 `./activityComments` 增加 import `shouldShowActivityCommentViewAll`。

同文件再加：

```ts
  it('hides view-all when only two root comments and no replies', () => {
    patchRelated('comments', () => [
      { id: 1, activityId: 99, content: 'a', author: '张悦', createdAt: '2026-04-12 18:20:00', likedBy: [] },
      { id: 2, activityId: 99, content: 'b', author: '李明', createdAt: '2026-04-12 19:05:00', likedBy: [] },
    ]);
    expect(shouldShowActivityCommentViewAll(99)).toBe(false);
  });
```

需要 `import { getRelatedList, patchRelated, restoreRelatedComments } from '../../../activities/model/related';`（已有 getRelatedList / restore；补 `patchRelated`）。

`H5ActivityDetail.test.tsx` 预览用例：删掉 `expect(block).toContain('王芳 回复 张悦');`，改成：

```ts
    expect(block).not.toContain('王芳 回复 张悦');
    expect(block).not.toContain('谢谢认可');
```

（仍含「下午场次人有点多」「开放日讲解很清楚」、`查看全部`、不含「希望增加名额」。）

`PcActivityDetail.test.tsx` 预览用例：

```ts
  it('previews two root comments without replies, and view-all', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={1} />);
    expect(html).toContain('查看全部');
    expect(html).toContain('下午场次人有点多');
    expect(html).not.toContain('王芳 回复 张悦');
    expect(html).not.toContain('希望增加名额');
  });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/commentTree.test.ts src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: FAIL，预览仍带回复；`shouldShowActivityCommentViewAll` 未导出。

- [ ] **Step 3: 实现**

`commentTree.ts` 的 `previewCommentThreads`：

```ts
export function previewCommentThreads(threads: CommentThread[]): CommentThread[] {
  return threads.slice(0, HOME_COMMENT_PREVIEW_LIMIT).map((item) => ({
    ...item,
    replies: [],
  }));
}
```

`activityComments.ts` 增加（已有 `HOME_COMMENT_PREVIEW_LIMIT` 需从 commentTree import）：

```ts
import {
  buildCommentThreads,
  HOME_COMMENT_PREVIEW_LIMIT,
  previewCommentThreads,
  removeCommentsAndDescendants,
  type CommentThread,
} from '../../../activities/model/commentTree';

export function shouldShowActivityCommentViewAll(activityId: number): boolean {
  const threads = listActivityCommentThreads(activityId);
  if (threads.length > HOME_COMMENT_PREVIEW_LIMIT) return true;
  return threads.some((item) => item.replies.length > 0);
}
```

H5/PC 详情：删掉 `allThreads`、`HOME_COMMENT_PREVIEW_LIMIT`、`listActivityCommentThreads`（若详情不再用）。改为：

```ts
import { shouldShowActivityCommentViewAll } from '../model/activityComments';
```

（保留该文件已有的 `previewActivityCommentThreads`、`commentCount` 等。）

```tsx
          showViewAll={shouldShowActivityCommentViewAll(id)}
```

不要改全页 `listActivityCommentThreads`。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/commentTree.test.ts src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/pc/PcActivityComments.test.tsx`

Expected: PASS。全页仍有「王芳 回复 张悦」。`npx tsc -b` 干净。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 无错误。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：两条主评（李明、张悦），无回复行，有查看全部，标题评论 10。`#/c/h5/1/comments` 有苏然楼、王芳回复、陈产品回复王芳。PC 同样。
- [ ] **Step 4:** 跳过 commit。
