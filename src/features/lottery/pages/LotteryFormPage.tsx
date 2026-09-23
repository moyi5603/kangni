import { useMemo, useState } from 'react';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Alert,
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
import * as XLSX from 'xlsx';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import { orgDepartmentTree } from '../../activities/model/activity';
import {
  LOTTERY_AUDIENCE_KIND_OPTIONS,
  LOTTERY_AUDIENCE_TEMPLATE_FILENAME,
  LOTTERY_FORM_OPTIONS,
  LOTTERY_ORG_SCOPE_OPTIONS,
  canEditLotteryPrizes,
  consolationProbability,
  lotteryAudienceTemplateCsv,
  lotteryStatusOf,
  migrateLotteryChanceSources,
  needsAudienceImport,
  parseLotteryAudienceCsv,
  prizeProbabilitySum,
  validateLotteryAudience,
  validateLotteryChanceSources,
  validateLotteryPrizes,
  type LotteryAudienceKind,
  type LotteryAudiencePerson,
  type LotteryFormKind,
  type LotteryOrgScope,
  type LotteryPrize,
  type LotteryRecord,
} from '../model/lottery';
import { getLottery, nextLotteryId, saveLottery } from '../model/lotteryStore';
import { useCheckinThemes } from '../../checkin/model/checkinStore';

const { RangePicker } = DatePicker;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

type LotteryFormValues = {
  title: string;
  coverUrl: string;
  description?: string;
  form: LotteryFormKind;
  timeRange: [Dayjs, Dayjs];
  dailyChance: number;
  totalChanceEnabled: boolean;
  totalChance?: number;
  gainInitialEnabled: boolean;
  gainInitialCount: number;
  gainDailyLoginEnabled: boolean;
  gainDailyLoginCount: number;
  gainCheckinEnabled: boolean;
  gainCheckinCount: number;
  gainCheckinThemeIds: number[];
  maxWins: number;
  consumeChanceOnWin: boolean;
  showRemaining: boolean;
  showWinners: boolean;
  missText: string;
  audienceKind: LotteryAudienceKind;
  orgScope: LotteryOrgScope;
  audienceDepartments?: string[];
  audienceFileName?: string;
  prizes: LotteryPrize[];
};

type LotteryFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: (id: number) => void;
};

function emptyPrize(id: number): LotteryPrize {
  return { id, name: '', imageUrl: '', quantity: 1, drawn: 0, probability: 0 };
}

function downloadAudienceTemplate() {
  const blob = new Blob([lotteryAudienceTemplateCsv()], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = LOTTERY_AUDIENCE_TEMPLATE_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function readAudienceFile(file: File) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) {
    return parseLotteryAudienceCsv(await file.text());
  }
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return { ok: false as const, error: '请另存为 CSV 后再上传' };
    return parseLotteryAudienceCsv(XLSX.utils.sheet_to_csv(sheet));
  } catch {
    return { ok: false as const, error: '请另存为 CSV 后再上传' };
  }
}

