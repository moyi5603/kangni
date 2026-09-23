import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { PlusOutlined } from '@ant-design/icons';
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
import { addMedal, useMedals, type Medal } from '../../activities/model/medalLibrary';
import { MedalRewardFields, medalScopeOf, type MedalPickSource } from '../components/MedalRewardFields';
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

const OWNER_OPTIONS = (Object.keys(CHECKIN_OWNER_APP_LABEL) as CheckinOwnerApp[]).map((value) => ({
  value,
  label: CHECKIN_OWNER_APP_LABEL[value],
}));

const REPEAT_OPTIONS: { value: RewardRepeat; label: string }[] = [
  { value: 'once', label: '仅一次' },
  { value: 'repeat', label: '可重复' },
];

const TRIGGER_OPTIONS: { value: RewardTrigger; label: string }[] = [
  { value: 'each', label: '每次打卡' },
  { value: 'streak', label: '连续满' },
  { value: 'total', label: '累计满' },
];

type RuleForm = {
  id: string;
  trigger: RewardTrigger;
  streakDays?: number;
  totalTimes?: number;
  enableMedal: boolean;
  medalSource: MedalPickSource;
  medalId?: string;
  medalName?: string;
  medalImageUrl?: string;
  medalDescription?: string;
  enablePoints: boolean;
  points?: number;
  repeat: RewardRepeat;
};

type FormValues = {
  ownerApp: CheckinOwnerApp;
  title: string;
  tags: string[];
  timeRange: [Dayjs, Dayjs];
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
    enableMedal: false,
    medalSource: '从已有选择',
    enablePoints: false,
    streakDays: 1,
    totalTimes: 1,
    points: 1,
    repeat: 'once',
  };
}

function toRuleForm(rule: RewardRule): RuleForm {
  return {
    id: rule.id,
    trigger: rule.trigger,
    streakDays: rule.streakDays ?? 1,
    totalTimes: rule.totalTimes ?? 1,
    enableMedal: rule.enableMedal,
    medalSource: '从已有选择',
    medalId: rule.medalId,
    enablePoints: rule.enablePoints,
    points: rule.points || 1,
    repeat: rule.repeat,
  };
}

function resolveMedalId(item: RuleForm, ownerApp: CheckinOwnerApp): string | undefined {
  if (!item.enableMedal) return undefined;
  if (item.medalSource === '新建勋章') {
    const name = item.medalName?.trim() ?? '';
    const imageUrl = item.medalImageUrl ?? '';
    if (!name || !imageUrl) return undefined;
    return addMedal(name, imageUrl, {
      scope: medalScopeOf(ownerApp),
      description: item.medalDescription,
    }).id;
  }
  return item.medalId;
}

function toRewardRule(item: RuleForm, ownerApp: CheckinOwnerApp): RewardRule {
  return {
    id: item.id,
    trigger: item.trigger,
    streakDays: item.trigger === 'streak' ? item.streakDays : undefined,
    totalTimes: item.trigger === 'total' ? item.totalTimes : undefined,
    enableMedal: item.enableMedal,
    medalId: resolveMedalId(item, ownerApp),
    enablePoints: item.enablePoints,
    points: item.enablePoints ? item.points ?? 0 : 0,
    enableLotteryChance: false,
    lotteryChance: 0,
    repeat: item.repeat,
  };
}

const CLUSTER: CSSProperties = {
  display: 'inline-flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 8,
};

