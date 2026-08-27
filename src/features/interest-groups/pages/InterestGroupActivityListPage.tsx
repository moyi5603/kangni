import { useMemo, useState, type FC, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
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
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  canPublishInterestGroupActivity,
  canReviewInterestGroupActivity,
  canSubmitInterestGroupActivity,
  formatInterestGroupActivityTime,
  formatInterestGroupPublishedAt,
  getInterestGroupLifecycleStatus,
  interestGroupActivityTypeLabels,
  interestGroupAuditStatuses,
  interestGroupLifecycleStatuses,
  lifecycleStatusColor,
  type InterestGroupActivity,
  type InterestGroupActivityType,
  type InterestGroupAuditStatus,
} from '../model/interestGroupActivity';
import type { LifecycleStatus } from '../../activities/model/activity';
import { buildInterestGroupCategoryOptions, getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import { InterestGroupActivityAiModal } from '../components/InterestGroupActivityAiModal';
import { InterestGroupActivityReviewModal } from '../components/InterestGroupActivityReviewModal';
import { setPendingAiActivityDraft } from '../model/interestGroupActivityPlan';
import {
  patchInterestGroupActivities,
  publishInterestGroupActivities,
  submitInterestGroupActivities,
  unpublishInterestGroupActivities,
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type Query = {
  title: string;
  groupId?: number | 'unassigned';
  type?: InterestGroupActivityType;
  categoryKey?: string;
  auditStatus?: InterestGroupAuditStatus;
  lifecycleStatus?: LifecycleStatus;
  activityTime: DateRange;
  createdAt: DateRange;
  publishedAt: DateRange;
};

const emptyQuery: Query = { title: '', activityTime: null, createdAt: null, publishedAt: null };

const auditColor: Record<InterestGroupAuditStatus, string> = {
  待提交: 'default',
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
  无需审核: 'default',
};

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
  if (groupId == null) return '未归属小组';
  return names.get(groupId) ?? '未归属小组';
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
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [reviewing, setReviewing] = useState<InterestGroupActivity>();
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
      if (query.auditStatus && item.auditStatus !== query.auditStatus) return false;
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
    return [...rows].sort((left, right) => Number(right.pinned) - Number(left.pinned));
  }, [activities, groupId, groupNames, query]);

  const selectedActivities = activities.filter((item) => selectedRowKeys.includes(item.id));

  const openDetail = (record: InterestGroupActivity) =>
    onNavigate('interest-group-activity-detail', String(record.id));
  const openEditor = (record: InterestGroupActivity) =>
    onNavigate('interest-group-activity-edit', String(record.id));

  const submitOne = (record: InterestGroupActivity) => {
    if (!canSubmitInterestGroupActivity(record)) {
      message.info(`「${record.title}」当前不可提交审批`);
      return;
    }
    modal.confirm({
      title: `确认提交「${record.title}」审批？`,
      content: '提交后审核状态变为待审核。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        submitInterestGroupActivities([record.id]);
        message.success(`已提交「${record.title}」审批`);
      },
    });
  };

  const publishOne = (record: InterestGroupActivity) => {
    if (record.publishStatus === '已发布') {
      message.info(`「${record.title}」已发布`);
      return;
    }
    if (!canPublishInterestGroupActivity(record)) {
      message.info(`「${record.title}」未审批通过或无需审核，无法发布`);
      return;
    }
    publishInterestGroupActivities([record.id]);
    message.success(`已发布「${record.title}」`);
  };

  const revokeOne = (record: InterestGroupActivity) => {
    modal.confirm({
      title: `确认撤销「${record.title}」的发布？`,
      content: '撤销后活动不再对员工可见。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        unpublishInterestGroupActivities([record.id]);
        message.success(`已撤销「${record.title}」`);
      },
    });
  };

  const batchSubmit = () => {
    const targets = selectedActivities.filter(canSubmitInterestGroupActivity);
    if (!targets.length) {
      message.info('已选活动均不可提交审批');
      return;
    }
    submitInterestGroupActivities(targets.map((item) => item.id));
    message.success(`已提交 ${targets.length} 个活动审批`);
    setSelectedRowKeys(selectedRowKeys.filter((key) => !targets.some((item) => item.id === key)));
  };

  const batchPublish = () => {
    const unpublished = selectedActivities.filter((item) => item.publishStatus === '未发布');
    const targets = unpublished.filter(canPublishInterestGroupActivity);
    const blocked = unpublished.filter((item) => !canPublishInterestGroupActivity(item));
    if (!targets.length) {
      message.info(blocked.length ? '已选未发布活动均未审批通过或无需审核，无法发布' : '已选活动均已发布，无需再次发布');
      return;
    }
    publishInterestGroupActivities(targets.map((item) => item.id));
    const alreadyPublished = selectedActivities.length - unpublished.length;
    const parts = [`已发布 ${targets.length} 个活动`];
    if (alreadyPublished) parts.push(`${alreadyPublished} 个本为已发布`);
    if (blocked.length) parts.push(`${blocked.length} 个因未审批通过无法发布`);
    message.success(parts.join('，'));
    setSelectedRowKeys(blocked.map((item) => item.id));
  };

  const batchRevoke = () => {
    const targets = selectedActivities.filter((item) => item.publishStatus === '已发布');
    if (!targets.length) {
      message.info('已选活动均未发布，无需撤销');
      return;
    }
    unpublishInterestGroupActivities(targets.map((item) => item.id));
    const skipped = selectedActivities.length - targets.length;
    message.success(skipped ? `已撤销 ${targets.length} 个活动，${skipped} 个本为未发布` : `已撤销 ${targets.length} 个活动`);
    setSelectedRowKeys([]);
  };

  const togglePin = (record: InterestGroupActivity) => {
    patchInterestGroupActivities((list) => list.map((item) => (item.id === record.id ? { ...item, pinned: !item.pinned } : item)));
    message.success(record.pinned ? `已取消置顶「${record.title}」` : `已置顶「${record.title}」`);
  };

  const copyOne = (record: InterestGroupActivity) => onNavigate('interest-group-activity-create', String(record.id));

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
      width: 200,
      render: (value: string, record) => (
        <Space>
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
            title: '所属小组',
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
      render: (_, record) => <TableEllipsisText text={formatInterestGroupActivityTime(record)} />,
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      width: 110,
      render: (value: InterestGroupAuditStatus) => <Tag color={auditColor[value]}>{value}</Tag>,
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
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      width: 170,
      render: (value: string) => formatInterestGroupPublishedAt(value),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right',
      width: 220,
      render: (_, record) => {
        const statusAction: TableRowAction = canSubmitInterestGroupActivity(record)
          ? {
              key: 'submit',
              label: '提交审批',
              ariaLabel: `提交审批 ${record.title}`,
              onClick: () => submitOne(record),
            }
          : canReviewInterestGroupActivity(record)
            ? {
                key: 'review',
                label: '审核',
                ariaLabel: `审核 ${record.title}`,
                onClick: () => setReviewing(record),
              }
            : record.publishStatus === '已发布'
              ? {
                  key: 'revoke',
                  label: '撤销',
                  ariaLabel: `撤销 ${record.title}`,
                  onClick: () => revokeOne(record),
                }
              : {
                  key: 'publish',
                  label: '发布',
                  ariaLabel: `发布 ${record.title}`,
                  onClick: () => publishOne(record),
                  disabled: !canPublishInterestGroupActivity(record),
                  tooltip: canPublishInterestGroupActivity(record) ? undefined : '仅审批通过或无需审核的活动可以发布',
                };
        return (
          <TableRowActions
            moreAriaLabel={`更多操作 ${record.title}`}
            actions={[
              {
                key: 'detail',
                label: '详情',
                ariaLabel: `详情 ${record.title}`,
                onClick: () => openDetail(record),
              },
              {
                key: 'edit',
                label: '编辑',
                ariaLabel: `编辑 ${record.title}`,
                onClick: () => openEditor(record),
              },
              {
                key: 'copy',
                label: '复制',
                ariaLabel: `复制 ${record.title}`,
                onClick: () => copyOne(record),
              },
              statusAction,
              {
                key: 'pin',
                label: record.pinned ? '取消置顶' : '置顶',
                ariaLabel: record.pinned ? `取消置顶 ${record.title}` : `置顶 ${record.title}`,
                onClick: () => togglePin(record),
              },
            ]}
          />
        );
      },
    },
  ];

  const hasQuery = Boolean(
    query.title ||
      query.groupId ||
      query.type ||
      query.categoryKey ||
      query.auditStatus ||
      query.lifecycleStatus ||
      query.activityTime ||
      query.createdAt ||
      query.publishedAt,
  );
  const createPage = 'interest-group-activity-create' as const;

  return (
    <div className="page-stack">
      {groupId == null ? (
        <ListPageHeading paths={['兴趣小组', '活动管理']} title="活动管理" subtitle="查询并维护活动基础信息、审核、发布与状态。" />
      ) : null}
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
        }}
      >
        <SearchField label="活动标题">
          <Input
            allowClear
            placeholder={groupId == null ? '活动名称或小组名称' : '活动名称'}
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </SearchField>
        {groupId == null ? (
          <SearchField label="所属小组">
            <Select
              allowClear
              placeholder="全部小组"
              value={draft.groupId}
              onChange={(value) => setDraft((current) => ({ ...current, groupId: value }))}
              options={[
                { value: 'unassigned', label: '未归属小组' },
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
        <SearchField label="审核状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.auditStatus}
            onChange={(value) => setDraft((current) => ({ ...current, auditStatus: value }))}
            options={interestGroupAuditStatuses.map((value) => ({ value, label: value }))}
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
        {selectedRowKeys.length > 0 ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Popconfirm
                title={`确认提交已选 ${selectedRowKeys.length} 个活动审批？`}
                description="仅待提交或已驳回的活动会被提交，审核状态变为待审核。"
                onConfirm={batchSubmit}
              >
                <Button>批量提交审批</Button>
              </Popconfirm>
              <Popconfirm
                title={`确认发布已选 ${selectedRowKeys.length} 个活动？`}
                description="仅未发布且审核为已通过或无需审核的活动会被发布。其余保持不变。"
                onConfirm={batchPublish}
              >
                <Button>批量发布</Button>
              </Popconfirm>
              <Popconfirm
                title={`确认撤销已选 ${selectedRowKeys.length} 个活动的发布？`}
                description="撤销后活动不再对员工可见。仅已发布活动会被撤销。"
                onConfirm={batchRevoke}
              >
                <Button>撤销</Button>
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
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1680 }}
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: setSelectedRowKeys,
          }}
          locale={{ emptyText: <Empty description={hasQuery ? '没有匹配的活动' : '暂无活动'} /> }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
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
      <InterestGroupActivityReviewModal activity={reviewing} open={Boolean(reviewing)} onClose={() => setReviewing(undefined)} />
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
