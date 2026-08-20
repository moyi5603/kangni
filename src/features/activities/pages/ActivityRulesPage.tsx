import { useMemo, useState, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  TreeSelect,
  Typography,
} from 'antd';
import type { FormInstance, TableColumnsType } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  activityTypes,
  orgDepartmentTree,
  orgPeoplePickerTree,
  type ActivityType,
} from '../model/activity';
import {
  cloneRules,
  createApprovalNode,
  duplicateYearIndexes,
  prepareRulesForSave,
  type ActivityTypeRule,
  type ApprovalNode,
  type AssigneeMode,
  type SignupLadder,
} from '../model/rules';
import { saveRules, useRules } from '../model/rulesStore';

type RulesTab = 'signup' | 'moments' | 'approval';

type FormValues = {
  rules: ActivityTypeRule[];
};

type LadderModalValues = {
  typeIndex: number;
  minSeniorityYears: number;
  annualQuota: number;
};

type NodeModalValues = {
  typeIndex: number;
  assigneeMode: AssigneeMode;
  reviewerIds?: string[];
  departmentId?: string;
};

type LadderRow = SignupLadder & {
  key: string;
  type: ActivityType;
  typeIndex: number;
  ladderIndex: number;
};

type NodeRow = ApprovalNode & {
  key: string;
  type: ActivityType;
  typeIndex: number;
  nodeIndex: number;
};

function confirmFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function typeOptions() {
  return activityTypes.map((type, typeIndex) => ({ value: typeIndex, label: type }));
}

function formatReviewers(node: ApprovalNode) {
  if (node.assigneeMode === 'department') return node.departmentId || '—';
  return node.reviewerIds.length ? node.reviewerIds.join('、') : '—';
}

function persistRules(form: FormInstance<FormValues>) {
  const next = prepareRulesForSave(form.getFieldValue('rules') ?? []);
  saveRules(next);
  form.setFieldsValue({ rules: cloneRules(next) });
}

function toLadderRows(rules: ActivityTypeRule[] | undefined): LadderRow[] {
  return activityTypes.flatMap((type, typeIndex) =>
    (rules?.[typeIndex]?.signupLadders ?? []).map((ladder, ladderIndex) => ({
      ...ladder,
      key: `${type}-${ladderIndex}-${ladder.minSeniorityYears}`,
      type,
      typeIndex,
      ladderIndex,
    })),
  );
}

