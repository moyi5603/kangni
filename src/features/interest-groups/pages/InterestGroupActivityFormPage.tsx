import { useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  TimePicker,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import {
  WEEKDAYS,
  generateInterestGroupActivityIntro,
  validateInterestGroupActivityForm,
  type DeadlineMode,
  type InterestGroupActivityFormValues,
  type InterestGroupActivityType,
  type SeriesSignupMode,
} from '../model/interestGroupActivity';
import { InterestGroupActivityAiModal } from '../components/InterestGroupActivityAiModal';
import { takePendingAiActivityDraft } from '../model/interestGroupActivityPlan';
import { buildInterestGroupCategoryOptions } from '../model/interestGroupCategory';
import {
  getInterestGroupActivity,
  upsertInterestGroupActivity,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';

type FormShape = {
  coverUrl: string;
  title: string;
  groupId?: number;
  categoryKey?: string;
  type: InterestGroupActivityType;
  startAt?: Dayjs;
  endAt?: Dayjs;
  repeatWeekday?: number;
  timeStart?: Dayjs;
  timeEnd?: Dayjs;
  seriesSignupMode?: SeriesSignupMode;
  sessions?: Array<{ startAt?: Dayjs; endAt?: Dayjs }>;
  deadlineMode: DeadlineMode;
  deadlineAt?: Dayjs;
  deadlineHoursBefore?: number;
  location?: string;
  capacity?: number;
  detailHtml?: string;
};

function toFileList(coverUrl: string): UploadFile[] {
  if (!coverUrl) return [];
  return [{ uid: '-1', name: '活动封面', status: 'done', url: coverUrl, thumbUrl: coverUrl }];
}

function fmt(value?: Dayjs) {
  return value ? value.format('YYYY-MM-DD HH:mm') : undefined;
}

function fmtTime(value?: Dayjs) {
  return value ? value.format('HH:mm') : undefined;
}

function toPayload(values: FormShape): InterestGroupActivityFormValues {
  return {
    coverUrl: values.coverUrl ?? '',
    title: values.title ?? '',
    groupId: values.groupId ?? 0,
    categoryKey: values.categoryKey ?? '',
    type: values.type,
    startAt: fmt(values.startAt),
    endAt: fmt(values.endAt),
    repeatWeekday: values.repeatWeekday,
    timeStart: fmtTime(values.timeStart),
    timeEnd: fmtTime(values.timeEnd),
    seriesSignupMode: values.seriesSignupMode,
    sessions: values.sessions?.map((session) => ({
      startAt: fmt(session.startAt) ?? '',
      endAt: fmt(session.endAt) ?? '',
    })),
    deadlineMode: values.deadlineMode,
    deadlineAt: fmt(values.deadlineAt),
    deadlineHoursBefore: values.deadlineHoursBefore,
    location: values.location ?? '',
    capacity: values.capacity ?? 0,
    detailHtml: values.detailHtml ?? '',
  };
}

type InterestGroupActivityFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  draft?: InterestGroupActivityFormValues;
  presentation?: 'default' | 'ai';
  onBack: () => void;
  onSaved: (id: number) => void;
  onRegenerate?: () => void;
};

function draftToFormShape(draft: InterestGroupActivityFormValues): FormShape {
  return {
    coverUrl: draft.coverUrl,
    title: draft.title,
    groupId: draft.groupId,
    categoryKey: draft.categoryKey,
    type: draft.type,
    startAt: draft.startAt ? dayjs(draft.startAt) : undefined,
    endAt: draft.endAt ? dayjs(draft.endAt) : undefined,
    repeatWeekday: draft.repeatWeekday,
    timeStart: draft.timeStart ? dayjs(draft.timeStart, 'HH:mm') : undefined,
    timeEnd: draft.timeEnd ? dayjs(draft.timeEnd, 'HH:mm') : undefined,
    seriesSignupMode: draft.seriesSignupMode,
    sessions: draft.sessions?.map((session) => ({
      startAt: session.startAt ? dayjs(session.startAt) : undefined,
      endAt: session.endAt ? dayjs(session.endAt) : undefined,
    })),
    deadlineMode: draft.deadlineMode,
    deadlineAt: draft.deadlineAt ? dayjs(draft.deadlineAt) : undefined,
    deadlineHoursBefore: draft.deadlineHoursBefore,
    location: draft.location,
    capacity: draft.capacity,
    detailHtml: draft.detailHtml,
  };
}

export function InterestGroupActivityFormPage({
  mode,
  recordId,
  draft,
  presentation = 'default',
  onBack,
  onSaved,
  onRegenerate,
}: InterestGroupActivityFormPageProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormShape>();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const editing = mode === 'edit' && recordId ? getInterestGroupActivity(Number(recordId)) : undefined;
  const presetGroupId = mode === 'create' && recordId ? Number(recordId) : undefined;
  const [aiDraft, setAiDraft] = useState(() => draft ?? (mode === 'create' ? takePendingAiActivityDraft() : null));
  const [aiOpen, setAiOpen] = useState(false);
  const [formEpoch, setFormEpoch] = useState(0);
  const resolvedDraft = draft ?? aiDraft;
  const aiMode = presentation === 'ai' || resolvedDraft != null;
  const [coverList, setCoverList] = useState<UploadFile[]>(() =>
    toFileList(aiMode ? '' : (resolvedDraft?.coverUrl ?? editing?.coverUrl ?? '')),
  );
  const [writing, setWriting] = useState(false);
  const presetGroup = presetGroupId ? groups.find((item) => item.id === presetGroupId) : undefined;
  const categoryOptions = buildInterestGroupCategoryOptions(categories, {
    includeUncategorized: true,
    enabledOnly: true,
    keepKey: editing?.categoryKey,
  });

  const initialValues: FormShape = resolvedDraft
    ? { ...draftToFormShape(resolvedDraft), coverUrl: '' }
    : editing
    ? {
        coverUrl: editing.coverUrl,
        title: editing.title,
        groupId: editing.groupId ?? undefined,
        categoryKey: editing.categoryKey,
        type: editing.type,
        startAt: editing.startAt ? dayjs(editing.startAt) : undefined,
        endAt: editing.endAt ? dayjs(editing.endAt) : undefined,
        repeatWeekday: editing.repeatWeekdays?.[0],
        timeStart: editing.timeStart ? dayjs(editing.timeStart, 'HH:mm') : undefined,
        timeEnd: editing.timeEnd ? dayjs(editing.timeEnd, 'HH:mm') : undefined,
        seriesSignupMode: editing.seriesSignupMode,
        sessions: editing.sessions?.map((session) => ({
          startAt: dayjs(session.startAt),
          endAt: dayjs(session.endAt),
        })),
        deadlineMode: editing.deadlineMode,
        deadlineAt: editing.deadlineAt ? dayjs(editing.deadlineAt) : undefined,
        deadlineHoursBefore: editing.deadlineHoursBefore,
        location: editing.location,
        capacity: editing.capacity,
        detailHtml: editing.detailHtml,
      }
    : {
        coverUrl: '',
        title: '',
        groupId: presetGroup?.id,
        categoryKey: presetGroup?.categoryKey ?? '',
        type: 'once',
        seriesSignupMode: 'independent',
        sessions: [{ startAt: undefined, endAt: undefined }],
        deadlineMode: 'none',
        location: '',
        capacity: 20,
        detailHtml: '',
      };

  const type = Form.useWatch('type', form);
  const groupId = Form.useWatch('groupId', form);
  const deadlineMode = Form.useWatch('deadlineMode', form);
  const hostName = groups.find((item) => item.id === groupId)?.leadName ?? editing?.hostName ?? '—';

  const writeIntro = () => {
    if (writing) return;
    setWriting(true);
    window.setTimeout(() => {
      const values = form.getFieldsValue();
      form.setFieldValue(
        'detailHtml',
        generateInterestGroupActivityIntro({
          title: values.title ?? '',
          categoryKey: values.categoryKey ?? '',
          location: values.location ?? '',
        }),
      );
      setWriting(false);
      message.success('已生成介绍，可继续修改');
    }, 800);
  };

  const save = async () => {
    const values = await form.validateFields();
    const payload = toPayload(values);
    const error = validateInterestGroupActivityForm(payload, mode === 'create');
    if (error) {
      message.warning(error);
      return;
    }
    const saved = upsertInterestGroupActivity(payload, editing?.id);
    message.success(aiMode ? 'AI 活动已保存，请提交审批后发布' : '活动已保存');
    onSaved(saved.id);
  };

  if (mode === 'edit' && !editing) {
    return (
      <div className="page-stack">
        <Empty description="活动不存在或已删除">
          <Button type="primary" onClick={onBack}>
            返回列表
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> },
          { title: aiMode ? 'AI 活动策划' : mode === 'create' ? '新建活动' : '编辑活动' },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{aiMode ? 'AI 活动策划' : mode === 'create' ? '新建活动' : '编辑活动'}</Typography.Title>
        <Typography.Text type="secondary">
          {aiMode ? '方案已生成，下面每一项都可以直接修改后保存，再提交审批并发布' : '保存后为待提交、未发布，需提交审批通过后再发布。'}
        </Typography.Text>
      </Flex>
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        initialValues={initialValues}
        key={`activity-form-${formEpoch}-${resolvedDraft?.title ?? 'blank'}`}
      >
        <Card title="活动信息">
          <Form.Item label="封面图片" extra="支持 jpg / png" required={mode === 'create'}>
            <Upload
              accept="image/*"
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
          <Form.Item name="coverUrl" hidden rules={mode === 'create' ? [{ required: true, message: '请上传封面图' }] : undefined}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="活动标题" rules={[{ required: true, message: '请输入活动标题' }, { max: 60, message: '不能超过 60 字' }]}>
            <Input maxLength={60} placeholder="请输入活动标题" />
          </Form.Item>
          {presetGroup ? (
            <Typography.Paragraph type="secondary">将创建到小组「{presetGroup.name}」</Typography.Paragraph>
          ) : null}
          <Form.Item name="groupId" label="所属小组" rules={[{ required: true, message: '请选择所属小组' }]}>
            <Select
              placeholder="请选择小组"
              options={groups.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => {
                const group = groups.find((item) => item.id === value);
                if (group && !form.getFieldValue('categoryKey')) {
                  form.setFieldValue('categoryKey', group.categoryKey);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="小组负责人">
            <Typography.Text>{hostName}</Typography.Text>
          </Form.Item>
          <Form.Item name="categoryKey" label="分类">
            <Select
              allowClear
              placeholder="未分类"
              options={categoryOptions}
              data-category-source={categoryOptions.map((item) => item.label).join('|')}
            />
          </Form.Item>
          <Form.Item name="type" label="活动类型" rules={[{ required: true, message: '请选择活动类型' }]}>
            <Radio.Group disabled={mode === 'edit'} optionType="button">
              <Radio.Button value="once">单次活动</Radio.Button>
              <Radio.Button value="recurring">周期活动</Radio.Button>
              <Radio.Button value="series">系列活动</Radio.Button>
            </Radio.Group>
          </Form.Item>
          {type === 'once' ? (
            <>
              <Form.Item name="startAt" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item name="endAt" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </>
          ) : null}
          {type === 'recurring' ? (
            <>
              <Form.Item name="repeatWeekday" label="重复规则" rules={[{ required: true, message: '请选择重复的周几' }]}>
                <Radio.Group disabled={mode === 'edit'} options={WEEKDAYS.map((item) => ({ value: item.value, label: item.label }))} />
              </Form.Item>
              <Form.Item label="每日时段" required>
                <Space>
                  <Form.Item name="timeStart" noStyle rules={[{ required: true, message: '请选择开始时段' }]}>
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                  <span>—</span>
                  <Form.Item name="timeEnd" noStyle rules={[{ required: true, message: '请选择结束时段' }]}>
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                </Space>
              </Form.Item>
            </>
          ) : null}
          {type === 'series' ? (
            <>
              <Form.Item name="seriesSignupMode" label="报名方式" rules={[{ required: true, message: '请选择报名方式' }]}>
                <Radio.Group>
                  <Radio value="independent">按场次报名</Radio>
                  <Radio value="all">整场报名</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="场次安排" required>
                <Form.List name="sessions">
                  {(fields, { add, remove }) => (
                    <div>
                      {fields.map((field) => (
                        <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }} wrap>
                          <Form.Item name={[field.name, 'startAt']} rules={[{ required: true, message: '开始时间' }]}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" placeholder="开始" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'endAt']} rules={[{ required: true, message: '结束时间' }]}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" placeholder="结束" />
                          </Form.Item>
                          {fields.length > 1 ? <MinusCircleOutlined onClick={() => remove(field.name)} /> : null}
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                        添加场次
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Form.Item>
            </>
          ) : null}
        </Card>
        <Card title="报名与地点">
          <Form.Item name="deadlineMode" label="报名截止">
            <Radio.Group>
              <Radio value="none">不限制</Radio>
              <Radio value="fixed">指定时间</Radio>
              <Radio value="hours_before">开始前 N 小时</Radio>
            </Radio.Group>
          </Form.Item>
          {deadlineMode === 'fixed' ? (
            <Form.Item name="deadlineAt" label="截止时间" rules={[{ required: true, message: '请选择报名截止时间' }]}>
              <DatePicker showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          ) : null}
          {deadlineMode === 'hours_before' ? (
            <Form.Item name="deadlineHoursBefore" label="开始前小时" rules={[{ required: true, message: '请填写小时数' }]}>
              <InputNumber min={1} />
            </Form.Item>
          ) : null}
          <Form.Item name="location" label="地点">
            <Input maxLength={80} placeholder="集合地点" />
          </Form.Item>
          <Form.Item name="capacity" label="人数上限" rules={[{ required: true, message: '请输入人数上限' }]}>
            <InputNumber min={1} />
          </Form.Item>
        </Card>
        <Card
          title="活动介绍"
          extra={
            <Button loading={writing} onClick={writeIntro}>
              AI 帮写
            </Button>
          }
        >
          <Form.Item name="detailHtml">
            <RichTextField ariaLabel="活动介绍" />
          </Form.Item>
        </Card>
        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" onClick={() => void save()}>
              {aiMode ? '确认并保存活动' : mode === 'create' ? '保存活动' : '保存修改'}
            </Button>
            {aiMode ? (
              <Button
                onClick={() => {
                  onRegenerate?.();
                  setAiOpen(true);
                }}
              >
                重新生成
              </Button>
            ) : null}
            <Button onClick={onBack}>取消</Button>
          </Space>
        </div>
      </Form>
      <InterestGroupActivityAiModal
        open={aiOpen}
        groupId={presetGroupId}
        onCancel={() => setAiOpen(false)}
        onGenerated={(next) => {
          setAiDraft(next);
          setCoverList([]);
          setFormEpoch((value) => value + 1);
          setAiOpen(false);
        }}
      />
    </div>
  );
}
