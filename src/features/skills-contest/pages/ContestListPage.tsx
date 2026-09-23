import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Badge, Button, Flex, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  CONTEST_STATUS_OPTIONS,
  contestAccessLabel,
  contestStatusOf,
  formatContestTimeRange,
  type Contest,
  type ContestAccess,
  type ContestStatus,
} from '../model/contest';
import { removeContest, useContests } from '../model/contestStore';

const STATUS_BADGE: Record<ContestStatus, 'processing' | 'warning' | 'default'> = {
  未开始: 'warning',
  进行中: 'processing',
  已结束: 'default',
};

export function ContestListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string, tab?: string) => void }) {
  const { message, modal } = App.useApp();
  const rows = useContests();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ContestStatus | 'all'>('all');
  const [access, setAccess] = useState<ContestAccess | 'all'>('all');
  const [query, setQuery] = useState({ keyword: '', status: 'all' as ContestStatus | 'all', access: 'all' as ContestAccess | 'all' });

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (query.status !== 'all' && contestStatusOf(item) !== query.status) return false;
        if (query.access !== 'all' && item.access !== query.access) return false;
        if (query.keyword && !item.name.includes(query.keyword)) return false;
        return true;
      }),
    [rows, query],
  );

  const removeOne = (record: Contest) => {
    modal.confirm({
      title: `确认删除大赛「${record.name}」？`,
      content: '删除后该大赛的报名记录将一并清除，且不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        removeContest(record.id);
        message.success('已删除大赛');
      },
    });
  };

  const columns: TableColumnsType<Contest> = [
    {
      title: '大赛名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Flex align="center" gap={8}>
          {record.logoUrl ? <img src={record.logoUrl} alt="" width={32} height={32} style={{ objectFit: 'cover', borderRadius: 4 }} /> : null}
          <Button type="link" className="table-link" onClick={() => onNavigate('contest-detail', String(record.id))}>
            {value}
          </Button>
        </Flex>
      ),
    },
    {
      title: '举办时间',
      key: 'time',
      width: 300,
      render: (_, record) => formatContestTimeRange(record.startAt, record.endAt),
    },
    {
      title: '阶段数',
      key: 'stages',
      width: 88,
      align: 'right',
      render: (_, record) => record.stages.length,
    },
    {
      title: '可见范围',
      dataIndex: 'access',
      width: 120,
      render: (value: ContestAccess) => contestAccessLabel(value),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const value = contestStatusOf(record);
        return <Badge status={STATUS_BADGE[value]} text={value} />;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`大赛 ${record.name} 更多操作`}
          actions={[
            {
              key: 'detail',
              label: '详情',
              ariaLabel: `查看大赛 ${record.name}`,
              onClick: () => onNavigate('contest-detail', String(record.id)),
            },
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑大赛 ${record.name}`,
              onClick: () => onNavigate('contest-edit', String(record.id)),
            },
            {
              key: 'remove',
              label: '删除',
              ariaLabel: `删除大赛 ${record.name}`,
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
      <ListPageHeading paths={['技能大赛', '赛事管理']} title="赛事管理" subtitle="配置大赛信息、报名收集、阶段闯关与页面可见范围。" />
      <SearchPanel
        onSearch={() => setQuery({ keyword: keyword.trim(), status, access })}
        onReset={() => {
          setKeyword('');
          setStatus('all');
          setAccess('all');
          setQuery({ keyword: '', status: 'all', access: 'all' });
        }}
      >
        <SearchField label="大赛名称">
          <Input allowClear placeholder="请输入大赛名称" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </SearchField>
        <SearchField label="状态">
          <Select
            value={status}
            onChange={setStatus}
            options={[{ value: 'all' as const, label: '全部' }, ...CONTEST_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
        </SearchField>
        <SearchField label="可见范围">
          <Select
            value={access}
            onChange={setAccess}
            options={[
              { value: 'all', label: '全部' },
              { value: 'tenant', label: '仅租户成员' },
              { value: 'public', label: '公开' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>共 {filtered.length} 条</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('contest-create')}>
              新建赛事
            </Button>
          </Flex>
        }
      >
        <Table<Contest>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: b2bStandards.table.pageSize, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 960 }}
        />
      </ListTableCard>
    </div>
  );
}
