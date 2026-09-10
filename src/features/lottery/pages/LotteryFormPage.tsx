import { useMemo, useState } from 'react';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Alert,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Switch,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import { orgDepartmentTree } from '../../activities/model/activity';
import {
  LOTTERY_FORM_OPTIONS,
  LOTTERY_VISIBILITY_SCOPES,
  canEditLotteryPrizes,
  consolationProbability,
  lotteryStatusOf,
  migrateLotteryChanceSources,
  prizeProbabilitySum,
  validateLotteryPrizes,
  type LotteryFormKind,
  type LotteryPrize,
  type LotteryRecord,
  type LotteryVisibilityScope,
} from '../model/lottery';
import { getLottery, nextLotteryId, saveLottery } from '../model/lotteryStore';

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
  maxWins: number;
  consumeChanceOnWin: boolean;
  showRemaining: boolean;
  showWinners: boolean;
  missText: string;
  visibilityEnabled: boolean;
  visibilityScope: LotteryVisibilityScope;
  visibilityDepartments?: string[];
  visibilityFileName?: string;
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

export function LotteryFormPage({ mode, recordId, onBack, onSaved }: LotteryFormPageProps) {
  const { message } = App.useApp();
  const editing = mode === 'edit' ? getLottery(Number(recordId)) : undefined;
  const [form] = Form.useForm<LotteryFormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>(
    editing?.coverUrl ? [{ uid: 'cover', name: '封面', url: editing.coverUrl }] : [],
  );
  const [visibilityFileName, setVisibilityFileName] = useState(editing?.visibilityFileName ?? '');
  const [submitting, setSubmitting] = useState(false);

  const visibilityEnabled = Form.useWatch('visibilityEnabled', form) ?? editing?.visibilityEnabled ?? false;
  const visibilityScope = Form.useWatch('visibilityScope', form) ?? editing?.visibilityScope ?? '全员';
  const totalChanceEnabled = Form.useWatch('totalChanceEnabled', form) ?? editing?.totalChanceEnabled ?? false;
  const prizesWatch = Form.useWatch('prizes', form) ?? editing?.prizes ?? [];

  const prizeLocked = editing ? !canEditLotteryPrizes(editing) : false;
  const status = editing ? lotteryStatusOf(editing) : '未开始';
  const formLocked = status === '已结束' || status === '已停用';

  const initialValues = useMemo<Partial<LotteryFormValues>>(
    () => ({
      title: editing?.title,
      coverUrl: editing?.coverUrl ?? '',
      description: editing?.description ?? '',
      form: editing?.form ?? '大转盘',
      timeRange: editing ? [dayjs(editing.startAt, TIME_FORMAT), dayjs(editing.endAt, TIME_FORMAT)] : undefined,
      dailyChance: editing?.dailyChance ?? 1,
      totalChanceEnabled: editing?.totalChanceEnabled ?? false,
      totalChance: editing?.totalChance ?? 1,
      maxWins: editing?.maxWins ?? 1,
      consumeChanceOnWin: editing?.consumeChanceOnWin ?? true,
      showRemaining: editing?.showRemaining ?? false,
      showWinners: editing?.showWinners ?? true,
      missText: editing?.missText ?? '谢谢参与',
      visibilityEnabled: editing?.visibilityEnabled ?? false,
      visibilityScope: editing?.visibilityScope ?? '全员',
      visibilityDepartments: editing?.visibilityDepartments ?? [],
      visibilityFileName: editing?.visibilityFileName ?? '',
      prizes: editing?.prizes?.length ? editing.prizes : [emptyPrize(1)],
    }),
    [editing],
  );

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
        ...migrateLotteryChanceSources(editing ?? { dailyChance: values.dailyChance }),
        totalChanceEnabled: values.totalChanceEnabled,
        totalChance: values.totalChanceEnabled ? values.totalChance ?? values.dailyChance : 0,
        maxWins: values.maxWins,
        consumeChanceOnWin: values.consumeChanceOnWin,
        showRemaining: values.showRemaining,
        showWinners: values.showWinners,
        missText: values.missText.trim(),
        visibilityEnabled: values.visibilityEnabled,
        visibilityScope: values.visibilityEnabled ? values.visibilityScope : '全员',
        visibilityDepartments:
          values.visibilityEnabled && values.visibilityScope === '按部门' ? values.visibilityDepartments ?? [] : [],
        visibilityFileName:
          values.visibilityEnabled && values.visibilityScope === '导入' ? visibilityFileName : '',
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
        <Card title="抽奖机会" style={{ marginTop: 16 }}>
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
          <Form.Item name="visibilityEnabled" label="开启可见范围" valuePropName="checked" extra="开启后仅指定范围内员工可参与">
            <Switch />
          </Form.Item>
          {visibilityEnabled ? (
            <>
              <Form.Item name="visibilityScope" label="范围类型" rules={[{ required: true, message: '请选择范围类型' }]}>
                <Radio.Group options={LOTTERY_VISIBILITY_SCOPES.map((item) => ({ value: item, label: item }))} />
              </Form.Item>
              {visibilityScope === '按部门' ? (
                <Form.Item name="visibilityDepartments" label="选择部门" rules={[{ required: true, message: '请选择可见部门' }]}>
                  <TreeSelect
                    treeData={orgDepartmentTree}
                    treeCheckable
                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                    placeholder="请选择部门"
                    style={{ maxWidth: 480, width: '100%' }}
                  />
                </Form.Item>
              ) : null}
              {visibilityScope === '导入' ? (
                <>
                  <Form.Item label="导入名单" required extra="支持 Excel/CSV 文件，需包含员工工号列">
                    <Upload.Dragger
                      accept=".xlsx,.xls,.csv"
                      maxCount={1}
                      beforeUpload={() => false}
                      defaultFileList={visibilityFileName ? [{ uid: 'visibility', name: visibilityFileName }] : []}
                      onChange={({ fileList }) => {
                        const name = fileList[0]?.name ?? '';
                        setVisibilityFileName(name);
                        form.setFieldValue('visibilityFileName', name);
                      }}
                      onRemove={() => {
                        setVisibilityFileName('');
                        form.setFieldValue('visibilityFileName', '');
                      }}
                      style={{ maxWidth: 480 }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    </Upload.Dragger>
                  </Form.Item>
                  <Form.Item name="visibilityFileName" hidden rules={[{ required: true, message: '请上传名单文件' }]}>
                    <Input />
                  </Form.Item>
                </>
              ) : null}
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
