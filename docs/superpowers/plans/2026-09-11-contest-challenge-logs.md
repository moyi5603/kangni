# 闯关设置 + 闯关记录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 赛事详情 Tab 改为闯关设置 + 闯关记录；每日关卡上限 8；记录按人+日期宽表展示每关次数与是否通过。

**Architecture:** 领域类型与展示/筛选纯函数放 `contest.ts`；种子日志放 `contestStore.ts`；详情 Tab 内 `ContestChallengeLogsPanel` 用 SearchPanel + Table。无地图、无新菜单。

**Tech Stack:** React、TypeScript、Ant Design 6、vitest、`build-ant-design-b2b-app`（查询三项不折叠、表格分页、详情 Tab）

---

### Task 1: 领域模型与校验

**Files:**
- Modify: `src/features/skills-contest/model/contest.ts`
- Test: `src/features/skills-contest/model/contest.test.ts`

- [ ] Write failing tests for `1–8` gate count, `formatChallengeGateCell`, `challengeLogColumnCount`, `filterChallengeDayLogs`
- [ ] Implement types `ChallengeGateCell` / `ChallengeDayLog`, `DAILY_GATE_COUNT_MAX = 8`, update `validateChallengeStage`
- [ ] Tests pass

### Task 2: Store 种子

**Files:**
- Modify: `src/features/skills-contest/model/contestStore.ts`
- Test: `src/features/skills-contest/model/contestStore.test.ts`

- [ ] 公开赛初赛 `dailyGateCount=3`、复赛 `2`；种子 3 条日志（王磊两天、陈芳一天）
- [ ] `useChallengeDayLogs` / `getChallengeDayLogs`；删赛事清日志
- [ ] Tests pass

### Task 3: UI

**Files:**
- Modify: `src/features/skills-contest/pages/ContestDetailPage.tsx`
- Modify: `src/features/skills-contest/components/ContestChallengesPanel.tsx`
- Create: `src/features/skills-contest/components/ContestChallengeLogsPanel.tsx`
- Test: `src/features/skills-contest/pages/ContestDetailPage.test.tsx`
- Test: `src/app/navigation.test.ts`（`challenge-logs` hash）

- [ ] Tab 文案、保存按钮、InputNumber max=8、记录查询+宽表
- [ ] Tests pass: 闯关设置、闯关记录、种子文案、无单独「闯关」Tab
