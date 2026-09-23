# 论坛 H5 / 管理后台数据联动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 论坛 H5 与后台继续共用 `forumStore`：下架/驳回/停用对 H5 不可见；改板块名级联帖子；周敏楼层回复进同一帖；禁言拦 H5 发评。

**Architecture:** 不新建 store。可见性抽 `isClientForumTopicVisible`，详情与列表共用。`saveForumBoard` 改名时改 `topics[].boardName`。`addClientTopicComment` 在校验通过后查周敏生效禁言。H5 底栏/楼层回复 UI 已有，不重做、不删嵌套回复。

**Tech Stack:** 内存 `forumStore`、Vitest、`renderToStaticMarkup`、antd `App`。不写 localStorage。不上后端。

---

## File map

- Modify: `src/features/c-end/forum/model/clientForum.ts`
- Modify: `src/features/c-end/forum/model/clientForum.test.ts`
- Modify: `src/features/c-end/forum/h5/H5ForumTopic.tsx`
- Modify: `src/features/c-end/forum/h5/H5ForumBoard.test.tsx`
- Modify: `src/features/forum/model/forumStore.ts`
- Create: `src/features/forum/model/forumStore.sync.test.ts`

规格：`docs/superpowers/specs/2026-09-20-forum-h5-admin-data-sync-design.md`。

现状：`addClientTopicComment` / H5 底栏已存在。无 `H5ForumHome`（`#/c/h5/forum` 打开 `H5ForumBoard id=1`）。停用验收用板页空态，不重建首页。

每项末尾**不要 commit**（除非用户明确要求）。

---

### Task 1: H5 详情可见性

**Files:**
- Modify: `src/features/c-end/forum/model/clientForum.ts`
- Modify: `src/features/c-end/forum/model/clientForum.test.ts`
- Modify: `src/features/c-end/forum/h5/H5ForumTopic.tsx`
- Modify: `src/features/c-end/forum/h5/H5ForumBoard.test.tsx`

- [ ] **Step 1: 写失败测试**

`clientForum.test.ts` 增加：

```ts
import { isClientForumTopicVisible, visibleClientForumTopics } from './clientForum';

it('hides off-shelf and rejected topics from C-end', () => {
  const chair = initialTopics.find((item) => item.title.includes('人体工学椅'))!;
  expect(isClientForumTopicVisible(chair)).toBe(true);
  expect(isClientForumTopicVisible({ ...chair, shelfStatus: 'off' })).toBe(false);
  expect(isClientForumTopicVisible({ ...chair, auditStatus: '待审核' })).toBe(false);
  const rejected = initialTopics.find((item) => item.title.includes('午间健身'))!;
  expect(rejected.auditStatus).toBe('已驳回');
  expect(isClientForumTopicVisible(rejected)).toBe(false);
  expect(visibleClientForumTopics(initialTopics, '建议论坛').some((item) => item.id === rejected.id)).toBe(false);
});
```

`H5ForumBoard.test.tsx` 的 import 加上 `setTopicShelf`，并加：

```ts
it('hides unshelved and rejected topics on H5 detail', () => {
  setTopicShelf(1, 'off');
  expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).not.toContain('人体工学椅');
  expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('帖子不存在');
  expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).not.toContain('c-forum-topic-body');
  expect(renderToStaticMarkup(<H5ForumTopic id={17} />)).toContain('帖子不存在');
  expect(renderToStaticMarkup(<H5ForumTopic id={17} />)).not.toContain('午间健身');
});
```

id 17 = 种子「建议开放更多午间健身课程」（`已驳回`）。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/c-end/forum/model/clientForum.test.ts src/features/c-end/forum/h5/H5ForumBoard.test.tsx
```

Expected: FAIL，`isClientForumTopicVisible` 未导出；`H5ForumTopic id={1}` 下架后仍有正文；id 17 仍渲染驳回帖。

- [ ] **Step 3: 最小实现**

`clientForum.ts`：

```ts
export function isClientForumTopicVisible(topic: Pick<ForumTopic, 'shelfStatus' | 'auditStatus'>): boolean {
  return topic.shelfStatus !== 'off' && !HIDDEN_AUDIT.includes(topic.auditStatus);
}

export function visibleClientForumTopics(topics: ForumTopic[], boardName: string): ForumTopic[] {
  return topics.filter((item) => item.boardName === boardName && isClientForumTopicVisible(item));
}
```

`H5ForumTopic.tsx` 在找到 `topic` / `board` 之后、主内容之前：

```ts
import { formatForumPostDate, isClientForumTopicVisible, isOwnClientTopic, sortClientTopicComments, topicReplyCount, capForumComposeImages, FORUM_COMPOSE_IMAGE_MAX, type ForumCommentSort } from '../model/clientForum';
```

把「仅 `!topic`」的空态扩成：

```ts
  const hidden =
    !topic ||
    !isClientForumTopicVisible(topic) ||
    !board ||
    board.kind !== 'forum' ||
    board.status !== 'enabled';

  if (hidden) {
    return (
      <div className="c-h5-shell is-forum">
        {/* 与现有「帖子不存在」空态相同 */}
      </div>
    );
  }
