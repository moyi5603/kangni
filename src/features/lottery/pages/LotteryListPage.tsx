import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Badge, Button, DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import {
  LOTTERY_AUDIENCE_KIND_OPTIONS,
  LOTTERY_FORM_OPTIONS,
  LOTTERY_STATUS_OPTIONS,
  canDeleteLottery,
  lotteryAudienceText,
  lotteryStatusOf,
  parseLotteryTime,
  type LotteryFormKind,
  type LotteryRecord,
  type LotteryStatus,
  type LotteryAudienceKind,
} from '../model/lottery';
import { removeLottery, setLotteryEnabled, useLotteries } from '../model/lotteryStore';

const { RangePicker } = DatePicker;

const STATUS_BADGE: Record<LotteryStatus, 'processing' | 'warning' | 'default' | 'error'> = {
  未开始: 'warning',
  进行中: 'processing',
  已结束: 'default',
  已停用: 'error',
};

type QueryState = {
  keyword: string;
  status: LotteryStatus | 'all';
  form: LotteryFormKind | 'all';
  audienceKind: LotteryAudienceKind | 'all';
  timeRange: [Dayjs, Dayjs] | null;
};

export function LotteryListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const rows = useLotteries();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<LotteryStatus | 'all'>('all');
  const [form, setForm] = useState<LotteryFormKind | 'all'>('all');
  const [audienceKind, setAudienceKind] = useState<LotteryAudienceKind | 'all'>('all');
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [query, setQuery] = useState<QueryState>({
    keyword: '',
    status: 'all',
    form: 'all',
    audienceKind: 'all',
    timeRange: null,
  });

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (query.status !== 'all' && lotteryStatusOf(item) !== query.status) return false;
        if (query.form !== 'all' && item.form !== query.form) return false;
        if (query.audienceKind !== 'all' && item.audienceKind !== query.audienceKind) return false;
        if (query.keyword && !item.title.includes(query.keyword)) return false;
        if (query.timeRange) {
          const start = parseLotteryTime(item.startAt);
          const end = parseLotteryTime(item.endAt);
          const qStart = query.timeRange[0].startOf('day').valueOf();
          const qEnd = query.timeRange[1].endOf('day').valueOf();
          if (end < qStart || start > qEnd) return false;
        }
        return true;
      }),
    [rows, query],
  );

  const removeOne = (record: LotteryRecord) => {
    modal.confirm({
      title: `确认删除抽奖「${record.title}」？`,
      content: '删除后中奖记录与参与记录将一并清除，且不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        removeLottery(record.id);
        message.success('已删除抽奖');
      },
    });
  };

  const toggleEnabled = (record: LotteryRecord) => {
    const next = !record.enabled;
    modal.confirm({
      title: next ? `确认启用抽奖「${record.title}」？` : `确认停用抽奖「${record.title}」？`,
      content: next ? '启用后将按活动时间恢复可抽状态。' : '停用后员工将无法继续抽奖。',
      okText: next ? '确认启用' : '确认停用',
      cancelText: '取消',
      onOk: () => {
        setLotteryEnabled(record.id, next);
        message.success(next ? '已启用抽奖' : '已停用抽奖');
      },
    });
  };

  const columns: TableColumnsType<LotteryRecord> = [
    {
      title: '抽奖名称',
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('lottery-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    { title: '抽奖形式', dataIndex: 'form', width: 110 },
    {
      title: '活动时间',
      key: 'time',
      width: 280,
      render: (_, record) => `${record.startAt} ~ ${record.endAt}`,
    },
    { title: '每日次数', dataIndex: 'dailyChance', width: 100, align: 'right' },
    {
      title: '奖品种数',
      key: 'prizeCount',
      width: 100,
      align: 'right',
      render: (_, record) => record.prizes.length,
    },
    {
      title: '参与人数',
      dataIndex: 'participants',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '参与范围',
      key: 'audience',
      width: 220,
      ellipsis: true,
      render: (_, record) => lotteryAudienceText(record),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const value = lotteryStatusOf(record);
        return <Badge status={STATUS_BADGE[value]} text={value} />;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      align: 'right',
      render: (_, record) => {
        const deletable = canDeleteLottery(record);
        return (
          <TableRowActions
            moreAriaLabel={`抽奖 ${record.title} 更多操作`}
            actions={[
              { key: 'detail', label: '详情', ariaLabel: `查看抽奖 ${record.title}`, onClick: () => onNavigate('lottery-detail', String(record.id)) },
              { key: 'edit', label: '编辑', ariaLabel: `编辑抽奖 ${record.title}`, onClick: () => onNavigate('lottery-edit', String(record.id)) },
              {
                key: 'toggle',
                label: record.enabled ? '停用' : '启用',
                ariaLabel: `${record.enabled ? '停用' : '启用'}抽奖 ${record.title}`,
                onClick: () => toggleEnabled(record),
              },
              {
                key: 'remove',
                label: '删除',
                ariaLabel: `删除抽奖 ${record.title}`,
                danger: true,
                disabled: !deletable,
                tooltip: deletable ? undefined : '仅未开始的抽奖可删除',
                onClick: () => removeOne(record),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div>
      <ListPageHeading paths={['抽奖', '抽奖管理']} title="抽奖管理" subtitle="配置抽奖玩法、奖品概率与参与范围" />
      <SearchPanel
        onSearch={() => setQuery({ keyword: keyword.trim(), status, form, audienceKind, timeRange })}
        onReset={() => {
          setKeyword('');
          setStatus('all');
          setForm('all');
          setAudienceKind('all');
          setTimeRange(null);
          setQuery({ keyword: '', status: 'all', form: 'all', audienceKind: 'all', timeRange: null });
        }}
      >
        <SearchField label="抽奖名称">
          <Input allowClear placeholder="请输入抽奖名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </SearchField>
        <SearchField label="状态">
          <Select
            value={status}
            onChange={setStatus}
            options={[{ value: 'all' as const, label: '全部' }, ...LOTTERY_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
        </SearchField>
        <SearchField label="抽奖形式">
          <Select
            value={form}
            onChange={setForm}
            options={[{ value: 'all' as const, label: '全部' }, ...LOTTERY_FORM_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
        </SearchField>
        <SearchField label="活动时间">
          <RangePicker value={timeRange} onChange={(value) => setTimeRange(value as [Dayjs, Dayjs] | null)} />
        </SearchField>
        <SearchField label="参与范围">
          <Select
            value={audienceKind}
            onChange={setAudienceKind}
            options={[{ value: 'all' as const, label: '全部' }, ...LOTTERY_AUDIENCE_KIND_OPTIONS]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('lottery-create')}>
            新建抽奖
          </Button>
        }
      >
        <Table<LotteryRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </ListTableCard>
    </div>
  );
}
