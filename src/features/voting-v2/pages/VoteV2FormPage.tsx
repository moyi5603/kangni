import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined, CheckOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  ColorPicker,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT } from '../../../shared/ui/imageUploadHint';
import { orgDepartmentTree } from '../../activities/model/activity';
import { RichTextField } from '../../activities/components/RichTextField';
import { VoteV2RecordsPanel, VoteV2ResultsPanel } from '../components/VoteV2DetailPanels';
import { VoteV2PhonePreview } from '../components/VoteV2PhonePreview';
import {
  firstVoteV2FormErrorName,
  firstVoteV2FormErrorTab,
  voteV2FormTabs,
  type VoteV2FormTab,
} from '../model/voteV2FormTabs';
import {
  canEditVoteV2Field,
  countVoteV2GroupOptions,
  defaultVoteV2Campaign,
  defaultVoteV2RuleHint,
  defaultVoteV2SignupFields,
  formatVoteV2GroupOptionCount,
  resolveVoteV2Status,
  isVoteV2DetailTab,
  type VoteV2DetailTab,
  validateVoteV2Quotas,
  validateVoteV2TimeOrder,
  voteV2IntroMax,
  voteV2IntroPlain,
  voteV2NameMax,
  voteV2QuotaMax,
  voteV2QuotaMin,
  voteV2ButtonNounMax,
  voteV2ButtonNounPresets,
  voteV2ContestantNounMax,
  voteV2GroupNameMax,
  voteV2ContestantNounPresets,
  clampVoteV2HomeColumns,
  clampVoteV2PcHomeColumns,
  voteV2HomeColumnOptions,
  voteV2PcHomeColumnOptions,
  mergeVoteV2PageDisplay,
  voteV2PageDisplayFromKeys,
  voteV2PageDisplayItems,
  voteV2PageDisplayKeys,
  voteV2LiveSaveImpact,
  voteV2ThemeColors,
  voteV2ThemeSolid,
  voteV2VoteUnitMax,
  voteV2VoteUnitPresets,
  voteV2Visibilities,
  type VoteV2Campaign,
  type VoteV2CoverKind,
  type VoteV2InternalVerify,
  type VoteV2PageDisplayKey,
  type VoteV2Period,
  type VoteV2SelectMode,
  type VoteV2ShareMode,
  type VoteV2SignupField,
  type VoteV2SignupLimit,
  type VoteV2Visibility,
} from '../model/voteV2';
import {
  nextVoteV2Id,
  upsertVoteV2,
  useVoteV2,
  useVoteV2Casts,
  useVoteV2Contestants,
} from '../model/voteV2Store';

type Props = {
  mode: 'create' | 'edit' | 'view';
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onNavigate: (page: string, recordId?: string) => void;
  onTabChange?: (tab: VoteV2DetailTab) => void;
};

type FormGroup = { id?: number; name: string };

type FormValues = {
  name: string;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs];
  intro: string;
  period: VoteV2Period;
  selectMode: VoteV2SelectMode;
  quotaPerUser: number;
  quotaPerContestant: number;
  minSelect: number;
  maxSelect: number;
  ruleHint: string;
  coverKind: VoteV2CoverKind;
  coverUrl: string;
  backgroundEnabled: boolean;
  backgroundUrl: string;
  themeColor: string;
  contestantNoun: string;
  voteButtonNoun: string;
  voteUnit: string;
  homeColumns: number;
  pcHomeColumns: number;
  pageDisplayKeys: VoteV2PageDisplayKey[];
  signupEnabled: boolean;
  signupLimit: VoteV2SignupLimit;
  signupNeedReview: boolean;
  signupSyncVoteTime: boolean;
  signupTimeRange: [dayjs.Dayjs, dayjs.Dayjs];
  signupFields: VoteV2SignupField[];
  groupingEnabled: boolean;
  groups: FormGroup[];
  showAllGroups: boolean;
  captchaEnabled: boolean;
  wechatBlacklistEnabled: boolean;
  smartAntiCheatEnabled: boolean;
  regionLimit: string;
  shareMode: VoteV2ShareMode;
  shareTitle: string;
  shareContent: string;
  followToVoteEnabled: boolean;
  adEnabled: boolean;
  popupEnabled: boolean;
  copyrightEnabled: boolean;
  copyrightText: string;
  copyrightUrl: string;
  internalVoteEnabled: boolean;
  internalVerify: VoteV2InternalVerify;
  visibility: VoteV2Visibility;
  departments?: string[];
};

