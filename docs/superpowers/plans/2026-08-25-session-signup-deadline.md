# 多场次相对报名截止 Implementation Plan

> **For agentic workers:** Execute inline in this session. TDD for schedule helpers. Do not commit unless asked.

**Goal:** Recurring/series signup starts once at activity level; each session closes `startAt − N hours`.

**Architecture:** `activitySchedule.ts` owns session signup end, sync of `signupEndAt`, format copy, and open-session checks. Form writes `signupHoursBefore` and derived `signupEndAt`. C-end CTA/pick use those helpers.

**Tech Stack:** React, TypeScript, Ant Design 6, Vitest, dayjs

---

### Task 1: Schedule helpers

**Files:** `src/features/activities/model/activitySchedule.ts` + `.test.ts`

- sessionSignupEndAt, syncSignupEndAt, formatScheduleSignupTime, isSessionSignupOpen, validateSessionPick rejects closed sessions when window passed

### Task 2: Activity field + display + mocks

**Files:** `activity.ts` (`signupHoursBefore`, MOCK 23, formatActivitySignupTime), form/detail/facts/signup CTA

### Task 3: Verify

`npx vitest run src/features/activities src/features/c-end/activities`
