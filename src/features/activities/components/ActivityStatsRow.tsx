import { Card, Col, Row, Statistic } from 'antd';
import type { Activity } from '../model/activity';
import { computeActivityStats } from '../model/activityStats';
import { useMoments } from '../model/momentStore';
import { useRelated } from '../model/related';

export function ActivityStatsRow({ activity }: { activity: Activity }) {
  const signups = useRelated('signups', activity.id);
  const comments = useRelated('comments', activity.id);
  const surveys = useRelated('surveys', activity.id);
  const moments = useMoments(activity.id);
  const stats = computeActivityStats({ signups, comments, moments, surveys, signupSettings: activity.signupSettings });
  const items = [
    { title: '报名人数', value: stats.signupCount },
    { title: '待审核报名', value: stats.pendingSignupCount },
    { title: '报名额使用率', value: stats.quotaUsage === null ? '—' : `${stats.quotaUsage}%` },
    { title: '评论数', value: stats.commentCount },
    { title: '精彩瞬间数', value: stats.momentCount },
    { title: '问卷回收数', value: stats.surveyResponseCount },
  ];
  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col key={item.title} xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic title={item.title} value={item.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