const tabOrder = voteV2FormTabs;

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function campaignFormValues(editing: VoteV2Campaign): FormValues {
  return {
    name: editing.name,
    timeRange: [dayjs(editing.startAt), dayjs(editing.endAt)],
    intro: editing.intro,
    period: editing.period,
    selectMode: '单选',
    quotaPerUser: editing.quotaPerUser,
    quotaPerContestant: editing.quotaPerContestant,
    minSelect: 1,
    maxSelect: 1,
    ruleHint: editing.ruleHint,
    coverKind: editing.coverKind,
    coverUrl: editing.coverUrl,
    backgroundEnabled: editing.backgroundEnabled,
    backgroundUrl: editing.backgroundUrl,
    themeColor: editing.themeColor,
    contestantNoun: editing.contestantNoun,
    voteButtonNoun: editing.voteButtonNoun,
    voteUnit: editing.voteUnit,
    homeColumns: editing.homeColumns,
    pcHomeColumns: editing.pcHomeColumns,
    pageDisplayKeys: voteV2PageDisplayKeys(editing.pageDisplay),
    signupEnabled: editing.signupEnabled,
    signupLimit: editing.signupLimit,
    signupNeedReview: editing.signupNeedReview,
    signupSyncVoteTime: editing.signupSyncVoteTime,
    signupTimeRange: [dayjs(editing.signupStartAt || editing.startAt), dayjs(editing.signupEndAt || editing.endAt)],
    signupFields: editing.signupFields,
    groupingEnabled: editing.groupingEnabled,
    groups: editing.groups,
    showAllGroups: editing.showAllGroups,
    captchaEnabled: editing.captchaEnabled,
    wechatBlacklistEnabled: editing.wechatBlacklistEnabled,
    smartAntiCheatEnabled: editing.smartAntiCheatEnabled,
    regionLimit: editing.regionLimit,
    shareMode: editing.shareMode,
    shareTitle: editing.shareTitle,
    shareContent: editing.shareContent,
    followToVoteEnabled: editing.followToVoteEnabled,
    adEnabled: editing.adEnabled,
    popupEnabled: editing.popupEnabled,
    copyrightEnabled: editing.copyrightEnabled,
    copyrightText: editing.copyrightText,
    copyrightUrl: editing.copyrightUrl,
    internalVoteEnabled: editing.internalVoteEnabled,
    internalVerify: editing.internalVerify,
    visibility: editing.visibility,
    departments: editing.departments,
  };
}

function createDefaults(): Partial<FormValues> {
  return {
    intro: '',
    period: '每天',
    selectMode: '单选',
    quotaPerUser: 1,
    quotaPerContestant: 1,
    minSelect: 1,
    maxSelect: 1,
    ruleHint: defaultVoteV2RuleHint({
      period: '每天',
      selectMode: '单选',
      quotaPerUser: 1,
      minSelect: 1,
      maxSelect: 1,
      contestantNoun: '选手',
    }),
    coverKind: '图片',
    coverUrl: '',
    backgroundEnabled: false,
    backgroundUrl: '',
    themeColor: '#5282F0',
    contestantNoun: '选手',
    voteButtonNoun: '投票',
    voteUnit: '票',
    homeColumns: 2,
    pcHomeColumns: 3,
    pageDisplayKeys: voteV2PageDisplayItems.map((item) => item.key),
    signupEnabled: false,
    signupLimit: '一次',
    signupNeedReview: true,
    signupSyncVoteTime: true,
    signupFields: defaultVoteV2SignupFields.map((item) => ({ ...item })),
    groupingEnabled: false,
    groups: [],
    showAllGroups: true,
    captchaEnabled: true,
    wechatBlacklistEnabled: true,
    smartAntiCheatEnabled: true,
    regionLimit: '不限地区',
    shareMode: '微信分享',
    followToVoteEnabled: false,
    adEnabled: false,
    popupEnabled: false,
    copyrightEnabled: false,
    copyrightText: '我也要创建活动',
    internalVoteEnabled: false,
    internalVerify: '邀请码',
    visibility: '全员',
    departments: [],
  };
}

function sameThemeHex(left?: string, right?: string): boolean {
  return (left ?? '').toLowerCase() === (right ?? '').toLowerCase();
}

