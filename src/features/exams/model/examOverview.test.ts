import { describe, expect, it } from 'vitest';
import { initialExamAttempts } from './examAttempt';
import { initialCertificates } from './certificate';
import { initialExamCategoryTree, initialExams } from './exam';
import {
  buildCategoryExamRows,
  buildDepartmentRanks,
  buildEndingSoonRows,
  buildOngoingExamRows,
  buildPaperUsageRows,
  buildQuestionDifficultyCounts,
  buildQuestionTypeCounts,
  buildRecentAttemptRows,
  buildScoreDistribution,
  buildUnpublishedExamRows,
  computeExamOverviewStats,
} from './examOverview';
import { initialPapers } from './paper';
import { initialPracticeQuestions, initialQuestions } from './question';

describe('computeExamOverviewStats', () => {
  it('summarizes exam, catalog and attempt totals from seeds', () => {
    const stats = computeExamOverviewStats({
      exams: initialExams,
      questions: initialQuestions,
      practiceQuestions: initialPracticeQuestions,
      papers: initialPapers,
      certificates: initialCertificates,
      attempts: initialExamAttempts,
    });

    expect(stats.examCount).toBe(initialExams.length);
    expect(stats.publishedCount).toBe(initialExams.filter((item) => item.publishStatus === '已发布').length);
    expect(stats.unpublishedCount).toBe(initialExams.filter((item) => item.publishStatus === '未发布').length);
    expect(stats.examStatusCounts.进行中).toBeGreaterThan(0);
    expect(stats.questionCount).toBe(initialQuestions.length);
    expect(stats.practiceQuestionCount).toBe(initialPracticeQuestions.length);
    expect(stats.paperCount).toBe(initialPapers.length);
    expect(stats.certificateCount).toBe(initialCertificates.length);
    expect(stats.attemptCount).toBe(initialExamAttempts.length);
    expect(stats.examineeCount).toBeGreaterThan(0);
    expect(stats.passRate).not.toBeNull();
    expect(stats.highestScore).toBe(Math.max(...initialExamAttempts.map((item) => item.score)));
    expect(stats.passedAttemptCount).toBe(initialExamAttempts.filter((item) => item.result === '及格').length);
    expect(stats.failedAttemptCount).toBe(initialExamAttempts.filter((item) => item.result === '不及格').length);
    expect(stats.enabledQuestionCount).toBe(initialQuestions.filter((item) => item.status === '启用').length);
    expect(stats.disabledQuestionCount).toBe(initialQuestions.filter((item) => item.status === '禁用').length);
    expect(stats.examsWithoutPaper).toBe(initialExams.filter((item) => item.paperId == null).length);
    expect(stats.lowestScore).toBe(Math.min(...initialExamAttempts.map((item) => item.score)));
    expect(stats.publishRate).toBe(Math.round((stats.publishedCount / stats.examCount) * 100));
    expect(stats.questionEnableRate).toBe(Math.round((stats.enabledQuestionCount / stats.questionCount) * 100));
    expect(stats.certificateCoverageRate).toBe(
      Math.round((initialExams.filter((item) => item.certificateId != null).length / initialExams.length) * 100),
    );
    expect(stats.paperCoverageRate).toBe(
      Math.round((initialExams.filter((item) => item.paperId != null).length / initialExams.length) * 100),
    );
    expect(stats.attemptPassRate).toBe(Math.round((stats.passedAttemptCount / stats.attemptCount) * 100));
    expect(stats.attemptsPerExaminee).toBe(Math.round((stats.attemptCount / stats.examineeCount) * 10) / 10);
    expect(stats.averageDurationMinutes).toBeGreaterThan(0);
    expect(stats.examsWithCertificate).toBe(initialExams.filter((item) => item.certificateId != null).length);
  });
});

describe('exam overview dashboards', () => {
  it('buckets scores and ranks departments from attempts', () => {
    const buckets = buildScoreDistribution(initialExamAttempts);
    expect(buckets.reduce((sum, item) => sum + item.count, 0)).toBe(initialExamAttempts.length);
    expect(buckets.some((item) => item.label === '0-59' && item.count > 0)).toBe(true);
    expect(buckets.some((item) => item.label === '80-89' && item.count >= 2)).toBe(true);

    const ranks = buildDepartmentRanks(initialExamAttempts);
    expect(ranks[0]?.attemptCount).toBeGreaterThanOrEqual(ranks[1]?.attemptCount ?? 0);
    expect(ranks.some((item) => item.department === '产品部')).toBe(true);
    expect(ranks.some((item) => item.department === '研发部')).toBe(true);
  });

  it('counts question types/difficulties and paper/category usage', () => {
    const types = buildQuestionTypeCounts(initialQuestions);
    expect(types.map((item) => item.name)).toEqual(['单选', '多选', '判断', '填空', '问答题']);
    expect(types.reduce((sum, item) => sum + item.count, 0)).toBe(initialQuestions.length);

    const difficulties = buildQuestionDifficultyCounts(initialQuestions);
    expect(difficulties.map((item) => item.name)).toEqual(['初级', '中级', '高级', '资深']);
    expect(difficulties.reduce((sum, item) => sum + item.count, 0)).toBe(initialQuestions.length);

    const papers = buildPaperUsageRows(initialExams, initialPapers);
    expect(papers.some((item) => item.examCount >= 2)).toBe(true);
    expect(papers.every((item) => item.examCount > 0)).toBe(true);

    const categories = buildCategoryExamRows(initialExams, initialExamCategoryTree);
    expect(categories.reduce((sum, item) => sum + item.examCount, 0)).toBe(initialExams.length);
    expect(categories.every((item) => item.name.length > 0)).toBe(true);
  });

  it('lists exams ending within 14 days of the given now', () => {
    const rows = buildEndingSoonRows(initialExams, '2026-08-23 14:00:00', 14);
    expect(rows.map((item) => item.name)).toEqual([
      '需求分析与PRD撰写能力考核',
      '项目管理考试',
      '20260808',
      '绩效薪酬体系设计考核',
    ]);
    expect(rows[0]?.daysLeft).toBe(4);
    expect(rows.every((item) => item.examStatus !== '已结束')).toBe(true);
  });
});

describe('exam overview tables', () => {
  it('lists ongoing published exams and unpublished drafts', () => {
    const ongoing = buildOngoingExamRows(initialExams, initialExamAttempts);
    expect(ongoing.some((item) => item.name === '项目管理考试')).toBe(true);
    expect(ongoing.every((item) => item.examStatus === '进行中')).toBe(true);

    const drafts = buildUnpublishedExamRows(initialExams);
    expect(drafts.map((item) => item.name)).toContain('入职测评');
    expect(drafts.every((item) => item.publishStatus === '未发布')).toBe(true);
  });

  it('lists recent attempts with exam names', () => {
    const rows = buildRecentAttemptRows(initialExamAttempts, initialExams, 5);
    expect(rows.length).toBeLessThanOrEqual(5);
    expect(rows[0]?.startedAt >= rows[rows.length - 1]?.startedAt).toBe(true);
    expect(rows.some((item) => item.examName === '项目管理考试' && item.name === '张伟')).toBe(true);
  });
});
