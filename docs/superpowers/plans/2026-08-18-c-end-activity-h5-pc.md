# C 端活动 H5 / PC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 康尼2 两条独立 C 端路由画出员工活动首页、详情、报名：`#/c/h5` 对齐康尼1 左机模，`#/c/pc` 为同一内容宽屏门户。

**Architecture:** `#/c/` 在 `App` 外包一层，不挂 B 端壳。筛选/报名中/CTA/报名写入共用 `clientActivity` + `signupStore`。H5 与 PC 只换壳和布局。无 antd、无 Tailwind、不改 B 端字段。

**Tech Stack:** React 19、Vite、现有 `activityStore`、独立 CSS。验证：`npx tsc --noEmit`、`python3 scripts/check_ui_conformance.py --root .`。无测试运行器，不新增 vitest。仓库无 git，不 commit。

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/c-end/activities/model/clientActivity.ts` | 已发布、报名中、Tab、排序、摘要、社交数、CTA |
| `src/features/c-end/activities/model/signupStore.ts` | 内存报名 |
| `src/app/navigation.ts` | `parseCEndHash` / `toCEndHash` |
| `src/app/CEndApp.tsx` | C 端路由 + toast |
| `src/app/App.tsx` | `#/c/` 走 `CEndApp`，其余抽 `AdminApp` |
| `src/features/c-end/activities/styles.css` | C 端 token 与布局 |
| `src/features/c-end/activities/components/*` | StatusPill / ActivityMeta / SocialRow / SignupForm |
| `src/features/c-end/activities/h5/*` | H5 壳、首页、详情、Sheet |
| `src/features/c-end/activities/pc/*` | PC 壳、首页、详情、弹层 |

---

### Task 1: Client selectors + signup store

**Files:**
- Create: `src/features/c-end/activities/model/clientActivity.ts`
- Create: `src/features/c-end/activities/model/signupStore.ts`

- [ ] **Step 1: Write `clientActivity.ts`**

```ts
import type { Activity, ActivityType } from '../../../activities/model/activity';

export const CLIENT_TABS = [
  { id: 'all', label: '全部' },
  { id: '公司活动', label: '公司活动' },
  { id: '体检活动', label: '体检活动' },
  { id: '疗休养活动', label: '疗休养活动' },
  { id: '项目活动', label: '项目活动' },
] as const;

export type ClientTabId = (typeof CLIENT_TABS)[number]['id'];

export type ClientActivity = Activity & {
  summary: string;
  likes: number;
  stars: number;
  comments: number;
};

const SOCIAL: Record<number, { likes: number; stars: number; comments: number }> = {
  1: { likes: 3, stars: 0, comments: 0 },
  2: { likes: 1, stars: 0, comments: 0 },
};

export function parseActivityDate(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

export function activitySummary(html: string): string {
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= 36) return text;
  return `${text.slice(0, 36)}…`;
}

export function toClientActivity(activity: Activity): ClientActivity {
  const social = SOCIAL[activity.id] ?? { likes: 0, stars: 0, comments: 0 };
  return { ...activity, summary: activitySummary(activity.detailHtml), ...social };
}

export function sortClientActivities(list: Activity[]): Activity[] {
  return list.slice().sort((left, right) => {
    const pin = Number(right.pinned) - Number(left.pinned);
    if (pin !== 0) return pin;
    const rightPublished = parseActivityDate(right.publishedAt);
    const leftPublished = parseActivityDate(left.publishedAt);
    const rightTime = Number.isFinite(rightPublished) ? rightPublished : Number.NEGATIVE_INFINITY;
    const leftTime = Number.isFinite(leftPublished) ? leftPublished : Number.NEGATIVE_INFINITY;
    return rightTime - leftTime;
  });
}

export function publishedActivities(list: Activity[]): Activity[] {
  return sortClientActivities(list.filter((item) => item.publishStatus === '已发布'));
}

export function isSignupOpen(activity: Activity, now = Date.now()): boolean {
  if (activity.publishStatus !== '已发布' || activity.activityStatus === '已结束') return false;
  const start = parseActivityDate(activity.signupStartAt);
  const end = parseActivityDate(activity.signupEndAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return now >= start && now <= end;
}

export function featuredActivities(list: Activity[], now = Date.now()): Activity[] {
  return publishedActivities(list).filter((item) => isSignupOpen(item, now));
}

export function filterByTab(list: Activity[], tab: ClientTabId): Activity[] {
  const published = publishedActivities(list);
  if (tab === 'all') return published;
  return published.filter((item) => item.type === (tab as ActivityType));
}

export function getPublishedActivity(list: Activity[], id: number): Activity | undefined {
  return publishedActivities(list).find((item) => item.id === id);
}

export function signupTypes(activity: Activity): string[] {
  return activity.signupSettings.map((item) => item.type.trim()).filter(Boolean);
}

export type SignupCta = { label: string; enabled: boolean };

export function signupCta(activity: Activity, signedUp: boolean, now = Date.now()): SignupCta {
  if (activity.activityStatus === '已结束') return { label: '报名已结束', enabled: false };
  if (signedUp) return { label: '已报名', enabled: false };
  const start = parseActivityDate(activity.signupStartAt);
  const end = parseActivityDate(activity.signupEndAt);
  if (Number.isFinite(start) && now < start) return { label: '报名未开始', enabled: false };
  if (Number.isFinite(end) && now > end) return { label: '报名已截止', enabled: false };
  return { label: '立即报名', enabled: true };
}
```

