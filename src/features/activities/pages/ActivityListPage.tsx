import { useMemo, useState, type Key, type ReactNode } from 'react';
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
  auditStatuses,
  formatActivityTime,
  formatPublishedAt,
  getActivityLifecycleStatus,
  lifecycleStatusColor,
  lifecycleStatuses,
  canPublishActivity,
  canReviewActivity,
  canSubmitApproval,
  type Activity,
  type AuditStatus,
  type LifecycleStatus,
} from '../model/activity';
import {
  activityScheduleTypeLabels,
  activityScheduleTypes,
  type ActivityScheduleType,
} from '../model/activitySchedule';
import { ActivityReviewModal } from '../components/ActivityReviewModal';
import { patchActivities, submitActivitiesForApproval, useActivities } from '../model/activityStore';
import { useCategories } from '../model/categoryStore';
import { ActivityQrCheckInPage } from './ActivityQrCheckInPage';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type ActivityQuery = {
  title: string;
  category?: string;
  scheduleType?: ActivityScheduleType;
  activityTime: DateRange;
  auditStatus?: AuditStatus;
  lifecycleStatus?: LifecycleStatus;
  createdAt: DateRange;
  publishedAt: DateRange;
};

const emptyQuery: ActivityQuery = {
  title: '',
  activityTime: null,
  createdAt: null,
  publishedAt: null,
};

const auditColor: Record<AuditStatus, string> = {
  待提交: 'default',
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
  无需审核: 'default',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

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
  const start = dayjs(startAt);
  const end = dayjs(endAt);
  if (range[0] && end.isBefore(range[0])) return false;
  if (range[1] && start.isAfter(range[1].endOf('day'))) return false;
  return true;
}

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function confirmFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

