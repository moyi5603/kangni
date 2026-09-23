import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import {
  App,
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
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
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import dayjs, { type Dayjs } from 'dayjs';
import { RichTextField } from '../components/RichTextField';
import { SignupApprovalNodesEditor } from '../components/SignupApprovalNodesEditor';
import { SignupFieldsEditor } from '../components/SignupFieldsEditor';
import { SignupGroupsEditor } from '../components/SignupGroupsEditor';
import {
  activityTypes,
  canSubmitApproval,
  editActivityBlockReason,
  orgDepartmentTree,
  orgPeoplePickerTree,
  type Activity,
  type AuditStatus,
  type SignupField,
  type Visibility,
} from '../model/activity';
import { defaultSignupFields, findGroupSignupField, setGroupSignupEnabled, setSignupFieldGroups, validateSignupFields } from '../model/signupFields';
import {
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
  type DateTimeRange,
} from '../model/activityForm';
import { getActivity, getActivities, upsertActivity } from '../model/activityStore';
import { nextCustomSortIndex } from '../../interest-groups/model/pinSort';
import {
  defaultActivityPointValues,
  normalizeActivityPointRules,
  validateActivityPointValues,
} from '../model/activityPointRules';
import { getActivityPointRules, useActivityPointRules } from '../model/activityPointRulesStore';
import { recordApprovalSubmit } from '../model/related';
import { activityAdminSelf } from '../model/activityCommentReply';
import { useCategories } from '../model/categoryStore';
import type { ApprovalNode } from '../model/rules';
import {
  WEEKDAYS,
  activityScheduleTypeLabels,
  applyRepeatWeekdaySelection,
  coerceRepeatRules,
  createSessionId,
  generateRecurringSessions,
  needsSessionPick,
  repeatWeekdayValues,
  sessionFullyWithinWindow,
  SIGNUP_HOURS_PLACEHOLDER,
  signupQuotaLabel,
  signupQuotaPlaceholder,
  syncSignupEndAt,
  validateActivitySchedule,
  weekdayLabel,
  type ActivityScheduleType,
  type ActivitySession,
  type RepeatRule,
} from '../model/activitySchedule';
import {
  CHECK_IN_ONCE_SESSION_ID,
  checkInTokenForSession,
  defaultCheckInSettings,
  ensureSessionCheckInTokens,
  type CheckInOpenMode,
  type CheckInValidUnit,
} from '../model/activityCheckIn';

type ActivityFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
};

