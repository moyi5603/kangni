import { useState } from 'react';
import { App, Breadcrumb, Button, Card, Descriptions, Empty, Flex, Image, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { ActivityReviewModal } from '../components/ActivityReviewModal';
import { submitActivitiesForApproval, useActivities } from '../model/activityStore';
import {
  canReviewActivity,
  canSubmitApproval,
  formatActivityTime,
  formatCustomCrowdVisibility,
  formatPublishedAt,
  isRecreationActivity,
} from '../model/activity';

type ActivityDetailPageProps = {
  recordId?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
};

export function ActivityDetailPage({ recordId, onBack, onEdit }: ActivityDetailPageProps) {
  const { message, modal } = App.useApp();
  const activities = useActivities();
  const [reviewOpen, setReviewOpen] = useState(false);
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

  const showReview = canReviewActivity(activity);
  const showSubmit = canSubmitApproval(activity);
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

  return (
    <div className="page-stack order-detail-page">
      <Breadcrumb
        className="detail-breadcrumb"
        separator=">"
        items={[
          { title: '活动' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> },
          { title: activity.title },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="center" gap={16} wrap="wrap">
        <div>
          <Flex align="center" gap={12} wrap="wrap">
            <Typography.Title level={1}>{activity.title}</Typography.Title>
            <Tag>{activity.type}</Tag>
            <Tag color={activity.auditStatus === '已通过' ? 'success' : activity.auditStatus === '已驳回' ? 'error' : activity.auditStatus === '待审核' ? 'warning' : 'default'}>
              {activity.auditStatus}
            </Tag>
            <Tag color={activity.publishStatus === '已发布' ? 'success' : 'default'}>{activity.publishStatus}</Tag>
          </Flex>
          <Typography.Text type="secondary">{formatActivityTime(activity)}</Typography.Text>
        </div>
        <Space>
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
          <Button type={showReview || showSubmit ? 'default' : 'primary'} onClick={() => onEdit(activity.id)}>
            编辑
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>
      <Card title="活动信息">
        <Descriptions
          column={3}
          bordered
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
            { label: '类型', children: activity.type },
            { label: '分类', children: activity.category },
            { label: '标签', children: activity.tags.join('、') || '—' },
            { label: '活动开始时间', children: activity.startAt },
            { label: '活动结束时间', children: activity.endAt },
            { label: '活动地点', children: activity.location },
            { label: '发起人', children: activity.organizer },
            { label: '联系电话', children: activity.phone },
            { label: '审核状态', children: activity.auditStatus },
            { label: '发布状态', children: activity.publishStatus },
            { label: '活动状态', children: activity.activityStatus },
            { label: '创建时间', children: activity.createdAt },
            { label: '发布时间', children: formatPublishedAt(activity.publishedAt), span: 2 },
            { label: '可见范围', children: visibilityText, span: 3 },
            { label: '报名时间', children: `${activity.signupStartAt} ~ ${activity.signupEndAt}`, span: 3 },
            {
              label: '活动详情',
              span: 3,
              children: <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: activity.detailHtml || '—' }} />,
            },
            ...(isRecreationActivity(activity.type)
              ? [
                  {
                    label: '行程安排',
                    span: 3,
                    children: <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: activity.itinerary || '—' }} />,
                  },
                  {
                    label: '额外费用规则',
                    span: 3,
                    children: <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: activity.extraFeeRule || '—' }} />,
                  },
                ]
              : []),
          ]}
        />
      </Card>
      <Card title="报名设置">
        <Descriptions
          column={3}
          bordered
          items={activity.signupSettings.flatMap((item, index) => [
            { label: `报名类型 ${index + 1}`, children: item.type },
            { label: '报名人数', children: item.limit ?? '—' },
            ...(isRecreationActivity(activity.type)
              ? [{ label: '司龄要求', children: item.minSeniorityYears == null ? '—' : `≥ ${item.minSeniorityYears} 年` }]
              : []),
            { label: '是否审核', children: item.needAudit ? '需要审核' : '无需审核' },
          ])}
        />
      </Card>
      <ActivityReviewModal activity={activity} open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
