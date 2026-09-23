import { describe, expect, it } from 'vitest';
import { parseContestTime } from '../../../skills-contest/model/contest';
import { collectWrongAnswers, contestGateState, filterWrongBook, formatOpenExamAt, gradeGate, nextContestCountdown, rankScores, remainHms, summarizeGate, wrongBookStats, type ContestQuizQuestion } from './clientContest';

describe('clientContest', () => {
  it('passes a gate when correct count meets threshold', () => {
    const paper: ContestQuizQuestion[] = [
      { id: 'a', stem: '1', options: ['x', 'y'], answer: 'x' },
      { id: 'b', stem: '2', options: ['x', 'y'], answer: 'y' },
    ];
    expect(gradeGate(paper, { a: 'x', b: 'y' }, 2)).toBe(true);
    expect(gradeGate(paper, { a: 'x', b: 'x' }, 2)).toBe(false);
    expect(gradeGate(paper, { a: 'x', b: 'x' }, 1)).toBe(true);
    expect(summarizeGate(paper, { a: 'x', b: 'y' }, 2, 8)).toEqual({
      passed: true,
      correctCount: 2,
      total: 2,
      passCorrectCount: 2,
      accuracy: 100,
      score: 100,
      durationSeconds: 8,
    });
  });

  it('collects wrong answers for the notebook', () => {
    const paper: ContestQuizQuestion[] = [
      { id: 'a', stem: '安全', options: ['到位', '不管'], answer: '到位' },
      { id: 'b', stem: '停机', options: ['上报', '赶工'], answer: '上报' },
    ];
    expect(collectWrongAnswers(paper, { a: '到位', b: '赶工' })).toEqual([
      { id: 'b', stem: '停机', options: ['上报', '赶工'], answer: '上报', picked: '赶工' },
    ]);
  });

  it('locks later gates until the current one is passed', () => {
    expect(contestGateState(0, [], 3)).toBe('here');
    expect(contestGateState(1, [], 3)).toBe('locked');
    expect(contestGateState(2, [], 3)).toBe('locked');
    expect(contestGateState(0, [{ passed: true, attempts: 1 }], 3)).toBe('passed');
    expect(contestGateState(1, [{ passed: true, attempts: 1 }], 3)).toBe('here');
  });

  it('counts wrong-book totals remain and hard misses', () => {
    const items = [
      { missCount: 1, practiced: false },
      { missCount: 2, practiced: true },
      { missCount: 3, practiced: false },
    ];
    expect(wrongBookStats(items)).toEqual({ total: 3, practiced: 1, remain: 2 });
    expect(filterWrongBook(items, 'remain')).toHaveLength(2);
    expect(filterWrongBook(items, 'hard')).toHaveLength(2);
    expect(filterWrongBook(items, 'all')).toHaveLength(3);
  });

  it('formats exam open time and remaining clock', () => {
    expect(formatOpenExamAt('2026-09-06 09:00')).toBe('09月06日 09:00 开考');
    expect(remainHms(2 * 86400000 + 16 * 3600000 + 38 * 60000 + 20 * 1000)).toEqual({
      days: 2,
      hours: 16,
      minutes: 38,
      seconds: 20,
    });
  });

  it('counts down to the next stage start', () => {
    const contest = {
      stages: [
        { name: '初赛', startAt: '2026-09-01 09:00', endAt: '2026-09-30 18:00' },
        { name: '复赛', startAt: '2026-09-30 18:00', endAt: '2026-10-31 18:00' },
      ],
    };
    const now = parseContestTime('2026-09-14 15:00');
    expect(nextContestCountdown(contest, now)).toEqual({
      kicker: '距复赛开始',
      targetAt: '2026-09-30 18:00',
      targetMs: parseContestTime('2026-09-30 18:00'),
    });
  });

  it('splits 积分 and 学分 from passed gates', () => {
    expect(rankScores(4)).toEqual({ points: 200, credits: 80 });
    expect(rankScores(0)).toEqual({ points: 0, credits: 0 });
  });
});
