import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  DatePicker,
  Dropdown,
  Empty,
  Flex,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  canDeleteVote,
  deleteVoteBlockReason,
  resolveVoteStatus,
  voteStatuses,
  type VoteCampaign,
  type VoteStatus,
} from '../model/voting';
import { getVoteBallots, getVoteOptions, getVoteQuestions, getVoteResponses, removeVote, useVotes } from '../model/voteStore';
import { VoteShareModal } from '../components/VoteShareModal';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type VoteQuery = {
  name: string;
  status?: VoteStatus;
  startAt: DateRange;
  endAt: DateRange;
};

const emptyQuery: VoteQuery = { name: '', startAt: null, endAt: null };

const statusColor: Record<VoteStatus, string> = {
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

function inRange(value: string, range: DateRange) {
  if (!range || (!range[0] && !range[1])) return true;
  const t = dayjs(value);
  if (range[0] && t.isBefore(range[0], 'minute')) return false;
  if (range[1] && t.isAfter(range[1], 'minute')) return false;
  return true;
}

function nowStamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function VoteListPage({
  onNavigate,
}: {
  onNavigate: (page: string, recordId?: string, tab?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const data = useVotes();
  const now = nowStamp();
  const [draft, setDraft] = useState<VoteQuery>(emptyQuery);
  const [query, setQuery] = useState<VoteQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [shareRecord, setShareRecord] = useState<VoteCampaign | null>(null);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (query.name && !item.name.includes(query.name.trim())) return false;
      if (query.status && resolveVoteStatus(item, now) !== query.status) return false;
      if (!inRange(item.startAt, query.startAt)) return false;
      if (!inRange(item.endAt, query.endAt)) return false;
      return true;
    });
  }, [data, query, now]);

  const hasActiveQuery = Boolean(query.name || query.status || query.startAt || query.endAt);
  const clearSelection = () => setSelectedRowKeys([]);

  const deleteOne = (record: VoteCampaign) => {
    const status = resolveVoteStatus(record, now);
    const blocked = deleteVoteBlockReason(status);
    if (blocked) {
      message.info(blocked);
      return;
    }
    modal.confirm({
      title: `确认删除投票「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeVote(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success('已删除投票');
      },
    });
  };

  const batchDelete = () => {
    const selected = data.filter((item) => selectedRowKeys.includes(item.id));
    const deletable = selected.filter((item) => canDeleteVote(resolveVoteStatus(item, now)));
    const skipped = selected.length - deletable.length;
    if (!deletable.length) {
      message.info('所选投票均不可删除，仅未开始的投票可删');
      return;
    }
    modal.confirm({
      title: `确认删除 ${deletable.length} 项投票？`,
      content: skipped ? `将跳过 ${skipped} 项不可删除的投票。删除后不可恢复。` : '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        deletable.forEach((item) => removeVote(item.id));
        clearSelection();
        message.success(skipped ? `已删除 ${deletable.length} 项，跳过 ${skipped} 项` : `已删除 ${deletable.length} 项`);
      },
    });
  };

  const columns: TableColumnsType<VoteCampaign> = [
    {
      title: '投票名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="table-link table-link-ellipsis" onClick={() => onNavigate('vote-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = resolveVoteStatus(record, now);
        return <Tag color={statusColor[status]}>{status}</Tag>;
      },
    },
    { title: '开始时间', dataIndex: 'startAt', width: 180 },
    { title: '结束时间', dataIndex: 'endAt', width: 180 },
    {
      title: '题目数',
      key: 'questionCount',
      width: 88,
      align: 'right',
      render: (_, record) =>
        record.type === '普通投票' ? getVoteQuestions(record.id).length : getVoteOptions(record.id).length,
    },
    {
      title: '总票',
      key: 'ballotCount',
      width: 88,
      align: 'right',
      render: (_, record) =>
        record.type === '普通投票' ? getVoteResponses(record.id).length : getVoteBallots(record.id).length,
    },
    {
      title: '匿名',
      dataIndex: 'anonymous',
      width: 72,
      render: (value: boolean) => (value ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'action',
      width: 248,
      fixed: 'right',
      render: (_, record) => {
        const status = resolveVoteStatus(record, now);
        const visible = [
          { key: 'detail', label: '详情', onClick: () => onNavigate('vote-detail', String(record.id)) },
          ...(status !== '已结束'
            ? [{ key: 'edit', label: '编辑', onClick: () => onNavigate('vote-edit', String(record.id)) }]
            : []),
          { key: 'share', label: '分享', onClick: () => setShareRecord(record) },
        ];
        const more = canDeleteVote(status)
          ? [{ key: 'delete', label: '删除', danger: true as const, onClick: () => deleteOne(record) }]
          : [];
        return (
          <Space wrap={false}>
            {visible.map((action) => (
              <Button key={action.key} type="link" aria-label={`${action.label} ${record.name}`} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
            {more.length ? (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: more.map((action) => ({
                    key: action.key,
                    label: action.label,
                    danger: action.danger,
                    onClick: action.onClick,
                  })),
                }}
              >
                <Button type="link" aria-label={`更多操作 ${record.name}：${more.map((action) => action.label).join('、')}`}>
                  更多 <DownOutlined />
                </Button>
              </Dropdown>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['投票', '投票管理']} title="投票管理" subtitle="查询并维护投票活动。" />
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
        <SearchField label="投票名称">
          <Input
            allowClear
            placeholder="请输入投票名称"
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
            options={optionsOf(voteStatuses)}
          />
        </SearchField>
        <SearchField label="开始时间">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            value={draft.startAt}
            onChange={(value) => setDraft((current) => ({ ...current, startAt: value }))}
          />
        </SearchField>
        <SearchField label="结束时间">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            value={draft.endAt}
            onChange={(value) => setDraft((current) => ({ ...current, endAt: value }))}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('vote-create')}>
            创建投票
          </Button>
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
                <Button onClick={clearSelection}>取消选择</Button>
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
          <Empty description={hasActiveQuery ? '没有符合条件的投票' : b2bStandards.table.emptyText} />
        )}
      </ListTableCard>
      {shareRecord ? <VoteShareModal record={shareRecord} open onClose={() => setShareRecord(null)} /> : null}
    </div>
  );
}