function RuleEditor({
  rule,
  index,
  locked,
  medals,
  onChange,
  onRemove,
}: {
  rule: RuleForm;
  index: number;
  locked: boolean;
  medals: Medal[];
  onChange: (patch: Partial<RuleForm>) => void;
  onRemove: () => void;
}) {
  return (
    <Card
      size="small"
      title={`规则 ${index + 1}`}
      extra={
        <Button type="link" danger disabled={locked} onClick={onRemove}>
          删除
        </Button>
      }
      style={{ marginBottom: 12 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={CLUSTER}>
          <span style={{ width: 112, flex: '0 0 112px' }}>触发条件</span>
          <Select
            value={rule.trigger}
            disabled={locked}
            options={TRIGGER_OPTIONS}
            onChange={(trigger) => onChange({ trigger })}
            style={{ width: 140 }}
          />
          {rule.trigger === 'streak' ? (
            <>
              <InputNumber
                min={1}
                precision={0}
                disabled={locked}
                value={rule.streakDays}
                onChange={(value) => onChange({ streakDays: Number(value) || 1 })}
                style={{ width: 88 }}
              />
              天
            </>
          ) : null}
          {rule.trigger === 'total' ? (
            <>
              <InputNumber
                min={1}
                precision={0}
                disabled={locked}
                value={rule.totalTimes}
                onChange={(value) => onChange({ totalTimes: Number(value) || 1 })}
                style={{ width: 88 }}
              />
              次
            </>
          ) : null}
        </div>
        <div style={CLUSTER}>
          <span style={{ width: 112, flex: '0 0 112px' }}>发放</span>
          <Radio.Group
            options={REPEAT_OPTIONS}
            value={rule.repeat}
            disabled={locked}
            onChange={(event) => onChange({ repeat: event.target.value })}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 112, flex: '0 0 112px', paddingTop: 5 }}>奖励</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <Checkbox
                checked={rule.enableMedal}
                disabled={locked}
                onChange={(event) => onChange({ enableMedal: event.target.checked })}
              >
                勋章
              </Checkbox>
              <div style={{ marginTop: 8 }}>
                <MedalRewardFields
                  medals={medals}
                  locked={locked || !rule.enableMedal}
                  source={rule.medalSource}
                  medalId={rule.medalId}
                  medalName={rule.medalName}
                  medalImageUrl={rule.medalImageUrl}
                  medalDescription={rule.medalDescription}
                  onChange={onChange}
                />
              </div>
            </div>
            <div style={CLUSTER}>
              <Checkbox
                checked={rule.enablePoints}
                disabled={locked}
                onChange={(event) => onChange({ enablePoints: event.target.checked })}
              >
                积分
              </Checkbox>
              {rule.enablePoints ? (
                <InputNumber
                  min={1}
                  precision={0}
                  disabled={locked}
                  value={rule.points}
                  onChange={(value) => onChange({ points: Number(value) || 1 })}
                  addonAfter="分"
                  style={{ width: 128 }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
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
  const [ruleRows, setRuleRows] = useState<RuleForm[]>(() =>
    mode === 'edit' ? (getTheme(Number(recordId))?.rules.map(toRuleForm) ?? []) : [emptyRule()],
  );

  const status = editing ? checkinStatusOf(editing) : undefined;
  const formLocked = status === '已结束';

  useEffect(() => {
    if (mode === 'edit') setRuleRows(editing?.rules.map(toRuleForm) ?? []);
  }, [editing, recordId, mode]);

  const initialValues = useMemo<Partial<FormValues>>(
    () => ({
      ownerApp: editing?.ownerApp ?? defaultOwnerApp ?? 'culture',
      title: editing?.title,
      tags: editing?.tags ?? [],
      timeRange: editing
        ? [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)]
        : undefined,
    }),
    [editing, defaultOwnerApp],
  );

  const pageTitle = mode === 'create' ? '新建打卡' : '编辑打卡';

  const patchRule = (index: number, patch: Partial<RuleForm>) => {
    setRuleRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const submit = async () => {
    const values = await form.validateFields();
    const rules = ruleRows.map((item) => toRewardRule(item, values.ownerApp));
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
          <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
            勾选勋章后可选「从已有选择」（弹窗选库）或「新建勋章」。一条规则只出现一组奖励。
          </Typography.Paragraph>
          {ruleRows.map((rule, index) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              index={index}
              locked={formLocked}
              medals={medals}
              onChange={(patch) => patchRule(index, patch)}
              onRemove={() => setRuleRows((rows) => rows.filter((_, i) => i !== index))}
            />
          ))}
          <Button type="dashed" disabled={formLocked} onClick={() => setRuleRows((rows) => [...rows, emptyRule()])} icon={<PlusOutlined />}>
            添加规则
          </Button>
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
