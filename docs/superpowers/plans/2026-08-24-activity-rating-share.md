# 活动评分与分享 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ended activities get 5-star ratings (approved signups only); admin detail shows avg/count; C-end share opens WeCom-style org picker.

**Architecture:** Ratings live in `activities/model/activityRating.ts` (activityId+phone). Share filters `orgPeople`. C-end sheets reuse existing modal/sheet CSS. Admin `ActivityStatsRow` reads the rating store.

**Tech Stack:** React, TypeScript, Vitest, existing C-end CSS, Ant Design Statistic on B-end.

---

### Task 1: Rating store

**Files:**
- Create: `src/features/activities/model/activityRating.ts`
- Test: `src/features/activities/model/activityRating.test.ts`

- [ ] Failing tests then store: visibility, eligibility, set/change, avg/count, seed activity 1, restore.

### Task 2: Share helpers

**Files:**
- Create: `src/features/c-end/activities/model/activityShare.ts`
- Test: `src/features/c-end/activities/model/activityShare.test.ts`

- [ ] Exclude self, search name/dept, toast copy.

### Task 3: Admin stats

**Files:**
- Modify: `src/features/activities/components/ActivityStatsRow.tsx`
- Test: `src/features/activities/components/ActivityStatsRow.test.tsx`

- [ ] 平均分 / 评分人数.

### Task 4: C-end UI + wire H5/PC

**Files:**
- Create rating + share components
- Modify DetailEngageBar, H5/PC detail, styles

- [ ] TDD pages: ended shows stars; ongoing hides; share opens picker.
