import { useMemo, useState, type Key } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  TreeSelect,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import {
  findQuotaTargetNode,
  INCENTIVE_PEOPLE_TREE,
  QUOTA_TARGET_TREE,
  quotaMonthlyTotal,
  type QuotaRow,
} from '../model/incentive';
import {
  addQuota,
  applyQuotaBudgetsByKeys,
  setIncentiveSettings,
  updateQuota,
  useIncentiveSettings,
  useQuotas,
} from '../model/incentiveStore';

type SettingsTab = 'points' | 'content' | 'risk';
type QuotaFormMode = 'create' | 'adjust' | 'batch' | null;

const QUOTA_ORG_HEADCOUNT: Record<string, number> = {
  康尼集团: 400,
  轨道交通事业部: 120,
  汽车事业部: 90,
  生产中心: 85,
  供应链管理部: 45,
  人力资源部: 30,
};

function quotaHeadcount(orgValue: string) {
  return QUOTA_ORG_HEADCOUNT[orgValue] ?? 20;
}

type QueryState = {
  month: string;
  keyword: string;
};

const emptyQuery: QueryState = {
  month: '2026-08',
  keyword: '',
};

function readTabFromHash(): SettingsTab {
  if (typeof window === 'undefined') return 'points';
  const query = window.location.hash.split('?')[1] ?? '';
  const tab = new URLSearchParams(query).get('tab');
  if (tab === 'content' || tab === 'risk' || tab === 'points') return tab;
  return 'points';
}

function writeTabToHash(tab: SettingsTab) {
  if (typeof window === 'undefined') return;
  const current = window.location.hash || '#/incentive/incentive-settings';
  const path = current.split('?')[0];
  const params = new URLSearchParams(current.split('?')[1] ?? '');
  params.set('tab', tab);
  const next = `${path}?${params.toString()}`;
  window.history.replaceState(null, '', next);
}

