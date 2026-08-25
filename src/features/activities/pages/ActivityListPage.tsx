import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Dropdown,
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
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
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
import { ActivityReviewModal } from '../components/ActivityReviewModal';
import { patchActivities, submitActivitiesForApproval, useActivities } from '../model/activityStore';
import { useCategories } from '../model/categoryStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type ActivityQuery = {
  title: string;
  category?: string;
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
      <extra.OkBtn />
      <extra.CancelBtn />
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
  const [categoryForm] = Form.useForm<{ category: string }>();
  const filtered = useMemo(() => {
    const rows = data.filter(
      (item) =>
        (!query.title || item.title.includes(query.title)) &&
        (!query.category || item.category === query.category) &&
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
            {value}
          </Button>
        </Space>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 90 },
    {
      title: '活动时间',
      key: 'activityTime',
      width: 280,
      render: (_, record) => formatActivityTime(record),
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
      width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`详情 ${record.title}`} onClick={() => openDetail(record)}>
            详情
          </Button>
          <Button type="link" aria-label={`编辑 ${record.title}`} onClick={() => openEditor(record)}>
            编辑
          </Button>
          {canSubmitApproval(record) ? (
            <Button type="link" aria-label={`提交审批 ${record.title}`} onClick={() => submitOne(record)}>
              提交审批
            </Button>
          ) : canReviewActivity(record) ? (
            <Button type="link" aria-label={`审核 ${record.title}`} onClick={() => setReviewing(record)}>
              审核
            </Button>
          ) : record.publishStatus === '已发布' ? (
            <Button type="link" aria-label={`撤销 ${record.title}`} onClick={() => revokeOne(record)}>
              撤销
            </Button>
          ) : canPublishActivity(record) ? (
            <Button type="link" aria-label={`发布 ${record.title}`} onClick={() => publishOne(record)}>
              发布
            </Button>
          ) : (
            <Tooltip title="仅审批通过或无需审核的活动可以发布">
              <span>
                <Button type="link" disabled aria-label={`发布 ${record.title}`}>
                  发布
                </Button>
              </span>
            </Tooltip>
          )}
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'pin',
                  label: record.pinned ? '取消置顶' : '置顶',
                  onClick: () => togglePin(record),
                },
              ],
            }}
          >
            <Button type="link" aria-label={`更多操作 ${record.title}`}>
              更多 <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['活动', '活动管理']} title="活动管理" subtitle="查询并维护活动基础信息、审核、发布与状态。" />
      {/* 收起态前三项：活动标题、分类、活动时间；审核与状态等条件展开后可见 */}
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
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="全部分类"
            value={draft.category}
            onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
            options={categoryOptions}
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
      <Card>
        <div className="table-toolbar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新建活动
          </Button>
        </div>
        {selectedRowKeys.length > 0 && (
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
        )}
        {filtered.length ? (
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
            scroll={{ x: 1680 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description={hasActiveQuery ? '没有符合条件的活动' : b2bStandards.table.emptyText} />
        )}
      </Card>
      <Modal
        title={`设置分类 · 已选 ${selectedRowKeys.length} 项`}
        open={categoryModalOpen}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            <OkBtn />
            <CancelBtn />
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
      <ActivityReviewModal activity={reviewing} open={Boolean(reviewing)} onClose={() => setReviewing(undefined)} />
    </div>
  );
}
