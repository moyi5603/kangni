import { Breadcrumb, Button, Card, Descriptions, Empty, Flex, Form, Space, Table, Tabs, Tag, TreeSelect, Typography } from 'antd';
import { findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import {
  BankDrawMatrix,
  PaperQuestionTotals,
  TypeScoreTable,
  toQuestionCategoryTreeData,
} from '../components/paperQuestionFields';
import {
  countEnabledQuestionsByTypeAndDifficulty,
  ensurePaperBankMatrix,
  paperGenerationModeLabels,
  resolvePaperSelectionMode,
  resolvePaperTotals,
  type PaperStatus,
} from '../model/paper';
import { listExamsUsingPaper, type ExamPublishStatus, type ExamStatus } from '../model/exam';
import { useExams } from '../model/examStore';
import { usePaperCategoryTree, usePapers } from '../model/paperStore';
import { stripRichText } from '../model/question';
import { useQuestionCategoryTree, useQuestions } from '../model/questionStore';

const paperDetailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'exams', label: '关联考试' },
] as const;

type PaperDetailTab = (typeof paperDetailTabs)[number]['key'];

function isPaperDetailTab(value: string | undefined): value is PaperDetailTab {
  return !!value && paperDetailTabs.some((item) => item.key === value);
}

const publishStatusColor: Record<ExamPublishStatus, string> = {
  未发布: 'default',
  已发布: 'success',
};

const examStatusColor: Record<ExamStatus, string> = {
  未开始: 'default',
  进行中: 'processing',
  已结束: 'warning',
};

const statusColor: Record<PaperStatus, string> = {
  启用: 'success',
  禁用: 'default',
};

function dash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function categoryNameOf(tree: ReturnType<typeof usePaperCategoryTree>, categoryId: number | null): string {
  if (categoryId === null) return '—';
  return findCategoryNode(tree, categoryId)?.name ?? '—';
}

