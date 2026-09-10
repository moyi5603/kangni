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
