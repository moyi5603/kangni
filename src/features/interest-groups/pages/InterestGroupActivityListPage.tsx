import { useEffect, useMemo, useState, type FC, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { InterestGroupActivityCardGrid } from '../components/InterestGroupActivityCardGrid';
import { buildInterestGroupActivityRowActions } from '../components/buildInterestGroupActivityRowActions';
import { ListViewSegmented } from '../../../shared/ui/ListViewSegmented';
import {
  readInterestGroupActivityListView,
  writeInterestGroupActivityListView,
  type InterestGroupActivityListView,
} from '../model/interestGroupActivityListView';
import {
  canDeleteInterestGroupActivity,
  canRevokeInterestGroupActivity,
  revokeInterestGroupActivityBlockReason,
  formatInterestGroupActivityTime,
  getInterestGroupLifecycleStatus,
  interestGroupActivityTypeLabels,
  interestGroupLifecycleStatuses,
  interestGroupPublishStatuses,
  interestGroupPublishStatusColor,
  lifecycleStatusColor,
  type InterestGroupActivity,
  type InterestGroupActivityType,
  type InterestGroupPublishStatus,
} from '../model/interestGroupActivity';
import type { LifecycleStatus } from '../../activities/model/activity';
import { buildInterestGroupCategoryOptions, getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import { InterestGroupActivityAiModal } from '../components/InterestGroupActivityAiModal';
import { setPendingAiActivityDraft } from '../model/interestGroupActivityPlan';
import {
  patchInterestGroupActivities,
  publishInterestGroupActivities,
  toggleInterestGroupActivityPin,
  moveInterestGroupActivity,
  closeInterestGroupSignup,
  reopenInterestGroupSignup,
  deleteInterestGroupActivity,
  terminateInterestGroupActivity,
  unpublishInterestGroupActivities,
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';
import { comparePinSort, pinSortMoveState } from '../model/pinSort';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type Query = {
  title: string;
  groupId?: number | 'unassigned';
  type?: InterestGroupActivityType;
  categoryKey?: string;
  publishStatus?: InterestGroupPublishStatus;
  lifecycleStatus?: LifecycleStatus;
  activityTime: DateRange;
  createdAt: DateRange;
  publishedAt: DateRange;
};

const emptyQuery: Query = { title: '', activityTime: null, createdAt: null, publishedAt: null };

function inDayRange(value: string, range: DateRange) {
  if (!value) return !range?.[0] && !range?.[1];
  if (!range?.[0] && !range?.[1]) return true;
  const time = dayjs(value);
  if (range[0] && time.isBefore(range[0].startOf('day'))) return false;
  if (range[1] && time.isAfter(range[1].endOf('day'))) return false;
  return true;
}

function overlapsRange(startAt: string, endAt: string, range: DateRange) {
  if (!range?.[0] && !range?.[1]) return true;
  if (!startAt && !endAt) return true;
  const start = dayjs(startAt || endAt);
  const end = dayjs(endAt || startAt);
  if (range[0] && end.isBefore(range[0])) return false;
  if (range[1] && start.isAfter(range[1].endOf('day'))) return false;
  return true;
}

function confirmFooter(_: ReactNode, extra: { OkBtn: FC; CancelBtn: FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function groupLabel(groupId: number | null, names: Map<number, string>) {
  if (groupId == null) return '未归属兴趣圈';
  return names.get(groupId) ?? '未归属兴趣圈';
}

export function InterestGroupActivityListPage({
  groupId,
  onNavigate,
}: {
  groupId?: number;
  onNavigate: (page: string, recordId?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const activities = useInterestGroupActivities();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const [draft, setDraft] = useState<Query>(emptyQuery);
  const [query, setQuery] = useState<Query>(emptyQuery);
  const [view, setView] = useState<InterestGroupActivityListView>(() => readInterestGroupActivityListView());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(b2bStandards.table.pageSize);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm] = Form.useForm<{ categoryKey: string }>();
  const groupNames = useMemo(() => new Map(groups.map((item) => [item.id, item.name])), [groups]);
  const categoryOptions = useMemo(
    () => buildInterestGroupCategoryOptions(categories, { includeUncategorized: true }),
    [categories],
  );

  const filtered = useMemo(() => {
    const rows = activities.filter((item) => {
      if (groupId != null && item.groupId !== groupId) return false;
      if (groupId == null && query.groupId === 'unassigned' && item.groupId != null) return false;
      if (groupId == null && typeof query.groupId === 'number' && item.groupId !== query.groupId) return false;
      if (query.type && item.type !== query.type) return false;
      if (query.categoryKey && item.categoryKey !== query.categoryKey) return false;
      if (query.publishStatus && item.publishStatus !== query.publishStatus) return false;
      if (query.lifecycleStatus && getInterestGroupLifecycleStatus(item) !== query.lifecycleStatus) return false;
      if (!overlapsRange(item.startAt ?? '', item.endAt ?? '', query.activityTime)) return false;
      if (!inDayRange(item.createdAt, query.createdAt)) return false;
      if (!inDayRange(item.publishedAt, query.publishedAt)) return false;
      if (query.title) {
        const name = groupLabel(item.groupId, groupNames);
        if (!item.title.includes(query.title) && !name.includes(query.title)) return false;
      }
      return true;
    });
    return [...rows].sort(comparePinSort);
  }, [activities, groupId, groupNames, query]);

  const setListView = (next: InterestGroupActivityListView) => {
    setView(next);
    writeInterestGroupActivityListView(next);
    if (next === 'card') setSelectedRowKeys([]);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page, pageSize]);

  const selectedActivities = activities.filter((item) => selectedRowKeys.includes(item.id));

  const openDetail = (record: InterestGroupActivity) =>
    onNavigate('interest-group-activity-detail', String(record.id));
  const openEditor = (record: InterestGroupActivity) =>
    onNavigate('interest-group-activity-edit', String(record.id));

  const publishOne = (record: InterestGroupActivity) => {
    if (record.publishStatus === '已发布') {
      message.info(`「${record.title}」已发布`);
      return;
    }
    publishInterestGroupActivities([record.id]);
    message.success(`已发布「${record.title}」`);
  };

  const revokeOne = (record: InterestGroupActivity) => {
    const blocked = revokeInterestGroupActivityBlockReason(record);
    if (blocked) {
      message.info(blocked);
      return;
    }
    modal.confirm({
      title: `确认撤销「${record.title}」的发布？`,
      content: '撤销后活动不再对员工可见。发布时间保留。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        unpublishInterestGroupActivities([record.id]);
        message.success(`已撤销「${record.title}」`);
      },
    });
  };

  const batchPublish = () => {
    const unpublished = selectedActivities.filter((item) => item.publishStatus === '未发布');
    if (!unpublished.length) {
      message.info('已选活动均已发布，无需再次发布');
      return;
    }
    publishInterestGroupActivities(unpublished.map((item) => item.id));
    const alreadyPublished = selectedActivities.length - unpublished.length;
    const parts = [`已发布 ${unpublished.length} 个活动`];
    if (alreadyPublished) parts.push(`${alreadyPublished} 个本为已发布`);
    message.success(parts.join('，'));
    setSelectedRowKeys([]);
  };

  const batchRevoke = () => {
    const targets = selectedActivities.filter(canRevokeInterestGroupActivity);
    if (!targets.length) {
      message.info('已选活动均不可撤销。进行中请终止，已结束或已终止不能撤销');
      return;
    }
    unpublishInterestGroupActivities(targets.map((item) => item.id));
    const skipped = selectedActivities.length - targets.length;
    message.success(skipped ? `已撤销 ${targets.length} 个活动，${skipped} 个本为未发布` : `已撤销 ${targets.length} 个活动`);
    setSelectedRowKeys([]);
  };

  const closeSignupOne = (record: InterestGroupActivity) => {
    modal.confirm({
      title: `确认截止「${record.title}」报名？`,
      content: '截止后员工不能再报名，已报名不受影响。可在列表或详情恢复报名。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      okButtonProps: { danger: true },
      onOk: () => {
        const result = closeInterestGroupSignup(record.id);
        if (!result.ok) {
          message.warning('当前不可截止报名');
          return;
        }
        message.success(`已截止「${record.title}」报名`);
      },
    });
  };

  const reopenSignupOne = (record: InterestGroupActivity) => {
    modal.confirm({
      title: `确认恢复「${record.title}」报名？`,
      content: '将按原报名规则重新开放。单次恢复原报名结束时间；周期/系列恢复为最后一场的场次截止。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        const result = reopenInterestGroupSignup(record.id);
        if (!result.ok) {
          message.warning('当前不可恢复报名');
          return;
        }
        message.success(`已恢复「${record.title}」报名`);
      },
    });
  };

  const terminateOne = (record: InterestGroupActivity) => {
    modal.confirm({
      title: `确认终止「${record.title}」？`,
      content: '未举办场次不再进行，且不可恢复为进行中。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      okButtonProps: { danger: true },
      onOk: () => {
        const result = terminateInterestGroupActivity(record.id);
        if (!result.ok) {
          message.warning('当前状态不可终止');
          return;
        }
        message.success(`已终止「${record.title}」`);
      },
    });
  };

  const togglePin = (record: InterestGroupActivity) => {
    toggleInterestGroupActivityPin(record.id);
    message.success(record.pinned ? `已取消置顶「${record.title}」` : `已置顶「${record.title}」`);
  };

  const moveOne = (record: InterestGroupActivity, direction: 'up' | 'down') => {
    if (!moveInterestGroupActivity(record.id, direction, filtered)) return;
    message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const copyOne = (record: InterestGroupActivity) => onNavigate('interest-group-activity-create', String(record.id));

  const deleteOne = (record: InterestGroupActivity) => {
    if (!canDeleteInterestGroupActivity(record)) {
      message.info('已有人报名，无法删除');
      return;
    }
    modal.confirm({
      title: `确认删除「${record.title}」？`,
      content: '删除后不可恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      okButtonProps: { danger: true },
      onOk: () => {
        const result = deleteInterestGroupActivity(record.id);
        if (!result.ok) {
          message.warning(result.reason === 'has-signups' ? '已有人报名，无法删除' : '活动不存在');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.title}」`);
      },
    });
  };

  const handlers = useMemo(
    () => ({
      onDetail: openDetail,
      onEdit: openEditor,
      onCopy: copyOne,
      onRevoke: revokeOne,
      onPublish: publishOne,
      onPin: togglePin,
      onMoveUp: (record) => moveOne(record, 'up'),
      onMoveDown: (record) => moveOne(record, 'down'),
      onCloseSignup: closeSignupOne,
      onReopenSignup: reopenSignupOne,
      onTerminate: terminateOne,
      onDelete: deleteOne,
    }),
    [onNavigate, message, modal, filtered],
  );

  const activityActions = (record: InterestGroupActivity) =>
    buildInterestGroupActivityRowActions(record, handlers, pinSortMoveState(filtered, record.id));

  const applyCategory = async () => {
    const values = await categoryForm.validateFields();
    patchInterestGroupActivities((list) =>
      list.map((item) => (selectedRowKeys.includes(item.id) ? { ...item, categoryKey: values.categoryKey } : item)),
    );
    setCategoryModalOpen(false);
    message.success(`已将 ${selectedRowKeys.length} 个活动设为「${getInterestGroupCategoryLabel(values.categoryKey, categories)}」`);
    setSelectedRowKeys([]);
  };

  const columns: TableColumnsType<InterestGroupActivity> = [
    {
      title: '活动标题',
      dataIndex: 'title',
      fixed: 'left',
      width: 280,
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
          <Button type="link" className="table-link" onClick={() => openDetail(record)}>
            <TableEllipsisText text={value} />
          </Button>
        </Space>
      ),
    },
    ...(groupId == null
      ? [
          {
            title: '所属兴趣圈',
            dataIndex: 'groupId',
            width: 140,
            render: (value: number | null) => <TableEllipsisText text={groupLabel(value, groupNames)} />,
          } satisfies TableColumnsType<InterestGroupActivity>[number],
        ]
      : []),
    {
      title: '分类',
      dataIndex: 'categoryKey',
      width: 110,
      render: (value: string) => <TableEllipsisText text={getInterestGroupCategoryLabel(value, categories) || '—'} />,
    },
    {
      title: '举办方式',
      dataIndex: 'type',
      width: 110,
      render: (value: InterestGroupActivity['type']) => <TableEllipsisText text={interestGroupActivityTypeLabels[value]} />,
    },
    {
      title: '活动时间',
      key: 'activityTime',
      width: 280,
      render: (_, record) => (
        <TableEllipsisText text={formatInterestGroupActivityTime(record)} />
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
    {
      title: '状态',
      key: 'lifecycleStatus',
      width: 110,
      render: (_, record) => {
        const status = getInterestGroupLifecycleStatus(record);
        return <Tag color={lifecycleStatusColor[status]}>{status}</Tag>;
      },
    },
    { title: '创建人', dataIndex: 'creator', width: 100, render: (value: string) => <TableEllipsisText text={value} /> },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right',
      width: 220,
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`更多操作 ${record.title}`}
          actions={activityActions(record)}
        />
      ),
    },
  ];

  const hasQuery = Boolean(
    query.title ||
      query.groupId ||
      query.type ||
      query.categoryKey ||
      query.publishStatus ||
      query.lifecycleStatus ||
      query.activityTime ||
      query.createdAt ||
      query.publishedAt,
  );
  const createPage = 'interest-group-activity-create' as const;

  return (
    <div className="page-stack">
      {groupId == null ? (
        <ListPageHeading paths={['兴趣圈', '活动管理']} title="活动管理" subtitle="查询并维护活动基础信息、发布与状态。" />
      ) : null}
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
        <SearchField label="活动标题">
          <Input
            allowClear
            placeholder={groupId == null ? '活动名称或兴趣圈名称' : '活动名称'}
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </SearchField>
        {groupId == null ? (
          <SearchField label="所属兴趣圈">
            <Select
              allowClear
              placeholder="全部兴趣圈"
              value={draft.groupId}
              onChange={(value) => setDraft((current) => ({ ...current, groupId: value }))}
              options={[
                { value: 'unassigned', label: '未归属兴趣圈' },
                ...groups.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </SearchField>
        ) : null}
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="全部分类"
            value={draft.categoryKey}
            onChange={(value) => setDraft((current) => ({ ...current, categoryKey: value }))}
            options={categoryOptions}
          />
        </SearchField>
        <SearchField label="举办方式">
          <Select
            allowClear
            placeholder="全部方式"
            value={draft.type}
            onChange={(value) => setDraft((current) => ({ ...current, type: value }))}
            options={Object.entries(interestGroupActivityTypeLabels).map(([value, label]) => ({ value, label }))}
          />
        </SearchField>
        <SearchField label="活动时间">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            value={draft.activityTime}
            onChange={(value) => setDraft((current) => ({ ...current, activityTime: value }))}
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
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.lifecycleStatus}
            onChange={(value) => setDraft((current) => ({ ...current, lifecycleStatus: value }))}
            options={interestGroupLifecycleStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
        <SearchField label="创建时间">
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={draft.createdAt}
            onChange={(value) => setDraft((current) => ({ ...current, createdAt: value }))}
          />
        </SearchField>
        <SearchField label="发布时间">
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={draft.publishedAt}
            onChange={(value) => setDraft((current) => ({ ...current, publishedAt: value }))}
          />
        </SearchField>
      </SearchPanel>
      <Card className="list-table-card">
        <div className="table-toolbar">
          <Typography.Text>共 {filtered.length} 条</Typography.Text>
          <Space>
            <ListViewSegmented value={view} onChange={setListView} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onNavigate(createPage, groupId != null ? String(groupId) : undefined)}
            >
              新建活动
            </Button>
            <Button onClick={() => setAiOpen(true)}>AI 策划</Button>
          </Space>
        </div>
        {view === 'list' && selectedRowKeys.length > 0 ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Popconfirm
                title={`确认撤销已选 ${selectedRowKeys.length} 个活动的发布？`}
                description="撤销后活动不再对员工可见。仅已发布活动会被撤销。"
                onConfirm={batchRevoke}
              >
                <Button>撤销</Button>
              </Popconfirm>
              <Popconfirm
                title={`确认发布已选 ${selectedRowKeys.length} 个活动？`}
                description="仅未发布的活动会被发布。其余保持不变。"
                onConfirm={batchPublish}
              >
                <Button>批量发布</Button>
              </Popconfirm>
              <Button
                onClick={() => {
                  categoryForm.resetFields();
                  setCategoryModalOpen(true);
                }}
              >
                设置分类
              </Button>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </Flex>
        ) : null}
        {view === 'list' ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: groupId == null ? 1420 : 1280 }}
            rowSelection={{
              selectedRowKeys,
              preserveSelectedRowKeys: true,
              onChange: setSelectedRowKeys,
            }}
            locale={{ emptyText: <Empty description={hasQuery ? '没有匹配的活动' : '暂无活动'} /> }}
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
          <InterestGroupActivityCardGrid
            activities={filtered.slice((page - 1) * pageSize, page * pageSize)}
            groupNames={groupNames}
            hideGroupName={groupId != null}
            emptyDescription={hasQuery ? '没有匹配的活动' : '暂无活动'}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
            onOpenDetail={openDetail}
            buildActions={activityActions}
          />
        )}
      </Card>
      <InterestGroupActivityAiModal
        open={aiOpen}
        groupId={groupId}
        onCancel={() => setAiOpen(false)}
        onGenerated={(next) => {
          setPendingAiActivityDraft(next);
          setAiOpen(false);
          onNavigate(createPage, groupId != null ? String(groupId) : undefined);
        }}
      />
      <Modal
        title={`设置分类 · 已选 ${selectedRowKeys.length} 项`}
        open={categoryModalOpen}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            <CancelBtn />
            <OkBtn />
          </Space>
        )}
        onOk={applyCategory}
        onCancel={() => setCategoryModalOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
      >
        <Typography.Paragraph type="secondary">将覆盖已选活动的当前分类，保存后立即生效。</Typography.Paragraph>
        <Form form={categoryForm} layout="horizontal" className="edit-form" requiredMark validateTrigger="onBlur">
          <Form.Item name="categoryKey" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类" options={categoryOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
