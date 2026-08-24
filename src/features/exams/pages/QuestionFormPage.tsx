import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  defaultQuestionOptions,
  isRichTextEmpty,
  optionLabel,
  parseBatchAnswers,
  questionDifficulties,
  questionStatuses,
  questionTypes,
  type QuestionDifficulty,
  type QuestionRecord,
  type QuestionStatus,
  type QuestionType,
} from '../model/question';
import { questionBankMeta, type QuestionBankScope } from '../model/questionBank';
import { getQuestionStore } from '../model/questionStore';

type Props = {
  scope?: QuestionBankScope;
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
};

type FormValues = {
  categoryId: number;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  stemHtml: string;
  options: string[];
  answer: string | string[];
  blankAnswers: string[];
  blankAnswerOrderSensitive: boolean;
  keywords: string[];
  keywordMinHits: number;
  analysis?: string;
  status: QuestionStatus;
};

const judgmentAnswers = ['正确', '错误'] as const;

function choiceTypes(type: QuestionType) {
  return type === '单选' || type === '多选';
}

function modalFooter(_: unknown, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function toFormValues(editing: QuestionRecord): Partial<FormValues> {
  if (editing.type === '多选') {
    return {
      categoryId: editing.categoryId ?? undefined,
      difficulty: editing.difficulty,
      type: editing.type,
      stemHtml: editing.stem,
      options: editing.options?.length ? editing.options : defaultQuestionOptions(),
      answer: editing.answer?.split(',').filter(Boolean) ?? [],
      blankAnswers: [''],
      blankAnswerOrderSensitive: false,
      keywords: [''],
      keywordMinHits: 1,
      analysis: editing.analysis ?? '',
      status: editing.status,
    };
  }
  if (editing.type === '问答题') {
    const keywords = editing.keywords?.length ? editing.keywords : [''];
    return {
      categoryId: editing.categoryId ?? undefined,
      difficulty: editing.difficulty,
      type: editing.type,
      stemHtml: editing.stem,
      options: [],
      answer: editing.answer ?? '',
      blankAnswers: [''],
      blankAnswerOrderSensitive: false,
      keywords,
      keywordMinHits: editing.keywordMinHits ?? (keywords.filter(Boolean).length || 1),
      analysis: editing.analysis ?? '',
      status: editing.status,
    };
  }
  if (editing.type === '填空') {
    const blankAnswers =
      editing.blankAnswers?.length
        ? editing.blankAnswers
        : editing.answer
          ? parseBatchAnswers(editing.answer.replace(/、/g, '\n'))
          : [''];
    return {
      categoryId: editing.categoryId ?? undefined,
      difficulty: editing.difficulty,
      type: editing.type,
      stemHtml: editing.stem,
      options: [],
      answer: '',
      blankAnswers,
      blankAnswerOrderSensitive: editing.blankAnswerOrderSensitive ?? false,
      keywords: [''],
      keywordMinHits: 1,
      analysis: editing.analysis ?? '',
      status: editing.status,
    };
  }
  return {
    categoryId: editing.categoryId ?? undefined,
    difficulty: editing.difficulty,
    type: editing.type,
    stemHtml: editing.stem,
    options: editing.options?.length ? editing.options : defaultQuestionOptions(),
    answer: editing.answer ?? (editing.type === '判断' ? '正确' : ''),
    blankAnswers: [''],
    blankAnswerOrderSensitive: false,
    keywords: [''],
    keywordMinHits: 1,
    analysis: editing.analysis ?? '',
    status: editing.status,
  };
}

export function QuestionFormPage({ scope = 'exam', mode, recordId, onBack }: Props) {
  const meta = questionBankMeta[scope];
  const { getQuestion, upsertQuestion, useQuestionCategoryTree } = getQuestionStore(scope);
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const categoryTree = useQuestionCategoryTree();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batchBlankOpen, setBatchBlankOpen] = useState(false);
  const [batchBlankText, setBatchBlankText] = useState('');

  const editing = mode === 'edit' && recordId ? getQuestion(Number(recordId)) : undefined;
  const title = mode === 'edit' ? `编辑${meta.itemName}` : `新建${meta.itemName}`;

  const categoryOptions = useMemo(
    () =>
      categoryTree.map((node) => ({
        value: node.id,
        label: node.name,
      })),
    [categoryTree],
  );

  const watchedType = Form.useWatch('type', form) ?? '单选';
  const watchedOptions = Form.useWatch('options', form) ?? defaultQuestionOptions();
  const watchedKeywords = Form.useWatch('keywords', form) ?? [''];
  const keywordCount = watchedKeywords.map((item) => item?.trim()).filter(Boolean).length;

  const answerChoices = useMemo(
    () =>
      watchedOptions.map((_, index) => ({
        label: optionLabel(index),
        value: optionLabel(index),
      })),
    [watchedOptions],
  );

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.error(`${meta.itemName}不存在或已删除`);
      onBack();
      return;
    }
    if (mode === 'create') {
      form.setFieldsValue({
        difficulty: '初级',
        type: '单选',
        stemHtml: '',
        options: defaultQuestionOptions(),
        answer: undefined,
        blankAnswers: [''],
        blankAnswerOrderSensitive: false,
        keywords: [''],
        keywordMinHits: 1,
        analysis: '',
        status: '启用',
      });
      setDirty(false);
      return;
    }
    if (!editing) return;
    form.setFieldsValue(toFormValues(editing));
    setDirty(false);
  }, [mode, editing, form, message, onBack]);

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

  const resetForm = () => {
    if (mode === 'edit' && editing) {
      form.setFieldsValue(toFormValues(editing));
    } else {
      form.resetFields();
      form.setFieldsValue({
        difficulty: '初级',
        type: '单选',
        stemHtml: '',
        options: defaultQuestionOptions(),
        answer: undefined,
        blankAnswers: [''],
        blankAnswerOrderSensitive: false,
        keywords: [''],
        keywordMinHits: 1,
        analysis: '',
        status: '启用',
      });
    }
    setDirty(false);
  };

  const handleTypeChange = (type: QuestionType) => {
    if (choiceTypes(type)) {
      form.setFieldsValue({
        options: defaultQuestionOptions(),
        answer: type === '多选' ? [] : undefined,
        blankAnswers: [''],
        blankAnswerOrderSensitive: false,
        keywords: [''],
        keywordMinHits: 1,
      });
      return;
    }
    if (type === '判断') {
      form.setFieldsValue({
        options: [],
        answer: '正确',
        blankAnswers: [''],
        blankAnswerOrderSensitive: false,
        keywords: [''],
        keywordMinHits: 1,
      });
      return;
    }
    if (type === '问答题') {
      form.setFieldsValue({
        options: [],
        answer: '',
        blankAnswers: [''],
        blankAnswerOrderSensitive: false,
        keywords: [''],
        keywordMinHits: 1,
      });
      return;
    }
    form.setFieldsValue({
      options: [],
      answer: '',
      blankAnswers: [''],
      blankAnswerOrderSensitive: false,
      keywords: [''],
      keywordMinHits: 1,
    });
  };

  const confirmBatchBlankAnswers = () => {
    const incoming = parseBatchAnswers(batchBlankText);
    if (!incoming.length) {
      message.warning('请输入至少一个答案');
      return;
    }
    const current = (form.getFieldValue('blankAnswers') as string[] | undefined) ?? [];
    const merged = [...current.map((item) => item.trim()).filter(Boolean), ...incoming];
    form.setFieldValue('blankAnswers', merged.length ? merged : ['']);
    setDirty(true);
    setBatchBlankOpen(false);
    setBatchBlankText('');
    message.success(`已批量添加 ${incoming.length} 个答案`);
  };

  const save = async () => {
    if (saving) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const blankAnswers = values.blankAnswers.map((item) => item.trim()).filter(Boolean);
    const keywords = values.keywords.map((item) => item.trim()).filter(Boolean);
    const answer =
      values.type === '多选'
        ? (values.answer as string[]).join(',')
        : values.type === '填空'
          ? blankAnswers.join('\n')
          : String(values.answer ?? '').trim();
    const record: QuestionRecord = {
      id: mode === 'edit' && editing ? editing.id : Date.now(),
      categoryId: values.categoryId,
      type: values.type,
      difficulty: values.difficulty,
      stem: values.stemHtml,
      status: values.status,
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
      options: choiceTypes(values.type) ? values.options.map((item) => item.trim()) : undefined,
      answer,
      blankAnswers: values.type === '填空' ? blankAnswers : undefined,
      blankAnswerOrderSensitive: values.type === '填空' ? values.blankAnswerOrderSensitive : undefined,
      keywords: values.type === '问答题' ? keywords : undefined,
      keywordMinHits: values.type === '问答题' ? values.keywordMinHits : undefined,
      analysis: values.analysis?.trim() ?? '',
    };
    upsertQuestion(record);
    setDirty(false);
    setSaving(false);
    message.success(mode === 'edit' ? `已保存${meta.itemName}` : `已创建${meta.itemName}`);
    onBack();
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '考试练习' },
          { title: meta.breadcrumbSection },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={leave}>
                {meta.breadcrumbList}
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">{meta.formSubtitle}</Typography.Text>
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
      >
        <Card title="基本信息">
          <Form.Item name="categoryId" label="所属分类" rules={[{ required: true, message: '请选择所属分类' }]}>
            <Select allowClear={false} placeholder="请选择所属分类" options={categoryOptions} />
          </Form.Item>

          <Form.Item name="difficulty" label="试题难度" rules={[{ required: true, message: '请选择试题难度' }]}>
            <Radio.Group optionType="button" buttonStyle="solid">
              {questionDifficulties.map((item) => (
                <Radio.Button key={item} value={item}>
                  {item}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item name="type" label="试题类型" rules={[{ required: true, message: '请选择试题类型' }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              onChange={(event) => handleTypeChange(event.target.value as QuestionType)}
            >
              {questionTypes.map((item) => (
                <Radio.Button key={item} value={item}>
                  {item}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="stemHtml"
            label="题干"
            rules={[
              {
                validator: async (_, value) => {
                  if (isRichTextEmpty(value)) throw new Error('请输入题干');
                },
              },
            ]}
          >
            <RichTextField ariaLabel="题干" placeholder="请输入内容" />
          </Form.Item>
        </Card>

        {choiceTypes(watchedType) ? (
          <Card title="选项">
            <Form.List
              name="options"
              rules={[
                {
                  validator: async (_, value: string[] | undefined) => {
                    const items = value?.map((item) => item?.trim()).filter(Boolean) ?? [];
                    if (items.length < 2) throw new Error('请至少填写 2 个选项');
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <Flex vertical gap={12}>
                  {fields.map((field, index) => (
                    <Flex key={field.key} gap={12} align="flex-start">
                      <span className="question-option-label" aria-hidden="true">
                        {optionLabel(index)}
                      </span>
                      <Form.Item
                        {...field}
                        style={{ flex: 1, marginBottom: 0 }}
                        rules={[{ required: true, whitespace: true, message: `请输入选项 ${optionLabel(index)}` }]}
                      >
                        <Input placeholder={`请输入选项 ${optionLabel(index)}`} maxLength={200} />
                      </Form.Item>
                      {fields.length > 2 ? (
                        <Button type="link" onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      ) : null}
                    </Flex>
                  ))}
                  <Button type="link" icon={<PlusOutlined />} onClick={() => add('')} style={{ alignSelf: 'flex-start' }}>
                    添加选项
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Flex>
              )}
            </Form.List>
          </Card>
        ) : null}

        <Card title="答案与解析">
          {watchedType === '单选' ? (
            <Form.Item name="answer" label="正确答案" rules={[{ required: true, message: '请选择正确答案' }]}>
              <Radio.Group>
                {answerChoices.map((item) => (
                  <Radio key={item.value} value={item.value}>
                    {item.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          ) : null}

          {watchedType === '多选' ? (
            <Form.Item name="answer" label="正确答案" rules={[{ required: true, message: '请选择正确答案' }]}>
              <Checkbox.Group options={answerChoices} />
            </Form.Item>
          ) : null}

          {watchedType === '判断' ? (
            <Form.Item name="answer" label="正确答案" rules={[{ required: true, message: '请选择正确答案' }]}>
              <Radio.Group>
                {judgmentAnswers.map((item) => (
                  <Radio key={item} value={item}>
                    {item}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          ) : null}

          {watchedType === '填空' ? (
            <>
              <Form.Item
                name="blankAnswerOrderSensitive"
                label="答案顺序"
                rules={[{ required: true, message: '请选择是否区分答案顺序' }]}
              >
                <Radio.Group>
                  <Radio value={false}>不区分顺序</Radio>
                  <Radio value={true}>区分顺序</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="正确答案" required>
                <Form.List
                  name="blankAnswers"
                  rules={[
                    {
                      validator: async (_, value: string[] | undefined) => {
                        const items = value?.map((item) => item?.trim()).filter(Boolean) ?? [];
                        if (!items.length) throw new Error('请至少添加 1 个答案');
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <Flex vertical gap={12}>
                      {fields.map((field, index) => (
                        <Flex key={field.key} gap={12} align="flex-start">
                          <Typography.Text type="secondary" style={{ width: 28, marginTop: 6, textAlign: 'right' }}>
                            {index + 1}.
                          </Typography.Text>
                          <Form.Item
                            {...field}
                            style={{ flex: 1, marginBottom: 0 }}
                            rules={[{ required: true, whitespace: true, message: '请输入答案' }]}
                          >
                            <Input placeholder="请输入答案" maxLength={200} />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <Button type="link" onClick={() => remove(field.name)}>
                              删除
                            </Button>
                          ) : null}
                        </Flex>
                      ))}
                      <Space>
                        <Button type="link" icon={<PlusOutlined />} onClick={() => add('')}>
                          添加答案
                        </Button>
                        <Button type="link" onClick={() => setBatchBlankOpen(true)}>
                          批量添加答案
                        </Button>
                      </Space>
                      <Form.ErrorList errors={errors} />
                    </Flex>
                  )}
                </Form.List>
              </Form.Item>
            </>
          ) : null}

          {watchedType === '问答题' ? (
            <>
              <Form.Item
                name="answer"
                label="参考答案"
                extra="仅供评卷查看，不参与自动判分。"
                rules={[{ required: true, whitespace: true, message: '请输入参考答案' }]}
              >
                <Input.TextArea rows={4} maxLength={2000} showCount placeholder="请输入参考答案" />
              </Form.Item>

              <Form.Item label="关键词" required extra="考生作答包含该词即命中。命中数未达下方阈值得 0 分。">
                <Form.List
                  name="keywords"
                  rules={[
                    {
                      validator: async (_, value: string[] | undefined) => {
                        const items = value?.map((item) => item?.trim()).filter(Boolean) ?? [];
                        if (!items.length) throw new Error('请至少添加 1 个关键词');
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <Flex vertical gap={12}>
                      {fields.map((field, index) => (
                        <Flex key={field.key} gap={12} align="flex-start">
                          <Typography.Text type="secondary" style={{ width: 28, marginTop: 6, textAlign: 'right' }}>
                            {index + 1}.
                          </Typography.Text>
                          <Form.Item
                            {...field}
                            style={{ flex: 1, marginBottom: 0 }}
                            rules={[{ required: true, whitespace: true, message: '请输入关键词' }]}
                          >
                            <Input placeholder="请输入关键词" maxLength={50} />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <Button type="link" onClick={() => remove(field.name)}>
                              删除
                            </Button>
                          ) : null}
                        </Flex>
                      ))}
                      <Button type="link" icon={<PlusOutlined />} onClick={() => add('')} style={{ alignSelf: 'flex-start' }}>
                        添加关键词
                      </Button>
                      <Form.ErrorList errors={errors} />
                    </Flex>
                  )}
                </Form.List>
              </Form.Item>

              <Form.Item
                name="keywordMinHits"
                label="至少命中"
                extra="命中数 ≥ 该值得满分，否则 0 分。"
                rules={[
                  { required: true, message: '请输入至少命中数' },
                  {
                    validator: async (_, value) => {
                      if (value == null) return;
                      if (Number(value) < 1) throw new Error('至少命中数不能小于 1');
                      if (keywordCount > 0 && Number(value) > keywordCount) {
                        throw new Error('至少命中数不能大于关键词个数');
                      }
                    },
                  },
                ]}
              >
                <InputNumber min={1} max={Math.max(1, keywordCount)} precision={0} addonAfter="个关键词" style={{ width: '100%' }} />
              </Form.Item>
            </>
          ) : null}

          <Form.Item name="analysis" label="试题解析" rules={[{ max: 500, message: '试题解析不超过 500 个字' }]}>
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="请输入试题解析" />
          </Form.Item>

          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Radio.Group optionType="button" buttonStyle="solid">
              {questionStatuses.map((item) => (
                <Radio.Button key={item} value={item}>
                  {item}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" loading={saving} onClick={() => void save()}>
              保存
            </Button>
            <Button disabled={saving} onClick={resetForm}>
              重置
            </Button>
            <Button disabled={saving} onClick={leave}>
              取消
            </Button>
          </Space>
        </div>
      </Form>

      <Modal
        title="批量添加答案"
        open={batchBlankOpen}
        footer={modalFooter}
        onOk={confirmBatchBlankAnswers}
        onCancel={() => {
          setBatchBlankOpen(false);
          setBatchBlankText('');
        }}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          每行输入一个答案，确认后将追加到答案列表。
        </Typography.Text>
        <Input.TextArea
          rows={8}
          value={batchBlankText}
          onChange={(event) => setBatchBlankText(event.target.value)}
          placeholder={'答案一\n答案二\n答案三'}
        />
      </Modal>
    </div>
  );
}
