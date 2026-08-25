import { useEffect, useState } from 'react';
import { App, Breadcrumb, Button, Card, Collapse, Descriptions, Empty, Flex, Image, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { ActivityReviewModal } from '../components/ActivityReviewModal';
import { ActivityClientPreviewModal } from '../components/ActivityClientPreviewModal';
import { ActivityStatsRow } from '../components/ActivityStatsRow';
import { patchActivities, submitActivitiesForApproval, useActivities } from '../model/activityStore';
import {
  canReviewActivity,
  canSubmitApproval,
  formatActivityTime,
  formatCustomCrowdVisibility,
  formatPublishedAt,
  getActivityLifecycleStatus,
  lifecycleStatusColor,
  type SignupField,
} from '../model/activity';
import { formatApprovalNodeSummary } from '../model/rules';
import { formatActivityPointGrant } from '../model/activityPointRules';
import { signupFieldInputTypeLabels } from '../model/signupFields';
import { ActivityMomentListPage } from './ActivityMomentListPage';
import { ActivityPrizeListPage } from './ActivityPrizeListPage';
import { CommentList, SignupList } from './ActivityRelatedListPage';

const detailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'signups', label: '报名' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
  { key: 'prizes', label: '奖品发放' },
] as const;

type DetailTab = (typeof detailTabs)[number]['key'];

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

function isDetailTab(value: string | undefined): value is DetailTab {
  return !!value && detailTabs.some((tab) => tab.key === value);
}

type ActivityDetailPageProps = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onCopy: (id: number) => void;
  onTabChange: (tab: DetailTab) => void;
};

