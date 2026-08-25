import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Modal, Radio, Space, TreeSelect, Typography } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { orgPeoplePickerTree } from '../model/activity';
import { createApprovalNode, formatApprovalNodeSummary, type ApprovalNode, type AssigneeMode, assigneeModeLabels } from '../model/rules';

type NodeModalValues = {
  assigneeMode: AssigneeMode;
  reviewerIds?: string[];
  departmentId?: string;
};

type SignupApprovalNodesEditorProps = {
  value?: ApprovalNode[];
  onChange?: (value: ApprovalNode[]) => void;
};

export function SignupApprovalNodesEditor({ value, onChange }: SignupApprovalNodesEditorProps) {
  const { modal } = App.useApp();
  const [modalForm] = Form.useForm<NodeModalValues>();
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const assigneeMode = (Form.useWatch('assigneeMode', modalForm) as AssigneeMode | undefined) ?? 'people';
  const nodes = value ?? [];

  const closeModal = () => {
    setOpen(false);
    setEditingIndex(null);
    modalForm.resetFields();
  };

  const openCreate = () => {
    setEditingIndex(null);
    modalForm.setFieldsValue({ assigneeMode: 'people', reviewerIds: [], departmentId: undefined });
    setOpen(true);
  };

  const openEdit = (index: number) => {
    const node = nodes[index];
    if (!node) return;
    setEditingIndex(index);
    modalForm.setFieldsValue({
      assigneeMode: node.assigneeMode,
      reviewerIds: node.reviewerIds,
      departmentId: node.departmentId,
    });
    setOpen(true);
  };

  const submitModal = async () => {
    const values = await modalForm.validateFields();
    const row: ApprovalNode = {
      id: editingIndex != null ? nodes[editingIndex].id : createApprovalNode().id,
      assigneeMode: values.assigneeMode,
      reviewerIds: values.assigneeMode === 'people' ? values.reviewerIds ?? [] : [],
      departmentId: undefined,
    };
    const next = [...nodes];
    if (editingIndex != null) next[editingIndex] = row;
    else next.push(row);
    onChange?.(next);
    closeModal();
  };

  const removeRow = (index: number) => {
    modal.confirm({
      title: `确认删除第 ${index + 1} 节点？`,
      content: '删除后需保存活动才会生效。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => onChange?.(nodes.filter((_, i) => i !== index)),
    });
  };

  return (
    <>
      <Space orientation="vertical" size={4} style={{ width: '100%' }}>
        {nodes.length === 0 ? <Typography.Text type="secondary">未设置节点</Typography.Text> : null}
        {nodes.map((node, index) => (
          <Space key={node.id} wrap>
            <Typography.Text>
              第 {index + 1} 节点：{formatApprovalNodeSummary(node)}
            </Typography.Text>
            <Button type="link" onClick={() => openEdit(index)}>
              编辑
            </Button>
            <Button type="link" danger onClick={() => removeRow(index)}>
              删除
            </Button>
          </Space>
        ))}
        <Button type="link" icon={<PlusOutlined />} onClick={openCreate} style={{ paddingInline: 0 }}>
          添加审批节点
        </Button>
      </Space>
      <Modal
        title={editingIndex != null ? '编辑审批节点' : '添加审批节点'}
        open={open}
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
          <Form.Item name="assigneeMode" label="指派方式" rules={[{ required: true, message: '请选择指派方式' }]}>
            <Radio.Group
              options={(Object.keys(assigneeModeLabels) as AssigneeMode[]).map((value) => ({
                value,
                label: assigneeModeLabels[value],
              }))}
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
            <Form.Item label=" " colon={false}>
              <Typography.Text type="secondary">
                {assigneeMode === 'sameLevelLeader'
                  ? '按报名人所属部门，由本级部门负责人审核。'
                  : '按报名人所属部门，由上级部门负责人审核。'}
              </Typography.Text>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
