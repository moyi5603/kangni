# 学习计划（成长地图）融合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在本仓库新增「学习计划」应用：沿用成长地图 5 Tab 骨架，接入指派模式、进度策略（每日只清习题）、习题任务（手选/随机）、预置闯关皮，以及可验的 C 端闯关预览。

**Architecture:** 领域规则全部放 `features/learning-plan/model`（种子抽题、过关、顺序锁关、积分）。后台列表 + 独立表单；C 端预览页用同一 store 模拟学员作答。习题题目读现有 `getQuestionStore('practice')`，不新建题库。课/考/讲座本轮用 mock 内容 ID，只记完成态，不嵌套完整播课器。

**Tech Stack:** React 19、antd 6、Vitest、hash 路由、`ListPage` 四层。

**Spec:** `docs/superpowers/specs/2026-09-10-learning-plan-fusion-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/learning-plan/model/learningPlan.ts` | 类型、东八区日期、种子、抽题、过关、锁关、校验、积分 |
| `src/features/learning-plan/model/learningPlan.test.ts` | 模型单测 |
| `src/features/learning-plan/model/learningPlanStore.ts` | 计划 / 进度 / 抽题快照内存 store |
| `src/features/learning-plan/model/learningPlanStore.test.ts` | store 单测 |
| `src/features/learning-plan/pages/LearningPlanListPage.tsx` | 列表 |
| `src/features/learning-plan/pages/LearningPlanListPage.test.tsx` | 列表渲染 |
| `src/features/learning-plan/pages/LearningPlanFormPage.tsx` | 新建/编辑：基本信息 + 任务 |
| `src/features/learning-plan/pages/LearningPlanFormPage.test.tsx` | 表单字段与发布后只读 |
| `src/features/learning-plan/pages/LearningPlanMapPreview.tsx` | C 端闯关预览 + 习题作答 |
| `src/features/learning-plan/pages/LearningPlanMapPreview.test.tsx` | 锁关与换皮文案 |
| `src/app/navigation.ts` | 应用、菜单、hash、sider |
| `src/app/navigation.test.ts` | hash / sider |
| `src/app/App.tsx` | 路由三页 |

本轮不做：完整学员规则引擎、勋章 Agent、IM 通知、运营上传地图、课/考随机。表单「学员 / 奖励 / 通知」Tab 放只读说明，避免假 CRUD。

---

### Task 1: 日期、种子、随机抽题

**Files:**
- Create: `src/features/learning-plan/model/learningPlan.ts`
- Create: `src/features/learning-plan/model/learningPlan.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/learning-plan/model/learningPlan.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { pickRandomIds, quizSeedKey, shanghaiDayKey } from './learningPlan';

describe('shanghaiDayKey', () => {
  it('uses Asia/Shanghai calendar day', () => {
    expect(shanghaiDayKey(Date.parse('2026-09-10T00:30:00+08:00'))).toBe('2026-09-10');
    expect(shanghaiDayKey(Date.parse('2026-09-09T23:30:00+08:00'))).toBe('2026-09-09');
  });
});

describe('quizSeedKey', () => {
  const base = {
    planId: 1,
    taskId: 't-quiz',
    attemptNo: 1,
    userId: 'u1',
    naturalDate: '2026-09-10',
    quizScope: 'cohort' as const,
  };

  it('accumulate omits date', () => {
    expect(
      quizSeedKey({ ...base, progressMode: 'accumulate' }),
    ).toBe('1|t-quiz|1');
  });

  it('daily fixed omits date so same attemptNo matches yesterday', () => {
    expect(
      quizSeedKey({ ...base, progressMode: 'daily', dailyContent: 'fixed' }),
    ).toBe('1|t-quiz|1');
  });

  it('daily redraw includes date', () => {
    expect(
      quizSeedKey({ ...base, progressMode: 'daily', dailyContent: 'redraw' }),
    ).toBe('1|t-quiz|2026-09-10|1');
  });

  it('personal appends userId', () => {
    expect(
      quizSeedKey({
        ...base,
        progressMode: 'daily',
        dailyContent: 'redraw',
        quizScope: 'personal',
      }),
    ).toBe('1|t-quiz|2026-09-10|1|u1');
  });
});

describe('pickRandomIds', () => {
  it('returns same ids for same seed', () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(pickRandomIds(pool, 3, 'seed-a')).toEqual(pickRandomIds(pool, 3, 'seed-a'));
  });

  it('differs across seeds', () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(pickRandomIds(pool, 3, 'seed-a')).not.toEqual(pickRandomIds(pool, 3, 'seed-b'));
  });

  it('throws when pool smaller than count', () => {
    expect(() => pickRandomIds([1, 2], 3, 's')).toThrow(/题目不足/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/model/learningPlan.test.ts`

