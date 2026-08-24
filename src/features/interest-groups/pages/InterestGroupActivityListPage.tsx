import { useMemo, useState, type FC, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Image,
  Input,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  canPublishInterestGroupActivity,
  canReviewInterestGroupActivity,
  canSubmitInterestGroupActivity,
  displayInterestGroupActivityStatus,
  formatInterestGroupActivityTime,
  formatInterestGroupPublishedAt,
  interestGroupActivityStatusLabels,
  interestGroupActivityTypeLabels,
  interestGroupAuditStatuses,
  interestGroupPublishStatuses,
  type InterestGroupActivity,
  type InterestGroupActivityStatus,
  type InterestGroupActivityType,
  type InterestGroupAuditStatus,
  type InterestGroupPublishStatus,
} from '../model/interestGroupActivity';
import { buildInterestGroupCategoryOptions, getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import { InterestGroupActivityAiModal } from '../components/InterestGroupActivityAiModal';
import { InterestGroupActivityReviewModal } from '../components/InterestGroupActivityReviewModal';
import { setPendingAiActivityDraft } from '../model/interestGroupActivityPlan';
import {
  publishInterestGroupActivities,
  submitInterestGroupActivities,
  unpublishInterestGroupActivities,
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';

type Query = {
  title: string;
  groupId?: number | 'unassigned';
  type?: InterestGroupActivityType;
  status?: InterestGroupActivityStatus;
  categoryKey?: string;
  auditStatus?: InterestGroupAuditStatus;
  publishStatus?: InterestGroupPublishStatus;
};

const emptyQuery: Query = { title: '' };

const statusColor: Record<string, string> = {
  报名中: 'processing',
  进行中: 'processing',
  已满员: 'warning',
  已结束: 'default',
  已终止: 'error',
};

const auditColor: Record<InterestGroupAuditStatus, string> = {
  待提交: 'default',
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
  无需审核: 'default',
};

const publishColor: Record<InterestGroupPublishStatus, string> = {
  未发布: 'default',
  已发布: 'success',
};

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
  const groupNames = useMemo(() => new Map(groups.map((item) => [item.id, item.name])), [groups]);
  const categoryOptions = useMemo(
    () => buildInterestGroupCategoryOptions(categories, { includeUncategorized: true }),
    [categories],
  );

  const filtered = useMemo(
    () =>
      activities.filter((item) => {
        if (groupId != null && item.groupId !== groupId) return false;
        if (groupId == null && query.groupId === 'unassigned' && item.groupId != null) return false;
        if (groupId == null && typeof query.groupId === 'number' && item.groupId !== query.groupId) return false;
        if (query.type && item.type !== query.type) return false;
        if (query.status && item.status !== query.status) return false;
        if (query.categoryKey && item.categoryKey !== query.categoryKey) return false;
        if (query.auditStatus && item.auditStatus !== query.auditStatus) return false;
        if (query.publishStatus && item.publishStatus !== query.publishStatus) return false;
        if (query.title) {
          const name = groupLabel(item.groupId, groupNames);
          if (!item.title.includes(query.title) && !name.includes(query.title)) return false;
        }
        return true;
      }),
    [activities, groupId, groupNames, query],
  );

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

  const columns: TableColumnsType<InterestGroupActivity> = [
    {
      title: '活动名称',
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <Space>
          <Image src={record.coverUrl} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8 }} preview={false} />
          <Button type="link" className="table-link" onClick={() => openDetail(record)}>
            {value}
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
            render: (value: number | null) => groupLabel(value, groupNames),
          } satisfies TableColumnsType<InterestGroupActivity>[number],
        ]
      : []),
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
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (value: InterestGroupActivity['type']) => interestGroupActivityTypeLabels[value],
    },
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_, record) => {
        const time = formatInterestGroupActivityTime(record);
        return (
          <div>
            <div>{time.date}</div>
            <span style={{ color: 'rgba(0,0,0,0.45)' }}>{time.time}</span>
          </div>
        );
      },
    },
    {
      title: '报名',
      key: 'signup',
      width: 140,
      render: (_, record) => (
        <div>
          <div>{`${record.signedCount}/${record.capacity}`}</div>
          <Progress percent={Math.round((record.signedCount / Math.max(record.capacity, 1)) * 100)} size="small" showInfo={false} />
        </div>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      width: 110,
      render: (value: InterestGroupAuditStatus) => <Tag color={auditColor[value]}>{value}</Tag>,
    },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      width: 110,
      render: (value: InterestGroupPublishStatus) => <Tag color={publishColor[value]}>{value}</Tag>,
    },
    {
      title: '活动状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const label = displayInterestGroupActivityStatus(record);
        return <Tag color={statusColor[label]}>{label}</Tag>;
      },
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      width: 170,
      render: (value: string) => formatInterestGroupPublishedAt(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`详情 ${record.title}`} onClick={() => openDetail(record)}>
            详情
          </Button>
          <Button type="link" aria-label={`编辑 ${record.title}`} onClick={() => openEditor(record)}>
            编辑
          </Button>
          {canSubmitInterestGroupActivity(record) ? (
            <Button type="link" aria-label={`提交审批 ${record.title}`} onClick={() => submitOne(record)}>
              提交审批
            </Button>
          ) : canReviewInterestGroupActivity(record) ? (
            <Button type="link" aria-label={`审核 ${record.title}`} onClick={() => setReviewing(record)}>
              审核
            </Button>
          ) : record.publishStatus === '已发布' ? (
            <Button type="link" aria-label={`撤销 ${record.title}`} onClick={() => revokeOne(record)}>
              撤销
            </Button>
          ) : canPublishInterestGroupActivity(record) ? (
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
        </Space>
      ),
    },
  ];

  const hasQuery = Boolean(
    query.title || query.groupId || query.type || query.status || query.categoryKey || query.auditStatus || query.publishStatus,
  );
  const createPage = 'interest-group-activity-create' as const;

  return (
    <div className="page-stack">
      {groupId == null ? (
        <ListPageHeading paths={['兴趣小组', '活动管理']} title="活动管理" subtitle="查询并维护活动基础信息、审核、发布和活动状态。" />
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
        <SearchField label="活动类型">
          <Select
            allowClear
            placeholder="全部类型"
            value={draft.type}
            onChange={(value) => setDraft((current) => ({ ...current, type: value }))}
            options={Object.entries(interestGroupActivityTypeLabels).map(([value, label]) => ({ value, label }))}
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
        <SearchField label="发布状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.publishStatus}
            onChange={(value) => setDraft((current) => ({ ...current, publishStatus: value }))}
            options={interestGroupPublishStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
        <SearchField label="活动状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={Object.entries(interestGroupActivityStatusLabels).map(([value, label]) => ({ value, label }))}
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
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
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
    </div>
  );
}
