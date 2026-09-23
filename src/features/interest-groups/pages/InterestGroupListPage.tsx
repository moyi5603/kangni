import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Image,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { ListViewSegmented } from '../../../shared/ui/ListViewSegmented';
import { MediaEntityCardGrid } from '../../../shared/ui/MediaEntityCardGrid';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  INTEREST_GROUP_LIST_VIEW_KEY,
  readListViewMode,
  writeListViewMode,
  type ListViewMode,
} from '../../../shared/ui/listViewMode';
import { InterestGroupFormDrawer } from '../components/InterestGroupFormDrawer';
import { InterestGroupReviewModal } from '../components/InterestGroupReviewModal';
import {
  canReviewInterestGroup,
  canPublishInterestGroup,
  canRevokeInterestGroup,
  interestGroupEntityAuditStatusColor,
  interestGroupEntityAuditStatuses,
  type InterestGroup,
  type InterestGroupEntityAuditStatus,
  type InterestGroupPublishStatus,
} from '../model/interestGroup';
import { interestGroupPublishStatuses, interestGroupPublishStatusColor } from '../model/interestGroupActivity';
import { buildInterestGroupCategoryOptions, getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import {
  canDeleteInterestGroup,
  countDetachableActivities,
  deleteInterestGroup,
  moveInterestGroup,
  publishInterestGroups,
  toggleInterestGroupPin,
  unpublishInterestGroups,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';
import { comparePinSort, pinSortMoveState } from '../model/pinSort';

type GroupQuery = {
  name: string;
  categoryKey?: string;
  auditStatus?: InterestGroupEntityAuditStatus;
  publishStatus?: InterestGroupPublishStatus;
};

const emptyQuery: GroupQuery = { name: '' };

type InterestGroupListPageProps = {
  onNavigate: (page: string, recordId?: string) => void;
};

export function InterestGroupListPage({ onNavigate }: InterestGroupListPageProps) {
  const { message, modal } = App.useApp();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const [draft, setDraft] = useState<GroupQuery>(emptyQuery);
  const [query, setQuery] = useState<GroupQuery>(emptyQuery);
  const [view, setView] = useState<ListViewMode>(() => readListViewMode(INTEREST_GROUP_LIST_VIEW_KEY));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(b2bStandards.table.pageSize);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InterestGroup>();
  const [reviewing, setReviewing] = useState<InterestGroup>();

  const categoryOptions = useMemo(
    () => buildInterestGroupCategoryOptions(categories, { includeUncategorized: true }),
    [categories],
  );

  const filtered = useMemo(
    () =>
      groups
        .filter((item) => {
          if (query.name && !item.name.includes(query.name)) return false;
          if (query.categoryKey && item.categoryKey !== query.categoryKey) return false;
          if (query.auditStatus && item.auditStatus !== query.auditStatus) return false;
          if (query.publishStatus && item.publishStatus !== query.publishStatus) return false;
          return true;
        })
        .sort(comparePinSort),
    [groups, query],
  );

  const setListView = (next: ListViewMode) => {
    setView(next);
    writeListViewMode(INTEREST_GROUP_LIST_VIEW_KEY, next);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page, pageSize]);

  const openEditor = (record?: InterestGroup) => {
    setEditing(record);
    setEditorOpen(true);
  };

  const tryDelete = (record: InterestGroup) => {
    if (!canDeleteInterestGroup(record.id)) {
      message.warning('存在进行中的活动，无法删除兴趣圈');
      return;
    }
    const result = deleteInterestGroup(record.id);
    if (!result.ok) {
      message.warning('存在进行中的活动，无法删除兴趣圈');
      return;
    }
    message.success('兴趣圈已删除');
  };

  const deleteConfirmText = (record: InterestGroup) => {
    const count = countDetachableActivities(record.id);
    if (count > 0) {
      return `确认删除兴趣圈「${record.name}」？${count} 个活动将变为未归属兴趣圈，删除后不可恢复。`;
    }
    return `确认删除兴趣圈「${record.name}」？删除后不可恢复。`;
  };

  const hasQuery = Boolean(query.name || query.categoryKey || query.auditStatus || query.publishStatus);

  const publishOne = (record: InterestGroup) => {
    if (!canPublishInterestGroup(record)) {
      message.info(`「${record.name}」已发布`);
      return;
    }
    publishInterestGroups([record.id]);
    message.success(`已发布「${record.name}」`);
  };

  const revokeOne = (record: InterestGroup) => {
    if (!canRevokeInterestGroup(record)) {
      message.info(`「${record.name}」未发布，无需撤销`);
      return;
    }
    modal.confirm({
      title: `确认撤销「${record.name}」的发布？`,
      content: '撤销后兴趣圈不再对其他员工可见。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        unpublishInterestGroups([record.id]);
        message.success(`已撤销「${record.name}」`);
      },
    });
  };

  const publishAction = (record: InterestGroup): TableRowAction =>
    canRevokeInterestGroup(record)
      ? {
          key: 'revoke',
          label: '撤销',
          ariaLabel: `撤销 ${record.name}`,
          onClick: () => revokeOne(record),
        }
      : {
          key: 'publish',
          label: '发布',
          ariaLabel: `发布 ${record.name}`,
          onClick: () => publishOne(record),
        };

  const groupRowActions = (record: InterestGroup): TableRowAction[] => {
    const deletable = canDeleteInterestGroup(record.id);
    const actions: TableRowAction[] = [
      {
        key: 'detail',
        label: '详情',
        ariaLabel: `详情 ${record.name}`,
        onClick: () => onNavigate('interest-group-detail', String(record.id)),
      },
      {
        key: 'edit',
        label: '编辑',
        ariaLabel: `编辑 ${record.name}`,
        onClick: () => openEditor(record),
      },
    ];
    if (canReviewInterestGroup(record)) {
      actions.push({
        key: 'review',
        label: '审核',
        ariaLabel: `审核 ${record.name}`,
        onClick: () => setReviewing(record),
      });
    }
    actions.push(publishAction(record));
    const move = pinSortMoveState(filtered, record.id);
    actions.push({
      key: 'pin',
      label: record.pinned ? '取消置顶' : '置顶',
      ariaLabel: record.pinned ? `取消置顶 ${record.name}` : `置顶 ${record.name}`,
      onClick: () => {
        toggleInterestGroupPin(record.id);
        message.success(record.pinned ? `已取消置顶「${record.name}」` : `已置顶「${record.name}」`);
      },
    });
    if (move.canMove) {
      actions.push(
        {
          key: 'up',
          label: '上移',
          ariaLabel: `上移 ${record.name}`,
          disabled: move.upDisabled,
          onClick: () => {
            if (moveInterestGroup(record.id, 'up', filtered)) message.success('已上移');
          },
        },
        {
          key: 'down',
          label: '下移',
          ariaLabel: `下移 ${record.name}`,
          disabled: move.downDisabled,
          onClick: () => {
            if (moveInterestGroup(record.id, 'down', filtered)) message.success('已下移');
          },
        },
      );
    }
    actions.push({
      key: 'delete',
      label: '删除',
      ariaLabel: `删除 ${record.name}`,
      onClick: () => {
        if (!deletable) return;
        modal.confirm({
          title: deleteConfirmText(record),
          okText: '确认',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: () => tryDelete(record),
        });
      },
      danger: true,
      disabled: !deletable,
      tooltip: deletable ? undefined : '存在进行中的活动，无法删除兴趣圈',
    });
    return actions;
  };

  const columns: TableColumnsType<InterestGroup> = [
    {
      title: '兴趣圈名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Space>
          <Image
            src={record.coverUrl}
            alt={value}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            preview={false}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23f0f0f0' width='48' height='48'/%3E%3C/svg%3E"
          />
          {record.pinned ? <Tag color="blue">置顶</Tag> : null}
          <Button type="link" className="table-link" onClick={() => onNavigate('interest-group-detail', String(record.id))}>
            {value}
          </Button>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryKey',
      width: 110,
      render: (value: string) => {
        const label = getInterestGroupCategoryLabel(value, categories);
        return value ? <Tag>{label}</Tag> : '—';
      },
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      width: 110,
      render: (value: InterestGroupEntityAuditStatus) => (
        <Tag color={interestGroupEntityAuditStatusColor[value]}>{value}</Tag>
      ),
    },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      width: 110,
      render: (value: InterestGroupPublishStatus) => (
        <Tag color={interestGroupPublishStatusColor[value]}>{value}</Tag>
      ),
    },
    { title: '兴趣圈负责人', dataIndex: 'leadName', width: 160 },
    { title: '成员数', dataIndex: 'memberCount', width: 88, align: 'right' },
    { title: '活动数', dataIndex: 'activityCount', width: 88, align: 'right' },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      align: 'right',
      render: (_, record) => (
        <TableRowActions moreAriaLabel={`更多操作 ${record.name}`} actions={groupRowActions(record)} />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['兴趣圈', '兴趣圈管理']} title="兴趣圈管理" subtitle="维护兴趣圈基础信息与成员规模。员工从 C 端创建的兴趣圈按规则进入审核。" />
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
        <SearchField label="兴趣圈名称">
          <Input
            allowClear
            placeholder="请输入兴趣圈名称"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="全部分类"
            value={draft.categoryKey}
            onChange={(value) => setDraft((current) => ({ ...current, categoryKey: value }))}
            options={categoryOptions}
          />
        </SearchField>
        <SearchField label="审核状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.auditStatus}
            onChange={(value) => setDraft((current) => ({ ...current, auditStatus: value }))}
            options={interestGroupEntityAuditStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
        <SearchField label="发布状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.publishStatus}
            onChange={(value) => setDraft((current) => ({ ...current, publishStatus: value }))}
            options={interestGroupPublishStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Typography.Text>共 {filtered.length} 条</Typography.Text>
          <Space>
            <ListViewSegmented value={view} onChange={setListView} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
              新建兴趣圈
            </Button>
          </Space>
        </div>
        {view === 'list' ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1280 }}
            locale={{ emptyText: <Empty description={hasQuery ? '没有匹配的兴趣圈' : '暂无兴趣圈'} /> }}
            pagination={{
              current: page,
              pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (nextPage, nextSize) => {
                setPage(nextPage);
                setPageSize(nextSize);
              },
            }}
          />
        ) : (
          <MediaEntityCardGrid
            emptyDescription={hasQuery ? '没有匹配的兴趣圈' : '暂无兴趣圈'}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
            items={filtered.slice((page - 1) * pageSize, page * pageSize).map((record) => ({
              key: record.id,
              coverUrl: record.coverUrl,
              title: record.name,
              summary: record.intro,
              statusLabel: record.publishStatus,
              statusColor: interestGroupPublishStatusColor[record.publishStatus],
              extra: (
                <Space size={4}>
                  {record.pinned ? <Tag color="blue">置顶</Tag> : null}
                  <Tag color={interestGroupEntityAuditStatusColor[record.auditStatus]}>{record.auditStatus}</Tag>
                  <Tag>{getInterestGroupCategoryLabel(record.categoryKey, categories) || '未分类'}</Tag>
                </Space>
              ),
              actions: groupRowActions(record),
              onOpen: () => onNavigate('interest-group-detail', String(record.id)),
            }))}
          />
        )}
      </Card>
      <InterestGroupFormDrawer open={editorOpen} record={editing} onClose={() => setEditorOpen(false)} />
      <InterestGroupReviewModal group={reviewing} open={Boolean(reviewing)} onClose={() => setReviewing(undefined)} />
    </div>
  );
}
