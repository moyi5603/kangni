import { useSyncExternalStore } from 'react';
import {
  isPlanFieldLocked,
  type LearnerProgress,
  type LearningPlan,
  type LockedPlanField,
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

const LOCKED_FIELDS: LockedPlanField[] = ['assignMode', 'progressMode', 'dailyContent', 'quizScope', 'taskSync'];

const DEMO_SEED_PLAN: LearningPlan = {
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
  status: 'published',
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  stages: [
    {
      id: 's1',
      name: '基础',
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
    {
      id: 's2',
      name: '进阶',
      tasks: [{ id: 'e1', type: 'exam', required: true, title: '安全考', refId: 'exam-1' }],
    },
  ],
};

function createStore(seed: LearningPlan[] = []) {
  let snap: Snapshot = { plans: seed, progress: {} };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const store = {
    reset(plans: LearningPlan[] = []) {
      snap = { plans, progress: {} };
      emit();
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
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
      const plan = store.getPlan(id);
      if (!plan) return;
      store.upsertPlan({ ...plan, status: 'published' });
    },
    updatePlan(id: number, patch: Partial<LearningPlan>) {
      const plan = store.getPlan(id);
      if (!plan) return;
      if (plan.status === 'published') {
        for (const key of LOCKED_FIELDS) {
          if (key in patch && patch[key] !== plan[key] && isPlanFieldLocked(plan.status, key)) {
            throw new Error('发布后不可改');
          }
        }
      }
      store.upsertPlan({
        ...plan,
        ...patch,
        id: plan.id,
        status: plan.status === 'published' ? 'published' : (patch.status ?? plan.status),
      });
    },
    getProgress(planId: number, userId: string): LearnerProgress {
      return snap.progress[progressKey(planId, userId)] ?? emptyProgress();
    },
    setProgress(planId: number, userId: string, next: LearnerProgress) {
      snap = { ...snap, progress: { ...snap.progress, [progressKey(planId, userId)]: next } };
      emit();
    },
    markCourseDone(planId: number, userId: string, taskId: string) {
      const p = store.getProgress(planId, userId);
      store.setProgress(planId, userId, { ...p, courseDone: { ...p.courseDone, [taskId]: true } });
    },
    markExamPassed(planId: number, userId: string, taskId: string) {
      const p = store.getProgress(planId, userId);
      store.setProgress(planId, userId, { ...p, examPassed: { ...p.examPassed, [taskId]: true } });
    },
    markLectureDone(planId: number, userId: string, taskId: string) {
      const p = store.getProgress(planId, userId);
      store.setProgress(planId, userId, { ...p, lectureDone: { ...p.lectureDone, [taskId]: true } });
    },
    markQuizPassed(planId: number, userId: string, taskId: string, day: string) {
      const p = store.getProgress(planId, userId);
      const days = p.quizPassedDays[taskId] ?? [];
      if (days.includes(day)) return;
      store.setProgress(planId, userId, {
        ...p,
        quizPassedDays: { ...p.quizPassedDays, [taskId]: [...days, day] },
      });
    },
  };

  return store;
}

const store = createStore([DEMO_SEED_PLAN]);

export function getLearningPlanStore() {
  return store;
}

export function useLearningPlans() {
  const getPlans = () => store.getSnapshot().plans;
  return useSyncExternalStore(store.subscribe, getPlans, getPlans);
}

export function useLearningPlanSnapshot() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export type { MapSkinId };
