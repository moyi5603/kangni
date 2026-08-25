import { useEffect, useState, type ReactNode } from 'react';
import { App, Button, Form, Input, Modal, Space, Upload } from 'antd';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import type { AwardCertificateRecord } from '../model/awardCertificate';
import { getAwardCertificate, upsertAwardCertificate } from '../model/awardCertificateStore';

type FormValues = {
  name: string;
  description: string;
  fileName: string;
  imageUrl: string;
};

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export function AwardCertificateFormModal({
  open,
  editingId,
  onCancel,
  onSaved,
}: {
  open: boolean;
  editingId?: number | null;
  onCancel: () => void;
  onSaved: (record: AwardCertificateRecord) => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const editing = editingId != null ? getAwardCertificate(editingId) : undefined;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description,
        fileName: editing.fileName,
        imageUrl: editing.imageUrl,
      });
      setFileList(
        editing.imageUrl ? [{ uid: String(editing.id), name: editing.fileName, status: 'done', url: editing.imageUrl }] : [],
      );
      return;
    }
    form.resetFields();
    setFileList([]);
  }, [open, editing, form]);

  const save = async () => {
    const values = await form.validateFields();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const record: AwardCertificateRecord = {
      id: editing?.id ?? Date.now(),
      name: values.name.trim(),
      description: values.description?.trim() ?? '',
      fileName: values.fileName,
      imageUrl: values.imageUrl,
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    upsertAwardCertificate(record);
    message.success(editing ? '已保存证书' : '已创建证书');
    onSaved(record);
  };

  return (
    <Modal
      title={editing ? '编辑证书' : '新建证书'}
      open={open}
      onCancel={onCancel}
      onOk={() => void save()}
      destroyOnClose
      okText="确认"
      cancelText="取消"
      footer={(_, extra) => modalFooter(_, extra)}
    >
      <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false}>
        <Form.Item name="name" label="证书名称" rules={[{ required: true, message: '请输入证书名称' }]}>
          <Input maxLength={50} showCount placeholder="请输入证书名称" />
        </Form.Item>
        <Form.Item name="description" label="证书描述" rules={[{ max: 200, message: '不超过 200 个字' }]}>
          <Input.TextArea rows={3} maxLength={200} showCount placeholder="可简单说明证书用途或颁发说明" />
        </Form.Item>
        <Form.Item name="fileName" hidden rules={[{ required: true, message: '请上传证书图片' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="imageUrl" hidden rules={[{ required: true, message: '请上传证书图片' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="证书图片" required>
          <Upload
            accept="image/png,image/jpeg"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={async ({ fileList: next }) => {
              const latest = next.slice(-1);
              setFileList(latest);
              const raw = latest[0]?.originFileObj;
              if (!raw) {
                form.setFieldsValue({ fileName: '', imageUrl: '' });
                return;
              }
              const imageUrl = await readFileAsDataUrl(raw);
              form.setFieldsValue({ fileName: raw.name, imageUrl });
            }}
          >
            <Button>上传图片</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
