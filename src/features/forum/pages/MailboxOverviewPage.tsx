import { useMemo, useState } from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { OverviewKpiCard, OverviewPie } from '../../activities/components/ActivityOverviewVisuals';
import { OverviewDateRange } from '../../activities/components/OverviewDateRange';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  buildMailboxPendingRows,
  computeMailboxOverviewStats,
  defaultForumOverviewDateRange,
  forumBoardInDateRange,
  forumBoardSegments,
  forumTopicInDateRange,
  mailboxReplySegments,
  type MailboxPendingAdviceRow,
} from '../model/forumOverview';
import { useForumBoards, useForumTopics } from '../model/forumStore';

type MailboxOverviewPageProps = {
  onNavigate: (page: string, recordId?: string) => void;
};

export function MailboxOverviewPage({ onNavigate }: MailboxOverviewPageProps) {
  const boards = useForumBoards();
  const topics = useForumTopics();
  const [dateRange, setDateRange] = useState(defaultForumOverviewDateRange);
  const scopedBoards = useMemo(
    () => boards.filter((item) => forumBoardInDateRange(item, dateRange[0], dateRange[1])),
    [boards, dateRange],
  );
  const scopedTopics = useMemo(
    () => topics.filter((item) => forumTopicInDateRange(item, dateRange[0], dateRange[1])),
    [topics, dateRange],
  );
  const stats = useMemo(() => computeMailboxOverviewStats(scopedBoards, scopedTopics), [scopedBoards, scopedTopics]);
  const pendingRows = useMemo(() => buildMailboxPendingRows(scopedBoards, scopedTopics), [scopedBoards, scopedTopics]);

  const pendingColumns: TableColumnsType<MailboxPendingAdviceRow> = [
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '信箱', dataIndex: 'boardName', width: 140 },
    { title: '入口', dataIndex: 'chairName', width: 120 },
    { title: '提交时间', dataIndex: 'publishedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 88,
      render: (_, record) => (
        <Button type="link" onClick={() => onNavigate('advice-detail', String(record.id))}>
          回复
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['信箱', '概览']}
        title="概览"
        subtitle="信箱建言处理总览与待回复事项"
        extra={<OverviewDateRange value={dateRange} onChange={setDateRange} />}
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid is-four">
          <OverviewKpiCard
            title="信箱数"
            value={stats.boardCount}
            icon={<InboxOutlined />}
            tone="primary"
            onClick={() => onNavigate('mailbox-list')}
          />
          <OverviewKpiCard
            title="建言数"
            value={stats.adviceCount}
            icon={<FileTextOutlined />}
            onClick={() => onNavigate('mailbox-list')}
          />
          <OverviewKpiCard title="待回复" value={stats.pendingCount} icon={<ClockCircleOutlined />} tone="warning" />
          <OverviewKpiCard title="已回复" value={stats.repliedCount} icon={<CheckCircleOutlined />} tone="success" />
        </div>

        <Row gutter={[16, 16]} className="overview-chart-row">
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="建言信箱分布">
              <OverviewPie segments={forumBoardSegments(stats.boardCounts)} />
            </Card>
          </Col>
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="回复情况">
              <OverviewPie segments={mailboxReplySegments(stats.replyCounts)} />
            </Card>
          </Col>
        </Row>
      </div>

      <Card title="待回复建言">
        {pendingRows.length ? (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            dataSource={pendingRows}
            columns={pendingColumns}
            scroll={{ x: 720 }}
          />
        ) : (
          <Empty description="暂无待回复建言" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
