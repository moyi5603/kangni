import { useMemo, useState } from 'react';
import {
  CommentOutlined,
  ReadOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { OverviewKpiCard, OverviewPie } from '../../activities/components/ActivityOverviewVisuals';
import { OverviewDateRange } from '../../activities/components/OverviewDateRange';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  buildForumLatestRows,
  computeForumOverviewStats,
  defaultForumOverviewDateRange,
  forumBoardInDateRange,
  forumBoardSegments,
  forumHeatSegments,
  forumMuteInDateRange,
  forumTopicInDateRange,
  type ForumLatestTopicRow,
} from '../model/forumOverview';
import { useForumBoards, useForumMutes, useForumTopics } from '../model/forumStore';

type ForumOverviewPageProps = {
  onNavigate: (page: string, recordId?: string) => void;
};

export function ForumOverviewPage({ onNavigate }: ForumOverviewPageProps) {
  const boards = useForumBoards();
  const topics = useForumTopics();
  const mutes = useForumMutes();
  const [dateRange, setDateRange] = useState(defaultForumOverviewDateRange);
  const scopedBoards = useMemo(
    () => boards.filter((item) => forumBoardInDateRange(item, dateRange[0], dateRange[1])),
    [boards, dateRange],
  );
  const scopedTopics = useMemo(
    () => topics.filter((item) => forumTopicInDateRange(item, dateRange[0], dateRange[1])),
    [topics, dateRange],
  );
  const scopedMutes = useMemo(
    () => mutes.filter((item) => forumMuteInDateRange(item, dateRange[0], dateRange[1])),
    [mutes, dateRange],
  );
  const stats = useMemo(
    () => computeForumOverviewStats(scopedBoards, scopedTopics, scopedMutes),
    [scopedBoards, scopedTopics, scopedMutes],
  );
  const latestRows = useMemo(() => buildForumLatestRows(scopedBoards, scopedTopics), [scopedBoards, scopedTopics]);

  const latestColumns: TableColumnsType<ForumLatestTopicRow> = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <span>
          {record.pinned ? <Tag color="blue">置顶</Tag> : null}
          {value}
        </span>
      ),
    },
    { title: '论坛', dataIndex: 'boardName', width: 140 },
    { title: '发帖人', dataIndex: 'author', width: 120 },
    { title: '发布时间', dataIndex: 'publishedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 88,
      render: (_, record) => (
        <Button type="link" onClick={() => onNavigate('topic-detail', String(record.id))}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['论坛', '概览']}
        title="概览"
        subtitle="论坛运营数据总览与最新帖子"
        extra={<OverviewDateRange value={dateRange} onChange={setDateRange} />}
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid is-four">
          <OverviewKpiCard
            title="论坛数"
            value={stats.boardCount}
            icon={<ReadOutlined />}
            tone="primary"
            onClick={() => onNavigate('forum-list')}
          />
          <OverviewKpiCard
            title="帖子数"
            value={stats.topicCount}
            icon={<UnorderedListOutlined />}
            onClick={() => onNavigate('forum-list')}
          />
          <OverviewKpiCard title="评论数" value={stats.commentCount} icon={<CommentOutlined />} tone="success" />
          <OverviewKpiCard
            title="生效禁言"
            value={stats.activeMuteCount}
            icon={<StopOutlined />}
            tone="danger"
            onClick={() => onNavigate('forum-risk')}
          />
        </div>

        <Row gutter={[16, 16]} className="overview-chart-row">
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="帖子论坛分布">
              <OverviewPie segments={forumBoardSegments(stats.boardCounts)} />
            </Card>
          </Col>
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="互动热度分层">
              <OverviewPie segments={forumHeatSegments(stats.heatCounts)} />
            </Card>
          </Col>
        </Row>
      </div>

      <Card title="最新帖子">
        {latestRows.length ? (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            dataSource={latestRows}
            columns={latestColumns}
            scroll={{ x: 720 }}
          />
        ) : (
          <Empty description="暂无帖子" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