```

`board` 仍用 `boards.find((item) => item.name === topic.boardName)`。hooks（`useState`）必须留在 early return 之前，不要把 `useState` 挪到 `if (hidden)` 后面。

- [ ] **Step 4: 再跑测试**

```bash
npm test -- src/features/c-end/forum/model/clientForum.test.ts src/features/c-end/forum/h5/H5ForumBoard.test.tsx
```

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 改板块名级联帖子

**Files:**
- Create: `src/features/forum/model/forumStore.sync.test.ts`
- Modify: `src/features/forum/model/forumStore.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/features/forum/model/forumStore.sync.test.ts`：

```ts
import { App } from 'antd';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { filterTopics } from './forum';
import { draftFromBoard } from './forum';
import {
  __resetForumStoreForTests,
  getForumBoard,
  getForumBoards,
  getForumTopic,
  saveForumBoard,
  useForumTopics,
} from './forumStore';
import { H5ForumBoard } from '../../c-end/forum/h5/H5ForumBoard';

afterEach(() => {
  __resetForumStoreForTests();
});

describe('forum store H5/admin sync', () => {
  it('renames boardName on topics when the board is renamed', () => {
    const board = getForumBoard(1)!;
    const result = saveForumBoard({ ...draftFromBoard(board), name: '闲置市集' }, 1);
    expect(result.ok).toBe(true);
    expect(getForumTopic(1)?.boardName).toBe('闲置市集');
    expect(getForumTopic(4)?.boardName).toBe('闲置市集');
    const html = renderToStaticMarkup(<H5ForumBoard id={1} />);
    expect(html).toContain('闲置市集');
    expect(html).toContain('人体工学椅');
    expect(html).toContain('闲置27英寸显示器');
  });
});
```

先不要 import 未用的 `filterTopics` / `useForumTopics` / `App`（本 task 不用）。上面块里删掉这三个。最终文件本 task 只有 rename 这一条 `it`。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/forum/model/forumStore.sync.test.ts
```

Expected: FAIL，`getForumTopic(1).boardName` 仍是 `二手论坛`。

- [ ] **Step 3: 最小实现**

`forumStore.ts` 的 `saveForumBoard`，在 `id` 分支 `boardFromDraft` 之后、写 `boards` 之前：

```ts
    const next = boardFromDraft(draft, current.id, current.createdAt, current.status);
    if (current.name !== next.name) {
      topics = topics.map((item) => (item.boardName === current.name ? { ...item, boardName: next.name } : item));
    }
    boards = boards.map((item) => (item.id === id ? next : item));
```

- [ ] **Step 4: 再跑测试**

```bash
npm test -- src/features/forum/model/forumStore.sync.test.ts src/features/forum/pages/ForumBoardListPage.test.tsx
```

Expected: PASS（改名不破坏后台列表单测）。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: 禁言拦 H5 楼层 + 写回后台

**Files:**
- Modify: `src/features/forum/model/forumStore.ts`
- Modify: `src/features/forum/model/forumStore.sync.test.ts`
- Modify: `src/features/c-end/forum/h5/H5ForumBoard.test.tsx`

- [ ] **Step 1: 写失败测试**

`forumStore.sync.test.ts` 增加 import 与用例：

```ts
import { App } from 'antd';
import { filterTopics } from './forum';
import { ForumTopicDetailPage } from '../pages/ForumTopicDetailPage';
import {
  addClientTopicComment,
  addTopicComment,
  getForumBoards,
  publishClientTopic,
  releaseMute,
} from './forumStore';
import { H5ForumTopic } from '../../c-end/forum/h5/H5ForumTopic';
```

```ts
  it('blocks client comments while 周敏 is muted and writes after release', () => {
    const before = getForumTopic(4)!.comments.length;
    expect(addClientTopicComment(4, '禁言时不该写入')).toEqual({ ok: false, error: '你已被禁言' });
    expect(getForumTopic(4)!.comments).toHaveLength(before);

    releaseMute(1);
    expect(addClientTopicComment(4, 'H5联动回复')).toEqual({ ok: true });
    const last = getForumTopic(4)!.comments.at(-1);
    expect(last).toMatchObject({ author: '周敏', content: 'H5联动回复' });

    expect(renderToStaticMarkup(<H5ForumTopic id={4} />)).toContain('H5联动回复');
    const admin = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="forum" recordId="4" onBack={() => undefined} />
      </App>,
    );
    expect(admin).toContain('周敏');
    expect(admin).toContain('H5联动回复');
  });
```

帖 4「闲置27英寸显示器」主评很少，后台默认分页能看到新楼层。不要用帖 1（默认只展示 10 条主评）。

