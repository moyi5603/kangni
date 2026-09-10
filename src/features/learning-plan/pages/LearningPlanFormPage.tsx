import { useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Tabs,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  MAP_SKINS,
  validatePlanBasics,
  type AssignMode,
  type DailyContent,
  type LearningPlan,
  type MapSkinId,
  type ProgressMode,
  type QuizScope,
} from '../model/learningPlan';
import { getLearningPlanStore } from '../model/learningPlanStore';

const { RangePicker } = DatePicker;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

const ASSIGN_OPTIONS: { value: AssignMode; label: string }[] = [
  { value: 'once', label: '统一窗口' },
  { value: 'rolling', label: '滚动周期' },
];

const PROGRESS_OPTIONS: { value: ProgressMode; label: string }[] = [
  { value: 'accumulate', label: '累计' },
  { value: 'daily', label: '每日重置' },
];

const DAILY_CONTENT_OPTIONS: { value: DailyContent; label: string }[] = [
  { value: 'fixed', label: '内容固定' },
  { value: 'redraw', label: '随机习题按日换种子' },
];

const QUIZ_SCOPE_OPTIONS: { value: QuizScope; label: string }[] = [
  { value: 'cohort', label: '全员同题' },
  { value: 'personal', label: '每人异题' },
];

const SKIN_OPTIONS = MAP_SKINS.map((item) => ({ value: item.id, label: item.label }));

const PROTOTYPE_TAB_HINT = '沿用现网能力，本轮原型不配。';

type FormValues = {
  name: string;
  timeRange: [Dayjs, Dayjs];
  assignMode: AssignMode;
  progressMode: ProgressMode;
  dailyContent?: DailyContent;
  quizScope: QuizScope;
  quizPassRate: number;
  mapSkinId: MapSkinId;
};

type LearningPlanFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: (id: number) => void;
};

