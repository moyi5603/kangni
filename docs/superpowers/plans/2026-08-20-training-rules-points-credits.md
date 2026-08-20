# Training Rules (Points/Credits) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add training app「规则设置」for global points/credits reward rules; remove course-level points fields from form and detail.

**Architecture:** New `rewardRules` model + in-memory store (same pattern as activity `rulesStore`). Settings page with two Cards and sticky footer. Strip `pointsEnabled`/`points` from `CourseRecord` and bump mock version.

**Tech Stack:** React, TypeScript, Ant Design, Vitest, existing training feature module.

**Spec:** `docs/superpowers/specs/2026-08-20-training-rules-points-credits-design.md`

---

### Task 1: Model + validation + store

**Files:**
- Create: `src/features/training/model/rewardRules.ts`
- Create: `src/features/training/model/rewardRulesStore.ts`
- Create: `src/features/training/model/rewardRules.test.ts`

- [ ] **Step 1: Add types, defaults, prepare/validate**

```ts
// rewardRules.ts
export const REWARD_RULES_MOCK_VERSION = 1;
export const rewardModes = ['fixed', 'duration'] as const;
export type RewardMode = (typeof rewardModes)[number];

export type RewardKindRule = {
  enabled: boolean;
  mode: RewardMode | null;
  fixedPoints: number | null;
  intervalMinutes: number | null;
  pointsPerInterval: number | null;
  lessonCap: number | null;
  dailyCap: number | null;
};

export type TrainingRewardRules = {
  points: RewardKindRule;
  credits: RewardKindRule;
};

export function emptyKindRule(): RewardKindRule {
  return {
    enabled: false,
    mode: null,
    fixedPoints: null,
    intervalMinutes: null,
    pointsPerInterval: null,
    lessonCap: null,
    dailyCap: null,
  };
}

export function cloneRewardRules(rules: TrainingRewardRules): TrainingRewardRules {
  return {
    points: { ...rules.points },
    credits: { ...rules.credits },
  };
}

export const initialRewardRules: TrainingRewardRules = {
  points: emptyKindRule(),
  credits: emptyKindRule(),
};

export function prepareKindForSave(rule: RewardKindRule): RewardKindRule {
  if (!rule.enabled) return emptyKindRule();
  if (rule.mode === 'fixed') {
    return {
      enabled: true,
      mode: 'fixed',
      fixedPoints: rule.fixedPoints,
      intervalMinutes: null,
      pointsPerInterval: null,
      lessonCap: rule.lessonCap,
      dailyCap: rule.dailyCap,
    };
  }
  return {
    enabled: true,
    mode: 'duration',
    fixedPoints: null,
    intervalMinutes: rule.intervalMinutes,
    pointsPerInterval: rule.pointsPerInterval,
    lessonCap: rule.lessonCap,
    dailyCap: rule.dailyCap,
  };
}

export function prepareRewardRulesForSave(rules: TrainingRewardRules): TrainingRewardRules {
  return {
    points: prepareKindForSave(rules.points),
    credits: prepareKindForSave(rules.credits),
  };
}

export function validateKindRule(rule: RewardKindRule, label: string): string | null {
  if (!rule.enabled) return null;
  if (rule.mode !== 'fixed' && rule.mode !== 'duration') return `请选择${label}发放方式`;
  if (rule.mode === 'fixed') {
    if (rule.fixedPoints == null || rule.fixedPoints < 1) return `请输入${label}每课程固定分`;
  } else {
    if (rule.intervalMinutes == null || rule.intervalMinutes < 1) return `请输入${label}分钟间隔`;
    if (rule.pointsPerInterval == null || rule.pointsPerInterval < 1) return `请输入${label}每区间分值`;
  }
  if (rule.lessonCap == null || rule.lessonCap < 1) return `请输入${label}每节课上限`;
  if (rule.dailyCap == null || rule.dailyCap < 1) return `请输入${label}每日上限`;
  if (rule.dailyCap < rule.lessonCap) return `${label}每日上限不能小于每节课上限`;
  return null;
}

export function validateRewardRules(rules: TrainingRewardRules): string | null {
  return validateKindRule(rules.points, '积分') ?? validateKindRule(rules.credits, '学分');
}
```

- [ ] **Step 2: Add store mirroring `rulesStore.ts`**

```ts
// rewardRulesStore.ts — getRewardRules, saveRewardRules, useRewardRules
```

- [ ] **Step 3: Unit tests for prepare + validate (enabled fixed, duration, dailyCap < lessonCap, disabled skips)**

Run: `npx vitest run src/features/training/model/rewardRules.test.ts`

---

### Task 2: TrainingRulesPage

**Files:**
- Create: `src/features/training/pages/TrainingRulesPage.tsx`

- [ ] **Step 1: Page with ListPageHeading, Form, two Cards (积分/学分), sticky save/cancel**
- [ ] **Step 2: Per-card: Switch enabled → Radio mode → conditional fields → lessonCap/dailyCap**
- [ ] **Step 3: Dirty leave confirm; cancel resets to last saved snapshot; save uses prepare + validate**

Patterns: `ActivityRulesPage.tsx`, `CourseFormPage.tsx` sticky footer, `edit-form` class.

---

### Task 3: Navigation + App route

**Files:**
- Modify: `src/app/navigation.ts` — add `{ key: 'training-rules', icon: 'fileText', label: '规则设置' }` after records
- Modify: `src/app/navigation.test.ts` — expect new menu item
- Modify: `src/app/App.tsx` — render `<TrainingRulesPage />` when `page === 'training-rules'`

Run: `npx vitest run src/app/navigation.test.ts`

---

### Task 4: Strip course-level points

**Files:**
- Modify: `src/features/training/model/training.ts` — remove fields; `TRAINING_MOCK_VERSION = 6`; strip from mock courses
- Modify: `src/features/training/pages/CourseFormPage.tsx` — remove points form state/UI/save
- Modify: `src/features/training/pages/CourseListPage.tsx` — remove detail Descriptions item

---

### Task 5: Verify

- [ ] `npx vitest run src/features/training/model/rewardRules.test.ts src/app/navigation.test.ts`
- [ ] `npm run build`
- [ ] Manual: open 规则设置, save points fixed rule, refresh; course form has no 积分激励

---

### Spec coverage

| Spec item | Task |
|-----------|------|
| Menu + route | 3 |
| Two cards, modes, caps | 2 |
| Model validate/prepare | 1 |
| Remove course points | 4 |
| Build/tests | 1, 3, 5 |
