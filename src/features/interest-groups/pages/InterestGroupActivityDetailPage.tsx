import { useEffect, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Flex,
  Image,
  Popconfirm,
  Space,
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
  formatInterestGroupActivityTime,
  formatInterestGroupPublishedAt,
  formatInterestGroupSignupTime,
  getInterestGroupLifecycleStatus,
  interestGroupActivityTypeLabels,
  lifecycleStatusColor,
  type InterestGroupActivity,
} from '../model/interestGroupActivity';
import { formatCustomCrowdVisibility } from '../../activities/model/activity';
import { formatSignupAuditSummary } from '../../activities/model/rules';
import { formatActivityPointGrant } from '../../activities/model/activityPointRules';
import { formatSessionLabel, needsSessionPick, sessionSignupEndAt, signupQuotaLabel } from '../../activities/model/activitySchedule';
import { signupFieldInputTypeLabels, type SignupField } from '../../activities/model/signupFields';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
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
  { key: 'signups', label: '报名' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
] as const;

function dash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function hasHtmlContent(html: string): boolean {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

function formatSignupFieldConfig(field: SignupField): string {
  if (field.inputType === 'radio' || field.inputType === 'checkbox') {
    const options = (field.options ?? []).map((item) => item.trim()).filter(Boolean);
    return options.length ? options.join('、') : '—';
  }
  if (field.inputType === 'group') {
    const groups = field.groups ?? [];
    return groups.length
      ? groups.map((item) => `${item.name.trim() || '未命名'}（限 ${item.limit} 人）`).join('；')
      : '—';
  }
  if (field.inputType === 'companion') {
    const collect = (field.companionFields ?? []).join('、') || '—';
    return `最多 ${field.companionMax ?? 0} 人；填写 ${collect}`;
  }
  if (field.digitOnly) return `仅数字${field.maxLength != null ? `；最多 ${field.maxLength} 字` : ''}`;
  if (field.maxLength != null) return `最多 ${field.maxLength} 字`;
  return '—';
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
  onCopy?: (id: number) => void;
  onTabChange: (tab: DetailTab) => void;
};

export function InterestGroupActivityDetailPage({
  recordId,
  tab,
  onBack,
  onEdit,
  onCopy,
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
  const lifecycleStatus = getInterestGroupLifecycleStatus(activity);
  const activityComments = comments.filter((item) => item.activityId === activity.id);
  const activityMoments = moments.filter((item) => item.activityId === activity.id);
  const activitySignups = signups.filter((item) => item.activityId === activity.id);
  const deletable = canDeleteInterestGroupActivity(activity);
  const terminable = canTerminateInterestGroupActivity(activity);
  const visibilityText =
    activity.visibility === '按部门'
      ? `按部门：${activity.departments.join('、') || '—'}`
      : activity.visibility === '自定义人群'
        ? formatCustomCrowdVisibility(activity.customPeople)
        : activity.visibility === '导入人群'
          ? `导入人群：${activity.importFileName || '—'}${activity.importedPeople.length ? `（${activity.importedPeople.length} 人）` : ''}`
          : '全员';
  const signupFields = activity.signupFields ?? [];
  const hasSeniorityLimit = activity.minSeniorityYears != null;
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
                {activity.auditStatus !== '已通过' && activity.auditStatus !== '无需审核' ? (
                  <Tag color={activity.auditStatus === '已驳回' ? 'error' : activity.auditStatus === '待审核' ? 'warning' : 'default'}>
                    {activity.auditStatus}
                  </Tag>
                ) : null}
                <Tag color={lifecycleStatusColor[lifecycleStatus]}>{lifecycleStatus}</Tag>
              </Space>
              <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
                {activity.title}
              </Typography.Title>
            </div>
          </Flex>
          <Space wrap className="activity-detail-header-actions">
            <Button type="primary" onClick={() => onEdit(activity.id)}>
              编辑
            </Button>
            {onCopy ? (
              <Button onClick={() => onCopy(activity.id)}>复制创建</Button>
            ) : null}
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
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          活动时间：{formatInterestGroupActivityTime(activity)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          报名时间：{formatInterestGroupSignupTime(activity)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          活动地点：{dash(activity.location)}
        </Typography.Text>
        <div className="activity-detail-header-metrics" style={{ marginTop: 16 }}>
          <Space size={32} wrap>
            <Typography.Text>报名人数 {activity.signedCount}{activity.capacity ? ` / ${activity.capacity}` : ''}</Typography.Text>
            <Typography.Text>评论数 {activityComments.length}</Typography.Text>
            <Typography.Text>精彩瞬间数 {activityMoments.length}</Typography.Text>
            <Typography.Text>点赞 {activity.likeCount}</Typography.Text>
          </Space>
        </div>
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
                    className="activity-detail-descriptions"
                    column={{ xs: 1, sm: 2, lg: 3 }}
                    items={[
                      { label: '活动标题', children: activity.title },
                      { label: '分类', children: dash(getInterestGroupCategoryLabel(activity.categoryKey, categories)) },
                      { label: '举办方式', children: interestGroupActivityTypeLabels[activity.type] },
                      { label: '所属小组', children: group?.name ?? '未归属小组' },
                      { label: '报名时间', children: formatInterestGroupSignupTime(activity) },
                      { label: '活动时间', children: formatInterestGroupActivityTime(activity) },
                      { label: '活动地点', children: dash(activity.location) },
                      { label: signupQuotaLabel(activity.type), children: activity.capacity > 0 ? activity.capacity : '—' },
                      { label: '创建时间', children: activity.createdAt },
                      { label: '发布时间', children: formatInterestGroupPublishedAt(activity.publishedAt) },
                    ]}
                  />
                </Card>
                {needsSessionPick(activity.type) && activity.sessions.length ? (
                  <Card title="场次">
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="id"
                      dataSource={activity.sessions}
                      columns={[
                        {
                          title: '场次',
                          ellipsis: true,
                          render: (_: unknown, session, index) => (
                            <TableEllipsisText text={formatSessionLabel(session, index)} />
                          ),
                        },
                        { title: '开始', dataIndex: 'startAt', width: 180 },
                        { title: '结束', dataIndex: 'endAt', width: 180 },
                        {
                          title: '报名截止',
                          width: 180,
                          render: (_: unknown, session) => sessionSignupEndAt(session.startAt, activity.signupHoursBefore ?? 0),
                        },
                        { title: '人数上限', width: 100, render: () => (activity.capacity > 0 ? activity.capacity : '—') },
                      ]}
                    />
                  </Card>
                ) : null}
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
                <Card styles={{ body: { paddingBlock: 0 } }} className="advanced-settings-card">
                  <Collapse
                    ghost
                    className="advanced-settings-collapse"
                    defaultActiveKey={[]}
                    items={[
                      {
                        key: 'advanced',
                        label: '高级设置',
                        forceRender: true,
                        children: (
                          <Space direction="vertical" size="middle" style={{ width: '100%', paddingBottom: 16 }}>
                            <Card title="可见范围" size="small">
                              <Descriptions
                                column={{ xs: 1, sm: 2, lg: 3 }}
                                items={[
                                  { label: '可见范围', children: visibilityText },
                                  { label: '发送消息通知', children: activity.notifyOnPublish ? '开启' : '关闭' },
                                ]}
                              />
                            </Card>
                            <Card title="活动设置" size="small">
                              <Descriptions
                                column={{ xs: 1, sm: 2, lg: 3 }}
                                items={[
                                  {
                                    label: '是否审核报名',
                                    children: formatSignupAuditSummary(activity.needAudit, activity.signupApprovalNodes),
                                  },
                                  { label: '报名司龄限制', children: hasSeniorityLimit ? '有限制' : '无限制' },
                                  ...(hasSeniorityLimit
                                    ? [{ label: '司龄要满', children: `${activity.minSeniorityYears} 年` }]
                                    : []),
                                  {
                                    label: '活动积分',
                                    children: formatActivityPointGrant(activity.signupPointsEnabled, activity.signupPoints),
                                  },
                                ]}
                              />
                            </Card>
                            <Card title="报名信息收集" size="small">
                              {signupFields.length ? (
                                <Table
                                  size="small"
                                  pagination={false}
                                  rowKey="key"
                                  dataSource={signupFields}
                                  columns={[
                                    { title: '字段名称', dataIndex: 'label', width: 140, ellipsis: true, render: (value: string) => <TableEllipsisText text={value} /> },
                                    {
                                      title: '类型',
                                      dataIndex: 'inputType',
                                      width: 96,
                                      render: (value: SignupField['inputType']) => signupFieldInputTypeLabels[value],
                                    },
                                    {
                                      title: '必填',
                                      dataIndex: 'required',
                                      width: 72,
                                      render: (value: boolean) => (value ? '是' : '否'),
                                    },
                                    {
                                      title: '配置',
                                      ellipsis: true,
                                      render: (_: unknown, field: SignupField) => (
                                        <TableEllipsisText text={formatSignupFieldConfig(field)} />
                                      ),
                                    },
                                  ]}
                                />
                              ) : (
                                <Empty description="暂无收集字段" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                              )}
                            </Card>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'signups',
            label: '报名',
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
