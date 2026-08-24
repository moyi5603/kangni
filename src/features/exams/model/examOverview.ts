import { findCategoryNode } from '../../../shared/category-tree/categoryTree';
import type { CertificateRecord } from './certificate';
import { computeExamDetailStats, durationSecondsOf, type ExamAttemptRecord } from './examAttempt';
import type { ExamCategoryNode, ExamPublishStatus, ExamRecord, ExamStatus } from './exam';
import type { PaperRecord } from './paper';
import { questionDifficulties, questionTypes, type QuestionRecord } from './question';

export type ExamOverviewStats = {
  examCount: number;
  publishedCount: number;
  unpublishedCount: number;
  examStatusCounts: Record<ExamStatus, number>;
  questionCount: number;
  practiceQuestionCount: number;
  enabledQuestionCount: number;
  disabledQuestionCount: number;
  paperCount: number;
  certificateCount: number;
  examsWithoutPaper: number;
  examineeCount: number;
  attemptCount: number;
  passedExamineeCount: number;
  passedAttemptCount: number;
  failedAttemptCount: number;
  passRate: number | null;
  attemptPassRate: number | null;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  publishRate: number | null;
  questionEnableRate: number | null;
  certificateCoverageRate: number | null;
  paperCoverageRate: number | null;
  attemptsPerExaminee: number | null;
  averageDurationMinutes: number | null;
  examsWithCertificate: number;
};

export type ScoreBucketRow = {
  label: string;
  count: number;
  percent: number;
};

export type NamedCountRow = {
  key: string;
  name: string;
  count: number;
};

export type DepartmentRankRow = {
  department: string;
  examineeCount: number;
  attemptCount: number;
  passRate: number | null;
  averageScore: number | null;
};

export type CategoryExamRow = {
  categoryId: number | null;
  name: string;
  examCount: number;
  publishedCount: number;
};

export type PaperUsageRow = {
  paperId: number;
  name: string;
  examCount: number;
};

export type EndingSoonRow = {
  id: number;
  name: string;
  examStatus: ExamStatus;
  endAt: string;
  daysLeft: number;
};

export type OngoingExamRow = {
  id: number;
  name: string;
  examStatus: ExamStatus;
  endAt: string;
  attemptCount: number;
  examineeCount: number;
  passRate: number | null;
};

export type UnpublishedExamRow = {
  id: number;
  name: string;
  publishStatus: ExamPublishStatus;
  startAt: string;
  endAt: string;
};

export type RecentAttemptRow = {
  id: number;
  examId: number;
  examName: string;
  name: string;
  department: string;
  result: ExamAttemptRecord['result'];
  score: number;
  startedAt: string;
};

const emptyStatusCounts = (): Record<ExamStatus, number> => ({
  未开始: 0,
  进行中: 0,
  已结束: 0,
});

