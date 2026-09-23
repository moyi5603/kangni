import { DownloadOutlined } from '@ant-design/icons';
import { App, Button, Empty, Flex, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  listVoteV2CastRecords,
  tallyVoteV2Results,
  voteV2DetailEmptyHint,
  voteV2SampleNo,
  type VoteV2Campaign,
  type VoteV2Cast,
  type VoteV2Contestant,
  type VoteV2RecordRow,
  type VoteV2ResultRow,
  type VoteV2Status,
} from '../model/voteV2';
import { downloadVoteV2RecordExport } from '../model/voteV2Export';

function VoteCountLabel({ count, voteUnit }: { count: number; voteUnit: string }) {
  return (
    <Typography.Text>
      共 {count} {voteUnit}
    </Typography.Text>
  );
}

export function VoteV2ResultsPanel({
  campaign,
  contestants,
  status,
}: {
  campaign: VoteV2Campaign;
  contestants: VoteV2Contestant[];
  status: VoteV2Status;
}) {
  const empty = voteV2DetailEmptyHint(status, contestants.length > 0);
  const rows = tallyVoteV2Results(contestants);
  const columns: TableColumnsType<VoteV2ResultRow> = [
    { title: '名次', dataIndex: 'rank', width: 80 },
    {
      title: '选项',
      key: 'option',
      render: (_, row) => (
        <Space>
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" width={32} height={32} style={{ objectFit: 'cover' }} />
          ) : null}
          <span>
            {voteV2SampleNo(row.optionNo)} {row.name}
          </span>
        </Space>
      ),
    },
    { title: '票数', dataIndex: 'voteCount', width: 88, align: 'right' },
    {
      title: '占比',
      key: 'percent',
      width: 88,
      align: 'right',
      render: (_, row) => (row.percent == null ? '—' : `${row.percent}%`),
    },
  ];
  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <VoteCountLabel count={rows.reduce((sum, row) => sum + row.voteCount, 0)} voteUnit={campaign.voteUnit} />
      {empty ? <Empty description={empty} /> : <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />}
    </Space>
  );
}

export function VoteV2RecordsPanel({
  campaign,
  contestants,
  casts,
  status,
}: {
  campaign: VoteV2Campaign;
  contestants: VoteV2Contestant[];
  casts: VoteV2Cast[];
  status: VoteV2Status;
}) {
  const { message } = App.useApp();
  const rows = listVoteV2CastRecords(casts, contestants, campaign.id);
  const empty = voteV2DetailEmptyHint(status, rows.length > 0);
  const columns: TableColumnsType<VoteV2RecordRow> = [
    { title: '姓名', dataIndex: 'userId', width: 100, ellipsis: true },
    { title: '部门', dataIndex: 'department', width: 120, ellipsis: true },
    { title: '投票时间', dataIndex: 'at', width: 180 },
    { title: '投票内容', dataIndex: 'optionName', ellipsis: true },
  ];
  const exportRows = () => {
    if (!rows.length) {
      message.warning('暂无投票可导出');
      return;
    }
    downloadVoteV2RecordExport(campaign.name, {
      selectMode: campaign.selectMode,
      contestants,
      rows,
    });
    message.success(`已导出 ${rows.length} 条投票记录`);
  };
  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Flex className="table-toolbar" justify="space-between" align="center">
        <Typography.Text>共 {rows.length} 条</Typography.Text>
        <Button icon={<DownloadOutlined />} onClick={exportRows}>
          导出
        </Button>
      </Flex>
      {empty ? (
        <Empty description={empty} />
      ) : (
        <Table rowKey="key" columns={columns} dataSource={rows} pagination={{ pageSize: 10, showSizeChanger: false }} />
      )}
    </Space>
  );
}
