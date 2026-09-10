import { useMemo, useState } from 'react';
import {
  App,
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useMedals } from '../../activities/model/medalLibrary';
import {
  CHECKIN_OWNER_APP_LABEL,
  checkinStatusOf,
  validateRewardRule,
  type CheckinOwnerApp,
  type CheckinTheme,
  type RewardRepeat,
  type RewardRule,
  type RewardTrigger,
} from '../model/checkin';
import { getTheme, nextThemeId, saveTheme, useCheckinThemes } from '../model/checkinStore';

const { RangePicker } = DatePicker;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

const LOTTERY_CHANCE_HINT =
  '由抽奖活动反向关联后才会入账；未关联时打卡仍记获奖，但次数不会进入任何抽奖。';

const OWNER_OPTIONS = (Object.keys(CHECKIN_OWNER_APP_LABEL) as CheckinOwnerApp[]).map((value) => ({
  value,
  label: CHECKIN_OWNER_APP_LABEL[value],
}));

const TRIGGER_OPTIONS: { value: RewardTrigger; label: string }[] = [
  { value: 'each', label: '每次打卡' },
  { value: 'streak', label: '连续满x天' },
  { value: 'total', label: '累计满y次' },
];

const REWARD_OPTIONS = [
  { value: 'medal', label: '勋章' },
  { value: 'points', label: '积分' },
  { value: 'lottery', label: '抽奖次数' },
];

const REPEAT_OPTIONS: { value: RewardRepeat; label: string }[] = [
  { value: 'once', label: '仅一次' },
  { value: 'repeat', label: '可重复' },
];

type RewardKey = 'medal' | 'points' | 'lottery';

type RuleForm = {
  id: string;
  trigger: RewardTrigger;
  streakDays?: number;
  totalTimes?: number;
  rewards: RewardKey[];
  medalId?: string;
  points?: number;
  lotteryChance?: number;
  repeat: RewardRepeat;
};

type FormValues = {
  ownerApp: CheckinOwnerApp;
  title: string;
  tags: string[];
  timeRange: [Dayjs, Dayjs];
  rules: RuleForm[];
};

type CheckinFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: (id: number) => void;
  defaultOwnerApp?: CheckinOwnerApp;
};

function emptyRule(): RuleForm {
  return {
    id: `r-${Date.now()}`,
    trigger: 'each',
    rewards: [],
    streakDays: 1,
    totalTimes: 1,
    points: 1,
    lotteryChance: 1,
    repeat: 'once',
  };
}

function rewardsOf(rule: RewardRule): RewardKey[] {
  const rewards: RewardKey[] = [];
  if (rule.enableMedal) rewards.push('medal');
  if (rule.enablePoints) rewards.push('points');
  if (rule.enableLotteryChance) rewards.push('lottery');
  return rewards;
}

function toRuleForm(rule: RewardRule): RuleForm {
  return {
    id: rule.id,
    trigger: rule.trigger,
    streakDays: rule.streakDays ?? 1,
    totalTimes: rule.totalTimes ?? 1,
    rewards: rewardsOf(rule),
    medalId: rule.medalId,
    points: rule.points || 1,
    lotteryChance: rule.lotteryChance || 1,
    repeat: rule.repeat,
  };
}

function toRewardRule(item: RuleForm): RewardRule {
  const rewards = item.rewards ?? [];
  return {
    id: item.id,
    trigger: item.trigger,
    streakDays: item.trigger === 'streak' ? item.streakDays : undefined,
    totalTimes: item.trigger === 'total' ? item.totalTimes : undefined,
    enableMedal: rewards.includes('medal'),
    medalId: rewards.includes('medal') ? item.medalId : undefined,
    enablePoints: rewards.includes('points'),
    points: rewards.includes('points') ? item.points ?? 0 : 0,
    enableLotteryChance: rewards.includes('lottery'),
    lotteryChance: rewards.includes('lottery') ? item.lotteryChance ?? 0 : 0,
    repeat: item.repeat,
  };
}