export function computeExamOverviewStats(input: {
  exams: ExamRecord[];
  questions: QuestionRecord[];
  practiceQuestions?: QuestionRecord[];
  papers: PaperRecord[];
  certificates: CertificateRecord[];
  attempts: ExamAttemptRecord[];
}): ExamOverviewStats {
  const examStatusCounts = emptyStatusCounts();
  let publishedCount = 0;
  input.exams.forEach((exam) => {
    examStatusCounts[exam.examStatus] += 1;
    if (exam.publishStatus === '已发布') publishedCount += 1;
  });
  const attemptStats = computeExamDetailStats(input.attempts);
  const passedAttemptCount = input.attempts.filter((item) => item.result === '及格').length;
  const examsWithCertificate = input.exams.filter((item) => item.certificateId != null).length;
  const examsWithPaper = input.exams.filter((item) => item.paperId != null).length;
  const enabledQuestionCount = input.questions.filter((item) => item.status === '启用').length;
  const durationSeconds = input.attempts.reduce(
    (sum, item) => sum + durationSecondsOf(item.startedAt, item.endedAt),
    0,
  );

  return {
    examCount: input.exams.length,
    publishedCount,
    unpublishedCount: input.exams.length - publishedCount,
    examStatusCounts,
    questionCount: input.questions.length,
    practiceQuestionCount: input.practiceQuestions?.length ?? 0,
    enabledQuestionCount,
    disabledQuestionCount: input.questions.length - enabledQuestionCount,
    paperCount: input.papers.length,
    certificateCount: input.certificates.length,
    examsWithoutPaper: input.exams.length - examsWithPaper,
    examineeCount: attemptStats.examineeCount,
    attemptCount: attemptStats.attemptCount,
    passedExamineeCount: attemptStats.passedExamineeCount,
    passedAttemptCount,
    failedAttemptCount: input.attempts.length - passedAttemptCount,
    passRate: attemptStats.passRate,
    attemptPassRate: percentOf(passedAttemptCount, input.attempts.length),
    averageScore: attemptStats.averageScore,
    highestScore: attemptStats.highestScore,
    lowestScore: input.attempts.length ? Math.min(...input.attempts.map((item) => item.score)) : null,
    publishRate: percentOf(publishedCount, input.exams.length),
    questionEnableRate: percentOf(enabledQuestionCount, input.questions.length),
    certificateCoverageRate: percentOf(examsWithCertificate, input.exams.length),
    paperCoverageRate: percentOf(examsWithPaper, input.exams.length),
    attemptsPerExaminee: attemptStats.examineeCount
      ? Math.round((attemptStats.attemptCount / attemptStats.examineeCount) * 10) / 10
      : null,
    averageDurationMinutes: input.attempts.length
      ? Math.round((durationSeconds / input.attempts.length / 60) * 10) / 10
      : null,
    examsWithCertificate,
  };
}

