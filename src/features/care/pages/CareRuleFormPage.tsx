import { useEffect, useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  TimePicker,
  DatePicker,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  PUSH_OFFSETS,
  WARNING_LEVELS,
  WEATHER_SCENES,
  WORK_SCENES,
  categoryOf,
  defaultCreateType,
  emptyRuleDraft,
  festivalRadioOptions,
  isCareType,
  isDeferredCreateType,
  isPersonalType,
  sceneSelectOptions,
  solarTermRadioOptions,
  usedAnniversaryYears,
  usedUniqueScenes,
  validateRuleDraft,
  type CareRule,
  type CareType,
  type PushOffset,
  type WarningLevel,
  type WeatherScene,
  type WorkScene,
} from '../model/care';
import { getRule, saveRule, useRules, useTemplates } from '../model/careStore';
import { CareFestivalPicker, CareOptionTiles } from './CareFestivalPicker';
import { CareTemplatePicker } from './CareTemplatePicker';

type FormValues = {
  type: CareType;
  name: string;
  anniversaryYear?: number;
  occasion?: string[];
  festival?: string;
  solarTerm?: string;
  validity: CareRule['validity'];
  fixedDate?: string;
  oneOffDate?: Dayjs;
  weatherScenes?: WeatherScene[];
  weatherScene?: WeatherScene;
  highTemperatureThreshold?: number;
  lowTemperatureThreshold?: number;
  coldWaveDropThreshold?: number;
  coldWaveMinTemperature?: number;
  rainWarningLevels?: WarningLevel[];
  snowWarningLevels?: WarningLevel[];
  typhoonWarningLevels?: WarningLevel[];
  sandstormWarningLevels?: WarningLevel[];
  hazeAqiThreshold?: number;
  workIntensityScenes?: WorkScene[];
  workIntensityScene?: WorkScene;
  dailyWorkHoursThreshold?: number;
  lateOffDutyTime?: string;
  weeklyWorkHoursThreshold?: number;
  weeklyNotifyManager?: boolean;
  consecutiveOvertimeDays?: number;
  consecutiveNotifyManager?: boolean;
  pushOffset: PushOffset;
  pushTime?: Dayjs;
  points?: number;
  templateKeys: string[];
  scope: CareRule['scope'];
  departments?: string[];
  employeeIds?: string[];
  coworkerEnabled: boolean;
  coworkerScope: CareRule['coworkerScope'];
  coworkerOffset?: string;
  coworkerTime?: Dayjs;
};

function parseTime(value?: string) {
  if (!value || !/^\d{2}:\d{2}/.test(value)) return undefined;
  return dayjs(`2000-01-01 ${value}`);
}

