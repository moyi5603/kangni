# 员工头像 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 活动评论/回复、精彩瞬间作者与评回、后台评论人列显示圆底+末字头像。

**Architecture:** 纯函数 `employeeAvatarLetter` / `employeeAvatarColor` 共享。C 端 `EmployeeAvatar` 不用 antd。后台用 antd `Avatar` 同一套字母/色。

**Tech Stack:** React 19、TypeScript、Vitest、antd 仅后台。C 端不用 antd。

---

## File map

- Create: `src/features/activities/model/employeeAvatar.ts`
- Create: `src/features/activities/model/employeeAvatar.test.ts`
- Create: `src/features/c-end/activities/components/EmployeeAvatar.tsx`
- Create: `src/features/c-end/activities/components/MomentFeed.test.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/components/MomentFeed.tsx`
- Modify: `src/features/c-end/activities/styles.css`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`

规格：`docs/superpowers/specs/2026-08-20-employee-avatar-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

C 端不用 antd。不要给 `OrgPerson` 加 `avatarUrl`。不要改报名/收藏卡。不要改后台报名表和瞬间管理表。

---

### Task 1: 字母与颜色纯函数

**Files:**
- Create: `src/features/activities/model/employeeAvatar.ts`
- Create: `src/features/activities/model/employeeAvatar.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { employeeAvatarColor, employeeAvatarLetter } from './employeeAvatar';

describe('employee avatar', () => {
  it('uses the last character and maps blank names to ?', () => {
    expect(employeeAvatarLetter('张悦')).toBe('悦');
    expect(employeeAvatarLetter('  ')).toBe('?');
    expect(employeeAvatarLetter('')).toBe('?');
  });

  it('keeps the same color for the same name', () => {
    expect(employeeAvatarColor('张悦')).toBe(employeeAvatarColor('张悦'));
    expect(employeeAvatarColor('张悦')).toMatch(/^#/);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/employeeAvatar.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现**

`employeeAvatar.ts` 按规格原文：

```ts
export const EMPLOYEE_AVATAR_COLORS = [
  '#0f766e',
  '#0e7490',
  '#1d4ed8',
  '#6d28d9',
  '#be185d',
  '#c2410c',
  '#3f6212',
  '#334155',
] as const;

export function employeeAvatarLetter(name: string): string {
  const text = name.replace(/\s+/g, '');
  return text ? text.slice(-1) : '?';
}

export function employeeAvatarColor(name: string): string {
  const text = name.replace(/\s+/g, '');
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return EMPLOYEE_AVATAR_COLORS[hash % EMPLOYEE_AVATAR_COLORS.length]!;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/employeeAvatar.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: C 端 `EmployeeAvatar` + 活动评论列表

**Files:**
- Create: `src/features/c-end/activities/components/EmployeeAvatar.tsx`
- Modify: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Modify: `src/features/c-end/activities/styles.css`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityComments.test.tsx`

- [ ] **Step 1: 改失败测试**

`H5ActivityDetail.test.tsx` 预览用例（评论块 slice）追加：

```ts
    expect(block).toContain('c-avatar');
    expect(block).toContain('张悦');
```

`H5ActivityComments.test.tsx` `lists every root...` 追加：

```ts
    expect(html).toContain('c-avatar');
    expect(html).toContain('王芳 回复 张悦');
```

（后一条可能已有。）

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx`

Expected: FAIL，详情评论块无 `c-avatar`。

- [ ] **Step 3: 组件 + 列表 + CSS**

`EmployeeAvatar.tsx`：

```tsx
import { employeeAvatarColor, employeeAvatarLetter } from '../../../activities/model/employeeAvatar';

export function EmployeeAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`c-avatar c-avatar-${size}`}
      style={{ background: employeeAvatarColor(name) }}
      aria-hidden
    >
      {employeeAvatarLetter(name)}
    </span>
  );
}
```

无 antd。

`ActivityCommentList` 每条主评/回复改两列。主评：

```tsx
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
```

保留现有 section / head / 空态 / 确认层。import `EmployeeAvatar`。

`styles.css` 在 `.c-activity-comment` 附近：

```css
.c-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  font-weight: 600;
  line-height: 1;
}
.c-avatar-sm {
  width: 28px;
  height: 28px;
  font-size: 12px;
}
.c-avatar-md {
  width: 36px;
  height: 36px;
  font-size: 14px;
}
.c-activity-comment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.c-activity-comment-main {
  flex: 1;
  min-width: 0;
}
```

现有 `.c-activity-comment { padding... border-bottom }` 合并进 flex 规则，不要丢掉 padding/border。`.c-activity-comment-head` 保持 space-between。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/activities/model/employeeAvatar.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: 精彩瞬间

**Files:**
- Modify: `src/features/c-end/activities/components/MomentFeed.tsx`
- Create: `src/features/c-end/activities/components/MomentFeed.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

`MomentFeed.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getPublishedActivity } from '../model/clientActivity';
import { MomentFeed } from './MomentFeed';

