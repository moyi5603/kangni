import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
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
  Space,
  Switch,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import { orgDepartmentTree, orgPeopleByName, orgPeoplePickerTree, personDepartment } from '../../activities/model/activity';
import { employeeAvatarColor, employeeAvatarLetter } from '../../activities/model/employeeAvatar';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  canEditVoteField,
  canMutateVoteOption,
  isChoiceQuestionType,
  isImageQuestionType,
  isPersonQuestionType,
  isVisualChoiceQuestionType,
  parseVoteCrowdCsv,
  resolveVoteImageLayout,
  resolveVoteStatus,
  validateVoteTimeOrder,
  voteChoiceLimit,
  voteImageLayouts,
  votePersonChoiceTitle,
  voteQuestionTypes,
  voteScoreAbsMax,
  voteScoreAbsMin,
  voteScoreDefaultMax,
  voteScoreDefaultMin,
  voteScoreRangeError,
  voteVisualSubtitleMax,
  voteVisualTitleMax,
  voteVisibilities,
  type VoteCampaign,
  type VoteChoice,
  type VoteImageLayout,
  type VoteOption,
  type VoteOptionKind,
  type VoteQuestion,
  type VoteQuestionType,
  type VoteQuotaMode,
  type VoteType,
  type VoteVisibility,
} from '../model/voting';
import {
  getVote,
  getVoteAnswers,
  getVoteBallots,
  getVoteOptions,
  getVoteQuestions,
  nextChoiceId,
  nextOptionId,
  nextQuestionId,
  nextVoteId,
  upsertVote,
} from '../model/voteStore';

type Props = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onNavigate: (page: string, recordId?: string) => void;
};

type FormChoice = {
  id?: number;
  label: string;
  subtitle: string;
  imageUrl: string;
  employeeId: string;
};

type FormQuestion = {
  id?: number;
  type: VoteQuestionType;
  stem: string;
  choices: FormChoice[];
  minScore: number;
  maxScore: number;
  imageLayout: VoteImageLayout;
};

type FormOption = {
  id?: number;
  kind: VoteOptionKind;
  label: string;
  imageUrl: string;
  employeeId: string;
  workTitle: string;
  workCover: string;
  workIntro: string;
};

type FormValues = {
  name: string;
  type: VoteType;
  anonymous: boolean;
  timeRange: [dayjs.Dayjs, dayjs.Dayjs];
  intro: string;
  questions: FormQuestion[];
  options: FormOption[];
  quotaMode: VoteQuotaMode;
  quota: number;
  allowComment: boolean;
  allowStackOnSameOption: boolean;
  visibility: VoteVisibility;
  departments?: string[];
  people?: string[];
  importFileName?: string;
};

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

function downloadCrowdImportTemplate() {
  const lines = ['工号,姓名,部门', 'E1001,张悦,前端组', 'E1002,李明,前端组', 'E1003,陈产品,华东大区'];
  const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '投票参与人群导入模板.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toImportFileList(fileName: string): UploadFile[] {
  if (!fileName) return [];
  return [{ uid: '-1', name: fileName, status: 'done' }];
}

function emptyChoice(): FormChoice {
  return { label: '', subtitle: '', imageUrl: '', employeeId: '' };
}

function emptyQuestion(type: VoteQuestionType): FormQuestion {
  return {
    type,
    stem: '',
    choices: isPersonQuestionType(type) ? [] : isChoiceQuestionType(type) ? [emptyChoice(), emptyChoice()] : [],
    minScore: voteScoreDefaultMin,
    maxScore: voteScoreDefaultMax,
    imageLayout: '上图下文',
  };
}

function emptyContestOption(): FormOption {
  return { kind: '员工', label: '', imageUrl: '', employeeId: '', workTitle: '', workCover: '', workIntro: '' };
}

function campaignFormValues(editing: VoteCampaign): FormValues {
  return {
    name: editing.name,
    type: editing.type,
    anonymous: editing.anonymous,
    timeRange: [dayjs(editing.startAt), dayjs(editing.endAt)],
    intro: editing.intro,
    questions: getVoteQuestions(editing.id).map((item) => ({
      id: item.id,
      type: item.type,
      stem: item.stem,
      choices: item.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        subtitle: choice.subtitle ?? '',
        imageUrl: choice.imageUrl,
        employeeId: choice.employeeId ?? '',
      })),
      minScore: item.minScore,
      maxScore: item.maxScore,
      imageLayout: resolveVoteImageLayout(item.imageLayout),
    })),
    options: getVoteOptions(editing.id).map((item) => ({
      id: item.id,
      kind: item.kind,
      label: item.label,
      imageUrl: item.imageUrl,
      employeeId: item.employeeId,
      workTitle: item.workTitle,
      workCover: item.workCover,
      workIntro: item.workIntro,
    })),
    quotaMode: editing.quotaMode,
    quota: editing.quota,
    allowComment: editing.allowComment,
    allowStackOnSameOption: editing.allowStackOnSameOption,
    visibility: editing.visibility,
    departments: editing.departments,
    people: editing.people,
    importFileName: editing.importFileName,
  };
}

