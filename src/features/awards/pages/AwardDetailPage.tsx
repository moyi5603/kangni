import { useEffect, useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, DownloadOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Descriptions,
  Dropdown,
  Empty,
  Flex,
  Form,
  Image,
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
import { orgPeopleByName, orgPeoplePickerTree } from '../../activities/model/activity';
import { getMedal } from '../../activities/model/medalLibrary';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { useRejectReasonPrompt } from '../../../shared/ui/RejectReasonModal';
import { AwardCommentPanel } from '../components/AwardCommentPanel';
import { AwardResultEntryContent, AwardResultNominationPicker } from '../components/AwardResultEntry';
import {
  canEnterAwardResult,
  canGrantAwardRewards,
  canToggleResultPublic,
  buildAwardRewardGrants,
  grantAwardRewardsBlockReason,
  nominationSortFieldOf,
  resolveAwardResults,
  resolveAwardStatus,
  resolveResultPublicityLabel,
  resultPublicityBlockReason,
  type AwardRecord,
  type AwardResultRow,
  type AwardStatus,
} from '../model/award';
import { getAwardCertificate } from '../model/awardCertificateStore';
import {
  canReviewNomination,
  downloadAwardNominationExport,
  filterNominations,
  formatNominatorInfo,
  formatNomineeSummary,
  sortNominations,
  MAX_NOMINATION_HIGHLIGHTS,
  nominationReviewStatuses,
  normalizeHighlights,
  type AwardNominationQuery,
  type AwardNominationRecord,
  type NominationReviewStatus,
} from '../model/awardNomination';
import {
  addAwardNomination,
  getAwardNominations,
  removeAwardNomination,
  reviewAwardNomination,
  useAwardNominations,
} from '../model/awardNominationStore';
import { grantAwardRewards, setAwardResultPublic, setAwardResults, useAwards } from '../model/awardStore';

const awardDetailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'nominations', label: '提名' },
  { key: 'results', label: '评优结果' },
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

