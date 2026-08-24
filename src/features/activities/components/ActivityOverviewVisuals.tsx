import type { ReactNode } from 'react';
import { Card, Flex, Progress, Statistic, Typography } from 'antd';
import type { ActivityStatus } from '../model/activity';

type KpiTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

type OverviewKpiCardProps = {
  title: string;
  value: number | string;
  suffix?: string;
  icon: ReactNode;
  tone?: KpiTone;
  onClick?: () => void;
};

export function OverviewKpiCard({ title, value, suffix, icon, tone = 'default', onClick }: OverviewKpiCardProps) {
  return (
    <Card
      className={`overview-kpi-card overview-kpi-${tone}`}
      hoverable={Boolean(onClick)}
      onClick={onClick}
      variant="borderless"
      styles={{ body: { padding: 20 } }}
    >
      <Flex align="center" gap={16} className="overview-kpi-inner">
        <div className="overview-kpi-icon" aria-hidden>{icon}</div>
        <Statistic title={title} value={value} suffix={suffix} className="overview-kpi-stat" />
      </Flex>
    </Card>
  );
}

type Segment = { label: string; value: number; color: string };

export function OverviewSegmentBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <Typography.Text type="secondary">暂无数据</Typography.Text>;
  return (
    <div>
      <div className="overview-segment-bar" role="img" aria-label={segments.map((item) => `${item.label} ${item.value}`).join('，')}>
        {segments
          .filter((item) => item.value > 0)
          .map((item) => (
            <div
              key={item.label}
              className="overview-segment"
              style={{ flexGrow: item.value, background: item.color }}
            />
          ))}
      </div>
      <Flex gap={12} wrap className="overview-segment-legend">
        {segments.map((item) => (
          <Typography.Text key={item.label} type="secondary" className="overview-segment-legend-item">
            <span className="overview-segment-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
            <span className="overview-segment-value">{item.value}</span>
          </Typography.Text>
        ))}
      </Flex>
    </div>
  );
}

const activityStatusColors: Record<ActivityStatus, string> = {
  未开始: '#8c8c8c',
  进行中: '#1677ff',
  已结束: '#52c41a',
};

const signupStatusColors = {
  已通过: '#52c41a',
  待审核: '#faad14',
  已驳回: '#ff4d4f',
  已取消: '#d9d9d9',
};

export function activityStatusSegments(counts: Record<ActivityStatus, number>): Segment[] {
  return (Object.keys(activityStatusColors) as ActivityStatus[]).map((status) => ({
    label: status,
    value: counts[status],
    color: activityStatusColors[status],
  }));
}

export function signupStatusSegments(input: {
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
}): Segment[] {
  return [
    { label: '已通过', value: input.approved, color: signupStatusColors.已通过 },
    { label: '待审核', value: input.pending, color: signupStatusColors.待审核 },
    { label: '已驳回', value: input.rejected, color: signupStatusColors.已驳回 },
    { label: '已取消', value: input.cancelled, color: signupStatusColors.已取消 },
  ];
}

export function OverviewGauge({
  title,
  percent,
  mode = 'dashboard',
  emptyText = '不限',
}: {
  title: string;
  percent: number | null;
  mode?: 'dashboard' | 'line';
  emptyText?: string;
}) {
  return (
    <div className="overview-gauge-item">
      <Typography.Text type="secondary" className="overview-gauge-label">{title}</Typography.Text>
      {percent == null ? (
        <Typography.Text className="overview-gauge-empty">{emptyText}</Typography.Text>
      ) : mode === 'line' ? (
        <div className="overview-gauge-line">
          <Typography.Text className="overview-gauge-value">{percent}%</Typography.Text>
          <Progress
            percent={percent}
            showInfo={false}
            strokeWidth={10}
            status={percent >= 90 ? 'exception' : 'normal'}
          />
        </div>
      ) : (
        <Progress type="dashboard" percent={percent} size={100} gapDegree={70} strokeWidth={8} />
      )}
    </div>
  );
}