function VoteV2ThemeColorPicker({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const preset = voteV2ThemeColors.some((item) => sameThemeHex(item.value, value));
  return (
    <div className="vote-v2-theme-swatches">
      {voteV2ThemeColors.map((item) => {
        const active = sameThemeHex(value, item.value);
        return (
          <button
            key={item.value}
            type="button"
            className={`vote-v2-theme-swatch${active ? ' is-active' : ''}`}
            style={{ background: item.value }}
            aria-label={item.label}
            disabled={disabled}
            onClick={() => onChange?.(item.value)}
          >
            {active ? <CheckOutlined /> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
      <ColorPicker
        value={voteV2ThemeSolid(value ?? '')}
        disabled={disabled}
        disabledAlpha
        onChangeComplete={(color) => onChange?.(color.toHexString())}
      >
        <button
          type="button"
          className={`vote-v2-theme-swatch is-custom${!preset && value ? ' is-active' : ''}`}
          style={{ background: value || '#5282F0' }}
          aria-label="自定义"
          disabled={disabled}
        >
          {!preset && value ? <CheckOutlined /> : null}
          <span>自定义</span>
          <EditOutlined />
        </button>
      </ColorPicker>
    </div>
  );
}

function toFileList(url: string, name = '封面'): UploadFile[] {
  if (!url) return [];
  return [{ uid: '-1', name, status: 'done', url, thumbUrl: url }];
}

function VoteV2PresetOrInput({
  value,
  onChange,
  presets,
  max,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  presets: readonly string[];
  max: number;
  disabled?: boolean;
}) {
  const isPreset = presets.includes(value ?? '');
  return (
    <Flex gap={8} wrap="wrap" align="center">
      <Radio.Group
        disabled={disabled}
        value={isPreset ? value : '__custom__'}
        onChange={(event) => {
          const next = event.target.value;
          onChange?.(next === '__custom__' ? '' : next);
        }}
        options={[
          ...presets.map((item) => ({ value: item, label: item })),
          { value: '__custom__', label: '自定义' },
        ]}
      />
      {isPreset ? null : (
        <Input
          disabled={disabled}
          maxLength={max}
          showCount
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          style={{ width: max === 1 ? 96 : 128 }}
        />
      )}
    </Flex>
  );
}

export function VoteV2FormPage({ mode, recordId, tab, onBack, onNavigate, onTabChange }: Props) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState<VoteV2FormTab>('basic');
  const [localDetailTab, setLocalDetailTab] = useState<VoteV2DetailTab>('detail');
  const liveId = Number(recordId);
  const live = useVoteV2(Number.isFinite(liveId) ? liveId : -1);
  const casts = useVoteV2Casts();
  const editing = mode === 'create' ? undefined : live;
  const title = mode === 'view' ? '活动详情' : mode === 'edit' ? '编辑活动' : '新建活动';
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const status = editing ? resolveVoteV2Status(editing, now) : '未开始';
  const readonly = mode === 'view' || status === '已结束';
  const persisted = mode !== 'create' && Boolean(editing);
  const contestants = useVoteV2Contestants(persisted ? editing?.id : undefined);
  const pageTab = isVoteV2DetailTab(tab) ? tab : localDetailTab;

  const name = Form.useWatch('name', form) ?? '';
  const intro = Form.useWatch('intro', form) ?? '';
  const coverUrl = Form.useWatch('coverUrl', form) ?? '';
  const backgroundEnabled = Form.useWatch('backgroundEnabled', form) ?? editing?.backgroundEnabled ?? false;
  const backgroundUrl = Form.useWatch('backgroundUrl', form) ?? '';
  const themeColor = Form.useWatch('themeColor', form) ?? '#5282F0';
  const contestantNoun = Form.useWatch('contestantNoun', form) ?? '选手';
  const voteButtonNoun = Form.useWatch('voteButtonNoun', form) ?? '投票';
  const voteUnit = Form.useWatch('voteUnit', form) ?? '票';
  const homeColumns = Form.useWatch('homeColumns', form) ?? 2;
  const showAllGroups = Form.useWatch('showAllGroups', form) ?? editing?.showAllGroups ?? true;
  const pageDisplayKeys = Form.useWatch('pageDisplayKeys', form) ?? voteV2PageDisplayItems.map((item) => item.key);
  const pageDisplay = mergeVoteV2PageDisplay(voteV2PageDisplayFromKeys(pageDisplayKeys));
  const groupingEnabled = Form.useWatch('groupingEnabled', form) ?? editing?.groupingEnabled ?? false;
  const groups = Form.useWatch('groups', form) ?? editing?.groups ?? [];
  const period = Form.useWatch('period', form) ?? '每天';
  const selectMode = Form.useWatch('selectMode', form) ?? '单选';
  const quotaPerUser = Form.useWatch('quotaPerUser', form) ?? 1;
  const minSelect = Form.useWatch('minSelect', form) ?? 1;
  const maxSelect = Form.useWatch('maxSelect', form) ?? 1;
  const ruleHint = Form.useWatch('ruleHint', form) ?? '';
  const visibility = Form.useWatch('visibility', form) ?? editing?.visibility ?? '全员';
  const timeRange = Form.useWatch('timeRange', form);

  useEffect(() => {
    if (mode !== 'create' && !editing) {
      message.error('活动不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  const hintDefaultRef = useRef('');
  const ruleComboRef = useRef<string | null>(null);
  useEffect(() => {
    const next = defaultVoteV2RuleHint({
      period,
      selectMode,
      quotaPerUser,
      minSelect,
      maxSelect,
      contestantNoun,
    });
    const combo = `${period}-${selectMode}`;
    if (ruleComboRef.current == null) {
      ruleComboRef.current = combo;
      hintDefaultRef.current = next;
      return;
    }
    const comboChanged = ruleComboRef.current !== combo;
    ruleComboRef.current = combo;
    const current = form.getFieldValue('ruleHint') ?? '';
    if (comboChanged || !current || current === hintDefaultRef.current) {
      form.setFieldValue('ruleHint', next);
    }
    hintDefaultRef.current = next;
  }, [period, selectMode, quotaPerUser, minSelect, maxSelect, contestantNoun, form]);

  useEffect(() => {
    if (mode === 'create') {
      form.setFieldsValue(createDefaults());
      setDirty(false);
      return;
    }
    if (!editing) return;
    form.setFieldsValue(campaignFormValues(editing));
    setDirty(false);
  }, [mode, editing, form]);

  const leave = () => {
    if (!b2bStandards.form.unsavedChangesGuard || !dirty || readonly) {
      onBack();
      return;
    }
    modal.confirm({
      title: '确认离开？',
      content: '未保存的修改将丢失。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: onBack,
    });
  };

  const revealFirstFormError = (errorFields: Array<{ name: unknown }> | undefined) => {
    const tab = firstVoteV2FormErrorTab(errorFields);
    if (tab) setFormTab(tab);
    const fieldName = firstVoteV2FormErrorName(errorFields);
    const root = Array.isArray(fieldName) ? fieldName[0] : fieldName;
    window.setTimeout(() => {
      if (root === 'coverUrl') {
        document.getElementById('vote-v2-cover-upload')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        message.error('请上传封面图');
        return;
      }
      if (fieldName != null) {
        form.scrollToField(fieldName as string | number | (string | number)[], { block: 'center' });
      }
    }, 0);
  };

  const save = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch (error) {
      const errorFields = (error as { errorFields?: Array<{ name: unknown }> })?.errorFields;
      revealFirstFormError(errorFields);
      return;
    }
    const start = values.timeRange?.[0];
    const end = values.timeRange?.[1];
    if (!start || !end) {
      setFormTab('basic');
      message.error('请选择投票时间');
      return;
    }
    const startAt = start.format('YYYY-MM-DD HH:mm:ss');
    const endAt = end.format('YYYY-MM-DD HH:mm:ss');
    if (!validateVoteV2TimeOrder(startAt, endAt)) {
      setFormTab('basic');
      message.error('开始时间须早于结束时间');
      return;
    }
    const quotaError = validateVoteV2Quotas(values.quotaPerUser, values.quotaPerContestant);
    if (quotaError) {
      setFormTab('function');
      message.error(quotaError);
      return;
    }
    if (values.visibility === '按部门' && !(values.departments ?? []).length) {
      setFormTab('function');
      message.error('请选择部门');
      return;
    }
    const signupStart = editing?.signupSyncVoteTime === false
      ? editing.signupStartAt
      : startAt;
    const signupEnd = editing?.signupSyncVoteTime === false ? editing.signupEndAt : endAt;
    const id = editing?.id ?? nextVoteV2Id();
    const next = defaultVoteV2Campaign({
        ...editing,
        id,
        name: values.name.trim(),
        startAt,
        endAt,
        intro: values.intro?.trim() ?? '',
        period: values.period,
        selectMode: '单选',
        quotaPerUser: values.quotaPerUser,
        quotaPerContestant: values.quotaPerContestant,
        minSelect: 1,
        maxSelect: 1,
        ruleHint: values.ruleHint?.trim() || defaultVoteV2RuleHint({
          period: values.period,
          selectMode: '单选',
          quotaPerUser: values.quotaPerUser,
          minSelect: 1,
          maxSelect: 1,
          contestantNoun: values.contestantNoun || '选手',
        }),
        createdAt: editing?.createdAt ?? now,
        creator: editing?.creator ?? '陈产品',
        viewCount: editing?.viewCount ?? 0,
        coverKind: values.coverKind ?? '图片',
        coverUrl: values.coverUrl ?? '',
        backgroundEnabled: values.backgroundEnabled,
        backgroundUrl: values.backgroundUrl ?? '',
        themeColor: values.themeColor,
        contestantNoun: values.contestantNoun || '选手',
        voteButtonNoun: values.voteButtonNoun || '投票',
        voteUnit: values.voteUnit || '票',
        homeColumns: clampVoteV2HomeColumns(Number(values.homeColumns)),
        pcHomeColumns: clampVoteV2PcHomeColumns(Number(values.pcHomeColumns)),
        pageDisplay: voteV2PageDisplayFromKeys(values.pageDisplayKeys ?? []),
        signupEnabled: editing?.signupEnabled ?? false,
        signupLimit: editing?.signupLimit ?? '一次',
        signupNeedReview: editing?.signupNeedReview ?? true,
        signupSyncVoteTime: editing?.signupSyncVoteTime ?? true,
        signupStartAt: signupStart,
        signupEndAt: signupEnd,
        signupFields: editing?.signupFields ?? defaultVoteV2SignupFields.map((item) => ({ ...item })),
        groupingEnabled: values.groupingEnabled,
        groups: (values.groups ?? [])
          .filter((item) => item.name?.trim())
          .map((item, index) => ({
            id: item.id ?? index + 1,
            name: item.name.trim().slice(0, voteV2GroupNameMax),
          })),
        groupColumns: editing?.groupColumns ?? 3,
        showAllGroups: values.showAllGroups ?? true,
        captchaEnabled: editing?.captchaEnabled ?? true,
        wechatBlacklistEnabled: editing?.wechatBlacklistEnabled ?? true,
        smartAntiCheatEnabled: editing?.smartAntiCheatEnabled ?? true,
        regionLimit: editing?.regionLimit || '不限地区',
        shareMode: editing?.shareMode ?? '微信分享',
        shareTitle: editing?.shareTitle || values.name.trim(),
        shareContent: editing?.shareContent || '',
        followToVoteEnabled: editing?.followToVoteEnabled ?? false,
        adEnabled: editing?.adEnabled ?? false,
        popupEnabled: editing?.popupEnabled ?? false,
        copyrightEnabled: editing?.copyrightEnabled ?? false,
        copyrightText: editing?.copyrightText ?? '',
        copyrightUrl: editing?.copyrightUrl ?? '',
        internalVoteEnabled: editing?.internalVoteEnabled ?? false,
        internalVerify: editing?.internalVerify ?? '邀请码',
        visibility: values.visibility,
        departments: values.visibility === '按部门' ? values.departments ?? [] : [],
        pinned: editing?.pinned ?? false,
    });
    const persist = () => {
      setSaving(true);
      upsertVoteV2(next);
      setSaving(false);
      setDirty(false);
      message.success('已保存并发布');
      if (mode === 'create') onNavigate('vote-v2-edit', String(id));
      else onBack();
    };
    const impact = editing
      ? voteV2LiveSaveImpact({
          status,
          before: editing,
          after: next,
          casts: getVoteV2Casts(),
          now,
        })
      : undefined;
    if (impact) {
      modal.confirm({
        title: impact.title,
        content: (
          <div>
            {impact.lines.map((line) => (
              <p key={line} style={{ marginBottom: 8 }}>
                {line}
              </p>
            ))}
          </div>
        ),
        okText: '确认保存',
        cancelText: '取消',
        footer: modalFooter,
        onOk: persist,
      });
      return;
    }
    persist();
  };

  const lock = (field: Parameters<typeof canEditVoteV2Field>[1]) => readonly || !canEditVoteV2Field(status, field);
  const styleLocked = readonly;

  const basicPane = (
    <Card title="1、基本设置">
      <Form.Item
        name="name"
        label="活动名称"
        rules={[
          { required: true, whitespace: true, message: '请输入活动名称' },
          { max: voteV2NameMax, message: `不超过 ${voteV2NameMax} 个字` },
        ]}
      >
        <Input maxLength={voteV2NameMax} showCount placeholder="请输入活动名称，后期可修改" disabled={lock('name')} />
      </Form.Item>
      <Form.Item
        name="timeRange"
        label="投票时间"
        rules={[
          { required: true, message: '请选择投票时间' },
          {
            validator: async (_, value: FormValues['timeRange'] | null) => {
              if (!value?.[0] || !value?.[1]) return;
              if (!value[1].isAfter(value[0])) throw new Error('开始时间须早于结束时间');
            },
          },
        ]}
      >
        <DatePicker.RangePicker showTime style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} disabled={[lock('startAt'), lock('endAt')]} />
      </Form.Item>
      {mode === 'view' && editing ? (
        <Form.Item label="创建人">
          <Input value={editing.creator} disabled />
        </Form.Item>
      ) : null}
      <Form.Item
        name="intro"
        label="活动介绍"
        className="vote-v2-intro-field"
        rules={[
          {
            validator: async (_, value: string) => {
              if (voteV2IntroPlain(value ?? '').length > voteV2IntroMax) {
                throw new Error(`不超过 ${voteV2IntroMax} 个字`);
              }
            },
          },
        ]}
      >
        <RichTextField ariaLabel="活动介绍" placeholder="选填" disabled={lock('intro')} />
      </Form.Item>
    </Card>
  );

  const stylePane = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="2、样式设置">
        <Form.Item label="上传封面" extra={COVER_IMAGE_UPLOAD_HINT} required>
          <div id="vote-v2-cover-upload">
          <Upload
            accept={IMAGE_UPLOAD_ACCEPT}
            listType="picture-card"
            maxCount={1}
            disabled={styleLocked}
            fileList={toFileList(coverUrl)}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              const file = fileList[0];
              if (file?.originFileObj) {
                const reader = new FileReader();
                reader.onload = () => {
                  form.setFieldValue('coverUrl', String(reader.result));
                  setDirty(true);
                };
                reader.readAsDataURL(file.originFileObj);
              } else {
                form.setFieldValue('coverUrl', file?.url ?? '');
                setDirty(true);
              }
            }}
          >
            {coverUrl || styleLocked ? null : (
              <button type="button" className="cover-upload-trigger">
                <PlusOutlined />
                <span>上传封面</span>
              </button>
            )}
          </Upload>
          </div>
        </Form.Item>
        <Form.Item name="coverKind" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="coverUrl" hidden rules={[{ required: true, message: '请上传封面图' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="backgroundEnabled" label="背景图" valuePropName="checked" extra="开启后上传；固定手机高度，等比放大铺满">
          <Switch disabled={styleLocked} checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        {backgroundEnabled ? (
          <Form.Item label="上传背景图" extra="开启后上传；固定手机高度，等比放大铺满">
            <Upload
              accept={IMAGE_UPLOAD_ACCEPT}
              listType="picture-card"
              maxCount={1}
              disabled={styleLocked}
              fileList={toFileList(backgroundUrl, '背景')}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                const file = fileList[0];
                if (file?.originFileObj) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    form.setFieldValue('backgroundUrl', String(reader.result));
                    setDirty(true);
                  };
                  reader.readAsDataURL(file.originFileObj);
                } else {
                  form.setFieldValue('backgroundUrl', file?.url ?? '');
                  setDirty(true);
                }
              }}
            >
              {backgroundUrl || styleLocked ? null : (
                <button type="button" className="cover-upload-trigger">
                  <PlusOutlined />
                  <span>上传背景图</span>
                </button>
              )}
            </Upload>
          </Form.Item>
        ) : null}
        <Form.Item name="backgroundUrl" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="themeColor" label="主题颜色">
          <VoteV2ThemeColorPicker disabled={styleLocked} />
        </Form.Item>
        <Form.Item
          name="contestantNoun"
          label="选项称谓"
          extra="投票页选项的称谓，例如选手、作品等，投票页上会对应显示"
          rules={[
            { required: true, whitespace: true, message: '请选择或输入选项称谓' },
            { max: voteV2ContestantNounMax, message: `不超过 ${voteV2ContestantNounMax} 个字` },
          ]}
        >
          <VoteV2PresetOrInput presets={voteV2ContestantNounPresets} max={voteV2ContestantNounMax} disabled={styleLocked} />
        </Form.Item>
        <Form.Item
          name="voteButtonNoun"
          label="按钮名称"
          extra="投票按钮上会对应显示，自定义不超过 2 个字"
          rules={[
            { required: true, whitespace: true, message: '请选择或输入按钮名称' },
            { max: voteV2ButtonNounMax, message: `不超过 ${voteV2ButtonNounMax} 个字` },
          ]}
        >
          <VoteV2PresetOrInput presets={voteV2ButtonNounPresets} max={voteV2ButtonNounMax} disabled={styleLocked} />
        </Form.Item>
        <Form.Item
          name="voteUnit"
          label="单位设置"
          extra="选手票数后的单位，自定义不超过 1 个字"
          rules={[
            { required: true, whitespace: true, message: '请选择或输入单位' },
            { max: voteV2VoteUnitMax, message: `不超过 ${voteV2VoteUnitMax} 个字` },
          ]}
        >
          <VoteV2PresetOrInput presets={voteV2VoteUnitPresets} max={voteV2VoteUnitMax} disabled={styleLocked} />
        </Form.Item>
        <Form.Item name="homeColumns" label="移动端列数">
          <Radio.Group
            disabled={styleLocked}
            options={voteV2HomeColumnOptions.map((value) => ({
              value,
              label: value === 1 ? '一列' : value === 2 ? '二列' : '三列',
            }))}
          />
        </Form.Item>
        <Form.Item name="pcHomeColumns" label="PC端列数">
          <Radio.Group
            disabled={styleLocked}
            options={voteV2PcHomeColumnOptions.map((value) => ({
              value,
              label: value === 3 ? '三列' : value === 4 ? '四列' : '五列',
            }))}
          />
        </Form.Item>
        <Form.Item name="pageDisplayKeys" label="页面设置" extra="勾选后在投票页显示对应模块">
          <Checkbox.Group
            className="vote-v2-page-display"
            disabled={styleLocked}
            options={voteV2PageDisplayItems.map((item) => ({ value: item.key, label: item.label }))}
          />
        </Form.Item>
      </Card>
    </Space>
  );

  const functionPane = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="投票分组" extra="对选手报名和投票进行分组">
        <Form.Item name="groupingEnabled" label="分组设置" valuePropName="checked">
          <Switch disabled={readonly} />
        </Form.Item>
        {groupingEnabled ? (
          <>
            <Form.Item name="showAllGroups" label="显示全部分组" valuePropName="checked">
              <Switch disabled={readonly} checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
            <Form.List name="groups">
              {(fields, { add, remove, move }) => (
                <>
                  {fields.map((field, index) => {
                    const group = groups[index] ?? editing?.groups[index];
                    const groupId = group?.id;
                    const groupName = group?.name?.trim() || `分组${index + 1}`;
                    const optionCount = countVoteV2GroupOptions(contestants, groupId);
                    return (
                      <Flex key={field.key} gap={8} align="center" style={{ marginBottom: 8 }}>
                        <Form.Item {...field} name={[field.name, 'id']} hidden>
                          <InputNumber />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'name']}
                          className="vote-v2-group-name"
                          style={{ marginBottom: 0 }}
                          rules={[{ max: voteV2GroupNameMax, message: `不超过 ${voteV2GroupNameMax} 个字` }]}
                        >
                          <Input maxLength={voteV2GroupNameMax} showCount placeholder="请输入分组名称" disabled={readonly} />
                        </Form.Item>
                        <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                          {formatVoteV2GroupOptionCount(optionCount)}
                        </Typography.Text>
                        <Tooltip title="上移">
                          <Button
                            type="text"
                            icon={<ArrowUpOutlined />}
                            disabled={readonly || index === 0}
                            aria-label={`上移分组 ${groupName}`}
                            onClick={() => move(index, index - 1)}
                          />
                        </Tooltip>
                        <Tooltip title="下移">
                          <Button
                            type="text"
                            icon={<ArrowDownOutlined />}
                            disabled={readonly || index === fields.length - 1}
                            aria-label={`下移分组 ${groupName}`}
                            onClick={() => move(index, index + 1)}
                          />
                        </Tooltip>
                        <Button disabled={readonly} onClick={() => remove(field.name)}>
                          删除分组
                        </Button>
                      </Flex>
                    );
                  })}
                  <Button disabled={readonly} icon={<PlusOutlined />} onClick={() => add({ name: '' })}>
                    添加分组
                  </Button>
                </>
              )}
            </Form.List>
          </>
        ) : null}
      </Card>
      <Card title="参与范围">
        <Form.Item name="visibility" label="参与范围" rules={[{ required: true, message: '请选择参与范围' }]}>
          <Radio.Group options={optionsOf(voteV2Visibilities)} disabled={lock('visibility')} />
        </Form.Item>
        {visibility === '按部门' ? (
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
              disabled={lock('visibility')}
            />
          </Form.Item>
        ) : null}
      </Card>
      <Card title="投票规则设置">
        <Form.Item name="period" label="周期" extra={period === '总共' ? '活动期内累计' : '按自然日重置'} rules={[{ required: true }]}>
          <Radio.Group disabled={lock('period')}>
            <Radio value="每天">每天</Radio>
            <Radio value="总共">总共</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="selectMode" hidden>
          <Input />
        </Form.Item>
        <Flex className="vote-v2-rule-quota-row" gap={16} wrap="nowrap" align="flex-start">
          <Form.Item
            name="quotaPerUser"
            label="每人可投"
            className="vote-v2-rule-quota-item"
            labelCol={{ flex: '0 0 auto' }}
            wrapperCol={{ flex: '1 1 auto' }}
            rules={[{ required: true }]}
          >
            <InputNumber min={voteV2QuotaMin} max={voteV2QuotaMax} precision={0} addonAfter="票" disabled={lock('quotaPerUser')} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="quotaPerContestant"
            label="可为同一选项投"
            className="vote-v2-rule-quota-item"
            labelCol={{ flex: '0 0 auto' }}
            wrapperCol={{ flex: '1 1 auto' }}
            rules={[
              { required: true },
              {
                validator: async (_, value: number) => {
                  const error = validateVoteV2Quotas(form.getFieldValue('quotaPerUser'), value);
                  if (error) throw new Error(error);
                },
              },
            ]}
          >
            <InputNumber min={voteV2QuotaMin} max={voteV2QuotaMax} precision={0} addonAfter="票" disabled={lock('quotaPerContestant')} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Form.Item name="minSelect" hidden>
          <InputNumber />
        </Form.Item>
        <Form.Item name="maxSelect" hidden>
          <InputNumber />
        </Form.Item>
        <Form.Item name="ruleHint" label="规则提示" rules={[{ required: true, whitespace: true, message: '请输入规则提示' }]}>
          <Input disabled={lock('ruleHint')} />
        </Form.Item>
      </Card>
      <Card title="选项管理">
        <Alert type="info" showIcon message="保存发布后可添加选项" />
      </Card>
    </Space>
  );

  const formBody = (
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={() => setDirty(true)}
        initialValues={editing ? campaignFormValues(editing) : createDefaults()}
      >
        <div className="vote-v2-create">
          <VoteV2PhonePreview
            name={name}
            intro={intro}
            startAt={timeRange?.[0]?.format('YYYY-MM-DD HH:mm:ss')}
            endAt={timeRange?.[1]?.format('YYYY-MM-DD HH:mm:ss')}
            coverUrl={coverUrl}
            backgroundEnabled={backgroundEnabled}
            backgroundUrl={backgroundUrl}
            themeColor={themeColor}
            contestantNoun={contestantNoun}
            voteButtonNoun={voteButtonNoun}
            voteUnit={voteUnit}
            homeColumns={homeColumns}
            pageDisplay={pageDisplay}
            groupingEnabled={groupingEnabled}
            showAllGroups={showAllGroups}
            groups={groups.map((item, index) => ({
              id: item.id ?? index + 1,
              name: item.name,
            }))}
            period={period}
            selectMode="单选"
            quotaPerUser={quotaPerUser}
            minSelect={minSelect}
            maxSelect={maxSelect}
            ruleHint={ruleHint}
            viewCount={editing?.viewCount ?? 0}
            contestants={persisted ? contestants : undefined}
            selectionCampaignId={editing?.id}
          />
          <div className="vote-v2-create-form">
            <Tabs
              activeKey={formTab}
              onChange={(key) => setFormTab(key as VoteV2FormTab)}
              items={[
                { key: 'basic', label: '基本设置', forceRender: true, children: basicPane },
                { key: 'style', label: '样式设置', forceRender: true, children: stylePane },
                { key: 'function', label: '功能设置', forceRender: true, children: functionPane },
              ]}
            />
          </div>
        </div>
        {mode === 'view' ? null : (
        <div className="sticky-form-actions vote-v2-form-actions">
          {readonly ? (
            <Flex gap={8} justify="flex-end">
              <Button autoInsertSpace={false} onClick={onBack}>
                返回
              </Button>
            </Flex>
          ) : (
            <Space>
              <Button type="primary" loading={saving} onClick={() => void save()}>
                保存并发布
              </Button>
              <Button
                disabled={saving}
                onClick={() => {
                  const index = tabOrder.indexOf(formTab);
                  setFormTab(tabOrder[Math.min(index + 1, tabOrder.length - 1)]!);
                }}
              >
                下一步
              </Button>
              <Button disabled={saving} onClick={leave}>
                取消
              </Button>
            </Space>
          )}
        </div>
        )}
      </Form>
  );

  const changeDetailTab = (key: string) => {
    if (!isVoteV2DetailTab(key)) return;
    setLocalDetailTab(key);
    onTabChange?.(key);
  };

  return (
    <div className={mode === 'view' ? 'page-stack' : 'page-stack advanced-form-page vote-v2-create-page'}>
      <Breadcrumb
        separator=">"
        items={[
          { title: '投票' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={leave}>
                投票管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" justify="space-between" gap={16} wrap="wrap">
        <Typography.Title level={1} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {mode === 'view' ? (
          <Space>
            <Button type="primary" onClick={() => onNavigate('vote-v2-edit', recordId)}>
              去编辑
            </Button>
            <Button autoInsertSpace={false} onClick={onBack}>
              返回
            </Button>
          </Space>
        ) : null}
      </Flex>
      {mode === 'view' && editing ? (
        <Tabs
          activeKey={pageTab}
          onChange={changeDetailTab}
          items={[
            { key: 'detail', label: '详情', children: pageTab === 'detail' ? formBody : null },
            {
              key: 'results',
              label: '投票结果',
              children:
                pageTab === 'results' ? (
                  <VoteV2ResultsPanel campaign={editing} contestants={contestants} status={status} />
                ) : null,
            },
            {
              key: 'records',
              label: '投票记录',
              children:
                pageTab === 'records' ? (
                  <VoteV2RecordsPanel
                    campaign={editing}
                    contestants={contestants}
                    casts={casts}
                    status={status}
                  />
                ) : null,
            },
          ]}
        />
      ) : (
        formBody
      )}
    </div>
  );
}
