import { Card, Col, Row, Statistic } from 'antd';
import { computeExamDetailStats, filterExamAttempts, initialExamAttempts } from '../model/examAttempt';

export function ExamStatsRow({ examId }: { examId: number }) {
  const stats = computeExamDetailStats(filterExamAttempts(initialExamAttempts, { examId }));
  const items = [
    { title: '参考人数', value: stats.examineeCount },
    { title: '考试人次', value: stats.attemptCount },
    { title: '及格人数', value: stats.passedExamineeCount },
    {
      title: '及格率',
      value: stats.passRate === null ? '—' : stats.passRate,
      suffix: stats.passRate === null ? undefined : '%',
    },
    { title: '平均分', value: stats.averageScore === null ? '—' : stats.averageScore },
    { title: '最高分', value: stats.highestScore === null ? '—' : stats.highestScore },
  ];

  return (
    <Card className="activity-stats-card">
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.title} xs={12} sm={8} md={4}>
            <Statistic title={item.title} value={item.value} suffix={item.suffix} />
          </Col>
        ))}
      </Row>
    </Card>
  );
}
