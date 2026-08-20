# 详情内嵌评论分页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 取消活动评论二级页；详情评论 tab 出全楼；主评按 10 条滚动加载；详情保留「写评论」。

**Architecture:** `COMMENT_PAGE_SIZE` + `sliceCommentThreads` / `nextVisibleCommentCount`。`ActivityCommentList` 自己切片和哨兵。旧 `/comments` hash 当详情。删除 H5/PC 评论页。

**Tech Stack:** TypeScript、Vitest、React 19。C 端不用 antd。

---

## File map

- Modify: `src/features/activities/model/commentTree.ts`
- Modify: `src/features/activities/model/commentTree.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/CEndApp.tsx`
- Delete: `src/features/c-end/activities/h5/H5ActivityComments.tsx`
- Delete: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- Delete: `src/features/c-end/activities/pc/PcActivityComments.tsx`
- Delete: `src/features/c-end/activities/pc/PcActivityComments.test.tsx`

规格：`docs/superpowers/specs/2026-08-20-detail-comments-pager-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

不改后台评论、不改建树、不改瞬间分页、C 端不用 antd。课程 `course-comments` 不动。列表「我的报名」里「查看全部」不动。

---

### Task 1: 分页纯函数，去掉预览 API

**Files:**
- Modify: `src/features/activities/model/commentTree.ts`
- Modify: `src/features/activities/model/commentTree.test.ts`
- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`

- [ ] **Step 1: 写失败测试**

`commentTree.test.ts`：删 `previews two root threads without replies` 整段；删 `previewCommentThreads` import。

`activityComments.test.ts`：

- import 去掉 `previewActivityCommentThreads`、`shouldShowActivityCommentViewAll`，加上 `sliceCommentThreads`、`nextVisibleCommentCount`。
- `builds threads with flattened replies and preview limit 2` 改名为 `builds threads with flattened replies`，删 preview / view-all 四行，保留 threads 顺序和 replyLabel。
- `hides view-all when only two root comments` **整段删除**。
- camp 用例 `orders camp roots...` 删 preview / `shouldShowActivityCommentViewAll` 四行，保留 root 顺序和 two-layer replies。
- 追加：

```ts
  it('slices root threads for paged detail', () => {
    const threads = listActivityCommentThreads(1);
    expect(sliceCommentThreads(threads, 10)).toHaveLength(6);
    expect(sliceCommentThreads(threads, 2).map((item) => item.root.id)).toEqual([2, 1]);
    expect(sliceCommentThreads(threads, 2)[0]?.replies.length).toBeGreaterThan(0);
    expect(nextVisibleCommentCount(10, 12)).toBe(12);
    expect(nextVisibleCommentCount(10, 25)).toBe(20);
    expect(nextVisibleCommentCount(6, 6)).toBe(6);
  });
```

- [ ] **Step 2:** `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/activities/model/commentTree.test.ts`

Expected: FAIL，`sliceCommentThreads` / `nextVisibleCommentCount` 未导出。

- [ ] **Step 3: 实现**

`commentTree.ts`：把 `HOME_COMMENT_PREVIEW_LIMIT` 换成：

```ts
export const COMMENT_PAGE_SIZE = 10;
```

删除 `previewCommentThreads` 整函数。

`activityComments.ts`：删 `HOME_COMMENT_PREVIEW_LIMIT`、`previewCommentThreads` import；删 `previewActivityCommentThreads`、`shouldShowActivityCommentViewAll`。追加：

```ts
import { COMMENT_PAGE_SIZE, type CommentThread } from '../../../activities/model/commentTree';
```

（若 `CommentThread` 已从 commentTree import，合并。）

```ts
export function sliceCommentThreads(threads: CommentThread[], limit: number): CommentThread[] {
  return threads.slice(0, Math.max(0, limit));
}

export function nextVisibleCommentCount(visible: number, total: number, pageSize = COMMENT_PAGE_SIZE): number {
  if (visible >= total) return total;
  return Math.min(total, visible + pageSize);
}
```

Grep 仓库确认无残留 `previewActivityCommentThreads` / `HOME_COMMENT_PREVIEW_LIMIT` / `previewCommentThreads`（本任务后详情仍会暂时编译失败，Task 3 修）。

- [ ] **Step 4:** 同 Step 2。Expected：这两文件 PASS。详情测试可能仍红，本任务不管。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 列表切片 + 写评论 + 哨兵

