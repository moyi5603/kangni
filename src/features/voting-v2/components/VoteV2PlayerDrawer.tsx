import { useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Descriptions, Drawer, Form, Input, InputNumber, Select, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { IMAGE_UPLOAD_ACCEPT, VOTE_OPTION_IMAGE_UPLOAD_HINT } from '../../../shared/ui/imageUploadHint';
import {
  defaultVoteV2Contestant,
  type VoteV2Campaign,
  type VoteV2Contestant,
} from '../model/voteV2';
import { nextVoteV2ContestantId, upsertVoteV2Contestant } from '../model/voteV2Store';

type Mode = 'view' | 'edit' | 'create';

type FormShape = {
  optionNo: number;
  name: string;
  subtitle: string;
  groupId?: number;
  imageList: UploadFile[];
  description: string;
};

function toFileList(url: string, name: string): UploadFile[] {
  return url ? [{ uid: '-1', name, status: 'done', url }] : [];
}

function fileUrl(list: UploadFile[]): string {
  const file = list[0];
  if (!file) return '';
  if (file.url) return file.url;
  const raw = file.originFileObj;
  return raw ? URL.createObjectURL(raw) : '';
}

function toForm(record: VoteV2Contestant | undefined, nextOptionNo: number): FormShape {
  return {
    optionNo: record?.optionNo ?? nextOptionNo,
    name: record?.name ?? '',
    subtitle: record?.subtitle ?? '',
    groupId: record?.groupId,
    imageList: toFileList(record?.imageUrl ?? '', 'cover'),
    description: record?.description ?? '',
  };
}

export function VoteV2PlayerView({
  campaign,
  record,
}: {
  campaign: VoteV2Campaign;
  record: VoteV2Contestant;
}) {
  return (
    <Descriptions column={1} size="small">
      <Descriptions.Item label="选项编号">{record.optionNo}</Descriptions.Item>
      <Descriptions.Item label="选项标题">{record.name}</Descriptions.Item>
      <Descriptions.Item label="选项副标题">{record.subtitle || '—'}</Descriptions.Item>
      {campaign.groupingEnabled ? (
        <Descriptions.Item label="分组">{campaign.groups.find((item) => item.id === record.groupId)?.name ?? '未分组'}</Descriptions.Item>
      ) : null}
      <Descriptions.Item label="选项图片">
        {record.imageUrl ? (
          <img className="vote-v2-option-preview" src={record.imageUrl} alt="" />
        ) : (
          '—'
        )}
      </Descriptions.Item>
      <Descriptions.Item label="描述">{record.description || '—'}</Descriptions.Item>
    </Descriptions>
  );
}

export function VoteV2PlayerForm({
  campaign,
  nextOptionNo,
}: {
  campaign: VoteV2Campaign;
  nextOptionNo?: number;
}) {
  const imageList = Form.useWatch('imageList') ?? [];
  return (
    <>
      <Form.Item
        label="选项编号"
        name="optionNo"
        extra="默认自增编号"
        rules={[{ required: true, message: '请输入选项编号' }]}
      >
        <InputNumber min={1} precision={0} style={{ width: 160 }} placeholder={nextOptionNo != null ? String(nextOptionNo) : undefined} />
      </Form.Item>
      <Form.Item label="选项标题" name="name" rules={[{ required: true, whitespace: true, message: '请输入选项标题' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="选项副标题" name="subtitle">
        <Input />
      </Form.Item>
      {campaign.groupingEnabled ? (
        <Form.Item label="分组" name="groupId">
          <Select
            allowClear
            placeholder="未分组"
            options={campaign.groups.map((item) => ({ value: item.id, label: item.name }))}
          />
        </Form.Item>
      ) : null}
      <Form.Item
        label="选项图片"
        extra={VOTE_OPTION_IMAGE_UPLOAD_HINT}
        name="imageList"
        valuePropName="fileList"
        getValueFromEvent={(event) => (event?.fileList ?? []).slice(-1)}
      >
        <Upload listType="picture-card" maxCount={1} accept={IMAGE_UPLOAD_ACCEPT} beforeUpload={() => false}>
          {imageList.length ? null : (
            <button type="button" className="cover-upload-trigger" aria-label="上传选项图片">
              <PlusOutlined />
              <span>上传</span>
            </button>
          )}
        </Upload>
      </Form.Item>
      <Form.Item label="描述" name="description">
        <Input placeholder="选填" />
      </Form.Item>
    </>
  );
}

export function VoteV2PlayerDrawer({
  open,
  mode,
  campaign,
  record,
  nextOptionNo,
  onClose,
  onEdit,
}: {
  open: boolean;
  mode: Mode;
  campaign: VoteV2Campaign;
  record?: VoteV2Contestant;
  nextOptionNo: number;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormShape>();
  const readonly = mode === 'view';

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(toForm(record, nextOptionNo));
  }, [open, record, nextOptionNo, form]);

  const save = async () => {
    const values = await form.validateFields();
    upsertVoteV2Contestant(
      defaultVoteV2Contestant({
        id: record?.id ?? nextVoteV2ContestantId(),
        campaignId: campaign.id,
        optionNo: values.optionNo,
        name: values.name.trim(),
        subtitle: values.subtitle.trim(),
        groupId: values.groupId,
        imageUrl: fileUrl(values.imageList ?? []),
        videoUrl: record?.videoUrl ?? '',
        audioUrl: record?.audioUrl ?? '',
        description: (values.description ?? '').trim(),
        phone: '',
        voteCount: record?.voteCount ?? 0,
        locked: record?.locked ?? false,
      }),
    );
    message.success('已保存');
    onClose();
  };

  return (
    <Drawer
      className="vote-v2-player-drawer"
      title={mode === 'create' ? '添加选项' : mode === 'edit' ? '编辑选项' : '选项详情'}
      width={880}
      open={open}
      onClose={onClose}
      extra={
        readonly ? (
          <Button type="primary" onClick={onEdit}>
            编辑
          </Button>
        ) : null
      }
      footer={
        readonly ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>关闭</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={() => void save()}>
              保存
            </Button>
          </div>
        )
      }
    >
      {readonly && record ? (
        <VoteV2PlayerView campaign={campaign} record={record} />
      ) : (
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ flex: '112px' }}
          wrapperCol={{ flex: 1 }}
          colon={false}
          disabled={readonly}
          initialValues={toForm(record, nextOptionNo)}
        >
          <VoteV2PlayerForm campaign={campaign} nextOptionNo={nextOptionNo} />
        </Form>
      )}
    </Drawer>
  );
}