export function ActivityDetailPage({ recordId, tab, onBack, onEdit, onCopy, onTabChange }: ActivityDetailPageProps) {
  const { message, modal } = App.useApp();
  const activities = useActivities();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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

  const activity = activities.find((item) => item.id === Number(recordId));
  if (!activity) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> }, { title: '活动详情' }]} />
        <Empty description="未找到该活动" />
      </div>
    );
  }

  const visibilityText =
    activity.visibility === '按部门'
      ? `按部门：${activity.departments.join('、') || '—'}`
      : activity.visibility === '自定义人群'
        ? formatCustomCrowdVisibility(activity.customPeople, activity.visibilityMinSeniorityYears)
        : activity.visibility === '导入人群'
          ? `导入人群：${activity.importFileName || '—'}${activity.importedPeople.length ? `（${activity.importedPeople.length} 人）` : ''}`
          : '全员';

  const signupSetting = activity.signupSettings[0];
  const signupTotalLimit = activity.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0);
  const hasSeniorityLimit = signupSetting?.minSeniorityYears != null;
  const signupFields = activity.signupFields ?? [];
  const showReview = canReviewActivity(activity);
  const showSubmit = canSubmitApproval(activity);
  const signupOpen = !dayjs().isAfter(dayjs(activity.signupEndAt));
  const lifecycleStatus = getActivityLifecycleStatus(activity);
  const submit = () => {
    modal.confirm({
      title: `确认提交「${activity.title}」审批？`,
      content: '提交后审核状态变为待审核。',
      okText: '确认',
      cancelText: '取消',
      footer: (_, { OkBtn, CancelBtn }) => (
        <Space>
          <OkBtn />
          <CancelBtn />
        </Space>
      ),
      onOk: () => {
        submitActivitiesForApproval([activity.id], dayjs().format('YYYY-MM-DD HH:mm:ss'));
        message.success(`已提交「${activity.title}」审批`);
      },
    });
  };

  const closeSignup = () => {
    modal.confirm({
      title: `确认截止「${activity.title}」报名？`,
      content: '截止时间将改为现在，C 端立即不可报名。如需恢复，请在编辑页修改报名时间。',
      okText: '确认',
      cancelText: '取消',
      footer: (_, { OkBtn, CancelBtn }) => (
        <Space>
          <OkBtn />
          <CancelBtn />
        </Space>
      ),
      onOk: () => {
        patchActivities((list) =>
          list.map((item) => (item.id === activity.id ? { ...item, signupEndAt: dayjs().format('YYYY-MM-DD HH:mm') } : item)),
        );
        message.success(`已截止「${activity.title}」报名`);
      },
    });
  };

  const remove = () => {
    modal.confirm({
      title: `确认删除「${activity.title}」？`,
      content: '删除后不可恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: (_, { OkBtn, CancelBtn }) => (
        <Space>
          <OkBtn />
          <CancelBtn />
        </Space>
      ),
      onOk: () => {
        patchActivities((list) => list.filter((item) => item.id !== activity.id));
        message.success(`已删除「${activity.title}」`);
        onBack();
      },
    });
  };

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
              <Space wrap size={[8, 8]}>
                <Tag>{activity.category}</Tag>
                <Tag color={lifecycleStatusColor[lifecycleStatus]}>{lifecycleStatus}</Tag>
                {activity.auditStatus !== '已通过' && activity.auditStatus !== '无需审核' ? (
                  <Tag
                    color={
                      activity.auditStatus === '已驳回'
                        ? 'error'
                        : activity.auditStatus === '待审核'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {activity.auditStatus}
                  </Tag>
                ) : null}
              </Space>
              <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>
                {activity.title}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ display: 'block' }}>
                活动时间：{formatActivityTime(activity)}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                报名时间：{activity.signupStartAt} ~ {activity.signupEndAt}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                活动地点：{dash(activity.location)}
              </Typography.Text>
            </div>
          </Flex>
          <Space wrap>
            {showReview ? (
              <Button type="primary" onClick={() => setReviewOpen(true)}>
                审核
              </Button>
            ) : null}
            {showSubmit ? (
              <Button type="primary" onClick={submit}>
                提交审批
              </Button>
            ) : null}
            <Button onClick={() => setPreviewOpen(true)}>预览</Button>
            <Button type="primary" onClick={() => onEdit(activity.id)}>
              编辑
            </Button>
            <Button onClick={() => onCopy(activity.id)}>复制创建</Button>
            {signupOpen ? <Button onClick={closeSignup}>截止报名</Button> : null}
            <Button danger onClick={remove}>
              删除
            </Button>
          </Space>
        </Flex>
        <div style={{ marginTop: 24 }}>
          <ActivityStatsRow activity={activity} embedded />
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
                      { label: '分类', children: dash(activity.category) },
                      { label: '报名时间', children: `${activity.signupStartAt} ~ ${activity.signupEndAt}` },
                      { label: '活动时间', children: formatActivityTime(activity) },
                      { label: '活动地点', children: dash(activity.location) },
                      { label: '报名总人数', children: signupTotalLimit > 0 ? signupTotalLimit : '—' },
                      { label: '发起人', children: dash(activity.organizer) },
                      { label: '联系电话', children: dash(activity.phone) },
                      { label: '创建时间', children: activity.createdAt },
                      { label: '发布时间', children: formatPublishedAt(activity.publishedAt) },
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
                <Card styles={{ body: { paddingBlock: 0 } }} className="advanced-settings-card">
                  <Collapse
                    ghost
                    className="advanced-settings-collapse"
                    defaultActiveKey={[]}
                    items={[
                      {
                        key: 'advanced',
                        label: '高级设置',
                        children: (
                          <Space direction="vertical" size="middle" style={{ width: '100%', paddingBottom: 16 }}>
                            <Card title="可见范围" size="small">
                              <Descriptions
                                column={{ xs: 1, sm: 2, lg: 3 }}
                                items={[
                                  { label: '可见范围', children: visibilityText },
                                  {
                                    label: '是否发送消息通知',
                                    children: activity.notifyOnPublish ? '开启' : '关闭',
                                  },
                                ]}
                              />
                            </Card>
                            <Card title="活动设置" size="small">
                              <Descriptions
                                column={{ xs: 1, sm: 2, lg: 3 }}
                                items={[
                                  {
                                    label: '是否审核报名',
                                    children: signupSetting?.needAudit ? '需要审核' : '无需审核',
                                  },
                                  ...(signupSetting?.needAudit
                                    ? [
                                        {
                                          label: '是否开启报名审批流',
                                          children: activity.activityApprovalEnabled
                                            ? activity.signupApprovalNodes?.length
                                              ? activity.signupApprovalNodes
                                                  .map((node, index) => `第 ${index + 1} 节点：${formatApprovalNodeSummary(node)}`)
                                                  .join('；')
                                              : '开启（未设置节点）'
                                            : '未开启，由管理员进行审核',
                                        },
                                      ]
                                    : []),
                                  {
                                    label: '报名是否有司龄限制',
                                    children: hasSeniorityLimit ? '有限制' : '无限制',
                                  },
                                  ...(hasSeniorityLimit
                                    ? [
                                        {
                                          label: '司龄要满',
                                          children: `${signupSetting?.minSeniorityYears} 年`,
                                        },
                                      ]
                                    : []),
                                  {
                                    label: '是否开启精彩瞬间审核',
                                    children: activity.momentAuditEnabled ? '开启' : '关闭',
                                  },
                                  { label: '报名活动可得积分', children: formatActivityPointGrant(activity.signupPointsEnabled, activity.signupPoints) },
                                  { label: '活动首评可得积分', children: formatActivityPointGrant(activity.firstCommentPointsEnabled, activity.firstCommentPoints) },
                                  { label: '活动打分可得积分', children: formatActivityPointGrant(activity.ratingPointsEnabled, activity.ratingPoints) },
                                  { label: '首次发布精彩瞬间可得积分', children: formatActivityPointGrant(activity.firstMomentPointsEnabled, activity.firstMomentPoints) },
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
                                    { title: '字段名称', dataIndex: 'label', width: 140 },
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
                                      render: (_: unknown, field: SignupField) => formatSignupFieldConfig(field),
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
          { key: 'signups', label: '报名', children: visited.has('signups') ? <SignupList activity={activity} /> : null },
          { key: 'comments', label: '评论', children: visited.has('comments') ? <CommentList activity={activity} /> : null },
          { key: 'moments', label: '精彩瞬间', children: visited.has('moments') ? <ActivityMomentListPage activity={activity} /> : null },
          { key: 'prizes', label: '奖品发放', children: visited.has('prizes') ? <ActivityPrizeListPage activity={activity} /> : null },
        ]}
      />
      <ActivityReviewModal activity={activity} open={reviewOpen} onClose={() => setReviewOpen(false)} />
      <ActivityClientPreviewModal activity={activity} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