function PeopleListModal({
  open,
  title,
  names,
  onClose,
  zIndex,
}: {
  open: boolean;
  title: string;
  names: string[];
  onClose: () => void;
  zIndex?: number;
}) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={b2bStandards.form.modalWidth}
      zIndex={zIndex}
      getContainer={false}
      footer={
        <Space>
          <Button type="primary" onClick={onClose}>
            确认
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 人`,
        }}
        dataSource={names.map((name) => ({
          name,
          department: orgPeopleByName[name]?.department ?? '—',
        }))}
        columns={[
          { title: '姓名', dataIndex: 'name' },
          { title: '部门', dataIndex: 'department' },
        ]}
      />
    </Modal>
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
            {
              label: '封面图片',
              children: record.coverUrl ? (
                <Image className="activity-cover-preview" src={record.coverUrl} width={240} alt={`${record.name} 封面`} />
              ) : (
                '—'
              ),
            },
            { label: '发布状态', children: record.publishStatus },
            { label: '结果是否公示', children: resolveResultPublicityLabel(record, now) },
            { label: '奖励是否发放', children: record.rewardsGranted ? '已发放' : '未发放' },
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
            { label: '获奖名次数', children: record.winnerCount },
            ...record.ranks.map((rank) => ({
              label: rank.title || `第 ${rank.rank} 名`,
              children: rankRewardText(rank),
            })),
          ]}
        />
      </Card>
      <Card title="高级设置">
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
            { label: '投票排序规则', children: record.voteSortRule },
            { label: '结束后自动公示', children: record.autoPublishOnEnd ? '开' : '关' },
            { label: '评论区', children: record.commentsEnabled ? '开' : '关' },
            ...(record.commentsEnabled
              ? [{ label: '评论是否需要审核', children: record.commentsNeedAudit ? '开' : '关' }]
              : []),
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
  const [form] = Form.useForm<{
    title: string;
    nominees: string | string[];
    reason: string;
    highlights: { text: string }[];
  }>();
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
      highlights: normalizeHighlights((values.highlights ?? []).map((item) => item.text ?? '')),
    });
    if (error) {
      message.error(error);
      return;
    }
    message.success('已添加提名并直接通过');
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
      <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} initialValues={{ highlights: [{ text: '' }] }}>
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
        <Form.List
          name="highlights"
          rules={[
            {
              validator: async (_, value: { text?: string }[]) => {
                const filled = (value ?? []).filter((item) => item?.text?.trim());
                if (!filled.length) throw new Error('至少填写 1 条核心亮点');
                if ((value ?? []).length > MAX_NOMINATION_HIGHLIGHTS) throw new Error('核心亮点最多 3 条');
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  label={index === 0 ? '核心亮点' : '\u00A0'}
                  key={field.key}
                  required={index === 0}
                  colon={index === 0}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'text']}
                      noStyle
                      rules={[{ required: true, whitespace: true, message: '请填写核心亮点' }]}
                    >
                      <Input placeholder={`亮点 ${index + 1}`} maxLength={80} />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <Button aria-label={`删除亮点 ${index + 1}`} onClick={() => remove(field.name)} icon={<MinusCircleOutlined />} />
                    ) : null}
                  </Space.Compact>
                </Form.Item>
              ))}
              <Form.Item label={'\u00A0'} colon={false}>
                {fields.length < MAX_NOMINATION_HIGHLIGHTS ? (
                  <Button type="dashed" onClick={() => add({ text: '' })} icon={<PlusOutlined />}>
                    添加亮点
                  </Button>
                ) : null}
              </Form.Item>
              <Form.ErrorList errors={errors} />
            </>
          )}
        </Form.List>
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
  const { promptReject, rejectReasonModal } = useRejectReasonPrompt();
  const rows = useAwardNominations(award.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<AwardNominationRecord | null>(null);
  const [draft, setDraft] = useState<AwardNominationQuery>(emptyNominationQuery);
  const [query, setQuery] = useState<AwardNominationQuery>(emptyNominationQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const filtered = useMemo(() => filterNominations(rows, query), [rows, query]);
  const sortField = nominationSortFieldOf(award.voteSortRule);
  const sorted = useMemo(() => sortNominations(filtered, sortField, 'descend'), [filtered, sortField]);
  const hasActiveQuery = Boolean(query.title || query.nominator || query.nominee || query.reviewStatus);
  const clearSelection = () => setSelectedRowKeys([]);

  const reviewOne = (record: AwardNominationRecord, reviewStatus: NominationReviewStatus) => {
    if (!canReviewNomination(record)) {
      message.info('仅待审核提名可审核');
      return;
    }
    if (reviewStatus === '已驳回') {
      promptReject({
        title: `确认驳回「${record.title}」？`,
        onConfirm: (reason) => {
          reviewAwardNomination(record.id, reviewStatus, reason);
          message.success('已驳回提名');
        },
      });
      return;
    }
    modal.confirm({
      title: `确认通过「${record.title}」？`,
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        reviewAwardNomination(record.id, reviewStatus);
        message.success('已通过提名');
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
      width: 160,
      render: (value: string) => formatNominatorInfo(value),
    },
    {
      title: '提名名单',
      dataIndex: 'nominees',
      width: 200,
      render: (value: string[], record) => (
        <Button
          type="link"
          className="table-link"
          aria-label={`查看名单 ${record.title}`}
          onClick={() => setViewing(record)}
        >
          {formatNomineeSummary(value)}
        </Button>
      ),
    },
    { title: '推荐理由', dataIndex: 'reason' },
    {
      title: '核心亮点',
      dataIndex: 'highlights',
      render: (value: string[]) => (
        <Space direction="vertical" size={4}>
          {value.map((item, index) => (
            <Typography.Text key={`${item}-${index}`}>{`${index + 1}. ${item}`}</Typography.Text>
          ))}
        </Space>
      ),
    },
    {
      title: '票数',
      dataIndex: 'voteCount',
      width: 88,
      align: 'right',
      sorter: (a, b) => a.voteCount - b.voteCount,
      defaultSortOrder: sortField === 'voteCount' ? 'descend' : undefined,
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
      defaultSortOrder: sortField === 'createdAt' ? 'descend' : undefined,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => {
        const actions = [
          { key: 'view', label: '查看名单', onClick: () => setViewing(record) },
          ...(canReviewNomination(record)
            ? [
                { key: 'pass', label: '通过', onClick: () => reviewOne(record, '已通过') },
                { key: 'reject', label: '驳回', onClick: () => reviewOne(record, '已驳回') },
              ]
            : []),
          { key: 'delete', label: '删除', danger: true, onClick: () => deleteOne(record) },
        ];
        const visible = actions.slice(0, b2bStandards.table.actionsMaxVisible);
        const more = actions.slice(b2bStandards.table.actionsMaxVisible);

        return (
          <Space wrap={false}>
            {visible.map((action) => (
              <Button
                key={action.key}
                type="link"
                danger={action.danger}
                aria-label={`${action.label} ${record.title}`}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
            {more.length ? (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: more.map((action) => ({
                    key: action.key,
                    label: action.label,
                    danger: action.danger,
                    onClick: action.onClick,
                  })),
                }}
              >
                <Button type="link" aria-label={`更多操作 ${record.title}`}>
                  更多 <DownOutlined />
                </Button>
              </Dropdown>
            ) : null}
          </Space>
        );
      },
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
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建提名
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                downloadAwardNominationExport(award.name, sorted);
                message.success(`已导出 ${sorted.length} 条提名`);
              }}
            >
              导出
            </Button>
          </Space>
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
        {sorted.length ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={sorted}
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
      <PeopleListModal
        open={Boolean(viewing)}
        title={viewing ? `「${viewing.title}」提名名单（${viewing.nominees.length}人）` : '提名名单'}
        names={viewing?.nominees ?? []}
        onClose={() => setViewing(null)}
      />
      {rejectReasonModal}
    </div>
  );
}

function nominationToResult(rank: AwardRecord['ranks'][number], nomination: AwardNominationRecord): AwardResultRow {
  return {
    rank: rank.rank,
    rankTitle: rank.title,
    nominationId: nomination.id,
    nominationTitle: nomination.title,
    nominees: nomination.nominees,
    voteCount: nomination.voteCount,
    nominator: nomination.nominator,
  };
}

function AwardResultsPanel({
  award,
  now,
  entryRequest = 0,
  onGrantRewards,
}: {
  award: AwardRecord;
  now: string;
  entryRequest?: number;
  onGrantRewards?: () => void;
}) {
  const { message } = App.useApp();
  const nominations = useAwardNominations(award.id);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<{ title: string; names: string[] } | null>(null);
  const [pickingRankIndex, setPickingRankIndex] = useState<number | null>(null);
  const [form] = Form.useForm<{ rows: { nominationId?: number }[] }>();
  const canEnter = canEnterAwardResult(award, now);
  const canGrant = canGrantAwardRewards(award, now);
  const status = resolveAwardStatus(award, now);
  const results = resolveAwardResults(award, nominations, now);
  const passed = nominations.filter((item) => item.reviewStatus === '已通过');
  const rowsWatch = Form.useWatch('rows', form) ?? [];

  const openEditor = () => {
    form.setFieldsValue({
      rows: award.ranks.map((rank) => ({
        nominationId: results.find((item) => item.rank === rank.rank)?.nominationId,
      })),
    });
    setPickingRankIndex(null);
    setOpen(true);
  };

  const closeEditor = () => {
    setOpen(false);
    setPickingRankIndex(null);
  };

  useEffect(() => {
    if (!entryRequest || !canEnter) return;
    openEditor();
  }, [entryRequest]);

  const saveResults = async () => {
    const values = await form.validateFields();
    const ids = (values.rows ?? []).map((item) => item.nominationId).filter((id): id is number => typeof id === 'number');
    if (new Set(ids).size !== ids.length) {
      message.error('同一提名不能重复占用多个名次');
      return;
    }
    const next = award.ranks.flatMap((rank, index) => {
      const nominationId = values.rows?.[index]?.nominationId;
      const nomination = passed.find((item) => item.id === nominationId);
      return nomination ? [nominationToResult(rank, nomination)] : [];
    });
    if (!next.length) {
      message.error('请至少选择一个获奖提名');
      return;
    }
    if (!setAwardResults(award.id, next)) {
      message.error('奖励已发放，结果不可修改');
      return;
    }
    setOpen(false);
    message.success('已保存评优结果');
  };

  const pickNomination = (nomination: AwardNominationRecord) => {
    if (pickingRankIndex == null) return;
    form.setFieldValue(['rows', pickingRankIndex, 'nominationId'], nomination.id);
    setPickingRankIndex(null);
  };

  const clearRank = (index: number) => {
    form.setFieldValue(['rows', index, 'nominationId'], undefined);
  };

  const viewPeople = (title: string, names: string[]) => setViewing({ title, names });
  const usedIds = new Set(
    (rowsWatch as { nominationId?: number }[])
      .map((item) => item?.nominationId)
      .filter((id): id is number => typeof id === 'number'),
  );
  const pickingRank = pickingRankIndex != null ? award.ranks[pickingRankIndex] : undefined;

  return (
    <div className="page-stack">
      <ListTableCard
        toolbar={
          canEnter || canGrant || award.rewardsGranted ? (
            <Space>
              {canEnter ? (
                <Button type="primary" onClick={openEditor}>
                  {results.length ? '修改结果' : '录入结果'}
                </Button>
              ) : null}
              {canGrant ? (
                <Button type={canEnter ? 'default' : 'primary'} onClick={onGrantRewards}>
                  发放奖励
                </Button>
              ) : null}
              {award.rewardsGranted ? <Typography.Text type="secondary">奖励已发放，结果不可修改</Typography.Text> : null}
            </Space>
          ) : null
        }
      >
        {results.length ? (
          <Table
            rowKey={(row) => `${row.rank}-${row.nominationId}`}
            columns={[
              { title: '获奖名次', dataIndex: 'rank', width: 100 },
              { title: '名次名称', dataIndex: 'rankTitle', width: 140 },
              { title: '提名标题', dataIndex: 'nominationTitle' },
              {
                title: '获奖名单',
                dataIndex: 'nominees',
                width: 200,
                render: (value: string[], record) => (
                  <Button
                    type="link"
                    className="table-link"
                    aria-label={`查看名单 ${record.nominationTitle}`}
                    onClick={() => viewPeople(record.nominationTitle, record.nominees)}
                  >
                    {formatNomineeSummary(value)}
                  </Button>
                ),
              },
              { title: '票数', dataIndex: 'voteCount', width: 88, align: 'right' },
              {
                title: '提名人',
                dataIndex: 'nominator',
                width: 160,
                render: (value: string) => formatNominatorInfo(value),
              },
              {
                title: '操作',
                key: 'action',
                width: 120,
                fixed: 'right',
                render: (_, record) => (
                  <Button
                    type="link"
                    aria-label={`查看名单 ${record.nominationTitle}`}
                    onClick={() => viewPeople(record.nominationTitle, record.nominees)}
                  >
                    查看名单
                  </Button>
                ),
              },
            ]}
            dataSource={results}
            pagination={false}
            scroll={{ x: 960 }}
          />
        ) : (
          <Empty
            description={
              status === '已结束' ? (canEnter ? '尚未录入评优结果' : '暂无评优结果') : '评优尚未结束，暂无结果'
            }
          />
        )}
      </ListTableCard>
      <PeopleListModal
        open={Boolean(viewing)}
        title={viewing ? `「${viewing.title}」获奖名单（${viewing.names.length}人）` : '获奖名单'}
        names={viewing?.names ?? []}
        onClose={() => setViewing(null)}
        zIndex={1300}
      />
      {canEnter ? (
        <Modal
          title="录入评优结果"
          open={open}
          forceRender
          getContainer={false}
          onCancel={closeEditor}
          width={880}
          footer={
            <Space>
              <Button type="primary" onClick={() => void saveResults()}>
                确认
              </Button>
              <Button onClick={closeEditor}>取消</Button>
            </Space>
          }
        >
          <AwardResultEntryContent
            award={award}
            passed={passed}
            form={form}
            rowsWatch={rowsWatch}
            onPickRank={setPickingRankIndex}
            onClearRank={clearRank}
            onViewPeople={viewPeople}
          />
        </Modal>
      ) : null}
      {canEnter ? (
        <Modal
          title={pickingRank ? `选择「${pickingRank.title || `第 ${pickingRank.rank} 名`}」提名` : '选择提名'}
          open={pickingRankIndex != null}
          getContainer={false}
          zIndex={1100}
          width={920}
          onCancel={() => setPickingRankIndex(null)}
          footer={
            <Space>
              <Button onClick={() => setPickingRankIndex(null)}>取消</Button>
            </Space>
          }
        >
          <AwardResultNominationPicker
            rankTitle={pickingRank?.title || '名次'}
            passed={passed}
            usedIds={usedIds}
            currentNominationId={pickingRankIndex != null ? rowsWatch[pickingRankIndex]?.nominationId : undefined}
            onPick={pickNomination}
            onViewPeople={viewPeople}
          />
        </Modal>
      ) : null}
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
  const { message, modal } = App.useApp();
  const awards = useAwards();
  const record = recordId ? awards.find((item) => item.id === Number(recordId)) : undefined;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const activeTab: AwardDetailTab = isAwardDetailTab(tab) ? tab : 'detail';

  const [entryRequest, setEntryRequest] = useState(0);

  useEffect(() => {
    if (!record) {
      message.warning('评优不存在或已删除');
      onBack();
    }
  }, [record, message, onBack]);

  if (!record) return null;
  const status = resolveAwardStatus(record, now);
  const canEnter = canEnterAwardResult(record, now);
  const canGrant = canGrantAwardRewards(record, now);
  const canTogglePublic = canToggleResultPublic(record, now);
  const resultPublished = resolveResultPublicityLabel(record, now) === '已公示';
  const tabLabel = awardDetailTabs.find((item) => item.key === activeTab)?.label ?? '详情';

  const grantRewards = () => {
    const rows = resolveAwardResults(record, getAwardNominations(record.id), now);
    const blocked = grantAwardRewardsBlockReason(record, now, rows);
    if (blocked) {
      message.info(blocked);
      return;
    }
    const grants = buildAwardRewardGrants(record, rows);
    modal.confirm({
      title: `确认向「${record.name}」获奖名单发放奖励？`,
      content: `将向 ${grants.length} 人按名次发放积分、勋章和证书。发放后不可修改结果。`,
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        grantAwardRewards(record.id, rows, grants);
        message.success(`已向 ${grants.length} 人发放奖励`);
      },
    });
  };

  const toggleResultPublic = () => {
    const next = !resultPublished;
    const blocked = resultPublicityBlockReason(record, now, next);
    if (blocked) {
      message.info(blocked);
      return;
    }
    modal.confirm({
      title: next ? `确认公示「${record.name}」的结果？` : `确认取消公示「${record.name}」？`,
      content: next ? '公示后可见范围内的员工可查看最终结果。' : '取消后结果将对员工隐藏。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setAwardResultPublic(record.id, next);
        message.success(next ? '已公示结果' : '已取消公示');
      },
    });
  };

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
          {canEnter ? (
            <Button
              type="primary"
              onClick={() => {
                onTabChange?.('results');
                setEntryRequest((current) => current + 1);
              }}
            >
              录入结果
            </Button>
          ) : null}
          {canGrant ? (
            <Button type={canEnter ? 'default' : 'primary'} onClick={grantRewards}>
              发放奖励
            </Button>
          ) : null}
          {canTogglePublic ? (
            <Button onClick={toggleResultPublic}>{resultPublished ? '取消公示' : '结果公示'}</Button>
          ) : null}
          <Button type={canEnter || canGrant ? 'default' : 'primary'} onClick={() => onEdit(String(record.id))}>
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
          { key: 'results', label: '评优结果', children: <AwardResultsPanel award={record} now={now} entryRequest={entryRequest} onGrantRewards={grantRewards} /> },
          {
            key: 'comments',
            label: '评论',
            children: record.commentsEnabled ? (
              <AwardCommentPanel awardId={record.id} commentsNeedAudit={record.commentsNeedAudit} />
            ) : (
              <Card>
                <Empty description="当前评优未开启评论区" />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
