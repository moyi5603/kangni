import { Card, Col, Row, Statistic } from 'antd';
import { useCourseComments } from '../model/courseCommentStore';
import { computeCourseDetailStats } from '../model/courseDetailStats';
import type { CourseRecord } from '../model/training';
import { useLearningRecords } from '../model/trainingStore';

export function CourseStatsRow({ course }: { course: CourseRecord }) {
  const records = useLearningRecords().filter((item) => item.course === course.name);
  const comments = useCourseComments(course.id);
  const stats = computeCourseDetailStats({ catalog: course.catalog, records, comments });
  const items = [
    { title: '课件数', value: stats.coursewareCount },
    { title: '学时', value: stats.creditHours },
    { title: '学习人数', value: stats.learnerCount },
    { title: '已完成', value: stats.completedCount },
    { title: '学习中', value: stats.learningCount },
    { title: '评论数', value: stats.commentCount },
  ];

  return (
    <Card className="activity-stats-card">
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.title} xs={12} sm={8} md={4}>
            <Statistic title={item.title} value={item.value} />
          </Col>
        ))}
      </Row>
    </Card>
  );
}
