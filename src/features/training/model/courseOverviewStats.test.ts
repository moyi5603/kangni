import { describe, expect, it } from 'vitest';
import { computeCourseOverviewStats } from './courseOverviewStats';
import type { CourseRecord, CoursewareRecord } from './training';

function course(partial: Partial<CourseRecord> & Pick<CourseRecord, 'id' | 'status'>): CourseRecord {
  return {
    name: `课程${partial.id}`,
    cover: '',
    type: '视频',
    categoryId: 1,
    tags: '',
    audience: '',
    learningMode: '不限制',
    catalog: [],
    introHtml: '',
    commentConfig: {
      commentEnabled: true,
      commentAuditEnabled: false,
      likeEnabled: true,
      favoriteEnabled: true,
    },
    creator: '测',
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

describe('computeCourseOverviewStats', () => {
  it('summarizes courses, catalog items, learners and pending comments', () => {
    const courseware: CoursewareRecord[] = [
      {
        id: 1,
        name: 'a',
        cover: '',
        type: '视频',
        categoryId: 1,
        fileName: 'a.mp4',
        fileUrl: '',
        intro: '',
        estimatedDurationSeconds: 60,
        publishStatus: '已发布',
        creator: '测',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 2,
        name: 'b',
        cover: '',
        type: 'PDF',
        categoryId: 1,
        fileName: 'b.pdf',
        fileUrl: '',
        intro: '',
        estimatedDurationSeconds: 0,
        publishStatus: '草稿',
        creator: '测',
        createdAt: '',
        updatedAt: '',
      },
    ];
    expect(
      computeCourseOverviewStats({
        courses: [
          course({ id: 1, status: '已发布', type: '视频', catalog: [{ coursewareId: 1, creditHours: 2, required: true }] }),
          course({
            id: 2,
            status: '草稿',
            type: 'PDF',
            learningMode: '按序学习',
            catalog: [
              { coursewareId: 2, creditHours: 1, required: false },
              { coursewareId: 3, creditHours: 1, required: false },
            ],
            commentConfig: {
              commentEnabled: false,
              commentAuditEnabled: false,
              likeEnabled: false,
              favoriteEnabled: false,
            },
          }),
          course({ id: 3, status: '已下架', type: '音频', categoryId: null }),
        ],
        quizConfigs: { 1: { enabled: true }, 2: { enabled: false } },
        courseware,
        records: [
          { id: 1, employee: '张三', department: '一部', course: 'A', progress: 100, status: '已完成', lastLearnedAt: '' },
          { id: 2, employee: '李四', department: '二部', course: 'B', progress: 40, status: '学习中', lastLearnedAt: '' },
          { id: 3, employee: '王五', department: '三部', course: 'C', progress: 0, status: '未开始', lastLearnedAt: '' },
        ],
        comments: [
          { id: 1, courseId: 1, author: 'A', text: 'x', createdAt: '', status: '已通过' },
          { id: 2, courseId: 1, author: 'B', text: 'y', createdAt: '', status: '待审核' },
          { id: 3, courseId: 2, author: 'C', text: 'z', createdAt: '', status: '已驳回' },
        ],
      }),
    ).toEqual({
      courseCount: 3,
      publishedCount: 1,
      draftCount: 1,
      unpublishedCount: 1,
      publishRate: 33,
      typeCounts: { 视频: 1, 音频: 1, PDF: 1 },
      coursewareCount: 3,
      coursewarePublishedCount: 1,
      coursewareDraftCount: 1,
      learnerCount: 3,
      completedCount: 1,
      learningCount: 1,
      notStartedCount: 1,
      completionRate: 33,
      avgProgress: 47,
      commentCount: 3,
      pendingCommentCount: 1,
      approvedCommentCount: 1,
      rejectedCommentCount: 1,
      totalCreditHours: 4,
      requiredCoursewareCount: 1,
      optionalCoursewareCount: 2,
      emptyCatalogCount: 1,
      catalogCoverageRate: 67,
      uncategorizedCount: 1,
      commentEnabledCount: 2,
      commentAuditEnabledCount: 0,
      quizEnabledCount: 1,
      coursewarePublishRate: 50,
    });
  });
});
