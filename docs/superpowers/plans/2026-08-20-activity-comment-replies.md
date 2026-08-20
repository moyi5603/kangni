# 活动评论回复 / 点赞 / 删除 / 全部页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 详情评论可回、可赞、可删自己的；视觉两层「A 回复 B」；超过 2 条主评进独立评论页；后台删连带子树。

**Architecture:** 扁平 `CommentRecord`（`parentId` + `likedBy`）。纯函数在 `commentTree.ts`（C 端和后台共用）。写操作在 `activityComments.ts`。H5/PC 共用 `ActivityCommentList`，壳子分开。路由 `#/c/{h5|pc}/{id}/comments`。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`。C 端不用 antd。

---

## File map

- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/activities/model/related.test.ts`
- Create: `src/features/activities/model/commentTree.ts`
- Create: `src/features/activities/model/commentTree.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/CEndApp.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentForm.tsx`
- Modify: `src/features/c-end/activities/h5/H5CommentSheet.tsx`
- Modify: `src/features/c-end/activities/pc/PcCommentModal.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityComments.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- Create: `src/features/c-end/activities/pc/PcActivityComments.tsx`
- Create: `src/features/c-end/activities/pc/PcActivityComments.test.tsx`
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`
- Modify: `src/features/c-end/activities/styles.css`

规格：`docs/superpowers/specs/2026-08-20-activity-comment-replies-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

C 端不用 antd。不要改精彩瞬间评论。不要把赞写入 `engagementStore`。

种子约定（活动 1）：

| id | 角色 | createdAt | parentId |
|---|---|---|---|
| 6 | 主评 苏然「希望增加名额。」 | 2026-04-12 17:00:00 | 无 |
| 1 | 主评 张悦（已有） | 18:20:00 | 无 |
| 5 | 回复 王芳「同意，讲解很细。」 | 18:40:00 | 1 |
| 2 | 主评 李明（已有） | 19:05:00 | 无 |

主评新→旧：2, 1, 6。详情预览 2+1。`commentCount(1) === 4`。`listActivityComments(1)` 全节点新→旧：`[2, 5, 1, 6]`。

---

### Task 1: `CommentRecord` + 种子

**Files:**
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/activities/model/related.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

- [ ] **Step 1: 改会失败的现有测试**

`activityComments.test.ts` 的 `lists comments newest first` 改成：

```ts
    expect(list.map((item) => item.id)).toEqual([2, 5, 1, 6]);
    expect(list[0]?.author).toBe('李明');
```

`clientActivity.test.ts`：

```ts
    expect(toClientActivity(activity).comments).toBe(4);
```

`updates comment count after a related delete`（只滤掉 id 1、不连带）改成：

```ts
    expect(toClientActivity(activity).comments).toBe(3);
```

`H5ActivityDetail.test.tsx`：`评论 2` 改成 `评论 4`。

`related.test.ts` 插入临时评论补 `likedBy: []`：

```ts
      { id: 99, activityId: 2, content: '临时评论', author: '陈产品', createdAt: '2026-08-20 10:00:00', likedBy: [] },
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

Expected: FAIL，活动 1 仍是 2 条、没有 id 5/6。

- [ ] **Step 3: 改类型和种子**

`CommentRecord`：

```ts
export type CommentRecord = BaseRecord & {
  content: string;
  author: string;
  parentId?: number;
  likedBy: string[];
};
```

`comments` 种子：已有 1–4 每条加 `likedBy: []`（id 1 可用 `likedBy: ['李明']`）。追加：

```ts
    { id: 5, activityId: 1, content: '同意，讲解很细。', author: '王芳', createdAt: '2026-04-12 18:40:00', parentId: 1, likedBy: [] },
    { id: 6, activityId: 1, content: '希望增加名额。', author: '苏然', createdAt: '2026-04-12 17:00:00', likedBy: [] },
```

`restoreRelatedComments` 克隆 `likedBy`：

```ts
    comments: initialRelated.comments.map((item) => ({ ...item, likedBy: [...item.likedBy] })),
```

