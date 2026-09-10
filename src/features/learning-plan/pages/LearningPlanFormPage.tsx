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
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { getQuestionStore } from '../../exams/model/questionStore';
import {
  MAP_SKINS,
  validatePlanBasics,
  validateQuizTask,
  type AssignMode,
  type DailyContent,
  type LearningPlan,
  type MapSkinId,
  type PlanStage,
  type PlanTask,
  type ProgressMode,
  type QuizMode,
  type QuizScope,
  type TaskType,
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

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'course', label: '课程' },
  { value: 'exam', label: '考试' },
  { value: 'lecture', label: '讲座' },
  { value: 'quiz', label: '习题' },
];

const QUIZ_MODE_OPTIONS: { value: QuizMode; label: string }[] = [
  { value: 'manual', label: '指定题目' },
  { value: 'random', label: '题库随机' },
];

const SKIN_OPTIONS = MAP_SKINS.map((item) => ({ value: item.id, label: item.label }));

const PROTOTYPE_TAB_HINT = '沿用现网能力，本轮原型不配。';

type TaskForm = {
  id?: string;
  type: TaskType;
  required: boolean;
  title: string;
  refId?: string;
  quizMode?: QuizMode;
  questionIds?: number[];
  randomCount?: number;
};

type StageForm = {
  id?: string;
  name: string;
  tasks: TaskForm[];
};

type FormValues = {
  name: string;
  timeRange: [Dayjs, Dayjs];
  assignMode: AssignMode;
  progressMode: ProgressMode;
  dailyContent?: DailyContent;
  quizScope: QuizScope;
  quizPassRate: number;
  mapSkinId: MapSkinId;
  stages: StageForm[];
};

type LearningPlanFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  initialTab?: string;
  onBack: () => void;
  onSaved: (id: number) => void;
};