Expected: FAIL module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/learning-plan/model/learningPlan.ts`:

```ts
export type AssignMode = 'once' | 'rolling';
export type ProgressMode = 'accumulate' | 'daily';
export type DailyContent = 'fixed' | 'redraw';
export type QuizScope = 'cohort' | 'personal';
export type MapSkinId = 'island' | 'city' | 'minimal';
export type TaskType = 'course' | 'exam' | 'lecture' | 'quiz';
export type QuizMode = 'manual' | 'random';
export type PlanStatus = 'draft' | 'published';

export const MAP_SKINS: { id: MapSkinId; label: string }[] = [
  { id: 'island', label: '竖版岛屿' },
  { id: 'city', label: '城市路线' },
  { id: 'minimal', label: '简约节点' },
];

export type PlanTask = {
  id: string;
  type: TaskType;
  required: boolean;
  title: string;
  refId?: string;
  quizMode?: QuizMode;
  questionIds?: number[];
  bankId?: string;
  randomCount?: number;
};

export type PlanStage = {
  id: string;
  name: string;
  tasks: PlanTask[];
};

export type LearningPlan = {
  id: number;
  name: string;
  assignMode: AssignMode;
  progressMode: ProgressMode;
  dailyContent?: DailyContent;
  quizScope: QuizScope;
  quizPassRate: number;
  mapSkinId: MapSkinId;
  overtimeAllowed: boolean;
  taskSync: boolean;
  progressSync: boolean;
  status: PlanStatus;
  startAt: string;
  endAt: string;
  stages: PlanStage[];
};

export type QuizSeedInput = {
  planId: number;
  taskId: string;
  attemptNo: number;
  userId: string;
  naturalDate: string;
  progressMode: ProgressMode;
  dailyContent?: DailyContent;
  quizScope: QuizScope;
};

