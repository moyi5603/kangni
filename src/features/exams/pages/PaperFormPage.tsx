import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  TreeSelect,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import { findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import { questionDifficulties, questionTypes, stripRichText } from '../model/question';
import {
  applyPaperSelectionMode,
  countEnabledQuestionsByTypeAndDifficulty,
  filterPaperPickerQuestions,
  createEmptyPaperBankRule,
  defaultPaperTypeScores,
  ensurePaperBankMatrix,
  hydratePaperBankRule,
  paperGenerationModeLabels,
  paperGenerationModes,
  paperSelectionModes,
  resolvePaperSelectionMode,
  resolvePaperTotals,
  syncPaperBankRules,
  type PaperBankRule,
  type PaperGenerationMode,
  type PaperQuestionPickerQuery,
  type PaperRecord,
  type PaperSelectionMode,
  type PaperTypeScore,
} from '../model/paper';
import { BankDrawMatrix, PaperQuestionTotals, TypeScoreTable } from '../components/paperQuestionFields';
import { getPaper, upsertPaper, usePaperCategoryTree } from '../model/paperStore';
import { useQuestionCategoryTree, useQuestions } from '../model/questionStore';
import { SearchField } from '../../../shared/ui/ListPage';

type Props = { mode: 'create' | 'edit'; recordId?: string; onBack: () => void };

const emptyPickerQuery: PaperQuestionPickerQuery = {};

function categoryNameOf(tree: CategoryNode[], categoryId: number | null) {
  if (categoryId === null) return '-';
  return findCategoryNode(tree, categoryId)?.name ?? '-';
}

type FormValues = {
  name: string;
  description?: string;
  categoryId: number;
  generationMode: PaperGenerationMode;
  selectionMode: PaperSelectionMode;
  typeScores: PaperTypeScore[];
  bankRules?: PaperBankRule[];
  questionIds?: number[];
};

function toTreeData(
  nodes: CategoryNode[],
): { title: string; value: number; key: number; children?: ReturnType<typeof toTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children ? toTreeData(node.children) : undefined,
  }));
}

