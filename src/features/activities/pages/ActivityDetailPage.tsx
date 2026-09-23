import { useEffect, useState, type ReactNode } from 'react';
import { App, Breadcrumb, Button, Card, Collapse, Descriptions, Empty, Space, Table, Tabs, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { ActivityDetailHeader } from '../../../shared/ui/ActivityDetailHeader';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { ActivityReviewModal } from '../components/ActivityReviewModal';
import { ActivityStatsRow } from '../components/ActivityStatsRow';
import { patchActivities, submitActivitiesForApproval, useActivities } from '../model/activityStore';
import {
  applyTerminateActivity,
  canReviewActivity,
  canSubmitApproval,
  applyCloseActivitySignup,
  applyReopenActivitySignup,
  canCloseActivitySignup,
  canReopenActivitySignup,
  canTerminateActivity,
  editActivityBlockReason,
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
import { ActivitySessionsDetailCard } from '../components/ActivitySessionsDetailCard';
import { activityScheduleTypeLabels, needsSessionPick, signupQuotaLabel } from '../model/activitySchedule';
import { signupFieldInputTypeLabels, findGroupSignupField, withoutGroupSignupField } from '../model/signupFields';
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

function auditTagColor(status: string): string | undefined {
  if (status === '已驳回') return 'error';
  if (status === '待审核') return 'warning';
  return 'default';
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
  const groupSignupField = findGroupSignupField(signupFields);
  const collectSignupFields = withoutGroupSignupField(signupFields);
  const showReview = canReviewActivity(activity);
  const showSubmit = canSubmitApproval(activity);
  const canCloseSignup = canCloseActivitySignup(activity);
  const canReopenSignup = canReopenActivitySignup(activity);
  const lifecycleStatus = getActivityLifecycleStatus(activity);
  const editBlocked = editActivityBlockReason(activity);
  const editButton = (primary: boolean) => {
    const button = (
      <Button
        type={primary ? 'primary' : 'default'}
        aria-label="编辑"
        disabled={Boolean(editBlocked)}
        onClick={() => {
          if (!editBlocked) onEdit(activity.id);
        }}
      >
        编辑
      </Button>
    );
    return editBlocked ? (
      <Tooltip title={editBlocked}>
        <span title={editBlocked}>{button}</span>
      </Tooltip>
    ) : (
      button
    );
  };
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

  const terminate = () => {
    modal.confirm({
      title: `确认终止「${activity.title}」？`,
      content: '未举办场次不再进行，且不可恢复为进行中。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      okButtonProps: { danger: true },
      onOk: () => {
        patchActivities((list) =>
          list.map((item) => (item.id === activity.id ? applyTerminateActivity(item) : item)),
        );
        message.success(`已终止「${activity.title}」`);
      },
    });
  };

  const closeSignup = () => {
    modal.confirm({
      title: `确认截止「${activity.title}」报名？`,
      content: '截止后员工不能再报名，已报名不受影响。可在本页恢复报名。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        patchActivities((list) =>
          list.map((item) => (item.id === activity.id ? applyCloseActivitySignup(item) : item)),
        );
        message.success(`已截止「${activity.title}」报名`);
      },
    });
  };

  const reopenSignup = () => {
    modal.confirm({
      title: `确认恢复「${activity.title}」报名？`,
      content: '将按原报名规则重新开放。单次恢复原报名结束时间；周期/系列恢复为最后一场的场次截止。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        patchActivities((list) =>
          list.map((item) => (item.id === activity.id ? applyReopenActivitySignup(item) : item)),
        );
        message.success(`已恢复「${activity.title}」报名`);
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
      <ActivityDetailHeader
        coverUrl={activity.coverUrl}
        coverAlt="活动封面"
        tags={[
          { text: activity.category },
          { text: lifecycleStatus, color: lifecycleStatusColor[lifecycleStatus] },
          ...(activity.auditStatus !== '已通过' && activity.auditStatus !== '无需审核'
            ? [{ text: activity.auditStatus, color: auditTagColor(activity.auditStatus) }]
            : []),
        ]}
        title={activity.title}
        actions={
          <>
            {showReview ? (
              <Button type="primary" aria-label="审核" onClick={() => setReviewOpen(true)}>
                审核
              </Button>
            ) : showSubmit ? (
              <Button type="primary" aria-label="提交审批" onClick={submit}>
                提交审批
              </Button>
            ) : (
              editButton(true)
            )}
            {showReview || showSubmit ? editButton(false) : null}
            <Button aria-label="复制创建" onClick={() => onCopy(activity.id)}>
              复制创建
            </Button>
            {activity.checkInEnabled ? (
              <Button aria-label="签到码" onClick={() => changeTab('checkin')}>
                签到码
              </Button>
            ) : null}
            {canCloseSignup ? (
              <Button aria-label="截止报名" onClick={closeSignup}>
                截止报名
              </Button>
            ) : null}
            {canReopenSignup ? (
              <Button aria-label="恢复报名" onClick={reopenSignup}>
                恢复报名
              </Button>
            ) : null}
            {canTerminateActivity(activity) ? (
              <Button danger aria-label="终止活动" onClick={terminate}>
                终止活动
              </Button>
            ) : null}
            <Button danger aria-label="删除" onClick={remove}>
              删除
            </Button>
          </>
        }
        facts={[
          { label: '活动时间', value: formatActivityTime(activity) },
          { label: '报名时间', value: formatActivitySignupTime(activity) },
          { label: '活动地点', value: dash(activity.location) },
          { label: '报名截止时间', value: dash(activity.signupEndAt) },
          { label: '活动终止时间', value: dash(activity.terminatedAt) },
        ]}
        metrics={<ActivityStatsRow activity={activity} embedded />}
      />
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
                      { label: '报名截止时间', children: dash(activity.signupEndAt) },
                      { label: '活动终止时间', children: dash(activity.terminatedAt) },
                      { label: '活动地点', children: dash(activity.location) },
                      { label: signupQuotaLabel(activity.scheduleType), children: signupTotalLimit > 0 ? signupTotalLimit : '—' },
                      { label: '发起人', children: dash(activity.organizer) },
                      { label: '创建人', children: dash(activity.creator) },
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
                <Card title="可见范围" className="activity-settings-card">
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
                <Card title="报名分组设置" className="activity-settings-card">
                  <Descriptions
                    column={{ xs: 1, sm: 2, lg: 3 }}
                    items={[
                      {
                        label: '是否设置',
                        children: groupSignupField ? '已设置' : '未设置',
                      },
                      ...(groupSignupField
                        ? [
                            {
                              label: '分组',
                              children: formatSignupFieldConfig(groupSignupField),
                            },
                          ]
                        : []),
                    ]}
                  />
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
                              {collectSignupFields.length ? (
                                <Table
                                  size="small"
                                  pagination={false}
                                  rowKey="key"
                                  dataSource={collectSignupFields}
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
                {needsSessionPick(activity.scheduleType) ? (
                  <ActivitySessionsDetailCard
                    sessions={activity.sessions}
                    signupHoursBefore={activity.signupHoursBefore}
                    quotaPerSession={signupTotalLimit}
                  />
                ) : null}
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
