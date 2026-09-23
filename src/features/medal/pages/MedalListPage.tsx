import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Empty, Flex, Input, Select, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { getCategories } from '../../incentive/model/incentiveStore';
import { MEDAL_APPS, filterMedals, sortMedalsByCreatedAtDesc, type MedalApp, type MedalQuery, type MedalRecord, type MedalStatus } from '../model/medal';
import { getMedal, removeMedal, setMedalStatus, useMedals } from '../model/medalStore';
import { MedalFormModal } from './MedalFormModal';

const { RangePicker } = DatePicker;

type DraftQuery = {
  name: string;
  app: MedalApp | 'all';
  status: MedalStatus | 'all';
  range: [Dayjs, Dayjs] | null;
};

const EMPTY_QUERY: DraftQuery = { name: '', app: 'all', status: 'all', range: null };

const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

function toMedalQuery(state: DraftQuery): MedalQuery {
  return {
    name: state.name.trim(),
    app: state.app,
    status: state.status,
    from: state.range?.[0]?.format('YYYY-MM-DD') ?? '',
    to: state.range?.[1]?.format('YYYY-MM-DD') ?? '',
  };
}

export function MedalListPage({
  page,
  recordId,
  onNavigate,
}: {
  page: string;
  recordId?: string;
  onNavigate: (nextPage: string, nextRecordId?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const rows = useMedals();
  const [draft, setDraft] = useState<DraftQuery>(EMPTY_QUERY);
  const [query, setQuery] = useState<DraftQuery>(EMPTY_QUERY);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => sortMedalsByCreatedAtDesc(filterMedals(rows, toMedalQuery(query))),
    [rows, query],
  );

  const modalOpen = page === 'medal-create' || page === 'medal-edit';
  const editRecord = page === 'medal-edit' && recordId ? getMedal(recordId) : undefined;
  const hasActiveQuery = Boolean(query.name.trim() || query.app !== 'all' || query.status !== 'all' || query.range);

  useEffect(() => {
    if (page !== 'medal-edit') return;
    if (recordId && getMedal(recordId)) return;
    message.error('勋章不存在');
    onNavigate('medal-list');
  }, [page, recordId, message, onNavigate]);

  const toggleStatus = (record: MedalRecord) => {
    const next: MedalStatus = record.status === '有效' ? '失效' : '有效';
    modal.confirm({
      title: `确认将勋章「${record.name}」设为${next}？`,
      content: next === '失效' ? '失效后业务侧将不可再发放该勋章。' : '有效后业务侧可再次发放该勋章。',
      okText: next === '失效' ? '确认失效' : '确认有效',
      cancelText: '取消',
      onOk: () => {
        setMedalStatus(record.id, next);
        message.success(next === '失效' ? '已设为失效' : '已设为有效');
      },
    });
  };

  const removeOne = (record: MedalRecord) => {
    modal.confirm({
      title: `确认删除勋章「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        removeMedal(record.id);
        message.success('已删除勋章');
      },
    });
  };

  const columns: TableColumnsType<MedalRecord> = [
    {
      title: '勋章图标',
      dataIndex: 'imageUrl',
      width: 88,
      render: (value: string) =>
        value ? <img src={value} alt="" width={40} height={40} style={{ objectFit: 'cover', display: 'block' }} /> : '—',
    },
    {
      title: '勋章名称',
      dataIndex: 'name',
      width: 140,
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value} />,
    },
    {
      title: '勋章描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value.trim() ? value : '—'} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (value: MedalStatus) => <Tag color={value === '有效' ? 'success' : 'default'}>{value}</Tag>,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 110,
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value} />,
    },
    { title: '所属应用', dataIndex: 'app', width: 110 },
    {
      title: '类型',
      key: 'incentiveType',
      width: 110,
      render: (_, record) => record.incentiveType ?? '—',
    },
    {
      title: '分类',
      key: 'categoryId',
      width: 110,
      render: (_, record) => {
        if (!record.categoryId) return '—';
        return getCategories().find((item) => item.id === record.categoryId)?.name ?? '—';
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      align: 'right',
      fixed: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`勋章 ${record.name} 更多操作`}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑勋章 ${record.name}`,
              onClick: () => onNavigate('medal-edit', record.id),
            },
            {
              key: 'issue',
              label: '发放记录',
              ariaLabel: `发放记录 ${record.name}`,
              disabled: true,
              tooltip: '后续开放',
              onClick: () => {},
            },
            {
              key: 'status',
              label: record.status === '有效' ? '设为失效' : '设为有效',
              ariaLabel: `${record.status === '有效' ? '设为失效' : '设为有效'} ${record.name}`,
              onClick: () => toggleStatus(record),
            },
            {
              key: 'remove',
              label: '删除',
              ariaLabel: `删除勋章 ${record.name}`,
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
      <ListPageHeading paths={['勋章', '勋章管理']} title="勋章管理" subtitle="维护勋章素材，供活动、打卡等业务选用" />
      <SearchPanel
        onSearch={() => {
          setQuery({ ...draft, name: draft.name.trim() });
          setPageNum(1);
        }}
        onReset={() => {
          setDraft(EMPTY_QUERY);
          setQuery(EMPTY_QUERY);
          setPageNum(1);
        }}
      >
        <SearchField label="勋章名称">
          <Input
            allowClear
            placeholder="请输入勋章名称"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="所属应用">
          <Select
            value={draft.app}
            onChange={(value) => setDraft((current) => ({ ...current, app: value }))}
            options={[{ value: 'all' as const, label: '全部' }, ...MEDAL_APPS.map((item) => ({ value: item, label: item }))]}
          />
        </SearchField>
        <SearchField label="勋章状态">
          <Select
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={[
              { value: 'all', label: '全部' },
              { value: '有效', label: '有效' },
              { value: '失效', label: '失效' },
            ]}
          />
        </SearchField>
        <SearchField label="创建时间">
          <RangePicker
            value={draft.range}
            onChange={(value) => setDraft((current) => ({ ...current, range: (value as [Dayjs, Dayjs] | null) ?? null }))}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>共 {filtered.length} 条</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('medal-create')}>
              创建勋章
            </Button>
          </Flex>
        }
      >
        <Table<MedalRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1320 }}
          pagination={{
            current: pageNum,
            pageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (next, size) => {
              setPageNum(next);
              setPageSize(size);
            },
          }}
          locale={{ emptyText: <Empty description={hasActiveQuery ? '没有符合条件的勋章' : b2bStandards.table.emptyText} /> }}
        />
      </ListTableCard>
      <MedalFormModal
        open={modalOpen && (page !== 'medal-edit' || Boolean(editRecord))}
        mode={page === 'medal-edit' ? 'edit' : 'create'}
        record={editRecord}
        onCancel={() => onNavigate('medal-list')}
        onSaved={() => onNavigate('medal-list')}
      />
    </div>
  );
}