**Files:**
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.test.tsx`

- [ ] **Step 1: 写失败测试**

`ActivityCommentList.test.tsx` **整文件替换**：

```tsx
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { patchRelated, restoreRelatedComments } from '../../../activities/model/related';
import { commentCount, listActivityCommentThreads } from '../model/activityComments';
import { ActivityCommentList } from './ActivityCommentList';

describe('ActivityCommentList paging', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('omits heading when hideTitle and has compose, no view-all', () => {
    const html = renderToStaticMarkup(
      <ActivityCommentList
        threads={listActivityCommentThreads(1)}
        totalCount={commentCount(1)}
        onLike={() => undefined}
        onReply={() => undefined}
        onDelete={() => undefined}
        onCompose={() => undefined}
        surface="h5"
        hideTitle
      />,
    );
    expect(html).not.toContain('activity-comments-title');
    expect(html).not.toContain('查看全部');
    expect(html).toContain('写评论');
    expect(html).toContain('开放日讲解很清楚');
    expect(html).toContain('希望增加名额');
    expect(html).toContain('王芳 回复 张悦');
  });

  it('shows first 10 roots only when more than a page exists', () => {
    patchRelated('comments', () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        activityId: 99,
        content: `主评${index + 1}`,
        author: '张悦',
        createdAt: `2026-08-18 ${String(10 + index).padStart(2, '0')}:00:00`,
        likedBy: [] as string[],
      })),
    );
    const threads = listActivityCommentThreads(99);
    expect(threads).toHaveLength(12);
    const html = renderToStaticMarkup(
      <ActivityCommentList
        threads={threads}
        totalCount={12}
        onLike={() => undefined}
        onReply={() => undefined}
        onDelete={() => undefined}
        onCompose={() => undefined}
        surface="h5"
      />,
    );
    expect(html).toContain(threads[9]!.root.content);
    expect(html).not.toContain(threads[10]!.root.content);
    expect(html).toContain('data-comment-sentinel');
  });
});
```

- [ ] **Step 2:** `npm test -- src/features/c-end/activities/components/ActivityCommentList.test.tsx`

Expected: FAIL（仍要 `showViewAll` 或没有「写评论」/哨兵）。

- [ ] **Step 3: 重写列表**

`ActivityCommentList.tsx` **整文件替换**为：

```tsx
import { useEffect, useRef, useState } from 'react';
import type { CommentRecord } from '../../../activities/model/related';
import { COMMENT_PAGE_SIZE, type CommentThread } from '../../../activities/model/commentTree';
import { nextVisibleCommentCount, sliceCommentThreads } from '../model/activityComments';
import { H5DeleteSheet } from '../h5/H5DeleteSheet';
import { PcDeleteModal } from '../pc/PcDeleteModal';
import { DEMO_SIGNUP_USER } from '../model/signupStore';
import { EmployeeAvatar } from './EmployeeAvatar';
import { IconLike } from './Icons';

function CommentActions({
  item,
  onLike,
  onReply,
  onDeleteRequest,
}: {
  item: CommentRecord;
  onLike: (id: number) => void;
  onReply: (id: number, replyToName: string) => void;
  onDeleteRequest: (id: number) => void;
}) {
  const liked = item.likedBy.includes(DEMO_SIGNUP_USER.name);
  return (
    <div className="c-activity-comment-actions">
      <button
        type="button"
        className={liked ? 'c-comment-like is-on' : 'c-comment-like'}
        aria-pressed={liked}
        aria-label="点赞"
        onClick={() => onLike(item.id)}
      >
        <IconLike />
        {item.likedBy.length}
      </button>
      <button type="button" className="c-comment-reply" onClick={() => onReply(item.id, item.author)}>
        回复
      </button>
      {item.author === DEMO_SIGNUP_USER.name ? (
        <button type="button" className="c-comment-delete" onClick={() => onDeleteRequest(item.id)}>
          删除
        </button>
      ) : null}
    </div>
  );
}

