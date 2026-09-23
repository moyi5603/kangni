import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Space, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { getCategories } from '../../incentive/model/incentiveStore';
import {
  MEDAL_APPS,
  MEDAL_INCENTIVE_TYPES,
  incentiveScopeId,
  validateMedalDraft,
  type MedalApp,
  type MedalDraft,
  type MedalIncentiveType,
  type MedalRecord,
} from '../model/medal';
import { createMedal, updateMedal } from '../model/medalStore';

const MEDAL_IMAGE_HINT = '支持 JPG、PNG 格式，建议尺寸 200×200';
const MEDAL_IMAGE_ACCEPT = '.png,.jpeg,.jpg';

type FormValues = {
  name: string;
  imageUrl: string;
  app: MedalApp;
  description: string;
  incentiveType?: MedalIncentiveType;
  categoryId?: string;
};

function toFileList(url: string): UploadFile[] {
  if (!url) return [];
  return [{ uid: '-1', name: '勋章图片', status: 'done', url }];
}

function emptyDraft(): FormValues {
  return { name: '', imageUrl: '', app: '通用', description: '', incentiveType: undefined, categoryId: undefined };
}

export function MedalFormModal({
  open,
  mode,
  record,
  onCancel,
  onSaved,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  record?: MedalRecord;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const initialValues: FormValues =
    mode === 'edit' && record
      ? {
          name: record.name,
          imageUrl: record.imageUrl,
          app: record.app,
          description: record.description,
          incentiveType: record.incentiveType,
          categoryId: record.categoryId,
        }
      : emptyDraft();
  const [fileList, setFileList] = useState<UploadFile[]>(() => toFileList(initialValues.imageUrl));
  const [saving, setSaving] = useState(false);
  const appValue = Form.useWatch('app', form) ?? initialValues.app;
  const incentiveType = Form.useWatch('incentiveType', form) ?? initialValues.incentiveType;
  const incentiveOpen = appValue === '即时激励';
  const categoryOptions = getCategories()
    .filter((item) => incentiveType && item.scopeId === incentiveScopeId(incentiveType))
    .map((item) => ({ value: item.id, label: item.name }));

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && record) {
      form.setFieldsValue({
        name: record.name,
        imageUrl: record.imageUrl,
        app: record.app,
        description: record.description,
        incentiveType: record.incentiveType,
        categoryId: record.categoryId,
      });
      setFileList(toFileList(record.imageUrl));
      return;
    }
    form.setFieldsValue(emptyDraft());
    setFileList([]);
  }, [open, mode, record, form]);

  const submit = () => {
    const values = form.getFieldsValue();
    const draft: MedalDraft = {
      name: values.name ?? '',
      imageUrl: values.imageUrl ?? '',
      app: values.app ?? '',
      description: values.description ?? '',
      incentiveType: values.incentiveType,
      categoryId: values.categoryId,
    };
    const errors = validateMedalDraft(draft, getCategories());
    form.setFields(
      (['name', 'imageUrl', 'app', 'description', 'incentiveType', 'categoryId'] as const).map((name) => ({
        name,
        errors: errors[name] ? [errors[name]!] : [],
      })),
    );
    if (Object.keys(errors).length) return;
    if (!draft.app) return;
    setSaving(true);
    try {
      if (mode === 'edit' && record) {
        updateMedal(record.id, {
          name: draft.name,
          imageUrl: draft.imageUrl,
          app: draft.app,
          description: draft.description,
          incentiveType: draft.app === '即时激励' ? draft.incentiveType : undefined,
          categoryId: draft.app === '即时激励' ? draft.categoryId : undefined,
        });
        message.success('已保存勋章');
      } else {
        createMedal({
          name: draft.name,
          imageUrl: draft.imageUrl,
          app: draft.app,
          description: draft.description,
          incentiveType: draft.incentiveType,
          categoryId: draft.categoryId,
        });
        message.success('已创建勋章');
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'create' ? '创建勋章' : '编辑勋章';
  const formNode = (
    <Form
      form={form}
      layout="horizontal"
      colon
      labelWrap={false}
      labelCol={{ flex: '112px' }}
      wrapperCol={{ flex: 1 }}
      initialValues={initialValues}
    >
      <Form.Item name="imageUrl" label="勋章图片" required extra={MEDAL_IMAGE_HINT}>
        <Upload
          accept={MEDAL_IMAGE_ACCEPT}
          listType="picture-card"
          maxCount={1}
          fileList={fileList}
          beforeUpload={(file) => {
            const reader = new FileReader();
            reader.onload = () => {
              const imageUrl = String(reader.result);
              form.setFieldValue('imageUrl', imageUrl);
              setFileList([{ uid: file.uid, name: file.name, status: 'done', url: imageUrl }]);
            };
            reader.readAsDataURL(file);
            return false;
          }}
          onChange={({ fileList: next }) => {
            const latest = next.slice(-1);
            if (!latest[0]) {
              setFileList([]);
              form.setFieldValue('imageUrl', '');
            }
          }}
        >
          {fileList.length ? null : (
            <button type="button" className="cover-upload-trigger" style={{ width: 96, height: 96 }}>
              <PlusOutlined />
              <span>上传</span>
            </button>
          )}
        </Upload>
      </Form.Item>
      <Form.Item name="name" label="勋章名称" rules={[{ required: true }]}>
        <Input maxLength={30} placeholder="请输入勋章名称" />
      </Form.Item>
      <Form.Item name="app" label="所属应用" rules={[{ required: true }]}>
        <Select
          options={MEDAL_APPS.map((app) => ({ value: app, label: app }))}
          onChange={(value) => {
            if (value !== '即时激励') {
              form.setFieldsValue({ incentiveType: undefined, categoryId: undefined });
            }
          }}
        />
      </Form.Item>
      {incentiveOpen ? (
        <>
          <Form.Item name="incentiveType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              placeholder="请选择类型"
              options={MEDAL_INCENTIVE_TYPES.map((item) => ({ value: item, label: item }))}
              onChange={() => form.setFieldValue('categoryId', undefined)}
            />
          </Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类" options={categoryOptions} />
          </Form.Item>
        </>
      ) : null}
      <span hidden>{[...MEDAL_APPS, ...MEDAL_INCENTIVE_TYPES].join('、')}</span>
      <Form.Item name="description" label="勋章描述">
        <Input.TextArea maxLength={100} showCount rows={3} placeholder="请输入勋章描述" />
      </Form.Item>
    </Form>
  );
  const footer = (
    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
      <Button autoInsertSpace={false} onClick={onCancel}>
        取消
      </Button>
      <Button type="primary" autoInsertSpace={false} loading={saving} onClick={submit}>
        保存
      </Button>
    </Space>
  );

  // antd 6 Modal portals via @rc-component/portal, which returns null when `document` is missing
  // (renderToStaticMarkup / Node). getContainer={false} still hits that guard. Inline fallback for SSR tests.
  if (typeof document === 'undefined') {
    if (!open) return null;
    return (
      <div>
        <div>{title}</div>
        {formNode}
        {footer}
      </div>
    );
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      destroyOnHidden
      mask={{ closable: true }}
      getContainer={false}
      footer={footer}
    >
      {formNode}
    </Modal>
  );
}
