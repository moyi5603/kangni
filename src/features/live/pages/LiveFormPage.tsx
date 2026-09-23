import { useMemo, useState } from 'react';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Card, DatePicker, Form, Input, Modal, Radio, Space, Switch, TreeSelect, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import { orgDepartmentTree } from '../../activities/model/activity';
import {
  LIVE_PHONE_PATTERN,
  LIVE_VISIBILITY_SCOPES,
  liveLinks,
  type LiveRecord,
  type LiveVisibilityScope,
} from '../model/live';
import { getLive, nextLiveId, saveLive } from '../model/liveStore';

const { RangePicker } = DatePicker;

type LiveFormValues = {
  title: string;
  coverUrl: string;
  host: string;
  hostPhone: string;
  timeRange: [Dayjs, Dayjs];
  description?: string;
  visibilityEnabled: boolean;
  visibilityScope: LiveVisibilityScope;
  visibilityDepartments?: string[];
  visibilityFileName?: string;
};

type LiveFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: (id: number) => void;
};

const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

export function LiveFormPage({ mode, recordId, onBack, onSaved }: LiveFormPageProps) {
  const { message } = App.useApp();
  const editing = mode === 'edit' ? getLive(Number(recordId)) : undefined;
  const [form] = Form.useForm<LiveFormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>(
    editing?.coverUrl ? [{ uid: 'cover', name: '封面', url: editing.coverUrl }] : [],
  );
  const [visibilityFileName, setVisibilityFileName] = useState(editing?.visibilityFileName ?? '');
  const [submitting, setSubmitting] = useState(false);

  const visibilityEnabled = Form.useWatch('visibilityEnabled', form) ?? editing?.visibilityEnabled ?? false;
  const visibilityScope = Form.useWatch('visibilityScope', form) ?? editing?.visibilityScope ?? '全员';

  const initialValues = useMemo<Partial<LiveFormValues>>(
    () => ({
      title: editing?.title,
      coverUrl: editing?.coverUrl ?? '',
      host: editing?.host,
      hostPhone: editing?.hostPhone,
      timeRange: editing ? [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)] : undefined,
      description: editing?.description ?? '',
      visibilityEnabled: editing?.visibilityEnabled ?? false,
      visibilityScope: editing?.visibilityScope ?? '全员',
      visibilityDepartments: editing?.visibilityDepartments ?? [],
      visibilityFileName: editing?.visibilityFileName ?? '',
    }),
    [editing],
  );

  const title = mode === 'create' ? '新建直播' : '编辑直播';

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const id = editing?.id ?? nextLiveId();
      const record: LiveRecord = {
        id,
        title: values.title.trim(),
        coverUrl: values.coverUrl,
        host: values.host.trim(),
        hostPhone: values.hostPhone.trim(),
        startAt: values.timeRange[0].format(TIME_FORMAT),
        endAt: values.timeRange[1].format(TIME_FORMAT),
        description: values.description?.trim() ?? '',
        visibilityEnabled: values.visibilityEnabled,
        visibilityScope: values.visibilityEnabled ? values.visibilityScope : '全员',
        visibilityDepartments:
          values.visibilityEnabled && values.visibilityScope === '按部门' ? values.visibilityDepartments ?? [] : [],
        visibilityFileName:
          values.visibilityEnabled && values.visibilityScope === '导入' ? visibilityFileName : '',
        viewers: editing?.viewers ?? 0,
        hasReplay: editing?.hasReplay ?? false,
      };
      saveLive(record);
      if (mode === 'create') {
        const links = liveLinks(id);
        Modal.success({
          title: '直播创建成功',
          width: 520,
          content: (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text>讲师端链接（讲师开播使用）：</Typography.Text>
              <Typography.Text copyable={{ text: links.lecturer }}>{links.lecturer}</Typography.Text>
              <Typography.Text>学员端链接（员工观看入口）：</Typography.Text>
              <Typography.Text copyable={{ text: links.student }}>{links.student}</Typography.Text>
            </Space>
          ),
          okText: '查看直播详情',
          onOk: () => onSaved(id),
        });
      } else {
        message.success('已保存直播');
        onSaved(id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '直播' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>直播管理</Button> },
          { title },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">填写直播信息并配置可见范围，创建后自动生成讲师端与学员端链接。</Typography.Text>
      </div>
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        initialValues={initialValues}
      >
        <Card title="直播信息">
          <Form.Item
            name="title"
            label="直播名称"
            rules={[
              { required: true, message: '请输入直播名称' },
              { max: 40, message: '直播名称不超过 40 字' },
            ]}
          >
            <Input maxLength={40} showCount placeholder="请输入直播名称" style={{ maxWidth: 480 }} />
          </Form.Item>
          <Form.Item label="封面" required extra={COVER_IMAGE_UPLOAD_HINT}>
            <Upload
              accept={IMAGE_UPLOAD_ACCEPT}
              listType="picture-card"
              maxCount={1}
              fileList={coverList}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                const file = fileList[0];
                setCoverList(fileList.slice(-1));
                if (file?.originFileObj) {
                  const reader = new FileReader();
                  reader.onload = () => form.setFieldValue('coverUrl', String(reader.result));
                  reader.readAsDataURL(file.originFileObj);
                } else {
                  form.setFieldValue('coverUrl', file?.url ?? '');
                }
              }}
            >
              {coverList.length ? null : (
                <button type="button" className="cover-upload-trigger">
                  <PlusOutlined />
                  <span>上传封面</span>
                </button>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="coverUrl" hidden rules={[{ required: true, message: '请上传封面' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="host"
            label="讲师姓名"
            rules={[{ required: true, message: '请输入讲师姓名' }]}
          >
            <Input maxLength={20} placeholder="请输入讲师姓名" style={{ maxWidth: 240 }} />
          </Form.Item>
          <Form.Item
            name="hostPhone"
            label="讲师手机号"
            rules={[
              { required: true, message: '请输入讲师手机号' },
              { pattern: LIVE_PHONE_PATTERN, message: '请输入 11 位手机号' },
            ]}
            extra="用于接收开播提醒与讲师端登录验证"
          >
            <Input maxLength={11} placeholder="请输入 11 位手机号" style={{ maxWidth: 240 }} />
          </Form.Item>
          <Form.Item
            name="timeRange"
            label="直播时间"
            rules={[{ required: true, message: '请选择直播开始与结束时间' }]}
          >
            <RangePicker showTime={{ format: 'HH:mm' }} format={TIME_FORMAT} placeholder={['开始时间', '结束时间']} />
          </Form.Item>
          <Form.Item name="description" label="直播描述">
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="介绍直播内容、议程与参与方式" style={{ maxWidth: 640 }} />
          </Form.Item>
        </Card>
        <Card title="可见范围" style={{ marginTop: 16 }}>
          <Form.Item name="visibilityEnabled" label="开启可见范围" valuePropName="checked" extra="开启后仅指定范围内的员工可见本场直播">
            <Switch />
          </Form.Item>
          {visibilityEnabled ? (
            <>
              <Form.Item name="visibilityScope" label="范围类型" rules={[{ required: true, message: '请选择范围类型' }]}>
                <Radio.Group options={LIVE_VISIBILITY_SCOPES.map((item) => ({ value: item, label: item }))} />
              </Form.Item>
              {visibilityScope === '按部门' ? (
                <Form.Item
                  name="visibilityDepartments"
                  label="选择部门"
                  rules={[{ required: true, message: '请选择可见部门' }]}
                >
                  <TreeSelect
                    treeData={orgDepartmentTree}
                    treeCheckable
                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                    placeholder="请选择部门"
                    style={{ maxWidth: 480, width: '100%' }}
                  />
                </Form.Item>
              ) : null}
              {visibilityScope === '导入' ? (
                <>
                  <Form.Item label="导入名单" required extra="支持 Excel/CSV 文件，需包含员工工号列">
                    <Upload.Dragger
                      accept=".xlsx,.xls,.csv"
                      maxCount={1}
                      beforeUpload={() => false}
                      defaultFileList={visibilityFileName ? [{ uid: 'visibility', name: visibilityFileName }] : []}
                      onChange={({ fileList }) => {
                        const file = fileList[0];
                        const name = file?.name ?? '';
                        setVisibilityFileName(name);
                        form.setFieldValue('visibilityFileName', name);
                      }}
                      onRemove={() => {
                        setVisibilityFileName('');
                        form.setFieldValue('visibilityFileName', '');
                      }}
                      style={{ maxWidth: 480 }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    </Upload.Dragger>
                  </Form.Item>
                  <Form.Item name="visibilityFileName" hidden rules={[{ required: true, message: '请上传名单文件' }]}>
                    <Input />
                  </Form.Item>
                </>
              ) : null}
            </>
          ) : null}
        </Card>
        <div className="sticky-form-actions">
          <Space>
            <Button onClick={onBack}>取消</Button>
            <Button type="primary" loading={submitting} onClick={submit}>
              {mode === 'create' ? '保存并生成链接' : '保存'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
