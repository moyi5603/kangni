import { useMemo, useState } from 'react';
import {
  AppstoreOutlined,
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { OverviewKpiCard, OverviewPie, activityStatusSegments, categorySegments } from '../../activities/components/ActivityOverviewVisuals';
import { defaultOverviewDateRange, OverviewDateRange } from '../../activities/components/OverviewDateRange';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  buildInterestGroupAttentionRows,
  buildInterestGroupInProgressRows,
  computeInterestGroupOverviewStats,
  interestGroupActivityInDateRange,
  interestGroupInDateRange,
  type InterestGroupAttentionRow,
  type InterestGroupInProgressActivityRow,
} from '../model/interestGroupOverview';
import {
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroupComments,
  useInterestGroupMoments,
  useInterestGroups,
} from '../model/interestGroupStore';

type InterestGroupOverviewPageProps = {
  onNavigate: (page: string, recordId?: string, tab?: string) => void;
};

export function InterestGroupOverviewPage({ onNavigate }: InterestGroupOverviewPageProps) {
  const groups = useInterestGroups();
  const activities = useInterestGroupActivities();
  const comments = useInterestGroupComments();
  const moments = useInterestGroupMoments();
  const categories = useInterestGroupCategories();
  const [dateRange, setDateRange] = useState(defaultOverviewDateRange);

  const scopedGroups = useMemo(
    () => groups.filter((item) => interestGroupInDateRange(item, dateRange[0], dateRange[1])),
    [groups, dateRange],
  );
  const scopedActivities = useMemo(
    () => activities.filter((item) => interestGroupActivityInDateRange(item, dateRange[0], dateRange[1])),
    [activities, dateRange],
  );
  const scopedActivityIds = useMemo(() => new Set(scopedActivities.map((item) => item.id)), [scopedActivities]);
  const scopedGroupIds = useMemo(() => new Set(scopedGroups.map((item) => item.id)), [scopedGroups]);
  const scopedComments = useMemo(
    () => comments.filter((item) => scopedActivityIds.has(item.activityId)),
    [comments, scopedActivityIds],
  );
  const scopedMoments = useMemo(
    () =>
      moments.filter(
        (item) => scopedGroupIds.has(item.groupId) || (item.activityId != null && scopedActivityIds.has(item.activityId)),
      ),
    [moments, scopedGroupIds, scopedActivityIds],
  );

  const stats = useMemo(
    () =>
      computeInterestGroupOverviewStats({
        groups: scopedGroups,
        activities: scopedActivities,
        comments: scopedComments,
        moments: scopedMoments,
        categories,
      }),
    [scopedGroups, scopedActivities, scopedComments, scopedMoments, categories],
  );
  const attentionRows = useMemo(() => buildInterestGroupAttentionRows(scopedGroups), [scopedGroups]);
  const inProgressRows = useMemo(
    () => buildInterestGroupInProgressRows(scopedActivities, groups),
    [scopedActivities, groups],
  );

  const attentionColumns: TableColumnsType<InterestGroupAttentionRow> = [
    { title: '对象', dataIndex: 'title', ellipsis: true },
    {
      title: '待办类型',
      dataIndex: 'kind',
      width: 140,
      render: (value: InterestGroupAttentionRow['kind']) => <Tag color="warning">{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => onNavigate(record.targetPage, record.recordId)}>
          详情
        </Button>
      ),
    },
  ];

  const inProgressColumns: TableColumnsType<InterestGroupInProgressActivityRow> = [
    { title: '活动名称', dataIndex: 'title', ellipsis: true },
    { title: '兴趣圈', dataIndex: 'groupName', width: 160, ellipsis: true },
    {
      title: '活动时间',
      key: 'time',
      width: 220,
      render: (_, record) => `${record.startAt} → ${record.endAt}`,
    },
    { title: '报名人数', dataIndex: 'signedCount', width: 100, align: 'right' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => onNavigate('interest-group-activity-detail', String(record.activityId))}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['兴趣圈', '概览']}
        title="概览"
        subtitle="兴趣圈运营数据总览与待办关注"
        extra={<OverviewDateRange value={dateRange} onChange={setDateRange} />}
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid">
          <OverviewKpiCard
            title="待审核兴趣圈"
            value={stats.pendingGroupCount}
            icon={<AuditOutlined />}
            tone="warning"
            onClick={() => onNavigate('interest-group-list')}
          />
          <OverviewKpiCard
            title="兴趣圈总数"
            value={stats.groupCount}
            icon={<AppstoreOutlined />}
            tone="primary"
            onClick={() => onNavigate('interest-group-list')}
          />
          <OverviewKpiCard
            title="进行中活动"
            value={stats.ongoingActivityCount}
            icon={<CalendarOutlined />}
            tone="primary"
            onClick={() => onNavigate('interest-group-activities')}
          />
          <OverviewKpiCard
            title="已发布活动"
            value={stats.publishedActivityCount}
            icon={<CheckCircleOutlined />}
            tone="success"
            onClick={() => onNavigate('interest-group-activities')}
          />
          <OverviewKpiCard
            title="成员总数"
            value={stats.memberTotal}
            icon={<TeamOutlined />}
            tone="success"
            onClick={() => onNavigate('interest-group-list')}
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
            scroll={{ x: 800 }}
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
