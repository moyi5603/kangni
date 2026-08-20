# 活动点赞、收藏、评论 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** H5/PC 活动首页展示赞藏评数字；详情可点赞、收藏、发活动评论；独立「我的收藏」页；评论与后台 `related.comments` 同源。

**Architecture:** 赞/藏放 C 端 `engagementStore`（`likedBy` / `favoritedBy` 人名数组）。评论继续 `related.comments`，C 端 `submitActivityComment` 写入。`toClientActivity` 现算三个数字。首页「我的收藏」预览 + `#/c/{h5|pc}/favorites`。详情 H5 底栏左社交右报名，PC 侧栏社交在报名上方；评论区在介绍后、精彩瞬间前。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 C 端 CSS。无 antd。

---

## File map

- Modify: `src/features/activities/model/related.ts` — `restoreRelatedComments`
- Modify: `src/features/activities/model/related.test.ts`
- Create: `src/features/c-end/activities/model/engagementStore.ts`
- Create: `src/features/c-end/activities/model/engagementStore.test.ts`
- Create: `src/features/c-end/activities/model/activityComments.ts`
- Create: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.ts` — 删 `SOCIAL`，现算数字，收藏视图
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/app/navigation.ts` — `favorites` 路由
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/CEndApp.tsx`
- Create: `src/features/c-end/activities/components/DetailEngageBar.tsx`
- Create: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Create: `src/features/c-end/activities/components/ActivityCommentForm.tsx`
- Create: `src/features/c-end/activities/h5/H5CommentSheet.tsx`
- Create: `src/features/c-end/activities/pc/PcCommentModal.tsx`
- Create: `src/features/c-end/activities/h5/H5MyFavorites.tsx`
- Create: `src/features/c-end/activities/h5/H5MyFavorites.test.tsx`
- Create: `src/features/c-end/activities/pc/PcMyFavorites.tsx`
- Create: `src/features/c-end/activities/pc/PcMyFavorites.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityCards.tsx` — 挂 `SocialRow`
- Modify: `src/features/c-end/activities/h5/H5ActivityCards.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

规格：`docs/superpowers/specs/2026-08-20-activity-like-favorite-comment-design.md`。

目录不是 Git 仓库；每项末尾跳过 commit。

首页测试切区块时：「我的活动」只切到 `c-h5-my-favorites` / `c-pc-my-favorites`，不要切到 catalog，否则种子收藏「中秋员工晚会」会污染报名预览断言。收藏预览卡用 `c-h5-fav-card` / `c-pc-fav-card`，不要复用 `c-h5-signup-card`。

---

### Task 1: `restoreRelatedComments`

**Files:**
- Modify: `src/features/activities/model/related.ts`
- Modify: `src/features/activities/model/related.test.ts`

- [ ] **Step 1: 写失败测试**

在 `related.test.ts` 末尾追加：

```ts
import { restoreRelatedComments } from './related';

describe('related comments restore', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('restores comment seed after C-end inserts', () => {
    const before = getRelatedList('comments').length;
    patchRelated('comments', (list) => [
      { id: 99, activityId: 2, content: '临时评论', author: '陈产品', createdAt: '2026-08-20 10:00:00' },
      ...list,
    ]);
    expect(getRelatedList('comments')).toHaveLength(before + 1);
    restoreRelatedComments();
    expect(getRelatedList('comments')).toHaveLength(before);
    expect(getRelatedList('comments').some((item) => item.id === 99)).toBe(false);
    expect(getRelatedList('comments').some((item) => item.id === 1 && item.author === '张悦')).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/activities/model/related.test.ts`

Expected: FAIL，`restoreRelatedComments` is not exported。

- [ ] **Step 3: 实现**

在 `related.ts` 的 `restoreRelatedSignups` 旁加：

```ts
export function restoreRelatedComments() {
  related = {
    ...related,
    comments: initialRelated.comments.map((item) => ({ ...item })),
  };
  emit();
}
```

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/activities/model/related.test.ts`

Expected: PASS。

---

### Task 2: `engagementStore`

**Files:**
- Create: `src/features/c-end/activities/model/engagementStore.ts`
- Create: `src/features/c-end/activities/model/engagementStore.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `engagementStore.test.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { DEMO_SIGNUP_USER } from './signupStore';
import {
  getFavoriteActivityIds,
  getFavoritedBy,
  getLikedBy,
  resetEngagement,
  toggleFavorite,
  toggleLike,
} from './engagementStore';

describe('engagement store', () => {
  afterEach(() => {
    resetEngagement();
  });

  it('seeds likes without 陈产品 and two favorites for 陈产品', () => {
    expect(getLikedBy(1)).toHaveLength(3);
    expect(getLikedBy(1).includes(DEMO_SIGNUP_USER.name)).toBe(false);
    expect(getLikedBy(2)).toHaveLength(1);
    expect(getLikedBy(9)).toHaveLength(12);
    expect(getLikedBy(21)).toHaveLength(18);
    expect(getFavoritedBy(2)).toEqual([DEMO_SIGNUP_USER.name]);
    expect(getFavoritedBy(9)).toHaveLength(4);
    expect(getFavoritedBy(9).includes(DEMO_SIGNUP_USER.name)).toBe(true);
    expect(getFavoriteActivityIds()).toEqual([2, 9]);
  });

  it('toggles like on and off for the demo user', () => {
    const before = getLikedBy(2).length;
    toggleLike(2);
    expect(getLikedBy(2)).toHaveLength(before + 1);
    expect(getLikedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(true);
    toggleLike(2);
    expect(getLikedBy(2)).toHaveLength(before);
    expect(getLikedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(false);
  });

  it('toggles favorite on and off', () => {
    toggleFavorite(2);
    expect(getFavoriteActivityIds().includes(2)).toBe(false);
    toggleFavorite(2);
    expect(getFavoriteActivityIds().includes(2)).toBe(true);
  });

  it('ignores ids missing from activityStore', () => {
    toggleLike(9001);
    toggleFavorite(9001);
    expect(getLikedBy(9001)).toEqual([]);
    expect(getFavoritedBy(9001)).toEqual([]);
    expect(getFavoriteActivityIds().includes(9001)).toBe(false);
  });

  it('creates a list when a real activity has no seed', () => {
    toggleLike(3);
    expect(getLikedBy(3)).toEqual([DEMO_SIGNUP_USER.name]);
  });

  it('reset restores seed after toggles', () => {
    toggleLike(2);
    toggleFavorite(10);
    resetEngagement();
    expect(getLikedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(false);
    expect(getFavoriteActivityIds()).toEqual([2, 9]);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/c-end/activities/model/engagementStore.test.ts`