export function IncentiveSettingsPage() {
  const { message, modal } = App.useApp();
  const quotas = useQuotas();
  const settings = useIncentiveSettings();

  const [tab, setTab] = useState<SettingsTab>(() => readTabFromHash());
  const [draft, setDraft] = useState<QueryState>(emptyQuery);
  const [query, setQuery] = useState<QueryState>(emptyQuery);
  const [quotaFormMode, setQuotaFormMode] = useState<QuotaFormMode>(null);
  const [adjustKey, setAdjustKey] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [minLength, setMinLength] = useState(settings.minimumReasonLength);
  const [placeholder, setPlaceholder] = useState(settings.reasonPlaceholder);
  const [quotaForm] = Form.useForm<{ target: string; budget: number; reason?: string }>();

  const filtered = useMemo(
    () =>
      quotas.filter((row) => {
        if (query.keyword && !row.name.includes(query.keyword)) return false;
        return true;
      }),
    [quotas, query],
  );

  const changeTab = (key: string) => {
    const next = key === 'content' || key === 'risk' ? key : 'points';
    setTab(next);
    writeTabToHash(next);
  };

  const openCreate = () => {
    quotaForm.resetFields();
    setAdjustKey(null);
    setQuotaFormMode('create');
  };

  const openAdjust = (row: QuotaRow) => {
    setAdjustKey(row.key);
    quotaForm.setFieldsValue({ target: row.name, budget: row.budget, reason: undefined });
    setQuotaFormMode('adjust');
  };

  const selectedRows = useMemo(
    () => quotas.filter((row) => selectedRowKeys.includes(row.key)),
    [quotas, selectedRowKeys],
  );

  const openBatch = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先勾选要调整的对象');
      return;
    }
    const budgets = new Set(selectedRows.map((row) => row.budget));
    quotaForm.resetFields();
    quotaForm.setFieldsValue({
      budget: budgets.size === 1 ? selectedRows[0]?.budget : undefined,
      reason: undefined,
    });
    setQuotaFormMode('batch');
  };

  const submitQuota = async () => {
    const values = await quotaForm.validateFields();
    if (quotaFormMode === 'batch') {
      const result = applyQuotaBudgetsByKeys(selectedRowKeys.map(String), values.budget);
      message.success(`已批量调整 ${result.updated} 条`);
      setSelectedRowKeys([]);
      setQuotaFormMode(null);
      return;
    }
    if (quotaFormMode === 'adjust' && adjustKey) {
      updateQuota(adjustKey, { budget: values.budget });
      message.success('已调整额度');
      setQuotaFormMode(null);
      return;
    }
    const node = findQuotaTargetNode(values.target);
    if (!node) {
      message.error('请选择对象');
      return;
    }
    const isPerson = node.kind === 'person';
    const result = addQuota({
      key: `q-${Date.now()}`,
      name: node.value,
      employees: isPerson ? 1 : quotaHeadcount(node.value),
      budget: values.budget,
      used: 0,
      objectType: isPerson ? '个人' : '组织',
      employeeId: isPerson ? node.value : undefined,
      department: isPerson ? node.department : node.value,
    });
    if (!result.ok) {
      message.error('该对象已存在额度，请直接调整');
      return;
    }
    message.success('已新增额度');
    setQuotaFormMode(null);
  };

  const saveContent = () => {
    if (minLength < 1) {
      message.error('最少字数须大于等于 1');
      return;
    }
    setIncentiveSettings({
      ...settings,
      minimumReasonLength: minLength,
      reasonPlaceholder: placeholder,
    });
    message.success('已保存填写设置');
  };

  const toggleReview = (checked: boolean) => {
    if (checked) {
      setIncentiveSettings({ ...settings, personalReviewEnabled: true });
      if (settings.reviewerIds.length === 0) {
        message.warning('请指定至少 1 名审核员');
      }
      return;
    }
    modal.confirm({
      title: '关闭同事认可审核？',
      content: '关闭后新提交的同事认可将直接发放',
      okText: '确认关闭',
      cancelText: '取消',
      onOk: () => {
        setIncentiveSettings({ ...settings, personalReviewEnabled: false });
      },
    });
  };

  const changeReviewers = (value: string | string[]) => {
    const reviewerIds = Array.isArray(value) ? value : value ? [value] : [];
    if (settings.personalReviewEnabled && reviewerIds.length === 0) {
      message.warning('开启同事认可审核后须指定至少 1 名审核员');
      return;
    }
    setIncentiveSettings({ ...settings, reviewerIds });
  };

  const toggleRule = (rule: 'duplicate' | 'frequency' | 'mutual', checked: boolean) => {
    setIncentiveSettings({
      ...settings,
      rules: { ...settings.rules, [rule]: checked },
    });
  };

  const changeRuleLimit = (key: 'duplicateSimilarity' | 'frequencyCount' | 'mutualCount', value: number | null) => {
    if (value == null) return;
    setIncentiveSettings({
      ...settings,
      rules: { ...settings.rules, [key]: value },
    });
  };

  const quotaColumns: TableColumnsType<QuotaRow> = [
    { title: '对象', dataIndex: 'name', ellipsis: true },
    { title: '人数', dataIndex: 'employees', width: 88, align: 'right' },
    { title: '单人月度积分额度', dataIndex: 'budget', width: 160, align: 'right' },
    {
      title: '月度积分总额度',
      key: 'total',
      width: 176,
      align: 'right',
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_, row) => quotaMonthlyTotal(row.employees, row.budget),
    },
    {
      title: '已用额度',
      key: 'used',
      width: 180,
      render: (_, row) => {
        const total = quotaMonthlyTotal(row.employees, row.budget);
        const percent = total === 0 ? 0 : Math.min(100, Math.round((row.used / total) * 100));
        return <Progress percent={percent} size="small" />;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 112,
      align: 'right',
      render: (_, row) => (
        <TableRowActions
          moreAriaLabel={`更多操作 ${row.name}`}
          actions={[
            {
              key: 'adjust',
              label: '调整额度',
              ariaLabel: `调整额度 ${row.name}`,
              onClick: () => openAdjust(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={['即时激励', '规则设置']}
        title="规则设置"
        subtitle="统一配置积分额度、内容填写、审核与风控规则"
      />
      <Tabs
        activeKey={tab}
        onChange={changeTab}
        items={[
          {
            key: 'points',
            label: '积分设置',
            forceRender: true,
            children: (
              <>
                <SearchPanel
                  onSearch={() => {
                    setQuery({ ...draft, keyword: draft.keyword.trim() });
                    setSelectedRowKeys([]);
                  }}
                  onReset={() => {
                    setDraft(emptyQuery);
                    setQuery(emptyQuery);
                    setSelectedRowKeys([]);
                  }}
                >
                  <SearchField label="统计月份">
                    <DatePicker
                      picker="month"
                      allowClear={false}
                      placeholder="选择月份"
                      value={draft.month ? dayjs(draft.month) : null}
                      onChange={(value: Dayjs | null) => setDraft({ ...draft, month: value ? value.format('YYYY-MM') : '' })}
                    />
                  </SearchField>
                  <SearchField label="关键词">
                    <Input
                      allowClear
                      placeholder="对象名称"
                      value={draft.keyword}
                      onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
                    />
                  </SearchField>
                </SearchPanel>
                <ListTableCard
                  toolbar={
                    <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
                      <Typography.Text type="secondary">
                        共 {filtered.length} 条
                        {selectedRowKeys.length ? `，已选 ${selectedRowKeys.length} 条` : ''}
                      </Typography.Text>
                      <Space>
                        <Button disabled={!selectedRowKeys.length} onClick={openBatch}>
                          批量调整
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                          新增
                        </Button>
                      </Space>
                    </Flex>
                  }
                >
                  <Table<QuotaRow>
                    rowKey="key"
                    rowSelection={{
                      selectedRowKeys,
                      preserveSelectedRowKeys: b2bStandards.table.rowSelectionPreserve,
                      onChange: setSelectedRowKeys,
                    }}
                    columns={quotaColumns}
                    dataSource={filtered}
                    scroll={{ x: 960 }}
                    pagination={{
                      pageSize: b2bStandards.table.pageSize,
                      pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
                      showSizeChanger: b2bStandards.table.showSizeChanger,
                      showTotal: (total) => `共 ${total} 条`,
                    }}
                  />
                </ListTableCard>
              </>
            ),
          },
          {
            key: 'content',
            label: '填写设置',
            forceRender: true,
            children: (
              <ListTableCard toolbar={<Typography.Text type="secondary">同事认可原因与公司表彰事由共用此配置</Typography.Text>}>
                <Form layout="horizontal" labelCol={{ flex: '112px' }} wrapperCol={{ flex: 'auto' }} style={{ maxWidth: 640 }}>
                  <Form.Item label="最少字数" required>
                    <InputNumber min={1} value={minLength} onChange={(value) => setMinLength(value ?? 1)} />
                  </Form.Item>
                  <Form.Item
                    label="输入框填写提示"
                    extra="用于员工认可原因和公司表彰事由输入框；留空时不展示提示文案"
                  >
                    <Input.TextArea
                      rows={4}
                      value={placeholder}
                      onChange={(event) => setPlaceholder(event.target.value)}
                      placeholder="建议按「发生场景—具体行为—产生结果」填写"
                    />
                  </Form.Item>
                  <Form.Item label=" " colon={false}>
                    <Button type="primary" onClick={saveContent}>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              </ListTableCard>
            ),
          },
          {
            key: 'risk',
            label: '风控设置',
            forceRender: true,
            children: (
              <div className="page-stack">
                <Card title="审核设置">
                  <Form layout="horizontal" labelCol={{ flex: '160px' }} wrapperCol={{ flex: 'auto' }} style={{ maxWidth: 720 }}>
                    <Form.Item
                      label="同事认可审核"
                      extra="开启后同事认可进入审核队列，仅指定审核员可审核"
                    >
                      <Switch checked={settings.personalReviewEnabled} onChange={toggleReview} />
                    </Form.Item>
                    {settings.personalReviewEnabled ? (
                      <Form.Item
                        label="审核员"
                        required
                        validateStatus={settings.reviewerIds.length ? undefined : 'error'}
                        extra="按组织选择员工；被指定的人拥有发放记录中的审核权限"
                      >
                        <TreeSelect
                          treeCheckable
                          showSearch
                          treeDefaultExpandAll
                          treeNodeFilterProp="title"
                          showCheckedStrategy={TreeSelect.SHOW_CHILD}
                          value={settings.reviewerIds}
                          onChange={changeReviewers}
                          treeData={INCENTIVE_PEOPLE_TREE}
                          placeholder="请选择审核员"
                          style={{ maxWidth: 480, width: '100%' }}
                        />
                      </Form.Item>
                    ) : null}
                  </Form>
                </Card>
                <Card title="异常监控设置">
                  <Typography.Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 16 }}>
                    仅作异常提醒，不禁止行为。命中后只在发放详情和审核页展示提示，不拦截提交、不阻止发放。
                  </Typography.Paragraph>
                  <Form layout="horizontal" labelCol={{ flex: '180px' }} wrapperCol={{ flex: 'auto' }} style={{ maxWidth: 720 }}>
                    <Form.Item
                      label="认可原因重复"
                      extra="识别相似的认可原因描述。开启后填写相似度阈值。"
                    >
                      <Switch checked={settings.rules.duplicate} onChange={(checked) => toggleRule('duplicate', checked)} />
                    </Form.Item>
                    {settings.rules.duplicate ? (
                      <Form.Item label="相似度" required>
                        <InputNumber
                          min={1}
                          max={100}
                          precision={0}
                          value={settings.rules.duplicateSimilarity}
                          addonAfter="%"
                          aria-label="相似度"
                          style={{ width: 160 }}
                          onChange={(value) => changeRuleLimit('duplicateSimilarity', value)}
                        />
                      </Form.Item>
                    ) : null}
                    <Form.Item
                      label="频率异常"
                      extra="30 天内同一发起人向同一对象的发放次数。开启后填写次数阈值。"
                    >
                      <Switch checked={settings.rules.frequency} onChange={(checked) => toggleRule('frequency', checked)} />
                    </Form.Item>
                    {settings.rules.frequency ? (
                      <Form.Item label="次数阈值" required>
                        <InputNumber
                          min={1}
                          precision={0}
                          value={settings.rules.frequencyCount}
                          addonAfter="次/30天"
                          aria-label="频率异常次数"
                          style={{ width: 200 }}
                          onChange={(value) => changeRuleLimit('frequencyCount', value)}
                        />
                      </Form.Item>
                    ) : null}
                    <Form.Item
                      label="双方互认频繁"
                      extra="双方在 30 天内互相认可的次数。开启后填写次数阈值。"
                    >
                      <Switch checked={settings.rules.mutual} onChange={(checked) => toggleRule('mutual', checked)} />
                    </Form.Item>
                    {settings.rules.mutual ? (
                      <Form.Item label="次数阈值" required>
                        <InputNumber
                          min={1}
                          precision={0}
                          value={settings.rules.mutualCount}
                          addonAfter="次/30天"
                          aria-label="双方互认次数"
                          style={{ width: 200 }}
                          onChange={(value) => changeRuleLimit('mutualCount', value)}
                        />
                      </Form.Item>
                    ) : null}
                  </Form>
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={quotaFormMode === 'adjust' ? '调整额度' : quotaFormMode === 'batch' ? '批量调整' : '新增'}
        open={quotaFormMode !== null}
        onCancel={() => setQuotaFormMode(null)}
        onOk={() => void submitQuota()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        width={640}
      >
        <Form form={quotaForm} layout="horizontal" className="edit-form incentive-quota-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          {quotaFormMode === 'batch' ? (
            <Form.Item label="对象">
              <Space size={[4, 8]} wrap>
                {selectedRows.map((row) => (
                  <Tag key={row.key}>{row.name}</Tag>
                ))}
              </Space>
            </Form.Item>
          ) : (
            <Form.Item name="target" label="对象" rules={[{ required: true, message: '请选择对象' }]}>
              <TreeSelect
                treeData={QUOTA_TARGET_TREE}
                disabled={quotaFormMode === 'adjust'}
                placeholder="请选择对象"
                showSearch
                treeDefaultExpandAll
                treeNodeFilterProp="title"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
          <Form.Item name="budget" label="单人月度积分额度" rules={[{ required: true, message: '请输入单人月度积分额度' }]}>
            <InputNumber min={0} precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
