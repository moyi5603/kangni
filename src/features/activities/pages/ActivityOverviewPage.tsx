import { useMemo, useState } from 'react';
import {
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Progress, Row, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  activityStatusSegments,
  categorySegments,
  OverviewKpiCard,
  OverviewPie,
} from '../components/ActivityOverviewVisuals';
import { defaultOverviewDateRange, OverviewDateRange } from '../components/OverviewDateRange';
import { useActivities } from '../model/activityStore';
import {
  activityInDateRange,
  buildAttentionRows,
  buildInProgressActivityRows,
  computeActivityOverviewStats,
  type ActivityAttentionRow,
  type InProgressActivityRow,
} from '../model/activityOverviewStats';
import { useAllMoments } from '../model/momentStore';
import { useAllRelated } from '../model/related';

const activityCategoryColor: Record<string, string> = {
  文化: 'blue',
  体育: 'green',
  培训: 'cyan',
  公益: 'orange',
};

type ActivityOverviewPageProps = {
  onNavigate: (page: string, recordId?: string, tab?: string) => void;
};

export function ActivityOverviewPage({ onNavigate }: ActivityOverviewPageProps) {
  const activities = useActivities();
  const signups = useAllRelated('signups');
  const comments = useAllRelated('comments');
  const surveys = useAllRelated('surveys');
  const moments = useAllMoments();
  const [dateRange, setDateRange] = useState(defaultOverviewDateRange);

  const scopedActivities = useMemo(
    () => activities.filter((item) => activityInDateRange(item, dateRange[0], dateRange[1])),
    [activities, dateRange],
  );
  const scopedIds = useMemo(() => new Set(scopedActivities.map((item) => item.id)), [scopedActivities]);
  const scopedSignups = useMemo(() => signups.filter((item) => scopedIds.has(item.activityId)), [signups, scopedIds]);
  const scopedComments = useMemo(() => comments.filter((item) => scopedIds.has(item.activityId)), [comments, scopedIds]);
  const scopedSurveys = useMemo(() => surveys.filter((item) => scopedIds.has(item.activityId)), [surveys, scopedIds]);
  const scopedMoments = useMemo(() => moments.filter((item) => scopedIds.has(item.activityId)), [moments, scopedIds]);

  const stats = useMemo(
    () =>
      computeActivityOverviewStats({
        activities: scopedActivities,
        signups: scopedSignups,
        comments: scopedComments,
        moments: scopedMoments,
        surveys: scopedSurveys,
      }),
    [scopedActivities, scopedSignups, scopedComments, scopedMoments, scopedSurveys],
  );

  const attentionRows = useMemo(() => buildAttentionRows(scopedActivities, scopedSignups), [scopedActivities, scopedSignups]);
  const inProgressRows = useMemo(
    () => buildInProgressActivityRows(scopedActivities, scopedSignups, scopedComments, scopedMoments, scopedSurveys),
    [scopedActivities, scopedSignups, scopedComments, scopedMoments, scopedSurveys],
  );

  const attentionColumns: TableColumnsType<ActivityAttentionRow> = [
    { title: '活动名称', dataIndex: 'title', ellipsis: true },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (value: string) => <Tag color={activityCategoryColor[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: '待办类型',
      dataIndex: 'kind',
      width: 120,
      render: (value: ActivityAttentionRow['kind'], record) =>
        record.count != null ? `${value}（${record.count}）` : value,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() =>
            onNavigate(
              'activity-detail',
              String(record.activityId),
              record.kind === '报名待审核' ? 'signups' : undefined,
            )
          }
        >
          详情
        </Button>
      ),
    },
  ];

  const inProgressColumns: TableColumnsType<InProgressActivityRow> = [
    { title: '活动名称', dataIndex: 'title', ellipsis: true },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (value: string) => <Tag color={activityCategoryColor[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: '活动时间',
      key: 'time',
      width: 220,
      render: (_, record) => `${record.startAt} → ${record.endAt}`,
    },
    { title: '报名人数', dataIndex: 'signupCount', width: 100, align: 'right' },
    { title: '待审核报名', dataIndex: 'pendingSignupCount', width: 110, align: 'right' },
    {
      title: '报名额使用率',
      dataIndex: 'quotaUsage',
      width: 160,
      render: (value: number | null) =>
        value == null ? '—' : <Progress percent={value} size="small" status={value >= 90 ? 'exception' : 'normal'} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => onNavigate('activity-detail', String(record.activityId))}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['活动', '概览']}
        title="概览"
        subtitle="活动运营数据总览与待办关注"
        extra={<OverviewDateRange value={dateRange} onChange={setDateRange} />}
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid">
          <OverviewKpiCard
            title="待审核活动"
            value={stats.pendingAuditActivityCount}
            icon={<AuditOutlined />}
            tone="warning"
            onClick={() => onNavigate('activity-list')}
          />
          <OverviewKpiCard
            title="待审核报名"
            value={stats.pendingSignupCount}
            icon={<UserAddOutlined />}
            tone="danger"
            onClick={() => onNavigate('activity-list')}
          />
          <OverviewKpiCard
            title="进行中活动"
            value={stats.inProgressActivityCount}
            icon={<CalendarOutlined />}
            tone="primary"
            onClick={() => onNavigate('activity-list')}
          />
          <OverviewKpiCard
            title="总报名人数"
            value={stats.totalSignupCount}
            icon={<TeamOutlined />}
            tone="success"
            onClick={() => onNavigate('activity-list')}
          />
          <OverviewKpiCard
            title="已发布活动"
            value={stats.publishedCount}
            icon={<CheckCircleOutlined />}
            tone="success"
            onClick={() => onNavigate('activity-list')}
          />
        </div>

        <Row gutter={[16, 16]} className="overview-chart-row">
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="活动状态分布">
              <OverviewPie segments={activityStatusSegments(stats.activityStatusCounts)} />
            </Card>
          </Col>
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="活动分类分布">
              <OverviewPie segments={categorySegments(stats.categoryCounts)} />
            </Card>
          </Col>
        </Row>
      </div>

      <Card title="待办关注">
        {attentionRows.length ? (
          <Table
            rowKey="key"
            size="middle"
            pagination={false}
            dataSource={attentionRows}
            columns={attentionColumns}
            scroll={{ x: 640 }}
          />
        ) : (
          <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card title="进行中的活动">
        {inProgressRows.length ? (
          <Table
            rowKey="activityId"
            size="middle"
            dataSource={inProgressRows}
            columns={inProgressColumns}
            scroll={{ x: 960 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description="当前没有进行中的活动" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