- [ ] **Step 2: Write `signupStore.ts`**

```ts
import { useEffect, useState } from 'react';

export const DEMO_SIGNUP_USER = { name: '陈产品', phone: '13800001111' } as const;

export type ClientSignup = {
  activityId: number;
  name: string;
  phone: string;
  type: string;
  status: '已通过';
  createdAt: string;
};

let signups: ClientSignup[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function hasSignedUp(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return signups.some((item) => item.activityId === activityId && item.phone === phone);
}

export function submitSignup(activityId: number, type: string): 'ok' | 'duplicate' | 'no-type' {
  const trimmed = type.trim();
  if (!trimmed) return 'no-type';
  if (hasSignedUp(activityId)) return 'duplicate';
  signups = [
    ...signups,
    {
      activityId,
      name: DEMO_SIGNUP_USER.name,
      phone: DEMO_SIGNUP_USER.phone,
      type: trimmed,
      status: '已通过',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    },
  ];
  emit();
  return 'ok';
}

export function useHasSignedUp(activityId: number): boolean {
  const [signed, setSigned] = useState(() => hasSignedUp(activityId));
  useEffect(() => {
    const onChange = () => setSigned(hasSignedUp(activityId));
    onChange();
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [activityId]);
  return signed;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`  
Expected: 通过（或仅缺尚未创建的引用，本任务文件自身无报错）

---

### Task 2: Hash + CEndApp + App 分支

**Files:**
- Modify: `src/app/navigation.ts`
- Create: `src/app/CEndApp.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add C 端 hash helpers to `navigation.ts`**

```ts
export type CEndSurface = 'h5' | 'pc';

export type CEndLocation =
  | { kind: 'admin' }
  | { kind: 'c-end'; surface: CEndSurface; activityId?: number };