export function ActivityListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const data = useActivities();
  const categoryRecords = useCategories();
  const categoryOptions = categoryRecords.map((item) => ({ value: item.name, label: item.name }));
  const enabledCategoryOptions = categoryRecords
    .filter((item) => item.status === '启用')
    .map((item) => ({ value: item.name, label: item.name }));
  const [draft, setDraft] = useState<ActivityQuery>(emptyQuery);
  const [query, setQuery] = useState<ActivityQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Activity>();
  const [qrActivity, setQrActivity] = useState<Activity>();
  const [categoryForm] = Form.useForm<{ category: string }>();
  const filtered = useMemo(() => {
    const rows = data.filter(
      (item) =>
        (!query.title || item.title.includes(query.title)) &&
        (!query.category || item.category === query.category) &&
        (!query.scheduleType || (item.scheduleType ?? 'once') === query.scheduleType) &&
        overlapsRange(item.startAt, item.endAt, query.activityTime) &&
        (!query.auditStatus || item.auditStatus === query.auditStatus) &&
        (!query.lifecycleStatus || getActivityLifecycleStatus(item) === query.lifecycleStatus) &&
        inDayRange(item.createdAt, query.createdAt) &&
        inDayRange(item.publishedAt, query.publishedAt),
    );
    return [...rows].sort((left, right) => Number(right.pinned) - Number(left.pinned));
  }, [data, query]);
  const hasActiveQuery = Boolean(
    query.title ||
      query.category ||
      query.scheduleType ||
      query.activityTime ||
      query.auditStatus ||
      query.lifecycleStatus ||
      query.createdAt ||
      query.publishedAt,
  );

  const openEditor = (record?: Activity) => {
    if (record) onNavigate('activity-edit', String(record.id));
    else onNavigate('activity-create');
  };

  const openDetail = (record: Activity) => onNavigate('activity-detail', String(record.id));
  const copyOne = (record: Activity) => onNavigate('activity-create', String(record.id));

  const selectedActivities = data.filter((item) => selectedRowKeys.includes(item.id));

  const batchPublish = () => {
    const unpublished = selectedActivities.filter((item) => item.publishStatus === '未发布');
    const targets = unpublished.filter(canPublishActivity);
    const blocked = unpublished.filter((item) => !canPublishActivity(item));
    if (!targets.length) {
      message.info(blocked.length ? '已选未发布活动均未审批通过或无需审核，无法发布' : '已选活动均已发布，无需再次发布');
      return;
    }
    const publishedAt = nowText();
    const targetIds = new Set(targets.map((item) => item.id));
    patchActivities((list) =>
      list.map((item) =>
        targetIds.has(item.id) ? { ...item, publishStatus: '已发布', publishedAt: item.publishedAt || publishedAt } : item,
      ),
    );
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
    const targetIds = new Set(targets.map((item) => item.id));
    patchActivities((list) =>
      list.map((item) => (targetIds.has(item.id) ? { ...item, publishStatus: '未发布', publishedAt: '' } : item)),
    );
    const skipped = selectedActivities.length - targets.length;
    message.success(skipped ? `已撤销 ${targets.length} 个活动，${skipped} 个本为未发布` : `已撤销 ${targets.length} 个活动`);
    setSelectedRowKeys([]);
  };

  const applyCategory = async () => {
    const values = await categoryForm.validateFields();
    patchActivities((list) =>
      list.map((item) => (selectedRowKeys.includes(item.id) ? { ...item, category: values.category } : item)),
    );
    setCategoryModalOpen(false);
    message.success(`已将 ${selectedRowKeys.length} 个活动设为「${values.category}」`);
    setSelectedRowKeys([]);
  };

  const togglePin = (record: Activity) => {
    patchActivities((list) => list.map((item) => (item.id === record.id ? { ...item, pinned: !item.pinned } : item)));
    message.success(record.pinned ? `已取消置顶「${record.title}」` : `已置顶「${record.title}」`);
  };

  const submitOne = (record: Activity) => {
    if (!canSubmitApproval(record)) {
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
        submitActivitiesForApproval([record.id], nowText());
        message.success(`已提交「${record.title}」审批`);
      },
    });
  };

  const batchSubmit = () => {
    const targets = selectedActivities.filter(canSubmitApproval);
    if (!targets.length) {
      message.info('已选活动均不可提交审批');
      return;
    }
    submitActivitiesForApproval(
      targets.map((item) => item.id),
      nowText(),
    );
    message.success(`已提交 ${targets.length} 个活动审批`);
    setSelectedRowKeys(selectedRowKeys.filter((key) => !targets.some((item) => item.id === key)));
  };

  const publishOne = (record: Activity) => {
    if (record.publishStatus === '已发布') {
      message.info(`「${record.title}」已发布`);
      return;
    }
    if (!canPublishActivity(record)) {
      message.info(`「${record.title}」未审批通过或无需审核，无法发布`);
      return;
    }
    patchActivities((list) =>
      list.map((item) =>
        item.id === record.id ? { ...item, publishStatus: '已发布', publishedAt: item.publishedAt || nowText() } : item,
      ),
    );
    message.success(`已发布「${record.title}」`);
  };

  const revokeOne = (record: Activity) => {
    modal.confirm({
      title: `确认撤销「${record.title}」的发布？`,
      content: '撤销后活动不再对员工可见。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        patchActivities((list) =>
          list.map((item) => (item.id === record.id ? { ...item, publishStatus: '未发布', publishedAt: '' } : item)),
        );
        message.success(`已撤销「${record.title}」`);
      },
    });
  };

  const columns: TableColumnsType<Activity> = [
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
    { title: '分类', dataIndex: 'category', width: 90, render: (value: string) => <TableEllipsisText text={value} /> },
    {
      title: '举办方式',
      key: 'scheduleType',
      width: 110,
      render: (_, record) => (
        <TableEllipsisText text={activityScheduleTypeLabels[record.scheduleType ?? 'once']} />
      ),
    },
    {
      title: '活动时间',
      key: 'activityTime',
      width: 280,
      render: (_, record) => <TableEllipsisText text={formatActivityTime(record)} />,
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      width: 110,
      render: (value: AuditStatus) => <Tag color={auditColor[value]}>{value}</Tag>,
    },
    {
      title: '状态',
      key: 'lifecycleStatus',
      width: 110,
      render: (_, record) => {
        const status = getActivityLifecycleStatus(record);
        return <Tag color={lifecycleStatusColor[status]}>{status}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      width: 170,
      render: (value: string) => formatPublishedAt(value),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right',
      width: 220,
      render: (_, record) => {
        const statusAction: TableRowAction = canSubmitApproval(record)
          ? {
              key: 'submit',
              label: '提交审批',
              ariaLabel: `提交审批 ${record.title}`,
              onClick: () => submitOne(record),
            }
          : canReviewActivity(record)
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
                  disabled: !canPublishActivity(record),
                  tooltip: canPublishActivity(record) ? undefined : '仅审批通过或无需审核的活动可以发布',
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
              ...(record.checkInEnabled
                ? [
                    {
                      key: 'checkin-qr',
                      label: '签到码',
                      ariaLabel: `签到码 ${record.title}`,
                      onClick: () => setQrActivity(record),
                    },
                  ]
                : []),
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

  return (
    <div className="page-stack">
      <ListPageHeading paths={['活动', '活动管理']} title="活动管理" subtitle="查询并维护活动基础信息、审核、发布与状态。" />
      {/* 收起态前三项：活动标题、审核状态、状态；分类、举办方式、时间等展开后可见 */}
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          message.success('查询完成');
        }}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
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
        <SearchField label="审核状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.auditStatus}
            onChange={(value) => setDraft((current) => ({ ...current, auditStatus: value }))}
            options={optionsOf(auditStatuses)}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.lifecycleStatus}
            onChange={(value) => setDraft((current) => ({ ...current, lifecycleStatus: value }))}
            options={optionsOf(lifecycleStatuses)}
          />
        </SearchField>
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="全部分类"
            value={draft.category}
            onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
            options={categoryOptions}
          />
        </SearchField>
        <SearchField label="举办方式">
          <Select
            allowClear
            placeholder="全部方式"
            value={draft.scheduleType}
            onChange={(value) => setDraft((current) => ({ ...current, scheduleType: value }))}
            options={activityScheduleTypes.map((value) => ({ value, label: activityScheduleTypeLabels[value] }))}
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
              新建活动
            </Button>
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
          sticky
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1780 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={hasActiveQuery ? '没有符合条件的活动' : b2bStandards.table.emptyText} /> }}
        />
      </Card>
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
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类" options={enabledCategoryOptions} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={qrActivity ? `「${qrActivity.title}」签到码` : '签到码'}
        open={Boolean(qrActivity)}
        onCancel={() => setQrActivity(undefined)}
        footer={<Button onClick={() => setQrActivity(undefined)}>关闭</Button>}
        width={720}
        destroyOnHidden
      >
        {qrActivity ? <ActivityQrCheckInPage activity={qrActivity} /> : null}
      </Modal>
      <ActivityReviewModal activity={reviewing} open={Boolean(reviewing)} onClose={() => setReviewing(undefined)} />
    </div>
  );
}
