import { describe, expect, it } from 'vitest';
import { computeCourseDetailStats } from './courseDetailStats';

describe('computeCourseDetailStats', () => {
  it('counts catalog, learners, and comments for one course', () => {
    expect(
      computeCourseDetailStats({
        catalog: [
          { coursewareId: 1, creditHours: 1, required: true },
          { coursewareId: 2, creditHours: 2, required: false },
        ],
        records: [
          { id: 1, employee: '张三', department: '一部', course: '沟通', progress: 100, status: '已完成', lastLearnedAt: '' },
          { id: 2, employee: '李四', department: '二部', course: '沟通', progress: 40, status: '学习中', lastLearnedAt: '' },
          { id: 3, employee: '王五', department: '三部', course: '沟通', progress: 0, status: '未开始', lastLearnedAt: '' },
        ],
        comments: [
          { id: 1, courseId: 1, author: 'A', text: 'x', createdAt: '', status: '已通过' },
          { id: 2, courseId: 1, author: 'B', text: 'y', createdAt: '', status: '待审核' },
        ],
      }),
    ).toEqual({
      coursewareCount: 2,
      creditHours: 3,
      learnerCount: 3,
      completedCount: 1,
      learningCount: 1,
      commentCount: 2,
    });
  });

  it('returns zeros when the course has no related data', () => {
    expect(computeCourseDetailStats({ catalog: [], records: [], comments: [] })).toEqual({
      coursewareCount: 0,
      creditHours: 0,
      learnerCount: 0,
      completedCount: 0,
      learningCount: 0,
      commentCount: 0,
    });
  });
});
