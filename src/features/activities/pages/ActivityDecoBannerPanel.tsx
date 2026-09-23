import { useEffect, useMemo, useState, type Key } from 'react';
import { Empty, Flex, Input, Modal, Select, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { DecoBannerPanel } from '../../../shared/decoration/DecoBannerPanel';
import {
  getActivityLifecycleStatus,
  lifecycleStatusColor,
  lifecycleStatuses,
  type Activity,
  type LifecycleStatus,
} from '../model/activity';
import { useActivities } from '../model/activityStore';
import { useCategories } from '../model/categoryStore';
import { type ActivityDecoBlock } from '../model/activityDecoration';

function activityIdFromLink(link: string): number | undefined {
  const match = /#\/c\/(?:h5|pc)\/(\d+)/.exec(link);
  return match ? Number(match[1]) : undefined;
}

type LinkQuery = { title: string; category: string; lifecycleStatus: LifecycleStatus | '' };

const emptyLinkQuery: LinkQuery = { title: '', category: '', lifecycleStatus: '' };

export function ActivityBannerLinkPickerBody({
  value,
  onPick,
  onSelectedChange,
}: {
  value: string;
  onPick: (link: string) => void;
  onSelectedChange?: (id: number | undefined) => void;
}) {
  const activities = useActivities();
  const categories = useCategories();
  const [draft, setDraft] = useState<LinkQuery>(emptyLinkQuery);
  const [query, setQuery] = useState<LinkQuery>(emptyLinkQuery);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(b2bStandards.table.pageSize);
  const [selectedKey, setSelectedKey] = useState<number | undefined>(() => activityIdFromLink(value));

  useEffect(() => {
    setSelectedKey(activityIdFromLink(value));
  }, [value]);

  useEffect(() => {
    onSelectedChange?.(selectedKey);
  }, [onSelectedChange, selectedKey]);

  const filtered = useMemo(() => {
    const rows = activities.filter(
      (item) =>
        (!query.title || item.title.includes(query.title)) &&
        (!query.category || item.category === query.category) &&
        (!query.lifecycleStatus || getActivityLifecycleStatus(item) === query.lifecycleStatus),
    );
    return [...rows].sort((left, right) => Number(right.pinned) - Number(left.pinned));
  }, [activities, query]);

  const hasActiveQuery = Boolean(query.title || query.category || query.lifecycleStatus);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: TableColumnsType<Activity> = [
    {
      title: '活动标题',
      dataIndex: 'title',
      width: 200,
      render: (text: string) => <TableEllipsisText text={text} />,
    },
    { title: '分类', dataIndex: 'category', width: 90, render: (text: string) => <TableEllipsisText text={text} /> },
    {
      title: '活动时间',
      key: 'activityTime',
      width: 260,
      render: (_, record) => <TableEllipsisText text={`${record.startAt} ~ ${record.endAt}`} />,
    },
    {
      title: '状态',
      key: 'lifecycleStatus',
      width: 100,
      render: (_, record) => {
        const status = getActivityLifecycleStatus(record);
        return <Tag color={lifecycleStatusColor[status]}>{status}</Tag>;
      },
    },
  ];

  const pick = (id: number) => onPick(`#/c/h5/${id}`);

  return (
    <div>
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          setPage(1);
        }}
        onReset={() => {
          setDraft(emptyLinkQuery);
          setQuery(emptyLinkQuery);
          setPage(1);
        }}
      >
        <SearchField label="活动标题">
          <Input
            allowClear
            placeholder="请输入活动标题"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </SearchField>
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="请选择分类"
            value={draft.category || undefined}
            options={categories.map((item) => ({ value: item.name, label: item.name }))}
            onChange={(category) => setDraft((current) => ({ ...current, category: category ?? '' }))}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="请选择状态"
            value={draft.lifecycleStatus || undefined}
            options={lifecycleStatuses.map((item) => ({ value: item, label: item }))}
            onChange={(lifecycleStatus) => setDraft((current) => ({ ...current, lifecycleStatus: lifecycleStatus ?? '' }))}
          />
        </SearchField>
      </SearchPanel>
      <Flex justify="space-between" align="center" style={{ margin: '16px 0 8px' }}>
        <Typography.Text type="secondary">共 {filtered.length} 条</Typography.Text>
      </Flex>
      <Table<Activity>
        rowKey="id"
        size="middle"
        sticky
        columns={columns}
        dataSource={paged}
        scroll={{ x: 640 }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedKey == null ? [] : [selectedKey],
          preserveSelectedRowKeys: b2bStandards.table.rowSelectionPreserve,
          onChange: (keys: Key[]) => setSelectedKey(keys[0] == null ? undefined : Number(keys[0])),
        }}
        onRow={(record) => ({
          onClick: () => setSelectedKey(record.id),
          onDoubleClick: () => pick(record.id),
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
          emptyText: <Empty description={hasActiveQuery ? '没有符合条件的活动' : b2bStandards.table.emptyText} />,
        }}
      />
    </div>
  );
}

export function ActivityBannerLinkPicker({
  open,
  value,
  onCancel,
  onOk,
}: {
  open: boolean;
  value: string;
  onCancel: () => void;
  onOk: (link: string) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<number | undefined>(() => activityIdFromLink(value));
  return (
    <Modal
      title="选择活动"
      open={open}
      width={800}
      destroyOnHidden
      okText="确认"
      cancelText="取消"
      okButtonProps={{ disabled: selectedKey == null }}
      onCancel={onCancel}
      onOk={() => {
        if (selectedKey == null) return;
        onOk(`#/c/h5/${selectedKey}`);
      }}
    >
      {open ? <ActivityBannerLinkPickerBody value={value} onPick={onOk} onSelectedChange={setSelectedKey} /> : null}
    </Modal>
  );
}

export function ActivityDecoBannerPanel({
  block,
  onChange,
}: {
  block: ActivityDecoBlock;
  onChange: (patch: Partial<ActivityDecoBlock>) => void;
}) {
  return (
    <DecoBannerPanel
      block={block}
      onChange={onChange}
      renderLinkPicker={(props) => <ActivityBannerLinkPicker {...props} />}
    />
  );
}

export { BannerPreview } from '../../../shared/decoration/DecoBannerPanel';
