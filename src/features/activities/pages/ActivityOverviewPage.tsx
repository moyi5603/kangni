import { useMemo } from 'react';
import {
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Progress, Row, Statistic, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  activityStatusSegments,
  OverviewGauge,
  OverviewKpiCard,
  OverviewSegmentBar,
  signupStatusSegments,
} from '../components/ActivityOverviewVisuals';
import { useActivities } from '../model/activityStore';
import {
  buildAttentionRows,
  buildSignupOpenRows,
  computeActivityOverviewStats,
  type ActivityAttentionRow,
  type SignupOpenActivityRow,
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

  const stats = useMemo(
    () =>
      computeActivityOverviewStats({
        activities,
        signups,
        comments,
        moments,
        surveys,
      }),
    [activities, signups, comments, moments, surveys],
  );

  const attentionRows = useMemo(() => buildAttentionRows(activities, signups), [activities, signups]);
  const signupOpenRows = useMemo(
    () => buildSignupOpenRows(activities, signups, comments, moments, surveys),
    [activities, signups, comments, moments, surveys],
  );

  const secondaryStatItems = [
    { title: '活动总数', value: stats.totalCount },
    { title: '未发布', value: stats.unpublishedCount },
    { title: '待提交审批', value: stats.pendingSubmitActivityCount },
    { title: '评论数', value: stats.commentCount },
    { title: '精彩瞬间', value: stats.momentCount },
  ];

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

  const signupOpenColumns: TableColumnsType<SignupOpenActivityRow> = [
    { title: '活动名称', dataIndex: 'title', ellipsis: true },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (value: string) => <Tag color={activityCategoryColor[value] ?? 'default'}>{value}</Tag>,
    },
    { title: '报名截止', dataIndex: 'signupEndAt', width: 170 },
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
      <ListPageHeading paths={['活动', '概览']} title="概览" subtitle="活动运营数据总览与待办关注" />

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
            title="报名中活动"
            value={stats.signupOpenCount}
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
          <Col xs={24} lg={8} className="overview-chart-col">
            <Card className="overview-chart-card" title="活动状态分布">
              <OverviewSegmentBar segments={activityStatusSegments(stats.activityStatusCounts)} />
            </Card>
          </Col>
          <Col xs={24} lg={8} className="overview-chart-col">
            <Card className="overview-chart-card" title="报名状态构成">
              <OverviewSegmentBar
                segments={signupStatusSegments({
                  approved: stats.approvedSignupCount,
                  pending: stats.pendingSignupCount,
                  rejected: stats.rejectedSignupCount,
                  cancelled: stats.cancelledSignupCount,
                })}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8} className="overview-chart-col">
            <Card className="overview-chart-card" title="发布与名额">
              <div className="overview-gauge-panel">
                <OverviewGauge title="发布率" percent={stats.publishRate} />
                <OverviewGauge title="全局名额使用率" percent={stats.globalQuotaUsage} mode="line" />
              </div>
            </Card>
          </Col>
        </Row>

        <Card className="overview-secondary-card" title="其他指标" variant="borderless">
          <div className="overview-secondary-stats">
            {secondaryStatItems.map((item) => (
              <div key={item.title} className="overview-secondary-item">
                <Statistic title={item.title} value={item.value} className="overview-secondary-stat" />
              </div>
            ))}
          </div>
        </Card>
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

      <Card title="报名中的活动">
        {signupOpenRows.length ? (
          <Table
            rowKey="activityId"
            size="middle"
            dataSource={signupOpenRows}
            columns={signupOpenColumns}
            scroll={{ x: 960 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description="当前没有处于报名期的已发布活动" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
