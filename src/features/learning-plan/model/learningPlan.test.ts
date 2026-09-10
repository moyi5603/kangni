import { describe, expect, it } from 'vitest';
import {
  currentStageIndex,
  isTaskPassed,
  pickRandomIds,
  quizSeedKey,
  shanghaiDayKey,
  quizPassedByRate,
  nextAttemptNo,
  resolveQuizQuestionIds,
  canGrantQuizPoints,
  type LearnerProgress,
  type PlanTask,
} from './learningPlan';

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