type FormValues = {
  coverUrl: string;
  title: string;
  category: string;
  activityRange?: DateTimeRange;
  signupRange?: DateTimeRange;
  signupStartAt?: Dayjs;
  signupHoursBefore?: number;
  location: string;
  signupTotalLimit?: number;
  needAudit: boolean;
  hasSeniorityLimit: boolean;
  minSeniorityYears?: number;
  signupApprovalNodes: ApprovalNode[];
  signupPoints: number;
  firstCommentPoints: number;
  ratingPoints: number;
  firstMomentPoints: number;
  signupPointsEnabled: boolean;
  firstCommentPointsEnabled: boolean;
  ratingPointsEnabled: boolean;
  firstMomentPointsEnabled: boolean;
  organizer: string;
  detailHtml: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  visibilityMinSeniorityYears?: number;
  importFileName: string;
  notifyOnPublish: boolean;
  signupFields: SignupField[];
  scheduleType: ActivityScheduleType;
  repeatRules?: Array<{ weekday: number; timeStart?: Dayjs; timeEnd?: Dayjs }>;
  sessionList?: Array<{ range?: DateTimeRange }>;
  checkInEnabled: boolean;
  checkInOpenMode: CheckInOpenMode;
  checkInOpenMinutesBefore: number;
  checkInValidAfterStart: number;
  checkInValidAfterStartUnit: CheckInValidUnit;
  checkInDynamicQr: boolean;
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

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function toFileList(coverUrl: string): UploadFile[] {
  if (!coverUrl) return [];
  return [{ uid: '-1', name: '活动封面', status: 'done', url: coverUrl, thumbUrl: coverUrl }];
}

function fallbackRange(): DateTimeRange {
  const start = dayjs();
  return [start, start.add(2, 'hour')];
}

function timeOf(value?: string) {
  return value ? dayjs(`2000-01-01 ${value}`) : undefined;
}

function RepeatRulesHolder(_props: { value?: FormValues['repeatRules'] }) {
  return null;
}

function repeatRulesFromForm(values: FormValues): RepeatRule[] {
  return (values.repeatRules ?? [])
    .filter((item) => item.weekday != null)
    .map((item) => ({
      weekday: Number(item.weekday),
      timeStart: item.timeStart?.format('HH:mm') ?? '',
      timeEnd: item.timeEnd?.format('HH:mm') ?? '',
    }));
}

function resolveScheduleFromForm(values: FormValues): {
  scheduleType: ActivityScheduleType;
  sessions: ActivitySession[];
  startAt: string;
  endAt: string;
  repeatRules?: RepeatRule[];
} {
  const scheduleType = values.scheduleType ?? 'once';
  const activityTime = formatDateTimeRange(
    values.activityRange?.[0] && values.activityRange[1] ? values.activityRange : fallbackRange(),
  );
  if (scheduleType === 'recurring') {
    const repeatRules = repeatRulesFromForm(values);
    return {
      scheduleType,
      repeatRules,
      sessions: generateRecurringSessions({
        rules: repeatRules,
        windowStart: activityTime.startAt,
        windowEnd: activityTime.endAt,
      }),
      startAt: activityTime.startAt,
      endAt: activityTime.endAt,
    };
  }
  if (scheduleType === 'series') {
    const sessions = (values.sessionList ?? []).flatMap((item, index) => {
      if (!item.range?.[0] || !item.range[1]) return [];
      const range = formatDateTimeRange(item.range);
      return [{ id: createSessionId(range.startAt, index), startAt: range.startAt, endAt: range.endAt }];
    });
    return { scheduleType, sessions, startAt: activityTime.startAt, endAt: activityTime.endAt };
  }
  return {
    scheduleType: 'once',
    sessions: [{ id: createSessionId(activityTime.startAt, 0), startAt: activityTime.startAt, endAt: activityTime.endAt }],
    startAt: activityTime.startAt,
    endAt: activityTime.endAt,
  };
}

function resolveSignupWindow(
  values: FormValues,
  scheduleType: ActivityScheduleType,
  sessions: ActivitySession[],
): { signupStartAt: string; signupEndAt: string; signupHoursBefore: number } {
  if (needsSessionPick(scheduleType)) {
    const signupStartAt =
      values.signupStartAt?.format('YYYY-MM-DD HH:mm') ??
      (values.signupRange?.[0] ? values.signupRange[0].format('YYYY-MM-DD HH:mm') : formatDateTimeRange(fallbackRange()).startAt);
    const signupHoursBefore = values.signupHoursBefore ?? 0;
    return {
      signupStartAt,
      signupHoursBefore,
      signupEndAt: syncSignupEndAt(sessions, signupHoursBefore),
    };
  }
  const signupTime = formatDateTimeRange(
    values.signupRange?.[0] && values.signupRange[1] ? values.signupRange : fallbackRange(),
  );
  return { signupStartAt: signupTime.startAt, signupEndAt: signupTime.endAt, signupHoursBefore: 0 };
}

function activityToFormValues(activity: Activity): Partial<FormValues> {
  const primary = activity.signupSettings[0];
  return {
    coverUrl: activity.coverUrl,
    title: activity.title,
    category: activity.category,
    activityRange: toDateTimeRange(activity.startAt, activity.endAt),
    signupRange: toDateTimeRange(activity.signupStartAt, activity.signupEndAt),
    signupStartAt: activity.signupStartAt ? dayjs(activity.signupStartAt) : undefined,
    signupHoursBefore: activity.signupHoursBefore ?? 0,
    location: activity.location,
    scheduleType: activity.scheduleType ?? 'once',
    repeatRules: coerceRepeatRules(activity).map((rule) => ({
      weekday: rule.weekday,
      timeStart: timeOf(rule.timeStart),
      timeEnd: timeOf(rule.timeEnd),
    })),
    sessionList: (activity.sessions ?? []).map((session) => ({ range: toDateTimeRange(session.startAt, session.endAt) })),
    signupTotalLimit: activity.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0) || undefined,
    needAudit: primary?.needAudit ?? false,
    hasSeniorityLimit: primary?.minSeniorityYears != null,
    minSeniorityYears: primary?.minSeniorityYears,
    signupApprovalNodes: activity.signupApprovalNodes ?? [],
    signupPoints: activity.signupPoints,
    firstCommentPoints: activity.firstCommentPoints,
    ratingPoints: activity.ratingPoints,
    firstMomentPoints: activity.firstMomentPoints,
    signupPointsEnabled: activity.signupPointsEnabled !== false,
    firstCommentPointsEnabled: activity.firstCommentPointsEnabled !== false,
    ratingPointsEnabled: activity.ratingPointsEnabled !== false,
    firstMomentPointsEnabled: activity.firstMomentPointsEnabled !== false,
    organizer: activity.organizer,
    detailHtml: activity.detailHtml,
    visibility: activity.visibility,
    departments: activity.departments,
    customPeople: activity.customPeople,
    visibilityMinSeniorityYears: activity.visibilityMinSeniorityYears,
    importFileName: activity.importFileName,
    notifyOnPublish: Boolean(activity.notifyOnPublish),
    signupFields: activity.signupFields,
    checkInEnabled: Boolean(activity.checkInEnabled),
    checkInOpenMode: activity.checkInOpenMode ?? 'before_start',
    checkInOpenMinutesBefore: activity.checkInOpenMinutesBefore ?? 30,
    checkInValidAfterStart: activity.checkInValidAfterStart ?? 3,
    checkInValidAfterStartUnit: activity.checkInValidAfterStartUnit ?? 'day',
    checkInDynamicQr: Boolean(activity.checkInDynamicQr),
  };
}

