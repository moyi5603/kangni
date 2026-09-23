import { useMemo, useState } from 'react';
import { AppstoreOutlined, CalendarOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { OverviewKpiCard } from '../../activities/components/ActivityOverviewVisuals';
import { defaultOverviewDateRange, OverviewDateRange } from '../../activities/components/OverviewDateRange';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import dayjs from 'dayjs';
import {
  buildVoteV2InProgressRows,
  computeVoteV2OverviewStats,
  voteV2InDateRange,
  type VoteV2InProgressRow,
} from '../model/voteV2Overview';
import { useAllVoteV2Contestants, useVoteV2Campaigns, useVoteV2Casts } from '../model/voteV2Store';

type VoteV2OverviewPageProps = {
  onNavigate: (page: string, recordId?: string) => void;
};

export function VoteV2OverviewPage({ onNavigate }: VoteV2OverviewPageProps) {
  const campaigns = useVoteV2Campaigns();
  const contestants = useAllVoteV2Contestants();
  const casts = useVoteV2Casts();
  const [dateRange, setDateRange] = useState(defaultOverviewDateRange);
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const scopedCampaigns = useMemo(
    () => campaigns.filter((item) => voteV2InDateRange(item, dateRange[0], dateRange[1])),
    [campaigns, dateRange],
  );
  const scopedIds = useMemo(() => new Set(scopedCampaigns.map((item) => item.id)), [scopedCampaigns]);
  const scopedContestants = useMemo(
    () => contestants.filter((item) => scopedIds.has(item.campaignId)),
    [contestants, scopedIds],
  );
  const scopedCasts = useMemo(
    () => casts.filter((item) => scopedIds.has(item.campaignId)),
    [casts, scopedIds],
  );

  const stats = useMemo(
    () => computeVoteV2OverviewStats(scopedCampaigns, scopedCasts, now),
    [scopedCampaigns, scopedCasts, now],
  );
  const inProgressRows = useMemo(
    () => buildVoteV2InProgressRows(scopedCampaigns, scopedContestants, now),
    [scopedCampaigns, scopedContestants, now],
  );

  const inProgressColumns: TableColumnsType<VoteV2InProgressRow> = [
    { title: '活动名称', dataIndex: 'title', ellipsis: true },
    {
      title: '投票时间',
      key: 'time',
      width: 280,
      render: (_, record) => `${record.startAt} → ${record.endAt}`,
    },
    { title: '选项数', dataIndex: 'optionCount', width: 90, align: 'right' },
    { title: '投票数', dataIndex: 'voteCount', width: 90, align: 'right' },
    { title: '浏览量', dataIndex: 'viewCount', width: 90, align: 'right' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => onNavigate('vote-v2-detail', String(record.campaignId))}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['投票', '概览']}
        title="概览"
        subtitle="投票活动数据总览"
        extra={<OverviewDateRange value={dateRange} onChange={setDateRange} />}
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid is-four">
          <OverviewKpiCard
            title="投票总数"
            value={stats.campaignCount}
            icon={<AppstoreOutlined />}
            tone="primary"
            onClick={() => onNavigate('vote-v2-list')}
          />
          <OverviewKpiCard
            title="进行中投票"
            value={stats.ongoingCount}
            icon={<CalendarOutlined />}
            tone="primary"
            onClick={() => onNavigate('vote-v2-list')}
          />
          <OverviewKpiCard
            title="参与人数"
            value={stats.participantCount}
            icon={<TeamOutlined />}
            tone="success"
            onClick={() => onNavigate('vote-v2-list')}
          />
          <OverviewKpiCard
            title="浏览量"
            value={stats.totalViewCount}
            icon={<EyeOutlined />}
            tone="warning"
            onClick={() => onNavigate('vote-v2-list')}
          />
        </div>
      </div>

      <Card title="进行中的投票">
        {inProgressRows.length ? (
          <Table
            rowKey="campaignId"
            size="middle"
            dataSource={inProgressRows}
            columns={inProgressColumns}
            scroll={{ x: 800 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description="当前没有进行中的投票" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
}
