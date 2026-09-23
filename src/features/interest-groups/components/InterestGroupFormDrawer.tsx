import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Form, Input, Select, Space, TreeSelect, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import { orgPeoplePickerTree } from '../../activities/model/activity';
import {
  normalizeInterestGroupLeadIds,
  validateInterestGroupForm,
  type InterestGroup,
  type InterestGroupFormValues,
} from '../model/interestGroup';
import { generateInterestGroupIntro } from '../model/interestGroupIntro';
import { buildInterestGroupCategoryOptions } from '../model/interestGroupCategory';
import { useInterestGroupCategories, upsertInterestGroup } from '../model/interestGroupStore';

type InterestGroupFormDrawerProps = {
  open: boolean;
  record?: InterestGroup;
  onClose: () => void;
  onSaved?: (group: InterestGroup) => void;
};

type FormShape = {
  name: string;
  categoryKey: string;
  leadEmployeeIds: string[];
  intro: string;
  coverFileList: UploadFile[];
};

function toFormValues(record: InterestGroup | undefined): FormShape {
  return {
    name: record?.name ?? '',
    categoryKey: record?.categoryKey ?? '',
    leadEmployeeIds: record?.leadEmployeeIds ?? [],
    intro: record?.intro ?? '',
    coverFileList: record?.coverUrl
      ? [{ uid: '-1', name: 'cover', status: 'done', url: record.coverUrl }]
      : [],
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function InterestGroupFormDrawer({ open, record, onClose, onSaved }: InterestGroupFormDrawerProps) {
  const { message } = App.useApp();
  const categories = useInterestGroupCategories();
  const [form] = Form.useForm<FormShape>();
  const [writingIntro, setWritingIntro] = useState(false);
  const coverFileList = Form.useWatch('coverFileList', form) ?? [];
  const isCreate = !record;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(toFormValues(record));
    setWritingIntro(false);
  }, [open, record, form]);

  const writeIntro = () => {
    if (writingIntro) return;
    setWritingIntro(true);
    window.setTimeout(() => {
      const categoryKey = form.getFieldValue('categoryKey') ?? '';
      form.setFieldValue('intro', generateInterestGroupIntro(categoryKey));
      setWritingIntro(false);
      message.success('已生成简介，可继续修改');
    }, 800);
  };

  const save = async () => {
    const values = await form.validateFields();
    const coverFile = values.coverFileList[0];
    let coverUrl = coverFile?.url ?? '';
    if (coverFile?.originFileObj) {
      coverUrl = await readFileAsDataUrl(coverFile.originFileObj);
    }
    const payload: InterestGroupFormValues = {
      name: values.name,
      categoryKey: values.categoryKey ?? '',
      leadEmployeeIds: normalizeInterestGroupLeadIds(values.leadEmployeeIds ?? []),
      joinMode: 'free',
      intro: values.intro ?? '',
      coverUrl,
    };
    const error = validateInterestGroupForm(payload, isCreate);
    if (error) {
      message.warning(error);
      return;
    }
    const saved = upsertInterestGroup(payload, record?.id);
    message.success(isCreate ? '兴趣圈创建成功' : '兴趣圈已更新');
    onSaved?.(saved);
    onClose();
  };

  const categoryOptions = buildInterestGroupCategoryOptions(categories, {
    includeUncategorized: true,
    enabledOnly: true,
    keepKey: record?.categoryKey,
  });

  return (
    <Drawer
      title={isCreate ? '新建兴趣圈' : '编辑兴趣圈'}
      width={720}
      open={open}
      destroyOnClose
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => void save()}>
            {isCreate ? '创建兴趣圈' : '保存修改'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="horizontal" labelCol={{ flex: '112px' }} wrapperCol={{ flex: 1 }} colon={false}>
        <Form.Item
          label="封面图"
          name="coverFileList"
          valuePropName="fileList"
          getValueFromEvent={(event) => (event?.fileList ?? []).slice(-1)}
          rules={isCreate ? [{ required: true, message: '请上传封面图' }] : []}
          extra={COVER_IMAGE_UPLOAD_HINT}
        >
          <Upload
            listType="picture-card"
            maxCount={1}
            accept={IMAGE_UPLOAD_ACCEPT}
            beforeUpload={() => false}
          >
            {coverFileList.length ? null : (
              <button type="button" className="cover-upload-trigger" aria-label="上传封面">
                <PlusOutlined />
                <span>上传封面</span>
              </button>
            )}
          </Upload>
        </Form.Item>
        <Form.Item label="兴趣圈名称" name="name" rules={[{ required: true, message: '请输入兴趣圈名称' }]}>
          <Input placeholder="兴趣圈名称" maxLength={40} />
        </Form.Item>
        <Form.Item label="分类" name="categoryKey">
          <Select options={categoryOptions} />
        </Form.Item>
        <Form.Item
          label="兴趣圈负责人"
          name="leadEmployeeIds"
          rules={[{ required: true, type: 'array', min: 1, message: '请选择兴趣圈负责人' }]}
        >
          <TreeSelect
            treeData={orgPeoplePickerTree}
            treeCheckable
            treeDefaultExpandAll
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            showSearch={{ treeNodeFilterProp: 'title' }}
            allowClear
            placeholder="请按组织架构选择负责人"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="兴趣圈简介" name="intro">
          <Input.TextArea rows={4} placeholder="介绍一下你的兴趣圈…" maxLength={500} showCount disabled={writingIntro} />
        </Form.Item>
        <Form.Item label=" " colon={false}>
          <Space>
            <Button onClick={writeIntro} loading={writingIntro}>
              AI 帮写
            </Button>
            <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>按当前分类生成简介，生成后可再改</span>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