function toFileList(url: string, name: string): UploadFile[] {
  if (!url) return [];
  return [{ uid: '-1', name, status: 'done', url, thumbUrl: url }];
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function VoteFormPage({ mode, recordId, onBack, onNavigate }: Props) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = mode === 'edit' ? getVote(Number(recordId)) : undefined;
  const title = mode === 'edit' ? '编辑投票' : '新建投票';
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const status = editing ? resolveVoteStatus(editing, now) : '未开始';
  const type = Form.useWatch('type', form) ?? '普通投票';
  const visibility = Form.useWatch('visibility', form);
  const quotaMode = Form.useWatch('quotaMode', form) ?? '每天';
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const [importedPeople, setImportedPeople] = useState<string[]>([]);
  const ballotOptionIds = new Set((editing ? getVoteBallots(editing.id) : []).map((item) => item.optionId));
  const answeredQuestionIds = new Set((editing ? getVoteAnswers(editing.id) : []).map((item) => item.questionId));

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.error('投票不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  useEffect(() => {
    if (mode === 'edit' && editing && status === '已结束') {
      message.info('已结束的投票不能编辑');
      onNavigate('vote-detail', String(editing.id));
    }
  }, [mode, editing, status, message, onNavigate]);

  useEffect(() => {
    if (mode === 'create') {
      form.setFieldsValue({
        type: '普通投票',
        anonymous: false,
        intro: '',
        questions: [],
        options: [],
        quotaMode: '每天',
        quota: 1,
        allowComment: false,
        allowStackOnSameOption: false,
        visibility: '全员',
        departments: [],
        people: [],
        importFileName: '',
      });
      setImportList([]);
      setImportedPeople([]);
      setDirty(false);
      return;
    }
    if (!editing) return;
    form.setFieldsValue(campaignFormValues(editing));
    setImportList(toImportFileList(editing.importFileName));
    setImportedPeople(editing.importedPeople);
    setDirty(false);
  }, [mode, editing, form]);

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
      footer: modalFooter,
      onOk: onBack,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    const start = values.timeRange?.[0];
    const end = values.timeRange?.[1];
    if (!start || !end) {
      message.error('请选择投票时间');
      return;
    }
    const startAt = start.format('YYYY-MM-DD HH:mm:ss');
    const endAt = end.format('YYYY-MM-DD HH:mm:ss');
    if (!validateVoteTimeOrder(startAt, endAt)) {
      message.error('开始时间须早于结束时间');
      return;
    }
    if (values.type === '普通投票') {
      const rows = values.questions ?? [];
      if (rows.length < 1 || rows.length > 20) {
        message.error('题目须为 1～20 道');
        return;
      }
      for (const question of rows) {
        if (!question.stem?.trim()) {
          message.error('请填写题干');
          return;
        }
        if (isChoiceQuestionType(question.type)) {
          const choices = question.choices ?? [];
          const max = voteChoiceLimit(question.type);
          if (choices.length < 2 || choices.length > max) {
            message.error(isPersonQuestionType(question.type) ? `人员选项须为 2～${max} 个` : `选择题选项须为 2～${max} 个`);
            return;
          }
          if (isImageQuestionType(question.type)) {
            if (choices.some((item) => !item.imageUrl)) {
              message.error('请上传选项图片');
              return;
            }
          } else if (isPersonQuestionType(question.type)) {
            const labels = choices.map((item) => item.label.trim());
            if (labels.some((item) => !item)) {
              message.error('请填写人员姓名');
              return;
            }
            const people = choices.map((item) => item.employeeId).filter(Boolean);
            if (people.length !== choices.length || new Set(people).size !== people.length) {
              message.error('人员不能重复');
              return;
            }
          } else {
            const labels = choices.map((item) => item.label.trim());
            if (labels.some((item) => !item)) {
              message.error('请填写选项');
              return;
            }
            if (new Set(labels).size !== labels.length) {
              message.error('选项不能重复');
              return;
            }
          }
        }
        if (question.type === '打分题') {
          const scoreError = voteScoreRangeError(question.minScore, question.maxScore);
          if (scoreError) {
            message.error(scoreError);
            return;
          }
        }
      }
    } else {
      const rows = values.options ?? [];
      if (rows.length < 2 || rows.length > 20) {
        message.error('选项须为 2～20 个');
        return;
      }
      const people = rows.filter((item) => item.kind === '员工').map((item) => item.employeeId);
      const works = rows.filter((item) => item.kind === '作品').map((item) => item.workTitle.trim());
      if (rows.some((item) => item.kind === '员工' && !item.employeeId)) {
        message.error('请选择候选人');
        return;
      }
      if (rows.some((item) => item.kind === '作品' && (!item.workTitle.trim() || !item.workCover))) {
        message.error('请填写作品标题并上传封面');
        return;
      }
      if (new Set(people).size !== people.length) {
        message.error('候选人不能重复');
        return;
      }
      if (new Set(works).size !== works.length) {
        message.error('作品标题不能重复');
        return;
      }
    }
    if (values.visibility === '按部门' && !(values.departments ?? []).length) {
      message.error('请选择部门');
      return;
    }
    if (values.visibility === '自定义人员' && !(values.people ?? []).length) {
      message.error('请选择人员');
      return;
    }
    if (values.visibility === '导入人群') {
      if (!values.importFileName) {
        message.error('请导入人群文件');
        return;
      }
      if (!importedPeople.length) {
        message.error('导入文件中没有组织内人员');
        return;
      }
    }

    setSaving(true);
    const id = editing?.id ?? nextVoteId();
    let optionId = nextOptionId();
    let questionId = nextQuestionId();
    let choiceId = nextChoiceId();
    const nextOptions: VoteOption[] =
      values.type === '评选投票'
        ? (values.options ?? []).map((item, index) => {
            const optionIdValue = item.id ?? optionId++;
            const kind: VoteOptionKind = item.kind;
            return {
              id: optionIdValue,
              campaignId: id,
              sortOrder: index,
              kind,
              label: '',
              imageUrl: kind === '员工' ? item.imageUrl : '',
              employeeId: kind === '员工' ? item.employeeId : '',
              employeeName: kind === '员工' ? item.employeeId : '',
              employeeDept: kind === '员工' ? personDepartment(item.employeeId) ?? '' : '',
              workTitle: kind === '作品' ? item.workTitle.trim() : '',
              workCover: kind === '作品' ? item.workCover : '',
              workIntro: kind === '作品' ? item.workIntro : '',
            };
          })
        : [];
    const nextQuestions: VoteQuestion[] =
      values.type === '普通投票'
        ? (values.questions ?? []).map((item, index) => {
            const qid = item.id ?? questionId++;
            const choices: VoteChoice[] = isChoiceQuestionType(item.type)
              ? (item.choices ?? []).map((choice, choiceIndex) => ({
                  id: choice.id ?? choiceId++,
                  sortOrder: choiceIndex,
                  label: choice.label?.trim() ?? '',
                  subtitle: choice.subtitle?.trim() ?? '',
                  imageUrl: choice.imageUrl ?? '',
                  employeeId: choice.employeeId?.trim() || undefined,
                }))
              : [];
            return {
              id: qid,
              campaignId: id,
              sortOrder: index,
              type: item.type,
              stem: item.stem.trim(),
              choices,
              minScore: item.type === '打分题' ? item.minScore : voteScoreDefaultMin,
              maxScore: item.type === '打分题' ? item.maxScore : voteScoreDefaultMax,
              imageLayout: isVisualChoiceQuestionType(item.type) ? resolveVoteImageLayout(item.imageLayout) : undefined,
            };
          })
        : [];
    const record: VoteCampaign = {
      id,
      name: values.name.trim(),
      type: values.type,
      anonymous: values.anonymous,
      startAt,
      endAt,
      intro: values.intro?.trim() ?? '',
      quotaMode: values.quotaMode,
      quota: values.quota,
      allowComment: values.allowComment,
      allowStackOnSameOption: values.type === '评选投票' ? values.allowStackOnSameOption : false,
      visibility: values.visibility,
      departments: values.visibility === '按部门' ? values.departments ?? [] : [],
      people: values.visibility === '自定义人员' ? values.people ?? [] : [],
      importFileName: values.visibility === '导入人群' ? values.importFileName ?? '' : '',
      importedPeople: values.visibility === '导入人群' ? importedPeople : [],
    };
    upsertVote(record, nextOptions, nextQuestions);
    setDirty(false);
    setSaving(false);
    message.success(mode === 'edit' ? '已保存投票' : '已创建投票');
    onBack();
  };

  const nameLocked = !canEditVoteField(status, 'name');
  const timeLocked: [boolean, boolean] = [!canEditVoteField(status, 'startAt'), !canEditVoteField(status, 'endAt')];

  return (
    <div className="page-stack advanced-form-page">
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
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">填写基础信息、投票与规则后保存。</Typography.Text>
      </Flex>

      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={() => setDirty(true)}
        initialValues={
          editing
            ? campaignFormValues(editing)
            : {
                type: '普通投票',
                anonymous: false,
                questions: [],
                options: [],
                quotaMode: '每天',
                quota: 1,
                allowComment: false,
                allowStackOnSameOption: false,
                visibility: '全员',
              }
        }
      >
        <Card title="基础信息">
          <Form.Item
            name="name"
            label="投票名称"
            rules={[
              { required: true, whitespace: true, message: '请输入投票名称' },
              { max: 50, message: '不超过 50 个字' },
            ]}
          >
            <Input maxLength={50} showCount placeholder="请输入投票名称" disabled={nameLocked} />
          </Form.Item>
          <Form.Item name="type" hidden>
            <Input />
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
            <DatePicker.RangePicker
              showTime
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
              disabled={timeLocked}
            />
          </Form.Item>
          <Form.Item name="intro" label="投票简介" rules={[{ max: 500, message: '不超过 500 个字' }]}>
            <Input.TextArea maxLength={500} showCount rows={4} placeholder="选填" disabled={!canEditVoteField(status, 'intro')} />
          </Form.Item>
        </Card>

        {type === '普通投票' ? (
          <Card title="投票" className="vote-option-card">
            <Form.List name="questions">
              {(fields, { add, remove, move }) => {
                const canAdd = canMutateVoteOption(status, false, 'add') && fields.length < 20;
                const addQuestion = (questionType: VoteQuestionType) => {
                  add(emptyQuestion(questionType));
                  window.setTimeout(() => {
                    const nodes = document.querySelectorAll('.vote-option-card .vote-question-card');
                    const node = nodes[nodes.length - 1];
                    if (node && 'scrollIntoView' in node) {
                      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 0);
                };
                return (
                <>
                  {canAdd ? <QuestionTypeAddBar onAdd={addQuestion} /> : null}
                  <div className="vote-question-list">
                  {fields.map((field, index) => {
                    const questionId = form.getFieldValue(['questions', field.name, 'id']) as number | undefined;
                    const hasAnswers = !!questionId && answeredQuestionIds.has(questionId);
                    const canDeleteRow = canMutateVoteOption(status, hasAnswers, 'delete');
                    const canChangeIdentity = canMutateVoteOption(status, hasAnswers, 'changeIdentity');
                    const canChangeCopy = canMutateVoteOption(status, hasAnswers, 'changeCopy');
                    return (
                      <div key={field.key} className="vote-question-card">
                        <Form.Item name={[field.name, 'id']} noStyle>
                          <input type="hidden" />
                        </Form.Item>
                        <Form.Item name={[field.name, 'type']} noStyle>
                          <input type="hidden" />
                        </Form.Item>
                        <div className="vote-question-head">
                          <span className="vote-question-index">{index + 1}.</span>
                          <QuestionTypeTag name={field.name} />
                          <Form.Item
                            name={[field.name, 'stem']}
                            className="vote-question-stem"
                            rules={[{ required: true, whitespace: true, message: '请输入题干' }, { max: 200, message: '不超过 200 个字' }]}
                          >
                            <Input maxLength={200} showCount placeholder="请输入题干" disabled={!canChangeCopy} />
                          </Form.Item>
                          <Space size={0}>
                            <Tooltip title="上移">
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowUpOutlined />}
                                disabled={index === 0}
                                onClick={() => move(field.name, field.name - 1)}
                              />
                            </Tooltip>
                            <Tooltip title="下移">
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowDownOutlined />}
                                disabled={index === fields.length - 1}
                                onClick={() => move(field.name, field.name + 1)}
                              />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<MinusCircleOutlined />}
                                disabled={!canDeleteRow}
                                onClick={() => remove(field.name)}
                              />
                            </Tooltip>
                          </Space>
                        </div>
                        <QuestionBody
                          name={field.name}
                          canChangeIdentity={canChangeIdentity}
                          canChangeCopy={canChangeCopy}
                        />
                      </div>
                    );
                  })}
                  </div>
                </>
                );
              }}
            </Form.List>
          </Card>
        ) : (
          <Card title="选项">
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => {
                    const optionId = form.getFieldValue(['options', field.name, 'id']) as number | undefined;
                    const hasBallots = !!optionId && ballotOptionIds.has(optionId);
                    const canDeleteRow = canMutateVoteOption(status, hasBallots, 'delete');
                    const canChangeIdentity = canMutateVoteOption(status, hasBallots, 'changeIdentity');
                    const canChangeCopy = canMutateVoteOption(status, hasBallots, 'changeCopy');
                    return (
                      <Space key={field.key} align="start" style={{ display: 'flex', marginBottom: 12 }} wrap>
                        <Form.Item name={[field.name, 'kind']} rules={[{ required: true, message: '请选择选项类型' }]}>
                          <Radio.Group
                            disabled={!canChangeIdentity}
                            options={[
                              { value: '员工', label: '员工' },
                              { value: '作品', label: '作品' },
                            ]}
                          />
                        </Form.Item>
                        <ContestOptionFields name={field.name} disabledIdentity={!canChangeIdentity} disabledCopy={!canChangeCopy} />
                        {fields.length > 2 ? (
                          <Button
                            type="link"
                            danger
                            icon={<MinusCircleOutlined />}
                            disabled={!canDeleteRow}
                            onClick={() => remove(field.name)}
                          >
                            删除
                          </Button>
                        ) : null}
                      </Space>
                    );
                  })}
                  {fields.length < 20 && canMutateVoteOption(status, false, 'add') ? (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(emptyContestOption())}>
                      添加选项
                    </Button>
                  ) : null}
                </>
              )}
            </Form.List>
          </Card>
        )}

        <Card title="规则">
          <Form.Item name="anonymous" label="匿名投票" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" disabled={!canEditVoteField(status, 'anonymous')} />
          </Form.Item>
          <Form.Item name="allowComment" label="允许评论" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" disabled={!canEditVoteField(status, 'allowComment')} />
          </Form.Item>
          <Form.Item name="quotaMode" label="投票次数" rules={[{ required: true, message: '请选择次数规则' }]}>
            <Radio.Group
              disabled={!canEditVoteField(status, 'quotaMode')}
              options={[
                { value: '每人', label: '每人能投' },
                { value: '每天', label: '每人每天能投' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="quota"
            label="次数"
            extra={quotaMode === '每人' ? '活动期内累计' : '按自然日重置'}
            rules={[{ required: true, message: '请输入次数' }]}
          >
            <InputNumber min={1} max={99} precision={0} addonAfter="次" disabled={!canEditVoteField(status, 'quota')} />
          </Form.Item>
          {type === '评选投票' ? (
            <Form.Item name="allowStackOnSameOption" label="允许对同一选项连投" valuePropName="checked">
              <Switch disabled={!canEditVoteField(status, 'allowStackOnSameOption')} />
            </Form.Item>
          ) : null}
          <Form.Item name="visibility" label="参与范围" rules={[{ required: true, message: '请选择参与范围' }]}>
            <Radio.Group options={optionsOf(voteVisibilities)} disabled={!canEditVoteField(status, 'visibility')} />
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
                disabled={!canEditVoteField(status, 'visibility')}
              />
            </Form.Item>
          ) : null}
          {visibility === '自定义人员' ? (
            <Form.Item name="people" label="选择人员" rules={[{ required: true, message: '请选择人员' }]}>
              <TreeSelect
                treeData={orgPeoplePickerTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请按组织架构选择人员"
                style={{ width: '100%' }}
                disabled={!canEditVoteField(status, 'visibility')}
              />
            </Form.Item>
          ) : null}
          {visibility === '导入人群' ? (
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
                    disabled={!canEditVoteField(status, 'visibility')}
                    onChange={({ fileList: next }) => {
                      const latest = next.slice(-1);
                      setImportList(latest);
                      const file = latest[0];
                      form.setFieldValue('importFileName', file?.name ?? '');
                      const raw = file?.originFileObj;
                      if (!raw) {
                        setImportedPeople([]);
                        return;
                      }
                      if (!raw.name.toLowerCase().endsWith('.csv')) {
                        setImportedPeople([]);
                        message.info('当前原型仅解析 csv，xlsx 仅记录文件名');
                        return;
                      }
                      void raw.text().then((text) => {
                        const parsed = parseVoteCrowdCsv(text);
                        if (parsed.error) {
                          setImportedPeople([]);
                          message.error(parsed.error);
                          return;
                        }
                        const known = parsed.names.filter((name) => orgPeopleByName[name]);
                        setImportedPeople(known);
                        if (!known.length) message.error('导入文件中没有组织内人员');
                        else message.success(`已导入 ${known.length} 人`);
                      });
                    }}
                  >
                    <Button disabled={!canEditVoteField(status, 'visibility')}>上传文件</Button>
                  </Upload>
                  <Button type="link" style={{ paddingInline: 0 }} onClick={downloadCrowdImportTemplate}>
                    下载导入模板
                  </Button>
                </Space>
              </Form.Item>
            </>
          ) : null}
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
    </div>
  );
}