`H5ForumBoard.test.tsx` 里所有 `expect(addClientTopicComment(...)).toEqual({ ok: true })` 的用例，在第一次成功发评前加 `releaseMute(1)`，并从 forumStore import `releaseMute`。空内容失败用例保持在禁言状态下也可以（校验先于禁言）。

现有成功路径（「我再问问价格」「带图评论」「预览图」等）必须先 `releaseMute(1)`，否则 Task 3 实现后会全红。

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- src/features/forum/model/forumStore.sync.test.ts
```

Expected: FAIL，禁言时 `addClientTopicComment` 仍 `{ ok: true }`。

- [ ] **Step 3: 最小实现**

`forumStore.ts` 的 `addClientTopicComment`：

```ts
export function addClientTopicComment(
  id: number,
  content: string,
  images: string[] = [],
): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicComment(current, content, forumClientSelf, nowText(), images);
  if ('error' in next) return { ok: false, error: next.error };
  if (mutes.some((item) => item.user === forumClientSelf && item.active)) {
    return { ok: false, error: '你已被禁言' };
  }
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}
```

顺序必须是：帖存在 → `withTopicComment` 校验（空/超长）→ 禁言 → 写入。这样 `addClientTopicComment(1, '')` 仍是「请输入回复内容」。

不要改 `publishClientTopic` / `updateClientTopic` 禁言。不要改 `addClientTopicReply`（规格只要求楼层）。

- [ ] **Step 4: 再跑测试**

```bash
npm test -- src/features/forum/model/forumStore.sync.test.ts src/features/c-end/forum/h5/H5ForumBoard.test.tsx
```

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: 发帖进后台 + 停用板块

**Files:**
- Modify: `src/features/forum/model/forumStore.sync.test.ts`

- [ ] **Step 1: 写失败测试（若已绿则证实行为）**

同一文件追加：

```ts
import { setForumBoardStatus } from './forumStore';
```

```ts
  it('shows H5 published topics in admin topic filter', () => {
    const created = publishClientTopic({
      boardName: '二手论坛',
      title: 'H5联动新帖',
      content: '可自提',
      images: [],
      tags: ['求购'],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(getForumTopic(created.id)?.title).toBe('H5联动新帖');
    const rows = filterTopics( /* 不要从 hook 取。用 getForumBoards + 需要 topics 快照 */ );
  });
```

`forumStore` 目前没有 `getForumTopics()`。加导出：

```ts
export function getForumTopics() {
  return topics;
}
```

测例改成：

```ts
  it('shows H5 published topics in admin topic filter', () => {
    const created = publishClientTopic({
      boardName: '二手论坛',
      title: 'H5联动新帖',
      content: '可自提',
      images: [],
      tags: ['求购'],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const rows = filterTopics(getForumTopics(), getForumBoards(), { kind: 'forum', boardName: '二手论坛' });
    expect(rows.some((item) => item.id === created.id && item.title === 'H5联动新帖')).toBe(true);
  });

  it('hides disabled boards on H5', () => {
    setForumBoardStatus(1, 'disabled');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).toContain('论坛不存在或已停用');
    expect(renderToStaticMarkup(<H5ForumBoard id={1} />)).not.toContain('人体工学椅');
    expect(renderToStaticMarkup(<H5ForumTopic id={1} />)).toContain('帖子不存在');
  });
```

`filterTopics` 的 `TopicQuery` 需要 `kind`。从 `./forum` import `filterTopics`。

- [ ] **Step 2: 跑测试**

```bash
npm test -- src/features/forum/model/forumStore.sync.test.ts
```

Expected: `getForumTopics` 未导出则 FAIL；导出后发帖用例应 PASS。停用后 `H5ForumTopic` 依赖 Task 1 的 `board.status !== 'enabled'`，未做则 FAIL。

- [ ] **Step 3: 最小实现**

`forumStore.ts` 在 `getForumTopic` 旁：

```ts
export function getForumTopics() {
  return topics;
}
```

停用详情：Task 1 已挡 `board.status !== 'enabled'`。若 Task 1 漏了，补上。不要新建首页。

- [ ] **Step 4: 回归**

```bash
npm test -- src/features/forum/model/forumStore.sync.test.ts src/features/c-end/forum/h5/H5ForumBoard.test.tsx src/features/c-end/forum/model/clientForum.test.ts src/features/forum/pages/ForumBoardListPage.test.tsx src/features/forum/model/forum.test.ts
```

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

## Spec coverage

| 规格 | Task |
|---|---|
| 详情挡下架 / 待审 / 驳回 | 1 |
| 停用板块 H5 空态 | 4（详情依赖 Task 1） |
| 改名级联 `boardName` | 2 |
| H5 发帖进后台列表 | 4 |
| `addClientTopicComment` + 禁言 | 3 |
| H5/后台都能看到周敏楼层 | 3 |
| 不写 localStorage / 不改发帖禁言 / 不重建嵌套 | 全程不做 |

规格写「首页无该板」：当前无首页列表，用板页「论坛不存在或已停用」代替。
