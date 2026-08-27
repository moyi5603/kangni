import { useEffect, useMemo, useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import { SignupFieldsEditor } from '../../activities/components/SignupFieldsEditor';
import { SignupApprovalNodesEditor } from '../../activities/components/SignupApprovalNodesEditor';
import {
  orgDepartmentTree,
  orgPeoplePickerTree,
  type Visibility,
} from '../../activities/model/activity';
import { defaultSignupFields, validateSignupFields, type SignupField } from '../../activities/model/signupFields';
import {
  defaultActivityPointValues,
  normalizeActivityPointRules,
  validateActivityPointValues,
} from '../../activities/model/activityPointRules';
import { getInterestGroupPointRules, useInterestGroupPointRules } from '../model/interestGroupPointRulesStore';
import type { ApprovalNode } from '../../activities/model/rules';
import {
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
  type DateTimeRange,
} from '../../activities/model/activityForm';
import {
  WEEKDAYS,
  needsSessionPick,
  signupQuotaLabel,
  signupQuotaPlaceholder,
  SIGNUP_HOURS_PLACEHOLDER,
  syncSignupEndAt,
} from '../../activities/model/activitySchedule';
import {
  generateInterestGroupActivityIntro,
  igActivityAlignDefaults,
  interestGroupActivityTypeLabels,
  validateInterestGroupActivityForm,
  type InterestGroupActivityFormValues,
  type InterestGroupActivityType,
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
  activityRange?: DateTimeRange;
  signupRange?: DateTimeRange;
  signupStartAt?: Dayjs;
  signupHoursBefore?: number;
  repeatWeekday?: number;
  sessionTimeStart?: Dayjs;
  sessionTimeEnd?: Dayjs;
  cycleRange?: DateTimeRange;
  sessionList?: Array<{ range?: DateTimeRange }>;
  location?: string;
  capacity?: number;
  detailHtml?: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  importFileName: string;
  notifyOnPublish: boolean;
  needAudit: boolean;
  hasSeniorityLimit: boolean;
  minSeniorityYears?: number;
  signupApprovalNodes: ApprovalNode[];
  signupFields: SignupField[];
  signupPoints: number;
  signupPointsEnabled: boolean;
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function downloadCrowdImportTemplate() {
  const lines = ['工号,姓名,部门', 'E1001,张悦,前端组', 'E1002,李明,前端组', 'E1003,陈产品,华东大区'];
  const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '活动可见人群导入模板.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toFileList(coverUrl: string): UploadFile[] {
  if (!coverUrl) return [];
  return [{ uid: '-1', name: '活动封面', status: 'done', url: coverUrl, thumbUrl: coverUrl }];
}

function timeOf(value?: string) {
  return value ? dayjs(`2000-01-01 ${value}`) : undefined;
}

function toPayload(values: FormShape, importedPeople: string[]): InterestGroupActivityFormValues {
  const align = igActivityAlignDefaults();
  const type = values.type;
  const activityTime =
    values.activityRange?.[0] && values.activityRange[1] ? formatDateTimeRange(values.activityRange) : { startAt: '', endAt: '' };
  const signupTime =
    values.signupRange?.[0] && values.signupRange[1] ? formatDateTimeRange(values.signupRange) : { startAt: '', endAt: '' };
  const sessions = (values.sessionList ?? []).flatMap((item) => {
    if (!item.range?.[0] || !item.range[1]) return [];
    const range = formatDateTimeRange(item.range);
    return [{ startAt: range.startAt, endAt: range.endAt }];
  });
  const signupStartAt = needsSessionPick(type)
    ? (values.signupStartAt?.format('YYYY-MM-DD HH:mm') ?? '')
    : signupTime.startAt;
  const signupHoursBefore = needsSessionPick(type) ? (values.signupHoursBefore ?? 0) : 0;
  const signupEndAt = needsSessionPick(type)
    ? syncSignupEndAt(
        sessions.map((session, index) => ({ id: `draft-${index}`, startAt: session.startAt, endAt: session.endAt })),
        signupHoursBefore,
      )
    : signupTime.endAt;
  return {
    coverUrl: values.coverUrl ?? '',
    title: values.title ?? '',
    groupId: values.groupId ?? 0,
    categoryKey: values.categoryKey ?? '',
    type,
    startAt: activityTime.startAt || undefined,
    endAt: activityTime.endAt || undefined,
    repeatWeekday: values.repeatWeekday,
    timeStart: values.sessionTimeStart?.format('HH:mm'),
    timeEnd: values.sessionTimeEnd?.format('HH:mm'),
    cycleStart: values.cycleRange?.[0]?.format('YYYY-MM-DD'),
    cycleEnd: values.cycleRange?.[1]?.format('YYYY-MM-DD'),
    sessions,
    signupStartAt: signupStartAt || align.signupStartAt,
    signupEndAt: signupEndAt || align.signupEndAt,
    signupHoursBefore,
    location: values.location ?? '',
    capacity: values.capacity ?? 0,
    detailHtml: values.detailHtml ?? '',
    visibility: values.visibility,
    departments: values.departments ?? [],
    customPeople: values.customPeople ?? [],
    importFileName: values.importFileName ?? '',
    importedPeople,
    notifyOnPublish: values.notifyOnPublish,
    needAudit: values.needAudit,
    minSeniorityYears: values.hasSeniorityLimit ? values.minSeniorityYears : undefined,
    signupApprovalNodes: values.signupApprovalNodes ?? [],
    signupFields: values.signupFields ?? defaultSignupFields(),
    signupPoints: values.signupPoints,
    signupPointsEnabled: values.signupPointsEnabled,
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
    activityRange: draft.startAt && draft.endAt ? toDateTimeRange(draft.startAt, draft.endAt) : undefined,
    signupRange: draft.signupStartAt && draft.signupEndAt ? toDateTimeRange(draft.signupStartAt, draft.signupEndAt) : undefined,
    signupStartAt: draft.signupStartAt ? dayjs(draft.signupStartAt) : undefined,
    signupHoursBefore: draft.signupHoursBefore,
    repeatWeekday: draft.repeatWeekday,
    sessionTimeStart: timeOf(draft.timeStart),
    sessionTimeEnd: timeOf(draft.timeEnd),
    cycleRange:
      draft.cycleStart && draft.cycleEnd ? toDateTimeRange(`${draft.cycleStart} 00:00`, `${draft.cycleEnd} 00:00`) : undefined,
    sessionList: (draft.sessions ?? []).map((session) => ({
      range: session.startAt && session.endAt ? toDateTimeRange(session.startAt, session.endAt) : undefined,
    })),
    location: draft.location,
    capacity: draft.capacity,
    detailHtml: draft.detailHtml,
    visibility: draft.visibility,
    departments: draft.departments,
    customPeople: draft.customPeople,
    importFileName: draft.importFileName,
    notifyOnPublish: draft.notifyOnPublish,
    needAudit: draft.needAudit,
    hasSeniorityLimit: draft.minSeniorityYears != null,
    minSeniorityYears: draft.minSeniorityYears,
    signupApprovalNodes: draft.signupApprovalNodes,
    signupFields: draft.signupFields?.length ? draft.signupFields : defaultSignupFields(),
    signupPoints: draft.signupPoints,
    signupPointsEnabled: draft.signupPointsEnabled,
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
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormShape>();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const editing = mode === 'edit' && recordId ? getInterestGroupActivity(Number(recordId)) : undefined;
  const copySource = mode === 'create' && recordId ? getInterestGroupActivity(Number(recordId)) : undefined;
  const presetGroupId = mode === 'create' && recordId && !copySource ? Number(recordId) : undefined;
  const [aiDraft, setAiDraft] = useState(() => draft ?? (mode === 'create' ? takePendingAiActivityDraft() : null));
  const [aiOpen, setAiOpen] = useState(false);
  const [formEpoch, setFormEpoch] = useState(0);
  const resolvedDraft = draft ?? aiDraft;
  const aiMode = presentation === 'ai' || resolvedDraft != null;
  const sourceCover = aiMode ? '' : (resolvedDraft?.coverUrl ?? editing?.coverUrl ?? copySource?.coverUrl ?? '');
  const [coverList, setCoverList] = useState<UploadFile[]>(() => toFileList(sourceCover));
  const sourceImport = editing?.importFileName ?? copySource?.importFileName ?? resolvedDraft?.importFileName ?? '';
  const [importList, setImportList] = useState<UploadFile[]>(() =>
    sourceImport ? [{ uid: '-2', name: sourceImport, status: 'done' }] : [],
  );
  const [writing, setWriting] = useState(false);
  const presetGroup = presetGroupId ? groups.find((item) => item.id === presetGroupId) : undefined;
  const categoryOptions = buildInterestGroupCategoryOptions(categories, {
    includeUncategorized: true,
    enabledOnly: true,
    keepKey: editing?.categoryKey ?? copySource?.categoryKey,
  });
  const pageTitle = aiMode ? 'AI 活动策划' : mode === 'create' ? '新建活动' : '编辑活动';
  const pointRules = normalizeActivityPointRules(useInterestGroupPointRules());

  const initialValues = useMemo<FormShape>(
    () =>
      resolvedDraft
        ? { ...draftToFormShape(resolvedDraft), coverUrl: '' }
        : editing
          ? draftToFormShape({ ...editing, groupId: editing.groupId ?? 0 })
          : copySource
            ? { ...draftToFormShape({ ...copySource, groupId: copySource.groupId ?? 0 }), coverUrl: copySource.coverUrl }
            : {
                coverUrl: '',
                title: '',
                groupId: presetGroup?.id,
                categoryKey: presetGroup?.categoryKey ?? '',
                type: 'once',
                sessionList: [{ range: undefined }, { range: undefined }],
                location: '',
                detailHtml: '',
                visibility: '全员',
                departments: [],
                customPeople: [],
                importFileName: '',
                notifyOnPublish: false,
                needAudit: false,
                hasSeniorityLimit: false,
                signupApprovalNodes: [],
                signupFields: defaultSignupFields(),
                signupPoints: defaultActivityPointValues(getInterestGroupPointRules()).signupPoints,
                signupPointsEnabled: false,
              },
    [resolvedDraft, editing, copySource, presetGroup],
  );

  useEffect(() => {
    setCoverList(toFileList(sourceCover));
    setImportList(sourceImport ? [{ uid: '-2', name: sourceImport, status: 'done' }] : []);
  }, [sourceCover, sourceImport]);

  const type = Form.useWatch('type', form) ?? initialValues.type;
  const visibility = Form.useWatch('visibility', form);
  const needAudit = Form.useWatch('needAudit', form);
  const hasSeniorityLimit = Form.useWatch('hasSeniorityLimit', form);
  const signupPointsEnabled = Form.useWatch('signupPointsEnabled', form);
  const capacity = Form.useWatch('capacity', form);
  const showSignupApproval = needAudit ?? editing?.needAudit ?? copySource?.needAudit ?? false;

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

  const leave = () => {
    if (!form.isFieldsTouched()) {
      onBack();
      return;
    }
    modal.confirm({
      title: '确认离开？',
      content: '未保存的修改将丢失。',
      okText: '确认',
      cancelText: '取消',
      footer: (_, { OkBtn, CancelBtn }) => (
        <Space>
          <OkBtn />
          <CancelBtn />
        </Space>
      ),
      onOk: onBack,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    const groupSumHint = validateSignupFields(values.signupFields ?? [], { signupTotalLimit: values.capacity });
    if (groupSumHint?.startsWith('各组人数合计要等于报名总人数')) return;
    const pointRulesForSave = getInterestGroupPointRules();
    const pointError = validateActivityPointValues(
      {
        signupPointsEnabled: Boolean(values.signupPointsEnabled),
        firstCommentPointsEnabled: false,
        ratingPointsEnabled: false,
        firstMomentPointsEnabled: false,
        signupPoints: values.signupPoints,
        firstCommentPoints: pointRulesForSave.firstCommentPointsMax,
        ratingPoints: pointRulesForSave.ratingPointsMax,
        firstMomentPoints: pointRulesForSave.firstMomentPointsMax,
      },
      pointRulesForSave,
    );
    if (pointError) {
      message.error(pointError);
      return;
    }
    const importedPeople =
      values.visibility === '导入人群' ? (editing?.importedPeople ?? copySource?.importedPeople ?? []) : [];
    const payload = toPayload(values, importedPeople);
    const error = validateInterestGroupActivityForm(payload, mode === 'create');
    if (error) {
      message.warning(error);
      return;
    }
    const saved = upsertInterestGroupActivity(payload, editing?.id);
    message.success(aiMode ? 'AI 活动已保存，请提交审批后发布' : mode === 'edit' ? '活动已更新' : '活动已保存');
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
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '兴趣小组' },
          { title: <Button type="link" className="breadcrumb-link" onClick={leave}>活动管理</Button> },
          { title: pageTitle },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {pageTitle}
        </Typography.Title>
        <Typography.Text type="secondary">
          {aiMode
            ? '方案已生成，下面每一项都可以直接修改后保存，再提交审批并发布'
            : '填写活动信息、报名规则和高级设置。封面与详情仅保存在本地演示数据中。'}
        </Typography.Text>
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
        key={`activity-form-${formEpoch}-${resolvedDraft?.title ?? 'blank'}`}
      >
        <Card title="活动信息">
          <Form.Item label="封面图片" extra="支持 jpg / png" required>
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
          <Form.Item name="coverUrl" hidden rules={[{ required: true, message: '请上传封面图片' }]}>
            <Input />
          </Form.Item>
          <Row gutter={16} className="form-2col">
            <Col xs={24} lg={12}>
              <Form.Item
                name="title"
                label="活动标题"
                rules={[
                  { required: true, message: '请输入活动标题' },
                  { max: 20, message: '活动标题不超过 20 个字' },
                ]}
              >
                <Input maxLength={20} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="categoryKey" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select
                  options={categoryOptions}
                  placeholder="请选择分类"
                  data-category-source={categoryOptions.map((item) => item.label).join('|')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} className="form-2col">
            <Col xs={24} lg={12}>
              <Form.Item name="location" label="活动地点">
                <Input placeholder="选填" maxLength={80} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
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
            </Col>
          </Row>
          <Form.Item name="type" label="举办方式" rules={[{ required: true, message: '请选择举办方式' }]}>
            <Radio.Group disabled={mode === 'edit'} optionType="button">
              {(['once', 'recurring', 'series'] as const).map((item) => (
                <Radio.Button key={item} value={item}>
                  {interestGroupActivityTypeLabels[item]}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          {type === 'once' || !type ? (
            <Row gutter={16} className="form-2col">
              <Col xs={24} lg={12}>
                <Form.Item
                  name="activityRange"
                  label="活动时间"
                  required
                  rules={[
                    {
                      validator: async (_, value) =>
                        validateDateTimeRange(value, {
                          required: '请选择活动时间',
                          order: '结束时间不得早于开始时间',
                        }),
                    },
                  ]}
                >
                  <DatePicker.RangePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder={['开始时间', '结束时间']}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="signupRange"
                  label="报名时间"
                  required
                  rules={[
                    {
                      validator: async (_, value) =>
                        validateDateTimeRange(value, {
                          required: '请选择报名时间',
                          order: '报名结束时间不得早于开始时间',
                        }),
                    },
                  ]}
                >
                  <DatePicker.RangePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder={['开始时间', '结束时间']}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item label={signupQuotaLabel(type)} required>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="capacity"
                      noStyle
                      rules={[{ required: true, message: `请输入${signupQuotaLabel(type)}` }]}
                    >
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button disabled>人</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          ) : null}
          {type === 'recurring' ? (
            <>
              <Form.Item name="repeatWeekday" label="重复周几" rules={[{ required: true, message: '请选择周几' }]}>
                <Radio.Group disabled={mode === 'edit'} options={WEEKDAYS.map((item) => ({ value: item.value, label: item.label }))} />
              </Form.Item>
              <Row gutter={16} className="form-2col">
                <Col xs={24} lg={12}>
                  <Form.Item label="每日时段" required>
                    <div className="time-range">
                      <Form.Item name="sessionTimeStart" noStyle rules={[{ required: true, message: '请选择开始时段' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                      <span>—</span>
                      <Form.Item name="sessionTimeEnd" noStyle rules={[{ required: true, message: '请选择结束时段' }]}>
                        <TimePicker format="HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </div>
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="cycleRange"
                    label="周期起止"
                    required
                    rules={[
                      {
                        validator: async (_, value) =>
                          validateDateTimeRange(value, {
                            required: '请选择周期起止日期',
                            order: '结束日期不得早于开始日期',
                          }),
                      },
                    ]}
                  >
                    <DatePicker.RangePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder={['开始日期', '结束日期']} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : null}
          {type === 'series' ? (
            <Form.List name="sessionList">
              {(fields, { add, remove }) => (
                <>
                  <Row gutter={16} className="form-2col">
                    {fields.map((field, index) => (
                      <Col xs={24} lg={12} key={field.key} className={fields.length > 2 ? 'session-col has-remove' : 'session-col'}>
                        <Form.Item
                          label={`第 ${index + 1} 场`}
                          required
                          name={[field.name, 'range']}
                          rules={[
                            {
                              validator: async (_, value) =>
                                validateDateTimeRange(value, {
                                  required: '请选择场次时间',
                                  order: '结束时间不得早于开始时间',
                                }),
                            },
                          ]}
                        >
                          <DatePicker.RangePicker
                            showTime={{ format: 'HH:mm' }}
                            format="YYYY-MM-DD HH:mm"
                            style={{ width: '100%' }}
                            placeholder={['开始时间', '结束时间']}
                          />
                        </Form.Item>
                        {fields.length > 2 ? (
                          <Button
                            type="text"
                            className="session-remove"
                            icon={<MinusCircleOutlined />}
                            aria-label={`删除第 ${index + 1} 场`}
                            onClick={() => remove(field.name)}
                          />
                        ) : null}
                      </Col>
                    ))}
                  </Row>
                  <Form.Item label=" " colon={false}>
                    <Button type="dashed" onClick={() => add({ range: undefined })} icon={<PlusOutlined />}>
                      添加场次
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          ) : null}
          {needsSessionPick(type) ? (
            <Row gutter={16} className="form-2col">
              <Col xs={24} lg={12}>
                <Form.Item label={signupQuotaLabel(type)} required>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="capacity"
                      noStyle
                      rules={[{ required: true, message: `请输入${signupQuotaLabel(type)}` }]}
                    >
                      <InputNumber
                        min={1}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={signupQuotaPlaceholder(type)}
                      />
                    </Form.Item>
                    <Button disabled>人</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item name="signupStartAt" label="报名开始" rules={[{ required: true, message: '请选择报名开始时间' }]}>
                  <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item label="报名截止" required>
                  <Space.Compact style={{ width: '100%' }}>
                    <Button disabled>开场前</Button>
                    <Form.Item name="signupHoursBefore" noStyle rules={[{ required: true, message: '请填写开场前小时数' }]}>
                      <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder={SIGNUP_HOURS_PLACEHOLDER} />
                    </Form.Item>
                    <Button disabled>小时</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          ) : null}
          <Form.Item
            name="detailHtml"
            label="活动详情"
            extra={
              <Button type="link" size="small" loading={writing} onClick={() => void writeIntro()} style={{ paddingInline: 0 }}>
                AI 帮写
              </Button>
            }
            rules={[{ required: true, message: '请填写活动详情' }]}
          >
            <RichTextField ariaLabel="活动详情" />
          </Form.Item>
        </Card>

        <Card title="可见范围" className="activity-settings-card">
          <Form.Item name="visibility" label="可见范围" rules={[{ required: true, message: '请选择可见范围' }]}>
            <Radio.Group options={optionsOf(['全员', '按部门', '自定义人群', '导入人群'])} />
          </Form.Item>
          {visibility === '按部门' ? (
            <Form.Item name="departments" label="选择部门" rules={[{ required: true, message: '请选择部门' }]}>
              <TreeSelect
                treeData={orgDepartmentTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请选择部门"
                style={{ width: '100%' }}
              />
            </Form.Item>
          ) : null}
          {visibility === '自定义人群' ? (
            <Form.Item name="customPeople" label="选择人员" rules={[{ required: true, message: '请选择人员' }]}>
              <TreeSelect
                treeData={orgPeoplePickerTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请按组织架构选择人员"
                style={{ width: '100%' }}
              />
            </Form.Item>
          ) : null}
          {visibility === '导入人群' ? (
            <>
              <Form.Item name="importFileName" hidden rules={[{ required: true, message: '请导入人群文件' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="导入人群" extra="支持 csv / xlsx。请按模板填写工号、姓名、部门。" required>
                <Space>
                  <Upload
                    accept=".csv,.xlsx"
                    maxCount={1}
                    fileList={importList}
                    beforeUpload={() => false}
                    onChange={({ fileList }) => {
                      setImportList(fileList.slice(-1));
                      form.setFieldValue('importFileName', fileList[0]?.name ?? '');
                    }}
                  >
                    <Button>上传文件</Button>
                  </Upload>
                  <Button type="link" style={{ paddingInline: 0 }} onClick={downloadCrowdImportTemplate}>
                    下载导入模板
                  </Button>
                </Space>
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="notifyOnPublish" label="发送消息通知" valuePropName="checked" extra="活动发布后自动发送消息通知">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Card>

        <Card styles={{ body: { paddingBlock: 0 } }} className="advanced-settings-card">
          <Collapse
            ghost
            className="advanced-settings-collapse"
            defaultActiveKey={[]}
            items={[
              {
                key: 'advanced',
                label: '高级设置',
                forceRender: true,
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%', paddingBottom: 16 }}>
                    <Card title="活动设置" size="small" className="activity-settings-card">
                      <Form.Item name="needAudit" label="是否审核报名" valuePropName="checked">
                        <Switch
                          checkedChildren="需要审核"
                          unCheckedChildren="无需审核"
                          onChange={(checked) => {
                            if (!checked) form.setFieldValue('signupApprovalNodes', []);
                          }}
                        />
                      </Form.Item>
                      {showSignupApproval ? (
                        <Form.Item name="signupApprovalNodes" label="审批流节点">
                          <SignupApprovalNodesEditor />
                        </Form.Item>
                      ) : null}
                      <Form.Item label="报名司龄限制">
                        <Flex align="center" gap={12} className="activity-signup-points">
                          <Form.Item name="hasSeniorityLimit" valuePropName="checked" noStyle>
                            <Switch checkedChildren="有限制" unCheckedChildren="无限制" />
                          </Form.Item>
                          <Space.Compact className="activity-unit-compact">
                            <Form.Item
                              name="minSeniorityYears"
                              noStyle
                              rules={hasSeniorityLimit ? [{ required: true, message: '请输入司龄年限' }] : []}
                            >
                              <InputNumber disabled={!hasSeniorityLimit} min={0} precision={0} placeholder="请输入" />
                            </Form.Item>
                            <Button disabled>年</Button>
                          </Space.Compact>
                        </Flex>
                      </Form.Item>
                      <Form.Item
                        label="活动积分"
                        extra={signupPointsEnabled ? `规则范围 ${pointRules.signupPointsMin}～${pointRules.signupPointsMax}` : undefined}
                      >
                        <Flex align="center" gap={12} className="activity-signup-points">
                          <Form.Item name="signupPointsEnabled" valuePropName="checked" noStyle>
                            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                          </Form.Item>
                          <Space.Compact>
                            <Form.Item
                              name="signupPoints"
                              noStyle
                              rules={
                                signupPointsEnabled
                                  ? [
                                      { required: true, message: '请输入报名积分' },
                                      {
                                        type: 'integer',
                                        min: pointRules.signupPointsMin,
                                        max: pointRules.signupPointsMax,
                                        message: `须在 ${pointRules.signupPointsMin}～${pointRules.signupPointsMax} 之间`,
                                      },
                                    ]
                                  : []
                              }
                            >
                              <InputNumber
                                disabled={!signupPointsEnabled}
                                min={pointRules.signupPointsMin}
                                max={pointRules.signupPointsMax}
                                precision={0}
                                placeholder="请输入"
                              />
                            </Form.Item>
                            <Button disabled>积分</Button>
                          </Space.Compact>
                        </Flex>
                      </Form.Item>
                    </Card>
                    <Card title="报名信息收集" size="small">
                      <Form.Item
                        name="signupFields"
                        label="填写项"
                        dependencies={['capacity']}
                        rules={[
                          {
                            validator: async (_, value: SignupField[]) => {
                              const error = validateSignupFields(value ?? [], {
                                signupTotalLimit: form.getFieldValue('capacity'),
                              });
                              if (!error || error.startsWith('各组人数合计要等于报名总人数')) return;
                              throw new Error(error);
                            },
                          },
                        ]}
                      >
                        <SignupFieldsEditor signupTotalLimit={typeof capacity === 'number' ? capacity : undefined} />
                      </Form.Item>
                    </Card>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button aria-label="取消" onClick={leave}>
              取消
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
            <Button type="primary" aria-label={aiMode ? '确认并保存活动' : '保存'} onClick={() => void save()}>
              {aiMode ? '确认并保存活动' : '保存'}
            </Button>
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
