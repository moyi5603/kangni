import { useMemo, useState } from 'react';
import { PlusOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { App, Badge, Button, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { LIVE_STATUS_OPTIONS, liveStatusOf, type LiveRecord, type LiveStatus } from '../model/live';
import { removeLive, useLives } from '../model/liveStore';

const STATUS_BADGE: Record<LiveStatus, 'processing' | 'warning' | 'default' | 'success'> = {
  预告: 'warning',
  直播中: 'processing',
  已结束: 'default',
  回放: 'success',
};

function LiveCover({ record }: { record: LiveRecord }) {
  if (record.coverUrl) {
    return <img src={record.coverUrl} alt={record.title} width={96} height={54} style={{ objectFit: 'cover', borderRadius: 6 }} />;
  }
  return (
    <div
      aria-hidden
      style={{
        width: 96,
        height: 54,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #2A56DE 0%, #6a8bff 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <VideoCameraOutlined style={{ fontSize: 20 }} />
    </div>
  );
}

export function LiveListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const rows = useLives();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<LiveStatus | 'all'>('all');
  const [query, setQuery] = useState<{ keyword: string; status: LiveStatus | 'all' }>({ keyword: '', status: 'all' });

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (query.status !== 'all' && liveStatusOf(item) !== query.status) return false;
        if (query.keyword && !item.title.includes(query.keyword)) return false;
        return true;
      }),
    [rows, query],
  );

  const removeOne = (record: LiveRecord) => {
    modal.confirm({
      title: `确认删除直播「${record.title}」？`,
      content: '删除后该直播的评论与观看记录将一并清除，且不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        removeLive(record.id);
        message.success('已删除直播');
      },
    });
  };

  const columns: TableColumnsType<LiveRecord> = [
    {
      title: '封面',
      key: 'cover',
      width: 112,
      render: (_, record) => <LiveCover record={record} />,
    },
    {
      title: '直播名称',
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('live-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    { title: '讲师', dataIndex: 'host', width: 120, ellipsis: true },
    {
      title: '直播时间',
      key: 'time',
      width: 300,
      render: (_, record) => `${record.startAt} ~ ${record.endAt.slice(11)}`,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const value = liveStatusOf(record);
        return <Badge status={STATUS_BADGE[value]} text={value} />;
      },
    },
    {
      title: '观看人数',
      dataIndex: 'viewers',
      width: 100,
      align: 'right',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      align: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`直播 ${record.title} 更多操作`}
          actions={[
            { key: 'detail', label: '详情', ariaLabel: `查看直播 ${record.title}`, onClick: () => onNavigate('live-detail', String(record.id)) },
            { key: 'edit', label: '编辑', ariaLabel: `编辑直播 ${record.title}`, onClick: () => onNavigate('live-edit', String(record.id)) },
            { key: 'remove', label: '删除', ariaLabel: `删除直播 ${record.title}`, danger: true, onClick: () => removeOne(record) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <ListPageHeading paths={['直播', '直播管理']} title="直播管理" subtitle="企业直播统一创建、分发与回看管理" />
      <SearchPanel
        onSearch={() => setQuery({ keyword: keyword.trim(), status })}
        onReset={() => {
          setKeyword('');
          setStatus('all');
          setQuery({ keyword: '', status: 'all' });
        }}
      >
        <SearchField label="直播名称">
          <Input allowClear placeholder="请输入直播名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </SearchField>
        <SearchField label="直播状态">
          <Select
            value={status}
            onChange={setStatus}
            options={[{ value: 'all' as const, label: '全部' }, ...LIVE_STATUS_OPTIONS.map((item) => ({ value: item, label: item }))]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('live-create')}>
            新建直播
          </Button>
        }
      >
        <Table<LiveRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </ListTableCard>
    </div>
  );
}
