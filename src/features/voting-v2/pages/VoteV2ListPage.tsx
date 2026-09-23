import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Empty, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  canDeleteVoteV2,
  deleteVoteV2BlockReason,
  resolveVoteV2Status,
  sumVoteV2ContestantVotes,
  voteV2ManageTitle,
  voteV2Statuses,
  sortVoteV2CampaignsByPin,
  type VoteV2Campaign,
  type VoteV2Status,
} from '../model/voteV2';
import { getVoteV2Contestants, removeVoteV2, upsertVoteV2, useVoteV2Campaigns } from '../model/voteV2Store';
import { VoteV2ShareModal } from '../components/VoteV2ShareModal';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type VoteV2Query = {
  name: string;
  status?: VoteV2Status;
  timeRange: DateRange;
};

const emptyQuery: VoteV2Query = { name: '', timeRange: null };

const statusColor: Record<VoteV2Status, string> = {
  未开始: 'default',
  进行中: 'processing',
  已结束: 'success',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function overlaps(startAt: string, endAt: string, range: DateRange) {
  if (!range || (!range[0] && !range[1])) return true;
  const start = dayjs(startAt);
  const end = dayjs(endAt);
  if (range[0] && end.isBefore(range[0], 'minute')) return false;
  if (range[1] && start.isAfter(range[1], 'minute')) return false;
  return true;
}

function nowStamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function VoteV2ListPage({
  onNavigate,
}: {
  onNavigate: (page: string, recordId?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const data = useVoteV2Campaigns();
  const now = nowStamp();
  const [draft, setDraft] = useState<VoteV2Query>(emptyQuery);
  const [query, setQuery] = useState<VoteV2Query>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [shareRecord, setShareRecord] = useState<VoteV2Campaign | null>(null);

  const filtered = useMemo(() => {
    const rows = data.filter((item) => {
      if (query.name && !item.name.includes(query.name.trim())) return false;
      if (query.status && resolveVoteV2Status(item, now) !== query.status) return false;
      if (!overlaps(item.startAt, item.endAt, query.timeRange)) return false;
      return true;
    });
    return sortVoteV2CampaignsByPin(rows);
  }, [data, query, now]);

  const hasActiveQuery = Boolean(query.name || query.status || query.timeRange?.[0] || query.timeRange?.[1]);
  const clearSelection = () => setSelectedRowKeys([]);

  const togglePin = (record: VoteV2Campaign) => {
    upsertVoteV2({ ...record, pinned: !record.pinned });
    message.success(record.pinned ? `已取消置顶「${record.name}」` : `已置顶「${record.name}」`);
  };

  const deleteOne = (record: VoteV2Campaign) => {
    const status = resolveVoteV2Status(record, now);
    const blocked = deleteVoteV2BlockReason(status);
    if (blocked) {
      message.info(blocked);
      return;
    }
    modal.confirm({
      title: `确认删除活动「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeVoteV2(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success('已删除活动');
      },
    });
  };

  const batchDelete = () => {
    const selected = data.filter((item) => selectedRowKeys.includes(item.id));
    const deletable = selected.filter((item) => canDeleteVoteV2(resolveVoteV2Status(item, now)));
    const skipped = selected.length - deletable.length;
    if (!deletable.length) {
      message.info('所选活动均不可删除，仅未开始的活动可删');
      return;
    }
    modal.confirm({
      title: `确认删除 ${deletable.length} 项活动？`,
      content: skipped ? `将跳过 ${skipped} 项不可删除的活动。删除后不可恢复。` : '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        deletable.forEach((item) => removeVoteV2(item.id));
        clearSelection();
        message.success(skipped ? `已删除 ${deletable.length} 项，跳过 ${skipped} 项` : `已删除 ${deletable.length} 项`);
      },
    });
  };

  const voteRowActions = (record: VoteV2Campaign): TableRowAction[] => {
    const status = resolveVoteV2Status(record, now);
    const blocked = deleteVoteV2BlockReason(status);
    const manage = voteV2ManageTitle();
    return [
      {
        key: 'detail',
        label: '详情',
        ariaLabel: `详情 ${record.name}`,
        onClick: () => onNavigate('vote-v2-detail', String(record.id)),
      },
      {
        key: 'edit',
        label: '编辑',
        ariaLabel: `编辑 ${record.name}`,
        onClick: () => onNavigate('vote-v2-edit', String(record.id)),
      },
      {
        key: 'players',
        label: manage,
        ariaLabel: `${manage} ${record.name}`,
        onClick: () => onNavigate('vote-v2-players', String(record.id)),
      },
      {
        key: 'pin',
        label: record.pinned ? '取消置顶' : '置顶',
        ariaLabel: record.pinned ? `取消置顶 ${record.name}` : `置顶 ${record.name}`,
        onClick: () => togglePin(record),
      },
      {
        key: 'share',
        label: '分享',
        ariaLabel: `分享 ${record.name}`,
        onClick: () => setShareRecord(record),
      },
      {
        key: 'delete',
        label: '删除',
        ariaLabel: `删除 ${record.name}`,
        onClick: () => {
          if (blocked) return;
          deleteOne(record);
        },
        danger: true,
        disabled: Boolean(blocked),
        tooltip: blocked ?? undefined,
      },
    ];
  };

  const columns: TableColumnsType<VoteV2Campaign> = [
    { title: '名称', dataIndex: 'name', ellipsis: true, render: (name: string, record) => (
        <Space>
          {record.pinned ? <Tag color="blue">置顶</Tag> : null}
          <Button type="link" aria-label={`详情 ${name}`} onClick={() => onNavigate('vote-v2-detail', String(record.id))}>
            {name}
          </Button>
        </Space>
      ) },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = resolveVoteV2Status(record, now);
        return <Tag color={statusColor[status]}>{status}</Tag>;
      },
    },
    {
      title: '选项数',
      key: 'optionCount',
      width: 88,
      render: (_, record) => getVoteV2Contestants(record.id).length,
    },
    {
      title: '投票数',
      key: 'voteCount',
      width: 88,
      render: (_, record) => sumVoteV2ContestantVotes(getVoteV2Contestants(record.id)),
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      width: 88,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 100,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      ellipsis: true,
    },
    {
      title: '投票时间',
      key: 'time',
      width: 340,
      ellipsis: true,
      render: (_, record) => `${record.startAt} ～ ${record.endAt}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      align: 'right',
      render: (_, record) => (
        <TableRowActions moreAriaLabel={`更多操作 ${record.name}`} actions={voteRowActions(record)} />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['投票', '投票管理']} title="投票管理" subtitle="创建评选活动，配置规则后保存发布" />
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          clearSelection();
          message.success('查询完成');
        }}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
          clearSelection();
        }}
      >
        <SearchField label="名称">
          <Input
            allowClear
            placeholder="请输入名称"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={optionsOf(voteV2Statuses)}
          />
        </SearchField>
        <SearchField label="投票时间">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            value={draft.timeRange}
            onChange={(value) => setDraft((current) => ({ ...current, timeRange: value }))}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <>
            <Typography.Text>共 {filtered.length} 项</Typography.Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('vote-v2-create')}>
              新增
            </Button>
          </>
        }
        batchToolbar={
          selectedRowKeys.length > 0 ? (
            <Flex className="batch-toolbar" justify="space-between" align="center">
              <Typography.Text>
                已选择 <strong>{selectedRowKeys.length}</strong> 项
              </Typography.Text>
              <Space>
                <Button danger onClick={batchDelete}>
                  批量删除
                </Button>
                <Button onClick={clearSelection}>
                  取消选择
                </Button>
              </Space>
            </Flex>
          ) : null
        }
      >
        {filtered.length ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1280 }}
            rowSelection={{
              selectedRowKeys,
              preserveSelectedRowKeys: true,
              onChange: setSelectedRowKeys,
            }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        ) : (
          <Empty
            description={hasActiveQuery ? '没有符合条件的活动' : b2bStandards.table.emptyText}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {hasActiveQuery ? null : (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('vote-v2-create')}>
                新增
              </Button>
            )}
          </Empty>
        )}
      </ListTableCard>
      {shareRecord ? <VoteV2ShareModal record={shareRecord} open onClose={() => setShareRecord(null)} /> : null}
    </div>
  );
}
