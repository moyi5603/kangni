import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Collapse,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import { RichTextField } from '../components/RichTextField';
import { ActivityClientPreviewModal } from '../components/ActivityClientPreviewModal';
import { SignupApprovalNodesEditor } from '../components/SignupApprovalNodesEditor';
import { SignupFieldsEditor } from '../components/SignupFieldsEditor';
import {
  activityTypes,
  canSubmitApproval,
  orgDepartmentTree,
  orgPeoplePickerTree,
  type Activity,
  type AuditStatus,
  type SignupField,
  type Visibility,
} from '../model/activity';
import { defaultSignupFields, validateSignupFields } from '../model/signupFields';
import {
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
  type DateTimeRange,
} from '../model/activityForm';
import { getActivity, upsertActivity } from '../model/activityStore';
import {
  defaultActivityPointValues,
  normalizeActivityPointRules,
  validateActivityPointValues,
} from '../model/activityPointRules';
import { getActivityPointRules, useActivityPointRules } from '../model/activityPointRulesStore';
import { recordApprovalSubmit } from '../model/related';
import { useCategories } from '../model/categoryStore';
import type { ApprovalNode } from '../model/rules';

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
  location: string;
  signupTotalLimit?: number;
  needAudit: boolean;
  hasSeniorityLimit: boolean;
  minSeniorityYears?: number;
  momentAuditEnabled: boolean;
  activityApprovalEnabled: boolean;
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
  phone: string;
  detailHtml: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  visibilityMinSeniorityYears?: number;
  importFileName: string;
  notifyOnPublish: boolean;
  signupFields: SignupField[];
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

function buildPreviewActivity(
  values: FormValues,
  source?: Activity,
): Activity {
  const activityTime = formatDateTimeRange(
    values.activityRange?.[0] && values.activityRange[1] ? values.activityRange : fallbackRange(),
  );
  const signupTime = formatDateTimeRange(
    values.signupRange?.[0] && values.signupRange[1] ? values.signupRange : fallbackRange(),
  );
  const signupApprovalOn = Boolean(values.needAudit && values.activityApprovalEnabled);
  return {
    id: source?.id ?? -1,
    coverUrl: values.coverUrl || '',
    title: values.title?.trim() || '未命名活动',
    type: source?.type ?? activityTypes[0],
    category: values.category || '文化',
    tags: [],
    startAt: activityTime.startAt,
    endAt: activityTime.endAt,
    location: values.location || '',
    organizer: values.organizer || '',
    phone: values.phone?.trim() || '',
    detailHtml: values.detailHtml || '<p>活动详情待补充。</p>',
    visibility: values.visibility ?? '全员',
    departments: values.visibility === '按部门' ? values.departments ?? [] : [],
    customPeople: values.visibility === '自定义人群' ? values.customPeople ?? [] : [],
    visibilityMinSeniorityYears: undefined,
    importFileName: values.visibility === '导入人群' ? values.importFileName || '' : '',
    importedPeople: values.visibility === '导入人群' ? source?.importedPeople ?? [] : [],
    notifyOnPublish: Boolean(values.notifyOnPublish),
    signupStartAt: signupTime.startAt,
    signupEndAt: signupTime.endAt,
    signupSettings: [
      {
        type: source?.signupSettings[0]?.type?.trim() || '个人报名',
        limit: values.signupTotalLimit,
        needAudit: values.needAudit,
        minSeniorityYears: values.hasSeniorityLimit ? values.minSeniorityYears : undefined,
      },
    ],
    signupFields: values.signupFields ?? defaultSignupFields(),
    itinerary: '',
    extraFeeRule: '',
    momentAuditEnabled: Boolean(values.momentAuditEnabled),
    activityApprovalEnabled: signupApprovalOn,
    signupApprovalNodes: signupApprovalOn ? values.signupApprovalNodes ?? [] : [],
    signupPoints: values.signupPoints,
    firstCommentPoints: values.firstCommentPoints,
    ratingPoints: values.ratingPoints,
    firstMomentPoints: values.firstMomentPoints,
    signupPointsEnabled: Boolean(values.signupPointsEnabled),
    firstCommentPointsEnabled: Boolean(values.firstCommentPointsEnabled),
    ratingPointsEnabled: Boolean(values.ratingPointsEnabled),
    firstMomentPointsEnabled: Boolean(values.firstMomentPointsEnabled),
    auditStatus: source?.auditStatus ?? '无需审核',
    publishStatus: source?.publishStatus ?? '未发布',
    activityStatus: source?.activityStatus ?? '未开始',
    pinned: source?.pinned ?? false,
    createdAt: source?.createdAt ?? nowText(),
    publishedAt: source?.publishedAt ?? '',
  };
}

