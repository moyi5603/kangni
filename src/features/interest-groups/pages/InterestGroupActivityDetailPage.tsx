import { useEffect, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Image,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  canDeleteInterestGroupActivity,
  canTerminateInterestGroupActivity,
  displayInterestGroupActivityStatus,
  formatDeadline,
  formatInterestGroupActivityTime,
  formatInterestGroupPublishedAt,
  interestGroupActivityTypeLabels,
  seriesSignupModeLabels,
  weekdayLabel,
  type InterestGroupActivity,
} from '../model/interestGroupActivity';
import type { InterestGroupSignup } from '../model/interestGroupSignup';
import { InterestGroupCommentListPage } from './InterestGroupCommentListPage';
import { InterestGroupMomentListPage } from './InterestGroupMomentListPage';
import { getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import {
  deleteInterestGroupActivity,
  terminateInterestGroupActivity,
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroupComments,
  useInterestGroupMoments,
  useInterestGroupSignups,
  useInterestGroups,
} from '../model/interestGroupStore';

const detailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'signups', label: '报名情况' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
] as const;

function dash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function hasHtmlContent(html: string): boolean {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

type DetailTab = (typeof detailTabs)[number]['key'];

function isDetailTab(value: string | undefined): value is DetailTab {
  return !!value && detailTabs.some((tab) => tab.key === value);
}

function sessionLabel(activity: InterestGroupActivity, sessionId?: string) {
  if (!sessionId || !activity.sessions?.length) return '—';
  const index = activity.sessions.findIndex((item) => item.id === sessionId);
  const session = activity.sessions[index];
  if (!session) return '—';
  return `第 ${index + 1} 场 ${session.startAt}`;
}

type InterestGroupActivityDetailPageProps = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onTabChange: (tab: DetailTab) => void;
};