export function CheckinFormPage({
  mode,
  recordId,
  onBack,
  onSaved,
  defaultOwnerApp,
}: CheckinFormPageProps) {
  const { message } = App.useApp();
  const medals = useMedals();
  const themes = useCheckinThemes();
  const editing = mode === 'edit' ? getTheme(Number(recordId)) : undefined;
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const rulesWatch = Form.useWatch('rules', form) ?? [];

  const status = editing ? checkinStatusOf(editing) : undefined;
  const formLocked = status === '已结束';

  const initialValues = useMemo<Partial<FormValues>>(
    () => ({
      ownerApp: editing?.ownerApp ?? defaultOwnerApp ?? 'culture',
      title: editing?.title,
      tags: editing?.tags ?? [],
      timeRange: editing
        ? [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)]
        : undefined,
      rules: editing?.rules.map(toRuleForm) ?? [],
    }),
    [editing, defaultOwnerApp],
  );

  const pageTitle = mode === 'create' ? '新建打卡' : '编辑打卡';

  const submit = async () => {
    const values = await form.validateFields();
    const rules = (values.rules ?? []).map(toRewardRule);
    for (const rule of rules) {
      const error = validateRewardRule(rule);
      if (error) {
        message.error(error);
        return;
      }
    }
    const title = values.title.trim();
    const duplicate = themes.some(
      (item) => item.ownerApp === values.ownerApp && item.title === title && item.id !== editing?.id,
    );
    if (duplicate) {
      message.error('同所属应用内主题名称不可重复');
      return;
    }
    setSubmitting(true);
    try {
      const id = editing?.id ?? nextThemeId();
      const record: CheckinTheme = {
        id,
        title,
        ownerApp: values.ownerApp,
        tags: values.tags ?? [],
        startAt: values.timeRange[0].format(TIME_FORMAT),
        endAt: values.timeRange[1].format(TIME_FORMAT),
        rules,
      };
      saveTheme(record);
      const savedStatus = checkinStatusOf(record);
      if (savedStatus === '进行中') {
        message.success('已保存，新规则仅对之后的打卡生效');
      } else {
        message.success(mode === 'create' ? '已创建' : '已保存');
      }
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
          { title: '打卡' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                打卡管理
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
        <Typography.Text type="secondary">配置打卡主题、起止时间与奖励规则。</Typography.Text>
      </div>
      {formLocked ? <Alert type="warning" showIcon message={`当前状态为${status}，仅可查看不可保存。`} /> : null}
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        disabled={formLocked}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        initialValues={initialValues}
      >
        <Card title="基础信息">
          <Form.Item name="ownerApp" label="所属应用" rules={[{ required: true, message: '请选择所属应用' }]}>
            <Select options={OWNER_OPTIONS} placeholder="请选择所属应用" style={{ maxWidth: 320 }} />
          </Form.Item>
          <Form.Item
            name="title"
            label="主题名称"
            rules={[
              { required: true, message: '请输入主题名称' },
              { max: 40, message: '主题名称不超过 40 字' },
            ]}
          >
            <Input maxLength={40} showCount placeholder="请输入主题名称" style={{ maxWidth: 480 }} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入后回车添加标签" style={{ maxWidth: 480 }} />
          </Form.Item>
          <Form.Item name="timeRange" label="起止时间" rules={[{ required: true, message: '请选择开始与结束时间' }]}>
            <RangePicker showTime={{ format: 'HH:mm' }} format={TIME_FORMAT} placeholder={['开始', '结束']} />
          </Form.Item>
        </Card>
        <Card title="奖励规则" style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">{LOTTERY_CHANCE_HINT}</Typography.Text>
          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <div style={{ marginTop: 12 }}>
                {fields.map((field, index) => {
                  const row = rulesWatch[field.name] as RuleForm | undefined;
                  const trigger = row?.trigger ?? 'each';
                  const rewards = row?.rewards ?? [];
                  return (
                    <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                      <Form.Item {...field} name={[field.name, 'id']} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'trigger']}
                        label="触发条件"
                        rules={[{ required: true, message: '请选择触发条件' }]}
                      >
                        <Radio.Group options={TRIGGER_OPTIONS} />
                      </Form.Item>
                      {trigger === 'streak' ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'streakDays']}
                          label="连续天数"
                          rules={[{ required: true, message: '请填写连续天数' }]}
                        >
                          <InputNumber min={1} precision={0} style={{ width: 160 }} />
                        </Form.Item>
                      ) : null}
                      {trigger === 'total' ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'totalTimes']}
                          label="累计次数"
                          rules={[{ required: true, message: '请填写累计次数' }]}
                        >
                          <InputNumber min={1} precision={0} style={{ width: 160 }} />
                        </Form.Item>
                      ) : null}
                      <Form.Item {...field} name={[field.name, 'rewards']} label="奖励">
                        <Checkbox.Group options={REWARD_OPTIONS} />
                      </Form.Item>
                      {rewards.includes('medal') ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'medalId']}
                          label="勋章"
                          rules={[{ required: true, message: '请选择勋章' }]}
                        >
                          <Select
                            placeholder="请选择勋章"
                            options={medals.map((item) => ({ value: item.id, label: item.name }))}
                            style={{ maxWidth: 320 }}
                          />
                        </Form.Item>
                      ) : null}
                      {rewards.includes('points') ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'points']}
                          label="积分"
                          rules={[{ required: true, message: '请输入积分' }]}
                        >
                          <InputNumber min={1} precision={0} style={{ width: 160 }} />
                        </Form.Item>
                      ) : null}
                      {rewards.includes('lottery') ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'lotteryChance']}
                          label="抽奖次数"
                          extra={LOTTERY_CHANCE_HINT}
                          rules={[{ required: true, message: '请输入抽奖次数' }]}
                        >
                          <InputNumber min={1} precision={0} style={{ width: 160 }} />
                        </Form.Item>
                      ) : null}
                      <Form.Item
                        {...field}
                        name={[field.name, 'repeat']}
                        label="发放"
                        rules={[{ required: true, message: '请选择发放方式' }]}
                      >
                        <Radio.Group options={REPEAT_OPTIONS} />
                      </Form.Item>
                      <Button type="link" danger disabled={formLocked} onClick={() => remove(field.name)}>
                        删除规则 {index + 1}
                      </Button>
                    </Card>
                  );
                })}
                <Button type="dashed" disabled={formLocked} onClick={() => add(emptyRule())}>
                  添加规则
                </Button>
              </div>
            )}
          </Form.List>
        </Card>
        <div className="sticky-form-actions">
          <Space>
            <Button onClick={onBack}>返回</Button>
            {formLocked ? null : (
              <Button type="primary" loading={submitting} onClick={submit}>
                保存
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </div>
  );
}
