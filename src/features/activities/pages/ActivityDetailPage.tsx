import { useEffect, useState, type ReactNode } from 'react';
import { App, Breadcrumb, Button, Card, Collapse, Descriptions, Empty, Flex, Image, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { ActivityReviewModal } from '../components/ActivityReviewModal';
import { ActivityStatsRow } from '../components/ActivityStatsRow';
import { patchActivities, submitActivitiesForApproval, useActivities } from '../model/activityStore';
import {
  canReviewActivity,
  canSubmitApproval,
  formatActivityTime,
  formatActivitySignupTime,
  formatCustomCrowdVisibility,
  formatPublishedAt,
  getActivityLifecycleStatus,
  lifecycleStatusColor,
  type SignupField,
} from '../model/activity';
import { formatSignupAuditSummary } from '../model/rules';
import { formatActivityPointGrant } from '../model/activityPointRules';
import { formatCheckInRuleSummary } from '../model/activityCheckIn';
import { activityScheduleTypeLabels, signupQuotaLabel } from '../model/activitySchedule';
import { signupFieldInputTypeLabels } from '../model/signupFields';
import { ActivityMomentListPage } from './ActivityMomentListPage';
import { ActivityPrizeListPage } from './ActivityPrizeListPage';
import { ActivityQrCheckInPage } from './ActivityQrCheckInPage';
import { CommentList, SignupList } from './ActivityRelatedListPage';

const detailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'signups', label: '报名' },
  { key: 'checkin', label: '签到码' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
  { key: 'prizes', label: '奖品发放（康尼通过权限控制不显示此功能）' },
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

function confirmFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
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
      footer: confirmFooter,
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
      footer: confirmFooter,
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
      footer: confirmFooter,
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
        <Flex align="stretch" gap={16} className="activity-detail-header-main">
          <div className="activity-detail-cover-wrap">
            {activity.coverUrl ? (
              <Image src={activity.coverUrl} alt="活动封面" className="activity-detail-cover" />
            ) : (
              <div className="activity-detail-cover-placeholder">暂无封面</div>
            )}
          </div>
          <div className="activity-detail-header-copy">
            <Flex className="activity-detail-title-row" justify="space-between" align="flex-start" gap={16} wrap>
              <div className="activity-detail-title-block">
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
                <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
                  {activity.title}
                </Typography.Title>
              </div>
              <Space wrap className="activity-detail-header-actions">
                {showReview ? (
                  <Button type="primary" aria-label="审核" onClick={() => setReviewOpen(true)}>
                    审核
                  </Button>
                ) : showSubmit ? (
                  <Button type="primary" aria-label="提交审批" onClick={submit}>
                    提交审批
                  </Button>
                ) : (
                  <Button type="primary" aria-label="编辑" onClick={() => onEdit(activity.id)}>
                    编辑
                  </Button>
                )}
                {showReview || showSubmit ? (
                  <Button aria-label="编辑" onClick={() => onEdit(activity.id)}>
                    编辑
                  </Button>
                ) : null}
                <Button aria-label="复制创建" onClick={() => onCopy(activity.id)}>
                  复制创建
                </Button>
                {activity.checkInEnabled ? (
                  <Button aria-label="签到码" onClick={() => changeTab('checkin')}>
                    签到码
                  </Button>
                ) : null}
                {signupOpen ? (
                  <Button aria-label="截止报名" onClick={closeSignup}>
                    截止报名
                  </Button>
                ) : null}
                <Button danger aria-label="删除" onClick={remove}>
                  删除
                </Button>
              </Space>
            </Flex>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              活动时间：{formatActivityTime(activity)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              报名时间：{formatActivitySignupTime(activity)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              活动地点：{dash(activity.location)}
            </Typography.Text>
            <div className="activity-detail-header-metrics">
              <ActivityStatsRow activity={activity} embedded />
            </div>
          </div>
        </Flex>
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
                      { label: '分类', children: dash(activity.category) },
                      { label: '举办方式', children: activityScheduleTypeLabels[activity.scheduleType ?? 'once'] },
                      { label: '报名时间', children: formatActivitySignupTime(activity) },
                      { label: '活动时间', children: formatActivityTime(activity) },
                      { label: '活动地点', children: dash(activity.location) },
                      { label: signupQuotaLabel(activity.scheduleType), children: signupTotalLimit > 0 ? signupTotalLimit : '—' },
                      { label: '发起人', children: dash(activity.organizer) },
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
                        forceRender: true,
                        children: (
                          <Space direction="vertical" size="middle" style={{ width: '100%', paddingBottom: 16 }}>
                            <Card title="可见范围" size="small">
                              <Descriptions
                                column={{ xs: 1, sm: 2, lg: 3 }}
                                items={[
                                  { label: '可见范围', children: visibilityText },
                                  {
                                    label: '发送消息通知',
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
                                    children: formatSignupAuditSummary(signupSetting?.needAudit, activity.signupApprovalNodes),
                                  },
                                  {
                                    label: '报名司龄限制',
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
                                  { label: '活动积分', children: formatActivityPointGrant(activity.signupPointsEnabled, activity.signupPoints) },
                                  { label: '扫码签到', children: formatCheckInRuleSummary(activity) },
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
          { key: 'signups', label: '报名', children: visited.has('signups') ? <SignupList activity={activity} /> : null },
          { key: 'checkin', label: '签到码', children: visited.has('checkin') ? <ActivityQrCheckInPage activity={activity} /> : null },
          { key: 'comments', label: '评论', children: visited.has('comments') ? <CommentList activity={activity} /> : null },
          { key: 'moments', label: '精彩瞬间', children: visited.has('moments') ? <ActivityMomentListPage activity={activity} /> : null },
          { key: 'prizes', label: '奖品发放（康尼通过权限控制不显示此功能）', children: visited.has('prizes') ? <ActivityPrizeListPage activity={activity} /> : null },
        ]}
      />
      <ActivityReviewModal activity={activity} open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