describe('MomentFeed avatars', () => {
  it('shows author avatars on moments and comments', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(<MomentFeed activity={activity!} onCompose={() => undefined} />);
    expect(html).toContain('c-avatar-md');
    expect(html).toContain('c-avatar-sm');
    expect(html).toContain('张悦');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/components/MomentFeed.test.tsx`

Expected: FAIL，无 `c-avatar-md`。

- [ ] **Step 3: 接线 MomentFeed**

`c-moment-meta`：

```tsx
      <div className="c-moment-meta">
        <EmployeeAvatar name={moment.author} size="md" />
        <div className="c-moment-meta-main">
          <strong>{moment.author}</strong>
          <span>{moment.createdAt.slice(0, 16)}</span>
          {moment.status === '待审核' ? <span className="c-moment-flag">审核中</span> : null}
          {moment.status === '已驳回' ? <span className="c-moment-flag is-reject">已驳回</span> : null}
        </div>
      </div>
```

评论行：

```tsx
                <p className="c-moment-comment-row">
                  <EmployeeAvatar name={item.author} />
                  <span>
                    <CommentAuthor name={item.author} />
                    {item.content}
                  </span>
                </p>
```

回复行：

```tsx
                  <p key={entry.id} className="c-moment-reply c-moment-comment-row">
                    <EmployeeAvatar name={entry.author} />
                    <span>
                      <CommentAuthor name={entry.author} />
                      {entry.content}
                    </span>
                  </p>
```

import `EmployeeAvatar`。不要改 like/publish 逻辑。

CSS 补：

```css
.c-moment-meta {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.c-moment-meta-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.c-moment-comment-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
```

若已有 `.c-moment-meta` 规则，合并 display/gap，不要删掉原有字号颜色。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/components/MomentFeed.test.tsx src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: 后台评论人列

**Files:**
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`

- [ ] **Step 1: 改评论人列**

antd 已引入 `Space`。在 `antd` import 里加上 `Avatar`。

从 `../model/employeeAvatar` import `employeeAvatarColor`, `employeeAvatarLetter`。

把 `{ title: '评论人', dataIndex: 'author', width: 110 }` 换成规格中的 render（width 160，Avatar 28 + 姓名）。不要改报名列。

C 端文件不要 import antd。

- [ ] **Step 2: `npx tsc -b`**

若仅 `CourseListPage.tsx` 预存在错误、与本任务无关，不要为修它扩大范围。本任务改动的文件不能有新的 tsc 错。

- [ ] **Step 3: Commit**

跳过。

---

### Task 5: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 记录结果。评论/头像相关无新错。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：评论有圆头像；查看全部回复也有；精彩瞬间作者 md、评回 sm。后台活动 1 评论管理评论人列有 Avatar。
- [ ] **Step 4:** 跳过 commit。