function QuestionTypeAddBar({ onAdd }: { onAdd: (type: VoteQuestionType) => void }) {
  return (
    <div className="vote-question-add-bar">
      <Space wrap>
        {voteQuestionTypes.map((questionType) => (
          <Button key={questionType} size="small" onClick={() => onAdd(questionType)}>
            {questionType}
          </Button>
        ))}
      </Space>
    </div>
  );
}

function QuestionTypeTag({ name }: { name: number }) {
  const questionType = Form.useWatch(['questions', name, 'type']) as VoteQuestionType | undefined;
  return <Tag className="vote-question-type">{questionType ?? '单选'}</Tag>;
}

function QuestionBody({
  name,
  canChangeIdentity,
  canChangeCopy,
}: {
  name: number;
  canChangeIdentity: boolean;
  canChangeCopy: boolean;
}) {
  const questionType = (Form.useWatch(['questions', name, 'type']) as VoteQuestionType | undefined) ?? '单选';
  if (questionType === '问答题') return null;
  if (questionType === '打分题') {
    return (
      <div className="vote-question-score">
        <Form.Item name={[name, 'minScore']} rules={[{ required: true, message: '请输入最低分' }]}>
          <InputNumber min={voteScoreAbsMin} max={voteScoreAbsMax - 1} precision={0} disabled={!canChangeIdentity} />
        </Form.Item>
        <span>～</span>
        <Form.Item name={[name, 'maxScore']} rules={[{ required: true, message: '请输入最高分' }]}>
          <InputNumber min={voteScoreAbsMin + 1} max={voteScoreAbsMax} precision={0} disabled={!canChangeIdentity} />
        </Form.Item>
        <span>分</span>
        <Typography.Text type="secondary">最多{voteScoreAbsMax}分</Typography.Text>
      </div>
    );
  }
  if (isPersonQuestionType(questionType)) {
    return <PersonQuestionFields name={name} canChangeIdentity={canChangeIdentity} canChangeCopy={canChangeCopy} />;
  }
  const image = isImageQuestionType(questionType);
  return (
    <>
      {image ? (
        <div className="vote-image-settings">
          <span className="vote-image-settings-label">图文布局</span>
          <Form.Item name={[name, 'imageLayout']} noStyle>
            <Radio.Group
              optionType="button"
              size="small"
              disabled={!canChangeCopy}
              options={voteImageLayouts.map((item) => ({ value: item, label: item }))}
            />
          </Form.Item>
        </div>
      ) : null}
      <Form.List name={[name, 'choices']}>
        {(fields, { add, remove }) => (
          <div className={image ? 'vote-question-choices is-image' : 'vote-question-choices'}>
            {fields.map((field, index) =>
              image ? (
                <ImageChoiceCell
                  key={field.key}
                  questionName={name}
                  choiceName={field.name}
                  canChangeIdentity={canChangeIdentity}
                  canChangeCopy={canChangeCopy}
                  canDelete={fields.length > 2}
                  onDelete={() => remove(field.name)}
                />
              ) : (
                <div key={field.key} className="vote-question-choice">
                  <span className="vote-question-choice-index">选项{index + 1}</span>
                  <Form.Item
                    name={[field.name, 'label']}
                    className="vote-question-choice-input"
                    rules={[{ required: true, whitespace: true, message: `请输入选项${index + 1}` }, { max: 40, message: '不超过 40 个字' }]}
                  >
                    <Input maxLength={40} placeholder={`请输入选项${index + 1}`} disabled={!canChangeCopy} />
                  </Form.Item>
                  {fields.length > 2 ? (
                    <Tooltip title="删除">
                      <Button type="text" size="small" danger icon={<MinusCircleOutlined />} disabled={!canChangeIdentity} onClick={() => remove(field.name)} />
                    </Tooltip>
                  ) : null}
                </div>
              ),
            )}
            {fields.length < 10 && canChangeIdentity ? (
              <Button type="link" size="small" className="vote-question-choice-add" icon={<PlusOutlined />} onClick={() => add(emptyChoice())}>
                添加选项
              </Button>
            ) : null}
          </div>
        )}
      </Form.List>
    </>
  );
}

