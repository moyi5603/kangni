import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
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
import dayjs, { type Dayjs } from 'dayjs';
import { RichTextField } from '../components/RichTextField';
import {
  activityTypes,
  emptySignupSetting,
  isRecreationActivity,
  canSubmitApproval,
  orgDepartmentTree,
  orgPeoplePickerTree,
  type Activity,
  type ActivityType,
  type SignupSetting,
  type Visibility,
} from '../model/activity';
import { getActivity, upsertActivity } from '../model/activityStore';
import { recordApprovalSubmit } from '../model/related';
import { useCategories } from '../model/categoryStore';
import { useTags } from '../model/tagStore';

type ActivityFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
};

type FormValues = {
  coverUrl: string;
  title: string;
  type: ActivityType;
  category: string;
  tags: string[];
  startAt: Dayjs;
  endAt: Dayjs;
  location: string;
  organizer: string;
  phone: string;
  detailHtml: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  visibilityMinSeniorityYears?: number;
  importFileName: string;
  signupStartAt: Dayjs;
  signupEndAt: Dayjs;
  signupSettings: SignupSetting[];
  itinerary: string;
  extraFeeRule: string;
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function richTextRequired(message: string) {
  return {
    validator(_: unknown, value: string) {
      const text = (value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (text) return Promise.resolve();
      return Promise.reject(new Error(message));
    },
  };
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

export function ActivityFormPage({ mode, recordId, onBack }: ActivityFormPageProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const editing = mode === 'edit' ? getActivity(Number(recordId)) : undefined;
  const categoryRecords = useCategories();
  const categoryOptions = useMemo(
    () =>
      categoryRecords
        .filter((item) => item.status === '启用' || item.name === editing?.category)
        .map((item) => ({ value: item.name, label: item.name })),
    [categoryRecords, editing],
  );
  const tagRecords = useTags();
  const tagOptions = useMemo(
    () =>
      tagRecords
        .filter((tag) => tag.status === '启用' || (editing?.tags ?? []).includes(tag.name))
        .map((tag) => ({ value: tag.name, label: tag.name })),
    [tagRecords, editing],
  );
  const visibility = Form.useWatch('visibility', form);
  const activityType = Form.useWatch('type', form);
  const title = mode === 'edit' ? '编辑活动' : '新建活动';
  const isRecreation = isRecreationActivity(activityType ?? editing?.type ?? '公司活动');

  const initialValues = useMemo<Partial<FormValues>>(
    () =>
      editing
        ? {
            coverUrl: editing.coverUrl,
            title: editing.title,
            type: editing.type,
            category: editing.category,
            tags: editing.tags,
            startAt: dayjs(editing.startAt),
            endAt: dayjs(editing.endAt),
            location: editing.location,
            organizer: editing.organizer,
            phone: editing.phone,
            detailHtml: editing.detailHtml,
            visibility: editing.visibility,
            departments: editing.departments,
            customPeople: editing.customPeople,
            visibilityMinSeniorityYears: editing.visibilityMinSeniorityYears,
            importFileName: editing.importFileName,
            signupStartAt: dayjs(editing.signupStartAt),
            signupEndAt: dayjs(editing.signupEndAt),
            signupSettings: editing.signupSettings,
            itinerary: editing.itinerary,
            extraFeeRule: editing.extraFeeRule,
          }
        : {
            type: '公司活动',
            visibility: '全员',
            tags: [],
            departments: [],
            customPeople: [],
            importFileName: '',
            detailHtml: '',
            coverUrl: '',
            signupSettings: [emptySignupSetting()],
            itinerary: '',
            extraFeeRule: '',
          },
    [editing],
  );

  useEffect(() => {
    setCoverList(toFileList(editing?.coverUrl ?? ''));
    setImportList(editing?.importFileName ? [{ uid: '-2', name: editing.importFileName, status: 'done' }] : []);
  }, [editing]);

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
    const values = await form.validateFields();
    const recreation = isRecreationActivity(values.type);
    const currentStatus = editing?.auditStatus ?? '待提交';
    const activity: Activity = {
      id: editing?.id ?? Date.now(),
      coverUrl: values.coverUrl || '',
      title: values.title,
      type: values.type,
      category: values.category,
      tags: values.tags ?? [],
      startAt: values.startAt.format('YYYY-MM-DD HH:mm'),
      endAt: values.endAt.format('YYYY-MM-DD HH:mm'),
      location: values.location,
      organizer: values.organizer,
      phone: values.phone,
      detailHtml: values.detailHtml || '',
      visibility: values.visibility,
      departments: values.visibility === '按部门' ? values.departments ?? [] : [],
      customPeople: values.visibility === '自定义人群' ? values.customPeople ?? [] : [],
      visibilityMinSeniorityYears: values.visibility === '自定义人群' ? values.visibilityMinSeniorityYears : undefined,
      importFileName: values.visibility === '导入人群' ? values.importFileName || '' : '',
      importedPeople: values.visibility === '导入人群' ? editing?.importedPeople ?? [] : [],
      signupStartAt: values.signupStartAt.format('YYYY-MM-DD HH:mm'),
      signupEndAt: values.signupEndAt.format('YYYY-MM-DD HH:mm'),
      signupSettings: recreation
        ? values.signupSettings
        : values.signupSettings.map((item) => ({ type: item.type, limit: item.limit, needAudit: item.needAudit })),
      itinerary: recreation ? values.itinerary : '',
      extraFeeRule: recreation ? values.extraFeeRule : '',
      auditStatus: submit ? '待审核' : currentStatus,
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

  const showSubmit = canSubmitApproval({ auditStatus: editing?.auditStatus ?? '待提交' });

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
        <Typography.Text type="secondary">填写活动信息、可见范围和报名规则。封面与详情仅保存在本地演示数据中。</Typography.Text>
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
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Radio.Group options={optionsOf(activityTypes)} />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={categoryOptions} placeholder="请选择分类" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="multiple" options={tagOptions} placeholder="请选择标签" />
          </Form.Item>
          <Form.Item name="startAt" label="活动开始时间" rules={[{ required: true, message: '请选择活动开始时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endAt"
            label="活动结束时间"
            dependencies={['startAt']}
            rules={[
              { required: true, message: '请选择活动结束时间' },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs) {
                  const start = getFieldValue('startAt') as Dayjs | undefined;
                  if (!value || !start || !value.isBefore(start)) return Promise.resolve();
                  return Promise.reject(new Error('结束时间不得早于开始时间'));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="活动地点" rules={[{ required: true, message: '请输入活动地点' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="organizer" label="发起人" rules={[{ required: true, message: '请选择发起人' }]}>
            <TreeSelect
              treeData={orgPeoplePickerTree}
              treeDefaultExpandAll
              showSearch={{ treeNodeFilterProp: 'title' }}
              allowClear
              placeholder="请按组织架构选择发起人"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1\d{10}$/, message: '请输入 11 位手机号' },
            ]}
          >
            <Input placeholder="例如 13800001111" />
          </Form.Item>
          <Form.Item name="detailHtml" label="活动详情" rules={[{ required: true, message: '请填写活动详情' }]}>
            <RichTextField ariaLabel="活动详情" />
          </Form.Item>
          {isRecreation && (
            <>
              <Form.Item name="itinerary" label="行程安排" rules={[richTextRequired('请填写行程安排')]}>
                <RichTextField ariaLabel="行程安排" placeholder="请按天填写行程" />
              </Form.Item>
              <Form.Item name="extraFeeRule" label="额外费用规则" rules={[richTextRequired('请填写额外费用规则')]}>
                <RichTextField ariaLabel="额外费用规则" placeholder="请说明额外费用及带家属费用…" />
              </Form.Item>
            </>
          )}
        </Card>

        <Card title="可见范围">
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
            <>
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
              <Form.Item label="可见司龄" required>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="visibilityMinSeniorityYears"
                    noStyle
                    rules={[{ required: true, message: '请输入可见司龄' }]}
                  >
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="大于等于" />
                  </Form.Item>
                  <Button disabled>年</Button>
                </Space.Compact>
              </Form.Item>
            </>
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
        </Card>

        <Card title="报名设置">
          <Form.Item name="signupStartAt" label="报名开始时间" rules={[{ required: true, message: '请选择报名开始时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="signupEndAt"
            label="报名结束时间"
            dependencies={['signupStartAt']}
            rules={[
              { required: true, message: '请选择报名结束时间' },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs) {
                  const start = getFieldValue('signupStartAt') as Dayjs | undefined;
                  if (!value || !start || !value.isBefore(start)) return Promise.resolve();
                  return Promise.reject(new Error('报名结束时间不得早于开始时间'));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.List
            name="signupSettings"
            rules={[
              {
                validator: async (_, value: SignupSetting[]) => {
                  if (!value?.length) throw new Error('请至少添加一条报名设置');
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small" className="signup-setting-card" title={`报名设置 ${index + 1}`}>
                    <Form.Item
                      name={[field.name, 'type']}
                      label="报名类型"
                      rules={[
                        { required: true, whitespace: true, message: '请输入报名类型' },
                        { max: 10, message: '报名类型不超过 10 个字' },
                      ]}
                    >
                      <Input maxLength={10} showCount placeholder="请输入报名类型名称" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'limit']} label="报名人数" rules={[{ required: true, message: '请输入报名人数' }]}>
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    {isRecreation && (
                      <Form.Item label="司龄要求" required>
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item
                            name={[field.name, 'minSeniorityYears']}
                            noStyle
                            rules={[{ required: true, message: '请输入司龄要求' }]}
                          >
                            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="大于等于" />
                          </Form.Item>
                          <Button disabled>年</Button>
                        </Space.Compact>
                      </Form.Item>
                    )}
                    <Form.Item name={[field.name, 'needAudit']} label="是否审核" valuePropName="checked">
                      <Switch checkedChildren="需要审核" unCheckedChildren="无需审核" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button danger onClick={() => remove(field.name)}>
                        删除此报名设置
                      </Button>
                    )}
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptySignupSetting())}>
                    添加报名设置
                  </Button>
                </Form.Item>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Card>

        <div className="sticky-form-actions">
          <Space>
            {showSubmit ? (
              <Button type="primary" onClick={() => void save(true)}>
                提交审批
              </Button>
            ) : null}
            <Button type={showSubmit ? 'default' : 'primary'} onClick={() => void save(false)}>
              保存
            </Button>
            <Button onClick={leave}>取消</Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
