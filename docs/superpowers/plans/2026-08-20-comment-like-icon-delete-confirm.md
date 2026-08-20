# 评论点赞图标与删除二次确认 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 评论赞改成拇指图标 + 数字；点删除先出 H5 sheet / PC modal，确认才删。

**Architecture:** 共享 `ActivityDeleteConfirm` 文案按钮。`H5DeleteSheet` / `PcDeleteModal` 套现有 `c-sheet` / `c-modal`。`ActivityCommentList` 持 `pendingId` + `surface`，确认前不调 `onDelete`。数据层 `deleteActivityComment` / `toggleCommentLike` 不改。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`。C 端不用 antd。

---

## File map

- Create: `src/features/c-end/activities/components/ActivityDeleteConfirm.tsx`
- Create: `src/features/c-end/activities/components/ActivityDeleteConfirm.test.tsx`
- Create: `src/features/c-end/activities/h5/H5DeleteSheet.tsx`
- Create: `src/features/c-end/activities/pc/PcDeleteModal.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityComments.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityComments.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

规格：`docs/superpowers/specs/2026-08-20-comment-like-icon-delete-confirm-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

C 端不用 antd。不要改 `related.ts` 种子。不要改 `activityComments.ts` 写操作。不要改后台 `CommentList`。不要改 `DetailEngageBar`。不要改精彩瞬间评论。

`IconLike` 已在 `src/features/c-end/activities/components/Icons.tsx`。底栏已用它，评论行复用。

Task 2 改列表 props 后立刻接线 Task 3，避免 `surface` 必填导致 tsc 红。推荐同一执行者连续做完 Task 2+3。

---

### Task 1: 确认内容 + 两端壳

**Files:**
- Create: `src/features/c-end/activities/components/ActivityDeleteConfirm.tsx`
- Create: `src/features/c-end/activities/components/ActivityDeleteConfirm.test.tsx`
- Create: `src/features/c-end/activities/h5/H5DeleteSheet.tsx`
- Create: `src/features/c-end/activities/pc/PcDeleteModal.tsx`

- [ ] **Step 1: 写失败测试**

`ActivityDeleteConfirm.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActivityDeleteConfirm } from './ActivityDeleteConfirm';
import { H5DeleteSheet } from '../h5/H5DeleteSheet';
import { PcDeleteModal } from '../pc/PcDeleteModal';

const noop = () => undefined;