export function PaperDetailPage({
  recordId,
  tab,
  onBack,
  onEdit,
  onTabChange,
  onOpenExam,
}: {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onTabChange?: (tab: PaperDetailTab) => void;
  onOpenExam?: (id: number) => void;
}) {
  const papers = usePapers();
  const exams = useExams();
  const categoryTree = usePaperCategoryTree();
  const questionCategoryTree = useQuestionCategoryTree();
  const questions = useQuestions();
  const paperId = Number(recordId);
  const paper = papers.find((item) => item.id === paperId);
  const activeTab: PaperDetailTab = isPaperDetailTab(tab) ? tab : 'detail';

  if (!paper) {
    return (
      <div className="page-stack">
        <Breadcrumb
          separator=">"
          items={[
            { title: '考试练习' },
            { title: '考试' },
            {
              title: (
                <Button type="link" className="breadcrumb-link" onClick={onBack}>
                  试卷管理
                </Button>
              ),
            },
            { title: '记录不存在' },
          ]}
        />
        <Empty description="试卷不存在或已删除">
          <Button onClick={onBack}>返回试卷管理</Button>
        </Empty>
      </div>
    );
  }

  const selectionMode = resolvePaperSelectionMode(paper);
  const totals = resolvePaperTotals({ ...paper, questions });
  const selectedQuestions = (paper.questionIds ?? [])
    .map((id) => questions.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const relatedExams = listExamsUsingPaper(exams, paper.id);

  return (
    <div className="page-stack">
      <Breadcrumb
        className="detail-breadcrumb"
        separator=">"
        items={[
          { title: '考试练习' },
          { title: '考试' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                试卷管理
              </Button>
            ),
          },
          { title: paper.name },
          { title: '详情' },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <Flex align="center" gap={12} wrap="wrap">
          <Typography.Title level={1}>{paper.name}</Typography.Title>
          <Tag color={statusColor[paper.status]}>{paper.status}</Tag>
        </Flex>
        <Space size="middle" wrap>
          <Button type="primary" aria-label={`编辑 ${paper.name}`} onClick={() => onEdit(paper.id)}>
            编辑
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>

      <Tabs
        destroyOnHidden
        activeKey={activeTab}
        onChange={(key) => {
          if (isPaperDetailTab(key)) onTabChange?.(key);
        }}
        items={[
          {
            key: 'detail',
            label: '详情',
            children: (
              <div className="page-stack">
      <Card title="基本信息">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '试卷名称', children: paper.name },
            { label: '试卷描述', span: 2, children: dash(paper.description) },
            { label: '所属分类', children: categoryNameOf(categoryTree, paper.categoryId) },
            { label: '出题方式', children: paperGenerationModeLabels[paper.generationMode] },
            ...(paper.generationMode === '固定出题'
              ? [{ label: '选题方式', children: selectionMode }]
              : []),
          ]}
        />
      </Card>

      <Card title="题目设置">
        <Form layout="horizontal" className="edit-form">
          {selectionMode === '指定题目' ? (
            <Form.Item label="指定题目">
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
                      render: (value: string) => stripRichText(value) || '—',
                    },
                    { title: '题型', dataIndex: 'type', width: 88 },
                    { title: '难度', dataIndex: 'difficulty', width: 88 },
                  ]}
                />
              ) : (
                '—'
              )}
            </Form.Item>
          ) : paper.bankRules?.length ? (
            paper.bankRules.map((rule, index) => (
              <Form.Item key={`${rule.categoryId}-${index}`} label="题库">
                <div className="paper-bank-block">
                  <div className="paper-bank-select">
                    <TreeSelect
                      disabled
                      treeData={toQuestionCategoryTreeData(questionCategoryTree)}
                      placeholder="请选择题库分类"
                      treeDefaultExpandAll
                      value={rule.categoryId || undefined}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <BankDrawMatrix
                    readOnly
                    value={ensurePaperBankMatrix(rule)}
                    available={countEnabledQuestionsByTypeAndDifficulty(
                      questions,
                      rule.categoryId ? subtreeIdsOf(questionCategoryTree, rule.categoryId) : [],
                    )}
                  />
                </div>
              </Form.Item>
            ))
          ) : (
            <Form.Item label="题库">—</Form.Item>
          )}
          <Form.Item label="题型分数">
            <TypeScoreTable readOnly value={paper.typeScores} />
          </Form.Item>
          <PaperQuestionTotals questionCount={totals.questionCount} totalScore={totals.totalScore} />
        </Form>
      </Card>
              </div>
            ),
          },
          {
            key: 'exams',
            label: '关联考试',
            children: relatedExams.length ? (
              <Table
                rowKey="id"
                pagination={false}
                dataSource={relatedExams}
                columns={[
                  {
                    title: '考试名称',
                    dataIndex: 'name',
                    render: (value: string, record) => (
                      <Button
                        type="link"
                        className="table-link"
                        aria-label={`详情 ${record.name}`}
                        onClick={() => onOpenExam?.(record.id)}
                      >
                        {value}
                      </Button>
                    ),
                  },
                  { title: '开考时间', dataIndex: 'startAt', width: 180 },
                  { title: '结束时间', dataIndex: 'endAt', width: 180 },
                  {
                    title: '发布状态',
                    dataIndex: 'publishStatus',
                    width: 110,
                    render: (value: ExamPublishStatus) => <Tag color={publishStatusColor[value]}>{value}</Tag>,
                  },
                  {
                    title: '考试状态',
                    dataIndex: 'examStatus',
                    width: 110,
                    render: (value: ExamStatus) => <Tag color={examStatusColor[value]}>{value}</Tag>,
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 80,
                    render: (_, record) => (
                      <Button type="link" aria-label={`详情 ${record.name}`} onClick={() => onOpenExam?.(record.id)}>
                        详情
                      </Button>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无考试使用该试卷" />
            ),
          },
        ]}
      />
    </div>
  );
}
