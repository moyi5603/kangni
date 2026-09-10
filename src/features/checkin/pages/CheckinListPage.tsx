import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Badge, Button, DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import {
  CHECKIN_OWNER_APP_LABEL,
  CHECKIN_STATUS_OPTIONS,
  checkinStatusOf,
  parseCheckinTime,
  type CheckinOwnerApp,
  type CheckinStatus,
  type CheckinTheme,
} from '../model/checkin';
import { distinctCheckinUsers, removeTheme, useCheckinThemes } from '../model/checkinStore';

const { RangePicker } = DatePicker;

const STATUS_BADGE: Record<CheckinStatus, 'processing' | 'warning' | 'default'> = {
  未开始: 'warning',
  进行中: 'processing',
  已结束: 'default',
};

const OWNER_OPTIONS: { value: CheckinOwnerApp; label: string }[] = (
  Object.keys(CHECKIN_OWNER_APP_LABEL) as CheckinOwnerApp[]
).map((value) => ({ value, label: CHECKIN_OWNER_APP_LABEL[value] }));

type QueryState = {
  keyword: string;
  ownerApp: CheckinOwnerApp | 'all';
  status: CheckinStatus | 'all';
  timeRange: [Dayjs, Dayjs] | null;
};

const noopNavigate = (_page: string, _recordId?: string) => {};

export function CheckinListPage({
  onNavigate = noopNavigate,
  ownerApp,
}: {
  onNavigate?: (page: string, recordId?: string) => void;
  ownerApp?: CheckinOwnerApp;
}) {
  const { message, modal } = App.useApp();
  const rows = useCheckinThemes();
  const defaultOwner: CheckinOwnerApp | 'all' = ownerApp ?? 'all';
  const [keyword, setKeyword] = useState('');
  const [owner, setOwner] = useState<CheckinOwnerApp | 'all'>(defaultOwner);
  const [status, setStatus] = useState<CheckinStatus | 'all'>('all');
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [query, setQuery] = useState<QueryState>({
    keyword: '',
    ownerApp: defaultOwner,
    status: 'all',
    timeRange: null,
  });

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (query.ownerApp !== 'all' && item.ownerApp !== query.ownerApp) return false;
        if (query.status !== 'all' && checkinStatusOf(item) !== query.status) return false;
        if (query.keyword && !item.title.includes(query.keyword)) return false;
        if (query.timeRange) {
          const start = parseCheckinTime(item.startAt);
          const end = parseCheckinTime(item.endAt);
          const qStart = query.timeRange[0].startOf('day').valueOf();
          const qEnd = query.timeRange[1].endOf('day').valueOf();
          if (end < qStart || start > qEnd) return false;
        }
        return true;
      }),
    [rows, query],
  );

  const removeOne = (record: CheckinTheme) => {
    modal.confirm({
      title: `确认删除打卡「${record.title}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const result = removeTheme(record.id);
        if (!result.ok) {
          message.warning(result.reason);
          return;
        }
        message.success('已删除打卡');
      },
    });
  };

  const columns: TableColumnsType<CheckinTheme> = [
    {
      title: '主题名称',
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('checkin-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    {
      title: '所属应用',
      dataIndex: 'ownerApp',
      width: 120,
      render: (value: CheckinOwnerApp) => CHECKIN_OWNER_APP_LABEL[value],
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 160,
      ellipsis: true,
      render: (tags: string[]) => tags.join('、'),
    },
    {
      title: '起止时间',
      key: 'time',
      width: 280,
      render: (_, record) => `${record.startAt} ~ ${record.endAt}`,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const value = checkinStatusOf(record);
        return <Badge status={STATUS_BADGE[value]} text={value} />;
      },
    },
    {
      title: '打卡人数',
      key: 'checkins',
      width: 110,
      align: 'right',
      render: (_, record) => distinctCheckinUsers(record.id).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`打卡 ${record.title} 更多操作`}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑打卡 ${record.title}`,
              onClick: () => onNavigate('checkin-edit', String(record.id)),
            },
            {
              key: 'remove',
              label: '删除',
              ariaLabel: `删除打卡 ${record.title}`,
              danger: true,
              onClick: () => removeOne(record),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <ListPageHeading
        paths={['打卡', '打卡管理']}
        title="打卡管理"
        subtitle="配置打卡主题、奖励规则，并查看打卡与获奖记录。"
      />
      <SearchPanel
        onSearch={() => setQuery({ keyword: keyword.trim(), ownerApp: owner, status, timeRange })}
        onReset={() => {
          setKeyword('');
          setOwner(defaultOwner);
          setStatus('all');
          setTimeRange(null);
          setQuery({ keyword: '', ownerApp: defaultOwner, status: 'all', timeRange: null });
        }}
      >
        <SearchField label="主题名称">
          <Input allowClear placeholder="请输入主题名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </SearchField>
        <SearchField label="所属应用">
          <Select
            value={owner}
            onChange={setOwner}
            options={[{ value: 'all' as const, label: '全部' }, ...OWNER_OPTIONS]}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            value={status}
            onChange={setStatus}
            options={[{ value: 'all' as const, label: '全部' }, ...CHECKIN_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
        </SearchField>
        <SearchField label="起止时间">
          <RangePicker value={timeRange} onChange={(value) => setTimeRange(value as [Dayjs, Dayjs] | null)} />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('checkin-create')}>
            新建打卡
          </Button>
        }
      >
        <Table<CheckinTheme>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </ListTableCard>
    </div>
  );
}
