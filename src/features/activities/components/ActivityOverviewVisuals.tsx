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

function SegmentLegend({ segments }: { segments: Segment[] }) {
  return (
    <Flex gap={12} wrap className="overview-segment-legend">
      {segments.map((item) => (
        <Typography.Text key={item.label} type="secondary" className="overview-segment-legend-item">
          <span className="overview-segment-dot" style={{ background: item.color }} />
          <span>{item.label}</span>
          <span className="overview-segment-value">{item.value}</span>
        </Typography.Text>
      ))}
    </Flex>
  );
}

function pieSlicePath(start: number, end: number) {
  const cx = 50;
  const cy = 50;
  const r = 50;
  if (end - start >= 0.999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  const rad = (t: number) => t * 2 * Math.PI - Math.PI / 2;
  const x0 = cx + r * Math.cos(rad(start));
  const y0 = cy + r * Math.sin(rad(start));
  const x1 = cx + r * Math.cos(rad(end));
  const y1 = cy + r * Math.sin(rad(end));
  const large = end - start > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

export function OverviewPie({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <Typography.Text type="secondary">暂无数据</Typography.Text>;
  let cursor = 0;
  const slices = segments
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = cursor / total;
      cursor += item.value;
      const end = cursor / total;
      return { ...item, d: pieSlicePath(start, end) };
    });
  return (
    <div className="overview-pie">
      <svg className="overview-pie-chart" viewBox="0 0 100 100" role="img" aria-label={segments.map((item) => `${item.label} ${item.value}`).join('，')}>
        {slices.map((item) => (
          <path key={item.label} d={item.d} fill={item.color}>
            <title>{`${item.label} ${item.value}`}</title>
          </path>
        ))}
      </svg>
      <SegmentLegend segments={segments} />
    </div>
  );
}

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
      <SegmentLegend segments={segments} />
    </div>
  );
}

const activityStatusColors: Record<ActivityStatus, string> = {
  未开始: '#8c8c8c',
  进行中: '#1677ff',
  已结束: '#52c41a',
  已终止: '#d9d9d9',
};

export function activityStatusSegments(counts: Record<ActivityStatus, number>): Segment[] {
  return (Object.keys(activityStatusColors) as ActivityStatus[]).map((status) => ({
    label: status,
    value: counts[status],
    color: activityStatusColors[status],
  }));
}

export function categorySegments(counts: { label: string; value: number }[]): Segment[] {
  const named: Record<string, string> = {
    文化: '#1677ff',
    体育: '#52c41a',
    培训: '#722ed1',
    公益: '#fa8c16',
  };
  const fallback = ['#13c2c2', '#eb2f96', '#8c8c8c', '#faad14'];
  return counts.map((item, index) => ({
    label: item.label,
    value: item.value,
    color: named[item.label] ?? fallback[index % fallback.length],
  }));
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
