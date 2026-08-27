import { useEffect, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Image,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { InterestGroupFormDrawer } from '../components/InterestGroupFormDrawer';
import { getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import { InterestGroupActivityListPage } from './InterestGroupActivityListPage';
import { InterestGroupCommentListPage } from './InterestGroupCommentListPage';
import { InterestGroupMemberListPage } from './InterestGroupMemberListPage';
import { InterestGroupMomentListPage } from './InterestGroupMomentListPage';
import { computeInterestGroupDetailStats } from '../model/interestGroupStats';
import {
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroupComments,
  useInterestGroupMembers,
  useInterestGroupMoments,
  useInterestGroups,
} from '../model/interestGroupStore';

const detailTabs = [
  { key: 'acts', label: '活动' },
  { key: 'members', label: '成员' },
  { key: 'comments', label: '评论' },
  { key: 'moments', label: '精彩瞬间' },
] as const;

type DetailTab = (typeof detailTabs)[number]['key'];

function isDetailTab(value: string | undefined): value is DetailTab {
  return !!value && detailTabs.some((tab) => tab.key === value);
}

type InterestGroupDetailPageProps = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onNavigate: (page: string, recordId?: string) => void;
  onTabChange: (tab: DetailTab) => void;
};

export function InterestGroupDetailPage({ recordId, tab, onBack, onNavigate, onTabChange }: InterestGroupDetailPageProps) {
  const categories = useInterestGroupCategories();
  const groups = useInterestGroups();
  const activities = useInterestGroupActivities();
  const members = useInterestGroupMembers();
  const comments = useInterestGroupComments();
  const moments = useInterestGroupMoments();
  const [editorOpen, setEditorOpen] = useState(false);

  const groupId = Number(recordId);
  const group = groups.find((item) => item.id === groupId);
  const activeTab: DetailTab = isDetailTab(tab) ? tab : 'acts';
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisited((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);

  const changeTab = (key: string) => {
    if (!isDetailTab(key)) return;
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    onTabChange(key);
  };

  if (!group) {
    return (
      <div className="page-stack">
        <Empty description="小组不存在或已删除">
          <Button type="primary" onClick={onBack}>
            返回列表
          </Button>
        </Empty>
      </div>
    );
  }

  const groupActivities = activities.filter((item) => item.groupId === groupId);
  const groupMembers = members.filter((item) => item.groupId === groupId);
  const stats = computeInterestGroupDetailStats({
    groupId,
    memberCount: group.memberCount,
    activities,
    comments,
    moments,
  });

  return (
    <div className="page-stack order-detail-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>小组管理</Button> },
          { title: group.name },
        ]}
      />
      <Card className="activity-detail-header-card">
        <Flex justify="space-between" align="flex-start" wrap gap={16}>
          <Flex align="stretch" gap={16} className="activity-detail-header-main">
            <div className="activity-detail-cover-wrap">
              {group.coverUrl ? (
                <Image src={group.coverUrl} alt="小组封面" className="activity-detail-cover" />
              ) : (
                <div className="activity-detail-cover-placeholder">暂无封面</div>
              )}
            </div>
            <div className="activity-detail-header-copy">
              <Typography.Title level={3} style={{ marginTop: 0 }}>
                {group.name}
              </Typography.Title>
              <Space wrap>
                <Tag>{getInterestGroupCategoryLabel(group.categoryKey, categories)}</Tag>
                {group.auditStatus !== '已通过' && group.auditStatus !== '无需审核' ? (
                  <Tag color={group.auditStatus === '已驳回' ? 'error' : 'warning'}>{group.auditStatus}</Tag>
                ) : null}
              </Space>
              <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
                <Descriptions.Item label="小组负责人">{group.leadName}</Descriptions.Item>
                <Descriptions.Item label="活动区域">{group.area || '—'}</Descriptions.Item>
                <Descriptions.Item label="简介">{group.intro || '—'}</Descriptions.Item>
              </Descriptions>
            </div>
          </Flex>
          <Space>
            <Button onClick={() => setEditorOpen(true)}>编辑</Button>
          </Space>
        </Flex>
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={12} sm={6}><Statistic title="成员" value={stats.memberCount} /></Col>
          <Col xs={12} sm={6}><Statistic title="累计活动" value={stats.activityCount} /></Col>
          <Col xs={12} sm={6}><Statistic title="评论" value={stats.commentCount} /></Col>
          <Col xs={12} sm={6}><Statistic title="精彩瞬间" value={stats.momentCount} /></Col>
        </Row>
      </Card>
      <Tabs
        destroyOnHidden
        activeKey={activeTab}
        onChange={changeTab}
        items={[
          {
            key: 'acts',
            label: `活动 ${groupActivities.length}`,
            children: visited.has('acts') ? (
              <InterestGroupActivityListPage groupId={groupId} onNavigate={onNavigate} />
            ) : null,
          },
          {
            key: 'members',
            label: `成员 ${groupMembers.length}`,
            children: visited.has('members') ? <InterestGroupMemberListPage groupId={groupId} /> : null,
          },
          {
            key: 'comments',
            label: '评论',
            children: visited.has('comments') ? <InterestGroupCommentListPage groupId={groupId} /> : null,
          },
          {
            key: 'moments',
            label: '精彩瞬间',
            children: visited.has('moments') ? <InterestGroupMomentListPage groupId={groupId} /> : null,
          },
        ]}
      />
      <InterestGroupFormDrawer
        open={editorOpen}
        record={group}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
