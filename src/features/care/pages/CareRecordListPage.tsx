import { useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Drawer, Empty, Flex, Input, InputNumber, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { colleagueBlessingsFor, filterRecords, recordsToCsv, type CareRecord, type ColleagueBlessing, type RecordQuery } from '../model/care';
import { useRecords } from '../model/careStore';

const EMPTY: RecordQuery = {
  source: '系统关怀',
  ruleName: '',
  name: '',
  sender: '',
  department: '',
  points: '',
  pushDate: '',
  status: 'all',
};

type Draft = Omit<RecordQuery, 'pushDate'> & { pushDate: Dayjs | null };

export function CareRecordListPage() {
  const { message } = App.useApp();
  const rows = useRecords();
  const systemRows = useMemo(() => rows.filter((item) => item.source === '系统关怀'), [rows]);
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, pushDate: null });
  const [query, setQuery] = useState<RecordQuery>(EMPTY);
  const [blessingRecord, setBlessingRecord] = useState<CareRecord>();
  const filtered = useMemo(() => filterRecords(systemRows, query), [systemRows, query]);
  const blessings = blessingRecord ? colleagueBlessingsFor(blessingRecord.id) : [];
  const hasQuery = query.status !== 'all' || Boolean(query.ruleName.trim() || query.name.trim() || query.department || query.points || query.pushDate);
  const departments = Array.from(new Set(systemRows.map((item) => item.department))).sort((a, b) => a.localeCompare(b, 'zh-CN'));

  const toQuery = (state: Draft): RecordQuery => ({
    ...state,
    points: state.points,
    pushDate: state.pushDate ? state.pushDate.format('YYYY-MM-DD') : '',
  });

  const columns: TableColumnsType<CareRecord> = [
    { title: '关怀主题', dataIndex: 'ruleName', width: 160, ellipsis: true, render: (value: string) => <TableEllipsisText text={value} /> },
    { title: '发送人', dataIndex: 'sender', width: 110 },
    { title: '接收人', dataIndex: 'name', width: 110 },
    { title: '部门', dataIndex: 'department', width: 170 },
    { title: '关怀内容', dataIndex: 'content', width: 260, ellipsis: true, render: (value: string) => <TableEllipsisText text={value} /> },
    { title: '关怀积分', dataIndex: 'points', width: 110, align: 'right' },
    {
      title: '同事祝福',
      key: 'blessings',
      width: 110,
      align: 'right',
      render: (_, record) => {
        const count = colleagueBlessingsFor(record.id).length;
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {count ? (
              <Button type="link" style={{ paddingInline: 0, height: 'auto' }} aria-label={`查看${record.name}的同事祝福`} onClick={() => setBlessingRecord(record)}>
                {count}
              </Button>
            ) : (
              0
            )}
          </div>
        );
      },
    },
    { title: '发送时间', dataIndex: 'pushTime', width: 180 },
    { title: '发送状态', dataIndex: 'status', width: 100 },
  ];

  const blessingColumns: TableColumnsType<ColleagueBlessing> = [
    { title: '发送人', dataIndex: 'sender', width: 110 },
    { title: '部门', dataIndex: 'department', width: 160 },
    { title: '祝福内容', dataIndex: 'content', ellipsis: true, render: (value: string) => <TableEllipsisText text={value} /> },
    { title: '发送时间', dataIndex: 'pushTime', width: 180 },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['员工关怀', '关怀记录']} title="关怀记录" subtitle="查看系统发送的关怀，以及同事祝福次数。" />
      <SearchPanel
        onSearch={() => setQuery(toQuery(draft))}
        onReset={() => {
          setDraft({ ...EMPTY, pushDate: null });
          setQuery(EMPTY);
        }}
      >
        <SearchField label="关怀主题">
          <Input allowClear placeholder="请输入关怀主题" value={draft.ruleName} onChange={(event) => setDraft((current) => ({ ...current, ruleName: event.target.value }))} />
        </SearchField>
        <SearchField label="接收人">
          <Input allowClear placeholder="请输入接收人姓名" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </SearchField>
        <SearchField label="部门">
          <Select
            allowClear
            placeholder="请选择部门"
            value={draft.department || undefined}
            onChange={(value) => setDraft((current) => ({ ...current, department: value ?? '' }))}
            options={departments.map((item) => ({ value: item, label: item }))}
          />
        </SearchField>
        <SearchField label="关怀积分">
          <InputNumber min={0} precision={0} placeholder="请输入积分" style={{ width: '100%' }} value={draft.points ? Number(draft.points) : null} onChange={(value) => setDraft((current) => ({ ...current, points: value == null ? '' : String(value) }))} />
        </SearchField>
        <SearchField label="发送日期">
          <DatePicker style={{ width: '100%' }} placeholder="请选择发送日期" value={draft.pushDate} onChange={(value) => setDraft((current) => ({ ...current, pushDate: value }))} />
        </SearchField>
        <SearchField label="发送状态">
          <Select
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={[
              { value: 'all', label: '全部' },
              { value: '已发送', label: '已发送' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>{hasQuery ? `共找到 ${filtered.length} / ${systemRows.length} 条记录` : `共 ${systemRows.length} 条记录`}</span>
            <Button
              icon={<DownloadOutlined />}
              disabled={!filtered.length}
              onClick={() => {
                const blob = new Blob([`\uFEFF${recordsToCsv(filtered)}`], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = '关怀记录.csv';
                link.click();
                URL.revokeObjectURL(url);
                message.success('已导出关怀记录');
              }}
            >
              导出
            </Button>
          </Flex>
        }
      >
        <Table<CareRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1480 }}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          locale={{ emptyText: <Empty description={hasQuery ? '没有符合条件的关怀记录' : '暂无关怀记录'} /> }}
        />
      </ListTableCard>
      <Drawer
        title={blessingRecord ? `${blessingRecord.name}的同事祝福` : '同事祝福'}
        open={Boolean(blessingRecord)}
        width={720}
        destroyOnHidden
        onClose={() => setBlessingRecord(undefined)}
      >
        {blessingRecord ? (
          <p style={{ marginTop: 0 }}>
            {blessingRecord.ruleName} · 共 {blessings.length} 次
          </p>
        ) : null}
        <Table<ColleagueBlessing>
          rowKey="id"
          columns={blessingColumns}
          dataSource={blessings}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无同事祝福" /> }}
        />
      </Drawer>
    </div>
  );
}