describe('activity delete confirm', () => {
  it('renders title, cascade copy, and actions', () => {
    const html = renderToStaticMarkup(<ActivityDeleteConfirm onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('删除评论');
    expect(html).toContain('删除后将同时删除其下回复，且无法恢复。');
    expect(html).toContain('确认删除');
    expect(html).toContain('取消');
  });

  it('wraps confirm in an H5 sheet dialog', () => {
    const html = renderToStaticMarkup(<H5DeleteSheet onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('c-sheet');
    expect(html).toContain('aria-label="删除评论"');
    expect(html).toContain('确认删除');
  });

  it('wraps confirm in a PC modal dialog', () => {
    const html = renderToStaticMarkup(<PcDeleteModal onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('c-modal');
    expect(html).toContain('aria-label="删除评论"');
    expect(html).toContain('确认删除');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/components/ActivityDeleteConfirm.test.tsx`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现三文件**

`ActivityDeleteConfirm.tsx`：

```tsx
export function ActivityDeleteConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-signup-form">
      <p className="c-signup-legend">删除评论</p>
      <p>删除后将同时删除其下回复，且无法恢复。</p>
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="button" onClick={onConfirm}>
          确认删除
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}
```

`H5DeleteSheet.tsx`（对齐 `H5CommentSheet` 遮罩）：

```tsx
import { ActivityDeleteConfirm } from '../components/ActivityDeleteConfirm';

export function H5DeleteSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-sheet-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="删除评论"
        onClick={(event) => event.stopPropagation()}
      >
        <ActivityDeleteConfirm onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
```

`PcDeleteModal.tsx`（对齐 `PcCommentModal`）：

```tsx
import { ActivityDeleteConfirm } from '../components/ActivityDeleteConfirm';

export function PcDeleteModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="c-modal"
        role="dialog"
        aria-modal="true"
        aria-label="删除评论"
        onClick={(event) => event.stopPropagation()}
      >
        <ActivityDeleteConfirm onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
```

无 antd。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/components/ActivityDeleteConfirm.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 列表赞图标 + pending 确认

**Files:**
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

本任务结束后**立刻做 Task 3**（四处补 `surface`），否则 tsc 因缺 `surface` 失败。

- [ ] **Step 1: 改会失败的详情测试**

`H5ActivityDetail.test.tsx` 现有 `previews two root comments...` 把 `expect(block).toContain('赞 ');` 换成：

```ts
    expect(block).toContain('aria-label="点赞"');
    expect(block).toContain('class="c-icon"');
    expect(block).not.toContain('赞 ');
    expect(block).toContain('回复');
```

（原来已有 `toContain('回复')`，不要重复两次。）

同文件追加（已有 `afterEach` restore）：

```ts
  it('shows delete for own comments with confirm closed', () => {
    expect(submitActivityComment(1, '我的楼')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'), html.indexOf('精彩瞬间'));
    expect(block).toContain('删除');
    expect(block).not.toContain('确认删除');
  });
```

顶部增加：

```ts
import { submitActivityComment } from '../model/activityComments';
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

Expected: FAIL，评论块仍有「赞 」，种子无陈产品评论故无「删除」。

- [ ] **Step 3: 改 `ActivityCommentList`**

`CommentActions` 的删除改为请求确认，不再直接 `onDelete`：

```tsx
import { useState } from 'react';
import type { CommentRecord } from '../../../activities/model/related';
import type { CommentThread } from '../../../activities/model/commentTree';
import { H5DeleteSheet } from '../h5/H5DeleteSheet';
import { PcDeleteModal } from '../pc/PcDeleteModal';
import { DEMO_SIGNUP_USER } from '../model/signupStore';
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
  showViewAll,
  onViewAll,
  onLike,
  onReply,
  onDelete,
  surface,
}: {
  threads: CommentThread[];
  totalCount: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onLike: (id: number) => void;
  onReply: (id: number, replyToName: string) => void;
  onDelete: (id: number) => void;
  surface: 'h5' | 'pc';
}) {
  const [pendingId, setPendingId] = useState<number>();
  const closeConfirm = () => setPendingId(undefined);
  const confirmDelete = () => {
    if (pendingId == null) return;
    onDelete(pendingId);
    setPendingId(undefined);
  };

  return (
    <section className="c-activity-comments" id="activity-comments" aria-labelledby="activity-comments-title">
      <div className="c-activity-comments-head">
        <h2 id="activity-comments-title" className="c-detail-name c-detail-section">
          评论 {totalCount}
        </h2>
        {showViewAll ? (
          <button type="button" className="c-activity-comments-more" onClick={onViewAll}>
            查看全部
          </button>
        ) : null}
      </div>
      {threads.length === 0 ? (
        <p className="c-empty">暂无评论</p>
      ) : (
        <ul className="c-activity-comment-list">
          {threads.map((thread) => (
            <li key={thread.root.id} className="c-activity-comment">
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
                      <div className="c-activity-comment-head">
                        <span>{reply.replyLabel}</span>
                        <time>{reply.createdAt}</time>
                      </div>
                      <p>{reply.content}</p>
                      <CommentActions item={reply} onLike={onLike} onReply={onReply} onDeleteRequest={setPendingId} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
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

确认层在 `section` 末尾，不要塞进每条 `li`。默认 `pendingId` 空：SSR 无「确认删除」。

- [ ] **Step 4: CSS**

在 `.c-comment-like.is-on` 附近加：

```css
.c-comment-like {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.c-comment-like .c-icon {
  width: 18px;
  height: 18px;
}
```

已有 `.c-activity-comment-actions button` 规则不要删。

- [ ] **Step 5: Commit**

跳过。立刻 Task 3。

---

### Task 3: 四处传入 `surface`

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityComments.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityComments.tsx`

每个 `<ActivityCommentList` 增加一行，其它 props 不动：

H5 详情 / H5 全页：

```tsx
          surface="h5"
```

PC 详情 / PC 全页：

```tsx
              surface="pc"
```

H5 详情约 `H5ActivityDetail.tsx` 的 `<ActivityCommentList`；H5 全页 `H5ActivityComments.tsx`；PC 详情 `PcActivityDetail.tsx`；PC 全页 `PcActivityComments.tsx`。

- [ ] **Step 1: 四处补 `surface`**

- [ ] **Step 2: 跑测试**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/components/ActivityDeleteConfirm.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/pc/PcActivityComments.test.tsx`

Expected: PASS。旧「查看全部」「王芳 回复 张悦」「评论 4」仍过。

- [ ] **Step 3: `npx tsc -b`**

Expected: 无错误。

- [ ] **Step 4: Commit**

跳过。

---

### Task 4: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 无错误。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：评论行拇指 + 数字，无「赞 n」。发一条评论后点删除出 sheet，取消不删，确认才删。PC `#/c/pc/1` 出 modal。后台删除确认外观不要求变。
- [ ] **Step 4:** 跳过 commit。