export function parseCEndHash(hash: string): CEndLocation {
  const path = hash.replace(/^#\/?/, '').trim();
  const [scope, surface, rawId] = path.split('/');
  if (scope !== 'c' || (surface !== 'h5' && surface !== 'pc')) return { kind: 'admin' };
  if (rawId == null || rawId === '') return { kind: 'c-end', surface };
  const activityId = Number(rawId);
  return { kind: 'c-end', surface, activityId: Number.isFinite(activityId) ? activityId : -1 };
}

export function toCEndHash(surface: CEndSurface, activityId?: number): string {
  return activityId == null ? `#/c/${surface}` : `#/c/${surface}/${activityId}`;
}

export function goCEnd(surface: CEndSurface, activityId?: number) {
  window.location.hash = toCEndHash(surface, activityId);
}

export function goAdminWorkbench() {
  window.location.hash = '#/workbench/dashboard';
}
```

Keep `parseLocationHash` unchanged so `#/c/h5` 仍被当成非法应用时的后台 fallback；C 端分支先于它执行。

- [ ] **Step 2: Create `CEndApp.tsx`**

`CEndApp` 包 toast context；按 `surface` + `activityId` 挂 H5/PC 首页或详情。toast API：`show(message: string)`，2 秒后消失。

- [ ] **Step 3: Split `App.tsx`**

`App` 只订阅 `hashchange`，`parseCEndHash` 为 `c-end` 则渲 `CEndApp`，否则渲原后台（改名为 `AdminApp`）。C 端路径不渲 Header/Sider/Drawer。

---

### Task 3: Shared UI + CSS

**Files:**
- Create: `src/features/c-end/activities/styles.css`
- Create: `src/features/c-end/activities/components/StatusPill.tsx`
- Create: `src/features/c-end/activities/components/ActivityMeta.tsx`
- Create: `src/features/c-end/activities/components/SocialRow.tsx`
- Create: `src/features/c-end/activities/components/SignupForm.tsx`

- [ ] **Step 1: CSS tokens**

`--c-orange: #FF7F24;` `--c-ongoing: #3A8EE6;` `--c-ended: #9CA3AF;` `--c-bg: #F5F5F5;` `--c-card: #FFFFFF;` `--c-text: #18181B;` `--c-muted: #71717A;` `--c-radius: 12px;`

H5 壳 `max-width: 430px` 居中。PC 主区 `max-width: 1120px`。Tab 横滑隐藏滚动条。触控目标 ≥ 44px。主按钮 `active` 缩小/降透明。

- [ ] **Step 2: Shared components**

`StatusPill`：未开始橙、进行中蓝、已结束灰。  
`ActivityMeta`：时钟 + `startAt ~ endAt` 截断、地点钉 + `location`。  
`SocialRow`：赞/星/评只读。  
`SignupForm`：报名类型 radio；无类型时确认 disabled +「暂不可报名」；确认/取消，主操作在左。

---

### Task 4: H5 pages

**Files:**
- Create: `src/features/c-end/activities/h5/H5ActivityShell.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityHome.tsx`
- Create: `src/features/c-end/activities/h5/H5ActivityDetail.tsx`
- Create: `src/features/c-end/activities/h5/H5SignupSheet.tsx`

- [ ] **Step 1: Shell** — 顶栏插槽 + 全高灰底 430px 框。

- [ ] **Step 2: Home** — 顶栏返回 `goAdminWorkbench`、标题「活动」。报名中横滑 82% 宽大卡（无则整块不渲）。全部活动类型 Tab。列表卡点进 `#/c/h5/{id}`。空：「暂无活动」。数据 `useActivities()`。

- [ ] **Step 3: Detail + Sheet** — 封面 16:9、信息、`detailHtml`；疗休养加行程/费用。底栏 CTA 用 `signupCta`。立即报名开 Sheet。`submitSignup` 后 toast「报名成功」或「已报名」。非法/未发布：「活动不存在」回 `#/c/h5`。

---

### Task 5: PC pages

**Files:**
- Create: `src/features/c-end/activities/pc/PcActivityShell.tsx`
- Create: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Create: `src/features/c-end/activities/pc/PcActivityDetail.tsx`
- Create: `src/features/c-end/activities/pc/PcSignupModal.tsx`

- [ ] **Step 1: Shell** — 顶栏左「康尼」→ 工作台，中「活动广场」，右「手机版」→ `#/c/h5`。

- [ ] **Step 2: Home** — 报名中最多 3 张英雄卡。Tab + 栅格（3 列，`max-width: 900px` 时 2 列）。点卡 `#/c/pc/{id}`。

- [ ] **Step 3: Detail + Modal** — 左封面+正文，右 sticky 信息卡 + 报名按钮。弹层字段同 H5。

---

### Task 6: Verify

- [ ] **Step 1:** `npx tsc --noEmit` 退出码 0
- [ ] **Step 2:** `python3 scripts/check_ui_conformance.py --root .` 通过
- [ ] **Step 3:** 手工：`#/c/h5` 报名中至少训练营+体检；未发布不可见；Tab 体检只出年度体检；详情可报；`#/c/pc` 宽屏 + 手机版

---

## Spec coverage

| Spec | Task |
|---|---|
| 独立 hash、不套壳 | 2 |
| 已发布/报名中/Tab/排序/摘要 | 1 |
| H5 左机模结构 | 4 |
| PC 宽屏门户 | 5 |
| 详情字段 + 疗休养 | 4, 5 |
| CTA 状态机 + 报名 | 1, 4, 5 |
| 无 antd / 无 vitest | 全程 |
| tsc + conformance | 6 |
