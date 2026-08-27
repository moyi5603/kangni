import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Form, Input, Select, Space, TreeSelect, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { orgPeoplePickerTree } from '../../activities/model/activity';
import {
  normalizeInterestGroupTags,
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
  leadEmployeeId: string;
  area: string;
  tags: string[];
  intro: string;
  coverFileList: UploadFile[];
};

function toFormValues(record: InterestGroup | undefined): FormShape {
  return {
    name: record?.name ?? '',
    categoryKey: record?.categoryKey ?? '',
    leadEmployeeId: record?.leadEmployeeId ?? '',
    area: record?.area ?? '',
    tags: record?.tags ?? [],
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
      leadEmployeeId: values.leadEmployeeId,
      joinMode: 'free',
      area: values.area ?? '',
      tags: normalizeInterestGroupTags(values.tags ?? []),
      intro: values.intro ?? '',
      coverUrl,
    };
    const error = validateInterestGroupForm(payload, isCreate);
    if (error) {
      message.warning(error);
      return;
    }
    const saved = upsertInterestGroup(payload, record?.id);
    message.success(isCreate ? '小组创建成功' : '小组已更新');
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
      title={isCreate ? '新建兴趣小组' : '编辑小组'}
      width={720}
      open={open}
      destroyOnClose
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => void save()}>
            {isCreate ? '创建小组' : '保存修改'}
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
          extra="仅 1 张，JPG / PNG，建议 16:9"
        >
          <Upload
            listType="picture-card"
            maxCount={1}
            accept="image/*"
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
        <Form.Item label="小组名称" name="name" rules={[{ required: true, message: '请输入小组名称' }]}>
          <Input placeholder="小组名称" maxLength={40} />
        </Form.Item>
        <Form.Item label="分类" name="categoryKey">
          <Select options={categoryOptions} />
        </Form.Item>
        <Form.Item label="小组负责人" name="leadEmployeeId" rules={[{ required: true, message: '请选择小组负责人' }]}>
          <TreeSelect
            treeData={orgPeoplePickerTree}
            treeDefaultExpandAll
            showSearch={{ treeNodeFilterProp: 'title' }}
            allowClear
            placeholder="请按组织架构选择负责人"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="活动区域" name="area">
          <Input placeholder="如：总部 · 滨江园区" maxLength={60} />
        </Form.Item>
        <Form.Item label="标签" name="tags">
          <Select mode="tags" placeholder="输入后回车添加" tokenSeparators={[',']} />
        </Form.Item>
        <Form.Item label="小组简介" name="intro">
          <Input.TextArea rows={4} placeholder="介绍一下你的小组…" maxLength={500} showCount disabled={writingIntro} />
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
