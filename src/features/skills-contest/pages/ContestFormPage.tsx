import { useMemo, useState } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import { ContestSignupFieldsEditor } from '../components/ContestSignupFieldsEditor';
import {
  CONTEST_PAGE_OPTIONS,
  contestPageLabel,
  defaultChallengeFields,
  emptyStage,
  newStageId,
  stageOrdinalLabel,
  validateContestDraft,
  type Contest,
  type ContestAccess,
  type ContestPageKey,
  type ContestSignupField,
  type ContestStage,
} from '../model/contest';
import { defaultContestSignupFields } from '../model/contestSignupFields';
import { getContest, getContests, nextContestId, saveContest } from '../model/contestStore';

const { RangePicker } = DatePicker;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

type StageForm = {
  id: string;
  name: string;
  timeRange?: [Dayjs, Dayjs];
};

type FormValues = {
  name: string;
  description: string;
  timeRange?: [Dayjs, Dayjs];
  logoUrl: string;
  stages: StageForm[];
  signupFields: ContestSignupField[];
  h5Page: ContestPageKey;
  pcPage: ContestPageKey;
  access: ContestAccess;
};

function toFileList(url: string): UploadFile[] {
  if (!url) return [];
  return [{ uid: 'logo', name: 'logo', url, status: 'done' }];
}

function formatTime(value?: Dayjs) {
  return value ? value.format(TIME_FORMAT) : '';
}

function mergeStages(forms: StageForm[], previous: ContestStage[]): ContestStage[] {
  return forms.map((item, index) => {
    const old = previous.find((stage) => stage.id === item.id);
    const base = old ?? { ...emptyStage(item.name || `阶段${index + 1}`), id: item.id || newStageId(), ...defaultChallengeFields() };
    return {
      ...base,
      id: item.id || base.id,
      name: item.name,
      startAt: formatTime(item.timeRange?.[0]),
      endAt: formatTime(item.timeRange?.[1]),
    };
  });
}

