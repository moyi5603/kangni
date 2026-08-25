import { useEffect, useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  TreeSelect,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { orgPeoplePickerTree } from '../../activities/model/activity';
import { getMedal } from '../../activities/model/medalLibrary';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import {
  resolveAwardStatus,
  resolveResultPublicityLabel,
  type AwardRecord,
  type AwardStatus,
} from '../model/award';
import { getAwardCertificate } from '../model/awardCertificateStore';
import {
  canReviewNomination,
  filterNominations,
  formatNominatorInfo,
  nominationReviewStatuses,
  type AwardNominationQuery,
  type AwardNominationRecord,
  type NominationReviewStatus,
} from '../model/awardNomination';
import {
  addAwardNomination,
  removeAwardNomination,
  reviewAwardNomination,
  useAwardNominations,
} from '../model/awardNominationStore';
import { useAwards } from '../model/awardStore';

const awardDetailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'nominations', label: '提名' },
  { key: 'comments', label: '评论' },
] as const;

type AwardDetailTab = (typeof awardDetailTabs)[number]['key'];

function isAwardDetailTab(value: string | undefined): value is AwardDetailTab {
  return !!value && awardDetailTabs.some((item) => item.key === value);
}

const statusColor: Record<AwardStatus, string> = {
  征集中: 'processing',
  投票中: 'warning',
  已结束: 'success',
};

const reviewColor: Record<NominationReviewStatus, string> = {
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
};

function dash(value: string | number | string[] | undefined): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.length ? value.join('、') : '—';
  if (typeof value === 'number') return String(value);
  return value.trim() ? value : '—';
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function rankRewardText(rank: AwardRecord['ranks'][number]): string {
  const parts: string[] = [];
  if (rank.enablePoints) parts.push(`积分 ${rank.points ?? 0}`);
  if (rank.enableMedal) parts.push(getMedal(rank.medalId ?? '')?.name ?? '勋章');
  if (rank.enableCertificate) parts.push(getAwardCertificate(rank.certificateId ?? -1)?.name ?? '电子证书');
  return parts.join('、') || '—';
}

function visibilityText(record: AwardRecord): string {
  if (record.visibility === '按部门') return dash(record.visibilityDepartments);
  if (record.visibility === '自定义人员') return dash(record.visibilityPeople);
  if (record.visibility === '导入人群') return dash(record.visibilityImportFileName);
  return record.visibility;
}

function nominatorText(record: AwardRecord): string {
  if (record.nominatorMode === '指定部门') return dash(record.nominatorDepartments);
  if (record.nominatorMode === '指定人员') return dash(record.nominatorPeople);
  if (record.nominatorMode === '导入人群') return dash(record.nominatorImportFileName);
  return record.nominatorMode;
}

function nomineeScopeText(record: AwardRecord): string {
  if (record.nomineeScope === '指定部门范围') return dash(record.nomineeDepartments);
  if (record.nomineeScope === '导入人群') return dash(record.nomineeImportFileName);
  return record.nomineeScope;
}

function AwardDetailFields({ record, now }: { record: AwardRecord; now: string }) {
  return (
    <div className="page-stack">
      <Card title="基础信息">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '评优活动名称', children: record.name },
            { label: '评优类型', children: record.type },
            { label: '发布状态', children: record.publishStatus },
            { label: '结果是否公示', children: resolveResultPublicityLabel(record, now) },
            { label: '创建人', children: record.creator },
            { label: '创建时间', children: record.createdAt },
          ]}
        />
      </Card>
      <Card title="时间">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '提名截止', children: record.nominateEndAt },
            { label: '投票截止', children: record.voteEndAt },
          ]}
        />
      </Card>
      <Card title="内容">
        <Descriptions
          column={1}
          items={[
            { label: '活动简介', children: record.intro },
            {
              label: '评优标准',
              children: record.criteria.length ? (
                <Space direction="vertical" size={4}>
                  {record.criteria.map((item, index) => (
                    <Typography.Text key={`${item}-${index}`}>{`${index + 1}. ${item}`}</Typography.Text>
                  ))}
                </Space>
              ) : (
                '—'
              ),
            },
          ]}
        />
      </Card>
      <Card title="名次奖励">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '前 x 名', children: record.winnerCount },
            ...record.ranks.map((rank) => ({
              label: rank.title || `第 ${rank.rank} 名`,
              children: rankRewardText(rank),
            })),
          ]}
        />
      </Card>
      <Card title="范围">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '可见范围', children: record.visibility },
            ...(record.visibility === '全员' ? [] : [{ label: '范围明细', children: visibilityText(record) }]),
            { label: '提名人', children: record.nominatorMode },
            ...(record.nominatorMode === '全员' ? [] : [{ label: '提名人明细', children: nominatorText(record) }]),
            { label: '提名范围', children: record.nomineeScope },
            ...(record.nomineeScope === '全员' || record.nomineeScope === '所属部门内'
              ? []
              : [{ label: '被提范围明细', children: nomineeScopeText(record) }]),
            { label: '结束后自动公示', children: record.autoPublishOnEnd ? '开' : '关' },
          ]}
        />
      </Card>
    </div>
  );
}

