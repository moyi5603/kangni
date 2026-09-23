import { useEffect, useState, type ReactNode } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Statistic,
  Tabs,
  Tooltip,
} from 'antd';
import { ActivityDetailHeader } from '../../../shared/ui/ActivityDetailHeader';
import { InterestGroupActivitySignupList } from './InterestGroupActivitySignupList';
import {
  canCloseInterestGroupSignup,
  canDeleteInterestGroupActivity,
  canReopenInterestGroupSignup,
  canTerminateInterestGroupActivity,
  formatInterestGroupActivityTime,
  formatInterestGroupActivityNotify,
  formatInterestGroupPublishedAt,
  formatInterestGroupSignupTime,
  getInterestGroupLifecycleStatus,
  interestGroupActivityTypeLabels,
  interestGroupPublishStatusColor,
  lifecycleStatusColor,
} from '../model/interestGroupActivity';
import { ActivitySessionsDetailCard } from '../../activities/components/ActivitySessionsDetailCard';
import { needsSessionPick, signupQuotaLabel } from '../../activities/model/activitySchedule';
import { formatCheckInRuleSummary } from '../../activities/model/activityCheckIn';
import { ActivityQrCheckInPage } from '../../activities/pages/ActivityQrCheckInPage';
import { currentIgCheckInUrl, toInterestGroupCheckInActivity } from '../model/interestGroupCheckIn';
import { InterestGroupCommentListPage } from './InterestGroupCommentListPage';
import { InterestGroupMomentListPage } from './InterestGroupMomentListPage';
import { getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import {
  closeInterestGroupSignup,
  deleteInterestGroupActivity,
  reopenInterestGroupSignup,
  terminateInterestGroupActivity,
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroupComments,
  useInterestGroupMoments,
  useInterestGroups,
} from '../model/interestGroupStore';

const detailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'signups', label: '报名' },
  { key: 'checkin', label: '签到码' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
] as const;

function dash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function hasHtmlContent(html: string): boolean {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

function confirmFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

type DetailTab = (typeof detailTabs)[number]['key'];

function isDetailTab(value: string | undefined): value is DetailTab {
  return !!value && detailTabs.some((tab) => tab.key === value);
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
  const { message, modal } = App.useApp();
  const activities = useInterestGroupActivities();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const comments = useInterestGroupComments();
  const moments = useInterestGroupMoments();
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
  const deletable = canDeleteInterestGroupActivity(activity);
  const terminable = canTerminateInterestGroupActivity(activity);
  const canCloseSignup = canCloseInterestGroupSignup(activity);
  const canReopenSignup = canReopenInterestGroupSignup(activity);
  const closeSignup = () => {
    modal.confirm({
      title: `确认截止「${activity.title}」报名？`,
      content: '截止后员工不能再报名，已报名不受影响。可在本页恢复报名。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        const result = closeInterestGroupSignup(activity.id);
        if (!result.ok) {
          message.warning('当前不可截止报名');
          return;
        }
        message.success('已截止报名');
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
        const result = reopenInterestGroupSignup(activity.id);
        if (!result.ok) {
          message.warning('当前不可恢复报名');
          return;
        }
        message.success('已恢复报名');
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
        const result = terminateInterestGroupActivity(activity.id);
        if (!result.ok) {
          message.warning('当前状态不可终止');
          return;
        }
        message.success('活动已终止');
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
        const result = deleteInterestGroupActivity(activity.id);
        if (!result.ok) {
          message.warning(result.reason === 'has-signups' ? '已有人报名，无法删除' : '活动不存在');
          return;
        }
        message.success('活动已删除');
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
          { text: getInterestGroupCategoryLabel(activity.categoryKey, categories) },
          { text: lifecycleStatus, color: lifecycleStatusColor[lifecycleStatus] },
          { text: activity.publishStatus, color: interestGroupPublishStatusColor[activity.publishStatus] },
        ]}
        title={activity.title}
        actions={
          <>
            <Button type="primary" onClick={() => onEdit(activity.id)}>
              编辑
            </Button>
            {onCopy ? (
              <Button onClick={() => onCopy(activity.id)}>复制创建</Button>
            ) : null}
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
            {terminable ? (
              <Button danger aria-label="终止活动" onClick={terminate}>
                终止活动
              </Button>
            ) : null}
            {deletable ? (
              <Button danger onClick={remove}>
                删除
              </Button>
            ) : (
              <Tooltip title="已有人报名，无法删除">
                <Button danger disabled>
                  删除
                </Button>
              </Tooltip>
            )}
          </>
        }
        facts={[
          { label: '活动时间', value: formatInterestGroupActivityTime(activity) },
          { label: '报名时间', value: formatInterestGroupSignupTime(activity) },
          { label: '活动地点', value: dash(activity.location) },
          { label: '报名截止时间', value: dash(activity.signupEndAt) },
          { label: '活动终止时间', value: dash(activity.terminatedAt) },
        ]}
        metrics={
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6} lg={6}>
              <Statistic
                title="报名人数"
                value={activity.signedCount}
                suffix={activity.capacity ? `/ ${activity.capacity}` : undefined}
              />
            </Col>
            <Col xs={12} sm={8} md={6} lg={6}>
              <Statistic title="评论数" value={activityComments.length} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={6}>
              <Statistic title="精彩瞬间数" value={activityMoments.length} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={6}>
              <Statistic title="点赞" value={activity.likeCount} />
            </Col>
          </Row>
        }
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
                      { label: '分类', children: dash(getInterestGroupCategoryLabel(activity.categoryKey, categories)) },
                      { label: '举办方式', children: interestGroupActivityTypeLabels[activity.type] },
                      { label: '所属兴趣圈', children: group?.name ?? '未归属兴趣圈' },
                      { label: '报名时间', children: formatInterestGroupSignupTime(activity) },
                      { label: '活动时间', children: formatInterestGroupActivityTime(activity) },
                      { label: '报名截止时间', children: dash(activity.signupEndAt) },
                      { label: '活动终止时间', children: dash(activity.terminatedAt) },
                      { label: '活动地点', children: dash(activity.location) },
                      { label: signupQuotaLabel(activity.type), children: activity.capacity > 0 ? activity.capacity : '—' },
                      { label: '创建人', children: dash(activity.creator) },
                      { label: '创建时间', children: activity.createdAt },
                      { label: '发布时间', children: formatInterestGroupPublishedAt(activity.publishedAt) },
                      {
                        label: '发送消息通知',
                        children: formatInterestGroupActivityNotify(activity.notifyOnPublish, activity.notifyAudience),
                      },
                      { label: '扫码签到', children: formatCheckInRuleSummary(activity) },
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
                {needsSessionPick(activity.type) ? (
                  <ActivitySessionsDetailCard
                    sessions={activity.sessions}
                    signupHoursBefore={activity.signupHoursBefore}
                    quotaPerSession={activity.capacity}
                  />
                ) : null}
              </div>
            ),
          },
          {
            key: 'signups',
            label: '报名',
            children: visited.has('signups') ? <InterestGroupActivitySignupList activity={activity} /> : null,
          },
          {
            key: 'checkin',
            label: '签到码',
            children: visited.has('checkin') ? (
              <ActivityQrCheckInPage
                activity={toInterestGroupCheckInActivity(activity)}
                toCheckInUrl={currentIgCheckInUrl}
              />
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