function yearlyFixedDateValue(value?: string) {
  if (!value || !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return undefined;
  const parsed = dayjs(`2000-${value}`);
  return parsed.isValid() ? parsed : undefined;
}

export function CareRuleFormPage({
  mode,
  recordId,
  onBack,
  onSaved,
}: {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const rules = useRules();
  const templates = useTemplates();
  const existing = mode === 'edit' && recordId ? getRule(recordId) : undefined;
  const createType = useMemo(() => {
    if (mode !== 'create') return '节日关怀' as CareType;
    const requested = isCareType(recordId) && !isDeferredCreateType(recordId) ? recordId : undefined;
    if (requested && usedUniqueScenes(rules).has(requested)) {
      return defaultCreateType(categoryOf(requested), rules);
    }
    return requested ?? '节日关怀';
  }, [mode, recordId, rules]);
  const [type, setType] = useState<CareType>(existing?.type ?? createType);
  const weatherScene = (Form.useWatch('weatherScene', form) ?? existing?.weatherScenes?.[0]) as WeatherScene | undefined;
  const workScene = (Form.useWatch('workIntensityScene', form) ?? existing?.workIntensityScenes?.[0]) as WorkScene | undefined;
  const validity = Form.useWatch('validity', form) ?? existing?.validity ?? '永久生效';
  const coworkerEnabled = Form.useWatch('coworkerEnabled', form) ?? existing?.coworkerEnabled ?? false;
  const yearsUsed = usedAnniversaryYears(rules, existing?.id);

  useEffect(() => {
    if (mode === 'edit' && recordId && !existing) {
      message.error('关怀规则不存在');
      onBack();
    }
  }, [mode, recordId, existing, message, onBack]);

  const matchedTemplates = useMemo(() => templates.filter((item) => item.type === type), [templates, type]);

  const toValues = (rule: CareRule): FormValues => ({
    type: rule.type,
    name: rule.name,
    anniversaryYear: rule.anniversaryYear,
    occasion: rule.occasion,
    festival: rule.type === '节日关怀' ? rule.occasion?.[0] : undefined,
    solarTerm: rule.type === '节气关怀' ? rule.occasion?.[0] : undefined,
    validity: rule.validity,
    fixedDate: rule.validity === '一次性' ? undefined : rule.fixedDate,
    oneOffDate: rule.validity === '一次性' && rule.fixedDate ? dayjs(rule.fixedDate) : undefined,
    weatherScene: rule.type === '天气关怀' ? rule.weatherScenes?.[0] : undefined,
    highTemperatureThreshold: rule.highTemperatureThreshold,
    lowTemperatureThreshold: rule.lowTemperatureThreshold,
    coldWaveDropThreshold: rule.coldWaveDropThreshold,
    coldWaveMinTemperature: rule.coldWaveMinTemperature,
    rainWarningLevels: rule.rainWarningLevels,
    snowWarningLevels: rule.snowWarningLevels,
    typhoonWarningLevels: rule.typhoonWarningLevels,
    sandstormWarningLevels: rule.sandstormWarningLevels,
    hazeAqiThreshold: rule.hazeAqiThreshold,
    workIntensityScene: rule.type === '工作强度关怀' ? rule.workIntensityScenes?.[0] : undefined,
    dailyWorkHoursThreshold: rule.dailyWorkHoursThreshold,
    lateOffDutyTime: rule.lateOffDutyTime,
    weeklyWorkHoursThreshold: rule.weeklyWorkHoursThreshold,
    weeklyNotifyManager: rule.weeklyNotifyManager,
    consecutiveOvertimeDays: rule.consecutiveOvertimeDays,
    consecutiveNotifyManager: rule.consecutiveNotifyManager,
    pushOffset: rule.pushOffset || '当天',
    pushTime: parseTime(rule.pushTime),
    points: rule.points,
    templateKeys: rule.templateKeys,
    scope: rule.scope,
    departments: rule.scope === '部门' ? rule.scopeValues : ['all'],
    employeeIds: rule.scope === '员工' ? rule.scopeValues : [],
    coworkerEnabled: rule.coworkerEnabled,
    coworkerScope: rule.coworkerScope,
    coworkerOffset: rule.coworkerOffset,
    coworkerTime: parseTime(rule.coworkerTime),
  });

  const changeType = (next: CareType) => {
    setType(next);
    form.setFieldsValue({
      type: next,
      name: form.getFieldValue('name') || next,
      templateKeys: [],
      occasion: [],
      festival: undefined,
      solarTerm: undefined,
      weatherScene: undefined,
      workIntensityScene: undefined,
    });
  };

  const submit = async () => {
    const values = await form.validateFields();
    const draft: CareRule = {
      ...(existing ?? emptyRuleDraft(values.type)),
      id: existing?.id ?? '',
      type: values.type,
      name: values.name.trim(),
      anniversaryYear: values.anniversaryYear,
      occasion:
        values.type === '节日关怀'
          ? values.festival
            ? [values.festival]
            : []
          : values.type === '节气关怀'
            ? values.solarTerm
              ? [values.solarTerm]
              : []
            : values.occasion,
      validity: values.validity,
      fixedDate: values.validity === '一次性' ? values.oneOffDate?.format('YYYY-MM-DD') : values.fixedDate,
      weatherScenes: values.type === '天气关怀' && values.weatherScene ? [values.weatherScene] : values.weatherScenes,
      highTemperatureThreshold: values.highTemperatureThreshold,
      lowTemperatureThreshold: values.lowTemperatureThreshold,
      coldWaveDropThreshold: values.coldWaveDropThreshold,
      coldWaveMinTemperature: values.coldWaveMinTemperature,
      rainWarningLevels: values.rainWarningLevels,
      snowWarningLevels: values.snowWarningLevels,
      typhoonWarningLevels: values.typhoonWarningLevels,
      sandstormWarningLevels: values.sandstormWarningLevels,
      hazeAqiThreshold: values.hazeAqiThreshold,
      workIntensityScenes: values.type === '工作强度关怀' && values.workIntensityScene ? [values.workIntensityScene] : values.workIntensityScenes,
      dailyWorkHoursThreshold: values.dailyWorkHoursThreshold,
      lateOffDutyTime: values.lateOffDutyTime,
      weeklyWorkHoursThreshold: values.weeklyWorkHoursThreshold,
      weeklyNotifyManager: values.weeklyNotifyManager,
      consecutiveOvertimeDays: values.consecutiveOvertimeDays,
      consecutiveNotifyManager: values.consecutiveNotifyManager,
      pushOffset: values.pushOffset ?? '当天',
      pushTime:
        categoryOf(values.type) === '事件关怀'
          ? values.type === '天气关怀'
            ? '每日 06:00、15:00、21:00'
            : 'T+1 考勤更新后'
          : values.pushTime?.format('HH:mm:ss') ?? '09:00:00',
      points: values.type === '天气关怀' ? 0 : values.points ?? 0,
      templateKeys: values.templateKeys,
      scope: values.scope,
      scopeValues: values.scope === '员工' ? values.employeeIds ?? [] : values.departments?.length ? values.departments : ['all'],
      coworkerEnabled: values.coworkerEnabled,
      coworkerScope: values.coworkerScope,
      coworkerOffset: values.coworkerOffset ?? '提前1天',
      coworkerTime: values.coworkerTime?.format('HH:mm') ?? '10:00',
      status: existing?.status ?? '执行中',
    };
    const error = validateRuleDraft(draft, rules, existing?.id);
    if (error) {
      message.error(error);
      return;
    }
    saveRule(draft);
    message.success(mode === 'create' ? '关怀规则已创建并启用' : '关怀规则已更新');
    onSaved();
  };

  const initial = existing ? toValues(existing) : toValues(emptyRuleDraft(createType));
  const eventType = categoryOf(type) === '事件关怀';

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '员工关怀' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>关怀规则</Button> },
          { title: mode === 'create' ? '新建规则' : '编辑规则' },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {mode === 'create' ? '新建关怀规则' : '编辑关怀规则'}
        </Typography.Title>
        <Typography.Text type="secondary">设置触发场景、推送时间，并关联一个或多个关怀模板</Typography.Text>
      </div>
      <Form form={form} layout="horizontal" className="edit-form" initialValues={initial} scrollToFirstError={{ focus: true }}>
        <Card title="规则设置">
          <Form.Item name="type" label="关怀场景" rules={[{ required: true, message: '请选择关怀场景' }]}>
            <Select
              options={sceneSelectOptions(rules, existing?.id, { hideDeferred: mode === 'create' })}
              placeholder="请选择关怀场景"
              style={{ maxWidth: 560 }}
              onChange={changeType}
            />
          </Form.Item>
          <Form.Item name="name" label="关怀主题" rules={[{ required: true, message: '请输入关怀主题' }, { max: 50 }]}>
            <Input placeholder="请输入关怀主题" maxLength={50} showCount style={{ maxWidth: 560 }} />
          </Form.Item>
          {type === '周年庆关怀' ? (
            <Form.Item
              name="anniversaryYear"
              label="周年数"
              extra="按员工入职日期，在所选周年当天触发关怀；已配置的周年数不可重复选择"
              rules={[{ required: true, message: '请选择周年数' }]}
            >
              <Select
                placeholder="请选择周年数"
                style={{ maxWidth: 320 }}
                options={Array.from({ length: 20 }, (_, index) => {
                  const year = index + 1;
                  return { value: year, label: yearsUsed.has(year) ? `${year}周年（已配置）` : `${year}周年`, disabled: yearsUsed.has(year) };
                })}
              />
            </Form.Item>
          ) : null}
          {type === '节日关怀' ? (
            <Form.Item name="festival" label="具体节日" extra="单选；按所选节日的日历日期每年自动执行，每个节日仅可配置一次" rules={[{ required: true, message: '请选择一个具体节日' }]}>
              <CareFestivalPicker groups={festivalRadioOptions(rules, existing?.id)} />
            </Form.Item>
          ) : null}
          {type === '节气关怀' ? (
            <Form.Item
              name="solarTerm"
              label="具体节气"
              extra="单选；按所选节气的日历日期每年自动执行，每个节气仅可配置一次"
              rules={[{ required: true, message: '请选择一个具体节气' }]}
            >
              <CareOptionTiles options={solarTermRadioOptions(rules, existing?.id)} />
            </Form.Item>
          ) : null}
          {type === '其他' ? (
            <>
              <Form.Item name="validity" label="规则时效" rules={[{ required: true, message: '请选择规则时效' }]}>
                <Radio.Group
                  options={[
                    { value: '永久生效', label: '永久生效' },
                    { value: '一次性', label: '一次性' },
                  ]}
                />
              </Form.Item>
              {validity === '一次性' ? (
                <Form.Item name="oneOffDate" label="固定日期" extra="请选择包含年份的完整日期，规则仅执行一次" rules={[{ required: true, message: '请选择固定日期' }]}>
                  <DatePicker aria-label="一次性固定日期" style={{ width: 240 }} />
                </Form.Item>
              ) : (
                <Form.Item
                  name="fixedDate"
                  label="固定日期"
                  extra="每年按该月日执行"
                  getValueFromEvent={(value: Dayjs | null) => value?.format('MM-DD')}
                  getValueProps={(value?: string) => ({ value: yearlyFixedDateValue(value) })}
                  rules={[
                    { required: true, message: '请选择固定日期' },
                    { pattern: /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, message: '请选择有效月日' },
                  ]}
                >
                  <DatePicker allowClear format="MM-DD" placeholder="请选择月日" aria-label="每年固定日期" style={{ width: 240 }} />
                </Form.Item>
              )}
            </>
          ) : null}
          {type === '天气关怀' ? (
            <>
              <Form.Item
                name="weatherScene"
                label="天气场景"
                extra="单选；按所选场景设置阈值"
                rules={[{ required: true, message: '请选择一个天气场景' }]}
              >
                <CareOptionTiles options={WEATHER_SCENES.map((item) => ({ value: item, label: item }))} />
              </Form.Item>
              {weatherScene === '极端高温' ? (
                <Form.Item name="highTemperatureThreshold" label="高温阈值" rules={[{ required: true, message: '请输入高温阈值' }]}>
                  <InputNumber min={30} max={50} addonBefore="≥" addonAfter="°C" style={{ width: 200 }} />
                </Form.Item>
              ) : null}
              {weatherScene === '极端低温' ? (
                <Form.Item name="lowTemperatureThreshold" label="低温阈值" rules={[{ required: true, message: '请输入低温阈值' }]}>
                  <InputNumber min={-30} max={10} addonBefore="≤" addonAfter="°C" style={{ width: 200 }} />
                </Form.Item>
              ) : null}
              {weatherScene === '寒潮降温' ? (
                <Form.Item label="寒潮阈值" required extra="同时满足两个条件时触发">
                  <Space wrap>
                    <span>24 小时降温 ≥</span>
                    <Form.Item name="coldWaveDropThreshold" noStyle rules={[{ required: true, message: '请输入降温幅度' }]}>
                      <InputNumber min={4} max={20} addonAfter="°C" />
                    </Form.Item>
                    <span>且最低温 ≤</span>
                    <Form.Item name="coldWaveMinTemperature" noStyle rules={[{ required: true, message: '请输入最低温度' }]}>
                      <InputNumber min={-20} max={15} addonAfter="°C" />
                    </Form.Item>
                  </Space>
                </Form.Item>
              ) : null}
              {weatherScene === '暴雨预警' ? (
                <Form.Item name="rainWarningLevels" label="暴雨级别" rules={[{ required: true, type: 'array', min: 1, message: '请选择预警级别' }]}>
                  <Checkbox.Group options={WARNING_LEVELS.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
              ) : null}
              {weatherScene === '暴雪预警' ? (
                <Form.Item name="snowWarningLevels" label="暴雪级别" rules={[{ required: true, type: 'array', min: 1, message: '请选择预警级别' }]}>
                  <Checkbox.Group options={WARNING_LEVELS.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
              ) : null}
              {weatherScene === '台风预警' ? (
                <Form.Item name="typhoonWarningLevels" label="台风级别" rules={[{ required: true, type: 'array', min: 1, message: '请选择预警级别' }]}>
                  <Checkbox.Group options={WARNING_LEVELS.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
              ) : null}
              {weatherScene === '沙尘预警' ? (
                <Form.Item name="sandstormWarningLevels" label="沙尘级别" rules={[{ required: true, type: 'array', min: 1, message: '请选择预警级别' }]}>
                  <Checkbox.Group options={WARNING_LEVELS.map((item) => ({ label: item, value: item }))} />
                </Form.Item>
              ) : null}
              {weatherScene === '霾/重污染' ? (
                <Form.Item name="hazeAqiThreshold" label="空气质量阈值" rules={[{ required: true, message: '请输入 AQI 阈值' }]}>
                  <InputNumber min={100} max={500} addonBefore="AQI ≥" style={{ width: 220 }} />
                </Form.Item>
              ) : null}
            </>
          ) : null}
          {type === '工作强度关怀' ? (
            <>
              <Form.Item
                name="workIntensityScene"
                label="触发条件"
                extra="单选。T+1 考勤更新后按考勤结果判断。"
                rules={[{ required: true, message: '请选择一个触发条件' }]}
              >
                <CareOptionTiles options={WORK_SCENES.map((item) => ({ value: item, label: item }))} />
              </Form.Item>
              {workScene === '单日超时' ? (
                <Form.Item name="dailyWorkHoursThreshold" label="单日工时" rules={[{ required: true, message: '请输入单日工时阈值' }]}>
                  <InputNumber min={8} max={24} addonBefore="≥" addonAfter="小时" style={{ width: 220 }} />
                </Form.Item>
              ) : null}
              {workScene === '下班过晚' ? (
                <Form.Item name="lateOffDutyTime" label="最晚下班" rules={[{ required: true, message: '请选择下班时间' }]}>
                  <Select style={{ maxWidth: 160 }} options={['20:00', '21:00', '22:00', '23:00', '24:00'].map((item) => ({ value: item, label: item }))} />
                </Form.Item>
              ) : null}
              {workScene === '每周超时' ? (
                <>
                  <Form.Item name="weeklyWorkHoursThreshold" label="每周工时" extra="同一员工每周最多关怀一次。" rules={[{ required: true, message: '请输入每周工时阈值' }]}>
                    <InputNumber min={40} max={100} addonBefore="≥" addonAfter="小时/周" style={{ width: 240 }} />
                  </Form.Item>
                  <Form.Item name="weeklyNotifyManager" label="通知直属上级" valuePropName="checked" extra="开启后，同步向员工直属上级发送团队关怀提醒">
                    <Switch aria-label="每周超时通知直属上级" />
                  </Form.Item>
                </>
              ) : null}
              {workScene === '连续加班' ? (
                <>
                  <Form.Item name="consecutiveOvertimeDays" label="连续天数" extra="按单日工时超过 12 小时统计，触发后重新累计" rules={[{ required: true, message: '请输入连续加班天数' }]}>
                    <InputNumber min={2} max={14} addonBefore="≥" addonAfter="天" style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item name="consecutiveNotifyManager" label="通知直属上级" valuePropName="checked" extra="开启后，同步向员工直属上级发送团队关怀提醒">
                    <Switch aria-label="连续加班通知直属上级" />
                  </Form.Item>
                </>
              ) : null}
            </>
          ) : null}
          {eventType ? null : (
            <Form.Item label="推送时间" extra="按所选日期与时间推送" required>
              <Space.Compact>
                <Form.Item name="pushOffset" noStyle rules={[{ required: true, message: '请选择推送日期' }]}>
                  <Select style={{ width: 112 }} options={PUSH_OFFSETS.map((item) => ({ value: item, label: item }))} aria-label="推送日期" />
                </Form.Item>
                <Form.Item name="pushTime" noStyle rules={[{ required: true, message: '请选择推送时间' }]}>
                  <TimePicker format="HH:mm" minuteStep={5} showNow={false} placeholder="请选择时间" style={{ width: 160 }} />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          )}
          {type === '天气关怀' ? null : (
            <Form.Item name="points" label="关怀积分" extra="收到贺卡的同时会收到附赠积分">
              <InputNumber min={0} precision={0} addonAfter="分/人" placeholder="请输入积分" style={{ width: 200 }} />
            </Form.Item>
          )}
          <Form.Item name="templateKeys" label="选择模板" extra="可多选；仅展示与当前关怀场景匹配的模板" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个关怀模板' }]}>
            <CareTemplatePicker templates={matchedTemplates} />
          </Form.Item>
          {isPersonalType(type) ? (
            <>
              <Form.Item
                className="form-switch-beside-label"
                name="coworkerEnabled"
                label="开启同事祝福"
                valuePropName="checked"
                colon={false}
              >
                <Switch aria-label="开启同事祝福" />
              </Form.Item>
              {coworkerEnabled ? (
                <>
                  <Form.Item name="coworkerScope" label="同事范围" rules={[{ required: true, message: '请选择同事范围' }]}>
                    <Radio.Group>
                      <Radio value="所在末级部门">本部门（员工所在组织架构末级部门）</Radio>
                      <Radio value="根目录一级部门">全员（员工所在组织架构根目录下的一级部门）</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="推送时间" required>
                    <Space.Compact>
                      <Form.Item name="coworkerOffset" noStyle rules={[{ required: true, message: '请选择推送日期' }]}>
                        <Select style={{ width: 140 }} options={['提前1天', '提前2天', '提前3天', '当天'].map((item) => ({ value: item, label: item }))} />
                      </Form.Item>
                      <Form.Item name="coworkerTime" noStyle rules={[{ required: true, message: '请选择推送时间' }]}>
                        <TimePicker format="HH:mm" minuteStep={5} showNow={false} />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                </>
              ) : null}
            </>
          ) : null}
        </Card>
        <div className="sticky-form-actions">
          <Space>
            <Button onClick={onBack}>返回</Button>
            <Button type="primary" onClick={submit}>
              保存
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