export function InterestGroupActivityDetailPage({
  recordId,
  tab,
  onBack,
  onEdit,
  onTabChange,
}: InterestGroupActivityDetailPageProps) {
  const { message } = App.useApp();
  const activities = useInterestGroupActivities();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const comments = useInterestGroupComments();
  const moments = useInterestGroupMoments();
  const signups = useInterestGroupSignups();
  const activity = activities.find((item) => item.id === Number(recordId));
  const activeTab: DetailTab = isDetailTab(tab) ? tab : 'detail';
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);

  const changeTab = (key: string) => {
    if (!isDetailTab(key)) return;
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    onTabChange(key);
  };

  if (!activity) {
    return (
      <div className="page-stack">
        <Empty description="活动不存在或已删除">
          <Button type="primary" onClick={onBack}>
            返回列表
          </Button>
        </Empty>
      </div>
    );
  }

  const group = activity.groupId != null ? groups.find((item) => item.id === activity.groupId) : undefined;
  const time = formatInterestGroupActivityTime(activity);
  const activityComments = comments.filter((item) => item.activityId === activity.id);
  const activityMoments = moments.filter((item) => item.activityId === activity.id);
  const activitySignups = signups.filter((item) => item.activityId === activity.id);
  const statusLabel = displayInterestGroupActivityStatus(activity);
  const deletable = canDeleteInterestGroupActivity(activity);
  const terminable = canTerminateInterestGroupActivity(activity);
  const terminate = () => {
    const result = terminateInterestGroupActivity(activity.id);
    if (!result.ok) {
      message.warning('当前状态不可终止');
      return;
    }
    message.success('活动已终止');
  };

  const remove = () => {
    const result = deleteInterestGroupActivity(activity.id);
    if (!result.ok) {
      message.warning(result.reason === 'has-signups' ? '已有人报名，无法删除' : '活动不存在');
      return;
    }
    message.success('活动已删除');
    onBack();
  };

  const signupColumns: TableColumnsType<InterestGroupSignup> = [
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '部门', dataIndex: 'department', width: 140 },
    ...(activity.sessions?.length
      ? [{ title: '场次', key: 'session', render: (_: unknown, record: InterestGroupSignup) => sessionLabel(activity, record.sessionId) }]
      : []),
    { title: '报名时间', dataIndex: 'signedAt', width: 180 },
  ];

  return (
    <div className="page-stack order-detail-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> },
          { title: activity.title },
        ]}
      />
      <Card className="activity-detail-header-card">
        <Flex justify="space-between" align="flex-start" wrap gap={16}>
          <Flex align="stretch" gap={16} className="activity-detail-header-main">
            <div className="activity-detail-cover-wrap">
              {activity.coverUrl ? (
                <Image src={activity.coverUrl} alt="活动封面" className="activity-detail-cover" />
              ) : (
                <div className="activity-detail-cover-placeholder">暂无封面</div>
              )}
            </div>
            <div className="activity-detail-header-copy">
              <Space wrap>
                <Tag>{getInterestGroupCategoryLabel(activity.categoryKey, categories)}</Tag>
                {activity.type === 'series' && activity.seriesSignupMode ? (
                  <Tag>{seriesSignupModeLabels[activity.seriesSignupMode]}</Tag>
                ) : null}
                <Tag color={activity.auditStatus === '已通过' ? 'success' : activity.auditStatus === '已驳回' ? 'error' : activity.auditStatus === '待审核' ? 'warning' : 'default'}>
                  {activity.auditStatus}
                </Tag>
                <Tag color={activity.publishStatus === '已发布' ? 'success' : 'default'}>{activity.publishStatus}</Tag>
                <Tag color={statusLabel === '已终止' ? 'error' : statusLabel === '进行中' || statusLabel === '报名中' ? 'processing' : 'default'}>
                  {statusLabel}
                </Tag>
              </Space>
              <Typography.Title level={3} style={{ marginTop: 8 }}>
                {activity.title}
              </Typography.Title>
              <Typography.Text type="secondary">
                {time.date} {time.time}
              </Typography.Text>
            </div>
          </Flex>
          <Space>
            <Button type="primary" onClick={() => onEdit(activity.id)}>
              编辑
            </Button>
            {terminable ? (
              <Popconfirm title="确认终止该活动？终止后不可再编辑。" onConfirm={terminate}>
                <Button danger>终止</Button>
              </Popconfirm>
            ) : (
              <Tooltip title="仅未开始的活动可终止">
                <Button danger disabled>
                  终止
                </Button>
              </Tooltip>
            )}
            {deletable ? (
              <Popconfirm title="确认删除该活动？删除后不可恢复。" onConfirm={remove}>
                <Button danger>删除</Button>
              </Popconfirm>
            ) : (
              <Tooltip title="已有人报名，无法删除">
                <Button danger disabled>
                  删除
                </Button>
              </Tooltip>
            )}
          </Space>
        </Flex>
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={12} sm={6}>
            <Statistic title="已报名" value={activity.signedCount} suffix={`/ ${activity.capacity}`} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="点赞" value={activity.likeCount} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="评论" value={activityComments.length} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="精彩瞬间" value={activityMoments.length} />
          </Col>
        </Row>
      </Card>
      <Tabs
        destroyOnHidden
        activeKey={activeTab}
        onChange={changeTab}
        items={[
          {
            key: 'detail',
            label: '详情',
            children: (
              <div className="page-stack">
                <Card title="活动信息">
                  <Descriptions
                    column={{ xs: 1, sm: 2, lg: 3 }}
                    items={[
                      {
                        label: '封面图片',
                        span: 3,
                        children: activity.coverUrl ? (
                          <Image className="activity-cover-preview" src={activity.coverUrl} width={240} alt="活动封面" />
                        ) : (
                          '—'
                        ),
                      },
                      { label: '活动标题', children: activity.title },
                      { label: '类型', children: interestGroupActivityTypeLabels[activity.type] },
                      { label: '分类', children: dash(getInterestGroupCategoryLabel(activity.categoryKey, categories)) },
                      { label: '所属小组', children: group?.name ?? '未归属小组' },
                      { label: '报名截止', children: formatDeadline(activity) },
                      { label: '活动时间', children: `${time.date} ${time.time}` },
                      { label: '活动地点', children: dash(activity.location) },
                      { label: '报名总人数', children: activity.capacity > 0 ? activity.capacity : '—' },
                      { label: '小组负责人', children: dash(activity.hostName) },
                      { label: '审核状态', children: activity.auditStatus },
                      { label: '发布状态', children: activity.publishStatus },
                      { label: '创建时间', children: activity.createdAt },
                      { label: '发布时间', children: formatInterestGroupPublishedAt(activity.publishedAt) },
                      ...(activity.type === 'recurring'
                        ? [
                            {
                              label: '重复规则',
                              children: (activity.repeatWeekdays ?? []).map(weekdayLabel).join('、') || '—',
                            },
                          ]
                        : []),
                      ...(activity.type === 'series' && activity.seriesSignupMode
                        ? [{ label: '系列报名', children: seriesSignupModeLabels[activity.seriesSignupMode] }]
                        : []),
                    ]}
                  />
                </Card>
                <Card title="活动详情">
                  {hasHtmlContent(activity.detailHtml) ? (
                    <div
                      className="rich-text-preview activity-detail-rich"
                      dangerouslySetInnerHTML={{ __html: activity.detailHtml }}
                    />
                  ) : (
                    <Empty description="暂无详情" />
                  )}
                </Card>
                {activity.sessions?.length ? (
                  <Card title="场次安排">
                    <Table
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={activity.sessions}
                      columns={[
                        { title: '场次', render: (_, __, index) => `第 ${index + 1} 场` },
                        { title: '开始', dataIndex: 'startAt' },
                        { title: '结束', dataIndex: 'endAt' },
                        { title: '报名', render: (_, record) => `${record.signedCount}/${record.capacity}` },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          render: (value: InterestGroupActivity['status']) =>
                            displayInterestGroupActivityStatus({ ...activity, status: value, signedCount: 0 }),
                        },
                      ]}
                    />
                  </Card>
                ) : null}
              </div>
            ),
          },
          {
            key: 'signups',
            label: '报名情况',
            children: visited.has('signups') ? (
              <Card>
                <Table
                  rowKey="id"
                  columns={signupColumns}
                  dataSource={activitySignups}
                  pagination={false}
                  locale={{ emptyText: '暂无报名' }}
                />
              </Card>
            ) : null,
          },
          {
            key: 'comments',
            label: '评论',
            children: visited.has('comments') ? <InterestGroupCommentListPage activityId={activity.id} /> : null,
          },
          {
            key: 'moments',
            label: '精彩瞬间',
            children: visited.has('moments') ? <InterestGroupMomentListPage activityId={activity.id} /> : null,
          },
        ]}
      />
    </div>
  );
}
