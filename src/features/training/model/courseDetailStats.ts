import type { CourseCommentRecord } from './courseCommentStore';
import type { CourseCatalogItem, LearningRecord } from './training';

export function computeCourseDetailStats({
  catalog,
  records,
  comments,
}: {
  catalog: CourseCatalogItem[];
  records: LearningRecord[];
  comments: CourseCommentRecord[];
}) {
  return {
    coursewareCount: catalog.length,
    creditHours: catalog.reduce((sum, item) => sum + item.creditHours, 0),
    learnerCount: records.length,
    completedCount: records.filter((item) => item.status === '已完成').length,
    learningCount: records.filter((item) => item.status === '学习中').length,
    commentCount: comments.length,
  };
}
