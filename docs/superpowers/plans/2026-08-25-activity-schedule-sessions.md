# 活动场次 Implementation Plan

> **For agentic workers:** Execute inline in this session. TDD for model. Do not commit unless asked.

**Goal:** Add once/recurring/series schedule types with generated or listed sessions, unified signup window, and C-end session pick.

**Architecture:** New `activitySchedule.ts` owns types, generation, formatting, validation. `Activity` stores `scheduleType` + session/recurring fields. Form/list/detail/C-end read formatters.

**Tech Stack:** React, TypeScript, Ant Design 6, Vitest, dayjs

---

### Task 1: Schedule model

**Files:**
- Create: `src/features/activities/model/activitySchedule.ts`
- Test: `src/features/activities/model/activitySchedule.test.ts`

- [ ] Generate recurring sessions, format times, validate schedule, session pick

### Task 2: Activity entity + display

**Files:**
- Modify: `src/features/activities/model/activity.ts`
- Modify: tests that construct `Activity`

- [ ] Add fields, default `once`, `formatActivityTime` delegates to schedule formatter

### Task 3: B-end form / detail / list

**Files:**
- Modify: `ActivityFormPage.tsx`, `ActivityDetailPage.tsx`, `ActivityListPage.tsx`

### Task 4: C-end signup + facts

**Files:**
- Modify: `SignupForm.tsx`, `PcSignupModal.tsx`, `ActivityDetailFacts.tsx`, signup pages

### Task 5: Verify

- [ ] `npx vitest run src/features/activities src/features/c-end/activities`
