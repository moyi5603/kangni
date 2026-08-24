import { describe, expect, it } from 'vitest';
import {
  buildExamAttemptExportCsv,
  buildExamRanking,
  buildExamRankingExportCsv,
  computeExamDetailStats,
  filterExamAttempts,
  filterExamRankings,
  formatExamDuration,
  initialExamAttempts,
  type ExamAttemptRecord,
} from './examAttempt';

const sample: ExamAttemptRecord[] = [
  {
    id: 1,
    examId: 5,
    name: '张伟',
    mobile: '13800001111',
    department: '产品部',
    result: '不及格',
    score: 8,
    correctCount: 4,
    wrongCount: 6,
    points: 0,
    startedAt: '2026-08-10 09:00:00',
    endedAt: '2026-08-10 09:08:00',
  },
  {
    id: 2,
    examId: 5,
    name: '张伟',
    mobile: '13800001111',
    department: '产品部',
    result: '及格',
    score: 16,
    correctCount: 8,
    wrongCount: 2,
    points: 15,
    startedAt: '2026-08-12 14:00:00',
    endedAt: '2026-08-12 14:09:30',
  },
  {
    id: 3,
    examId: 5,
    name: '李娜',
    mobile: '13900002222',
    department: '研发部',
    result: '及格',
    score: 15,
    correctCount: 7,
    wrongCount: 3,
    points: 15,
    startedAt: '2026-08-11 10:00:00',
    endedAt: '2026-08-11 10:06:00',
  },
  {
    id: 4,
    examId: 1,
    name: '王强',
    mobile: '13700003333',
    department: '研发部',
    result: '及格',
    score: 80,
    correctCount: 16,
    wrongCount: 4,
    points: 20,
    startedAt: '2026-08-09 08:00:00',
    endedAt: '2026-08-09 09:00:00',
  },
];

describe('formatExamDuration', () => {
  it('formats accumulated seconds as 时分秒', () => {
    expect(formatExamDuration(0)).toBe('0时00分00秒');
    expect(formatExamDuration(8 * 60)).toBe('0时08分00秒');
    expect(formatExamDuration(3661)).toBe('1时01分01秒');
  });
});

describe('filterExamAttempts', () => {
  it('keeps multiple attempts for the same person and filters by fields', () => {
    const exam5 = filterExamAttempts(sample, { examId: 5 });
    expect(exam5).toHaveLength(3);
    expect(exam5.filter((item) => item.mobile === '13800001111')).toHaveLength(2);

    expect(filterExamAttempts(sample, { examId: 5, name: '张' }).map((item) => item.id)).toEqual([1, 2]);
    expect(filterExamAttempts(sample, { examId: 5, mobile: '139' }).map((item) => item.id)).toEqual([3]);
    expect(filterExamAttempts(sample, { examId: 5, department: '研发' }).map((item) => item.id)).toEqual([3]);
    expect(
      filterExamAttempts(sample, {
        examId: 5,
        startedFrom: '2026-08-11 00:00:00',
        startedTo: '2026-08-11 23:59:59',
      }).map((item) => item.id),
    ).toEqual([3]);
  });
});

describe('buildExamRanking', () => {
  it('ranks by best score and accumulates attempts and duration', () => {
    const ranks = buildExamRanking(filterExamAttempts(sample, { examId: 5 }));
    expect(ranks.map((item) => item.name)).toEqual(['张伟', '李娜']);
    expect(ranks[0]).toMatchObject({
      rank: 1,
      mobile: '13800001111',
      department: '产品部',
      score: 16,
      attemptCount: 2,
    });
    expect(ranks[0].durationText).toBe('0时17分30秒');
    expect(ranks[1]).toMatchObject({ rank: 2, score: 15, attemptCount: 1, durationText: '0时06分00秒' });
  });

  it('filters ranking by name, mobile and department', () => {
    const ranks = buildExamRanking(filterExamAttempts(sample, { examId: 5 }));
    expect(filterExamRankings(ranks, { name: '李' }).map((item) => item.name)).toEqual(['李娜']);
    expect(filterExamRankings(ranks, { mobile: '138' })).toHaveLength(1);
    expect(filterExamRankings(ranks, { department: '产品' })).toHaveLength(1);
  });
});

describe('exam attempt export', () => {
  it('builds csv with required headers', () => {
    const csv = buildExamAttemptExportCsv(filterExamAttempts(sample, { examId: 5 }));
    expect(csv).toContain('序号,姓名,手机号,部门,考试结果,获得分数,答对题数,答错题数,获得积分,答题开始时间,答题结束时间');
    expect(csv).toContain('张伟');
    expect(csv.split('\n').filter(Boolean)).toHaveLength(4);

    const rankCsv = buildExamRankingExportCsv(buildExamRanking(filterExamAttempts(sample, { examId: 5 })));
    expect(rankCsv).toContain('排名,姓名,手机号,部门,考试成绩,考试次数,累计考试用时');
    expect(rankCsv).toContain('0时17分30秒');
  });
});

describe('computeExamDetailStats', () => {
  it('summarizes examinees, attempts, pass rate and scores', () => {
    expect(computeExamDetailStats(filterExamAttempts(sample, { examId: 5 }))).toEqual({
      examineeCount: 2,
      attemptCount: 3,
      passedExamineeCount: 2,
      passRate: 100,
      averageScore: 13,
      highestScore: 16,
    });
    expect(computeExamDetailStats([])).toEqual({
      examineeCount: 0,
      attemptCount: 0,
      passedExamineeCount: 0,
      passRate: null,
      averageScore: null,
      highestScore: null,
    });
  });
});

describe('exam attempt seeds', () => {
  it('includes multiple attempts for 项目管理考试 and none for empty exams', () => {
    const exam5 = initialExamAttempts.filter((item) => item.examId === 5);
    expect(exam5.length).toBeGreaterThanOrEqual(4);
    const phones = exam5.map((item) => item.mobile);
    expect(new Set(phones).size).toBeLessThan(phones.length);
    expect(initialExamAttempts.filter((item) => item.examId === 3)).toHaveLength(0);
  });
});
