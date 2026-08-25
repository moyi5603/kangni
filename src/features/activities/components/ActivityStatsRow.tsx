import { Card, Col, Row, Statistic } from 'antd';
import type { Activity } from '../model/activity';
import { activityRatingAverage, activityRatingCount, useActivityRatings } from '../model/activityRating';
import { computeActivityStats } from '../model/activityStats';
import { useMoments } from '../model/momentStore';
import { useRelated } from '../model/related';

export function ActivityStatsRow({ activity, embedded = false }: { activity: Activity; embedded?: boolean }) {
  useActivityRatings();
  const signups = useRelated('signups', activity.id);
  const comments = useRelated('comments', activity.id);
  const moments = useMoments(activity.id);
  const stats = computeActivityStats({
    signups,
    comments,
    moments,
    surveys: [],
    signupSettings: activity.signupSettings,
  });
  const signupTotalLimit = activity.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0);
  const ratingAverage = activityRatingAverage(activity.id);
  const items: { title: string; value: string | number; suffix?: string }[] = [
    {
      title: '报名人数',
      value: stats.signupCount,
      suffix: signupTotalLimit > 0 ? `/ ${signupTotalLimit}` : undefined,
    },
    { title: '待审核报名', value: stats.pendingSignupCount },
    {
      title: '报名额使用率',
      value: stats.quotaUsage === null ? '—' : stats.quotaUsage,
      suffix: stats.quotaUsage === null ? undefined : '%',
    },
    { title: '评论数', value: stats.commentCount },
    { title: '精彩瞬间数', value: stats.momentCount },
    { title: '平均分', value: ratingAverage === null ? '—' : ratingAverage.toFixed(1) },
    { title: '评分人数', value: activityRatingCount(activity.id) },
  ];
  const content = (
    <Row gutter={16}>
      {items.map((item) => (
        <Col key={item.title} xs={12} sm={8} md={6} lg={3}>
          <Statistic title={item.title} value={item.value} suffix={item.suffix} />
        </Col>
      ))}
    </Row>
  );
  if (embedded) return content;
  return (
    <Card className="activity-stats-card">
      {content}
    </Card>
  );
}
