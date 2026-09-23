import { useEffect, useMemo, useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import dayjs, { type Dayjs } from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import {
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
  type DateTimeRange,
} from '../../activities/model/activityForm';
import {
  WEEKDAYS,
  applyRepeatWeekdaySelection,
  coerceRepeatRules,
  generateRecurringSessions,
  needsSessionPick,
  repeatWeekdayValues,
  sessionFullyWithinWindow,
  signupQuotaLabel,
  signupQuotaPlaceholder,
  SIGNUP_HOURS_PLACEHOLDER,
  syncSignupEndAt,
  weekdayLabel,
} from '../../activities/model/activitySchedule';
import {
  generateInterestGroupActivityIntro,
  igActivityAlignDefaults,
  interestGroupActivityTypeLabels,
  validateInterestGroupActivityForm,
  type InterestGroupActivityFormValues,
  type InterestGroupActivityType,
  type InterestGroupNotifyAudience,
} from '../model/interestGroupActivity';
import { defaultCheckInSettings } from '../../activities/model/activityCheckIn';
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
  repeatRules?: Array<{ weekday: number; timeStart?: Dayjs; timeEnd?: Dayjs }>;
  sessionList?: Array<{ range?: DateTimeRange }>;
  location?: string;
  capacity?: number;
  detailHtml?: string;
  notifyOnPublish: boolean;
  notifyAudience: InterestGroupNotifyAudience;
  checkInEnabled: boolean;
  checkInOpenMinutesBefore: number;
  checkInDynamicQr: boolean;
};

function toFileList(coverUrl: string): UploadFile[] {
  if (!coverUrl) return [];
  return [{ uid: '-1', name: '活动封面', status: 'done', url: coverUrl, thumbUrl: coverUrl }];
}

function RepeatRulesHolder(_props: { value?: FormShape['repeatRules'] }) {
  return null;
}

function timeOf(value?: string) {
  return value ? dayjs(`2000-01-01 ${value}`) : undefined;
}