function SignupTab({ form, rules }: { form: FormInstance<FormValues>; rules: ActivityTypeRule[] | undefined }) {
  const { modal, message } = App.useApp();
  const [modalForm] = Form.useForm<LadderModalValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LadderRow | null>(null);
  const rows = useMemo(() => toLadderRows(rules), [rules]);

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    modalForm.resetFields();
  };

  const openCreate = () => {
    setEditing(null);
    modalForm.setFieldsValue({ typeIndex: 0 });
    setOpen(true);
  };

  const openEdit = (record: LadderRow) => {
    setEditing(record);
    modalForm.setFieldsValue({
      typeIndex: record.typeIndex,
      minSeniorityYears: record.minSeniorityYears,
      annualQuota: record.annualQuota,
    });
    setOpen(true);
  };

  const submitModal = async () => {
    const values = await modalForm.validateFields();
    const current = [...(form.getFieldValue(['rules', values.typeIndex, 'signupLadders']) ?? [])] as SignupLadder[];
    const row = { minSeniorityYears: values.minSeniorityYears, annualQuota: values.annualQuota };
    if (editing && editing.typeIndex === values.typeIndex) current[editing.ladderIndex] = row;
    else if (editing) {
      const from = [...(form.getFieldValue(['rules', editing.typeIndex, 'signupLadders']) ?? [])] as SignupLadder[];
      from.splice(editing.ladderIndex, 1);
      form.setFieldValue(['rules', editing.typeIndex, 'signupLadders'], from);
      current.push(row);
    } else current.push(row);
    if (duplicateYearIndexes(current).length) {
      modalForm.setFields([{ name: 'minSeniorityYears', errors: ['同一类型入职年限不能重复'] }]);
      return;
    }
    form.setFieldValue(['rules', values.typeIndex, 'signupLadders'], current);
    persistRules(form);
    message.success(editing ? '报名条件已更新' : '报名条件已添加');
    closeModal();
  };

  const removeRow = (record: LadderRow) => {
    modal.confirm({
      title: `确认删除「${record.type}」入职满 ${record.minSeniorityYears} 年的报名条件？`,
      content: '删除后立即生效。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        const current = [...(form.getFieldValue(['rules', record.typeIndex, 'signupLadders']) ?? [])] as SignupLadder[];
        current.splice(record.ladderIndex, 1);
        form.setFieldValue(['rules', record.typeIndex, 'signupLadders'], current);
        persistRules(form);
        message.success(`已删除「${record.type}」入职满 ${record.minSeniorityYears} 年的报名条件`);
      },
    });
  };

  const columns: TableColumnsType<LadderRow> = [
    { title: '活动类型', dataIndex: 'type' },
    { title: '入职满（年）', dataIndex: 'minSeniorityYears', align: 'right', width: 140 },
    { title: '每年报名机会（次）', dataIndex: 'annualQuota', align: 'right', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`编辑${record.type}入职满${record.minSeniorityYears}年`} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger aria-label={`删除${record.type}入职满${record.minSeniorityYears}年`} onClick={() => removeRow(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Typography.Text type="secondary">多条按入职年限匹配，取最高档。未设置则不限。配置后立即生效。</Typography.Text>
      <Card>
        <div className="table-toolbar">
          <Button icon={<PlusOutlined />} onClick={openCreate}>
            添加报名条件
          </Button>
        </div>
        <Table
          rowKey="key"
          sticky
          columns={columns}
          dataSource={rows}
          scroll={{ x: 640 }}
          pagination={false}
          locale={{ emptyText: <Empty description="未设置，报名年限和次数不限" /> }}
        />
      </Card>
      <Modal
        title={editing ? '编辑报名条件' : '添加报名条件'}
        open={open}
        footer={confirmFooter}
        onOk={() => void submitModal()}
        onCancel={closeModal}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form form={modalForm} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          <Form.Item name="typeIndex" label="活动类型" rules={[{ required: true, message: '请选择活动类型' }]}>
            <Select options={typeOptions()} disabled={Boolean(editing)} placeholder="请选择活动类型" />
          </Form.Item>
          <Form.Item label="入职满" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="minSeniorityYears"
                noStyle
                rules={[
                  { required: true, message: '请输入入职年限' },
                  {
                    validator: async (_, value: number) => {
                      if (value == null) return;
                      if (!Number.isInteger(value) || value < 0) throw new Error('入职年限须为大于等于 0 的整数');
                    },
                  },
                ]}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              <Button disabled>年</Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="每年报名机会" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="annualQuota"
                noStyle
                rules={[
                  { required: true, message: '请输入每年报名次数' },
                  {
                    validator: async (_, value: number) => {
                      if (value == null) return;
                      if (!Number.isInteger(value) || value < 1) throw new Error('每年报名次数须为大于等于 1 的整数');
                    },
                  },
                ]}
              >
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              <Button disabled>次</Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function ApprovalTab({ form, rules }: { form: FormInstance<FormValues>; rules: ActivityTypeRule[] | undefined }) {
  const { modal, message } = App.useApp();
  const [modalForm] = Form.useForm<NodeModalValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NodeRow | null>(null);
  const assigneeMode = (Form.useWatch('assigneeMode', modalForm) as AssigneeMode | undefined) ?? 'people';
  const modalTypeIndex = Form.useWatch('typeIndex', modalForm) as number | undefined;
  const modalTypeName = activityTypes[modalTypeIndex ?? editing?.typeIndex ?? 0];

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    modalForm.resetFields();
  };

  const setApprovalEnabled = (type: ActivityType, typeIndex: number, checked: boolean) => {
    const nodes = (form.getFieldValue(['rules', typeIndex, 'approvalNodes']) ?? []) as ApprovalNode[];
    const apply = () => {
      form.setFieldValue(['rules', typeIndex, 'approvalEnabled'], checked);
      persistRules(form);
      message.success(checked ? `已开启「${type}」审批` : `已关闭「${type}」审批`);
    };
    if (!checked && nodes.length) {
      modal.confirm({
        title: `确认关闭「${type}」审批？`,
        content: '关闭后将清空该类型的审批节点，立即生效。',
        okText: '确认',
        cancelText: '取消',
        footer: confirmFooter,
        onOk: apply,
      });
      return;
    }
    apply();
  };

  const openCreate = (typeIndex: number) => {
    setEditing(null);
    modalForm.setFieldsValue({ typeIndex, assigneeMode: 'people', reviewerIds: [], departmentId: undefined });
    setOpen(true);
  };

  const openEdit = (record: NodeRow) => {
    setEditing(record);
    modalForm.setFieldsValue({
      typeIndex: record.typeIndex,
      assigneeMode: record.assigneeMode,
      reviewerIds: record.reviewerIds,
      departmentId: record.departmentId,
    });
    setOpen(true);
  };

  const submitModal = async () => {
    const values = await modalForm.validateFields();
    const typeIndex = Number(values.typeIndex);
    const current = [...(form.getFieldValue(['rules', typeIndex, 'approvalNodes']) ?? [])] as ApprovalNode[];
    const row: ApprovalNode = {
      id: editing && editing.typeIndex === typeIndex ? editing.id : createApprovalNode().id,
      assigneeMode: values.assigneeMode,
      reviewerIds: values.assigneeMode === 'people' ? values.reviewerIds ?? [] : [],
      departmentId: values.assigneeMode === 'department' ? values.departmentId : undefined,
    };
    if (editing && editing.typeIndex === typeIndex) current[editing.nodeIndex] = row;
    else current.push(row);
    form.setFieldValue(['rules', typeIndex, 'approvalNodes'], current);
    persistRules(form);
    message.success(editing ? '审批节点已更新' : '审批节点已添加');
    closeModal();
  };

  const removeRow = (record: NodeRow) => {
    modal.confirm({
      title: `确认删除「${record.type}」第 ${record.nodeIndex + 1} 节点？`,
      content: '删除后立即生效。',
      okText: '确认',
      cancelText: '取消',
      footer: confirmFooter,
      onOk: () => {
        const current = [...(form.getFieldValue(['rules', record.typeIndex, 'approvalNodes']) ?? [])] as ApprovalNode[];
        current.splice(record.nodeIndex, 1);
        form.setFieldValue(['rules', record.typeIndex, 'approvalNodes'], current);
        persistRules(form);
        message.success(`已删除「${record.type}」第 ${record.nodeIndex + 1} 节点`);
      },
    });
  };

  const columns: TableColumnsType<{ type: ActivityType; typeIndex: number }> = [
    { title: '活动类型', dataIndex: 'type', width: 160 },
    {
      title: '开启审批',
      width: 140,
      render: (_, record) => (
        <Switch
          checked={Boolean(rules?.[record.typeIndex]?.approvalEnabled)}
          checkedChildren="开"
          unCheckedChildren="关"
          aria-label={`开启${record.type}审批`}
          onChange={(checked) => setApprovalEnabled(record.type, record.typeIndex, checked)}
        />
      ),
    },
    {
      title: '审批节点',
      render: (_, record) => {
        const enabled = Boolean(rules?.[record.typeIndex]?.approvalEnabled);
        if (!enabled) return <Typography.Text type="secondary">未开启</Typography.Text>;
        const nodes = rules?.[record.typeIndex]?.approvalNodes ?? [];
        return (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            {nodes.length === 0 ? <Typography.Text type="secondary">未设置节点</Typography.Text> : null}
            {nodes.map((node, nodeIndex) => (
              <Space key={node.id} wrap>
                <Typography.Text>
                  第 {nodeIndex + 1} 节点：{node.assigneeMode === 'people' ? '指定审核人' : '指定审核部门'}（{formatReviewers(node)}）
                </Typography.Text>
                <Button
                  type="link"
                  aria-label={`编辑${record.type}第${nodeIndex + 1}节点`}
                  onClick={() =>
                    openEdit({
                      ...node,
                      key: node.id,
                      type: record.type,
                      typeIndex: record.typeIndex,
                      nodeIndex,
                    })
                  }
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  danger
                  aria-label={`删除${record.type}第${nodeIndex + 1}节点`}
                  onClick={() =>
                    removeRow({
                      ...node,
                      key: node.id,
                      type: record.type,
                      typeIndex: record.typeIndex,
                      nodeIndex,
                    })
                  }
                >
                  删除
                </Button>
              </Space>
            ))}
            <Button type="link" icon={<PlusOutlined />} aria-label={`添加${record.type}审批节点`} onClick={() => openCreate(record.typeIndex)}>
              添加审批节点
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <Table
          rowKey="type"
          sticky
          pagination={false}
          scroll={{ x: 720 }}
          dataSource={activityTypes.map((type, typeIndex) => ({ type, typeIndex }))}
          columns={columns}
        />
      </Card>
      <Modal
        title={editing ? `编辑审批节点（${modalTypeName}）` : `添加审批节点（${modalTypeName}）`}
        open={open}
        footer={confirmFooter}
        onOk={() => void submitModal()}
        onCancel={closeModal}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form
          form={modalForm}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          validateTrigger="onBlur"
          initialValues={{ assigneeMode: 'people', reviewerIds: [] }}
        >
          <Form.Item name="typeIndex" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="assigneeMode" label="指派方式" rules={[{ required: true, message: '请选择指派方式' }]}>
            <Radio.Group
              options={[
                { value: 'people', label: '指定审核人' },
                { value: 'department', label: '指定审核部门' },
              ]}
              onChange={() => {
                modalForm.setFieldValue('reviewerIds', []);
                modalForm.setFieldValue('departmentId', undefined);
              }}
            />
          </Form.Item>
          {assigneeMode === 'people' ? (
            <Form.Item
              name="reviewerIds"
              label="审核人"
              extra="可多选，任意一人通过即完成本节点。"
              rules={[{ required: true, type: 'array', min: 1, message: '请选择审核人' }]}
            >
              <TreeSelect
                treeData={orgPeoplePickerTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请按组织架构选择审核人"
                style={{ width: '100%' }}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="departmentId"
              label="审核部门"
              extra="单选。仅该部门负责人通过即完成本节点。"
              rules={[{ required: true, message: '请选择审核部门' }]}
            >
              <TreeSelect
                treeData={orgDepartmentTree}
                treeDefaultExpandAll
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请选择审核部门"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}

export function ActivityRulesPage() {
  const { message } = App.useApp();
  const saved = useRules();
  const [form] = Form.useForm<FormValues>();
  const [tab, setTab] = useState<RulesTab>('signup');
  const rulesWatch = Form.useWatch('rules', form) ?? saved;

  const setMomentAudit = (type: ActivityType, typeIndex: number, checked: boolean) => {
    form.setFieldValue(['rules', typeIndex, 'momentAuditEnabled'], checked);
    persistRules(form);
    message.success(checked ? `已开启「${type}」精彩瞬间审核` : `已关闭「${type}」精彩瞬间审核`);
  };

  const momentColumns: TableColumnsType<{ type: ActivityType; typeIndex: number }> = [
    { title: '活动类型', dataIndex: 'type' },
    {
      title: '开启精彩瞬间审核',
      render: (_, record) => (
        <Switch
          checked={Boolean(rulesWatch?.[record.typeIndex]?.momentAuditEnabled)}
          checkedChildren="开"
          unCheckedChildren="关"
          aria-label={`开启${record.type}精彩瞬间审核`}
          onChange={(checked) => setMomentAudit(record.type, record.typeIndex, checked)}
        />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={['活动', '规则设置']}
        title="规则设置"
        subtitle="按活动类型配置报名资格、精彩瞬间审核和活动审批流。配置后立即生效。"
      />
      <Form form={form} layout="horizontal" className="edit-form" labelWrap={false} initialValues={{ rules: cloneRules(saved) }}>
        <Tabs
          activeKey={tab}
          destroyOnHidden={false}
          onChange={(key) => setTab(key as RulesTab)}
          items={[
            {
              key: 'signup',
              label: '报名设置',
              forceRender: true,
              children: (
                <div className="page-stack">
                  <SignupTab form={form} rules={rulesWatch} />
                </div>
              ),
            },
            {
              key: 'moments',
              label: '精彩瞬间设置',
              forceRender: true,
              children: (
                <Card>
                  <Table
                    rowKey="type"
                    sticky
                    pagination={false}
                    scroll={{ x: 480 }}
                    dataSource={activityTypes.map((type, typeIndex) => ({ type, typeIndex }))}
                    columns={momentColumns}
                  />
                </Card>
              ),
            },
            {
              key: 'approval',
              label: '审批流设置',
              forceRender: true,
              children: (
                <div className="page-stack">
                  <ApprovalTab form={form} rules={rulesWatch} />
                </div>
              ),
            },
          ]}
        />
      </Form>
    </div>
  );
}