export function shanghaiDayKey(ms: number): string {
  const shifted = new Date(ms + 8 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function quizSeedKey(input: QuizSeedInput): string {
  const parts = [String(input.planId), input.taskId];
  if (input.progressMode === 'daily' && input.dailyContent === 'redraw') {
    parts.push(input.naturalDate);
  }
  parts.push(String(input.attemptNo));
  if (input.quizScope === 'personal') parts.push(input.userId);
  return parts.join('|');
}

function mulberry32(str: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandomIds(pool: number[], count: number, seed: string): number[] {
  if (pool.length < count) throw new Error('题目不足，联系管理员');
  const rng = mulberry32(seed);
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count).sort((a, b) => a - b);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/learning-plan/model/learningPlan.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/model/learningPlan.ts src/features/learning-plan/model/learningPlan.test.ts
git commit -m "feat(learning-plan): add quiz seed key and deterministic draw"
```

---

### Task 2: 过关与顺序锁关

**Files:**
- Modify: `src/features/learning-plan/model/learningPlan.ts`
- Modify: `src/features/learning-plan/model/learningPlan.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `learningPlan.test.ts`:

```ts
import { currentStageIndex, isTaskPassed, type LearnerProgress } from './learningPlan';

const emptyProgress = (): LearnerProgress => ({
  courseDone: {},
  lectureDone: {},
  examPassed: {},
  quizPassedDays: {},
});

describe('isTaskPassed', () => {
  const day = '2026-09-10';

  it('keeps course/exam passed across daily reset', () => {
    const progress: LearnerProgress = {
      ...emptyProgress(),
      courseDone: { c1: true },
      examPassed: { e1: true },
    };
    expect(isTaskPassed({ id: 'c1', type: 'course', required: true, title: '课' }, progress, 'daily', day)).toBe(true);
    expect(isTaskPassed({ id: 'e1', type: 'exam', required: true, title: '考' }, progress, 'daily', day)).toBe(true);
  });

  it('treats quiz as unpassed on a new day in daily mode', () => {
    const progress: LearnerProgress = {
      ...emptyProgress(),
      quizPassedDays: { q1: ['2026-09-09'] },
    };
    expect(isTaskPassed({ id: 'q1', type: 'quiz', required: true, title: '习' }, progress, 'daily', day)).toBe(false);
    expect(isTaskPassed({ id: 'q1', type: 'quiz', required: true, title: '习' }, progress, 'daily', '2026-09-09')).toBe(true);
  });

  it('keeps quiz passed in accumulate regardless of day', () => {
    const progress: LearnerProgress = {
      ...emptyProgress(),
      quizPassedDays: { q1: ['2026-09-01'] },
    };
    expect(isTaskPassed({ id: 'q1', type: 'quiz', required: true, title: '习' }, progress, 'accumulate', day)).toBe(true);
  });
});

describe('currentStageIndex', () => {
  const stages = [
    {
      id: 's1',
      name: '关1',
      tasks: [
        { id: 'c1', type: 'course' as const, required: true, title: '课' },
        { id: 'q1', type: 'quiz' as const, required: true, title: '习' },
      ],
    },
    {
      id: 's2',
      name: '关2',
      tasks: [{ id: 'e1', type: 'exam' as const, required: true, title: '考' }],
    },
  ];

  it('stays on stage 0 when today quiz missing even if course done', () => {
    const progress: LearnerProgress = {
      ...emptyProgress(),
      courseDone: { c1: true },
      examPassed: { e1: true },
      quizPassedDays: { q1: ['2026-09-09'] },
    };
    expect(currentStageIndex(stages, progress, 'daily', '2026-09-10')).toBe(0);
  });

  it('unlocks later stages when today quiz also passed', () => {
    const progress: LearnerProgress = {
      ...emptyProgress(),
      courseDone: { c1: true },
      examPassed: { e1: true },
      quizPassedDays: { q1: ['2026-09-10'] },
    };
    expect(currentStageIndex(stages, progress, 'daily', '2026-09-10')).toBe(2);
  });

  it('ignores optional tasks for lock', () => {
    const optional = [
      {
        id: 's1',
        name: '关1',
        tasks: [{ id: 'q1', type: 'quiz' as const, required: false, title: '选修习' }],
      },
    ];
    expect(currentStageIndex(optional, emptyProgress(), 'daily', '2026-09-10')).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/model/learningPlan.test.ts`

Expected: FAIL `isTaskPassed` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `learningPlan.ts`:

```ts
export type LearnerProgress = {
  courseDone: Record<string, boolean>;
  lectureDone: Record<string, boolean>;
  examPassed: Record<string, boolean>;
  quizPassedDays: Record<string, string[]>;
};

export function isTaskPassed(
  task: PlanTask,
  progress: LearnerProgress,
  progressMode: ProgressMode,
  day: string,
): boolean {
  if (task.type === 'course') return Boolean(progress.courseDone[task.id]);
  if (task.type === 'lecture') return Boolean(progress.lectureDone[task.id]);
  if (task.type === 'exam') return Boolean(progress.examPassed[task.id]);
  const days = progress.quizPassedDays[task.id] ?? [];
  if (progressMode === 'accumulate') return days.length > 0;
  return days.includes(day);
}

export function stageRequiredPassed(
  stage: PlanStage,
  progress: LearnerProgress,
  progressMode: ProgressMode,
  day: string,
): boolean {
  return stage.tasks.filter((t) => t.required).every((t) => isTaskPassed(t, progress, progressMode, day));
}

/** 当前可进入的关卡下标；全部通关则返回 stages.length */
export function currentStageIndex(
  stages: PlanStage[],
  progress: LearnerProgress,
  progressMode: ProgressMode,
  day: string,
): number {
  const idx = stages.findIndex((stage) => !stageRequiredPassed(stage, progress, progressMode, day));
  return idx === -1 ? stages.length : idx;
}

export function canEnterStage(stageIndex: number, current: number): boolean {
  return stageIndex <= current;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/learning-plan/model/learningPlan.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/model/learningPlan.ts src/features/learning-plan/model/learningPlan.test.ts
git commit -m "feat(learning-plan): persist course/exam pass; daily quiz lock"
```

---

### Task 3: 习题尝试、正确率、积分

**Files:**
- Modify: `src/features/learning-plan/model/learningPlan.ts`
- Modify: `src/features/learning-plan/model/learningPlan.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
import {
  canGrantQuizPoints,
  nextAttemptNo,
  quizPassedByRate,
  resolveQuizQuestionIds,
} from './learningPlan';

describe('quizPassedByRate', () => {
  it('requires submit and rate >= plan line', () => {
    expect(quizPassedByRate(0.59, 60)).toBe(false);
    expect(quizPassedByRate(0.6, 60)).toBe(true);
  });
});

describe('nextAttemptNo', () => {
  it('counts attempts in the same day for daily plans', () => {
    expect(nextAttemptNo([{ day: '2026-09-10' }, { day: '2026-09-10' }], 'daily', '2026-09-10')).toBe(3);
    expect(nextAttemptNo([{ day: '2026-09-09' }], 'daily', '2026-09-10')).toBe(1);
  });

  it('counts lifetime attempts in accumulate', () => {
    expect(nextAttemptNo([{ day: '2026-09-01' }, { day: '2026-09-09' }], 'accumulate', '2026-09-10')).toBe(3);
  });
});

describe('resolveQuizQuestionIds', () => {
  it('returns manual ids as-is', () => {
    const task: PlanTask = {
      id: 'q',
      type: 'quiz',
      required: true,
      title: '习',
      quizMode: 'manual',
      questionIds: [9, 8],
    };
    expect(resolveQuizQuestionIds(task, [1, 2, 3], 'seed')).toEqual([9, 8]);
  });

  it('draws random from pool', () => {
    const task: PlanTask = {
      id: 'q',
      type: 'quiz',
      required: true,
      title: '习',
      quizMode: 'random',
      randomCount: 2,
    };
    const ids = resolveQuizQuestionIds(task, [1, 2, 3, 4], 'seed-x');
    expect(ids).toHaveLength(2);
    expect(resolveQuizQuestionIds(task, [1, 2, 3, 4], 'seed-x')).toEqual(ids);
  });
});

describe('canGrantQuizPoints', () => {
  it('grants once per day in daily mode', () => {
    expect(canGrantQuizPoints({ progressMode: 'daily', alreadyDays: ['2026-09-09'] }, '2026-09-10')).toBe(true);
    expect(canGrantQuizPoints({ progressMode: 'daily', alreadyDays: ['2026-09-10'] }, '2026-09-10')).toBe(false);
  });

  it('grants once lifetime in accumulate', () => {
    expect(canGrantQuizPoints({ progressMode: 'accumulate', alreadyDays: ['2026-09-01'] }, '2026-09-10')).toBe(false);
    expect(canGrantQuizPoints({ progressMode: 'accumulate', alreadyDays: [] }, '2026-09-10')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/model/learningPlan.test.ts`

Expected: FAIL missing exports.

- [ ] **Step 3: Write minimal implementation**

Append to `learningPlan.ts`:

```ts
export function quizPassedByRate(correctRate: number, passRatePercent: number): boolean {
  return correctRate * 100 >= passRatePercent;
}

export function nextAttemptNo(
  attempts: { day: string }[],
  progressMode: ProgressMode,
  day: string,
): number {
  const n =
    progressMode === 'daily' ? attempts.filter((a) => a.day === day).length : attempts.length;
  return n + 1;
}

export function resolveQuizQuestionIds(task: PlanTask, pool: number[], seed: string): number[] {
  if (task.quizMode === 'manual') return [...(task.questionIds ?? [])];
  return pickRandomIds(pool, task.randomCount ?? 0, seed);
}

export function canGrantQuizPoints(
  input: { progressMode: ProgressMode; alreadyDays: string[] },
  day: string,
): boolean {
  if (input.progressMode === 'accumulate') return input.alreadyDays.length === 0;
  return !input.alreadyDays.includes(day);
}

export function canGrantPersistentPoints(already: boolean): boolean {
  return !already;
}

export type LockedPlanField = 'assignMode' | 'progressMode' | 'dailyContent' | 'quizScope' | 'taskSync';

export function isPlanFieldLocked(status: PlanStatus, field: LockedPlanField): boolean {
  return status === 'published';
}

export function validateQuizTask(task: PlanTask, poolSize: number): string | null {
  if (task.type !== 'quiz') return null;
  if (task.quizMode === 'manual' && !(task.questionIds && task.questionIds.length > 0)) {
    return '请选择题目';
  }
  if (task.quizMode === 'random') {
    const x = task.randomCount ?? 0;
    if (x < 1) return '随机题量至少 1';
    if (poolSize < x) return '题目不足，联系管理员';
  }
  return null;
}

export function validatePlanBasics(plan: Pick<LearningPlan, 'name' | 'quizPassRate' | 'progressMode' | 'dailyContent'>): string | null {
  if (!plan.name.trim()) return '请填写名称';
  if (plan.quizPassRate < 1 || plan.quizPassRate > 100) return '及格线须在 1–100';
  if (plan.progressMode === 'daily' && !plan.dailyContent) return '请选择每日内容';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/learning-plan/model/learningPlan.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/model/learningPlan.ts src/features/learning-plan/model/learningPlan.test.ts
git commit -m "feat(learning-plan): quiz attempt, pass rate, and point gates"
```

---

### Task 4: Store（计划 + 进度 + 抽题快照）

**Files:**
- Create: `src/features/learning-plan/model/learningPlanStore.ts`
- Create: `src/features/learning-plan/model/learningPlanStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { getLearningPlanStore } from './learningPlanStore';
import type { LearningPlan } from './learningPlan';

const plan = (partial: Partial<LearningPlan> = {}): LearningPlan => ({
  id: 1,
  name: '安全日练',
  assignMode: 'once',
  progressMode: 'daily',
  dailyContent: 'redraw',
  quizScope: 'cohort',
  quizPassRate: 60,
  mapSkinId: 'island',
  overtimeAllowed: true,
  taskSync: true,
  progressSync: true,
  status: 'draft',
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  stages: [
    {
      id: 's1',
      name: '第 1 关',
      tasks: [
        { id: 'c1', type: 'course', required: true, title: '安全课', refId: 'course-1' },
        {
          id: 'q1',
          type: 'quiz',
          required: true,
          title: '每日一练',
          quizMode: 'random',
          randomCount: 2,
          bankId: 'practice',
        },
      ],
    },
  ],
  ...partial,
});

describe('learningPlanStore', () => {
  beforeEach(() => {
    getLearningPlanStore().reset([plan()]);
  });

  it('locks progressMode after publish', () => {
    const store = getLearningPlanStore();
    store.publish(1);
    expect(() => store.updatePlan(1, { progressMode: 'accumulate' })).toThrow(/发布后不可改/);
    store.updatePlan(1, { mapSkinId: 'city', quizPassRate: 70 });
    expect(store.getPlan(1)?.mapSkinId).toBe('city');
  });

  it('records course done once and quiz pass per day', () => {
    const store = getLearningPlanStore();
    store.markCourseDone(1, 'demo', 'c1');
    store.markQuizPassed(1, 'demo', 'q1', '2026-09-10');
    store.markQuizPassed(1, 'demo', 'q1', '2026-09-10');
    const p = store.getProgress(1, 'demo');
    expect(p.courseDone.c1).toBe(true);
    expect(p.quizPassedDays.q1).toEqual(['2026-09-10']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/model/learningPlanStore.test.ts`

Expected: FAIL module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useSyncExternalStore } from 'react';
import {
  isPlanFieldLocked,
  type LearnerProgress,
  type LearningPlan,
  type MapSkinId,
} from './learningPlan';

type Snapshot = { plans: LearningPlan[]; progress: Record<string, LearnerProgress> };

const emptyProgress = (): LearnerProgress => ({
  courseDone: {},
  lectureDone: {},
  examPassed: {},
  quizPassedDays: {},
});

function progressKey(planId: number, userId: string) {
  return `${planId}:${userId}`;
}

function createStore(seed: LearningPlan[] = []) {
  let snap: Snapshot = { plans: seed, progress: {} };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  return {
    reset(plans: LearningPlan[] = []) {
      snap = { plans, progress: {} };
      emit();
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot() {
      return snap;
    },
    getPlan(id: number) {
      return snap.plans.find((p) => p.id === id);
    },
    upsertPlan(plan: LearningPlan) {
      const i = snap.plans.findIndex((p) => p.id === plan.id);
      snap = {
        ...snap,
        plans: i === -1 ? [...snap.plans, plan] : snap.plans.map((p) => (p.id === plan.id ? plan : p)),
      };
      emit();
    },
    publish(id: number) {
      const plan = this.getPlan(id);
      if (!plan) return;
      this.upsertPlan({ ...plan, status: 'published' });
    },
    updatePlan(id: number, patch: Partial<LearningPlan>) {
      const plan = this.getPlan(id);
      if (!plan) return;
      const locked: (keyof LearningPlan)[] = ['assignMode', 'progressMode', 'dailyContent', 'quizScope', 'taskSync'];
      if (plan.status === 'published') {
        for (const key of locked) {
          if (key in patch && patch[key] !== plan[key] && isPlanFieldLocked(plan.status, key as 'progressMode')) {
            throw new Error('发布后不可改');
          }
        }
      }
      this.upsertPlan({ ...plan, ...patch, id: plan.id, status: plan.status === 'published' ? 'published' : patch.status ?? plan.status });
    },
    getProgress(planId: number, userId: string): LearnerProgress {
      return snap.progress[progressKey(planId, userId)] ?? emptyProgress();
    },
    setProgress(planId: number, userId: string, next: LearnerProgress) {
      snap = { ...snap, progress: { ...snap.progress, [progressKey(planId, userId)]: next } };
      emit();
    },
    markCourseDone(planId: number, userId: string, taskId: string) {
      const p = this.getProgress(planId, userId);
      this.setProgress(planId, userId, { ...p, courseDone: { ...p.courseDone, [taskId]: true } });
    },
    markExamPassed(planId: number, userId: string, taskId: string) {
      const p = this.getProgress(planId, userId);
      this.setProgress(planId, userId, { ...p, examPassed: { ...p.examPassed, [taskId]: true } });
    },
    markLectureDone(planId: number, userId: string, taskId: string) {
      const p = this.getProgress(planId, userId);
      this.setProgress(planId, userId, { ...p, lectureDone: { ...p.lectureDone, [taskId]: true } });
    },
    markQuizPassed(planId: number, userId: string, taskId: string, day: string) {
      const p = this.getProgress(planId, userId);
      const days = p.quizPassedDays[taskId] ?? [];
      if (days.includes(day)) return;
      this.setProgress(planId, userId, {
        ...p,
        quizPassedDays: { ...p.quizPassedDays, [taskId]: [...days, day] },
      });
    },
  };
}

const store = createStore();

export function getLearningPlanStore() {
  return store;
}

export function useLearningPlans() {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot().plans);
}

export type { MapSkinId };
```

Fix `updatePlan` to compare only locked keys that appear in patch. Keep throw message `发布后不可改`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/learning-plan/model/learningPlanStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/model/learningPlanStore.ts src/features/learning-plan/model/learningPlanStore.test.ts
git commit -m "feat(learning-plan): in-memory plan and learner progress store"
```

---

### Task 5: 导航与路由

**Files:**
- Modify: `src/app/navigation.ts`
- Modify: `src/app/navigation.test.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test**

In `navigation.test.ts` append:

```ts
  it('parses learning-plan hashes', () => {
    expect(parseLocationHash('#/learning-plan/learning-plan-list')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-list',
    });
    expect(parseLocationHash('#/learning-plan/learning-plan-create')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-create',
    });
    expect(parseLocationHash('#/learning-plan/learning-plan-edit/1')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-edit',
      recordId: '1',
    });
    expect(parseLocationHash('#/learning-plan/learning-plan-preview/1')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-preview',
      recordId: '1',
    });
  });

  it('highlights list for learning-plan hidden pages', () => {
    expect(siderSelectedKey('learning-plan-create')).toBe('learning-plan-list');
    expect(siderSelectedKey('learning-plan-edit')).toBe('learning-plan-list');
    expect(siderSelectedKey('learning-plan-preview')).toBe('learning-plan-list');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/navigation.test.ts -t "learning-plan"`

Expected: FAIL unknown application.

- [ ] **Step 3: Wire navigation and App**

1. `applications` 增加：`{ key: 'learning-plan', label: '学习计划', category: '员工与组织', icon: 'read', defaultPage: 'learning-plan-list' }`
2. `applicationMenus.learning-plan`：`[{ key: 'learning-plan-list', icon: 'unorderedList', label: '计划管理' }]`
3. `extraPages` 增加 `learning-plan-create` `learning-plan-edit` `learning-plan-preview`
4. `siderSelectedKey`：三隐藏页返回 `learning-plan-list`
5. `App.tsx`：import 三个页面（Task 6–8 先建空壳再在本步接路由，或本步与 Task 6 一起做完列表空壳）。若页面尚未存在，先建：

```tsx
export function LearningPlanListPage() {
  return <div>计划管理</div>;
}
```

同样给 Form / Preview 占位，后续任务替换。

路由：

```tsx
) : page === 'learning-plan-list' ? (
  <LearningPlanListPage />
) : page === 'learning-plan-create' || page === 'learning-plan-edit' ? (
  <LearningPlanFormPage recordId={recordId} />
) : page === 'learning-plan-preview' ? (
  <LearningPlanMapPreview recordId={recordId} />
```

hash 与现网一致：`onNavigate` 用项目已有 `goToPage`。对照 `CheckinListPage` 的跳转方式接上。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/navigation.test.ts -t "learning-plan"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/navigation.ts src/app/navigation.test.ts src/app/App.tsx src/features/learning-plan/pages/*.tsx
git commit -m "feat(learning-plan): register admin app routes"
```

---

### Task 6: 列表页

**Files:**
- Create: `src/features/learning-plan/pages/LearningPlanListPage.tsx`
- Create: `src/features/learning-plan/pages/LearningPlanListPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it } from 'vitest';
import { getLearningPlanStore } from '../model/learningPlanStore';
import { LearningPlanListPage } from './LearningPlanListPage';

describe('LearningPlanListPage', () => {
  it('lists plan name and progress mode', () => {
    getLearningPlanStore().reset([
      {
        id: 1,
        name: '安全日练',
        assignMode: 'once',
        progressMode: 'daily',
        dailyContent: 'fixed',
        quizScope: 'cohort',
        quizPassRate: 60,
        mapSkinId: 'island',
        overtimeAllowed: true,
        taskSync: true,
        progressSync: true,
        status: 'draft',
        startAt: '2026-09-01 00:00',
        endAt: '2026-09-30 23:59',
        stages: [],
      },
    ]);
    render(
      <App>
        <LearningPlanListPage />
      </App>,
    );
    expect(screen.getByText('安全日练')).toBeTruthy();
    expect(screen.getByText('每日重置')).toBeTruthy();
    expect(screen.getByRole('button', { name: '新建计划' })).toBeTruthy();
  });
});
```

若项目 RTL 用法不同，抄 `CheckinListPage.test.tsx` 的 render 包装。

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanListPage.test.tsx`

Expected: FAIL 无「新建计划」。

- [ ] **Step 3: Implement list**

结构：`ListPageHeading`（副标题：`配置学习计划的指派模式、进度策略、闯关皮肤与任务。`）→ `SearchPanel`（名称）→ `ListTableCard`。

列：名称、指派模式（统一窗口/滚动周期）、进度策略（累计/每日重置）、皮肤、状态、操作（编辑、闯关预览）。

主操作左：新建计划 → `learning-plan-create`。

进度策略展示：`plan.progressMode === 'daily' ? '每日重置' : '累计'`。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanListPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/pages/LearningPlanListPage.tsx src/features/learning-plan/pages/LearningPlanListPage.test.tsx
git commit -m "feat(learning-plan): admin list page"
```

---

### Task 7: 表单 · 基本信息（总闸 + 皮肤）

**Files:**
- Create: `src/features/learning-plan/pages/LearningPlanFormPage.tsx`
- Create: `src/features/learning-plan/pages/LearningPlanFormPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it } from 'vitest';
import { getLearningPlanStore } from '../model/learningPlanStore';
import { LearningPlanFormPage } from './LearningPlanFormPage';

describe('LearningPlanFormPage basics', () => {
  it('shows assign mode, progress mode, skins; hides dailyContent until daily', () => {
    render(
      <App>
        <LearningPlanFormPage />
      </App>,
    );
    expect(screen.getByText('指派模式')).toBeTruthy();
    expect(screen.getByText('进度策略')).toBeTruthy();
    expect(screen.getByText('竖版岛屿')).toBeTruthy();
    expect(screen.queryByText('每日内容')).toBeNull();
  });

  it('locks progress mode when published', () => {
    getLearningPlanStore().reset([
      {
        id: 8,
        name: '已发布',
        assignMode: 'once',
        progressMode: 'daily',
        dailyContent: 'fixed',
        quizScope: 'cohort',
        quizPassRate: 60,
        mapSkinId: 'island',
        overtimeAllowed: true,
        taskSync: true,
        progressSync: true,
        status: 'published',
        startAt: '2026-09-01 00:00',
        endAt: '2026-09-30 23:59',
        stages: [],
      },
    ]);
    render(
      <App>
        <LearningPlanFormPage recordId="8" />
      </App>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.some((el) => (el as HTMLInputElement).disabled)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanFormPage.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement form basics**

独立高级表单，Tab：`基本信息` `任务` `学员` `奖励` `通知`。后三 Tab：一段说明「沿用现网能力，本轮原型不配」。

基本信息卡：

- 指派模式 Radio：`once` 统一窗口 / `rolling` 滚动周期
- 进度策略 Radio：`accumulate` 累计 / `daily` 每日重置。旁注：每日只清习题。
- `progressMode===daily'` 时显示每日内容：`fixed` / `redraw`
- 抽题范围：`cohort` / `personal`
- 习题及格线 InputNumber 默认 60
- 皮肤：`MAP_SKINS` 卡片 Radio
- 名称、起止时间必填

`status==='published'`：指派模式、进度策略、每日内容、抽题范围 disabled。皮肤与及格线可改。

保存：`validatePlanBasics`，`upsertPlan`。发布按钮调 `publish`。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanFormPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/pages/LearningPlanFormPage.tsx src/features/learning-plan/pages/LearningPlanFormPage.test.tsx
git commit -m "feat(learning-plan): plan form gates and map skins"
```

---

### Task 8: 表单 · 任务（课/考/讲座指定 + 习题手选/随机）

**Files:**
- Modify: `src/features/learning-plan/pages/LearningPlanFormPage.tsx`
- Modify: `src/features/learning-plan/pages/LearningPlanFormPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
  it('quiz task offers manual and random; course has no random', async () => {
    render(
      <App>
        <LearningPlanFormPage />
      </App>,
    );
    await userEvent.click(screen.getByRole('tab', { name: '任务' }));
    await userEvent.click(screen.getByRole('button', { name: '添加阶段' }));
    await userEvent.click(screen.getByRole('button', { name: '添加任务' }));
    expect(screen.getByText('课程')).toBeTruthy();
    expect(screen.queryByText('随机抽课')).toBeNull();
  });
```

用项目已有的 `userEvent` 导入方式（看 `CheckinFormPage.test.tsx`）。

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanFormPage.test.tsx`

Expected: FAIL 无添加阶段。

- [ ] **Step 3: Task editor**

阶段列表可增删改名。阶段内任务：类型 Select `course|exam|lecture|quiz`，必修 Switch，标题。

- 课/考/讲座：Input `refId`（占位「内容 ID」），禁止随机控件。
- 习题：来源 Radio `指定题目` / `题库随机`。指定：`Select mode="multiple"`，options 来自 `getQuestionStore('practice').getSnapshot().questions`（或 `useQuestions`）启用题。随机：`randomCount` InputNumber；保存时 `validateQuizTask(task, enabledIds.length)`。

只读提示：`当前：${progressMode} · ${dailyContent} · ${quizScope} · 及格 ${quizPassRate}%`。

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanFormPage.test.tsx src/features/learning-plan/model/learningPlan.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/pages/LearningPlanFormPage.tsx src/features/learning-plan/pages/LearningPlanFormPage.test.tsx
git commit -m "feat(learning-plan): stage tasks with quiz-only random draw"
```

---

### Task 9: C 端闯关预览 + 习题交卷

**Files:**
- Create: `src/features/learning-plan/pages/LearningPlanMapPreview.tsx`
- Create: `src/features/learning-plan/pages/LearningPlanMapPreview.test.tsx`
- Modify: `src/features/learning-plan/model/learningPlanStore.ts`（写入 `QuizDraw` 可选；若交卷只走进度也可不落快照，但同 seed 必须同题：在预览里用 `quizSeedKey` + `resolveQuizQuestionIds` 现算）

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it } from 'vitest';
import { getLearningPlanStore } from '../model/learningPlanStore';
import { LearningPlanMapPreview } from './LearningPlanMapPreview';

const demoPlan = {
  id: 1,
  name: '安全日练',
  assignMode: 'once' as const,
  progressMode: 'daily' as const,
  dailyContent: 'fixed' as const,
  quizScope: 'cohort' as const,
  quizPassRate: 60,
  mapSkinId: 'city' as const,
  overtimeAllowed: true,
  taskSync: true,
  progressSync: true,
  status: 'published' as const,
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  stages: [
    {
      id: 's1',
      name: '基础',
      tasks: [
        { id: 'c1', type: 'course' as const, required: true, title: '安全课' },
        { id: 'q1', type: 'quiz' as const, required: true, title: '一练', quizMode: 'manual' as const, questionIds: [1] },
      ],
    },
    {
      id: 's2',
      name: '进阶',
      tasks: [{ id: 'e1', type: 'exam' as const, required: true, title: '安全考' }],
    },
  ],
};

describe('LearningPlanMapPreview', () => {
  it('locks later stage and shows selected skin label', () => {
    getLearningPlanStore().reset([demoPlan]);
    getLearningPlanStore().markCourseDone(1, 'demo', 'c1');
    render(
      <App>
        <LearningPlanMapPreview recordId="1" />
      </App>,
    );
    expect(screen.getByText('城市路线')).toBeTruthy();
    expect(screen.getByText('基础')).toBeTruthy();
    expect(screen.getByText('未解锁')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learning-plan/pages/LearningPlanMapPreview.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement preview**

固定学员 `demo`。`day = shanghaiDayKey(Date.now())`。验收切日：页面提供「模拟日期」Input（仅预览），默认今天。

渲染：皮肤名；关卡列表。`stageIndex > currentStageIndex(...)` 显示锁定。当前关：任务行。

- 课程/讲座/考试：按钮「标记完成 / 标记及格」→ store `markCourseDone` 等。已过只读。
- 习题：打开答题区。`attemptNo = nextAttemptNo(localAttempts, plan.progressMode, day)`。`seed = quizSeedKey(...)`。题目 ID = `resolveQuizQuestionIds`。练习题干从 practice store 取。提交：对题比例 `quizPassedByRate`；通过则 `markQuizPassed`。未通过可「再闯」（attemptNo+1，随机重抽）。

模拟日期改到第二天：课/考仍过，习题未过，第 2 关保持锁（有第 1 关必修习题时）。

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/features/learning-plan`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/learning-plan/pages/LearningPlanMapPreview.tsx src/features/learning-plan/pages/LearningPlanMapPreview.test.tsx src/features/learning-plan/model/learningPlanStore.ts
git commit -m "feat(learning-plan): map preview with daily quiz retry"
```

---

### Task 10: Demo 种子 + 全量验收命令

**Files:**
- Modify: `src/features/learning-plan/model/learningPlanStore.ts`（默认 seed 一条含课+随机习题+考的已发布计划）
- Modify: `src/app/App.tsx`（确认三页都不是占位）

- [ ] **Step 1: Seed default plan**

`createStore` 初始 `plans` 含 id=1「安全日练」：`progressMode=daily` `dailyContent=redraw` `quizScope=cohort` `mapSkinId=island`，关 1 课+随机 2 题，关 2 考试。

- [ ] **Step 2: Run full related tests**

Run:

```
npx vitest run src/features/learning-plan src/app/navigation.test.ts
npx tsc -b --pretty false
```

Expected: tests PASS；`tsc` 无 error。

- [ ] **Step 3: Manual check**（实现者执行）

1. `#/learning-plan/learning-plan-list` 能看到计划。
2. 新建：每日才出现每日内容；课任务无随机。
3. 预览：先完成课，习题未过不能进第 2 关；习题达标后考试可点；模拟下一天习题要重做、课仍完成。
4. 发布后改进度策略控件 disabled。
5. 换皮立刻改预览标题。

- [ ] **Step 4: Commit**

```bash
git add src/features/learning-plan src/app/App.tsx
git commit -m "feat(learning-plan): demo seed for fusion acceptance"
```

---

## Self-review vs spec

| Spec | Task |
|---|---|
| 指派模式 ≠ 进度策略 | 7 |
| 每日只清习题，课/考保留 | 2, 9 |
| 顺序锁 + 退回最早缺当日习题的关 | 2, 9 |
| 随机仅习题；再闯重抽；fixed/redraw 种子 | 1, 3, 8, 9 |
| cohort / personal | 1, 7 |
| 及格线 60% | 3, 7, 9 |
| 预置 3 皮，阶段不单换 | 7, 9 |
| 发布后锁总闸 | 4, 7 |
| 积分首次/按日 | 3（纯函数；预览可不展示数额） |
| 学员/奖励/通知沿用 | 7 只读说明 |
| 存量默认累计+岛屿 | seed 新应用无存量；新建默认 accumulate + island |
| 进度同步不同步习题 | 模型未并入习题；表单可省略开关或默认 true 仅对课 |

无 TBD。类型名全程 `progressMode` `dailyContent` `quizScope` `quizPassRate` `mapSkinId`。