export function ActivityFormPage({ mode, recordId, onBack }: ActivityFormPageProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const editing = mode === 'edit' ? getActivity(Number(recordId)) : undefined;
  const copySource = mode === 'create' && recordId ? getActivity(Number(recordId)) : undefined;
  const categoryRecords = useCategories();
  const categoryOptions = useMemo(
    () =>
      categoryRecords
        .filter((item) => item.status === '启用' || item.name === (editing?.category ?? copySource?.category))
        .map((item) => ({ value: item.name, label: item.name })),
    [categoryRecords, editing, copySource],
  );
  const pointRules = normalizeActivityPointRules(useActivityPointRules());
  const visibility = Form.useWatch('visibility', form);
  const needAudit = Form.useWatch('needAudit', form);
  const showSignupApproval = needAudit ?? editing?.signupSettings[0]?.needAudit ?? copySource?.signupSettings[0]?.needAudit ?? false;
  const hasSeniorityLimit = Form.useWatch('hasSeniorityLimit', form);
  const signupTotalLimit = Form.useWatch('signupTotalLimit', form);
  const signupFields = Form.useWatch('signupFields', form) ?? [];
  const groupSignupField = findGroupSignupField(signupFields);
  const signupPointsEnabled = Form.useWatch('signupPointsEnabled', form);
  const checkInEnabled = Form.useWatch('checkInEnabled', form);
  const scheduleType = Form.useWatch('scheduleType', form) ?? (editing ? editing.scheduleType : undefined) ?? 'once';
  const repeatRules =
    Form.useWatch('repeatRules', { form, preserve: true }) ??
    (editing
      ? coerceRepeatRules(editing).map((rule) => ({
          weekday: rule.weekday,
          timeStart: timeOf(rule.timeStart),
          timeEnd: timeOf(rule.timeEnd),
        }))
      : []);
  const activityRange = Form.useWatch('activityRange', form);
  const title = mode === 'edit' ? '编辑活动' : '新建活动';
  const editLockedReason = mode === 'edit' && editing ? editActivityBlockReason(editing) : undefined;

  const initialValues = useMemo<Partial<FormValues>>(
    () =>
      editing
        ? activityToFormValues(editing)
        : copySource
          ? activityToFormValues(copySource)
          : {
              visibility: '全员',
              departments: [],
              customPeople: [],
              importFileName: '',
              notifyOnPublish: false,
              detailHtml: '',
              coverUrl: '',
              signupTotalLimit: undefined,
              needAudit: false,
              hasSeniorityLimit: false,
              signupApprovalNodes: [],
              signupFields: defaultSignupFields(),
              scheduleType: 'once',
              signupHoursBefore: undefined,
              sessionList: [{ range: undefined }, { range: undefined }],
              ...defaultActivityPointValues(getActivityPointRules()),
              firstCommentPointsEnabled: false,
              ratingPointsEnabled: false,
              firstMomentPointsEnabled: false,
              ...defaultCheckInSettings(),
            },
    [editing, copySource],
  );

  useEffect(() => {
    setCoverList(toFileList(editing?.coverUrl ?? copySource?.coverUrl ?? ''));
    setImportList(
      (editing?.importFileName ?? copySource?.importFileName)
        ? [{ uid: '-2', name: editing?.importFileName ?? copySource?.importFileName ?? '', status: 'done' }]
        : [],
    );
  }, [editing, copySource]);

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

  const save = async (submit = false) => {
    if (editLockedReason) {
      message.warning(editLockedReason);
      return;
    }
    const values = await form.validateFields();
    const groupSumHint = validateSignupFields(values.signupFields ?? [], {
      signupTotalLimit: values.signupTotalLimit,
    });
    // 分组人数不符时，提示只保留「报名分组设置」下方文案，此处仅拦截保存
    if (groupSumHint?.startsWith('各组人数合计要等于报名总人数')) {
      return;
    }
    const pointRulesForSave = getActivityPointRules();
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
    const schedule = resolveScheduleFromForm(values);
    const sessions = ensureSessionCheckInTokens(schedule.sessions, editing?.sessions ?? copySource?.sessions ?? []);
    const scheduleError = validateActivitySchedule({
      scheduleType: schedule.scheduleType,
      windowStart: schedule.startAt,
      windowEnd: schedule.endAt,
      repeatRules: schedule.repeatRules,
      sessions,
    });
    if (scheduleError) {
      message.error(scheduleError);
      return;
    }
    const resolvedType = editing?.type ?? copySource?.type ?? activityTypes[0];
    if (needsSessionPick(schedule.scheduleType)) {
      if (!values.signupStartAt) {
        throw new Error('时间范围未填写完整');
      }
    } else if (!values.signupRange) {
      throw new Error('时间范围未填写完整');
    }
    if (!values.activityRange) {
      throw new Error('时间范围未填写完整');
    }
    const signup = resolveSignupWindow(values, schedule.scheduleType, sessions);
    const publishOnCreate = submit && mode === 'create';
    const currentStatus = editing?.auditStatus ?? '无需审核';
    const auditStatus: AuditStatus = publishOnCreate ? '无需审核' : submit ? '待审核' : currentStatus;
    const activity: Activity = {
      id: editing?.id ?? Date.now(),
      coverUrl: values.coverUrl || '',
      title: values.title,
      type: resolvedType,
      category: values.category,
      tags: [],
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      scheduleType: schedule.scheduleType,
      repeatRules: schedule.scheduleType === 'recurring' ? schedule.repeatRules : undefined,
      sessions,
      location: values.location?.trim() || '',
      organizer: values.organizer,
      phone: editing?.phone ?? copySource?.phone ?? '',
      detailHtml: values.detailHtml || '',
      visibility: values.visibility,
      departments: values.visibility === '按部门' ? values.departments ?? [] : [],
      customPeople: values.visibility === '自定义人群' ? values.customPeople ?? [] : [],
      visibilityMinSeniorityYears: undefined,
      importFileName: values.visibility === '导入人群' ? values.importFileName || '' : '',
      importedPeople: values.visibility === '导入人群' ? editing?.importedPeople ?? copySource?.importedPeople ?? [] : [],
      notifyOnPublish: Boolean(values.notifyOnPublish),
      signupStartAt: signup.signupStartAt,
      signupEndAt: editing?.signupClosedAt ? editing.signupEndAt : signup.signupEndAt,
      signupHoursBefore: signup.signupHoursBefore,
      signupClosedAt: editing?.signupClosedAt,
      signupEndAtBeforeClose: editing?.signupEndAtBeforeClose,
      signupSettings: [
        {
          type: editing?.signupSettings[0]?.type?.trim() || copySource?.signupSettings[0]?.type?.trim() || '个人报名',
          limit: values.signupTotalLimit,
          needAudit: values.needAudit,
          minSeniorityYears: values.hasSeniorityLimit ? values.minSeniorityYears : undefined,
        },
      ],
      signupFields: values.signupFields ?? defaultSignupFields(),
      itinerary: '',
      extraFeeRule: '',
      momentAuditEnabled: false,
      activityApprovalEnabled: publishOnCreate
        ? false
        : submit
          ? true
          : (editing?.activityApprovalEnabled ?? copySource?.activityApprovalEnabled ?? false),
      signupApprovalNodes: values.needAudit ? values.signupApprovalNodes ?? [] : [],
      signupPoints: values.signupPoints,
      firstCommentPoints: pointRulesForSave.firstCommentPointsMax,
      ratingPoints: pointRulesForSave.ratingPointsMax,
      firstMomentPoints: pointRulesForSave.firstMomentPointsMax,
      signupPointsEnabled: Boolean(values.signupPointsEnabled),
      firstCommentPointsEnabled: false,
      ratingPointsEnabled: false,
      firstMomentPointsEnabled: false,
      checkInEnabled: Boolean(values.checkInEnabled),
      checkInOpenMode: 'before_start',
      checkInOpenMinutesBefore: values.checkInOpenMinutesBefore ?? 30,
      checkInValidAfterStart: values.checkInValidAfterStart ?? 3,
      checkInValidAfterStartUnit: values.checkInValidAfterStartUnit ?? 'day',
      checkInDynamicQr: Boolean(values.checkInDynamicQr),
      checkInToken:
        schedule.scheduleType === 'once'
          ? editing?.checkInToken ||
            copySource?.checkInToken ||
            checkInTokenForSession({ id: CHECK_IN_ONCE_SESSION_ID })
          : undefined,
      auditStatus,
      publishStatus: publishOnCreate ? '已发布' : (editing?.publishStatus ?? '未发布'),
      activityStatus: editing?.activityStatus ?? '未开始',
      pinned: editing?.pinned ?? false,
      sortIndex: editing?.sortIndex ?? nextCustomSortIndex(getActivities()),
      createdAt: editing?.createdAt ?? nowText(),
      creator: editing?.creator ?? activityAdminSelf,
      publishedAt: publishOnCreate ? nowText() : (editing?.publishedAt ?? ''),
    };
    upsertActivity(activity);
    if (publishOnCreate) {
      message.success('已保存并发布');
    } else if (submit) {
      recordApprovalSubmit(activity.id, activity.organizer, nowText());
      message.success('已提交审批');
    } else {
      message.success(mode === 'edit' ? '活动已更新' : '活动已保存');
    }
    onBack();
  };

  const showSubmit =
    mode === 'create' ||
    canSubmitApproval({
      auditStatus: editing?.auditStatus ?? '待提交',
      activityApprovalEnabled: editing?.activityApprovalEnabled ?? false,
    });
  const submitLabel = mode === 'create' ? '保存并发布' : '提交审批';

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '活动' },
          { title: <Button type="link" className="breadcrumb-link" onClick={leave}>活动管理</Button> },
          { title },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">填写活动信息、报名规则和高级设置。封面与详情仅保存在本地演示数据中。</Typography.Text>
      </div>
      {editLockedReason ? <Alert type="warning" showIcon message={editLockedReason} /> : null}
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        disabled={Boolean(editLockedReason)}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        initialValues={initialValues}
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
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select options={categoryOptions} placeholder="请选择分类" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} className="form-2col">
            <Col xs={24} lg={12}>
              <Form.Item name="location" label="活动地点">
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="organizer" label="发起人" rules={[{ required: true, message: '请输入发起人' }]}>
                <Input placeholder="请输入发起人" maxLength={20} showCount />
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
          <Form.Item name="scheduleType" label="举办方式" rules={[{ required: true, message: '请选择举办方式' }]}>
            <Radio.Group disabled={mode === 'edit'} optionType="button">
              {(['once', 'recurring', 'series'] as const).map((item) => (
                <Radio.Button key={item} value={item}>
                  {activityScheduleTypeLabels[item]}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
          {scheduleType === 'once' || !scheduleType ? (
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
                <Form.Item
                  label={signupQuotaLabel(scheduleType)}
                  required
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="signupTotalLimit"
                      noStyle
                      rules={[{ required: true, message: `请输入${signupQuotaLabel(scheduleType)}` }]}
                    >
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button disabled>人</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          ) : null}
          {scheduleType === 'recurring' ? (
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
          {scheduleType === 'series' ? (
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
          {needsSessionPick(scheduleType) ? (
            <Row gutter={16} className="form-2col">
              <Col xs={24} lg={12}>
                <Form.Item label={signupQuotaLabel(scheduleType)} required>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="signupTotalLimit"
                      noStyle
                      rules={[{ required: true, message: `请输入${signupQuotaLabel(scheduleType)}` }]}
                    >
                      <InputNumber
                        min={1}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={signupQuotaPlaceholder(scheduleType)}
                      />
                    </Form.Item>
                    <Button disabled>人</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="signupStartAt"
                  label="报名开始"
                  rules={[{ required: true, message: '请选择报名开始时间' }]}
                >
                  <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item label="报名截止" required>
                  <Space.Compact style={{ width: '100%' }}>
                    <Button disabled>开场前</Button>
                    <Form.Item
                      name="signupHoursBefore"
                      noStyle
                      rules={[{ required: true, message: '请填写开场前小时数' }]}
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder={SIGNUP_HOURS_PLACEHOLDER}
                      />
                    </Form.Item>
                    <Button disabled>小时</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          ) : null}
          <Form.Item name="detailHtml" label="活动详情" rules={[{ required: true, message: '请填写活动详情' }]}>
            <RichTextField ariaLabel="活动详情" />
          </Form.Item>
        </Card>

        <Card title="可见范围" className="activity-settings-card">
          <Form.Item name="visibility" label="可见范围" rules={[{ required: true, message: '请选择可见范围' }]}>
            <Radio.Group options={optionsOf(['全员', '按部门', '自定义人群', '导入人群'])} />
          </Form.Item>
          {visibility === '按部门' && (
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
          )}
          {visibility === '自定义人群' && (
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
          )}
          {visibility === '导入人群' && (
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
          )}
          <Form.Item
            name="notifyOnPublish"
            label="发送消息通知"
            valuePropName="checked"
            extra="活动发布后自动发送消息通知"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Card>

        <Card title="报名分组设置" className="activity-settings-card">
          <Form.Item
            label="是否设置"
            extra="可不设置。设置后员工报名时选择分组，各组人数合计须等于报名总人数"
          >
            <Switch
              checked={Boolean(groupSignupField)}
              checkedChildren="已设置"
              unCheckedChildren="不设置"
              onChange={(checked) => {
                form.setFieldValue(
                  'signupFields',
                  setGroupSignupEnabled(form.getFieldValue('signupFields') ?? defaultSignupFields(), checked),
                );
              }}
            />
          </Form.Item>
          {groupSignupField ? (
            <Form.Item label="分组">
              <SignupGroupsEditor
                groups={groupSignupField.groups ?? []}
                signupTotalLimit={typeof signupTotalLimit === 'number' ? signupTotalLimit : undefined}
                onChange={(groups) => {
                  form.setFieldValue(
                    'signupFields',
                    setSignupFieldGroups(
                      form.getFieldValue('signupFields') ?? defaultSignupFields(),
                      groupSignupField.key,
                      groups,
                    ),
                  );
                }}
              />
            </Form.Item>
          ) : null}
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
                              rules={
                                hasSeniorityLimit ? [{ required: true, message: '请输入司龄年限' }] : []
                              }
                            >
                              <InputNumber
                                disabled={!hasSeniorityLimit}
                                min={0}
                                precision={0}
                                placeholder="请输入"
                              />
                            </Form.Item>
                            <Button disabled>年</Button>
                          </Space.Compact>
                        </Flex>
                      </Form.Item>
                      <Form.Item
                        label="活动积分"
                        extra={`规则范围 ${pointRules.signupPointsMin}～${pointRules.signupPointsMax}`}
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

                    <Card title="报名信息收集" size="small">
                      <Form.Item
                        name="signupFields"
                        label="填写项"
                        dependencies={['signupTotalLimit']}
                        rules={[
                          {
                            validator: async (_, value: SignupField[]) => {
                              const error = validateSignupFields(value ?? [], {
                                signupTotalLimit: form.getFieldValue('signupTotalLimit'),
                              });
                              if (!error) return;
                              // 与「报名分组设置」下方提示重复，不在 Form.Item 再展示
                              if (error.startsWith('各组人数合计要等于报名总人数')) return;
                              throw new Error(error);
                            },
                          },
                        ]}
                      >
                        <SignupFieldsEditor
                          signupTotalLimit={typeof signupTotalLimit === 'number' ? signupTotalLimit : undefined}
                        />
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
            <Button aria-label="取消" disabled={false} onClick={leave}>
              取消
            </Button>
            {editLockedReason ? null : (
              <>
                <Button
                  type={showSubmit ? 'default' : 'primary'}
                  aria-label="保存"
                  onClick={() => void save(false)}
                >
                  保存
                </Button>
                {showSubmit ? (
                  <Button type="primary" aria-label={submitLabel} onClick={() => void save(true)}>
                    {submitLabel}
                  </Button>
                ) : null}
              </>
            )}
          </Space>
        </div>
      </Form>
    </div>
  );
}