`submitActivityComment` 新写入必须带 `likedBy: []`（本任务若还没改 activityComments，下一步 Task 2 会写；若 tsc 因缺字段失败，本任务就把 submit 补上 `likedBy: []`）。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/activities/model/related.test.ts`

Expected: PASS。`npx tsc -b` 若还有其它 `CommentRecord` 缺 `likedBy` 的字面量，一并补 `likedBy: []`。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: `commentTree` + `activityComments` 写操作

**Files:**
- Create: `src/features/activities/model/commentTree.ts`
- Create: `src/features/activities/model/commentTree.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`

- [ ] **Step 1: 写 `commentTree.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { CommentRecord } from './related';
import {
  buildCommentThreads,
  collectCommentSubtreeIds,
  commentDepth,
  commentReplyLabel,
  previewCommentThreads,
} from './commentTree';

const list: CommentRecord[] = [
  { id: 1, activityId: 1, content: 'root', author: '张悦', createdAt: '2026-04-12 18:20:00', likedBy: [] },
  { id: 2, activityId: 1, content: 'newer root', author: '李明', createdAt: '2026-04-12 19:05:00', likedBy: [] },
  { id: 3, activityId: 1, content: 'reply to 1', author: '王芳', createdAt: '2026-04-12 18:40:00', parentId: 1, likedBy: [] },
  { id: 4, activityId: 1, content: 'reply to 3', author: '陈产品', createdAt: '2026-04-12 18:50:00', parentId: 3, likedBy: [] },
  { id: 5, activityId: 1, content: 'old root', author: '苏然', createdAt: '2026-04-12 17:00:00', likedBy: [] },
];

