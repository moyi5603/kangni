import { useEffect, useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
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
import { orgDepartmentTree, orgPeoplePickerTree } from '../../activities/model/activity';
import { useMedals } from '../../activities/model/medalLibrary';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  awardTypes,
  nominatorModes,
  nomineeScopes,
  validateAwardTimeOrder,
  visibilityModes,
  voteSortRules,
  type AwardRankPrize,
  type AwardRecord,
  type AwardType,
  type NominatorMode,
  type NomineeScope,
  type VisibilityMode,
  type VoteSortRule,
} from '../model/award';
import { useAwardCertificates } from '../model/awardCertificateStore';
import { generateAwardCriteria, generateAwardIntro, generateAwardName } from '../model/awardAiAssist';
import { getAward, upsertAward } from '../model/awardStore';
import { AwardCertificateFormModal } from '../components/AwardCertificateFormModal';

type Props = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onNavigate: (page: string, recordId?: string) => void;
};

type RewardKey = 'points' | 'medal' | 'certificate';

type RankForm = {
  title: string;
  rewards: RewardKey[];
  points?: number;
  medalId?: string;
  certificateId?: number;
};

type FormValues = {
  name: string;
  type: AwardType;
  nominateEndAt: dayjs.Dayjs;
  voteEndAt: dayjs.Dayjs;
  intro: string;
  criteria: { text: string }[];
  winnerCount: number;
  ranks: RankForm[];
  visibility: VisibilityMode;
  visibilityDepartments?: string[];
  visibilityPeople?: string[];
  visibilityImportFileName?: string;
  nominatorMode: NominatorMode;
  nominatorDepartments?: string[];
  nominatorPeople?: string[];
  nominatorImportFileName?: string;
  nomineeScope: NomineeScope;
  nomineeDepartments?: string[];
  nomineeImportFileName?: string;
  autoPublishOnEnd: boolean;
  commentsEnabled: boolean;
  commentsNeedAudit: boolean;
  voteSortRule: VoteSortRule;
  coverUrl: string;
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function downloadCrowdImportTemplate(filename: string) {
  const lines = ['工号,姓名,部门', 'E1001,张悦,前端组', 'E1002,李明,前端组', 'E1003,陈产品,华东大区'];
  const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCoverFileList(coverUrl: string): UploadFile[] {
  if (!coverUrl) return [];
  return [{ uid: '-1', name: '评优封面', status: 'done', url: coverUrl, thumbUrl: coverUrl }];
}

function toImportFileList(fileName: string): UploadFile[] {
  if (!fileName) return [];
  return [{ uid: '-1', name: fileName, status: 'done' }];
}

function CrowdImportField({
  name,
  fileList,
  onFileListChange,
  templateName,
}: {
  name: 'visibilityImportFileName' | 'nominatorImportFileName' | 'nomineeImportFileName';
  fileList: UploadFile[];
  onFileListChange: (list: UploadFile[]) => void;
  templateName: string;
}) {
  return (
    <>
      <Form.Item name={name} hidden rules={[{ required: true, message: '请导入人群文件' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="导入人群" extra="支持 csv / xlsx。请按模板填写工号、姓名、部门。" required>
        <Space>
          <Upload
            accept=".csv,.xlsx"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: next }) => {
              const latest = next.slice(-1);
              onFileListChange(latest);
            }}
          >
            <Button>上传文件</Button>
          </Upload>
          <Button type="link" style={{ paddingInline: 0 }} onClick={() => downloadCrowdImportTemplate(templateName)}>
            下载导入模板
          </Button>
        </Space>
      </Form.Item>
    </>
  );
}

function rewardsOf(rank: AwardRankPrize): RewardKey[] {
  const rewards: RewardKey[] = [];
  if (rank.enablePoints) rewards.push('points');
  if (rank.enableMedal) rewards.push('medal');
  if (rank.enableCertificate) rewards.push('certificate');
  return rewards.length ? rewards : ['points'];
}

function toRankPrizes(ranks: RankForm[]): AwardRankPrize[] {
  return ranks.map((item, index) => ({
    rank: index + 1,
    title: item.title.trim(),
    enablePoints: item.rewards.includes('points'),
    enableMedal: item.rewards.includes('medal'),
    enableCertificate: item.rewards.includes('certificate'),
    points: item.rewards.includes('points') ? item.points : undefined,
    medalId: item.rewards.includes('medal') ? item.medalId : undefined,
    certificateId: item.rewards.includes('certificate') ? item.certificateId : undefined,
  }));
}

function defaultRanks(count: number): RankForm[] {
  return Array.from({ length: count }, (_, index) => ({
    title: `第${index + 1}名`,
    rewards: ['points'] as RewardKey[],
  }));
}

export function AwardFormPage({ mode, recordId, onBack, onNavigate }: Props) {
  const { message, modal } = App.useApp();
  const medals = useMedals();
  const certificates = useAwardCertificates();
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [writingName, setWritingName] = useState(false);
  const [writingIntro, setWritingIntro] = useState(false);
  const [writingCriteria, setWritingCriteria] = useState(false);
  const [visibilityImportList, setVisibilityImportList] = useState<UploadFile[]>([]);
  const [nominatorImportList, setNominatorImportList] = useState<UploadFile[]>([]);
  const [nomineeImportList, setNomineeImportList] = useState<UploadFile[]>([]);
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [certificateRankField, setCertificateRankField] = useState<number | null>(null);
  const editing = mode === 'edit' ? getAward(Number(recordId)) : undefined;
  const title = mode === 'edit' ? '编辑评优' : '新建评优';
  const winnerCount = Form.useWatch('winnerCount', form) ?? 3;
  const visibility = Form.useWatch('visibility', form);
  const nominatorMode = Form.useWatch('nominatorMode', form);
  const nomineeScope = Form.useWatch('nomineeScope', form);
  const commentsEnabled = Form.useWatch('commentsEnabled', form) ?? true;

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.warning('评优不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  useEffect(() => {
    if (mode === 'create') {
      form.setFieldsValue({
        type: '个人',
        winnerCount: 3,
        criteria: [{ text: '' }],
        ranks: defaultRanks(3),
        visibility: '全员',
        nominatorMode: '全员',
        nomineeScope: '全员',
        autoPublishOnEnd: false,
        commentsEnabled: true,
        commentsNeedAudit: false,
        voteSortRule: '按票数',
        coverUrl: '',
        visibilityImportFileName: '',
        nominatorImportFileName: '',
        nomineeImportFileName: '',
      });
      setVisibilityImportList([]);
      setNominatorImportList([]);
      setNomineeImportList([]);
      setCoverList([]);
      setDirty(false);
      return;
    }
    if (!editing) return;
    form.setFieldsValue({
      name: editing.name,
      type: editing.type,
      nominateEndAt: dayjs(editing.nominateEndAt),
      voteEndAt: dayjs(editing.voteEndAt),
      intro: editing.intro,
      criteria: editing.criteria.map((text) => ({ text })),
      winnerCount: editing.winnerCount,
      ranks: editing.ranks.map((rank) => ({
        title: rank.title,
        rewards: rewardsOf(rank),
        points: rank.points,
        medalId: rank.medalId,
        certificateId: rank.certificateId,
      })),
      visibility: editing.visibility,
      visibilityDepartments: editing.visibilityDepartments,
      visibilityPeople: editing.visibilityPeople,
      visibilityImportFileName: editing.visibilityImportFileName,
      nominatorMode: editing.nominatorMode,
      nominatorDepartments: editing.nominatorDepartments,
      nominatorPeople: editing.nominatorPeople,
      nominatorImportFileName: editing.nominatorImportFileName,
      nomineeScope: editing.nomineeScope,
      nomineeDepartments: editing.nomineeDepartments,
      nomineeImportFileName: editing.nomineeImportFileName,
      autoPublishOnEnd: editing.autoPublishOnEnd,
      commentsEnabled: editing.commentsEnabled,
      commentsNeedAudit: editing.commentsNeedAudit,
      voteSortRule: editing.voteSortRule,
      coverUrl: editing.coverUrl,
    });
    setVisibilityImportList(toImportFileList(editing.visibilityImportFileName));
    setNominatorImportList(toImportFileList(editing.nominatorImportFileName));
    setNomineeImportList(toImportFileList(editing.nomineeImportFileName));
    setCoverList(toCoverFileList(editing.coverUrl));
    setDirty(false);
  }, [mode, editing, form]);

  useEffect(() => {
    const ranks = (form.getFieldValue('ranks') ?? []) as RankForm[];
    if (ranks.length === winnerCount) return;
    form.setFieldValue(
      'ranks',
      Array.from({ length: winnerCount }, (_, index) => ranks[index] ?? { title: `第${index + 1}名`, rewards: ['points'] }),
    );
  }, [winnerCount, form]);

  const leave = () => {
    if (!b2bStandards.form.unsavedChangesGuard || !dirty) {
      onBack();
      return;
    }
    modal.confirm({
      title: '确认离开？',
      content: '未保存的修改将丢失。',
      okText: '确认',
      cancelText: '取消',
      onOk: onBack,
    });
  };

  const runAiAssist = (field: 'name' | 'intro' | 'criteria') => {
    if (field === 'name' && writingName) return;
    if (field === 'intro' && writingIntro) return;
    if (field === 'criteria' && writingCriteria) return;
    const setLoading = field === 'name' ? setWritingName : field === 'intro' ? setWritingIntro : setWritingCriteria;
    setLoading(true);
    window.setTimeout(() => {
      const type = (form.getFieldValue('type') as AwardType | undefined) ?? '个人';
      if (field === 'name') {
        form.setFieldValue('name', generateAwardName(type));
        message.success('已生成活动名称，可继续修改');
      } else if (field === 'intro') {
        const name = String(form.getFieldValue('name') ?? '');
        form.setFieldValue('intro', generateAwardIntro(type, name));
        message.success('已生成活动简介，可继续修改');
      } else {
        form.setFieldValue(
          'criteria',
          generateAwardCriteria(type).map((text) => ({ text })),
        );
        message.success('已生成评优标准，可继续修改');
      }
      setDirty(true);
      setLoading(false);
    }, 800);
  };

  const save = async () => {
    if (saving) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const nominate = values.nominateEndAt.format('YYYY-MM-DD HH:mm:ss');
    const vote = values.voteEndAt.format('YYYY-MM-DD HH:mm:ss');
    if (!validateAwardTimeOrder(nominate, vote)) {
      message.error('提名截止须早于投票截止');
      return;
    }
    setSaving(true);
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const record: AwardRecord = {
      id: mode === 'edit' && editing ? editing.id : Date.now(),
      name: values.name.trim(),
      type: values.type,
      nominateEndAt: nominate,
      voteEndAt: vote,
      intro: values.intro.trim(),
      criteria: values.criteria.map((item) => item.text.trim()).filter(Boolean),
      winnerCount: values.winnerCount,
      ranks: toRankPrizes(values.ranks),
      visibility: values.visibility,
      visibilityDepartments: values.visibility === '按部门' ? values.visibilityDepartments ?? [] : [],
      visibilityPeople: values.visibility === '自定义人员' ? values.visibilityPeople ?? [] : [],
      visibilityImportFileName: values.visibility === '导入人群' ? values.visibilityImportFileName ?? '' : '',
      nominatorMode: values.nominatorMode,
      nominatorDepartments: values.nominatorMode === '指定部门' ? values.nominatorDepartments ?? [] : [],
      nominatorPeople: values.nominatorMode === '指定人员' ? values.nominatorPeople ?? [] : [],
      nominatorImportFileName: values.nominatorMode === '导入人群' ? values.nominatorImportFileName ?? '' : '',
      nomineeScope: values.nomineeScope,
      nomineeDepartments: values.nomineeScope === '指定部门范围' ? values.nomineeDepartments ?? [] : [],
      nomineeImportFileName: values.nomineeScope === '导入人群' ? values.nomineeImportFileName ?? '' : '',
      publishStatus: editing?.publishStatus ?? '未发布',
      autoPublishOnEnd: values.autoPublishOnEnd,
      commentsEnabled: values.commentsEnabled,
      commentsNeedAudit: values.commentsEnabled ? Boolean(values.commentsNeedAudit) : false,
      voteSortRule: values.voteSortRule,
      coverUrl: values.coverUrl,
      pinned: editing?.pinned ?? false,
      results: editing?.results ?? [],
      rewardsGranted: editing?.rewardsGranted ?? false,
      rewardGrants: editing?.rewardGrants ?? [],
      resultPublic: editing?.resultPublic ?? false,
      publicityLocked: editing?.publicityLocked ?? false,
      nominationCount: editing?.nominationCount ?? 0,
      pendingNominationCount: editing?.pendingNominationCount ?? 0,
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    upsertAward(record);
    setDirty(false);
    setSaving(false);
    message.success(mode === 'edit' ? '已保存评优' : '已创建评优');
    onBack();
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '评优' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={leave}>
                评优管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">填写评优基础信息、名次奖励与高级设置后保存。</Typography.Text>
      </Flex>

      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={(changed) => {
          setDirty(true);
          if ('commentsEnabled' in changed && !changed.commentsEnabled) {
            form.setFieldValue('commentsNeedAudit', false);
          }
        }}
        initialValues={{
          type: '个人',
          winnerCount: 3,
          criteria: [{ text: '' }],
          ranks: defaultRanks(3),
          visibility: '全员',
          nominatorMode: '全员',
          nomineeScope: '全员',
          autoPublishOnEnd: false,
          commentsEnabled: true,
          commentsNeedAudit: false,
          voteSortRule: '按票数',
          coverUrl: '',
        }}
      >
        <Card title="基础信息">
          <Form.Item
            name="name"
            label="评优活动名称"
            rules={[
              { required: true, whitespace: true, message: '请输入评优活动名称' },
              { max: 50, message: '不超过 50 个字' },
            ]}
          >
            <Input maxLength={50} showCount placeholder="请输入评优活动名称" disabled={writingName} />
          </Form.Item>
          <Form.Item label=" " colon={false}>
            <Button loading={writingName} onClick={() => runAiAssist('name')}>
              帮我想
            </Button>
          </Form.Item>
          <Form.Item name="type" label="评优类型" rules={[{ required: true, message: '请选择评优类型' }]}>
            <Radio.Group options={optionsOf(awardTypes)} />
          </Form.Item>
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
                setDirty(true);
              }}
            >
              {coverList.length ? null : (
                <button type="button" className="cover-upload-trigger" aria-label="上传封面">
                  <PlusOutlined />
                  <span>上传封面</span>
                </button>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="coverUrl" hidden rules={[{ required: true, message: '请上传封面图' }]}>
            <Input />
          </Form.Item>
        </Card>

        <Card title="时间">
          <Form.Item name="nominateEndAt" label="提名截止" rules={[{ required: true, message: '请选择提名截止日期' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="voteEndAt" label="投票截止" rules={[{ required: true, message: '请选择投票截止日期' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Card>

        <Card title="内容">
          <Form.Item
            name="intro"
            label="活动简介"
            rules={[
              { required: true, whitespace: true, message: '请填写活动简介' },
              { max: 500, message: '不超过 500 个字' },
            ]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="请填写活动简介" disabled={writingIntro} />
          </Form.Item>
          <Form.Item label=" " colon={false}>
            <Button loading={writingIntro} onClick={() => runAiAssist('intro')}>
              帮我想
            </Button>
          </Form.Item>
          <Form.List
            name="criteria"
            rules={[
              {
                validator: async (_, value: { text?: string }[]) => {
                  const filled = (value ?? []).filter((item) => item?.text?.trim());
                  if (!filled.length) throw new Error('至少填写 1 条评优标准');
                  if ((value ?? []).length > 3) throw new Error('评优标准最多 3 条');
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    label={index === 0 ? '评优标准' : ' '}
                    key={field.key}
                    required={index === 0}
                    colon={index === 0}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'text']}
                        noStyle
                        rules={[{ required: true, whitespace: true, message: '请填写评优标准' }]}
                      >
                        <Input placeholder={`标准 ${index + 1}`} maxLength={80} disabled={writingCriteria} />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <Button
                          aria-label={`删除标准 ${index + 1}`}
                          onClick={() => remove(field.name)}
                          icon={<MinusCircleOutlined />}
                          disabled={writingCriteria}
                        />
                      ) : null}
                    </Space.Compact>
                  </Form.Item>
                ))}
                <Form.Item label=" " colon={false}>
                  <Space>
                    <Button loading={writingCriteria} onClick={() => runAiAssist('criteria')}>
                      帮我想
                    </Button>
                    {fields.length < 3 ? (
                      <Button type="dashed" onClick={() => add({ text: '' })} icon={<PlusOutlined />} disabled={writingCriteria}>
                        添加标准
                      </Button>
                    ) : null}
                  </Space>
                </Form.Item>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Card>

        <Card title="名次奖励">
          <Form.Item name="winnerCount" label="获奖名次数" rules={[{ required: true, message: '请设置获奖名次数' }]} extra="每名单独设置奖项。">
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.List name="ranks">
            {(fields) => (
              <>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small" title={`第 ${index + 1} 名`} style={{ marginBottom: 12 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'title']}
                      label="奖项名称"
                      rules={[{ required: true, whitespace: true, message: '请输入奖项名称' }]}
                    >
                      <Input placeholder="如：一等奖" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'rewards']}
                      label="奖励设置"
                      rules={[{ required: true, type: 'array', min: 1, message: '至少选择一种奖励' }]}
                    >
                      <Checkbox.Group
                        options={[
                          { value: 'points', label: '积分奖励' },
                          { value: 'medal', label: '勋章奖励' },
                          { value: 'certificate', label: '电子证书' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const rewards: RewardKey[] = form.getFieldValue(['ranks', field.name, 'rewards']) ?? [];
                        return (
                          <>
                            {rewards.includes('points') ? (
                              <Form.Item
                                name={[field.name, 'points']}
                                label="积分数值"
                                rules={[{ required: true, message: '请输入积分数值' }]}
                              >
                                <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="请输入积分" />
                              </Form.Item>
                            ) : null}
                            {rewards.includes('medal') ? (
                              <Form.Item
                                name={[field.name, 'medalId']}
                                label="勋章"
                                rules={[{ required: true, message: '请选择勋章' }]}
                              >
                                <Select
                                  placeholder="请选择勋章"
                                  options={medals.map((item) => ({ value: item.id, label: item.name }))}
                                />
                              </Form.Item>
                            ) : null}
                            {rewards.includes('certificate') ? (
                              <Form.Item
                                name={[field.name, 'certificateId']}
                                label="电子证书"
                                rules={[{ required: true, message: '请选择电子证书' }]}
                                extra={
                                  mode === 'create' ? (
                                    <Button
                                      type="link"
                                      onClick={() => {
                                        setCertificateRankField(field.name);
                                        setCertificateModalOpen(true);
                                      }}
                                    >
                                      新建评优证书
                                    </Button>
                                  ) : (
                                    <Button type="link" onClick={() => onNavigate('award-certificates')}>
                                      管理评优证书
                                    </Button>
                                  )
                                }
                              >
                                <Select
                                  placeholder="请选择评优证书"
                                  options={certificates.map((item) => ({ value: item.id, label: item.name }))}
                                />
                              </Form.Item>
                            ) : null}
                          </>
                        );
                      }}
                    </Form.Item>
                  </Card>
                ))}
              </>
            )}
          </Form.List>
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
                        <Radio.Group options={optionsOf(visibilityModes)} />
                      </Form.Item>
                      {visibility === '按部门' ? (
                        <Form.Item name="visibilityDepartments" label="选择部门" rules={[{ required: true, message: '请选择部门' }]}>
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
                      ) : null}
                      {visibility === '自定义人员' ? (
                        <Form.Item name="visibilityPeople" label="选择人员" rules={[{ required: true, message: '请选择人员' }]}>
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
                      ) : null}
                      {visibility === '导入人群' ? (
                        <CrowdImportField
                          name="visibilityImportFileName"
                          fileList={visibilityImportList}
                          templateName="评优可见人群导入模板.csv"
                          onFileListChange={(list) => {
                            setVisibilityImportList(list);
                            form.setFieldValue('visibilityImportFileName', list[0]?.name ?? '');
                            setDirty(true);
                          }}
                        />
                      ) : null}
                    </Card>

                    <Card title="提名人" size="small" className="activity-settings-card">
                      <Form.Item name="nominatorMode" label="提名人" rules={[{ required: true, message: '请选择提名人' }]}>
                        <Radio.Group options={optionsOf(nominatorModes)} />
                      </Form.Item>
                      {nominatorMode === '指定部门' ? (
                        <Form.Item name="nominatorDepartments" label="提名部门" rules={[{ required: true, message: '请选择部门' }]}>
                          <TreeSelect
                            treeData={orgDepartmentTree}
                            treeCheckable
                            treeDefaultExpandAll
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                            allowClear
                            placeholder="请选择部门"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ) : null}
                      {nominatorMode === '指定人员' ? (
                        <Form.Item name="nominatorPeople" label="指定人员" rules={[{ required: true, message: '请选择人员' }]}>
                          <TreeSelect
                            treeData={orgPeoplePickerTree}
                            treeCheckable
                            treeDefaultExpandAll
                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                            allowClear
                            placeholder="请选择人员"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ) : null}
                      {nominatorMode === '导入人群' ? (
                        <CrowdImportField
                          name="nominatorImportFileName"
                          fileList={nominatorImportList}
                          templateName="评优提名人导入模板.csv"
                          onFileListChange={(list) => {
                            setNominatorImportList(list);
                            form.setFieldValue('nominatorImportFileName', list[0]?.name ?? '');
                            setDirty(true);
                          }}
                        />
                      ) : null}

                      <Form.Item name="nomineeScope" label="提名范围" rules={[{ required: true, message: '请选择提名范围' }]}>
                        <Radio.Group options={optionsOf(nomineeScopes)} />
                      </Form.Item>
                      {nomineeScope === '指定部门范围' ? (
                        <Form.Item name="nomineeDepartments" label="被提部门" rules={[{ required: true, message: '请选择部门范围' }]}>
                          <TreeSelect
                            treeData={orgDepartmentTree}
                            treeCheckable
                            treeDefaultExpandAll
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                            allowClear
                            placeholder="请选择可被提名的部门"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ) : null}
                      {nomineeScope === '导入人群' ? (
                        <CrowdImportField
                          name="nomineeImportFileName"
                          fileList={nomineeImportList}
                          templateName="评优被提名人导入模板.csv"
                          onFileListChange={(list) => {
                            setNomineeImportList(list);
                            form.setFieldValue('nomineeImportFileName', list[0]?.name ?? '');
                            setDirty(true);
                          }}
                        />
                      ) : null}
                    </Card>

                    <Card title="投票" size="small" className="activity-settings-card">
                      <Form.Item name="voteSortRule" label="投票排序规则" rules={[{ required: true, message: '请选择投票排序规则' }]}>
                        <Radio.Group options={optionsOf(voteSortRules)} />
                      </Form.Item>
                    </Card>

                    <Card title="公示与评论" size="small" className="activity-settings-card">
                      <Form.Item
                        name="autoPublishOnEnd"
                        label="结束后自动公示"
                        valuePropName="checked"
                        extra="开启后按投票结果自动公示评优结果并发放奖励；未开启可手动上传获奖名单后再公示并发放奖励。"
                      >
                        <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                      </Form.Item>
                      <Form.Item
                        name="commentsEnabled"
                        label="评论区"
                        valuePropName="checked"
                        extra="关闭后详情页不展示评论区。"
                      >
                        <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                      </Form.Item>
                      {commentsEnabled ? (
                        <Form.Item
                          name="commentsNeedAudit"
                          label="评论是否需要审核"
                          valuePropName="checked"
                          extra="开启后评论需审核通过才对外展示。"
                        >
                          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                        </Form.Item>
                      ) : null}
                    </Card>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" loading={saving} onClick={() => void save()}>
              保存
            </Button>
            <Button disabled={saving} onClick={leave}>
              取消
            </Button>
          </Space>
        </div>
      </Form>
      <AwardCertificateFormModal
        open={certificateModalOpen}
        onCancel={() => {
          setCertificateModalOpen(false);
          setCertificateRankField(null);
        }}
        onSaved={(record) => {
          if (certificateRankField != null) {
            form.setFieldValue(['ranks', certificateRankField, 'certificateId'], record.id);
            setDirty(true);
          }
          setCertificateModalOpen(false);
          setCertificateRankField(null);
        }}
      />
    </div>
  );
}