function percentOf(part: number, total: number): number | null {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

function parseClock(value: string) {
  return new Date(value.replace(/-/g, '/')).getTime();
}

const SCORE_BUCKETS = [
  { label: '0-59', min: 0, max: 59 },
  { label: '60-79', min: 60, max: 79 },
  { label: '80-89', min: 80, max: 89 },
  { label: '90-100', min: 90, max: Number.POSITIVE_INFINITY },
] as const;

export function buildScoreDistribution(attempts: ExamAttemptRecord[]): ScoreBucketRow[] {
  const total = attempts.length;
  return SCORE_BUCKETS.map((bucket) => {
    const count = attempts.filter((item) => item.score >= bucket.min && item.score <= bucket.max).length;
    return {
      label: bucket.label,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

function countBy<T extends string>(items: T[], keys: readonly T[]): NamedCountRow[] {
  return keys.map((name) => ({
    key: name,
    name,
    count: items.filter((item) => item === name).length,
  }));
}

export function buildQuestionTypeCounts(questions: QuestionRecord[]): NamedCountRow[] {
  return countBy(
    questions.map((item) => item.type),
    questionTypes,
  );
}

export function buildQuestionDifficultyCounts(questions: QuestionRecord[]): NamedCountRow[] {
  return countBy(
    questions.map((item) => item.difficulty),
    questionDifficulties,
  );
}

export function buildDepartmentRanks(attempts: ExamAttemptRecord[]): DepartmentRankRow[] {
  const groups = new Map<string, ExamAttemptRecord[]>();
  for (const item of attempts) {
    const current = groups.get(item.department) ?? [];
    current.push(item);
    groups.set(item.department, current);
  }

  return [...groups.entries()]
    .map(([department, rows]) => {
      const stats = computeExamDetailStats(rows);
      return {
        department,
        examineeCount: stats.examineeCount,
        attemptCount: stats.attemptCount,
        passRate: stats.passRate,
        averageScore: stats.averageScore,
      };
    })
    .sort((left, right) => right.attemptCount - left.attemptCount || left.department.localeCompare(right.department));
}

export function buildCategoryExamRows(exams: ExamRecord[], tree: ExamCategoryNode[]): CategoryExamRow[] {
  const groups = new Map<number | null, ExamRecord[]>();
  for (const exam of exams) {
    const key = exam.categoryId;
    const current = groups.get(key) ?? [];
    current.push(exam);
    groups.set(key, current);
  }

  return [...groups.entries()]
    .map(([categoryId, rows]) => ({
      categoryId,
      name: categoryId == null ? '未分类' : (findCategoryNode(tree, categoryId)?.name ?? `分类 ${categoryId}`),
      examCount: rows.length,
      publishedCount: rows.filter((item) => item.publishStatus === '已发布').length,
    }))
    .sort((left, right) => right.examCount - left.examCount || left.name.localeCompare(right.name));
}

export function buildPaperUsageRows(exams: ExamRecord[], papers: PaperRecord[]): PaperUsageRow[] {
  const names = new Map(papers.map((item) => [item.id, item.name]));
  const counts = new Map<number, number>();
  for (const exam of exams) {
    if (exam.paperId == null) continue;
    counts.set(exam.paperId, (counts.get(exam.paperId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([paperId, examCount]) => ({
      paperId,
      name: names.get(paperId) ?? `试卷 ${paperId}`,
      examCount,
    }))
    .sort((left, right) => right.examCount - left.examCount || left.name.localeCompare(right.name));
}

export function buildEndingSoonRows(exams: ExamRecord[], now: string, withinDays = 14): EndingSoonRow[] {
  const nowMs = parseClock(now);
  const horizon = nowMs + withinDays * 24 * 60 * 60 * 1000;
  if (Number.isNaN(nowMs)) return [];

  return exams
    .filter((item) => {
      if (item.examStatus === '已结束') return false;
      const endMs = parseClock(item.endAt);
      return !Number.isNaN(endMs) && endMs > nowMs && endMs <= horizon;
    })
    .map((item) => {
      const endMs = parseClock(item.endAt);
      return {
        id: item.id,
        name: item.name,
        examStatus: item.examStatus,
        endAt: item.endAt,
        daysLeft: Math.max(0, Math.floor((endMs - nowMs) / (24 * 60 * 60 * 1000))),
      };
    })
    .sort((left, right) => left.endAt.localeCompare(right.endAt));
}

export function buildOngoingExamRows(exams: ExamRecord[], attempts: ExamAttemptRecord[]): OngoingExamRow[] {
  return exams
    .filter((item) => item.examStatus === '进行中')
    .map((exam) => {
      const examAttempts = attempts.filter((item) => item.examId === exam.id);
      const stats = computeExamDetailStats(examAttempts);
      return {
        id: exam.id,
        name: exam.name,
        examStatus: exam.examStatus,
        endAt: exam.endAt,
        attemptCount: stats.attemptCount,
        examineeCount: stats.examineeCount,
        passRate: stats.passRate,
      };
    })
    .sort((left, right) => left.endAt.localeCompare(right.endAt));
}

export function buildUnpublishedExamRows(exams: ExamRecord[]): UnpublishedExamRow[] {
  return exams
    .filter((item) => item.publishStatus === '未发布')
    .map((exam) => ({
      id: exam.id,
      name: exam.name,
      publishStatus: exam.publishStatus,
      startAt: exam.startAt,
      endAt: exam.endAt,
    }))
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

export function buildRecentAttemptRows(
  attempts: ExamAttemptRecord[],
  exams: ExamRecord[],
  limit = 8,
): RecentAttemptRow[] {
  const names = new Map(exams.map((item) => [item.id, item.name]));
  return [...attempts]
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      examId: item.examId,
      examName: names.get(item.examId) ?? '—',
      name: item.name,
      department: item.department,
      result: item.result,
      score: item.score,
      startedAt: item.startedAt,
    }));
}