function activityToFormValues(activity: Activity): Partial<FormValues> {
  const primary = activity.signupSettings[0];
  return {
    coverUrl: activity.coverUrl,
    title: activity.title,
    category: activity.category,
    activityRange: toDateTimeRange(activity.startAt, activity.endAt),
    signupRange: toDateTimeRange(activity.signupStartAt, activity.signupEndAt),
    location: activity.location,
    signupTotalLimit: activity.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0) || undefined,
    needAudit: primary?.needAudit ?? true,
    hasSeniorityLimit: primary?.minSeniorityYears != null,
    minSeniorityYears: primary?.minSeniorityYears,
    momentAuditEnabled: activity.momentAuditEnabled,
    activityApprovalEnabled: activity.activityApprovalEnabled,
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
    phone: activity.phone,
    detailHtml: activity.detailHtml,
    visibility: activity.visibility,
    departments: activity.departments,
    customPeople: activity.customPeople,
    visibilityMinSeniorityYears: activity.visibilityMinSeniorityYears,
    importFileName: activity.importFileName,
    notifyOnPublish: Boolean(activity.notifyOnPublish),
    signupFields: activity.signupFields,
  };
}

export function ActivityFormPage({ mode, recordId, onBack }: ActivityFormPageProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);
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
  const hasSeniorityLimit = Form.useWatch('hasSeniorityLimit', form);
  const needAudit = Form.useWatch('needAudit', form);
  const activityApprovalEnabled = Form.useWatch('activityApprovalEnabled', form);
  const signupTotalLimit = Form.useWatch('signupTotalLimit', form);
  const signupPointsEnabled = Form.useWatch('signupPointsEnabled', form);
  const firstCommentPointsEnabled = Form.useWatch('firstCommentPointsEnabled', form);
  const ratingPointsEnabled = Form.useWatch('ratingPointsEnabled', form);
  const firstMomentPointsEnabled = Form.useWatch('firstMomentPointsEnabled', form);
  const title = mode === 'edit' ? '编辑活动' : '新建活动';

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
              needAudit: true,
              hasSeniorityLimit: false,
              momentAuditEnabled: false,
              activityApprovalEnabled: false,
              signupApprovalNodes: [],
              signupFields: defaultSignupFields(),
              ...defaultActivityPointValues(getActivityPointRules()),
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

  const openPreview = () => {
    const values = form.getFieldsValue();
    if (!String(values.title ?? '').trim()) {
      message.warning('请先填写活动标题');
      return;
    }
    setPreviewActivity(buildPreviewActivity(values, editing ?? copySource));
    setPreviewOpen(true);
  };

  const save = async (submit = false) => {
    const values = await form.validateFields();
    const groupSumHint = validateSignupFields(values.signupFields ?? [], {
      signupTotalLimit: values.signupTotalLimit,
    });
    // 分组人数不符时，提示只保留「分组选择」下方文案，此处仅拦截保存
    if (groupSumHint?.startsWith('各组人数合计要等于报名总人数')) {
      return;
    }
    const pointError = validateActivityPointValues(
      {
        signupPointsEnabled: Boolean(values.signupPointsEnabled),
        firstCommentPointsEnabled: Boolean(values.firstCommentPointsEnabled),
        ratingPointsEnabled: Boolean(values.ratingPointsEnabled),
        firstMomentPointsEnabled: Boolean(values.firstMomentPointsEnabled),
        signupPoints: values.signupPoints,
        firstCommentPoints: values.firstCommentPoints,
        ratingPoints: values.ratingPoints,
        firstMomentPoints: values.firstMomentPoints,
      },
      getActivityPointRules(),
    );
    if (pointError) {
      message.error(pointError);
      return;
    }
    const resolvedType = editing?.type ?? copySource?.type ?? activityTypes[0];
    if (!values.activityRange || !values.signupRange) {
      throw new Error('时间范围未填写完整');
    }
    const activityTime = formatDateTimeRange(values.activityRange);
    const signupTime = formatDateTimeRange(values.signupRange);
    const signupApprovalOn = Boolean(values.needAudit && values.activityApprovalEnabled);
    const currentStatus = editing?.auditStatus ?? '无需审核';
    const auditStatus: AuditStatus = submit ? '待审核' : currentStatus;
    const activity: Activity = {
      id: editing?.id ?? Date.now(),
      coverUrl: values.coverUrl || '',
      title: values.title,
      type: resolvedType,
      category: values.category,
      tags: [],
      startAt: activityTime.startAt,
      endAt: activityTime.endAt,
      location: values.location,
      organizer: values.organizer,
      phone: values.phone?.trim() || '',
      detailHtml: values.detailHtml || '',
      visibility: values.visibility,
      departments: values.visibility === '按部门' ? values.departments ?? [] : [],
      customPeople: values.visibility === '自定义人群' ? values.customPeople ?? [] : [],
      visibilityMinSeniorityYears: undefined,
      importFileName: values.visibility === '导入人群' ? values.importFileName || '' : '',
      importedPeople: values.visibility === '导入人群' ? editing?.importedPeople ?? copySource?.importedPeople ?? [] : [],
      notifyOnPublish: Boolean(values.notifyOnPublish),
      signupStartAt: signupTime.startAt,
      signupEndAt: signupTime.endAt,
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
      momentAuditEnabled: Boolean(values.momentAuditEnabled),
      activityApprovalEnabled: signupApprovalOn,
      signupApprovalNodes: signupApprovalOn ? values.signupApprovalNodes ?? [] : [],
      signupPoints: values.signupPoints,
      firstCommentPoints: values.firstCommentPoints,
      ratingPoints: values.ratingPoints,
      firstMomentPoints: values.firstMomentPoints,
      signupPointsEnabled: Boolean(values.signupPointsEnabled),
      firstCommentPointsEnabled: Boolean(values.firstCommentPointsEnabled),
      ratingPointsEnabled: Boolean(values.ratingPointsEnabled),
      firstMomentPointsEnabled: Boolean(values.firstMomentPointsEnabled),
      auditStatus,
      publishStatus: editing?.publishStatus ?? '未发布',
      activityStatus: editing?.activityStatus ?? '未开始',
      pinned: editing?.pinned ?? false,
      createdAt: editing?.createdAt ?? nowText(),
      publishedAt: editing?.publishedAt ?? '',
    };
    upsertActivity(activity);
    if (submit) {
      recordApprovalSubmit(activity.id, activity.organizer, nowText());
      message.success('已提交审批');
    } else {
      message.success(mode === 'edit' ? '活动已更新' : '活动已保存');
    }
    onBack();
  };

  const showSubmit = canSubmitApproval({
    auditStatus: editing?.auditStatus ?? '待提交',
    activityApprovalEnabled: editing?.activityApprovalEnabled ?? false,
  });

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
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">填写活动信息、报名规则和高级设置。封面与详情仅保存在本地演示数据中。</Typography.Text>
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
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={categoryOptions} placeholder="请选择分类" />
          </Form.Item>
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
          <Form.Item name="location" label="活动地点" rules={[{ required: true, message: '请输入活动地点' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="signupTotalLimit"
            label="报名总人数"
            rules={[{ required: true, message: '请输入报名总人数' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} addonAfter="人" />
          </Form.Item>
          <Form.Item name="organizer" label="发起人" rules={[{ required: true, message: '请输入发起人' }]}>
            <Input placeholder="请输入发起人" maxLength={20} showCount />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              {
                validator: async (_, value: string) => {
                  const phone = (value ?? '').trim();
                  if (!phone) return;
                  if (!/^1\d{10}$/.test(phone)) throw new Error('请输入 11 位手机号');
                },
              },
            ]}
          >
            <Input placeholder="选填，例如 13800001111" allowClear />
          </Form.Item>
          <Form.Item name="detailHtml" label="活动详情" rules={[{ required: true, message: '请填写活动详情' }]}>
            <RichTextField ariaLabel="活动详情" />
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
                    <Card title="可见范围" size="small" className="activity-settings-card">
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
                        label="是否发送消息通知"
                        valuePropName="checked"
                        extra="活动发布后自动发送消息通知"
                      >
                        <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                      </Form.Item>
                    </Card>
                    <Card title="活动设置" size="small" className="activity-settings-card">
                      <Form.Item name="needAudit" label="是否审核报名" valuePropName="checked">
                        <Switch
                          checkedChildren="需要审核"
                          unCheckedChildren="无需审核"
                          onChange={(checked) => {
                            if (!checked) {
                              form.setFieldsValue({ activityApprovalEnabled: false, signupApprovalNodes: [] });
                            }
                          }}
                        />
                      </Form.Item>
                      {needAudit ? (
                        <>
                          <Form.Item
                            name="activityApprovalEnabled"
                            label="是否开启报名审批流"
                            valuePropName="checked"
                            extra={
                              activityApprovalEnabled
                                ? undefined
                                : '未开启时，由管理员进行审核，开启后可设置审批流节点'
                            }
                          >
                            <Switch
                              checkedChildren="开启"
                              unCheckedChildren="关闭"
                              onChange={(checked) => {
                                if (!checked) form.setFieldValue('signupApprovalNodes', []);
                              }}
                            />
                          </Form.Item>
                          {activityApprovalEnabled ? (
                            <Form.Item name="signupApprovalNodes" label="审批流节点">
                              <SignupApprovalNodesEditor />
                            </Form.Item>
                          ) : null}
                        </>
                      ) : null}
                      <Form.Item name="hasSeniorityLimit" label="报名是否有司龄限制" valuePropName="checked">
                        <Switch checkedChildren="有限制" unCheckedChildren="无限制" />
                      </Form.Item>
                      {hasSeniorityLimit ? (
                        <Form.Item label="司龄要满" required>
                          <Space.Compact style={{ width: '100%' }}>
                            <Form.Item
                              name="minSeniorityYears"
                              noStyle
                              rules={[{ required: true, message: '请输入司龄年限' }]}
                            >
                              <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="请输入" />
                            </Form.Item>
                            <Button disabled>年</Button>
                          </Space.Compact>
                        </Form.Item>
                      ) : null}
                      <Form.Item
                        name="momentAuditEnabled"
                        label="是否开启精彩瞬间审核"
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                      </Form.Item>
                    </Card>

                    <Card title="活动积分" size="small" className="activity-settings-card">
                      <Form.Item
                        label="报名活动可得积分"
                        extra={signupPointsEnabled ? `规则范围 ${pointRules.signupPointsMin}～${pointRules.signupPointsMax}` : undefined}
                      >
                        <Flex align="center" gap={12}>
                          <Form.Item name="signupPointsEnabled" valuePropName="checked" noStyle>
                            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                          </Form.Item>
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
                              style={{ width: 160 }}
                              addonAfter="积分"
                            />
                          </Form.Item>
                        </Flex>
                      </Form.Item>
                      <Form.Item label="活动首评可得积分" extra={firstCommentPointsEnabled ? `最多 ${pointRules.firstCommentPointsMax}` : undefined}>
                        <Flex align="center" gap={12}>
                          <Form.Item name="firstCommentPointsEnabled" valuePropName="checked" noStyle>
                            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                          </Form.Item>
                          <Form.Item
                            name="firstCommentPoints"
                            noStyle
                            rules={
                              firstCommentPointsEnabled
                                ? [
                                    { required: true, message: '请输入首评积分' },
                                    {
                                      type: 'integer',
                                      min: 0,
                                      max: pointRules.firstCommentPointsMax,
                                      message: `不能超过 ${pointRules.firstCommentPointsMax}`,
                                    },
                                  ]
                                : []
                            }
                          >
                            <InputNumber
                              disabled={!firstCommentPointsEnabled}
                              min={0}
                              max={pointRules.firstCommentPointsMax}
                              precision={0}
                              style={{ width: 160 }}
                              addonAfter="积分"
                            />
                          </Form.Item>
                        </Flex>
                      </Form.Item>
                      <Form.Item label="活动打分可得积分" extra={ratingPointsEnabled ? `最多 ${pointRules.ratingPointsMax}` : undefined}>
                        <Flex align="center" gap={12}>
                          <Form.Item name="ratingPointsEnabled" valuePropName="checked" noStyle>
                            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                          </Form.Item>
                          <Form.Item
                            name="ratingPoints"
                            noStyle
                            rules={
                              ratingPointsEnabled
                                ? [
                                    { required: true, message: '请输入打分积分' },
                                    {
                                      type: 'integer',
                                      min: 0,
                                      max: pointRules.ratingPointsMax,
                                      message: `不能超过 ${pointRules.ratingPointsMax}`,
                                    },
                                  ]
                                : []
                            }
                          >
                            <InputNumber
                              disabled={!ratingPointsEnabled}
                              min={0}
                              max={pointRules.ratingPointsMax}
                              precision={0}
                              style={{ width: 160 }}
                              addonAfter="积分"
                            />
                          </Form.Item>
                        </Flex>
                      </Form.Item>
                      <Form.Item
                        label="首次发布精彩瞬间可得积分"
                        extra={firstMomentPointsEnabled ? `最多 ${pointRules.firstMomentPointsMax}` : undefined}
                      >
                        <Flex align="center" gap={12}>
                          <Form.Item name="firstMomentPointsEnabled" valuePropName="checked" noStyle>
                            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                          </Form.Item>
                          <Form.Item
                            name="firstMomentPoints"
                            noStyle
                            rules={
                              firstMomentPointsEnabled
                                ? [
                                    { required: true, message: '请输入精彩瞬间积分' },
                                    {
                                      type: 'integer',
                                      min: 0,
                                      max: pointRules.firstMomentPointsMax,
                                      message: `不能超过 ${pointRules.firstMomentPointsMax}`,
                                    },
                                  ]
                                : []
                            }
                          >
                            <InputNumber
                              disabled={!firstMomentPointsEnabled}
                              min={0}
                              max={pointRules.firstMomentPointsMax}
                              precision={0}
                              style={{ width: 160 }}
                              addonAfter="积分"
                            />
                          </Form.Item>
                        </Flex>
                      </Form.Item>
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
                              // 与「分组选择」下方提示重复，不在 Form.Item 再展示
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
            {showSubmit ? (
              <Button type="primary" onClick={() => void save(true)}>
                提交审批
              </Button>
            ) : null}
            <Button onClick={openPreview}>预览</Button>
            <Button type={showSubmit ? 'default' : 'primary'} onClick={() => void save(false)}>
              保存
            </Button>
            <Button onClick={leave}>取消</Button>
          </Space>
        </div>
      </Form>
      <ActivityClientPreviewModal
        activity={previewActivity}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