describe('comment tree', () => {
  it('orders roots newest first and flattens descendants oldest first with A 回复 B', () => {
    const threads = buildCommentThreads(list);
    expect(threads.map((item) => item.root.id)).toEqual([2, 1, 5]);
    expect(threads[1]?.replies.map((item) => item.id)).toEqual([3, 4]);
    expect(threads[1]?.replies[0]?.replyLabel).toBe('王芳 回复 张悦');
    expect(threads[1]?.replies[1]?.replyLabel).toBe('陈产品 回复 王芳');
  });

  it('previews two root threads', () => {
    expect(previewCommentThreads(buildCommentThreads(list)).map((item) => item.root.id)).toEqual([2, 1]);
  });

  it('counts depth from the root and treats missing parent as depth 1', () => {
    expect(commentDepth(1, list)).toBe(1);
    expect(commentDepth(3, list)).toBe(2);
    expect(commentDepth(4, list)).toBe(3);
    expect(commentDepth(99, list)).toBe(1);
    expect(commentDepth(4, [{ ...list[3]!, parentId: 99 }])).toBe(1);
  });

  it('collects a node and all descendants', () => {
    expect([...collectCommentSubtreeIds(1, list)].sort((a, b) => a - b)).toEqual([1, 3, 4]);
    expect([...collectCommentSubtreeIds(2, list)]).toEqual([2]);
  });

  it('labels a reply using the parent author', () => {
    expect(commentReplyLabel(list[2]!, list)).toBe('王芳 回复 张悦');
    expect(commentReplyLabel(list[0]!, list)).toBe('张悦');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/commentTree.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 `commentTree.ts`**

```ts
import type { CommentRecord } from './related';

export const HOME_COMMENT_PREVIEW_LIMIT = 2;

export type CommentThreadReply = CommentRecord & { replyLabel: string };

export type CommentThread = {
  root: CommentRecord;
  replies: CommentThreadReply[];
};

function byId(list: CommentRecord[]): Map<number, CommentRecord> {
  return new Map(list.map((item) => [item.id, item]));
}

export function commentDepth(id: number, list: CommentRecord[]): number {
  const map = byId(list);
  let current = map.get(id);
  if (!current) return 1;
  let depth = 1;
  const seen = new Set<number>([id]);
  while (current.parentId != null) {
    const parent = map.get(current.parentId);
    if (!parent || seen.has(parent.id)) return 1;
    seen.add(parent.id);
    depth += 1;
    current = parent;
  }
  return depth;
}

export function collectCommentSubtreeIds(rootId: number, list: CommentRecord[]): Set<number> {
  const ids = new Set<number>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const item of list) {
      if (item.parentId != null && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        added = true;
      }
    }
  }
  return ids;
}

export function removeCommentsAndDescendants(list: CommentRecord[], rootIds: number[]): CommentRecord[] {
  const drop = new Set<number>();
  for (const id of rootIds) {
    for (const item of collectCommentSubtreeIds(id, list)) drop.add(item);
  }
  return list.filter((item) => !drop.has(item.id));
}

export function commentReplyLabel(item: CommentRecord, list: CommentRecord[]): string {
  if (item.parentId == null) return item.author;
  const parent = list.find((row) => row.id === item.parentId);
  if (!parent) return item.author;
  return `${item.author} 回复 ${parent.author}`;
}

function isRoot(item: CommentRecord, list: CommentRecord[]): boolean {
  return item.parentId == null || !list.some((row) => row.id === item.parentId);
}

function descendantsOf(rootId: number, list: CommentRecord[]): CommentRecord[] {
  const ids = collectCommentSubtreeIds(rootId, list);
  ids.delete(rootId);
  return list
    .filter((item) => ids.has(item.id))
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id - right.id);
}

export function buildCommentThreads(list: CommentRecord[]): CommentThread[] {
  const roots = list
    .filter((item) => isRoot(item, list))
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
  return roots.map((root) => ({
    root,
    replies: descendantsOf(root.id, list).map((item) => ({
      ...item,
      replyLabel: commentReplyLabel(item, list),
    })),
  }));
}

export function previewCommentThreads(threads: CommentThread[]): CommentThread[] {
  return threads.slice(0, HOME_COMMENT_PREVIEW_LIMIT);
}
```

注意：`commentDepth` 测试里 `{ ...list[3]!, parentId: 99 }` 只有这一条在新 list 里时，id 4 的父不存在 → 深度 1。实现必须：父找不到就当深度 1（不要沿坏链加层）。上面 `while` 里 `if (!parent) return 1` 会在深度已 >1 时误判成 1。应改为：**整条链任何一环父缺失，该节点当深度 1**。对「只有 id4 parentId 99」返回 1。对正常链 4→3→1 返回 3。写成：

```ts
  while (current.parentId != null) {
    const parent = map.get(current.parentId);
    if (!parent || seen.has(parent.id)) return 1;
    ...
  }
```

对正常 4→3→1，每环都有父，走到楼主返回 3。对 4→99 缺失，立刻 `return 1`。对「4 在完整 list 里」OK。

- [ ] **Step 4: `commentTree` 测试通过**

Run: `npm test -- src/features/activities/model/commentTree.test.ts`

Expected: PASS。

- [ ] **Step 5: 扩展 `activityComments.test.ts`**

在现有 describe 内追加（保留 afterEach restore）：

```ts
  it('builds threads with flattened replies and preview limit 2', () => {
    const threads = listActivityCommentThreads(1);
    expect(threads.map((item) => item.root.id)).toEqual([2, 1, 6]);
    expect(threads[1]?.replies[0]?.replyLabel).toBe('王芳 回复 张悦');
    expect(previewActivityCommentThreads(1).map((item) => item.root.id)).toEqual([2, 1]);
  });

  it('replies to a depth-3 comment stay on that parent', () => {
    expect(submitActivityComment(1, '一层回', 1)).toBe('ok');
    const firstReply = getRelatedList('comments').find((item) => item.content === '一层回')!;
    expect(submitActivityComment(1, '二层回', firstReply.id)).toBe('ok');
    const second = getRelatedList('comments').find((item) => item.content === '二层回')!;
    expect(commentDepth(second.id, getRelatedList('comments').filter((item) => item.activityId === 1))).toBe(3);
    expect(submitActivityComment(1, '仍三层', second.id)).toBe('ok');
    const third = getRelatedList('comments').find((item) => item.content === '仍三层')!;
    expect(third.parentId).toBe(second.id);
    expect(commentDepth(third.id, getRelatedList('comments').filter((item) => item.activityId === 1))).toBe(3);
  });

  it('deletes own comment with descendants and ignores others', () => {
    expect(submitActivityComment(1, '我的楼')).toBe('ok');
    const mine = getRelatedList('comments').find((item) => item.content === '我的楼')!;
    expect(submitActivityComment(1, '别人回不了删', mine.id)).toBe('ok');
    const before = getRelatedList('comments').length;
    expect(deleteActivityComment(1)).toBe('forbidden');
    expect(getRelatedList('comments')).toHaveLength(before);
    expect(deleteActivityComment(mine.id)).toBe('ok');
    expect(getRelatedList('comments').some((item) => item.id === mine.id)).toBe(false);
    expect(getRelatedList('comments').some((item) => item.content === '别人回不了删')).toBe(false);
  });

  it('toggles likes for 陈产品', () => {
    expect(toggleCommentLike(2)).toBe('ok');
    expect(getRelatedList('comments').find((item) => item.id === 2)?.likedBy).toContain('陈产品');
    expect(toggleCommentLike(2)).toBe('ok');
    expect(getRelatedList('comments').find((item) => item.id === 2)?.likedBy).not.toContain('陈产品');
    expect(toggleCommentLike(999)).toBe('missing');
  });

  it('counts replies in commentCount', () => {
    expect(commentCount(1)).toBe(4);
  });
```

`submitActivityComment` 签名改为 `(activityId, content, parentId?: number)`。`deleteActivityComment` 返回 `'ok' | 'forbidden' | 'missing'`。`toggleCommentLike` 返回 `'ok' | 'missing'`。

- [ ] **Step 6: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts`

Expected: FAIL，新函数未导出。

- [ ] **Step 7: 实现 `activityComments.ts`**

在现有 `listActivityComments` / `commentCount` / `submitActivityComment` 基础上：

- `submitActivityComment`：有 `parentId` 时，父必须存在且 `activityId` 相同，否则 `'missing'`（测试「一层回」用 parent 1，活动 1）。写入 `likedBy: []`。不要因为深度 ≥3 而改 `parentId`；调用方传入谁就挂谁。深度 3 后再回：测试里 `parentId` 为那条深度 3 的 id。`commentDepth` 对「4→3→1」是 3；再挂在 4 上的新帖：父是 4（深度 3），新帖 `parentId=4`，深度计算 4→3→1 仍是 3？**4 的深度是 3，新帖父是 4，链是 新→4→3→1 变成 4 层。**

规格：「若被回深度已 ≥ 3，新帖 `parentId` 仍为被回 id（新帖深度也是 3）」。实现必须：**若 `commentDepth(parentId) >= 3`，新帖的 `parentId` 用被回的 `parentId`（即挂在同一第 3 层的父上），这样新帖深度仍是 3。** 且「`parentId` 仍为被回那条」——规格前后有张力。

以测试为准（Step 5 写的是 `third.parentId === second.id` 且 depth 3）。要让 depth 仍为 3 且 parentId 是 second：`commentDepth` 必须 **封顶 3**（链再长也报 3），或者新帖挂 second 时 depth 计算截断。

**实现约定（本计划锁定）：** `commentDepth` 返回 `Math.min(3, rawDepth)`。新帖 `parentId` 始终等于传入的被回 id。深度 3 的帖再被回：新帖 parentId = 该帖 id，`commentDepth` 仍 3。测试 `expect(third.parentId).toBe(second.id)` 且 `commentDepth(third) === 3` 成立。

`commentDepth` 在 `commentTree.ts` 末尾 `return Math.min(3, depth)`。更新 Step 3 的深度测试：完整链 4→3→1 raw 为 3，min 后仍 3。更长链封顶 3。在 `commentTree.test.ts` 追加一条 4 层链期望 `commentDepth === 3`。

- `listActivityCommentThreads(activityId)` = `buildCommentThreads(listActivityComments 的未排序全集)`。注意 `listActivityComments` 现在是新→旧；`buildCommentThreads` 自己排序，应传入该活动 **未排序过滤列表**：

```ts
function commentsFor(activityId: number): CommentRecord[] {
  return getRelatedList('comments').filter((item) => item.activityId === activityId);
}

export function listActivityComments(activityId: number): CommentRecord[] {
  return commentsFor(activityId)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
}

export function listActivityCommentThreads(activityId: number): CommentThread[] {
  return buildCommentThreads(commentsFor(activityId));
}

export function previewActivityCommentThreads(activityId: number): CommentThread[] {
  return previewCommentThreads(listActivityCommentThreads(activityId));
}
```

- `deleteActivityComment(id)`：找不到 `'missing'`；作者不是陈产品 `'forbidden'`；否则 `patchRelated` + `removeCommentsAndDescendants`。
- `toggleCommentLike(id)`：找不到 `'missing'`；否则 toggling `DEMO_SIGNUP_USER.name`。

- [ ] **Step 8: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/commentTree.test.ts src/features/c-end/activities/model/activityComments.test.ts`

Expected: PASS。

- [ ] **Step 9: Commit**

跳过。

---

### Task 3: Hash `#/c/{surface}/{id}/comments`

**Files:**
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/CEndApp.tsx`（本任务只加类型/解析；页面组件 Task 6 再挂。若 CEndApp 现在识别 `comments` 却没有组件，先 **不要** 在 CEndApp 分支，避免编译失败。本任务只改 navigation。）

- [ ] **Step 1: 写失败测试**

在 `C-end navigation` describe 追加：

```ts
  it('parses activity comment pages after the numeric id', () => {
    expect(parseCEndHash('#/c/h5/1/comments')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 1,
      h5Page: 'comments',
    });
    expect(parseCEndHash('#/c/pc/1/comments')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      activityId: 1,
      h5Page: 'comments',
    });
  });

  it('ignores unknown extra segments and keeps the activity detail', () => {
    expect(parseCEndHash('#/c/h5/21/nope')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 21,
    });
  });

  it('builds activity comment hashes', () => {
    expect(toH5ActivityCommentsHash(1)).toBe('#/c/h5/1/comments');
    expect(toPcActivityCommentsHash(1)).toBe('#/c/pc/1/comments');
  });
```

`H5Page` 增加 `'comments'`。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/app/navigation.test.ts`

Expected: FAIL。

- [ ] **Step 3: 改 `parseCEndHash`**

```ts
export type H5Page = 'my' | 'courses' | 'courses-mall' | 'favorites' | 'comments';
```

```ts
  const [scope, surface, rawId, extra] = path.split('/');
  ...
  const activityId = Number(rawId);
  const parsed = Number.isFinite(activityId) ? activityId : -1;
  if (extra === 'comments') {
    return { kind: 'c-end', surface, activityId: parsed, h5Page: 'comments' };
  }
  return { kind: 'c-end', surface, activityId: parsed };
```

现有 `rawId === 'my'` 等判断保持在 Number 之前。

```ts
export function toH5ActivityCommentsHash(activityId: number): string {
  return `#/c/h5/${activityId}/comments`;
}
export function goH5ActivityComments(activityId: number) {
  window.location.hash = toH5ActivityCommentsHash(activityId);
}
export function toPcActivityCommentsHash(activityId: number): string {
  return `#/c/pc/${activityId}/comments`;
}
export function goPcActivityComments(activityId: number) {
  window.location.hash = toPcActivityCommentsHash(activityId);
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/app/navigation.test.ts`

Expected: PASS。现有 `#/c/h5/21` 仍无 `h5Page`。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: `ActivityCommentList` UI

**Files:**
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentForm.tsx`
- Modify: `src/features/c-end/activities/h5/H5CommentSheet.tsx`
- Modify: `src/features/c-end/activities/pc/PcCommentModal.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 改列表为吃 threads**

`ActivityCommentList` props：

```ts
import type { CommentThread } from '../../../activities/model/commentTree';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

export function ActivityCommentList({
  threads,
  totalCount,
  showViewAll,
  onViewAll,
  onLike,
  onReply,
  onDelete,
}: {
  threads: CommentThread[];
  totalCount: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onLike: (id: number) => void;
  onReply: (id: number, replyToName: string) => void;
  onDelete: (id: number) => void;
}) {
```

标题行：左 `评论 {totalCount}`，右 `showViewAll` 时 button「查看全部」。

每条主评 `li.c-activity-comment`：作者、时间、正文、操作行：

```tsx
<button type="button" className={liked ? 'c-comment-like is-on' : 'c-comment-like'} aria-pressed={liked} aria-label="点赞" onClick={() => onLike(root.id)}>
  赞 {root.likedBy.length}
</button>
<button type="button" className="c-comment-reply" onClick={() => onReply(root.id, root.author)}>回复</button>
{root.author === DEMO_SIGNUP_USER.name ? (
  <button type="button" className="c-comment-delete" onClick={() => onDelete(root.id)}>删除</button>
) : null}
```

`liked = root.likedBy.includes(DEMO_SIGNUP_USER.name)`。

二层 `ul.c-activity-comment-replies`：作者处渲染 `reply.replyLabel`，回复按钮 `onReply(reply.id, reply.author)`。

空：`threads.length === 0` → 「暂无评论」。

- [ ] **Step 2: 表单 / sheet 支持回复标题**

`ActivityCommentForm` 增加可选 `title = '写评论'`，渲染到 `c-signup-legend`。`aria-label` 同步。

`H5CommentSheet` / `PcCommentModal` 增加可选 `title`，传给 form，dialog `aria-label` 用同一 title。

- [ ] **Step 3: CSS**

在 `.c-activity-comment` 现有规则附近：

```css
.c-activity-comment-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.c-activity-comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.c-activity-comment-actions button {
  appearance: none;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: #087f73;
  padding: 0 4px;
  font: inherit;
  cursor: pointer;
}
.c-comment-like.is-on {
  font-weight: 700;
}
.c-activity-comment-replies {
  margin: 8px 0 0;
  padding: 0 0 0 16px;
  list-style: none;
  border-left: 2px solid #e3eaf0;
}
.c-activity-comments-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.c-activity-comments-more {
  appearance: none;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: #087f73;
  font: inherit;
  cursor: pointer;
}
```

- [ ] **Step 4: 临时让详情能编译**

详情仍传 `comments={listActivityComments(id)}` 会 tsc 失败。**本任务结束后立刻做 Task 5**；若先单独 tsc，先把详情改成 threads（见 Task 5 Step 3）。推荐 Task 4+5 同一执行者连续做完。

- [ ] **Step 5: Commit**

跳过。

---

### Task 5: H5 / PC 详情接入

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

- [ ] **Step 1: 写失败测试**

H5 详情测试追加：

```ts
  it('previews two root comments, a reply label, and view-all', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'), html.indexOf('精彩瞬间'));
    expect(block).toContain('查看全部');
    expect(block).toContain('王芳 回复 张悦');
    expect(block).toContain('下午场次人有点多');
    expect(block).toContain('开放日讲解很清楚');
    expect(block).not.toContain('希望增加名额');
    expect(block).toContain('赞 ');
    expect(block).toContain('回复');
  });
```

PC 对 id={1} 同样断言（PC 详情测试里加一条；精彩瞬间切片：PC 用 `html.indexOf('精彩瞬间')` 或 catalog 后的 comments 到 `</article>`）。

PC `PcActivityDetail id={1}` 的 comments 块：

```ts
    const html = renderToStaticMarkup(<PcActivityDetail id={1} />);
    expect(html).toContain('查看全部');
    expect(html).toContain('王芳 回复 张悦');
    expect(html).not.toContain('希望增加名额');
```

苏然「希望增加名额」在第 3 条主评，详情不应出现。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 接线**

H5/PC 详情：

```ts
  const threads = previewActivityCommentThreads(id);
  const allThreads = listActivityCommentThreads(id);
  const [replyTo, setReplyTo] = useState<{ id: number; name: string }>();
```

`ActivityCommentList`：

```tsx
        <ActivityCommentList
          threads={threads}
          totalCount={commentCount(id)}
          showViewAll={allThreads.length > HOME_COMMENT_PREVIEW_LIMIT}
          onViewAll={() => goH5ActivityComments(id)}  // PC 用 goPcActivityComments
          onLike={(commentId) => toggleCommentLike(commentId)}
          onReply={(commentId, name) => {
            setReplyTo({ id: commentId, name });
            setCommentOpen(true);
          }}
          onDelete={(commentId) => deleteActivityComment(commentId)}
        />
```

sheet/modal：

```tsx
      {commentOpen ? (
        <H5CommentSheet
          title={replyTo ? `回复 @${replyTo.name}` : '写评论'}
          onCancel={() => {
            setCommentOpen(false);
            setReplyTo(undefined);
          }}
          onSubmit={(content) => {
            const result = submitActivityComment(activity.id, content, replyTo?.id);
            if (result === 'ok') {
              setCommentOpen(false);
              setReplyTo(undefined);
            }
          }}
        />
      ) : null}
```

底栏「评论」仍 `scrollIntoView` + `setCommentOpen(true)` 且 `setReplyTo(undefined)`（顶层发评）。

`HOME_COMMENT_PREVIEW_LIMIT` 从 `commentTree.ts` import。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: PASS。旧测试「开放日讲解」「评论 4」仍过。

- [ ] **Step 5: Commit**

跳过。

---

### Task 6: 评论全页 + `CEndApp`

**Files:**
- Create: `src/features/c-end/activities/h5/H5ActivityComments.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- Create: `src/features/c-end/activities/pc/PcActivityComments.tsx`
- Create: `src/features/c-end/activities/pc/PcActivityComments.test.tsx`
- Modify: `src/app/CEndApp.tsx`

- [ ] **Step 1: 写失败测试**

`H5ActivityComments.test.tsx`：

```tsx
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { restoreRelatedComments } from '../../../activities/model/related';
import { H5ActivityComments } from './H5ActivityComments';

describe('H5 activity comments page', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('lists every root including the third seed comment', () => {
    const html = renderToStaticMarkup(<H5ActivityComments id={1} />);
    expect(html).toContain('评论');
    expect(html).toContain('希望增加名额');
    expect(html).toContain('王芳 回复 张悦');
    expect(html).toContain('aria-label="返回"');
  });

  it('mounts from CEndApp comments hash page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="comments" activityId={1} />);
    expect(html).toContain('希望增加名额');
  });

  it('renders missing activity recovery', () => {
    const html = renderToStaticMarkup(<H5ActivityComments id={999999} />);
    expect(html).toContain('活动不存在');
  });
});
```

PC 镜像：`PcActivityComments`、`CEndApp surface="pc"`。壳标题区域含「评论」。PC 用按钮「返回活动」或页内返回（`goCEnd('pc', id)`），测试含「希望增加名额」。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityComments.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现全页**

H5：`H5ActivityShell title="评论" onBack={() => goCEnd('h5', id)}`。缺失页与详情相同。列表 `listActivityCommentThreads(id)`，`showViewAll={false}`。发评 sheet 与详情相同（含 replyTo）。

PC：`PcActivityShell` 内先放返回按钮再 `h2`「评论」再列表。`onBack`/`返回` → `goCEnd('pc', id)`。

`CEndApp`：在 `h5Page === 'favorites'` 之后、`activityId == null` 之前：

```tsx
      ) : h5Page === 'comments' && activityId != null ? (
        <H5ActivityComments id={activityId} />
```

PC 分支同样。`comments` 且没有 id：当首页（不要挂评论页）。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/pc/PcActivityComments.test.tsx src/app/navigation.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 7: 后台评论管理连带删 +「回复」列

**Files:**
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`（或新建 `commentTree` 已覆盖 remove；后台用同一函数。再在 `commentTree.test.ts` 测 `removeCommentsAndDescendants`。）

- [ ] **Step 1: 补纯函数测试**

`commentTree.test.ts`：

```ts
  it('removes selected roots and their descendants', () => {
    const next = removeCommentsAndDescendants(list, [1]);
    expect(next.map((item) => item.id).sort((a, b) => a - b)).toEqual([2, 5]);
  });
```

（按 Task 2 的 `list` 夹具：删 1 后剩 2 和 5。）

- [ ] **Step 2: 跑测试；若未 export 则实现已在 Task 2**

- [ ] **Step 3: 改 `CommentList`**

import `commentReplyLabel`, `removeCommentsAndDescendants` from `../../model/commentTree`。

`deleteOne`：

```ts
        patchRelated('comments', (list) => removeCommentsAndDescendants(list, [record.id]));
```

确认 `content`：`'删除后员工端不再展示该评论及其回复，且无法恢复。'`

`deleteSelected`：

```ts
        patchRelated('comments', (list) => removeCommentsAndDescendants(list, [...ids]));
```

列在「评论内容」后插入：

```ts
    {
      title: '回复',
      key: 'reply',
      width: 160,
      render: (_, record) => {
        const label = commentReplyLabel(record, data);
        return label === record.author ? '—' : label;
      },
    },
```

`data` 为该活动评论列表（组件里已有）。

- [ ] **Step 4: `npx tsc -b` + 相关测试**

Run: `npm test -- src/features/activities/model/commentTree.test.ts src/features/c-end/activities/model/activityComments.test.ts`

Expected: PASS。tsc 干净。

- [ ] **Step 5: Commit**

跳过。

---

### Task 8: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS（条数会比 161 多）。
- [ ] **Step 2:** `npx tsc -b` — 无错误。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：两条主评、王芳回复张悦、查看全部。`#/c/h5/1/comments` 有苏然。PC 同样。后台活动 1 评论管理能看到「回复」列；删张悦应带走王芳。
- [ ] **Step 4:** 跳过 commit。
