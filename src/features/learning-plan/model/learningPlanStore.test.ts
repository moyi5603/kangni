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