export function PaperFormPage({ mode, recordId, onBack }: Props) {
  const { message, modal } = App.useApp();
  const categoryTree = usePaperCategoryTree();
  const questionCategoryTree = useQuestionCategoryTree();
  const questions = useQuestions();
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKeys, setPickerKeys] = useState<number[]>([]);
  const [pickerDraft, setPickerDraft] = useState<PaperQuestionPickerQuery>(emptyPickerQuery);
  const [pickerQuery, setPickerQuery] = useState<PaperQuestionPickerQuery>(emptyPickerQuery);
  const editing = mode === 'edit' && recordId ? getPaper(Number(recordId)) : undefined;
  const title = mode === 'edit' ? '编辑试卷' : '新建试卷';
  const watchedTypeScores = Form.useWatch('typeScores', form) ?? defaultPaperTypeScores();
  const watchedMode = Form.useWatch('generationMode', form) ?? '固定出题';
  const watchedSelectionMode = Form.useWatch('selectionMode', form) ?? '按题库抽题';
  const watchedBankRules = Form.useWatch('bankRules', form) ?? [];
  const watchedQuestionIds = Form.useWatch('questionIds', form) ?? [];
  const selectionMode = resolvePaperSelectionMode({
    generationMode: watchedMode,
    selectionMode: watchedSelectionMode,
  });
  const pickQuestions = selectionMode === '指定题目';
  const totals = useMemo(
    () =>
      resolvePaperTotals({
        generationMode: watchedMode,
        selectionMode,
        typeScores: watchedTypeScores,
        bankRules: watchedBankRules,
        questionIds: watchedQuestionIds,
        questions,
      }),
    [watchedMode, selectionMode, watchedTypeScores, watchedBankRules, watchedQuestionIds, questions],
  );
  const selectedQuestions = useMemo(
    () =>
      watchedQuestionIds
        .map((id) => questions.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [watchedQuestionIds, questions],
  );
  const pickerQuestions = useMemo(
    () => filterPaperPickerQuestions(questions, pickerQuery, questionCategoryTree),
    [questions, pickerQuery, questionCategoryTree],
  );

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.error('试卷不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  useEffect(() => {
    if (!editing && mode === 'create') {
      form.setFieldsValue({
        generationMode: '固定出题',
        selectionMode: '按题库抽题',
        typeScores: defaultPaperTypeScores(),
        bankRules: [],
        questionIds: [],
      });
      return;
    }
    if (!editing) return;
    form.setFieldsValue({
      name: editing.name,
      description: editing.description,
      categoryId: editing.categoryId ?? undefined,
      generationMode: editing.generationMode,
      selectionMode: resolvePaperSelectionMode(editing),
      typeScores: editing.typeScores,
      bankRules: syncPaperBankRules(
        editing.bankRules?.map((item) => item.categoryId) ?? [],
        editing.bankRules,
      ),
      questionIds: editing.questionIds ?? [],
    });
    setDirty(false);
  }, [editing, form, mode]);

  const leave = () => {
    if (!dirty) {
      onBack();
      return;
    }
    modal.confirm({
      title: '确认离开？',
      content: '当前修改尚未保存。',
      okText: '离开',
      cancelText: '继续编辑',
      onOk: onBack,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    const savedSelection = resolvePaperSelectionMode(values);
    const savedPick = savedSelection === '指定题目';
    if (totals.questionCount <= 0) {
      message.error(savedPick ? '请先指定题目' : '请先添加题库并设置题数');
      return;
    }
    setSaving(true);
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const record: PaperRecord = {
      id: editing?.id ?? Date.now(),
      name: values.name.trim(),
      description: values.description?.trim() ?? '',
      categoryId: values.categoryId,
      generationMode: values.generationMode,
      selectionMode: savedSelection,
      typeScores: values.typeScores.map((row) => ({
        type: row.type,
        questionCount: 0,
        scorePerQuestion: row.scorePerQuestion || 0,
      })),
      bankRules: savedPick
        ? []
        : syncPaperBankRules(
            (values.bankRules ?? []).map((item) => item.categoryId).filter((id) => id > 0),
            values.bankRules,
          ),
      questionIds: savedPick ? (values.questionIds ?? []) : [],
      status: editing?.status ?? '启用',
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    upsertPaper(record);
    setDirty(false);
    setSaving(false);
    message.success(mode === 'edit' ? '已保存试卷' : '已创建试卷');
    onBack();
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '考试练习' },
          { title: '考试' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={leave}>
                试卷管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">配置试卷名称、分类、出题方式与按题型分数后保存。</Typography.Text>
      </Flex>

      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        onValuesChange={() => setDirty(true)}
      >
        <Card title="基本信息" variant="borderless">
          <Form.Item name="name" label="试卷名称" rules={[{ required: true, message: '请输入试卷名称' }]}>
            <Input maxLength={50} showCount placeholder="请输入试卷名称，不超过 50 个字" />
          </Form.Item>
          <Form.Item name="description" label="试卷描述" rules={[{ max: 300, message: '试卷描述不超过 300 个字' }]}>
            <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入试卷描述（纯文本）" />
          </Form.Item>
          <Form.Item name="categoryId" label="所属分类" rules={[{ required: true, message: '请选择所属分类' }]}>
            <TreeSelect
              treeData={toTreeData(categoryTree)}
              placeholder="请选择试卷分类"
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <Form.Item name="generationMode" label="出题方式" rules={[{ required: true, message: '请选择出题方式' }]}>
            <Radio.Group
              onChange={(event) => {
                if (event.target.value === '随机出题') {
                  form.setFieldsValue(applyPaperSelectionMode({ bankRules: watchedBankRules, questionIds: watchedQuestionIds }, '按题库抽题'));
                }
              }}
            >
              {paperGenerationModes.map((modeValue) => (
                <Radio key={modeValue} value={modeValue}>
                  {paperGenerationModeLabels[modeValue]}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          {watchedMode === '固定出题' ? (
            <Form.Item name="selectionMode" label="选题方式" rules={[{ required: true, message: '请选择选题方式' }]}>
              <Radio.Group
                onChange={(event) => {
                  form.setFieldsValue(
                    applyPaperSelectionMode(
                      { bankRules: watchedBankRules, questionIds: watchedQuestionIds },
                      event.target.value as PaperSelectionMode,
                    ),
                  );
                }}
              >
                {paperSelectionModes.map((modeValue) => (
                  <Radio key={modeValue} value={modeValue}>
                    {modeValue}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          ) : null}
        </Card>

        <Card
          title="题目设置"
          variant="borderless"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (pickQuestions) {
                  setPickerKeys([]);
                  setPickerDraft(emptyPickerQuery);
                  setPickerQuery(emptyPickerQuery);
                  setPickerOpen(true);
                  return;
                }
                form.setFieldValue('bankRules', [...watchedBankRules, createEmptyPaperBankRule()]);
                setDirty(true);
              }}
            >
              {pickQuestions ? '添加题目' : '添加题库'}
            </Button>
          }
        >
          {pickQuestions ? (
            <Form.Item
              name="questionIds"
              label="指定题目"
              required
              rules={[
                {
                  validator: async (_, value: number[] | undefined) => {
                    if (!value?.length) throw new Error('请先指定题目');
                  },
                },
              ]}
            >
              {selectedQuestions.length ? (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={selectedQuestions}
                  columns={[
                    {
                      title: '题库分类',
                      dataIndex: 'categoryId',
                      width: 120,
                      render: (value: number | null) => categoryNameOf(questionCategoryTree, value),
                    },
                    {
                      title: '题干',
                      dataIndex: 'stem',
                      render: (value: string) => stripRichText(value) || '-',
                    },
                    { title: '题型', dataIndex: 'type', width: 88 },
                    { title: '难度', dataIndex: 'difficulty', width: 88 },
                    {
                      title: '操作',
                      key: 'action',
                      width: 80,
                      render: (_, record) => (
                        <Button
                          type="link"
                          danger
                          aria-label={`移除题目 ${record.id}`}
                          onClick={() => {
                            form.setFieldValue(
                              'questionIds',
                              watchedQuestionIds.filter((id) => id !== record.id),
                            );
                            setDirty(true);
                          }}
                        >
                          移除
                        </Button>
                      ),
                    },
                  ]}
                />
              ) : (
                <Empty description="暂未指定题目，点击右上角「添加题目」从题库选择" />
              )}
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="bankRules"
                noStyle
                rules={[
                  {
                    validator: async (_, value: PaperBankRule[] | undefined) => {
                      if (!value?.some((item) => item.categoryId > 0)) throw new Error('请至少添加一个题库');
                    },
                  },
                ]}
              />
              {watchedBankRules.length ? (
                watchedBankRules.map((rule, index) => {
                  const categoryIds = rule.categoryId ? subtreeIdsOf(questionCategoryTree, rule.categoryId) : [];
                  const selectedIds = watchedBankRules
                    .map((item, itemIndex) => (itemIndex === index ? 0 : item.categoryId))
                    .filter((id) => id > 0);
                  const available = countEnabledQuestionsByTypeAndDifficulty(questions, categoryIds);
                  return (
                    <Form.Item key={`${rule.categoryId}-${index}`} label="题库" required>
                      <div className="paper-bank-block">
                        <Flex gap={8} align="center" className="paper-bank-select">
                          <TreeSelect
                            treeData={toTreeData(questionCategoryTree)}
                            placeholder="请选择题库分类"
                            treeDefaultExpandAll
                            showSearch
                            treeNodeFilterProp="title"
                            value={rule.categoryId || undefined}
                            onChange={(categoryId: number) => {
                              if (selectedIds.includes(categoryId)) {
                                message.warning('该题库已添加');
                                return;
                              }
                              const next = watchedBankRules.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, categoryId } : item,
                              );
                              form.setFieldValue('bankRules', next);
                              setDirty(true);
                            }}
                            style={{ flex: 1, minWidth: 0 }}
                          />
                          <Button
                            type="link"
                            danger
                            onClick={() => {
                              form.setFieldValue(
                                'bankRules',
                                watchedBankRules.filter((_, itemIndex) => itemIndex !== index),
                              );
                              setDirty(true);
                            }}
                          >
                            移除
                          </Button>
                        </Flex>
                        <BankDrawMatrix
                          value={ensurePaperBankMatrix(rule)}
                          available={available}
                          onChange={(matrix) => {
                            const next = watchedBankRules.map((item, itemIndex) =>
                              itemIndex === index ? hydratePaperBankRule({ ...item, matrix }) : item,
                            );
                            form.setFieldValue('bankRules', next);
                            setDirty(true);
                          }}
                        />
                      </div>
                    </Form.Item>
                  );
                })
              ) : (
                <Form.Item label="题库" required>
                  <Empty description="暂未添加题库，点击右上角「添加题库」开始设置" />
                </Form.Item>
              )}
            </>
          )}
          <Form.Item
            name="typeScores"
            label="题型分数"
            rules={[
              {
                validator: async (_, value: PaperTypeScore[] | undefined) => {
                  const next = resolvePaperTotals({
                    generationMode: watchedMode,
                    selectionMode,
                    typeScores: value ?? [],
                    bankRules: watchedBankRules,
                    questionIds: watchedQuestionIds,
                    questions,
                  });
                  if (next.questionCount <= 0) {
                    throw new Error(pickQuestions ? '请先指定题目' : '请先添加题库并设置题数');
                  }
                },
              },
            ]}
          >
            <TypeScoreTable />
          </Form.Item>
          <PaperQuestionTotals questionCount={totals.questionCount} totalScore={totals.totalScore} />
        </Card>

        <Modal
          title="从题库指定题目"
          open={pickerOpen}
          width={880}
          okText="添加"
          cancelText="取消"
          onCancel={() => setPickerOpen(false)}
          onOk={() => {
            const nextIds = [...watchedQuestionIds];
            for (const id of pickerKeys) {
              if (!nextIds.includes(id)) nextIds.push(id);
            }
            form.setFieldValue('questionIds', nextIds);
            setPickerOpen(false);
            setDirty(true);
          }}
          footer={(_, extra) => (
            <Space>
              <extra.OkBtn />
              <extra.CancelBtn />
            </Space>
          )}
        >
          <div className="paper-picker-filters">
            <SearchField label="题库">
              <TreeSelect
                allowClear
                treeData={toTreeData(questionCategoryTree)}
                placeholder="请选择题库"
                treeDefaultExpandAll
                showSearch
                treeNodeFilterProp="title"
                value={pickerDraft.categoryId}
                onChange={(categoryId: number | undefined) => setPickerDraft((current) => ({ ...current, categoryId }))}
              />
            </SearchField>
            <SearchField label="题干">
              <Input
                allowClear
                placeholder="请输入题干"
                value={pickerDraft.stem}
                onChange={(event) => setPickerDraft((current) => ({ ...current, stem: event.target.value }))}
              />
            </SearchField>
            <SearchField label="题型">
              <Select
                allowClear
                placeholder="请选择题型"
                options={questionTypes.map((value) => ({ value, label: value }))}
                value={pickerDraft.type}
                onChange={(type) => setPickerDraft((current) => ({ ...current, type }))}
              />
            </SearchField>
            <SearchField label="难度">
              <Select
                allowClear
                placeholder="请选择难度"
                options={questionDifficulties.map((value) => ({ value, label: value }))}
                value={pickerDraft.difficulty}
                onChange={(difficulty) => setPickerDraft((current) => ({ ...current, difficulty }))}
              />
            </SearchField>
            <div className="paper-picker-filter-actions">
              <Space>
                <Button type="primary" onClick={() => setPickerQuery(pickerDraft)}>
                  查询
                </Button>
                <Button
                  onClick={() => {
                    setPickerDraft(emptyPickerQuery);
                    setPickerQuery(emptyPickerQuery);
                  }}
                >
                  重置
                </Button>
              </Space>
            </div>
          </div>
          <Table
            rowKey="id"
            size="small"
            dataSource={pickerQuestions}
            rowSelection={{
              selectedRowKeys: pickerKeys,
              onChange: (keys) => setPickerKeys(keys.map(Number)),
              getCheckboxProps: (record) => ({ disabled: watchedQuestionIds.includes(record.id) }),
            }}
            columns={[
              {
                title: '题库分类',
                dataIndex: 'categoryId',
                width: 120,
                render: (value: number | null) => categoryNameOf(questionCategoryTree, value),
              },
              {
                title: '题干',
                dataIndex: 'stem',
                ellipsis: true,
                render: (value: string) => stripRichText(value) || '-',
              },
              { title: '题型', dataIndex: 'type', width: 80 },
              { title: '难度', dataIndex: 'difficulty', width: 80 },
            ]}
            pagination={{ pageSize: 8 }}
          />
        </Modal>

        <div className="sticky-form-actions">
          <Space>
            <Button onClick={leave}>取消</Button>
            <Button type="primary" loading={saving} onClick={save}>
              保存
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