export function LotteryFormPage({ mode, recordId, onBack, onSaved }: LotteryFormPageProps) {
  const { message } = App.useApp();
  const editing = mode === 'edit' ? getLottery(Number(recordId)) : undefined;
  const [form] = Form.useForm<LotteryFormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>(
    editing?.coverUrl ? [{ uid: 'cover', name: '封面', url: editing.coverUrl }] : [],
  );
  const [audienceFileName, setAudienceFileName] = useState(editing?.audienceFileName ?? '');
  const [audiencePeople, setAudiencePeople] = useState<LotteryAudiencePerson[]>(editing?.audiencePeople ?? []);
  const [audienceFileList, setAudienceFileList] = useState<UploadFile[]>(
    editing?.audienceFileName ? [{ uid: 'audience', name: editing.audienceFileName }] : [],
  );
  const [submitting, setSubmitting] = useState(false);

  const checkinThemes = useCheckinThemes();
  const audienceKind = Form.useWatch('audienceKind', form) ?? editing?.audienceKind ?? 'org';
  const orgScope = Form.useWatch('orgScope', form) ?? editing?.orgScope ?? 'all';
  const totalChanceEnabled = Form.useWatch('totalChanceEnabled', form) ?? editing?.totalChanceEnabled ?? false;
  const gainInitialEnabled = Form.useWatch('gainInitialEnabled', form) ?? editing?.gainInitialEnabled ?? false;
  const gainDailyLoginEnabled = Form.useWatch('gainDailyLoginEnabled', form) ?? editing?.gainDailyLoginEnabled ?? true;
  const gainCheckinEnabled = Form.useWatch('gainCheckinEnabled', form) ?? editing?.gainCheckinEnabled ?? false;
  const prizesWatch = Form.useWatch('prizes', form) ?? editing?.prizes ?? [];

  const prizeLocked = editing ? !canEditLotteryPrizes(editing) : false;
  const status = editing ? lotteryStatusOf(editing) : '未开始';
  const formLocked = status === '已结束' || status === '已停用';

  const initialValues = useMemo<Partial<LotteryFormValues>>(() => {
    const chanceSources = editing
      ? migrateLotteryChanceSources(editing)
      : {
          gainInitialEnabled: false,
          gainInitialCount: 1,
          gainDailyLoginEnabled: true,
          gainDailyLoginCount: 1,
          gainCheckinEnabled: false,
          gainCheckinCount: 1,
          gainCheckinThemeIds: [] as number[],
        };
    return {
      title: editing?.title,
      coverUrl: editing?.coverUrl ?? '',
      description: editing?.description ?? '',
      form: editing?.form ?? '大转盘',
      timeRange: editing ? [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)] : undefined,
      dailyChance: editing?.dailyChance ?? 1,
      totalChanceEnabled: editing?.totalChanceEnabled ?? false,
      totalChance: editing?.totalChance ?? 1,
      gainInitialEnabled: chanceSources.gainInitialEnabled,
      gainInitialCount: chanceSources.gainInitialCount,
      gainDailyLoginEnabled: chanceSources.gainDailyLoginEnabled,
      gainDailyLoginCount: chanceSources.gainDailyLoginCount,
      gainCheckinEnabled: chanceSources.gainCheckinEnabled,
      gainCheckinCount: chanceSources.gainCheckinCount,
      gainCheckinThemeIds: chanceSources.gainCheckinThemeIds,
      maxWins: editing?.maxWins ?? 1,
      consumeChanceOnWin: editing?.consumeChanceOnWin ?? true,
      showRemaining: editing?.showRemaining ?? false,
      showWinners: editing?.showWinners ?? true,
      missText: editing?.missText ?? '谢谢参与',
      audienceKind: editing?.audienceKind ?? 'org',
      orgScope: editing?.orgScope ?? 'all',
      audienceDepartments: editing?.audienceDepartments ?? [],
      audienceFileName: editing?.audienceFileName ?? '',
      prizes: editing?.prizes?.length ? editing.prizes : [emptyPrize(1)],
    };
  }, [editing]);

  const pageTitle = mode === 'create' ? '新建抽奖' : '编辑抽奖';
  const assigned = prizeProbabilitySum(prizesWatch);
  const consolation = consolationProbability(prizesWatch);

  const submit = async () => {
    const values = await form.validateFields();
    const prizeError = prizeLocked ? null : validateLotteryPrizes(values.prizes ?? []);
    if (prizeError) {
      message.error(prizeError);
      return;
    }
    if (values.totalChanceEnabled && (values.totalChance ?? 0) < values.dailyChance) {
      message.error('活动期间总次数不能小于每人每天次数');
      return;
    }
    const chanceSources = {
      gainInitialEnabled: values.gainInitialEnabled,
      gainInitialCount: values.gainInitialCount ?? 1,
      gainDailyLoginEnabled: values.gainDailyLoginEnabled,
      gainDailyLoginCount: values.gainDailyLoginCount ?? 1,
      gainCheckinEnabled: values.gainCheckinEnabled,
      gainCheckinCount: values.gainCheckinCount ?? 1,
      gainCheckinThemeIds: values.gainCheckinThemeIds ?? [],
    };
    const chanceError = validateLotteryChanceSources(chanceSources);
    if (chanceError) {
      message.error(chanceError);
      return;
    }
    const importRequired = needsAudienceImport(values.audienceKind, values.audienceKind === 'public' ? 'import' : values.orgScope);
    const audience = {
      audienceKind: values.audienceKind,
      orgScope: values.audienceKind === 'public' ? ('import' as const) : values.orgScope,
      audienceDepartments:
        values.audienceKind === 'org' && values.orgScope === 'department' ? values.audienceDepartments ?? [] : [],
      audienceFileName: importRequired ? audienceFileName : '',
      audiencePeople: importRequired ? audiencePeople : [],
    };
    const audienceError = validateLotteryAudience(audience);
    if (audienceError) {
      message.error(audienceError);
      return;
    }
    setSubmitting(true);
    try {
      const id = editing?.id ?? nextLotteryId();
      const record: LotteryRecord = {
        id,
        title: values.title.trim(),
        coverUrl: values.coverUrl,
        description: values.description?.trim() ?? '',
        form: values.form,
        startAt: values.timeRange[0].format(TIME_FORMAT),
        endAt: values.timeRange[1].format(TIME_FORMAT),
        dailyChance: values.dailyChance,
        ...chanceSources,
        totalChanceEnabled: values.totalChanceEnabled,
        totalChance: values.totalChanceEnabled ? values.totalChance ?? values.dailyChance : 0,
        maxWins: values.maxWins,
        consumeChanceOnWin: values.consumeChanceOnWin,
        showRemaining: values.showRemaining,
        showWinners: values.showWinners,
        missText: values.missText.trim(),
        ...audience,
        enabled: editing?.enabled ?? true,
        participants: editing?.participants ?? 0,
        prizes: prizeLocked ? (editing?.prizes ?? []) : values.prizes,
      };
      saveLottery(record);
      message.success(mode === 'create' ? '已创建抽奖' : '已保存抽奖');
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
          { title: '抽奖' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>抽奖管理</Button> },
          { title: pageTitle },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {pageTitle}
        </Typography.Title>
        <Typography.Text type="secondary">配置活动时间、抽奖形式、每日次数、奖品概率与参与范围。</Typography.Text>
      </div>
      {prizeLocked && !formLocked ? (
        <Alert type="warning" showIcon message="活动进行中，奖品名称、数量与概率不可修改。" />
      ) : null}
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
        <Card title="基本信息">
          <Form.Item
            name="title"
            label="抽奖名称"
            rules={[
              { required: true, message: '请输入抽奖名称' },
              { max: 40, message: '抽奖名称不超过 40 字' },
            ]}
          >
            <Input maxLength={40} showCount placeholder="请输入抽奖名称" style={{ maxWidth: 480 }} />
          </Form.Item>
          <Form.Item label="封面" required={mode === 'create'} extra={COVER_IMAGE_UPLOAD_HINT}>
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
          <Form.Item name="coverUrl" hidden rules={mode === 'create' ? [{ required: true, message: '请上传封面' }] : undefined}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="活动说明">
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="介绍抽奖玩法与注意事项" style={{ maxWidth: 640 }} />
          </Form.Item>
        </Card>
        <Card title="活动时间与玩法" style={{ marginTop: 16 }}>
          <Form.Item name="timeRange" label="活动时间" rules={[{ required: true, message: '请选择活动开始与结束时间' }]}>
            <RangePicker showTime={{ format: 'HH:mm' }} format={TIME_FORMAT} placeholder={['开始时间', '结束时间']} />
          </Form.Item>
          <Form.Item name="form" label="抽奖形式" rules={[{ required: true, message: '请选择抽奖形式' }]}>
            <Radio.Group options={LOTTERY_FORM_OPTIONS.map((item) => ({ value: item, label: item }))} />
          </Form.Item>
        </Card>
        <Card title="次数获取途径" style={{ marginTop: 16 }}>
          <Form.Item name="gainInitialEnabled" label="每人初始" valuePropName="checked">
            <Switch />
          </Form.Item>
          {gainInitialEnabled ? (
            <Form.Item name="gainInitialCount" label="初始次数" rules={[{ required: true, message: '请填写每人初始次数' }]}>
              <InputNumber min={1} max={99} precision={0} style={{ width: 160 }} />
            </Form.Item>
          ) : null}
          <Form.Item name="gainDailyLoginEnabled" label="每日登录" valuePropName="checked">
            <Switch />
          </Form.Item>
          {gainDailyLoginEnabled ? (
            <Form.Item name="gainDailyLoginCount" label="每天+n" rules={[{ required: true, message: '请填写每日登录次数' }]}>
              <InputNumber min={1} max={99} precision={0} style={{ width: 160 }} />
            </Form.Item>
          ) : null}
          <Form.Item label="打卡">
            <Flex align="center" gap={12} wrap="wrap">
              <Form.Item name="gainCheckinEnabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <span>每次打卡可得</span>
              <Form.Item
                name="gainCheckinCount"
                noStyle
                rules={gainCheckinEnabled ? [{ required: true, message: '请填写每次打卡可得次数' }] : []}
              >
                <InputNumber min={1} max={99} precision={0} disabled={!gainCheckinEnabled} style={{ width: 120 }} />
              </Form.Item>
              <span>次</span>
            </Flex>
          </Form.Item>
          {gainCheckinEnabled ? (
            <Form.Item
              name="gainCheckinThemeIds"
              label="关联主题"
              extra="关联主题每次成功打卡按「每次打卡可得」入账"
              rules={[{ required: true, type: 'array', min: 1, message: '请选择关联打卡主题' }]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="请选择打卡主题"
                optionFilterProp="label"
                options={checkinThemes.map((theme) => ({ value: theme.id, label: theme.title }))}
                style={{ maxWidth: 480, width: '100%' }}
              />
            </Form.Item>
          ) : null}
        </Card>
        <Card title="消耗上限" style={{ marginTop: 16 }}>
          <Form.Item name="dailyChance" label="每人每天次数" rules={[{ required: true, message: '请输入每天次数' }]}>
            <InputNumber min={1} max={99} precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="totalChanceEnabled" label="限制总次数" valuePropName="checked" extra="开启后限制活动期间累计抽奖次数">
            <Switch />
          </Form.Item>
          {totalChanceEnabled ? (
            <Form.Item name="totalChance" label="活动期间总次数" rules={[{ required: true, message: '请输入总次数' }]}>
              <InputNumber min={1} max={999} precision={0} style={{ width: 160 }} />
            </Form.Item>
          ) : null}
        </Card>
        <Card title="奖品设置" style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            已分配 {assigned}% · 谢谢参与 {consolation}%
          </Typography.Text>
          <Form.List name="prizes">
            {(fields, { add, remove, move }) => (
              <div style={{ marginTop: 12 }}>
                {fields.map((field, index) => (
                  <Space key={field.key} align="start" wrap style={{ display: 'flex', marginBottom: 12 }}>
                    <Form.Item {...field} name={[field.name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'drawn']} hidden>
                      <InputNumber />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      label={index === 0 ? '奖品名称' : ' '}
                      rules={[{ required: true, message: '请输入奖品名称' }]}
                      style={{ marginBottom: 0, minWidth: 200 }}
                    >
                      <Input placeholder="奖品名称" disabled={prizeLocked} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      label={index === 0 ? '数量' : ' '}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} precision={0} disabled={prizeLocked} style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'probability']}
                      label={index === 0 ? '中奖概率(%)' : ' '}
                      rules={[{ required: true, message: '请输入概率' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={100} step={0.1} disabled={prizeLocked} style={{ width: 120 }} />
                    </Form.Item>
                    <Space style={{ paddingTop: index === 0 ? 30 : 0 }}>
                      <Button type="link" size="small" disabled={prizeLocked || index === 0} onClick={() => move(index, index - 1)}>
                        上移
                      </Button>
                      <Button type="link" size="small" disabled={prizeLocked || index === fields.length - 1} onClick={() => move(index, index + 1)}>
                        下移
                      </Button>
                      <Button type="link" size="small" danger disabled={prizeLocked || fields.length <= 1} onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    </Space>
                  </Space>
                ))}
                <Button type="dashed" disabled={prizeLocked} onClick={() => add(emptyPrize(Date.now()))}>
                  添加奖品
                </Button>
              </div>
            )}
          </Form.List>
        </Card>
        <Card title="参与范围" style={{ marginTop: 16 }}>
          <Form.Item name="audienceKind" label="参与范围" rules={[{ required: true, message: '请选择参与范围' }]}>
            <Radio.Group options={LOTTERY_AUDIENCE_KIND_OPTIONS} />
          </Form.Item>
          {audienceKind === 'org' ? (
            <Form.Item name="orgScope" label="组织范围" rules={[{ required: true, message: '请选择组织范围' }]}>
              <Radio.Group options={LOTTERY_ORG_SCOPE_OPTIONS} />
            </Form.Item>
          ) : null}
          {audienceKind === 'org' && orgScope === 'department' ? (
            <Form.Item name="audienceDepartments" label="选择部门" rules={[{ required: true, message: '请选择可见部门' }]}>
              <TreeSelect
                treeData={orgDepartmentTree}
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                placeholder="请选择部门"
                style={{ maxWidth: 480, width: '100%' }}
              />
            </Form.Item>
          ) : null}
          {needsAudienceImport(audienceKind, audienceKind === 'public' ? 'import' : orgScope) ? (
            <>
              <Form.Item
                label="导入名单"
                required
                extra="请按模板填写姓名、手机号。支持 csv / xlsx。"
              >
                <Space direction="vertical" size={8} style={{ width: '100%', maxWidth: 480 }}>
                  <Button type="link" style={{ paddingInline: 0 }} onClick={downloadAudienceTemplate}>
                    下载导入模板
                  </Button>
                  <Upload.Dragger
                    accept=".csv,.xlsx,.xls"
                    maxCount={1}
                    beforeUpload={() => false}
                    fileList={audienceFileList}
                    onChange={async ({ fileList }) => {
                      const file = fileList[0];
                      setAudienceFileList(fileList.slice(-1));
                      if (!file) {
                        setAudienceFileName('');
                        setAudiencePeople([]);
                        form.setFieldValue('audienceFileName', '');
                        return;
                      }
                      const origin = file.originFileObj as File | undefined;
                      if (!origin) {
                        setAudienceFileName(file.name);
                        form.setFieldValue('audienceFileName', file.name);
                        return;
                      }
                      const parsed = await readAudienceFile(origin);
                      if (!parsed.ok) {
                        message.error(parsed.error);
                        setAudienceFileList([]);
                        setAudienceFileName('');
                        setAudiencePeople([]);
                        form.setFieldValue('audienceFileName', '');
                        return;
                      }
                      if (!parsed.people.length) {
                        message.error('名单中没有有效的姓名和手机号');
                        setAudienceFileList([]);
                        setAudienceFileName('');
                        setAudiencePeople([]);
                        form.setFieldValue('audienceFileName', '');
                        return;
                      }
                      setAudienceFileName(origin.name);
                      setAudiencePeople(parsed.people);
                      form.setFieldValue('audienceFileName', origin.name);
                      message.success(
                        parsed.skipped > 0
                          ? `已导入 ${parsed.people.length} 人，跳过 ${parsed.skipped} 行`
                          : `已导入 ${parsed.people.length} 人`,
                      );
                    }}
                    onRemove={() => {
                      setAudienceFileList([]);
                      setAudienceFileName('');
                      setAudiencePeople([]);
                      form.setFieldValue('audienceFileName', '');
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  </Upload.Dragger>
                </Space>
              </Form.Item>
              <Form.Item name="audienceFileName" hidden rules={[{ required: true, message: '请导入参与名单' }]}>
                <Input />
              </Form.Item>
            </>
          ) : null}
        </Card>
        <Card title="其他规则" style={{ marginTop: 16 }}>
          <Form.Item name="maxWins" label="每人最多中奖" rules={[{ required: true, message: '请输入最多中奖次数' }]}>
            <InputNumber min={1} max={99} precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="consumeChanceOnWin" label="中奖占用次数" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="showRemaining" label="展示剩余奖品" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="showWinners" label="公示中奖名单" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="missText" label="未中奖文案" rules={[{ required: true, message: '请输入未中奖文案' }]}>
            <Input maxLength={20} showCount placeholder="谢谢参与" style={{ maxWidth: 320 }} />
          </Form.Item>
        </Card>
        <div className="sticky-form-actions">
          <Space>
            <Button onClick={onBack}>取消</Button>
            <Button type="primary" loading={submitting} disabled={formLocked} onClick={submit}>
              保存
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
