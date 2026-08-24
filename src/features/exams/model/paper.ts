import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import { subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import { questionDifficulties, questionTypes, stripRichText, type QuestionDifficulty, type QuestionType } from './question';

export const PAPER_MOCK_VERSION = 6;

export const paperGenerationModes = ['随机出题', '固定出题'] as const;
export type PaperGenerationMode = (typeof paperGenerationModes)[number];

export const paperStatuses = ['启用', '禁用'] as const;
export type PaperStatus = (typeof paperStatuses)[number];

export const paperGenerationModeLabels: Record<PaperGenerationMode, string> = {
  随机出题: '随机出题（一人一卷）',
  固定出题: '固定出题',
};

export const paperSelectionModes = ['按题库抽题', '指定题目'] as const;
export type PaperSelectionMode = (typeof paperSelectionModes)[number];

export type PaperCategoryNode = CategoryNode;

export type PaperTypeScore = {
  type: QuestionType;
  questionCount: number;
  scorePerQuestion: number;
};

export type PaperTypeCount = {
  type: QuestionType;
  questionCount: number;
};

export type PaperDifficultyCount = {
  difficulty: QuestionDifficulty;
  questionCount: number;
};

export type PaperBankMatrix = Record<QuestionType, Record<QuestionDifficulty, number>>;

export type PaperBankRule = {
  categoryId: number;
  matrix?: PaperBankMatrix;
  typeCounts: PaperTypeCount[];
  difficultyCounts: PaperDifficultyCount[];
};

export type PaperRecord = {
  id: number;
  name: string;
  description: string;
  categoryId: number | null;
  generationMode: PaperGenerationMode;
  selectionMode?: PaperSelectionMode;
  typeScores: PaperTypeScore[];
  bankRules?: PaperBankRule[];
  questionIds?: number[];
  status: PaperStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
};

export function defaultPaperTypeScores(): PaperTypeScore[] {
  return questionTypes.map((type) => ({
    type,
    questionCount: 0,
    scorePerQuestion: 0,
  }));
}

export function defaultPaperTypeCounts(): PaperTypeCount[] {
  return questionTypes.map((type) => ({
    type,
    questionCount: 0,
  }));
}

export function defaultPaperDifficultyCounts(): PaperDifficultyCount[] {
  return questionDifficulties.map((difficulty) => ({
    difficulty,
    questionCount: 0,
  }));
}

export function defaultPaperBankMatrix(): PaperBankMatrix {
  return Object.fromEntries(
    questionTypes.map((type) => [type, Object.fromEntries(questionDifficulties.map((difficulty) => [difficulty, 0]))]),
  ) as PaperBankMatrix;
}

export function setPaperBankMatrixCell(
  matrix: PaperBankMatrix,
  type: QuestionType,
  difficulty: QuestionDifficulty,
  questionCount: number,
): PaperBankMatrix {
  return {
    ...matrix,
    [type]: {
      ...matrix[type],
      [difficulty]: Math.max(0, questionCount),
    },
  };
}

export function typeCountsFromMatrix(matrix: PaperBankMatrix): PaperTypeCount[] {
  return questionTypes.map((type) => ({
    type,
    questionCount: questionDifficulties.reduce((sum, difficulty) => sum + (matrix[type]?.[difficulty] || 0), 0),
  }));
}

export function difficultyCountsFromMatrix(matrix: PaperBankMatrix): PaperDifficultyCount[] {
  return questionDifficulties.map((difficulty) => ({
    difficulty,
    questionCount: questionTypes.reduce((sum, type) => sum + (matrix[type]?.[difficulty] || 0), 0),
  }));
}

export function ensurePaperBankMatrix(rule: PaperBankRule): PaperBankMatrix {
  if (rule.matrix) return rule.matrix;
  const matrix = defaultPaperBankMatrix();
  for (const row of rule.typeCounts ?? []) {
    matrix[row.type][questionDifficulties[0]] = row.questionCount || 0;
  }
  return matrix;
}

export function hydratePaperBankRule(rule: Omit<PaperBankRule, 'typeCounts' | 'difficultyCounts'> & Partial<PaperBankRule>): PaperBankRule {
  const matrix = rule.matrix ?? ensurePaperBankMatrix({
    categoryId: rule.categoryId,
    typeCounts: rule.typeCounts ?? defaultPaperTypeCounts(),
    difficultyCounts: rule.difficultyCounts ?? defaultPaperDifficultyCounts(),
    matrix: rule.matrix,
  });
  return {
    categoryId: rule.categoryId,
    matrix,
    typeCounts: typeCountsFromMatrix(matrix),
    difficultyCounts: difficultyCountsFromMatrix(matrix),
  };
}

export function createEmptyPaperBankRule(): PaperBankRule {
  return hydratePaperBankRule({ categoryId: 0, matrix: defaultPaperBankMatrix() });
}

export function syncPaperBankRules(categoryIds: number[], current: PaperBankRule[] = []): PaperBankRule[] {
  return categoryIds.map((categoryId) => {
    const existing = current.find((item) => item.categoryId === categoryId);
    return hydratePaperBankRule({
      ...(existing ?? createEmptyPaperBankRule()),
      categoryId,
    });
  });
}

export function formatPaperBankMatrixSummary(rule: PaperBankRule): string {
  const matrix = ensurePaperBankMatrix(rule);
  const cells: string[] = [];
  for (const type of questionTypes) {
    for (const difficulty of questionDifficulties) {
      const count = matrix[type][difficulty];
      if (count > 0) cells.push(`${type}·${difficulty} ${count} 题`);
    }
  }
  return cells.join('，') || '未设置题数';
}

export function calculatePaperTotals(typeScores: PaperTypeScore[]) {
  return typeScores.reduce(
    (acc, row) => ({
      questionCount: acc.questionCount + (row.questionCount || 0),
      totalScore: acc.totalScore + (row.questionCount || 0) * (row.scorePerQuestion || 0),
    }),
    { questionCount: 0, totalScore: 0 },
  );
}

export function sumBankTypeCounts(bankRules: PaperBankRule[] = []): Record<QuestionType, number> {
  const totals = Object.fromEntries(questionTypes.map((type) => [type, 0])) as Record<QuestionType, number>;
  for (const rule of bankRules) {
    for (const row of typeCountsFromMatrix(ensurePaperBankMatrix(rule))) {
      totals[row.type] += row.questionCount || 0;
    }
  }
  return totals;
}

export function sumQuestionTypeCounts(
  questions: { id: number; type: QuestionType }[] = [],
  questionIds: number[] = [],
): Record<QuestionType, number> {
  const totals = Object.fromEntries(questionTypes.map((type) => [type, 0])) as Record<QuestionType, number>;
  const catalog = new Map(questions.map((item) => [item.id, item]));
  for (const id of questionIds) {
    const question = catalog.get(id);
    if (question) totals[question.type] += 1;
  }
  return totals;
}

export function resolvePaperSelectionMode(record: {
  generationMode: PaperGenerationMode;
  selectionMode?: PaperSelectionMode;
}): PaperSelectionMode {
  if (record.generationMode === '随机出题') return '按题库抽题';
  return record.selectionMode ?? '按题库抽题';
}

export function applyPaperSelectionMode(
  current: { selectionMode?: PaperSelectionMode; bankRules?: PaperBankRule[]; questionIds?: number[] },
  nextMode: PaperSelectionMode,
): { selectionMode: PaperSelectionMode; bankRules: PaperBankRule[]; questionIds: number[] } {
  if (nextMode === '指定题目') {
    return { selectionMode: nextMode, bankRules: [], questionIds: current.questionIds ?? [] };
  }
  return { selectionMode: nextMode, bankRules: current.bankRules ?? [], questionIds: [] };
}

export function resolvePaperTypeCounts(record: {
  generationMode: PaperGenerationMode;
  selectionMode?: PaperSelectionMode;
  bankRules?: PaperBankRule[];
  questionIds?: number[];
  questions?: { id: number; type: QuestionType }[];
}): Record<QuestionType, number> {
  return resolvePaperSelectionMode(record) === '指定题目'
    ? sumQuestionTypeCounts(record.questions, record.questionIds)
    : sumBankTypeCounts(record.bankRules);
}

export function resolvePaperTotals(record: {
  generationMode: PaperGenerationMode;
  selectionMode?: PaperSelectionMode;
  typeScores: PaperTypeScore[];
  bankRules?: PaperBankRule[];
  questionIds?: number[];
  questions?: { id: number; type: QuestionType }[];
}) {
  const counts = resolvePaperTypeCounts(record);
  return calculatePaperTotals(
    record.typeScores.map((row) => ({
      ...row,
      questionCount: counts[row.type] ?? 0,
    })),
  );
}

export function countEnabledQuestionsByType(
  questions: { categoryId: number | null; type: QuestionType; status: string }[],
  categoryIds: number[],
): Record<QuestionType, number> {
  const idSet = new Set(categoryIds);
  const totals = Object.fromEntries(questionTypes.map((type) => [type, 0])) as Record<QuestionType, number>;
  for (const question of questions) {
    if (question.status !== '启用') continue;
    if (question.categoryId == null || !idSet.has(question.categoryId)) continue;
    totals[question.type] += 1;
  }
  return totals;
}

export function countEnabledQuestionsByDifficulty(
  questions: { categoryId: number | null; difficulty: QuestionDifficulty; status: string }[],
  categoryIds: number[],
): Record<QuestionDifficulty, number> {
  const idSet = new Set(categoryIds);
  const totals = Object.fromEntries(questionDifficulties.map((item) => [item, 0])) as Record<QuestionDifficulty, number>;
  for (const question of questions) {
    if (question.status !== '启用') continue;
    if (question.categoryId == null || !idSet.has(question.categoryId)) continue;
    totals[question.difficulty] += 1;
  }
  return totals;
}

export function countEnabledQuestionsByTypeAndDifficulty(
  questions: { categoryId: number | null; type: QuestionType; difficulty: QuestionDifficulty; status: string }[],
  categoryIds: number[],
): PaperBankMatrix {
  const idSet = new Set(categoryIds);
  const totals = defaultPaperBankMatrix();
  for (const question of questions) {
    if (question.status !== '启用') continue;
    if (question.categoryId == null || !idSet.has(question.categoryId)) continue;
    totals[question.type][question.difficulty] += 1;
  }
  return totals;
}

export type PaperQuestionPickerQuery = {
  stem?: string;
  categoryId?: number;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
};

export function filterPaperPickerQuestions<
  T extends {
    categoryId: number | null;
    stem: string;
    type: QuestionType;
    difficulty: QuestionDifficulty;
    status: string;
  },
>(questions: T[], query: PaperQuestionPickerQuery, categoryTree: CategoryNode[]): T[] {
  const stem = query.stem?.trim() ?? '';
  const categoryIds = query.categoryId ? new Set(subtreeIdsOf(categoryTree, query.categoryId)) : null;
  return questions.filter((item) => {
    if (item.status !== '启用') return false;
    if (stem && !stripRichText(item.stem).includes(stem)) return false;
    if (query.type && item.type !== query.type) return false;
    if (query.difficulty && item.difficulty !== query.difficulty) return false;
    if (categoryIds && (item.categoryId == null || !categoryIds.has(item.categoryId))) return false;
    return true;
  });
}

export const initialPaperCategoryTree: PaperCategoryNode[] = [
  { id: 1, name: '入职培训' },
  {
    id: 2,
    name: '岗位认证',
    children: [
      { id: 21, name: '产品岗' },
      { id: 22, name: '技术岗' },
    ],
  },
  { id: 3, name: '合规考试' },
];

const seed = (
  id: number,
  name: string,
  categoryId: number,
  generationMode: PaperGenerationMode,
  description: string,
  typeScores: PaperTypeScore[],
  status: PaperStatus = '启用',
  bankRules?: PaperBankRule[],
): PaperRecord => ({
  id,
  name,
  description,
  categoryId,
  generationMode,
  selectionMode: generationMode === '固定出题' ? '按题库抽题' : '按题库抽题',
  typeScores,
  bankRules,
  questionIds: [],
  status,
  creator: '产品管理员',
  createdAt: '2026-08-01 10:00:00',
  updatedAt: '2026-08-01 10:00:00',
});

export const initialPapers: PaperRecord[] = [
  seed(
    1,
    '数据合规基础测评',
    3,
    '固定出题',
    '覆盖数据合规与安全基础知识，用于入职必修考核。',
    [
      { type: '单选', questionCount: 0, scorePerQuestion: 5 },
      { type: '多选', questionCount: 0, scorePerQuestion: 5 },
      { type: '判断', questionCount: 0, scorePerQuestion: 2 },
      { type: '填空', questionCount: 0, scorePerQuestion: 0 },
      { type: '问答题', questionCount: 0, scorePerQuestion: 0 },
    ],
    '启用',
    [
      hydratePaperBankRule({
        categoryId: 2,
        matrix: {
          单选: { 初级: 2, 中级: 0, 高级: 0, 资深: 0 },
          多选: { 初级: 1, 中级: 0, 高级: 0, 资深: 0 },
          判断: { 初级: 1, 中级: 0, 高级: 0, 资深: 0 },
          填空: { 初级: 0, 中级: 1, 高级: 0, 资深: 0 },
          问答题: { 初级: 0, 中级: 0, 高级: 0, 资深: 0 },
        },
      }),
    ],
  ),
  seed(
    2,
    'Java 初级能力卷',
    22,
    '随机出题',
    '按题型随机抽题，每位考生试卷内容不同。',
    [
      { type: '单选', questionCount: 0, scorePerQuestion: 2 },
      { type: '多选', questionCount: 0, scorePerQuestion: 4 },
      { type: '判断', questionCount: 0, scorePerQuestion: 1 },
      { type: '填空', questionCount: 0, scorePerQuestion: 5 },
      { type: '问答题', questionCount: 0, scorePerQuestion: 10 },
    ],
    '启用',
    [
      hydratePaperBankRule({
        categoryId: 4,
        matrix: {
          单选: { 初级: 0, 中级: 1, 高级: 0, 资深: 0 },
          多选: { 初级: 0, 中级: 1, 高级: 0, 资深: 0 },
          判断: { 初级: 0, 中级: 1, 高级: 0, 资深: 0 },
          填空: { 初级: 0, 中级: 0, 高级: 1, 资深: 0 },
          问答题: { 初级: 0, 中级: 0, 高级: 0, 资深: 0 },
        },
      }),
    ],
  ),
  seed(
    3,
    '企业价值观抽题卷',
    1,
    '随机出题',
    '从指定试题库分类抽题组卷。',
    [
      { type: '单选', questionCount: 0, scorePerQuestion: 5 },
      { type: '多选', questionCount: 0, scorePerQuestion: 5 },
      { type: '判断', questionCount: 0, scorePerQuestion: 2 },
      { type: '填空', questionCount: 0, scorePerQuestion: 0 },
      { type: '问答题', questionCount: 0, scorePerQuestion: 0 },
    ],
    '启用',
    [
      hydratePaperBankRule({
        categoryId: 1,
        matrix: {
          单选: { 初级: 1, 中级: 0, 高级: 0, 资深: 0 },
          多选: { 初级: 0, 中级: 1, 高级: 0, 资深: 0 },
          判断: { 初级: 0, 中级: 1, 高级: 0, 资深: 0 },
          填空: { 初级: 0, 中级: 0, 高级: 0, 资深: 0 },
          问答题: { 初级: 0, 中级: 0, 高级: 0, 资深: 0 },
        },
      }),
    ],
  ),
];
