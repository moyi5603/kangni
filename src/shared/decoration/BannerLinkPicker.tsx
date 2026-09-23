import { useEffect, useMemo, useState, type Key } from 'react';
import { Empty, Flex, Input, Modal, Select, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchField, SearchPanel } from '../ui/ListPage';
import { TableEllipsisText } from '../ui/TableEllipsisText';
import { b2bStandards } from '../design-system/generated/b2b-standards.generated';

export type BannerLinkRow = {
  id: number;
  title: string;
  category: string;
  time: string;
  status: string;
  statusColor?: string;
  link: string;
};

type Query = { title: string; category: string; status: string };

const emptyQuery: Query = { title: '', category: '', status: '' };

export function BannerLinkPicker({
  open,
  value,
  noun,
  nameColumn,
  rows,
  categoryOptions,
  statusOptions,
  onCancel,
  onOk,
}: {
  open: boolean;
  value: string;
  noun: string;
  nameColumn: string;
  rows: BannerLinkRow[];
  categoryOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  onCancel: () => void;
  onOk: (link: string) => void;
}) {
  const [draft, setDraft] = useState<Query>(emptyQuery);
  const [query, setQuery] = useState<Query>(emptyQuery);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(b2bStandards.table.pageSize);
  const [selectedLink, setSelectedLink] = useState(value);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyQuery);
    setQuery(emptyQuery);
    setPage(1);
    setPageSize(b2bStandards.table.pageSize);
    setSelectedLink(value);
  }, [open, value]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (item) =>
          (!query.title || item.title.includes(query.title)) &&
          (!query.category || item.category === query.category) &&
          (!query.status || item.status === query.status),
      ),
    [query, rows],
  );
  const hasActiveQuery = Boolean(query.title || query.category || query.status);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedRow = rows.find((item) => item.link === selectedLink);

  const columns: TableColumnsType<BannerLinkRow> = [
    {
      title: nameColumn,
      dataIndex: 'title',
      width: 200,
      render: (text: string) => <TableEllipsisText text={text} />,
    },
    { title: '分类', dataIndex: 'category', width: 110, render: (text: string) => <TableEllipsisText text={text} /> },
    {
      title: '时间',
      dataIndex: 'time',
      width: 260,
      render: (text: string) => <TableEllipsisText text={text} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string, record) => <Tag color={record.statusColor}>{status}</Tag>,
    },
  ];

  return (
    <Modal
      title={`选择${noun}`}
      open={open}
      width={800}
      destroyOnHidden
      okText="确认"
      cancelText="取消"
      okButtonProps={{ disabled: !selectedRow }}
      onCancel={onCancel}
      onOk={() => {
        if (!selectedRow) return;
        onOk(selectedRow.link);
      }}
    >
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          setPage(1);
        }}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
          setPage(1);
        }}
      >
        <SearchField label={nameColumn}>
          <Input
            allowClear
            placeholder={`请输入${nameColumn}`}
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </SearchField>
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="请选择分类"
            value={draft.category || undefined}
            options={categoryOptions}
            onChange={(category) => setDraft((current) => ({ ...current, category: category ?? '' }))}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="请选择状态"
            value={draft.status || undefined}
            options={statusOptions}
            onChange={(status) => setDraft((current) => ({ ...current, status: status ?? '' }))}
          />
        </SearchField>
      </SearchPanel>
      <Flex justify="space-between" align="center" style={{ margin: '16px 0 8px' }}>
        <Typography.Text type="secondary">共 {filtered.length} 条</Typography.Text>
      </Flex>
      <Table<BannerLinkRow>
        rowKey="id"
        size="middle"
        sticky
        columns={columns}
        dataSource={paged}
        scroll={{ x: 640 }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedRow ? [selectedRow.id] : [],
          preserveSelectedRowKeys: b2bStandards.table.rowSelectionPreserve,
          onChange: (_keys: Key[], selected) => setSelectedLink(selected[0]?.link ?? ''),
        }}
        onRow={(record) => ({
          onClick: () => setSelectedLink(record.link),
          onDoubleClick: () => onOk(record.link),
        })}
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          showSizeChanger: b2bStandards.table.showSizeChanger,
          pageSizeOptions: b2bStandards.table.pageSizeOptions.map(String),
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
        locale={{
          emptyText: <Empty description={hasActiveQuery ? `没有符合条件的${noun}` : b2bStandards.table.emptyText} />,
        }}
      />
    </Modal>
  );
}
