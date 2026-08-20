import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, Input, InputNumber, Radio, Space, TreeSelect, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import { coursewareTypes, type CoursewareRecord, type CoursewareType } from '../model/training';

export type CoursewareFormValues = {
  type: CoursewareType;
  cover: string;
  name: string;
  categoryId: number;
  fileName: string;
  fileUrl: string;
  intro?: string;
  estimatedDurationSeconds?: number | null;
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function toCategoryTreeData(nodes: CategoryNode[]): { title: string; value: number; key: number; children?: ReturnType<typeof toCategoryTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children?.length ? toCategoryTreeData(node.children) : undefined,
  }));
}

function toCoverList(cover: string): UploadFile[] {
  if (!cover) return [];
  return [{ uid: '-1', name: '封面', status: 'done', url: cover, thumbUrl: cover }];
}

function toFileList(fileName: string, fileUrl: string): UploadFile[] {
  if (!fileName && !fileUrl) return [];
  return [{ uid: '-2', name: fileName || '课件文件', status: 'done', url: fileUrl || undefined }];
}

function acceptOf(type: CoursewareType | undefined): string {
  if (type === '音频') return 'audio/*';
  if (type === 'PDF') return '.pdf,application/pdf';
  return 'video/*';
}

export function CoursewareFormDrawer({
  open,
  mode,
  initial,
  categoryTree,
  defaultCategoryId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: CoursewareRecord | null;
  categoryTree: CategoryNode[];
  defaultCategoryId?: number | null;
  onClose: () => void;
  onSubmit: (values: CoursewareFormValues) => void | Promise<void>;
}) {
  const [form] = Form.useForm<CoursewareFormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const watchedType = Form.useWatch('type', form);
  const treeData = useMemo(() => toCategoryTreeData(categoryTree), [categoryTree]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      form.setFieldsValue({
        type: initial.type,
        cover: initial.cover,
        name: initial.name,
        categoryId: initial.categoryId ?? undefined,
        fileName: initial.fileName,
        fileUrl: initial.fileUrl,
        intro: initial.intro,
        estimatedDurationSeconds: initial.estimatedDurationSeconds,
      });
      setCoverList(toCoverList(initial.cover));
      setFileList(toFileList(initial.fileName, initial.fileUrl));
      return;
    }
    form.resetFields();
    form.setFieldsValue({
      type: '视频',
      cover: '',
      name: '',
      categoryId: defaultCategoryId ?? undefined,
      fileName: '',
      fileUrl: '',
      intro: '',
      estimatedDurationSeconds: null,
    });
    setCoverList([]);
    setFileList([]);
  }, [open, mode, initial, defaultCategoryId, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        intro: values.intro?.trim() ?? '',
        estimatedDurationSeconds: values.estimatedDurationSeconds ?? null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={mode === 'create' ? '新增课件' : '编辑课件'}
      open={open}
      onClose={onClose}
      width={b2bStandards.form.drawerWidth}
      destroyOnHidden
      footer={
        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
      >
        <Form.Item name="type" label="课件类型" rules={[{ required: true, message: '请选择课件类型' }]}>
          <Radio.Group options={optionsOf(coursewareTypes)} />
        </Form.Item>

        <Form.Item label="封面图片" required extra="支持 jpg / png，建议比例 16:9">
          <Upload
            accept="image/*"
            listType="picture-card"
            maxCount={1}
            fileList={coverList}
            beforeUpload={() => false}
            onChange={({ fileList: next }) => {
              const file = next[0];
              setCoverList(next.slice(-1));
              if (file?.originFileObj) {
                const reader = new FileReader();
                reader.onload = () => form.setFieldValue('cover', String(reader.result));
                reader.readAsDataURL(file.originFileObj);
              } else {
                form.setFieldValue('cover', file?.url ?? '');
              }
            }}
          >
            {coverList.length ? null : (
              <button type="button" className="cover-upload-trigger" aria-label="上传封面">
                <PlusOutlined />
              </button>
            )}
          </Upload>
        </Form.Item>
        <Form.Item name="cover" hidden rules={[{ required: true, message: '请上传封面图片' }]}>
          <Input />
        </Form.Item>

        <Form.Item
          name="name"
          label="课件名称"
          rules={[
            { required: true, whitespace: true, message: '请输入课件名称' },
            { max: 20, message: '课件名称不超过 20 个字' },
          ]}
        >
          <Input maxLength={20} showCount placeholder="请输入课件名称" />
        </Form.Item>

        <Form.Item name="categoryId" label="课件分类" rules={[{ required: true, message: '请选择课件分类' }]}>
          <TreeSelect
            treeData={treeData}
            treeDefaultExpandAll
            showSearch={{ treeNodeFilterProp: 'title' }}
            placeholder="请选择课件分类"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="课件文件" required extra="本地选择后立即生效（原型模拟上传）">
          <Upload
            accept={acceptOf(watchedType)}
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: next }) => {
              const file = next[0];
              setFileList(next.slice(-1));
              if (file?.originFileObj) {
                form.setFieldValue('fileName', file.name);
                form.setFieldValue('fileUrl', `local://${file.name}`);
              } else {
                form.setFieldValue('fileName', file?.name ?? '');
                form.setFieldValue('fileUrl', file?.url ?? '');
              }
            }}
          >
            <Button icon={<UploadOutlined />}>上传附件</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="fileName" hidden rules={[{ required: true, message: '请上传课件文件' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="fileUrl" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="intro" label="简介" rules={[{ max: 500, message: '简介不超过 500 个字' }]}>
          <Input.TextArea rows={4} maxLength={500} showCount placeholder="请输入简介" />
        </Form.Item>

        <Form.Item
          name="estimatedDurationSeconds"
          label="预估学习时长(秒)"
          rules={[{ type: 'number', min: 1, message: '时长需为正整数' }]}
        >
          <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="请输入预估学习时长" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