export function ActivityCommentList({
  threads,
  totalCount,
  onLike,
  onReply,
  onDelete,
  onCompose,
  surface,
  hideTitle,
}: {
  threads: CommentThread[];
  totalCount: number;
  onLike: (id: number) => void;
  onReply: (id: number, replyToName: string) => void;
  onDelete: (id: number) => void;
  onCompose?: () => void;
  surface: 'h5' | 'pc';
  hideTitle?: boolean;
}) {
  const [pendingId, setPendingId] = useState<number>();
  const [visibleCount, setVisibleCount] = useState(() => Math.min(COMMENT_PAGE_SIZE, threads.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleThreads = sliceCommentThreads(threads, visibleCount);
  const hasMore = visibleCount < threads.length;

  useEffect(() => {
    setVisibleCount((current) => Math.max(current, Math.min(COMMENT_PAGE_SIZE, threads.length)));
  }, [threads.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => nextVisibleCommentCount(current, threads.length));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, threads.length]);

  const closeConfirm = () => setPendingId(undefined);
  const confirmDelete = () => {
    if (pendingId == null) return;
    onDelete(pendingId);
    setPendingId(undefined);
  };

  return (
    <section
      className="c-activity-comments"
      id="activity-comments"
      {...(hideTitle ? { 'aria-label': '评论' } : { 'aria-labelledby': 'activity-comments-title' })}
    >
      {hideTitle ? null : (
        <div className="c-activity-comments-head">
          <h2 id="activity-comments-title" className="c-detail-name c-detail-section">
            评论 {totalCount}
          </h2>
        </div>
      )}
      {threads.length === 0 ? (
        <p className="c-empty">暂无评论</p>
      ) : (
        <ul className="c-activity-comment-list">
          {visibleThreads.map((thread) => (
            <li key={thread.root.id} className="c-activity-comment">
              <EmployeeAvatar name={thread.root.author} />
              <div className="c-activity-comment-main">
                <div className="c-activity-comment-head">
                  <span>{thread.root.author}</span>
                  <time>{thread.root.createdAt}</time>
                </div>
                <p>{thread.root.content}</p>
                <CommentActions item={thread.root} onLike={onLike} onReply={onReply} onDeleteRequest={setPendingId} />
                {thread.replies.length > 0 ? (
                  <ul className="c-activity-comment-replies">
                    {thread.replies.map((reply) => (
                      <li key={reply.id} className="c-activity-comment">
                        <EmployeeAvatar name={reply.author} />
                        <div className="c-activity-comment-main">
                          <div className="c-activity-comment-head">
                            <span>{reply.replyLabel}</span>
                            <time>{reply.createdAt}</time>
                          </div>
                          <p>{reply.content}</p>
                          <CommentActions item={reply} onLike={onLike} onReply={onReply} onDeleteRequest={setPendingId} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {hasMore ? <div ref={sentinelRef} data-comment-sentinel="" /> : null}
      {onCompose ? (
        <button className="c-btn c-btn-primary" type="button" onClick={onCompose}>
          写评论
        </button>
      ) : null}
      {pendingId != null ? (
        surface === 'h5' ? (
          <H5DeleteSheet onCancel={closeConfirm} onConfirm={confirmDelete} />
        ) : (
          <PcDeleteModal onCancel={closeConfirm} onConfirm={confirmDelete} />
        )
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4:** 同 Step 2。Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: H5/PC 详情接线

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

- [ ] **Step 1: 改失败测试**

`H5ActivityDetail.test.tsx`：

- 第一个用例保留 CTA/tab；`开场致辞` 那行不动（瞬间文案）。
- `previews two root comments...` **整段替换**为：

```ts
  it('lists all open-day threads on detail without view-all', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'));
    expect(block).not.toContain('查看全部');
    expect(block).toContain('写评论');
    expect(block).toContain('王芳 回复 张悦');
    expect(block).toContain('谢谢认可');
    expect(block).toContain('下午场次人有点多');
    expect(block).toContain('开放日讲解很清楚');
    expect(block).toContain('希望增加名额');
    expect(block).toContain('回复');
    expect(block).toContain('c-avatar');
    expect(html).toContain('c-social-tab');
  });
```

- `previews two camp roots...` **替换**为：

```ts
  it('lists camp threads including two-layer replies on detail', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={2} />);
    expect(html).toContain('评论 6');
    expect(html).not.toContain('查看全部');
    expect(html).toContain('食堂窗口排队有点长。');
    expect(html).toContain('结业证书什么时候发？');
    expect(html).toContain('实操课节奏合适');
    expect(html).toContain('王芳 回复 苏然');
    expect(html).toContain('陈产品 回复 王芳');
  });
```

`PcActivityDetail.test.tsx` `previews two root comments without replies, and view-all` 替换为：

```ts
  it('lists open-day threads on detail without view-all', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={1} />);
    expect(html).not.toContain('查看全部');
    expect(html).toContain('写评论');
    expect(html).toContain('下午场次人有点多');
    expect(html).toContain('王芳 回复 张悦');
    expect(html).toContain('希望增加名额');
  });
```

- [ ] **Step 2:** `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: FAIL（详情仍 preview 或仍有 查看全部；或仍传 `showViewAll` 编不过）。

- [ ] **Step 3: 接线**

`H5ActivityDetail.tsx`：

- import `goCEnd` 保留，删 `goH5ActivityComments`。
- `previewActivityCommentThreads` / `shouldShowActivityCommentViewAll` 换成 `listActivityCommentThreads`。
- `const threads = listActivityCommentThreads(id);`
- `ActivityCommentList` 去掉 `showViewAll` / `onViewAll`，加：

```tsx
              onCompose={() => {
                setReplyTo(undefined);
                setCommentOpen(true);
              }}
```

`PcActivityDetail.tsx` 同样：删 `goPcActivityComments`（保留 `goCEnd`），`listActivityCommentThreads`，`onCompose` 打开现 `commentOpen` 且 `setReplyTo(undefined)`。

- [ ] **Step 4:** 同 Step 2。Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: 路由落地详情，删二级页

**Files:**
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/CEndApp.tsx`
- Delete: 四个 `H5ActivityComments` / `PcActivityComments` 源与测试

- [ ] **Step 1: 改失败测试**

`navigation.test.ts`：

- import 删 `toH5ActivityCommentsHash`、`toPcActivityCommentsHash`。
- `parses activity comment pages after the numeric id` 改成：

```ts
  it('treats activity comments hash as activity detail', () => {
    expect(parseCEndHash('#/c/h5/1/comments')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 1,
    });
    expect(parseCEndHash('#/c/pc/1/comments')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      activityId: 1,
    });
  });
```

- 删 `builds activity comment hashes` 整段。

- [ ] **Step 2:** `npm test -- src/app/navigation.test.ts src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/pc/PcActivityComments.test.tsx`

Expected: hash 断言失败。评论页测试稍后随文件删除。

- [ ] **Step 3:**

`navigation.ts`：

```ts
export type H5Page = 'my' | 'courses' | 'course-detail' | 'favorites';
```

删 `if (extra === 'comments') { ... }` 整块，留下 `return { kind: 'c-end', surface, activityId: parsed };`。

删 `toH5ActivityCommentsHash`、`goH5ActivityComments`、`toPcActivityCommentsHash`、`goPcActivityComments`。

`CEndApp.tsx`：删 `H5ActivityComments` / `PcActivityComments` import 与两处 `h5Page === 'comments'` 分支（H5 那支并到 `activityId == null ? Home : Detail`；PC 同理）。

删除文件：

- `src/features/c-end/activities/h5/H5ActivityComments.tsx`
- `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- `src/features/c-end/activities/pc/PcActivityComments.tsx`
- `src/features/c-end/activities/pc/PcActivityComments.test.tsx`

Grep `H5ActivityComments`、`goH5ActivityComments`、`h5Page: 'comments'` 必须为空。

- [ ] **Step 4:** `npm test -- src/app/navigation.test.ts src/app/CEndApp.tsx src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

可加：`renderToStaticMarkup(<CEndApp surface="h5" activityId={1} />)` 含 `希望增加名额`（若无现成用例，把原 comments 页 `mounts from CEndApp` 期望并进 `H5ActivityDetail.test.tsx`）：

```ts
  it('shows full comments when CEndApp opens an activity', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" activityId={1} />);
    expect(html).toContain('希望增加名额');
  });
```

需 import `CEndApp`。Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 5: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 0 errors。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：无「查看全部」；6 主评+回复都在；有「写评论」。`#/c/h5/1/comments` 仍是详情不是独立评论页。无浏览器则 SKIP。
- [ ] **Step 4:** 跳过 commit。

---

## 自检

| 规格项 | 任务 |
|---|---|
| `COMMENT_PAGE_SIZE` / slice / nextVisible | Task 1 |
| 去掉 preview / 查看全部 API | Task 1 |
| 列表分页 + 写评论 + 哨兵 | Task 2 |
| 详情全量 threads | Task 3 |
| 旧 hash → 详情，删二级页 | Task 4 |
| 全量测 | Task 5 |
