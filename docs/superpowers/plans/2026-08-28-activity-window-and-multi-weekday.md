# 活动时间窗口与周期多周几 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 活动与兴趣小组创建活动：活动时间为顶层窗口；周期可多选周几且各填时段；场次与窗口求交或拦截。

**Architecture:** 共享 `activitySchedule.ts` 的 `repeatRules`、窗口内生成与校验；B 端两套表单和 C 端兴趣小组创建页共用同一套函数。`startAt`/`endAt` 存窗口，不再用场次边界覆盖。

**Tech Stack:** React, TypeScript, Ant Design, Vitest, dayjs

---

### Task 1: Schedule model — generate, validate, format

**Files:**
- Modify: `src/features/activities/model/activitySchedule.ts`
- Modify: `src/features/activities/model/activitySchedule.test.ts`

- [ ] Write failing tests for multi-rule generate, skip out-of-window sessions, series window errors, format/copy.
- [ ] Implement `RepeatRule`, new `generateRecurringSessions`, `sessionFullyWithinWindow`, draft validation, `formatActivityScheduleTime`, `formatRecurringWeekdays`.
- [ ] Run `npx vitest run src/features/activities/model/activitySchedule.test.ts`

### Task 2: Activity entity + seeds + C-end short date

**Files:**
- Modify: `src/features/activities/model/activity.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`

- [ ] Add `repeatRules`; keep coerce from old fields.
- [ ] Seeds use window + rules; do not `syncSessionBounds` over window.
- [ ] `formatShortActivityDate` → `每周二、周三 · N场`

### Task 3: Activity form

**Files:**
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`
- Modify: `src/features/activities/pages/ActivityFormPage.test.tsx`

- [ ] Tests: 活动时间 index < 举办方式; no 周期起止.
- [ ] Form: activityRange above scheduleType; checkbox weekdays + per-day times; series validator vs window; save uses window not session bounds.

### Task 4: Interest group model, store, B form, C create

**Files:**
- Modify: `src/features/interest-groups/model/interestGroupActivity.ts` (+ test)
- Modify: `src/features/interest-groups/model/interestGroupStore.ts`
- Modify: `src/features/interest-groups/model/interestGroupActivityPlan.ts` (+ test)
- Modify: `src/features/interest-groups/pages/InterestGroupActivityFormPage.tsx`
- Modify: `src/features/c-end/interest-groups/h5/IgScreens.tsx`
- Modify: `src/features/c-end/interest-groups/h5/H5InterestGroupHome.test.tsx`

- [ ] Same window + repeatRules contract.
- [ ] C-end create: 活动时间 above 举办方式; multi weekday.

### Task 5: Verify

- [ ] `npx vitest run` on touched test files
- [ ] Browser if dev server up: create recurring Tue+Wed, check generated sessions