function toPayload(values: FormShape): InterestGroupActivityFormValues {
  const align = igActivityAlignDefaults();
  const type = values.type;
  const activityTime =
    values.activityRange?.[0] && values.activityRange[1] ? formatDateTimeRange(values.activityRange) : { startAt: '', endAt: '' };
  const signupTime =
    values.signupRange?.[0] && values.signupRange[1] ? formatDateTimeRange(values.signupRange) : { startAt: '', endAt: '' };
  const sessions =
    type === 'recurring'
      ? generateRecurringSessions({
          rules: (values.repeatRules ?? []).map((item) => ({
            weekday: Number(item.weekday),
            timeStart: item.timeStart?.format('HH:mm') ?? '',
            timeEnd: item.timeEnd?.format('HH:mm') ?? '',
          })),
          windowStart: activityTime.startAt,
          windowEnd: activityTime.endAt,
        }).map(({ startAt, endAt }) => ({ startAt, endAt }))
      : (values.sessionList ?? []).flatMap((item) => {
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
    repeatRules:
      type === 'recurring'
        ? (values.repeatRules ?? []).map((item) => ({
            weekday: Number(item.weekday),
            timeStart: item.timeStart?.format('HH:mm') ?? '',
            timeEnd: item.timeEnd?.format('HH:mm') ?? '',
          }))
        : undefined,
    sessions,
    signupStartAt: signupStartAt || align.signupStartAt,
    signupEndAt: signupEndAt || align.signupEndAt,
    signupHoursBefore,
    location: values.location ?? '',
    capacity: values.capacity ?? 0,
    detailHtml: values.detailHtml ?? '',
    visibility: '全员',
    departments: [],
    customPeople: [],
    importFileName: '',
    importedPeople: [],
    notifyOnPublish: values.notifyOnPublish,
    notifyAudience: 'members',
    ...defaultCheckInSettings(),
    checkInEnabled: values.checkInEnabled,
    checkInOpenMinutesBefore: values.checkInOpenMinutesBefore,
    checkInDynamicQr: values.checkInDynamicQr,
    needAudit: false,
    minSeniorityYears: undefined,
    signupApprovalNodes: [],
    signupFields: [],
    signupPoints: align.signupPoints,
    signupPointsEnabled: true,
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
    repeatRules: coerceRepeatRules(draft).map((rule) => ({
      weekday: rule.weekday,
      timeStart: timeOf(rule.timeStart),
      timeEnd: timeOf(rule.timeEnd),
    })),
    sessionList: (draft.sessions ?? []).map((session) => ({
      range: session.startAt && session.endAt ? toDateTimeRange(session.startAt, session.endAt) : undefined,
    })),
    location: draft.location,
    capacity: draft.capacity,
    detailHtml: draft.detailHtml,
    notifyOnPublish: draft.notifyOnPublish,
    notifyAudience: 'members',
    checkInEnabled: Boolean(draft.checkInEnabled),
    checkInOpenMinutesBefore: draft.checkInOpenMinutesBefore ?? 30,
    checkInDynamicQr: Boolean(draft.checkInDynamicQr),
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
  const [writing, setWriting] = useState(false);
  const presetGroup = presetGroupId ? groups.find((item) => item.id === presetGroupId) : undefined;
  const categoryOptions = buildInterestGroupCategoryOptions(categories, {
    includeUncategorized: true,
    enabledOnly: true,
    keepKey: editing?.categoryKey ?? copySource?.categoryKey,
  });
  const pageTitle = aiMode ? 'AI 活动策划' : mode === 'create' ? '新建活动' : '编辑活动';

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
                notifyOnPublish: false,
                notifyAudience: 'members',
                checkInEnabled: false,
                checkInOpenMinutesBefore: 30,
                checkInDynamicQr: false,
              },
    [resolvedDraft, editing, copySource, presetGroup],
  );

  useEffect(() => {
    setCoverList(toFileList(sourceCover));
  }, [sourceCover]);

  const type = Form.useWatch('type', form) ?? initialValues.type;
  const checkInEnabled = Form.useWatch('checkInEnabled', form);
  const repeatRules = Form.useWatch('repeatRules', { form, preserve: true }) ?? initialValues.repeatRules ?? [];
  const activityRange = Form.useWatch('activityRange', form);

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
    const payload = toPayload(values);
    const error = validateInterestGroupActivityForm(payload, mode === 'create');
    if (error) {
      message.warning(error);
      return;
    }
    const saved = upsertInterestGroupActivity(payload, editing?.id);
    message.success(aiMode ? 'AI 活动已保存，可直接发布' : mode === 'edit' ? '活动已更新' : '活动已保存');
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
          { title: '兴趣圈' },
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
            ? '方案已生成，下面每一项都可以直接修改后保存，再发布'
            : '填写活动信息和报名规则。封面与详情仅保存在本地演示数据中。'}
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
          <Form.Item label="封面图片" extra={COVER_IMAGE_UPLOAD_HINT} required>
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
              <Form.Item name="groupId" label="所属兴趣圈" rules={[{ required: true, message: '请选择所属兴趣圈' }]}>
                <Select
                  placeholder="请选择兴趣圈"
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
          <Row gutter={16} className="form-2col">
            <Col xs={24} lg={12} className="activity-time-field">
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
          </Row>
          <Form.Item name="repeatRules" hidden>
            <RepeatRulesHolder />
          </Form.Item>
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
              <Form.Item
                label="重复周几"
                required
                rules={[
                  {
                    validator: async () => {
                      if (!repeatWeekdayValues(form.getFieldValue('repeatRules') ?? []).length) {
                        throw new Error('请选择重复的周几');
                      }
                    },
                  },
                ]}
              >
                <div className="repeat-weekday-checks">
                  {WEEKDAYS.map((item) => {
                    const selected = repeatWeekdayValues(repeatRules).includes(item.value);
                    return (
                      <Checkbox
                        key={item.value}
                        disabled={mode === 'edit'}
                        checked={selected}
                        onChange={(event) => {
                          const current = form.getFieldValue('repeatRules') ?? [];
                          const picked = new Set(repeatWeekdayValues(current));
                          if (event.target.checked) picked.add(item.value);
                          else picked.delete(item.value);
                          form.setFieldValue(
                            'repeatRules',
                            applyRepeatWeekdaySelection(current, [...picked]).map((rule) => ({
                              weekday: Number(rule.weekday),
                              timeStart:
                                'timeStart' in rule && rule.timeStart
                                  ? rule.timeStart
                                  : timeOf('19:30'),
                              timeEnd:
                                'timeEnd' in rule && rule.timeEnd ? rule.timeEnd : timeOf('21:00'),
                            })),
                          );
                        }}
                      >
                        {item.label}
                      </Checkbox>
                    );
                  })}
                </div>
              </Form.Item>
              <Row gutter={16} className="form-2col repeat-session-grid">
                {repeatRules.map((rule, index) => (
                  <Col span={12} key={Number(rule.weekday)}>
                    <Form.Item label={`${weekdayLabel(Number(rule.weekday))}时段`} required>
                      <div className="time-range">
                        <TimePicker
                          format="HH:mm"
                          needConfirm={false}
                          disabled={mode === 'edit'}
                          style={{ width: '100%' }}
                          value={rule.timeStart}
                          onChange={(timeStart) => {
                            const current = form.getFieldValue('repeatRules') ?? [];
                            form.setFieldValue(
                              'repeatRules',
                              current.map((item, itemIndex) => (itemIndex === index ? { ...item, timeStart } : item)),
                            );
                          }}
                        />
                        <span>—</span>
                        <TimePicker
                          format="HH:mm"
                          needConfirm={false}
                          disabled={mode === 'edit'}
                          style={{ width: '100%' }}
                          value={rule.timeEnd}
                          onChange={(timeEnd) => {
                            const current = form.getFieldValue('repeatRules') ?? [];
                            form.setFieldValue(
                              'repeatRules',
                              current.map((item, itemIndex) => (itemIndex === index ? { ...item, timeEnd } : item)),
                            );
                          }}
                        />
                      </div>
                    </Form.Item>
                  </Col>
                ))}
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
                              validator: async (_, value) => {
                                await validateDateTimeRange(value, {
                                  required: '请选择场次时间',
                                  order: '结束时间不得早于开始时间',
                                });
                                const window = activityRange?.[0] && activityRange[1] ? formatDateTimeRange(activityRange) : undefined;
                                if (!value?.[0] || !value[1] || !window) return;
                                const range = formatDateTimeRange(value);
                                if (!sessionFullyWithinWindow(range, window.startAt, window.endAt)) {
                                  throw new Error(`第 ${index + 1} 场必须完全落在活动时间内`);
                                }
                              },
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

        <Card title="消息通知" className="activity-settings-card">
          <Form.Item
            name="notifyOnPublish"
            label="发送消息通知"
            valuePropName="checked"
            extra="活动发布后仅通知兴趣圈成员"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Card>

        <Card title="扫码签到" className="activity-settings-card">
          <Form.Item name="checkInEnabled" label="扫码签到" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          {checkInEnabled ? (
            <>
              <Form.Item label="活动开始前可扫" required extra="签到从开始前该分钟数开放，至该场结束关闭">
                <Space.Compact className="activity-unit-compact">
                  <Form.Item
                    name="checkInOpenMinutesBefore"
                    noStyle
                    rules={[{ required: true, message: '请输入可扫分钟数' }]}
                  >
                    <InputNumber min={0} precision={0} placeholder="请输入" />
                  </Form.Item>
                  <Button disabled>分钟</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item
                name="checkInDynamicQr"
                label="动态二维码"
                valuePropName="checked"
                extra="每 5 分钟刷新一次，适合现场投屏，不适合打印"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </>
          ) : null}
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