function NominationFormModal({
  open,
  award,
  onCancel,
}: {
  open: boolean;
  award: AwardRecord;
  onCancel: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ title: string; nominees: string | string[]; reason: string; highlights: string }>();
  const personal = award.type === '个人';

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const save = async () => {
    const values = await form.validateFields();
    const nominees = (Array.isArray(values.nominees) ? values.nominees : values.nominees ? [values.nominees] : []).filter(
      Boolean,
    );
    const error = addAwardNomination({
      awardId: award.id,
      title: values.title,
      nominees,
      reason: values.reason,
      highlights: values.highlights,
    });
    if (error) {
      message.error(error);
      return;
    }
    message.success('已提交提名');
    onCancel();
  };

  return (
    <Modal
      title="新建提名"
      open={open}
      onCancel={onCancel}
      onOk={() => void save()}
      okText="确认"
      cancelText="取消"
      footer={modalFooter}
      destroyOnHidden
    >
      <Form form={form} layout="horizontal" requiredMark>
        <Form.Item name="title" label="提名标题" rules={[{ required: true, whitespace: true, message: '请输入提名标题' }]}>
          <Input maxLength={50} showCount placeholder="请输入提名标题" />
        </Form.Item>
        <Form.Item name="nominees" label="提名名单" rules={[{ required: true, message: personal ? '请选择 1 人' : '请选择提名名单' }]}>
          <TreeSelect
            treeData={orgPeoplePickerTree}
            treeCheckable={!personal}
            multiple={!personal}
            treeDefaultExpandAll
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            showSearch={{ treeNodeFilterProp: 'title' }}
            allowClear
            placeholder={personal ? '请选择 1 人' : '请选择人员，可多选'}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="reason" label="推荐理由" rules={[{ required: true, whitespace: true, message: '请填写推荐理由' }]}>
          <Input.TextArea rows={3} maxLength={300} showCount placeholder="请填写推荐理由" />
        </Form.Item>
        <Form.Item name="highlights" label="核心亮点" rules={[{ required: true, whitespace: true, message: '请填写核心亮点' }]}>
          <Input.TextArea rows={3} maxLength={300} showCount placeholder="请填写核心亮点" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

const emptyNominationQuery: AwardNominationQuery = {};

function AwardNominationsPanel({ award }: { award: AwardRecord }) {
  const { message, modal } = App.useApp();
  const rows = useAwardNominations(award.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<AwardNominationQuery>(emptyNominationQuery);
  const [query, setQuery] = useState<AwardNominationQuery>(emptyNominationQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const filtered = useMemo(() => filterNominations(rows, query), [rows, query]);
  const hasActiveQuery = Boolean(query.title || query.nominator || query.nominee || query.reviewStatus);
  const clearSelection = () => setSelectedRowKeys([]);

  const reviewOne = (record: AwardNominationRecord, reviewStatus: NominationReviewStatus) => {
    if (!canReviewNomination(record)) {
      message.info('仅待审核提名可审核');
      return;
    }
    modal.confirm({
      title: reviewStatus === '已通过' ? `确认通过「${record.title}」？` : `确认驳回「${record.title}」？`,
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        reviewAwardNomination(record.id, reviewStatus);
        message.success(reviewStatus === '已通过' ? '已通过提名' : '已驳回提名');
      },
    });
  };

  const deleteOne = (record: AwardNominationRecord) => {
    modal.confirm({
      title: `确认删除提名「${record.title}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeAwardNomination(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success('已删除提名');
      },
    });
  };

  const batchDelete = () => {
    const selected = filtered.filter((item) => selectedRowKeys.includes(item.id));
    if (!selected.length) {
      message.info('请先选择要删除的提名');
      return;
    }
    modal.confirm({
      title: `确认删除 ${selected.length} 条提名？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        selected.forEach((item) => removeAwardNomination(item.id));
        clearSelection();
        message.success(`已删除 ${selected.length} 条提名`);
      },
    });
  };

  const columns: TableColumnsType<AwardNominationRecord> = [
    { title: '提名标题', dataIndex: 'title', width: 180 },
    {
      title: '提名人',
      dataIndex: 'nominator',
      width: 220,
      render: (value: string) => formatNominatorInfo(value),
    },
    {
      title: '提名名单',
      dataIndex: 'nominees',
      width: 180,
      render: (value: string[]) => dash(value),
    },
    { title: '推荐理由', dataIndex: 'reason' },
    { title: '核心亮点', dataIndex: 'highlights' },
    {
      title: '票数',
      dataIndex: 'voteCount',
      width: 88,
      align: 'right',
      sorter: (a, b) => a.voteCount - b.voteCount,
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      width: 110,
      render: (value: NominationReviewStatus) => <Tag color={reviewColor[value]}>{value}</Tag>,
    },
    {
      title: '提名时间',
      dataIndex: 'createdAt',
      width: 180,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space wrap={false}>
          {canReviewNomination(record) ? (
            <>
              <Button type="link" aria-label={`通过 ${record.title}`} onClick={() => reviewOne(record, '已通过')}>
                通过
              </Button>
              <Button type="link" aria-label={`驳回 ${record.title}`} onClick={() => reviewOne(record, '已驳回')}>
                驳回
              </Button>
            </>
          ) : null}
          <Button type="link" danger aria-label={`删除 ${record.title}`} onClick={() => deleteOne(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          clearSelection();
          message.success('查询完成');
        }}
        onReset={() => {
          setDraft(emptyNominationQuery);
          setQuery(emptyNominationQuery);
          clearSelection();
        }}
      >
        <SearchField label="提名标题">
          <Input
            allowClear
            placeholder="请输入提名标题"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </SearchField>
        <SearchField label="提名人">
          <Input
            allowClear
            placeholder="请输入提名人"
            value={draft.nominator}
            onChange={(event) => setDraft((current) => ({ ...current, nominator: event.target.value }))}
          />
        </SearchField>
        <SearchField label="提名名单">
          <Input
            allowClear
            placeholder="请输入被提名人"
            value={draft.nominee}
            onChange={(event) => setDraft((current) => ({ ...current, nominee: event.target.value }))}
          />
        </SearchField>
        <SearchField label="审核状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.reviewStatus}
            onChange={(value) => setDraft((current) => ({ ...current, reviewStatus: value }))}
            options={optionsOf(nominationReviewStatuses)}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建提名
          </Button>
        }
        batchToolbar={
          selectedRowKeys.length > 0 ? (
            <Flex className="batch-toolbar" justify="space-between" align="center">
              <Typography.Text>
                已选择 <strong>{selectedRowKeys.length}</strong> 项
              </Typography.Text>
              <Space>
                <Button danger onClick={batchDelete}>
                  批量删除
                </Button>
                <Button onClick={clearSelection}>取消选择</Button>
              </Space>
            </Flex>
          ) : null
        }
      >
        {filtered.length ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1480 }}
            sticky={b2bStandards.table.stickyHeader}
            rowSelection={{
              selectedRowKeys,
              preserveSelectedRowKeys: b2bStandards.table.rowSelectionPreserve,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description={hasActiveQuery ? '没有符合条件的提名' : b2bStandards.table.emptyText} />
        )}
      </ListTableCard>
      <NominationFormModal open={createOpen} award={award} onCancel={() => setCreateOpen(false)} />
    </div>
  );
}

export function AwardDetailPage({
  recordId,
  tab,
  onBack,
  onEdit,
  onTabChange,
}: {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onTabChange?: (tab: AwardDetailTab) => void;
}) {
  const { message } = App.useApp();
  const awards = useAwards();
  const record = recordId ? awards.find((item) => item.id === Number(recordId)) : undefined;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const activeTab: AwardDetailTab = isAwardDetailTab(tab) ? tab : 'detail';

  useEffect(() => {
    if (!record) {
      message.warning('评优不存在或已删除');
      onBack();
    }
  }, [record, message, onBack]);

  if (!record) return null;

  const status = resolveAwardStatus(record, now);
  const tabLabel = awardDetailTabs.find((item) => item.key === activeTab)?.label ?? '详情';

  return (
    <div className="page-stack">
      <Breadcrumb
        className="detail-breadcrumb"
        separator=">"
        items={[
          { title: '评优' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                评优管理
              </Button>
            ),
          },
          { title: record.name },
          { title: tabLabel },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <Flex align="center" gap={12} wrap="wrap">
          <Typography.Title level={1}>{record.name}</Typography.Title>
          <Tag color={statusColor[status]}>{status}</Tag>
          <Tag color={record.publishStatus === '已发布' ? 'success' : 'default'}>{record.publishStatus}</Tag>
        </Flex>
        <Space size="middle" wrap>
          <Button type="primary" onClick={() => onEdit(String(record.id))}>
            编辑
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (isAwardDetailTab(key)) onTabChange?.(key);
        }}
        items={[
          { key: 'detail', label: '详情', children: <AwardDetailFields record={record} now={now} /> },
          { key: 'nominations', label: '提名', children: <AwardNominationsPanel award={record} /> },
          {
            key: 'comments',
            label: '评论',
            children: (
              <Card>
                <Empty description="评论功能后续补充" />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
