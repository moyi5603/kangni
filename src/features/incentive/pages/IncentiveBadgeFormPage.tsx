import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Empty, Flex, Form, Input, InputNumber, Select, Switch, TreeSelect, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { IMAGE_UPLOAD_ACCEPT, SQUARE_IMAGE_UPLOAD_HINT } from '../../../shared/ui/imageUploadHint';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { readTreeQueryFromHash } from '../model/badgeTreeIds';
import {
  BADGE_ORG_TREE,
  BADGE_SECTIONS,
  DEFAULT_BADGE_DESCRIPTION,
  DEFAULT_BADGE_ORG_IDS,
  parseBadgeDescription,
  validateBadgeDescription,
  type Badge,
} from '../model/incentive';
import { getBadges, saveBadge, useCategories, useScopes } from '../model/incentiveStore';

function formatBadgeDescription(record: Badge): string {
  const values = {
    definition: record.definition,
    criteria: record.criteria.map((line) => `- ${line}`).join('\n'),
    examples: record.examples.map((line) => `- ${line}`).join('\n'),
    exclusions: record.exclusions.map((line) => `- ${line}`).join('\n'),
  };
  return BADGE_SECTIONS.map((section) => `${section.title}\n${values[section.key]}`).join('\n\n');
}

function toFileList(url: string): UploadFile[] {
  if (!url) return [];
  return [{ uid: '-1', name: 'icon', status: 'done', url }];
}

type FormValues = {
  scopeId: string;
  categoryId: string;
  name: string;
  points: number;
  iconUrl?: string;
  orgIds: string[];
  enabled: boolean;
  description: string;
};