Expected: FAIL，Cannot find module `./engagementStore`。

- [ ] **Step 3: 实现**

创建 `engagementStore.ts`：

```ts
import { useMemo, useSyncExternalStore } from 'react';
import { getActivity } from '../../../activities/model/activityStore';
import { DEMO_SIGNUP_USER } from './signupStore';

const LIKE_POOL = [
  '张悦',
  '李明',
  '孙新',
  '王芳',
  '黄码',
  '苏然',
  '郑测',
  '周工',
  '马装',
  '吴检',
  '林销',
  '刘销',
  '赵人事',
  '钱会',
];

function fill(count: number): string[] {
  return Array.from({ length: count }, (_, index) => LIKE_POOL[index] ?? `员工${index - LIKE_POOL.length + 1}`);
}

const initialLikedBy: Record<number, string[]> = {
  1: fill(3),
  2: fill(1),
  6: fill(8),
  9: fill(12),
  10: fill(6),
  13: fill(5),
  17: fill(4),
  21: fill(18),
  22: fill(15),
};

const initialFavoritedBy: Record<number, string[]> = {
  2: [DEMO_SIGNUP_USER.name],
  6: fill(2),
  9: [DEMO_SIGNUP_USER.name, '张悦', '李明', '王芳'],
  10: fill(1),
  13: fill(2),
  21: fill(7),
  22: fill(6),
};

function cloneMap(source: Record<number, string[]>): Record<number, string[]> {
  return Object.fromEntries(Object.entries(source).map(([id, names]) => [Number(id), [...names]]));
}

let likedBy = cloneMap(initialLikedBy);
let favoritedBy = cloneMap(initialFavoritedBy);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function toggleName(names: string[], name: string): string[] {
  return names.includes(name) ? names.filter((item) => item !== name) : [...names, name];
}

export function subscribeEngagement(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLikedBy(activityId: number): string[] {
  return [...(likedBy[activityId] ?? [])];
}

export function getFavoritedBy(activityId: number): string[] {
  return [...(favoritedBy[activityId] ?? [])];
}

export function getFavoriteActivityIds(name = DEMO_SIGNUP_USER.name): number[] {
  return Object.entries(favoritedBy)
    .filter(([, names]) => names.includes(name))
    .map(([id]) => Number(id));
}

export function toggleLike(activityId: number, name = DEMO_SIGNUP_USER.name) {
  if (!getActivity(activityId)) return;
  likedBy = { ...likedBy, [activityId]: toggleName(likedBy[activityId] ?? [], name) };
  emit();
}

export function toggleFavorite(activityId: number, name = DEMO_SIGNUP_USER.name) {
  if (!getActivity(activityId)) return;
  favoritedBy = { ...favoritedBy, [activityId]: toggleName(favoritedBy[activityId] ?? [], name) };
  emit();
}

export function resetEngagement() {
  likedBy = cloneMap(initialLikedBy);
  favoritedBy = cloneMap(initialFavoritedBy);
  emit();
}

function engagementSnapshot() {
  return { likedBy, favoritedBy };
}

export function useEngagement() {
  return useSyncExternalStore(subscribeEngagement, engagementSnapshot, engagementSnapshot);
}

export function useFavoriteActivityIds(name = DEMO_SIGNUP_USER.name): number[] {
  const snapshot = useEngagement();
  return useMemo(() => getFavoriteActivityIds(name), [snapshot, name]);
}

export function useActivityEngagement(activityId: number, name = DEMO_SIGNUP_USER.name) {
  const snapshot = useEngagement();
  return useMemo(
    () => ({
      liked: (snapshot.likedBy[activityId] ?? []).includes(name),
      favorited: (snapshot.favoritedBy[activityId] ?? []).includes(name),
      likes: (snapshot.likedBy[activityId] ?? []).length,
      stars: (snapshot.favoritedBy[activityId] ?? []).length,
    }),
    [snapshot, activityId, name],
  );
}
```