function PersonQuestionFields({
  name,
  canChangeIdentity,
  canChangeCopy,
}: {
  name: number;
  canChangeIdentity: boolean;
  canChangeCopy: boolean;
}) {
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const choices = (Form.useWatch(['questions', name, 'choices']) as FormChoice[] | undefined) ?? [];
  const selected = choices.map((item) => item.employeeId).filter(Boolean);
  const limit = voteChoiceLimit('人员多选');

  const syncPeople = (names: string[]) => {
    const unique = [...new Set(names)];
    if (unique.length > limit) message.warning(`最多 ${limit} 人`);
    const kept = unique.slice(0, limit);
    const byId = new Map(choices.filter((item) => item.employeeId).map((item) => [item.employeeId, item]));
    form.setFieldValue(
      ['questions', name, 'choices'],
      kept.map((person) => {
        const current = byId.get(person);
        const department = orgPeopleByName[person]?.department ?? personDepartment(person) ?? '';
        const title = votePersonChoiceTitle(person, department);
        if (current) return { ...current, label: title };
        return {
          label: title,
          subtitle: '',
          imageUrl: '',
          employeeId: person,
        };
      }),
    );
  };

  return (
    <>
      <div className="vote-image-settings">
        <span className="vote-image-settings-label">图文布局</span>
        <Form.Item name={[name, 'imageLayout']} noStyle>
          <Radio.Group
            optionType="button"
            size="small"
            disabled={!canChangeCopy}
            options={voteImageLayouts.map((item) => ({ value: item, label: item }))}
          />
        </Form.Item>
      </div>
      <div className="vote-image-settings">
        <span className="vote-image-settings-label">选择人员</span>
        <TreeSelect
          treeData={orgPeoplePickerTree}
          treeCheckable
          treeDefaultExpandAll
          showCheckedStrategy={TreeSelect.SHOW_CHILD}
          showSearch={{ treeNodeFilterProp: 'title' }}
          allowClear
          placeholder="请按组织架构选择人员"
          style={{ width: '100%' }}
          value={selected}
          disabled={!canChangeIdentity}
          onChange={(value) => syncPeople(Array.isArray(value) ? value : value ? [value] : [])}
        />
      </div>
      <Form.List name={[name, 'choices']}>
        {(fields, { remove }) => (
          <div className="vote-question-choices is-image">
            {fields.map((field) => (
              <ImageChoiceCell
                key={field.key}
                questionName={name}
                choiceName={field.name}
                canChangeIdentity={canChangeIdentity}
                canChangeCopy={canChangeCopy}
                canDelete={canChangeIdentity}
                imageRequired={false}
                lockTitle
                onDelete={() => remove(field.name)}
              />
            ))}
          </div>
        )}
      </Form.List>
    </>
  );
}

function fileBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').trim().slice(0, voteVisualTitleMax);
}

function ImageChoiceCell({
  questionName,
  choiceName,
  canChangeIdentity,
  canChangeCopy,
  canDelete,
  onDelete,
  imageRequired = true,
  lockTitle = false,
}: {
  questionName: number;
  choiceName: number;
  canChangeIdentity: boolean;
  canChangeCopy: boolean;
  canDelete: boolean;
  onDelete: () => void;
  imageRequired?: boolean;
  lockTitle?: boolean;
}) {
  const form = Form.useFormInstance();
  const layout = resolveVoteImageLayout(Form.useWatch(['questions', questionName, 'imageLayout']) as string | undefined);
  const label = String(Form.useWatch(['questions', questionName, 'choices', choiceName, 'label']) ?? '');
  const employeeId = String(Form.useWatch(['questions', questionName, 'choices', choiceName, 'employeeId']) ?? '');
  const side = layout === '左图右文';
  const fallbackName = employeeId.trim() || label.trim();
  return (
    <div className={side ? 'vote-image-choice is-left' : 'vote-image-choice is-top'}>
      <div className="vote-image-choice-media">
        <Form.Item name={[choiceName, 'employeeId']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={[choiceName, 'imageUrl']} className="vote-question-choice-image" rules={imageRequired ? [{ required: true, message: '请上传图片' }] : []}>
          <ImageUpload
            className="vote-image-choice-upload"
            disabled={!canChangeIdentity}
            empty={
              !imageRequired && fallbackName ? (
                <span className="vote-person-avatar" style={{ background: employeeAvatarColor(fallbackName) }}>
                  {employeeAvatarLetter(fallbackName)}
                </span>
              ) : undefined
            }
            onFile={(file) => {
              if (lockTitle) return;
              const path = ['questions', questionName, 'choices', choiceName, 'label'] as const;
              if (!String(form.getFieldValue(path) ?? '').trim()) {
                form.setFieldValue(path, fileBaseName(file.name));
              }
            }}
          />
        </Form.Item>
        {canDelete && !side ? (
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<MinusCircleOutlined />} disabled={!canChangeIdentity} onClick={onDelete} />
          </Tooltip>
        ) : null}
      </div>
      <div className="vote-image-choice-copy">
        <Form.Item
          name={[choiceName, 'label']}
          className="vote-image-choice-name"
          rules={lockTitle ? [] : [{ max: voteVisualTitleMax, message: `不超过 ${voteVisualTitleMax} 个字` }]}
        >
          <Input maxLength={lockTitle ? undefined : voteVisualTitleMax} placeholder="标题" disabled={lockTitle || !canChangeCopy} />
        </Form.Item>
        <Form.Item name={[choiceName, 'subtitle']} className="vote-image-choice-name" rules={[{ max: voteVisualSubtitleMax, message: `不超过 ${voteVisualSubtitleMax} 个字` }]}>
          <Input
            maxLength={voteVisualSubtitleMax}
            placeholder={lockTitle ? '副标题（选填）' : '副标题'}
            disabled={!canChangeCopy}
          />
        </Form.Item>
      </div>
      {canDelete && side ? (
        <Tooltip title="删除">
          <Button type="text" size="small" danger icon={<MinusCircleOutlined />} disabled={!canChangeIdentity} onClick={onDelete} />
        </Tooltip>
      ) : null}
    </div>
  );
}