export function IncentiveBadgeFormPage({
  mode,
  recordId,
  onBack,
  onSaved,
}: {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const scopes = useScopes();
  const categories = useCategories();
  const editing = mode === 'edit' ? getBadges().find((item) => item.id === recordId) : undefined;
  const treeId = readTreeQueryFromHash();
  const treeCategory = categories.find((item) => item.id === treeId);
  const treeScopeId = treeCategory?.scopeId ?? (scopes.some((item) => item.id === treeId) ? treeId : undefined);

  const initialValues: FormValues = editing
    ? {
        scopeId: editing.scopeId,
        categoryId: editing.categoryId,
        name: editing.name,
        points: editing.points,
        iconUrl: editing.iconUrl,
        orgIds: editing.orgIds,
        enabled: editing.enabled,
        description: formatBadgeDescription(editing),
      }
    : {
        scopeId: treeScopeId ?? scopes[0]?.id,
        categoryId: treeCategory?.id ?? '',
        name: '',
        points: 1,
        iconUrl: '',
        orgIds: DEFAULT_BADGE_ORG_IDS,
        enabled: true,
        description: DEFAULT_BADGE_DESCRIPTION,
      };

  const [iconList, setIconList] = useState<UploadFile[]>(toFileList(initialValues.iconUrl ?? ''));
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scopeId = Form.useWatch('scopeId', form) ?? initialValues.scopeId;
  const categoryOptions = useMemo(
    () => categories.filter((item) => item.scopeId === scopeId).map((item) => ({ value: item.id, label: item.name })),
    [categories, scopeId],
  );

  if (mode === 'edit' && !editing) {
    return (
      <div className="page-stack">
        <ListPageHeading paths={['即时激励', '勋章管理', '编辑勋章']} title="编辑勋章" subtitle="勋章不存在或已删除。" />
        <Empty description="勋章不存在或已删除" />
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  const title = mode === 'create' ? '新建勋章' : '编辑勋章';

  const leave = () => {
    if (!b2bStandards.form.unsavedChangesGuard || !dirty) {
      onBack();
      return;
    }
    modal.confirm({
      title: '确认离开？',
      content: '未保存的修改将丢失。',
      okText: '确认',
      cancelText: '取消',
      onOk: onBack,
    });
  };

  const submit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSubmitting(true);
    const parsed = parseBadgeDescription(values.description);
    const record: Badge = {
      id: editing?.id ?? `b-${Date.now()}`,
      scopeId: values.scopeId,
      categoryId: values.categoryId,
      name: values.name.trim(),
      points: values.points,
      iconUrl: values.iconUrl ?? '',
      orgIds: values.orgIds,
      enabled: values.enabled,
      definition: parsed.definition,
      criteria: parsed.criteria,
      examples: parsed.examples,
      exclusions: parsed.exclusions,
      riskLabel: scopes.find((item) => item.id === values.scopeId)?.name === '公司表彰' ? '直接发放' : '低风险',
    };
    saveBadge(record);
    message.success(mode === 'create' ? '已创建勋章' : '已保存勋章');
    setDirty(false);
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="page-stack advanced-form-page">
      <ListPageHeading paths={['即时激励', '勋章管理', title]} title={title} subtitle="配置勋章归属、积分、图标与四段描述。" />
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        labelCol={{ flex: '0 0 112px' }}
        wrapperCol={{ flex: 1 }}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        initialValues={initialValues}
        onValuesChange={() => setDirty(true)}
      >
        <Form.Item label="勋章图标" required={mode === 'create'} extra={SQUARE_IMAGE_UPLOAD_HINT}>
          <Upload
            accept={IMAGE_UPLOAD_ACCEPT}
            listType="picture-card"
            maxCount={1}
            fileList={iconList}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              const file = fileList[0];
              setIconList(fileList.slice(-1));
              setDirty(true);
              if (file?.originFileObj) {
                const reader = new FileReader();
                reader.onload = () => form.setFieldValue('iconUrl', String(reader.result));
                reader.readAsDataURL(file.originFileObj);
              } else {
                form.setFieldValue('iconUrl', file?.url ?? '');
              }
            }}
          >
            {iconList.length ? null : (
              <button type="button" className="cover-upload-trigger">
                <PlusOutlined />
                <span>上传图标</span>
              </button>
            )}
          </Upload>
        </Form.Item>
        <Form.Item
          name="iconUrl"
          hidden
          rules={mode === 'create' ? [{ required: true, message: '请上传勋章图标' }] : undefined}
        >
          <Input />
        </Form.Item>
        <Form.Item name="scopeId" label="勋章归属" rules={[{ required: true, message: '请选择勋章归属' }]}>
          <Select
            placeholder="请选择勋章归属"
            options={scopes.map((item) => ({ value: item.id, label: item.name }))}
            onChange={() => form.setFieldValue('categoryId', undefined)}
            style={{ maxWidth: 320 }}
          />
        </Form.Item>
        <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="请选择分类" options={categoryOptions} style={{ maxWidth: 320 }} />
        </Form.Item>
        <Form.Item
          name="name"
          label="勋章名称"
          rules={[
            { required: true, whitespace: true, message: '请输入勋章名称' },
            {
              validator: async (_, value: string) => {
                const name = value?.trim();
                const currentScope = form.getFieldValue('scopeId') as string | undefined;
                if (!name || !currentScope) return;
                const taken = getBadges().some(
                  (item) => item.scopeId === currentScope && item.name === name && item.id !== editing?.id,
                );
                if (taken) throw new Error('同一归属下勋章名称不能重复');
              },
            },
          ]}
        >
          <Input maxLength={20} showCount placeholder="请输入勋章名称" style={{ maxWidth: 480 }} />
        </Form.Item>
        <Form.Item
          name="orgIds"
          label="适用组织"
          extra="按组织结构勾选，可选到部门"
          rules={[{ required: true, type: 'array', min: 1, message: '请选择适用组织' }]}
        >
          <TreeSelect
            treeData={BADGE_ORG_TREE}
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_PARENT}
            placeholder="请选择适用组织"
            style={{ maxWidth: 480, width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="points" label="积分" rules={[{ required: true, message: '请输入积分' }]}>
          <InputNumber min={1} precision={0} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[
            { required: true, message: '请按四个分类标题完整填写描述' },
            {
              validator: async (_, value: string) => {
                const result = validateBadgeDescription(value ?? '');
                if (!result.ok) throw new Error('请按四个分类标题完整填写描述');
              },
            },
          ]}
        >
          <Input.TextArea rows={12} placeholder={DEFAULT_BADGE_DESCRIPTION} style={{ maxWidth: 640 }} />
        </Form.Item>
        <div className="sticky-form-actions">
          <Flex justify="flex-end" gap={8}>
            <Button onClick={leave}>取消</Button>
            <Button type="primary" loading={submitting} onClick={submit}>
              保存
            </Button>
          </Flex>
        </div>
      </Form>
    </div>
  );
}