function nextPlanId(): number {
  const ids = getLearningPlanStore().getSnapshot().plans.map((item) => item.id);
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

function emptyTask(): TaskForm {
  return { type: 'course', required: true, title: '' };
}

function emptyStage(): StageForm {
  return { name: '', tasks: [emptyTask()] };
}

function optionLabel(value: string | undefined, options: { value: string; label: string }[]) {
  return options.find((item) => item.value === value)?.label;
}

function toPlanStages(raw: StageForm[] | undefined): PlanStage[] {
  let taskSeq = 0;
  return (raw ?? []).map((stage, stageIndex) => ({
    id: stage.id?.trim() || `s-${stageIndex + 1}`,
    name: (stage.name ?? '').trim(),
    tasks: (stage.tasks ?? []).map((task): PlanTask => {
      taskSeq += 1;
      const base: PlanTask = {
        id: task.id?.trim() || `t-${taskSeq}`,
        type: task.type,
        required: Boolean(task.required),
        title: (task.title ?? '').trim(),
      };
      if (task.type === 'quiz') {
        return {
          ...base,
          quizMode: task.quizMode ?? 'manual',
          questionIds: (task.quizMode ?? 'manual') === 'manual' ? task.questionIds : undefined,
          randomCount: task.quizMode === 'random' ? task.randomCount : undefined,
        };
      }
      const refId = task.refId?.trim();
      return refId ? { ...base, refId } : base;
    }),
  }));
}

function taskToForm(task: PlanTask): TaskForm {
  return {
    id: task.id,
    type: task.type,
    required: task.required,
    title: task.title,
    refId: task.refId,
    quizMode: task.quizMode,
    questionIds: task.questionIds,
    randomCount: task.randomCount,
  };
}

export function LearningPlanFormPage({
  mode,
  recordId,
  initialTab = 'basics',
  onBack,
  onSaved,
}: LearningPlanFormPageProps) {
  const { message } = App.useApp();
  const editing = mode === 'edit' ? getLearningPlanStore().getPlan(Number(recordId)) : undefined;
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const progressMode = Form.useWatch('progressMode', form) ?? editing?.progressMode ?? 'accumulate';
  const dailyContent = Form.useWatch('dailyContent', form) ?? editing?.dailyContent;
  const quizScope = Form.useWatch('quizScope', form) ?? editing?.quizScope ?? 'cohort';
  const quizPassRate = Form.useWatch('quizPassRate', form) ?? editing?.quizPassRate ?? 60;
  const stagesWatch = Form.useWatch('stages', form);
  const gatesLocked = editing?.status === 'published';
  const showPublish = (editing?.status ?? 'draft') === 'draft';
  const practiceQuestions = getQuestionStore('practice').useQuestions();
  const enabledPractice = practiceQuestions.filter((item) => item.status === '启用');
  const questionOptions = enabledPractice.map((item) => ({
    value: item.id,
    label: item.stem.replace(/<[^>]+>/g, '').slice(0, 48) || `题目 ${item.id}`,
  }));

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
      stages:
        editing?.stages?.map((stage) => ({
          id: stage.id,
          name: stage.name,
          tasks: stage.tasks.map(taskToForm),
        })) ?? [emptyStage()],
    }),
    [editing],
  );

  const pageTitle = mode === 'create' ? '新建计划' : '编辑计划';
  const hintParts = [
    optionLabel(progressMode, PROGRESS_OPTIONS),
    progressMode === 'daily' ? optionLabel(dailyContent, DAILY_CONTENT_OPTIONS) : undefined,
    optionLabel(quizScope, QUIZ_SCOPE_OPTIONS),
    `及格 ${quizPassRate}%`,
  ].filter(Boolean);
  const strategyHint = `当前：${hintParts.join(' · ')}`;

  const persist = async (andPublish: boolean) => {
    const values = await form.validateFields();
    const name = values.name.trim();
    const dailyContentValue = values.progressMode === 'daily' ? values.dailyContent : undefined;
    const basicsError = validatePlanBasics({
      name,
      quizPassRate: values.quizPassRate,
      progressMode: values.progressMode,
      dailyContent: dailyContentValue,
    });
    if (basicsError) {
      message.error(basicsError);
      return;
    }
    const stages = toPlanStages(values.stages);
    const poolSize = enabledPractice.length;
    for (const stage of stages) {
      for (const task of stage.tasks) {
        const quizError = validateQuizTask(task, poolSize);
        if (quizError) {
          message.error(quizError);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const id = editing?.id ?? nextPlanId();
      const record: LearningPlan = {
        id,
        name,
        assignMode: values.assignMode,
        progressMode: values.progressMode,
        dailyContent: dailyContentValue,
        quizScope: values.quizScope,
        quizPassRate: values.quizPassRate,
        mapSkinId: values.mapSkinId,
        overtimeAllowed: editing?.overtimeAllowed ?? true,
        taskSync: editing?.taskSync ?? true,
        progressSync: editing?.progressSync ?? true,
        status: editing?.status ?? 'draft',
        startAt: values.timeRange[0].format(TIME_FORMAT),
        endAt: values.timeRange[1].format(TIME_FORMAT),
        stages,
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
          defaultActiveKey={initialTab}
          items={[
            {
              key: 'basics',
              label: '基本信息',
              forceRender: true,
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
              forceRender: true,
              children: (
                <Card title="任务">
                  <Typography.Text type="secondary">{strategyHint}</Typography.Text>
                  <Form.List name="stages">
                    {(stageFields, stageOps) => (
                      <div style={{ marginTop: 12 }}>
                        {stageFields.map((stageField, stageIndex) => (
                          <Card
                            key={stageField.key}
                            size="small"
                            style={{ marginBottom: 12 }}
                            extra={
                              <Button type="link" danger onClick={() => stageOps.remove(stageField.name)}>
                                删除阶段
                              </Button>
                            }
                          >
                            <Form.Item name={[stageField.name, 'id']} hidden>
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name={[stageField.name, 'name']}
                              label="阶段名称"
                              rules={[{ required: true, message: '请填写阶段名称' }]}
                            >
                              <Input placeholder="请输入阶段名称" style={{ maxWidth: 320 }} />
                            </Form.Item>
                            <Form.List name={[stageField.name, 'tasks']}>
                              {(taskFields, taskOps) => (
                                <div>
                                  {taskFields.map((taskField) => {
                                    const taskRow = (stagesWatch?.[stageField.name]?.tasks?.[taskField.name] ??
                                      initialValues.stages?.[stageIndex]?.tasks?.[taskField.name]) as
                                      | TaskForm
                                      | undefined;
                                    const taskType = taskRow?.type ?? 'course';
                                    const quizMode = taskRow?.quizMode ?? 'manual';
                                    return (
                                      <Card key={taskField.key} size="small" style={{ marginBottom: 12 }}>
                                        <Form.Item name={[taskField.name, 'id']} hidden>
                                          <Input />
                                        </Form.Item>
                                        <Form.Item
                                          name={[taskField.name, 'type']}
                                          label="类型"
                                          rules={[{ required: true, message: '请选择类型' }]}
                                        >
                                          <Select
                                            options={TASK_TYPE_OPTIONS}
                                            style={{ maxWidth: 160 }}
                                          />
                                        </Form.Item>
                                        <Form.Item
                                          name={[taskField.name, 'required']}
                                          label="必修"
                                          valuePropName="checked"
                                        >
                                          <Switch />
                                        </Form.Item>
                                        <Form.Item
                                          name={[taskField.name, 'title']}
                                          label="标题"
                                          rules={[{ required: true, message: '请填写标题' }]}
                                        >
                                          <Input placeholder="请输入任务标题" style={{ maxWidth: 480 }} />
                                        </Form.Item>
                                        {taskType === 'quiz' ? (
                                          <>
                                            <Form.Item
                                              name={[taskField.name, 'quizMode']}
                                              label="来源"
                                              rules={[{ required: true, message: '请选择来源' }]}
                                            >
                                              <Radio.Group options={QUIZ_MODE_OPTIONS} />
                                            </Form.Item>
                                            {quizMode === 'manual' ? (
                                              <Form.Item
                                                name={[taskField.name, 'questionIds']}
                                                label="题目"
                                                rules={[{ required: true, message: '请选择题目' }]}
                                              >
                                                <Select
                                                  mode="multiple"
                                                  optionFilterProp="label"
                                                  options={questionOptions}
                                                  placeholder="请选择练习题"
                                                  style={{ maxWidth: 480 }}
                                                />
                                              </Form.Item>
                                            ) : (
                                              <Form.Item
                                                name={[taskField.name, 'randomCount']}
                                                label="随机题量"
                                                rules={[{ required: true, message: '请填写随机题量' }]}
                                              >
                                                <InputNumber min={1} precision={0} style={{ width: 160 }} />
                                              </Form.Item>
                                            )}
                                          </>
                                        ) : (
                                          <Form.Item name={[taskField.name, 'refId']} label="内容">
                                            <Input placeholder="内容 ID" style={{ maxWidth: 320 }} />
                                          </Form.Item>
                                        )}
                                        <Button type="link" danger onClick={() => taskOps.remove(taskField.name)}>
                                          删除任务
                                        </Button>
                                      </Card>
                                    );
                                  })}
                                  <Button type="dashed" onClick={() => taskOps.add(emptyTask())}>
                                    添加任务
                                  </Button>
                                </div>
                              )}
                            </Form.List>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => stageOps.add(emptyStage())}>
                          添加阶段
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </Card>
              ),
            },
            {
              key: 'learners',
              label: '学员',
              forceRender: true,
              children: <Typography.Text>{PROTOTYPE_TAB_HINT}</Typography.Text>,
            },
            {
              key: 'rewards',
              label: '奖励',
              forceRender: true,
              children: <Typography.Text>{PROTOTYPE_TAB_HINT}</Typography.Text>,
            },
            {
              key: 'notices',
              label: '通知',
              forceRender: true,
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
