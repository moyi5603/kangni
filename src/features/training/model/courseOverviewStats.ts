import type { CourseCommentRecord } from './courseCommentStore';
import {
  courseTypes,
  type CourseRecord,
  type CourseType,
  type CoursewareRecord,
  type LearningRecord,
} from './training';

function rate(part: number, total: number): number | null {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

export function computeCourseOverviewStats({
  courses,
  courseware = [],
  records,
  comments,
  quizConfigs = {},
}: {
  courses: CourseRecord[];
  courseware?: CoursewareRecord[];
  records: LearningRecord[];
  comments: CourseCommentRecord[];
  quizConfigs?: Record<string, { enabled?: boolean }>;
}) {
  const typeCounts = Object.fromEntries(courseTypes.map((type) => [type, 0])) as Record<CourseType, number>;
  courses.forEach((item) => {
    typeCounts[item.type] += 1;
  });
  const progressSum = records.reduce((sum, item) => sum + item.progress, 0);
  const catalogItems = courses.flatMap((item) => item.catalog);
  const withCatalogCount = courses.filter((item) => item.catalog.length > 0).length;
  const coursewarePublishedCount = courseware.filter((item) => item.publishStatus === '已发布').length;
  const coursewareDraftCount = courseware.filter((item) => item.publishStatus === '草稿').length;

  return {
    courseCount: courses.length,
    publishedCount: courses.filter((item) => item.status === '已发布').length,
    draftCount: courses.filter((item) => item.status === '草稿').length,
    unpublishedCount: courses.filter((item) => item.status === '已下架').length,
    publishRate: rate(courses.filter((item) => item.status === '已发布').length, courses.length),
    typeCounts,
    coursewareCount: catalogItems.length,
    coursewarePublishedCount,
    coursewareDraftCount,
    learnerCount: records.length,
    completedCount: records.filter((item) => item.status === '已完成').length,
    learningCount: records.filter((item) => item.status === '学习中').length,
    notStartedCount: records.filter((item) => item.status === '未开始').length,
    completionRate: rate(records.filter((item) => item.status === '已完成').length, records.length),
    avgProgress: records.length ? Math.round(progressSum / records.length) : null,
    commentCount: comments.length,
    pendingCommentCount: comments.filter((item) => item.status === '待审核').length,
    approvedCommentCount: comments.filter((item) => item.status === '已通过').length,
    rejectedCommentCount: comments.filter((item) => item.status === '已驳回').length,
    totalCreditHours: catalogItems.reduce((sum, item) => sum + item.creditHours, 0),
    requiredCoursewareCount: catalogItems.filter((item) => item.required).length,
    optionalCoursewareCount: catalogItems.filter((item) => !item.required).length,
    emptyCatalogCount: courses.length - withCatalogCount,
    catalogCoverageRate: rate(withCatalogCount, courses.length),
    uncategorizedCount: courses.filter((item) => item.categoryId == null).length,
    commentEnabledCount: courses.filter((item) => item.commentConfig.commentEnabled).length,
    commentAuditEnabledCount: courses.filter((item) => item.commentConfig.commentAuditEnabled).length,
    quizEnabledCount: courses.filter((item) => quizConfigs[String(item.id)]?.enabled).length,
    coursewarePublishRate: rate(coursewarePublishedCount, courseware.length),
  };
}

export function recentUpdatedCourses(courses: CourseRecord[], limit = 5) {
  return [...courses]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.id - left.id)
    .slice(0, limit);
}

export function learningInProgress(records: LearningRecord[], limit = 5) {
  return records
    .filter((item) => item.status === '学习中')
    .slice()
    .sort((left, right) => right.lastLearnedAt.localeCompare(left.lastLearnedAt) || right.id - left.id)
    .slice(0, limit);
}

export function pendingCourseComments(comments: CourseCommentRecord[], limit = 5) {
  return comments
    .filter((item) => item.status === '待审核')
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id)
    .slice(0, limit);
}
