import { useMemo, useState } from 'react';
import { InboxOutlined, InfoCircleOutlined, PlusOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Collapse,
  DatePicker,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { TableColumnsType, UploadFile } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { type TableRowAction } from '../../../shared/ui/TableRowActions';
import { RecognitionMaterials } from '../components/RecognitionMaterials';
import { recognitionRecordColumns, recognitionStatusColor } from '../components/recognitionRecordColumns';
import {
  RISK_HIT_LABELS,
  DEMO_CURRENT_USER,
  INCENTIVE_PEOPLE_TREE,
  canOperatePendingReview,
  canReviewPeerRecords,
  displayRecognitionStatus,
  recognitionMatchesRiskFlag,
  validateCommendationReason,
  recognitionAttachmentKind,
  recognitionReasonLabel,
  type Badge,
  type RecognitionAttachment,
  type IncentiveSettings,
  type Recognition,
  type RecognitionRiskFlag,
  type RecognitionStatus,
  type RecognitionType,
} from '../model/incentive';
import {
  approveRecognition,
  getBadges,
  issueCommendation,
  rejectRecognition,
  useIncentiveSettings,
  useRecognitions,
  useCategories,
  withdrawRecognition,
} from '../model/incentiveStore';
import './incentive-records.css';

const UNIT_ORG = '轨道交通事业部';
const DRAWER_WIDTH = 680;
const COMMEND_DRAWER_WIDTH = 720;
const PROOF_MAX_MB = 20;
const PROOF_MAX_COUNT = 5;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function proofFilesToAttachments(files: UploadFile[]): Promise<RecognitionAttachment[]> {
  const result: RecognitionAttachment[] = [];
  for (const file of files) {
    const name = file.name || '未命名附件';
    const raw = file.originFileObj;
    const url = raw ? await readAsDataUrl(raw) : (file.url || file.thumbUrl || '');
    if (!url) continue;
    result.push({ name, url, kind: recognitionAttachmentKind(name) });
  }
  return result;
}

const ORG_TREE = [
  {
    title: '康尼集团',
    value: '康尼集团',
    children: [
      { title: UNIT_ORG, value: UNIT_ORG },
      { title: '汽车事业部', value: '汽车事业部' },
      { title: '生产中心', value: '生产中心' },
      { title: '供应链管理部', value: '供应链管理部' },
    ],
  },
];

type QueryState = {
  id: string;
  receiver: string;
  type: '全部' | RecognitionType;
  department?: string;
  giver: string;
  range: [Dayjs, Dayjs] | null;
  status: '全部' | RecognitionStatus;
  riskFlag: RecognitionRiskFlag;
};

const emptyQuery: QueryState = {
  id: '',
  receiver: '',
  type: '全部',
  department: undefined,
  giver: '',
  range: null,
  status: '全部',
  riskFlag: '全部',
};

type DrawerMode = 'detail' | 'commend' | null;

function inRange(time: string, range: [Dayjs, Dayjs] | null) {
  if (!range) return true;
  const at = dayjs(time);
  if (!at.isValid()) return true;
  const start = range[0].startOf('day');
  const end = range[1].endOf('day');
  return (at.isAfter(start) || at.isSame(start)) && (at.isBefore(end) || at.isSame(end));
}

export function RecognitionFields({
  record,
  displayed,
  personalReviewEnabled,
  rules,
  onOpenRelated,
}: {
  record: Recognition;
  displayed: RecognitionStatus;
  personalReviewEnabled: boolean;
  rules: IncentiveSettings['rules'];
  onOpenRelated: (id: string) => void;
}) {
  const badge = getBadges().find((item) => item.id === record.badgeId);
  const hits = record.riskHits.filter((hit) => rules[hit.rule]);
  const processItems = buildProcessItems(record, displayed, personalReviewEnabled);

  return (
    <>
      <div className="incentive-record-detail-hero">
        <span className="incentive-record-detail-medal">
          {badge?.iconUrl ? <img src={badge.iconUrl} alt={`${record.badgeName}图标`} /> : <TrophyOutlined />}
        </span>
        <div>
          <h3>{record.badgeName}</h3>
          <p>
            {record.type} · +{record.points} 积分
          </p>
        </div>
        <Tag color={recognitionStatusColor(displayed)}>{displayed}</Tag>
      </div>
      {hits.length > 0 ? (
        <section className="incentive-record-risk">
          <header>
            <div>
              <b>提示</b>
              <span>{hits.length} 条</span>
            </div>
          </header>
          {hits.map((hit) => (
            <article key={`${hit.rule}-${hit.message}`}>
              <b>{RISK_HIT_LABELS[hit.rule]}</b>
              <div>
                {hit.relatedIds?.length ? (
                  <>
                    <span>关联单号：</span>
                    {hit.relatedIds.map((id) => (
                      <Button key={id} type="link" onClick={() => onOpenRelated(id)}>
                        {id}
                      </Button>
                    ))}
                  </>
                ) : (
                  hit.message
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}
      <Descriptions
        column={1}
        bordered
        size="small"
        items={[
          { label: '认可编号', children: record.id },
          { label: '发起人', children: record.giver },
          { label: '认可对象', children: `${record.receiver} · ${record.department}` },
          { label: '发起时间', children: record.time },
          { label: recognitionReasonLabel(record.type), children: record.description },
          ...(record.attachments?.length
            ? [{ label: '附件', children: <RecognitionMaterials attachments={record.attachments} /> }]
            : []),
        ]}
      />
      <h4 className="incentive-record-timeline-title">处理记录</h4>
      <Timeline className="incentive-record-timeline" items={processItems} />
    </>
  );
}

function buildProcessItems(
  record: Recognition,
  displayed: RecognitionStatus,
  personalReviewEnabled: boolean,
) {
  const submitted = {
    color: 'green' as const,
    content: (
      <>
        <b>{record.type === '公司表彰' ? '发布公司表彰' : '提交个人认可'}</b>
        <p>
          {record.time} · {record.giver}
        </p>
      </>
    ),
  };

  const gate =
    record.type === '公司表彰'
      ? {
          color: 'blue' as const,
          content: (
            <>
              <b>授权管理员直接发放</b>
              <p>公司表彰由管理员发布，确认后直接发放</p>
            </>
          ),
        }
      : displayed === '待审核'
        ? {
            color: 'orange' as const,
            content: (
              <>
                <b>同事认可审核已开启</b>
                <p>本记录因此进入审核队列</p>
              </>
            ),
          }
        : displayed === '已驳回'
          ? {
              color: 'red' as const,
              content: (
                <>
                  <b>审核驳回</b>
                  <p>{record.reviewComment || '未填写审核意见'}</p>
                </>
              ),
            }
          : personalReviewEnabled
            ? {
                color: 'green' as const,
                content: (
                  <>
                    <b>同事认可已完成审核</b>
                    <p>审核员通过后积分发放</p>
                  </>
                ),
              }
            : {
                color: 'green' as const,
                content: (
                  <>
                    <b>同事认可审核已关闭</b>
                    <p>提交后自动发放</p>
                  </>
                ),
              };

  const issued = {
    color: 'green' as const,
    content: (
      <>
        <b>积分已发放</b>
        <p>勋章与动态流已同步更新</p>
      </>
    ),
  };

  const withdrawn = {
    color: 'gray' as const,
    content: (
      <>
        <b>认可已撤回</b>
        <p>
          {record.withdrawnAt ?? record.time} · 系统
        </p>
        <p>
          已扣回 {record.receiver} 的 {record.points} 积分，并保留完整操作日志
        </p>
      </>
    ),
  };

  const items = [submitted, gate];
  if (displayed === '已发放' || displayed === '已撤回') items.push(issued);
  if (displayed === '已撤回') items.push(withdrawn);
  return items;
}

function CommendationGuidance({ badge, categoryName }: { badge: Badge; categoryName: string }) {
  return (
    <section className="incentive-commend-guidance" aria-label={`${badge.name}行为认定说明`}>
      <header>
        <div>
          <b>{badge.name}</b>
          <span>公司表彰 · {categoryName}</span>
        </div>
        <Tag color="blue">{badge.points}积分</Tag>
      </header>
      <Collapse
        size="small"
        defaultActiveKey={['definition', 'criteria', 'examples', 'exclusions']}
        items={[
          { key: 'definition', label: '行为定义', children: <p>{badge.definition}</p> },
          {
            key: 'criteria',
            label: '积分认定标准',
            children: (
              <ul>
                {badge.criteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          },
          {
            key: 'examples',
            label: '典型场景说明',
            children: (
              <ul>
                {badge.examples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          },
          {
            key: 'exclusions',
            label: '不计分情形',
            children: (
              <ul className="is-danger">
                {badge.exclusions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </section>
  );
}

type CommendFormValues = {
  employeeNames: string[];
  badgeId?: string;
  month: Dayjs;
  reason: string;
  files: UploadFile[];
  publishRange: 'all' | 'org';
  orgIds?: string[];
};

export function IncentiveRecordListPage() {
  const { message, modal } = App.useApp();
  const recognitions = useRecognitions();
  const settings = useIncentiveSettings();
  const categories = useCategories();
  const badges = getBadges();
  const directBadges = badges.filter((item) => item.riskLabel === '直接发放' && item.enabled);
  const companyBadgeOptions = useMemo(
    () =>
      categories
        .filter((item) => item.scopeId === 'company')
        .sort((a, b) => a.sort - b.sort)
        .map((category) => ({
          label: category.name,
          options: directBadges
            .filter((badge) => badge.categoryId === category.id)
            .map((badge) => ({ value: badge.id, label: `${badge.name} · ${badge.points}积分` })),
        }))
        .filter((group) => group.options.length),
    [categories, directBadges],
  );

  const [draft, setDraft] = useState<QueryState>(emptyQuery);
  const [query, setQuery] = useState<QueryState>(emptyQuery);
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [commendForm] = Form.useForm<CommendFormValues>();
  const selectedPeople = Form.useWatch('employeeNames', commendForm) ?? [];
  const selectedBadgeId = Form.useWatch('badgeId', commendForm);
  const selectedFiles = Form.useWatch('files', commendForm) ?? [];
  const publishRange = Form.useWatch('publishRange', commendForm);
  const selectedBadge = directBadges.find((item) => item.id === selectedBadgeId);
  const selectedCategoryName = categories.find((item) => item.id === selectedBadge?.categoryId)?.name ?? '';
  const totalPoints = (selectedBadge?.points ?? 0) * selectedPeople.length;

  const canReview = canReviewPeerRecords(settings, DEMO_CURRENT_USER);
  const active = recognitions.find((item) => item.id === activeId);
  const displayedOf = (record: Recognition) => displayRecognitionStatus(record, settings.personalReviewEnabled);

  const filtered = useMemo(() => {
    return recognitions.filter((item) => {
      if (query.id && !item.id.includes(query.id.trim())) return false;
      if (query.receiver && !item.receiver.includes(query.receiver.trim())) return false;
      if (query.giver && !item.giver.includes(query.giver.trim())) return false;
      if (query.type !== '全部' && item.type !== query.type) return false;
      if (query.department && query.department !== '康尼集团' && !item.department.includes(query.department)) {
        return false;
      }
      if (!inRange(item.time, query.range)) return false;
      const shown = displayedOf(item);
      if (query.status !== '全部' && shown !== query.status) return false;
      if (!recognitionMatchesRiskFlag(item, settings.rules, query.riskFlag)) return false;
      return true;
    });
  }, [recognitions, query, settings.personalReviewEnabled, settings.rules]);

  const openRelated = (id: string) => {
    if (!recognitions.some((item) => item.id === id)) {
      message.warning('关联记录不存在');
      return;
    }
    setActiveId(id);
    setReviewComment('');
    setDrawer('detail');
  };

  const openDetail = (record: Recognition) => {
    setActiveId(record.id);
    setReviewComment('');
    setDrawer('detail');
  };

  const openReview = (record: Recognition) => {
    if (!canReviewPeerRecords(settings, DEMO_CURRENT_USER)) {
      message.warning('当前账号不是审核员，无审核权限');
      return;
    }
    openDetail(record);
  };

  const closeDrawer = () => {
    setDrawer(null);
    setActiveId(null);
    setReviewComment('');
    setRejectOpen(false);
  };

  const confirmWithdraw = (id: string) => {
    modal.confirm({
      title: '确认撤回该发放？',
      content: '将扣回对象已入账积分，并保留发放日志。',
      okText: '确认撤回',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        withdrawRecognition(id);
        message.success('已撤回');
        closeDrawer();
      },
    });
  };

  const submitReject = () => {
    if (!active) return;
    if (!reviewComment.trim()) {
      message.warning('驳回须填写审核意见');
      return;
    }
    rejectRecognition(active.id, reviewComment);
    message.success('已驳回');
    closeDrawer();
  };

  const confirmApprove = () => {
    if (!active) return;
    modal.confirm({
      title: '确认通过并发放？',
      content: `将向 ${active.receiver} 发放「${active.badgeName}」及 ${active.points} 积分。`,
      okText: '通过并发放',
      cancelText: '取消',
      onOk: () => {
        approveRecognition(active.id);
        message.success('已通过并发放');
        closeDrawer();
      },
    });
  };

  const submitCommend = async () => {
    const values = await commendForm.validateFields().catch(() => null);
    if (!values) return;
    if (values.reason.trim().length < settings.minimumReasonLength) {
      message.warning(`表彰事由至少填写 ${settings.minimumReasonLength} 个字`);
      return;
    }
    const people = (values.employeeNames ?? []).filter(Boolean);
    if (people.length === 0) {
      message.warning('请选择表彰对象');
      return;
    }
    if (!values.badgeId) {
      message.warning('请选择公司勋章');
      return;
    }
    if (!values.files?.length) {
      message.warning('请上传证明材料');
      return;
    }
    const attachments = await proofFilesToAttachments(values.files);
    if (!attachments.length) {
      message.warning('请上传证明材料');
      return;
    }
    issueCommendation({
      employeeNames: people,
      badgeId: values.badgeId,
      reason: values.reason.trim(),
      attachments,
    });
    message.success(`已生成 ${people.length} 条公司表彰记录`);
    commendForm.resetFields();
    closeDrawer();
  };

  const columns: TableColumnsType<Recognition> = recognitionRecordColumns({
    rules: settings.rules,
    displayedOf,
    onDetail: openDetail,
    reasonLabelByType: true,
    extraActions: (record, shown) => {
      const actions: TableRowAction[] = [];
      if (shown === '待审核' && canReview) {
        actions.push({ key: 'review', label: '审核', ariaLabel: `审核 ${record.id}`, onClick: () => openReview(record) });
      }
      if (shown === '已发放') {
        actions.push({
          key: 'withdraw',
          label: '撤回',
          ariaLabel: `撤回 ${record.id}`,
          danger: true,
          onClick: () => confirmWithdraw(record.id),
        });
      }
      return actions;
    },
  });

  const activeDisplayed = active ? displayedOf(active) : null;
  const showPendingReview = Boolean(activeDisplayed && canOperatePendingReview(activeDisplayed, canReview));

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={['即时激励', '发放记录']}
        title="发放记录"
        subtitle="查询与追溯全部勋章发放记录"
      />
      <SearchPanel
        onSearch={() => setQuery({ ...draft, id: draft.id.trim(), receiver: draft.receiver.trim(), giver: draft.giver.trim() })}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
        }}
      >
        <SearchField label="认可编号">
          <Input allowClear placeholder="请输入编号" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
        </SearchField>
        <SearchField label="认可对象">
          <Input
            allowClear
            placeholder="姓名或工号"
            value={draft.receiver}
            onChange={(e) => setDraft({ ...draft, receiver: e.target.value })}
          />
        </SearchField>
        <SearchField label="发起人">
          <Input
            allowClear
            placeholder="请输入发起人"
            value={draft.giver}
            onChange={(e) => setDraft({ ...draft, giver: e.target.value })}
          />
        </SearchField>
        <SearchField label="认可类型">
          <Select
            value={draft.type}
            onChange={(value) => setDraft({ ...draft, type: value })}
            options={[
              { value: '全部', label: '全部' },
              { value: '同事认可', label: '同事认可' },
              { value: '公司表彰', label: '公司表彰' },
            ]}
          />
        </SearchField>
        <SearchField label="所属部门">
          <TreeSelect
            allowClear
            treeData={ORG_TREE}
            value={draft.department}
            onChange={(value) => setDraft({ ...draft, department: value })}
            placeholder="请选择部门"
            treeDefaultExpandAll
            style={{ width: '100%' }}
          />
        </SearchField>
        <SearchField label="发起时间">
          <DatePicker.RangePicker
            value={draft.range}
            onChange={(value) => setDraft({ ...draft, range: value as [Dayjs, Dayjs] | null })}
            style={{ width: '100%' }}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            value={draft.status}
            onChange={(value) => setDraft({ ...draft, status: value })}
            options={[
              { value: '全部', label: '全部' },
              { value: '已发放', label: '已发放' },
              { value: '待审核', label: '待审核' },
              { value: '已驳回', label: '已驳回' },
              { value: '已撤回', label: '已撤回' },
            ]}
          />
        </SearchField>
        <SearchField label="异常标识">
          <Select
            value={draft.riskFlag}
            onChange={(value) => setDraft({ ...draft, riskFlag: value })}
            options={[
              { value: '全部', label: '全部' },
              { value: '异常', label: '异常' },
              { value: '正常', label: '正常' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary">共 {filtered.length} 条</Typography.Text>
            <Space>
              <Button
                onClick={() => {
                  message.success('已导出发放记录');
                }}
              >
                导出
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  commendForm.resetFields();
                  commendForm.setFieldsValue({
                    employeeNames: [],
                    month: dayjs(),
                    files: [],
                    publishRange: 'all',
                  });
                  setDrawer('commend');
                }}
              >
                发布公司表彰
              </Button>
            </Space>
          </Flex>
        }
      >
        <Table<Recognition>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1280 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </ListTableCard>

      <Drawer
        title="认可详情"
        open={drawer === 'detail' && Boolean(active)}
        onClose={closeDrawer}
        width={DRAWER_WIDTH}
        destroyOnHidden
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={closeDrawer}>关闭</Button>
            {showPendingReview ? (
              <>
                <Button
                  danger
                  onClick={() => {
                    setReviewComment('');
                    setRejectOpen(true);
                  }}
                >
                  驳回
                </Button>
                <Button type="primary" onClick={confirmApprove}>
                  通过并发放
                </Button>
              </>
            ) : null}
            {activeDisplayed === '已发放' ? (
              <Button danger onClick={() => active && confirmWithdraw(active.id)}>
                撤回认可
              </Button>
            ) : null}
          </Flex>
        }
      >
        {active ? (
          <RecognitionFields
            record={active}
            displayed={activeDisplayed ?? active.status}
            personalReviewEnabled={settings.personalReviewEnabled}
            rules={settings.rules}
            onOpenRelated={openRelated}
          />
        ) : null}
      </Drawer>

      <Modal
        title="驳回认可"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          setReviewComment('');
        }}
        onOk={submitReject}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <Form layout="horizontal" className="edit-form" labelCol={{ flex: '0 0 112px' }} wrapperCol={{ flex: 1 }}>
          <Form.Item label="审核意见" required extra="须说明驳回原因，将写入处理记录">
            <Input.TextArea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="请填写驳回原因"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="发布公司表彰"
        open={drawer === 'commend'}
        onClose={closeDrawer}
        width={COMMEND_DRAWER_WIDTH}
        destroyOnHidden
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={closeDrawer}>取消</Button>
            <Button
              type="primary"
              disabled={!selectedPeople.length || !selectedBadgeId || !selectedFiles.length}
              onClick={() => void submitCommend()}
            >
              确认发放
            </Button>
          </Flex>
        }
      >
        <Alert
          className="incentive-commend-alert"
          type="info"
          showIcon
          message="公司表彰免审核"
          description="由授权管理员发布，确认后勋章与积分直接发放，不进入审核队列。"
        />
        <Form
          form={commendForm}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          labelCol={{ flex: '0 0 112px' }}
          wrapperCol={{ flex: 1 }}
          initialValues={{
            employeeNames: [],
            month: dayjs(),
            files: [],
            publishRange: 'all',
          }}
        >
          <Form.Item name="employeeNames" label="表彰对象" rules={[{ required: true, message: '请选择表彰对象' }]}>
            <TreeSelect
              treeCheckable
              showSearch
              treeDefaultExpandAll
              treeNodeFilterProp="title"
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              treeData={INCENTIVE_PEOPLE_TREE}
              placeholder="按组织展开，可选择多名员工"
              maxTagCount="responsive"
            />
          </Form.Item>
          {selectedPeople.length > 0 ? (
            <Form.Item label="发放汇总">
              <div className="incentive-commend-summary">
                <InfoCircleOutlined />
                <span>
                  已选择 {selectedPeople.length} 人，将生成 {selectedPeople.length} 条记录
                  {selectedBadge ? `，共发放 ${totalPoints} 积分` : ''}
                </span>
                <Button type="link" onClick={() => commendForm.setFieldValue('employeeNames', [])}>
                  清空
                </Button>
              </div>
            </Form.Item>
          ) : null}
          <Form.Item name="badgeId" label="公司勋章" rules={[{ required: true, message: '请选择公司勋章' }]}>
            <Select placeholder="按分类选择公司表彰勋章" options={companyBadgeOptions} />
          </Form.Item>
          {selectedBadge ? (
            <Form.Item label="认定说明">
              <CommendationGuidance badge={selectedBadge} categoryName={selectedCategoryName} />
            </Form.Item>
          ) : null}
          <Form.Item name="month" label="表彰月份" rules={[{ required: true, message: '请选择表彰月份' }]}>
            <DatePicker picker="month" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="表彰事由"
            extra={`至少填写 ${settings.minimumReasonLength} 个字`}
            rules={[
              { required: true, message: '请填写表彰事由' },
              {
                validator: async (_, value: string) => {
                  const check = validateCommendationReason(value ?? '', settings.minimumReasonLength);
                  if (!check.ok) return Promise.reject(new Error(`表彰事由至少填写 ${settings.minimumReasonLength} 个字`));
                },
              },
            ]}
          >
            <Input.TextArea rows={4} showCount placeholder={settings.reasonPlaceholder} />
          </Form.Item>
          <Form.Item
            name="files"
            label="证明材料"
            valuePropName="fileList"
            getValueFromEvent={(event: { fileList?: UploadFile[] } | UploadFile[]) => {
              const list = Array.isArray(event) ? event : (event.fileList ?? []);
              if (list.length > PROOF_MAX_COUNT) message.warning(`最多上传 ${PROOF_MAX_COUNT} 个文件`);
              return list.slice(0, PROOF_MAX_COUNT);
            }}
            rules={[{ required: true, type: 'array', min: 1, message: '请上传证明材料' }]}
          >
            <Upload.Dragger
              multiple
              maxCount={PROOF_MAX_COUNT}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              beforeUpload={(file) => {
                if (file.size > PROOF_MAX_MB * 1024 * 1024) {
                  message.warning(`单个文件不能超过 ${PROOF_MAX_MB}MB`);
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>点击或拖拽上传表彰文件、名单或证明材料</p>
              <small>至少 1 个，最多 {PROOF_MAX_COUNT} 个；单个不超过 {PROOF_MAX_MB}MB</small>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item name="publishRange" label="发布范围">
            <Radio.Group
              options={[
                { value: 'all', label: '全员可见' },
                { value: 'org', label: '指定部门' },
              ]}
            />
          </Form.Item>
          {publishRange === 'org' ? (
            <Form.Item name="orgIds" label="指定部门" rules={[{ required: true, type: 'array', min: 1, message: '请选择指定部门' }]}>
              <TreeSelect
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                treeData={ORG_TREE}
                placeholder="请选择部门"
              />
            </Form.Item>
          ) : null}
        </Form>
      </Drawer>
    </div>
  );
}