function ImageUpload({
  value,
  onChange,
  disabled,
  compact,
  className,
  onFile,
  empty,
}: {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  onFile?: (file: File) => void;
  empty?: ReactNode;
}) {
  const fileList = toFileList(value ?? '', '图片');
  return (
    <Upload
      accept="image/*"
      maxCount={1}
      listType="picture-card"
      className={className ?? (compact ? 'vote-question-upload' : undefined)}
      disabled={disabled}
      fileList={fileList}
      beforeUpload={(file) => {
        onFile?.(file);
        void readDataUrl(file).then((url) => onChange?.(url));
        return false;
      }}
      onRemove={() => {
        onChange?.('');
      }}
    >
      {value ? null : (empty ?? <span>上传</span>)}
    </Upload>
  );
}

function ContestOptionFields({
  name,
  disabledIdentity,
  disabledCopy,
}: {
  name: number;
  disabledIdentity: boolean;
  disabledCopy: boolean;
}) {
  const kind = Form.useWatch(['options', name, 'kind']) as VoteOptionKind | undefined;
  if (kind === '作品') {
    return (
      <>
        <Form.Item
          name={[name, 'workTitle']}
          label="作品标题"
          rules={[{ required: true, whitespace: true, message: '请输入作品标题' }, { max: 40, message: '不超过 40 个字' }]}
        >
          <Input maxLength={40} placeholder="请输入作品标题" disabled={disabledIdentity} />
        </Form.Item>
        <Form.Item name={[name, 'workCover']} label="封面" rules={[{ required: true, message: '请上传封面' }]}>
          <ImageUpload disabled={disabledCopy} />
        </Form.Item>
        <Form.Item name={[name, 'workIntro']} label="简介" rules={[{ max: 200, message: '不超过 200 个字' }]}>
          <Input.TextArea maxLength={200} rows={2} disabled={disabledCopy} />
        </Form.Item>
      </>
    );
  }
  return (
    <>
      <Form.Item name={[name, 'employeeId']} label="候选人" rules={[{ required: true, message: '请选择候选人' }]}>
        <TreeSelect
          treeData={orgPeoplePickerTree}
          treeDefaultExpandAll
          showSearch={{ treeNodeFilterProp: 'title' }}
          allowClear
          placeholder="请选择员工"
          style={{ minWidth: 220 }}
          disabled={disabledIdentity}
        />
      </Form.Item>
      <Form.Item name={[name, 'imageUrl']} label="头图">
        <ImageUpload disabled={disabledCopy} />
      </Form.Item>
    </>
  );
}