`useFavoriteActivityIds` 的 `useMemo` 依赖 `snapshot` 对象；`engagementSnapshot` 每次 toggle 换新 `likedBy`/`favoritedBy` 对象即可。

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/c-end/activities/model/engagementStore.test.ts`

Expected: PASS。

---

### Task 3: `submitActivityComment`

**Files:**
- Create: `src/features/c-end/activities/model/activityComments.ts`
- Create: `src/features/c-end/activities/model/activityComments.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { getRelatedList, restoreRelatedComments } from '../../../activities/model/related';
import { DEMO_SIGNUP_USER } from './signupStore';
import { listActivityComments, submitActivityComment } from './activityComments';

describe('activity comments', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('lists comments newest first', () => {
    const list = listActivityComments(1);
    expect(list.map((item) => item.id)).toEqual([2, 1]);
    expect(list[0]?.author).toBe('李明');
  });

  it('writes trimmed content as 陈产品', () => {
    expect(submitActivityComment(2, '  很不错  ')).toBe('ok');
    const first = listActivityComments(2)[0];
    expect(first?.author).toBe(DEMO_SIGNUP_USER.name);
    expect(first?.content).toBe('很不错');
    expect(first?.activityId).toBe(2);
    expect(getRelatedList('comments')[0]).toMatchObject({
      author: DEMO_SIGNUP_USER.name,
      content: '很不错',
      activityId: 2,
    });
  });

  it('rejects blank comments', () => {
    const before = getRelatedList('comments').length;
    expect(submitActivityComment(2, '   ')).toBe('empty');
    expect(getRelatedList('comments')).toHaveLength(before);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/c-end/activities/model/activityComments.test.ts`

Expected: FAIL，Cannot find module。

- [ ] **Step 3: 实现**

```ts
import { getRelatedList, patchRelated, type CommentRecord } from '../../../activities/model/related';
import { DEMO_SIGNUP_USER } from './signupStore';

function formatCommentTime(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function nextCommentId(list: CommentRecord[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

export function listActivityComments(activityId: number): CommentRecord[] {
  return getRelatedList('comments')
    .filter((item) => item.activityId === activityId)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
}

export function commentCount(activityId: number): number {
  return getRelatedList('comments').filter((item) => item.activityId === activityId).length;
}

export function submitActivityComment(activityId: number, content: string): 'ok' | 'empty' {
  const text = content.trim();
  if (!text) return 'empty';
  patchRelated('comments', (list) => [
    {
      id: nextCommentId(list),
      activityId,
      content: text,
      author: DEMO_SIGNUP_USER.name,
      createdAt: formatCommentTime(),
    },
    ...list,
  ]);
  return 'ok';
}
```

新评插到 `related.comments` 数组头部，后台评论管理也会先看到新评。`listActivityComments` 再按 `createdAt` 降序，保证详情「新在上」。

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/c-end/activities/model/activityComments.test.ts`

Expected: PASS。

---

### Task 4: `toClientActivity` 现算 + 收藏视图

**Files:**
- Modify: `src/features/c-end/activities/model/clientActivity.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`

- [ ] **Step 1: 写失败测试**

在 `clientActivity.test.ts` 增加（文件顶部补 import：`restoreRelatedComments`、`patchRelated`、`resetEngagement`、`toggleLike`、`toClientActivity`、`HOME_FAVORITE_PREVIEW_LIMIT`、`favoriteViews`、`previewFavorites`、`initialActivities`）：

```ts
import { afterEach } from 'vitest';
import { initialActivities } from '../../../activities/model/activity';
import { patchRelated, restoreRelatedComments } from '../../../activities/model/related';
import { resetEngagement, toggleLike } from './engagementStore';
import {
  HOME_FAVORITE_PREVIEW_LIMIT,
  favoriteViews,
  previewFavorites,
  toClientActivity,
} from './clientActivity';

describe('live social counts and favorites', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('reads likes from engagement and comments from related', () => {
    const activity = initialActivities.find((item) => item.id === 1)!;
    expect(toClientActivity(activity).likes).toBe(3);
    expect(toClientActivity(activity).stars).toBe(0);
    expect(toClientActivity(activity).comments).toBe(2);
    toggleLike(1);
    expect(toClientActivity(activity).likes).toBe(4);
  });

  it('updates comment count after a related delete', () => {
    const activity = initialActivities.find((item) => item.id === 1)!;
    patchRelated('comments', (list) => list.filter((item) => item.id !== 1));
    expect(toClientActivity(activity).comments).toBe(1);
  });

  it('builds favorite views with unpublished as invalid', () => {
    const views = favoriteViews([2, 3, 9], initialActivities);
    expect(views[0]?.activity?.title).toBe('新员工入职训练营');
    expect(views[1]?.activity).toBeUndefined();
    expect(views[2]?.activity?.title).toBe('中秋员工晚会');
    expect(HOME_FAVORITE_PREVIEW_LIMIT).toBe(2);
    const preview = previewFavorites([2, 3, 9], initialActivities);
    expect(preview.map((item) => item.activity?.id)).toEqual([2, 9]);
  });
});
```

若 `clientActivity.test.ts` 无 `afterEach` 顶层 import，把 `afterEach` 并进已有 vitest import。

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/c-end/activities/model/clientActivity.test.ts`

Expected: FAIL，`favoriteViews` / 评论数 2 对不上静态 `SOCIAL.comments: 0`。

- [ ] **Step 3: 实现**

1. 删掉 `SOCIAL` 常量。
2. 在 `FEATURED_LIMIT` 旁加 `export const HOME_FAVORITE_PREVIEW_LIMIT = 2;`
3. 替换 `toClientActivity`：

```ts
import { getRelatedList } from '../../../activities/model/related';
import { commentCount } from './activityComments';
import { getFavoritedBy, getLikedBy } from './engagementStore';

export function toClientActivity(activity: Activity): ClientActivity {
  return {
    ...activity,
    summary: activitySummary(activity.detailHtml),
    likes: getLikedBy(activity.id).length,
    stars: getFavoritedBy(activity.id).length,
    comments: commentCount(activity.id),
  };
}
```

不要在 `toClientActivity` 里调未用的 `getRelatedList`；上面 import 只留实际用到的。

4. 文件末尾加：

```ts
export type FavoriteView = {
  activityId: number;
  activity?: Activity;
};

export function favoriteViews(ids: number[], activities: Activity[]): FavoriteView[] {
  const published = new Map(clientVisibleActivities(activities).map((activity) => [activity.id, activity]));
  return ids.map((activityId) => ({ activityId, activity: published.get(activityId) }));
}

export function previewFavorites(ids: number[], activities: Activity[]): FavoriteView[] {
  return favoriteViews(ids, activities)
    .filter((item) => item.activity)
    .slice(0, HOME_FAVORITE_PREVIEW_LIMIT);
}
```

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/c-end/activities/model/clientActivity.test.ts`

Expected: PASS。

---

### Task 5: `favorites` 路由

**Files:**
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`

- [ ] **Step 1: 写失败测试**

在 `navigation.test.ts` 的 C-end describe 里加，并扩展 import：`toH5FavoritesHash`、`toPcFavoritesHash`。

```ts
  it('parses favorites pages before numeric ids', () => {
    expect(parseCEndHash('#/c/h5/favorites')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'favorites',
    });
    expect(parseCEndHash('#/c/pc/favorites')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'favorites',
    });
  });

  it('builds the favorites hashes', () => {
    expect(toH5FavoritesHash()).toBe('#/c/h5/favorites');
    expect(toPcFavoritesHash()).toBe('#/c/pc/favorites');
  });
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: FAIL，`h5Page` 不是 `'favorites'`，hash helper 未导出。

- [ ] **Step 3: 实现**

`H5Page` 改为：

```ts
export type H5Page = 'my' | 'courses' | 'courses-mall' | 'favorites';
```

`parseCEndHash` 在 `courses-mall` 判断后加：

```ts
  if (rawId === 'favorites') return { kind: 'c-end', surface, h5Page: 'favorites' };
```

在 `goPcMySignups` 旁加：

```ts
export function toH5FavoritesHash(): string {
  return '#/c/h5/favorites';
}

export function goH5Favorites() {
  window.location.hash = toH5FavoritesHash();
}

export function toPcFavoritesHash(): string {
  return '#/c/pc/favorites';
}

export function goPcFavorites() {
  window.location.hash = toPcFavoritesHash();
}
```

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/app/navigation.test.ts`

Expected: PASS。

---

### Task 6: 我的收藏页 + `CEndApp`

**Files:**
- Create: `src/features/c-end/activities/h5/H5MyFavorites.tsx`
- Create: `src/features/c-end/activities/h5/H5MyFavorites.test.tsx`
- Create: `src/features/c-end/activities/pc/PcMyFavorites.tsx`
- Create: `src/features/c-end/activities/pc/PcMyFavorites.test.tsx`
- Modify: `src/app/CEndApp.tsx`

- [ ] **Step 1: 写失败测试**

`H5MyFavorites.test.tsx`：

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { resetEngagement, toggleFavorite } from '../model/engagementStore';
import { H5MyFavorites } from './H5MyFavorites';

describe('H5 my favorites', () => {
  afterEach(() => {
    resetEngagement();
  });

  it('renders seed favorites', () => {
    const html = renderToStaticMarkup(<H5MyFavorites />);
    expect(html).toContain('我的收藏');
    expect(html).toContain('新员工入职训练营');
    expect(html).toContain('中秋员工晚会');
    expect(html).not.toContain('还没有收藏活动');
  });

  it('drops a row after unfavorite', () => {
    toggleFavorite(2);
    const html = renderToStaticMarkup(<H5MyFavorites />);
    expect(html).not.toContain('新员工入职训练营');
    expect(html).toContain('中秋员工晚会');
  });

  it('shows empty state when none left', () => {
    toggleFavorite(2);
    toggleFavorite(9);
    const html = renderToStaticMarkup(<H5MyFavorites />);
    expect(html).toContain('还没有收藏活动');
    expect(html).toContain('去看看活动');
  });

  it('mounts from CEndApp favorites hash page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="favorites" />);
    expect(html).toContain('我的收藏');
    expect(html).toContain('新员工入职训练营');
  });
});
```

`PcMyFavorites.test.tsx` 同样四条，把 `H5MyFavorites` 换成 `PcMyFavorites`，`CEndApp` 用 `surface="pc"`。

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/c-end/activities/h5/H5MyFavorites.test.tsx src/features/c-end/activities/pc/PcMyFavorites.test.tsx`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现页面**

`H5MyFavorites.tsx`：

```tsx
import { useMemo } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight, IconStar } from '../components/Icons';
import { favoriteViews } from '../model/clientActivity';
import { useFavoriteActivityIds } from '../model/engagementStore';
import { H5ActivityShell } from './H5ActivityShell';

function FavThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}

export function H5MyFavorites() {
  const activities = useActivities();
  const ids = useFavoriteActivityIds();
  const views = useMemo(() => favoriteViews(ids, activities), [ids, activities]);
  const goHome = () => goCEnd('h5');

  return (
    <H5ActivityShell title="我的收藏" onBack={goHome}>
      {ids.length === 0 ? (
        <div className="c-h5-signup-empty">
          <IconStar />
          <h2>还没有收藏活动</h2>
          <p>去发现活动里看看有什么值得收藏</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <ul className="c-h5-list" aria-label="我的收藏">
          {views.map((item) => (
            <li key={item.activityId}>
              {item.activity ? (
                <button
                  className="c-h5-fav-card c-h5-card-button"
                  type="button"
                  onClick={() => goCEnd('h5', item.activity!.id)}
                >
                  <FavThumb coverUrl={item.activity.coverUrl} />
                  <div className="c-h5-signup-card-body">
                    <h3 className="c-h5-signup-title">{item.activity.title}</h3>
                    <ActivityMeta activity={item.activity} compact />
                  </div>
                  <IconChevronRight />
                </button>
              ) : (
                <article className="c-h5-fav-card is-invalid">
                  <div className="c-h5-signup-card-body">
                    <h3 className="c-h5-signup-title">活动已失效</h3>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </H5ActivityShell>
  );
}
```

`PcMyFavorites.tsx`：

```tsx
import { useMemo } from 'react';
import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { ActivityMeta } from '../components/ActivityMeta';
import { IconChevronRight, IconStar } from '../components/Icons';
import { favoriteViews } from '../model/clientActivity';
import { useFavoriteActivityIds } from '../model/engagementStore';
import { PcActivityShell } from './PcActivityShell';

function FavThumb({ coverUrl }: { coverUrl: string }) {
  return (
    <span className="c-signup-thumb" aria-hidden>
      <span className="c-cover-fallback" />
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}

export function PcMyFavorites() {
  const activities = useActivities();
  const ids = useFavoriteActivityIds();
  const views = useMemo(() => favoriteViews(ids, activities), [ids, activities]);
  const goHome = () => goCEnd('pc');

  return (
    <PcActivityShell>
      <button className="c-back-link" type="button" onClick={goHome}>
        ← 返回列表
      </button>
      {ids.length === 0 ? (
        <div className="c-pc-signup-empty">
          <IconStar />
          <h2>还没有收藏活动</h2>
          <p>去发现活动里看看有什么值得收藏</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goHome}>
            去看看活动
          </button>
        </div>
      ) : (
        <ul className="c-pc-preview-list" aria-label="我的收藏">
          {views.map((item) => (
            <li key={item.activityId}>
              {item.activity ? (
                <button
                  className="c-pc-fav-card c-card-btn"
                  type="button"
                  onClick={() => goCEnd('pc', item.activity!.id)}
                >
                  <FavThumb coverUrl={item.activity.coverUrl} />
                  <div className="c-pc-signup-card-body">
                    <h3 className="c-pc-signup-title">{item.activity.title}</h3>
                    <ActivityMeta activity={item.activity} compact />
                  </div>
                  <IconChevronRight />
                </button>
              ) : (
                <article className="c-pc-fav-card is-invalid">
                  <div className="c-pc-signup-card-body">
                    <h3 className="c-pc-signup-title">活动已失效</h3>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </PcActivityShell>
  );
}
```

PC 测试断言正文「我的收藏」列表即可；顶栏 `h1` 仍是「员工活动」。

`CEndApp.tsx`：

```tsx
import { H5MyFavorites } from '../features/c-end/activities/h5/H5MyFavorites';
import { PcMyFavorites } from '../features/c-end/activities/pc/PcMyFavorites';
```

H5 分支在 `courses-mall` 之后加 `h5Page === 'favorites' ? <H5MyFavorites />`。  
PC 分支改为：

```tsx
    ) : h5Page === 'my' ? (
      <PcMySignups />
    ) : h5Page === 'favorites' ? (
      <PcMyFavorites />
    ) : activityId == null ? (
```

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/c-end/activities/h5/H5MyFavorites.test.tsx src/features/c-end/activities/pc/PcMyFavorites.test.tsx`

Expected: PASS。

---

### Task 7: 首页 `SocialRow` + 「我的收藏」区块

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityCards.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityCards.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

`H5ActivityCards.test.tsx` 任意一条加：

```ts
expect(html).toContain('c-social');
```

`H5ActivityHome.test.tsx`：

1. 所有 `html.not.toContain('查看全部')` 改成切「我的活动」区块：

```ts
const mine = html.slice(
  html.indexOf('c-h5-my-activities'),
  html.indexOf('c-h5-my-favorites'),
);
expect(mine).not.toContain('查看全部');
```

2. 所有 `html.slice(..., id="h5-activity-catalog")` 用作「我的活动」的，改切到 `c-h5-my-favorites`，避免中秋晚会进报名预览断言。

3. 新增：

```ts
  it('shows favorite preview and catalog social counts', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const fav = html.slice(html.indexOf('c-h5-my-favorites'), html.indexOf('id="h5-activity-catalog"'));
    const catalog = html.slice(html.indexOf('id="h5-activity-catalog"'));
    expect(html.indexOf('c-h5-my-activities')).toBeLessThan(html.indexOf('c-h5-my-favorites'));
    expect(html.indexOf('c-h5-my-favorites')).toBeLessThan(html.indexOf('id="h5-activity-catalog"'));
    expect(fav).toContain('我的收藏');
    expect(fav).toContain('查看全部');
    expect(fav).toContain('新员工入职训练营');
    expect(fav).toContain('中秋员工晚会');
    expect(catalog).toContain('c-social');
  });
```

PC 同样：`not.toContain('c-social')` 改成 catalog `toContain('c-social')`；「查看全部」只断言 `c-pc-my-activities` 切片；新增收藏区块测试，class `c-pc-my-favorites`。

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/h5/H5ActivityCards.test.tsx`

Expected: FAIL，没有 `c-h5-my-favorites` / 卡片无 `c-social`。

- [ ] **Step 3: 实现**

`H5ActivityCards.tsx`：import `SocialRow`、`toClientActivity`。在 `c-list-foot` 之前插入：

```tsx
        <SocialRow activity={toClientActivity(activity)} />
```

`H5ActivityHome.tsx`：

- import `goH5Favorites`、`previewFavorites`、`useFavoriteActivityIds`、`useEngagement`（强制订阅；即使预览只用 ids）。
- 组件内：

```tsx
  useEngagement();
  const favoriteIds = useFavoriteActivityIds();
  const favoritePreview = useMemo(
    () => previewFavorites(favoriteIds, activities),
    [favoriteIds, activities],
  );
```

`useEngagement()` 必须调用，这样点赞后首页数字会刷新（详情返回后再看首页）。`related.comments` 变化也要刷新：再 `useSyncExternalStore(subscribeRelated, () => getRelatedList('comments'), () => getRelatedList('comments'))`。可抽到 `clientActivity.ts`：

```ts
import { useSyncExternalStore } from 'react';
import { getRelatedList, subscribeRelated } from '../../../activities/model/related';
import { useEngagement } from './engagementStore';

export function useLiveSocial() {
  useEngagement();
  useSyncExternalStore(subscribeRelated, () => getRelatedList('comments'), () => getRelatedList('comments'));
}
```

首页、详情、列表卡父级都调 `useLiveSocial()`。本任务首页两处都调。

在「我的活动」`</section>` 和 catalog `section` 之间插入：

```tsx
      <section className="c-h5-section c-h5-my-favorites">
        <div className="c-h5-section-head">
          <h2 className="c-section-title">我的收藏</h2>
          <button className="c-h5-section-more" type="button" onClick={goH5Favorites}>
            查看全部
          </button>
        </div>
        {favoritePreview.length === 0 ? (
          <div className="c-h5-my-empty">
            <p>还没有收藏活动</p>
            <button className="c-btn c-btn-ghost" type="button" onClick={scrollToCatalog}>
              去看看活动
            </button>
          </div>
        ) : (
          <ul className="c-h5-list" aria-label="收藏的活动">
            {favoritePreview.map((item) =>
              item.activity ? (
                <li key={item.activityId}>
                  <button
                    className="c-h5-fav-card c-h5-card-button is-preview"
                    type="button"
                    onClick={() => goCEnd('h5', item.activity!.id)}
                  >
                    <SignupThumb coverUrl={item.activity.coverUrl} />
                    <div className="c-h5-signup-card-body">
                      <h3 className="c-h5-signup-title">{item.activity.title}</h3>
                      <ActivityMeta activity={item.activity} compact />
                    </div>
                    <IconChevronRight />
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>
```

`PcActivityHome.tsx` 同样：`goPcFavorites`、`c-pc-my-favorites`、`c-pc-section-more`、`c-pc-fav-card is-preview`、目录卡 `c-pc-card-foot` 前加 `<SocialRow activity={toClientActivity(activity)} />`，并 `useLiveSocial()`。

`styles.css` 给收藏预览卡复用报名预览尺寸即可，补：

```css
.c-h5-fav-card,
.c-pc-fav-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  background: #fff;
  text-align: left;
}

.c-h5-fav-card.is-invalid,
.c-pc-fav-card.is-invalid {
  padding: 12px 16px;
}
```

H5 预览卡可与 `.c-h5-signup-card.is-preview` 共用规则：把选择器并列复制一份 `.c-h5-fav-card.is-preview`，或直接给预览收藏卡同时加 `c-h5-signup-card is-preview` **不要**。规格禁止复用 signup-card class，以免报名卡计数测炸。把 `.c-h5-signup-card` 的视觉规则选择器扩展为 `.c-h5-signup-card, .c-h5-fav-card`。PC 同理 `.c-pc-signup-card, .c-pc-fav-card`。

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/h5/H5ActivityCards.test.tsx`

Expected: PASS。

---

### Task 8: 详情操作栏 + 评论区

**Files:**
- Create: `src/features/c-end/activities/components/DetailEngageBar.tsx`
- Create: `src/features/c-end/activities/components/ActivityCommentList.tsx`
- Create: `src/features/c-end/activities/components/ActivityCommentForm.tsx`
- Create: `src/features/c-end/activities/h5/H5CommentSheet.tsx`
- Create: `src/features/c-end/activities/pc/PcCommentModal.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

`H5ActivityDetail.test.tsx`：

```tsx
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { restoreRelatedComments } from '../../../activities/model/related';
import { resetEngagement } from '../model/engagementStore';
import { H5ActivityDetail } from './H5ActivityDetail';

describe('H5 activity detail engage', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('puts social actions left of signup CTA and lists comments before moments', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const bar = html.slice(html.indexOf('c-h5-cta-bar'));
    const like = bar.indexOf('aria-label="点赞"');
    const fav = bar.indexOf('aria-label="收藏"');
    const comment = bar.indexOf('aria-label="评论"');
    const cta = bar.indexOf('class="c-cta"');
    const comments = html.indexOf('id="activity-comments"');
    const moments = html.indexOf('精彩瞬间');

    expect(like).toBeGreaterThan(-1);
    expect(fav).toBeGreaterThan(like);
    expect(comment).toBeGreaterThan(fav);
    expect(cta).toBeGreaterThan(comment);
    expect(html).toContain('开放日讲解很清楚');
    expect(html).toContain('评论 2');
    expect(comments).toBeGreaterThan(-1);
    expect(moments).toBeGreaterThan(comments);
  });
});
```

活动 1 的 `momentStore` 有种子，「精彩瞬间」一定渲染。

`PcActivityDetail.test.tsx` 追加：aside 含 `aria-label="点赞"`，且该 label 在 `class="c-cta"` 之前；正文含 `id="activity-comments"`。

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: FAIL，无 `aria-label="点赞"`。

- [ ] **Step 3: 实现组件与挂载**

`DetailEngageBar.tsx`：

```tsx
import { IconComment, IconLike, IconStar } from './Icons';

export function DetailEngageBar({
  liked,
  favorited,
  likes,
  stars,
  comments,
  onLike,
  onFavorite,
  onComment,
}: {
  liked: boolean;
  favorited: boolean;
  likes: number;
  stars: number;
  comments: number;
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
}) {
  return (
    <div className="c-engage">
      <button
        className={`c-engage-btn${liked ? ' is-on' : ''}`}
        type="button"
        aria-label={liked ? '取消点赞' : '点赞'}
        aria-pressed={liked}
        onClick={onLike}
      >
        <IconLike />
        {likes}
      </button>
      <button
        className={`c-engage-btn${favorited ? ' is-on' : ''}`}
        type="button"
        aria-label={favorited ? '取消收藏' : '收藏'}
        aria-pressed={favorited}
        onClick={onFavorite}
      >
        <IconStar />
        {stars}
      </button>
      <button className="c-engage-btn" type="button" aria-label="评论" onClick={onComment}>
        <IconComment />
        {comments}
      </button>
    </div>
  );
}
```

`ActivityCommentList.tsx`：

```tsx
import type { CommentRecord } from '../../../activities/model/related';

export function ActivityCommentList({ comments }: { comments: CommentRecord[] }) {
  return (
    <section className="c-activity-comments" id="activity-comments" aria-labelledby="activity-comments-title">
      <h2 id="activity-comments-title" className="c-detail-name c-detail-section">
        评论 {comments.length}
      </h2>
      {comments.length === 0 ? (
        <p className="c-empty">暂无评论</p>
      ) : (
        <ul className="c-activity-comment-list">
          {comments.map((item) => (
            <li key={item.id} className="c-activity-comment">
              <div className="c-activity-comment-meta">
                <span>{item.author}</span>
                <time>{item.createdAt}</time>
              </div>
              <p>{item.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

`ActivityCommentForm.tsx`：

```tsx
import { useState } from 'react';

export function ActivityCommentForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (content: string) => void;
}) {
  const [content, setContent] = useState('');
  const canSubmit = content.trim().length > 0;

  return (
    <form
      className="c-signup-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(content);
      }}
    >
      <p className="c-signup-legend">写评论</p>
      <textarea
        className="c-comment-input"
        rows={4}
        value={content}
        placeholder="说点什么"
        aria-label="评论内容"
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="submit" disabled={!canSubmit}>
          发送
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
```

`H5CommentSheet.tsx`：复制 `H5SignupSheet` 结构，`aria-label="评论"`，内部 `ActivityCommentForm`。

`PcCommentModal.tsx`：复制 `PcSignupModal`，同样换表单。

`H5ActivityDetail.tsx` 关键改动：

```tsx
import { useRelated } from '../../../activities/model/related';
import { ActivityCommentList } from '../components/ActivityCommentList';
import { DetailEngageBar } from '../components/DetailEngageBar';
import { listActivityComments, submitActivityComment } from '../model/activityComments';
import { toggleFavorite, toggleLike, useActivityEngagement } from '../model/engagementStore';
import { commentCount } from '../model/activityComments';
import { H5CommentSheet } from './H5CommentSheet';
```

组件内：

```tsx
  const engagement = useActivityEngagement(id);
  const relatedComments = useRelated('comments', id);
  const comments = listActivityComments(id);
  const [commentOpen, setCommentOpen] = useState(false);
```

`relatedComments` 用于订阅；列表仍用 `listActivityComments(id)` 排序。

footer：

```tsx
        <div className="c-h5-cta-bar">
          <DetailEngageBar
            liked={engagement.liked}
            favorited={engagement.favorited}
            likes={engagement.likes}
            stars={engagement.stars}
            comments={commentCount(id)}
            onLike={() => toggleLike(id)}
            onFavorite={() => toggleFavorite(id)}
            onComment={() => {
              document.getElementById('activity-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setCommentOpen(true);
            }}
          />
          <button
            className="c-cta"
            type="button"
            disabled={!cta.enabled}
            onClick={() => {
              if (cta.enabled) setSheetOpen(true);
            }}
          >
            {cta.label}
          </button>
        </div>
```

在 `MomentFeed` 之前插入 `<ActivityCommentList comments={comments} />`。

`commentOpen` 时挂 `H5CommentSheet`：

```tsx
      {commentOpen ? (
        <H5CommentSheet
          onCancel={() => setCommentOpen(false)}
          onSubmit={(content) => {
            if (submitActivityComment(activity.id, content) === 'ok') {
              setCommentOpen(false);
              toast.show('评论成功');
            }
          }}
        />
      ) : null}
```

`PcActivityDetail.tsx`：侧栏在 CTA 前插同一 `DetailEngageBar`；正文同样评论区；弹窗用 `PcCommentModal`。

`styles.css` 追加：

```css
.c-h5-cta-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-engage {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.c-engage-btn {
  display: inline-flex;
  min-width: 44px;
  min-height: 44px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  border: 0;
  background: transparent;
  color: #405268;
  padding: 0 6px;
  font-size: 11px;
  cursor: pointer;
}

.c-engage-btn.is-on {
  color: #0f766e;
}

.c-h5-cta-bar .c-cta {
  flex: 1;
  min-width: 0;
}

.c-pc-side .c-engage {
  margin: 12px 0;
}

.c-activity-comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.c-activity-comment {
  padding: 12px 0;
  border-bottom: 1px solid #e8eef3;
}

.c-activity-comment-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
}

.c-comment-input {
  width: 100%;
  border: 1px solid #d8e2eb;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
}

.c-h5-shell .c-engage-btn.is-on {
  color: #0f766e;
}
```

`.c-h5-cta-bar` 已存在，不要整块覆盖 sticky/padding；只把 `display:flex` 等并进 **已有** `.c-h5-shell .c-h5-cta-bar` 规则（约 2212 行），并让 `.c-h5-shell .c-h5-cta-bar .c-cta` 改 `width:auto; flex:1`。

H5 详情 `useActivityEngagement(id)` 在 `activity` 可能为空时：先保留现有 `if (!activity)` 早期 return，hooks 必须在 early return 之前调用。用传入的 `id` 调 hook，不要放在 return 之后。

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/pc/PcActivityDetail.test.tsx`

Expected: PASS。

若 React hooks 顺序报错，把 `useActivityEngagement(id)` / `useRelated('comments', id)` 挪到 `if (!activity)` 之前（id 来自 props，允许）。

---

### Task 9: 全量回归

- [ ] **Step 1: 跑相关测**

Run:

```bash
npx vitest run src/features/c-end/activities src/features/activities/model/related.test.ts src/app/navigation.test.ts src/app/CEndApp.tsx
```

`CEndApp.tsx` 不是测试文件，改成：

```bash
npx vitest run src/features/c-end/activities src/features/activities/model/related.test.ts src/app/navigation.test.ts
```

Expected: PASS。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`

Expected: exit 0。

- [ ] **Step 3: 手验对照规格验收**

1. `#/c/h5`、`#/c/pc`：发现活动卡有赞藏评数字；「我的收藏」在「我的活动」和「发现活动」之间；预览训练营 + 中秋晚会。
2. `#/c/h5/favorites`、`#/c/pc/favorites` 列表两条；详情取消收藏后两边少一条。
3. 详情可赞可藏；发评出现在列表顶部；后台该活动评论管理能看见陈产品那条。
4. 空评论发送按钮禁用；未报名活动也能赞藏评。

---

## Self-review

| 规格项 | 任务 |
|---|---|
| 首页数字只读 | 7 |
| 详情赞/藏/评 | 8 |
| 评论写 `related.comments` | 3、8 |
| 详情评论列表、新在上、介绍后瞬间前 | 8 |
| 独立收藏页 + 首页入口/预览 2 条 | 6、7 |
| 种子陈产品收藏 2、9；赞无陈产品 | 2 |
| 评论数跟 related | 4 |
| `favorites` 不进活动 id | 5 |
| `restoreRelatedComments` | 1 |
| 未报名可操作 | 无资格判断，8 不读 signup |
| 失效收藏卡 | 4 `favoriteViews`、6 |
| 空评论 | 3、8 disabled |
| 首页「查看全部」测试切片 | 7 |
| 无后台赞藏页 / 无 C 端删评 | 未做即为不做 |
| `npx tsc --noEmit` | 9 |