function nextPlanId(): number {
  const ids = getLearningPlanStore().getSnapshot().plans.map((item) => item.id);
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

export function LearningPlanFormPage({ mode, recordId, onBack, onSaved }: LearningPlanFormPageProps) {
  const { message } = App.useApp();
  const editing = mode === 'edit' ? getLearningPlanStore().getPlan(Number(recordId)) : undefined;
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const progressMode = Form.useWatch('progressMode', form) ?? editing?.progressMode ?? 'accumulate';
  const gatesLocked = editing?.status === 'published';
  const showPublish = (editing?.status ?? 'draft') === 'draft';

  const initialValues = useMemo<Partial<FormValues>>(
    () => ({
      name: editing?.name,
      timeRange: editing
        ? [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)]
        : undefined,
      assignMode: editing?.assignMode ?? 'once',
      progressMode: editing?.progressMode ?? 'accumulate',
      dailyContent: editing?.dailyContent ?? 'fixed',
      quizScope: editing?.quizScope ?? 'cohort',
      quizPassRate: editing?.quizPassRate ?? 60,
      mapSkinId: editing?.mapSkinId ?? 'island',
    }),
    [editing],
  );

  const pageTitle = mode === 'create' ? '新建计划' : '编辑计划';

  const persist = async (andPublish: boolean) => {
    const values = await form.validateFields();
    const name = values.name.trim();
    const dailyContent = values.progressMode === 'daily' ? values.dailyContent : undefined;
    const basicsError = validatePlanBasics({
      name,
      quizPassRate: values.quizPassRate,
      progressMode: values.progressMode,
      dailyContent,
    });
    if (basicsError) {
      message.error(basicsError);
      return;
    }
    setSubmitting(true);
    try {
      const id = editing?.id ?? nextPlanId();
      const record: LearningPlan = {
        id,
        name,
        assignMode: values.assignMode,
        progressMode: values.progressMode,
        dailyContent,
        quizScope: values.quizScope,
        quizPassRate: values.quizPassRate,
        mapSkinId: values.mapSkinId,
        overtimeAllowed: editing?.overtimeAllowed ?? true,
        taskSync: editing?.taskSync ?? true,
        progressSync: editing?.progressSync ?? true,
        status: editing?.status ?? 'draft',
        startAt: values.timeRange[0].format(TIME_FORMAT),
        endAt: values.timeRange[1].format(TIME_FORMAT),
        stages: editing?.stages ?? [],
      };
      const store = getLearningPlanStore();
      store.upsertPlan(record);
      if (andPublish && record.status === 'draft') {
        store.publish(id);
      }
      message.success(andPublish ? '已发布' : mode === 'create' ? '已创建' : '已保存');
      onSaved(id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '学习计划' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                计划管理
              </Button>
            ),
          },
          { title: pageTitle },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {pageTitle}
        </Typography.Title>
        <Typography.Text type="secondary">
          配置学习计划的指派模式、进度策略、闯关皮肤与任务。
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
      >
        <Tabs
          items={[
            {
              key: 'basics',
              label: '基本信息',
              children: (
                <Card title="基本信息">
                  <Form.Item
                    name="name"
                    label="名称"
                    rules={[{ required: true, message: '请填写名称' }]}
                  >
                    <Input placeholder="请输入计划名称" style={{ maxWidth: 480 }} />
                  </Form.Item>
                  <Form.Item
                    name="timeRange"
                    label="起止时间"
                    rules={[{ required: true, message: '请选择开始与结束时间' }]}
                  >
                    <RangePicker
                      showTime={{ format: 'HH:mm' }}
                      format={TIME_FORMAT}
                      placeholder={['开始', '结束']}
                    />
                  </Form.Item>
                  <Form.Item
                    name="assignMode"
                    label="指派模式"
                    rules={[{ required: true, message: '请选择指派模式' }]}
                  >
                    <Radio.Group options={ASSIGN_OPTIONS} disabled={gatesLocked} />
                  </Form.Item>
                  <Form.Item
                    name="progressMode"
                    label="进度策略"
                    extra="每日只清习题闯过，课程和考试进度保留"
                    rules={[{ required: true, message: '请选择进度策略' }]}
                  >
                    <Radio.Group options={PROGRESS_OPTIONS} disabled={gatesLocked} />
                  </Form.Item>
                  {progressMode === 'daily' ? (
                    <Form.Item
                      name="dailyContent"
                      label="每日内容"
                      rules={[{ required: true, message: '请选择每日内容' }]}
                    >
                      <Radio.Group options={DAILY_CONTENT_OPTIONS} disabled={gatesLocked} />
                    </Form.Item>
                  ) : null}
                  <Form.Item
                    name="quizScope"
                    label="抽题范围"
                    rules={[{ required: true, message: '请选择抽题范围' }]}
                  >
                    <Radio.Group options={QUIZ_SCOPE_OPTIONS} disabled={gatesLocked} />
                  </Form.Item>
                  <Form.Item
                    name="quizPassRate"
                    label="习题及格线"
                    rules={[{ required: true, message: '请填写习题及格线' }]}
                  >
                    <InputNumber min={1} max={100} precision={0} style={{ width: 160 }} />
                  </Form.Item>
                  <Form.Item
                    name="mapSkinId"
                    label="闯关皮肤"
                    rules={[{ required: true, message: '请选择闯关皮肤' }]}
                  >
                    <Radio.Group optionType="button" options={SKIN_OPTIONS} />
                  </Form.Item>
                </Card>
              ),
            },
            {
              key: 'tasks',
              label: '任务',
              children: <Typography.Text>任务配置将在下一步完成</Typography.Text>,
            },
            {
              key: 'learners',
              label: '学员',
              children: <Typography.Text>{PROTOTYPE_TAB_HINT}</Typography.Text>,
            },
            {
              key: 'rewards',
              label: '奖励',
              children: <Typography.Text>{PROTOTYPE_TAB_HINT}</Typography.Text>,
            },
            {
              key: 'notices',
              label: '通知',
              children: <Typography.Text>{PROTOTYPE_TAB_HINT}</Typography.Text>,
            },
          ]}
        />
        <div className="sticky-form-actions">
          <Space>
            <Button onClick={onBack}>返回</Button>
            <Button type="primary" loading={submitting} onClick={() => void persist(false)}>
              保存
            </Button>
            {showPublish ? (
              <Button loading={submitting} onClick={() => void persist(true)}>
                发布
              </Button>
            ) : null}
          </Space>
        </div>
      </Form>
    </div>
  );
}