export function ContestFormPage({
  mode,
  recordId,
  onBack,
  onSaved,
}: {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: (id: number) => void;
}) {
  const { message } = App.useApp();
  const editing = mode === 'edit' ? getContest(Number(recordId)) : undefined;
  const [form] = Form.useForm<FormValues>();
  const [logoList, setLogoList] = useState<UploadFile[]>(toFileList(editing?.logoUrl ?? ''));
  const [submitting, setSubmitting] = useState(false);

  const initialValues: FormValues | undefined = useMemo(() => {
    if (mode === 'edit' && !editing) return undefined;
    if (editing) {
      return {
        name: editing.name,
        description: editing.description,
        logoUrl: editing.logoUrl,
        timeRange: [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)],
        stages: editing.stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          timeRange: [dayjs(stage.startAt, TIME_FORMAT), dayjs(stage.endAt, TIME_FORMAT)] as [Dayjs, Dayjs],
        })),
        signupFields: editing.signupFields,
        h5Page: editing.h5Page,
        pcPage: editing.pcPage,
        access: editing.access,
      };
    }
    return {
      name: '',
      description: '',
      logoUrl: '',
      stages: [{ id: newStageId(), name: '初赛' }],
      signupFields: defaultContestSignupFields(),
      h5Page: 'none',
      pcPage: 'none',
      access: 'tenant',
    };
  }, [editing, mode]);

  if (mode === 'edit' && !editing) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: '技能大赛' }, { title: '赛事管理' }, { title: '编辑赛事' }]} />
        <Card>
          <Empty description="赛事不存在" />
          <Button onClick={onBack}>返回</Button>
        </Card>
      </div>
    );
  }

  const title = mode === 'edit' ? '编辑赛事' : '新建赛事';
  const pageOptions = CONTEST_PAGE_OPTIONS.map((value) => ({ value, label: contestPageLabel(value) }));

  const submit = async () => {
    const values = await form.validateFields();
    const previous = editing?.stages ?? [];
    const contest: Contest = {
      id: editing?.id ?? nextContestId(),
      name: values.name.trim(),
      logoUrl: values.logoUrl,
      description: values.description?.trim() ?? '',
      startAt: formatTime(values.timeRange?.[0]),
      endAt: formatTime(values.timeRange?.[1]),
      stages: mergeStages(values.stages ?? [], previous),
      signupFields: values.signupFields,
      h5Page: values.h5Page,
      pcPage: values.pcPage,
      access: values.access,
    };
    const taken = getContests()
      .filter((item) => item.id !== contest.id)
      .map((item) => item.name);
    const error = validateContestDraft(contest, taken);
    if (error) {
      message.error(error);
      return;
    }
    setSubmitting(true);
    saveContest(contest);
    setSubmitting(false);
    message.success('已保存大赛');
    onSaved(contest.id);
  };

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '技能大赛' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>赛事管理</Button> },
          { title },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">填写大赛信息、阶段、报名收集字段与页面可见范围。</Typography.Text>
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
        <Card title="基本信息">
          <Form.Item name="logoUrl" hidden rules={[{ required: true, message: '请上传大赛 Logo' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="大赛 Logo" extra={COVER_IMAGE_UPLOAD_HINT} required>
            <Upload
              accept={IMAGE_UPLOAD_ACCEPT}
              listType="picture-card"
              maxCount={1}
              fileList={logoList}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                const file = fileList[0];
                setLogoList(fileList.slice(-1));
                if (file?.originFileObj) {
                  const reader = new FileReader();
                  reader.onload = () => form.setFieldValue('logoUrl', String(reader.result));
                  reader.readAsDataURL(file.originFileObj);
                } else {
                  form.setFieldValue('logoUrl', file?.url ?? '');
                }
              }}
            >
              {logoList.length ? null : (
                <button type="button" className="cover-upload-trigger">
                  <PlusOutlined />
                  <span>上传 Logo</span>
                </button>
              )}
            </Upload>
          </Form.Item>
          <Form.Item
            name="name"
            label="大赛名称"
            rules={[
              { required: true, message: '请输入大赛名称' },
              { max: 50, message: '大赛名称不超过 50 字' },
            ]}
          >
            <Input maxLength={50} showCount placeholder="请输入大赛名称" style={{ maxWidth: 480 }} />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ max: 500, message: '描述不超过 500 字' }]}>
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="选填" style={{ maxWidth: 640 }} />
          </Form.Item>
          <Form.Item name="timeRange" label="举办时间" rules={[{ required: true, message: '请选择举办时间' }]}>
            <RangePicker showTime={{ format: 'HH:mm' }} format={TIME_FORMAT} placeholder={['开始', '结束']} />
          </Form.Item>
        </Card>

        <Card title="阶段" style={{ marginTop: 16 }}>
          <Form.List
            name="stages"
            rules={[
              {
                validator: async (_, value: StageForm[]) => {
                  if (!value?.length) throw new Error('请至少添加一个阶段');
                },
              },
            ]}
          >
            {(fields, { add, remove, move }) => (
              <>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small" title={stageOrdinalLabel(index)} style={{ marginBottom: 12 }}>
                    <Form.Item name={[field.name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'name']} label="阶段名称" rules={[{ required: true, message: '请输入阶段名称' }, { max: 20 }]}>
                      <Input maxLength={20} placeholder="如初赛" style={{ maxWidth: 320 }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'timeRange']} label="阶段时间" rules={[{ required: true, message: '请选择阶段时间' }]}>
                      <RangePicker showTime={{ format: 'HH:mm' }} format={TIME_FORMAT} placeholder={['开始', '结束']} />
                    </Form.Item>
                    <Space>
                      <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, index - 1)}>
                        上移
                      </Button>
                      <Button icon={<ArrowDownOutlined />} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                        下移
                      </Button>
                      <Button danger disabled={fields.length <= 1} onClick={() => remove(field.name)}>
                        删除阶段
                      </Button>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ id: newStageId(), name: '' })}>
                  添加阶段
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Card title="报名信息收集" style={{ marginTop: 16 }}>
          <Form.Item name="signupFields" rules={[{ required: true, message: '请配置报名信息' }]}>
            <ContestSignupFieldsEditor />
          </Form.Item>
        </Card>

        <Card title="页面与可见" style={{ marginTop: 16 }}>
          <Form.Item name="h5Page" label="关联 H5 页面" rules={[{ required: true, message: '请选择 H5 页面' }]}>
            <Select options={pageOptions} style={{ maxWidth: 320 }} />
          </Form.Item>
          <Form.Item name="pcPage" label="关联 PC 页面" rules={[{ required: true, message: '请选择 PC 页面' }]}>
            <Select options={pageOptions} style={{ maxWidth: 320 }} />
          </Form.Item>
          <Form.Item name="access" label="页面可见" rules={[{ required: true, message: '请选择可见范围' }]}>
            <Radio.Group
              options={[
                { value: 'tenant', label: '仅租户成员' },
                { value: 'public', label: '公开' },
              ]}
            />
          </Form.Item>
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button onClick={onBack}>返回</Button>
            <Button type="primary" loading={submitting} onClick={() => void submit()}>
              保存
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
