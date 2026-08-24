import { describe, expect, it } from 'vitest';
import {
  calculatePaperTotals,
  countEnabledQuestionsByTypeAndDifficulty,
  defaultPaperBankMatrix,
  defaultPaperDifficultyCounts,
  defaultPaperTypeCounts,
  defaultPaperTypeScores,
  difficultyCountsFromMatrix,
  applyPaperSelectionMode,
  filterPaperPickerQuestions,
  hydratePaperBankRule,
  resolvePaperSelectionMode,
  resolvePaperTotals,
  setPaperBankMatrixCell,
  syncPaperBankRules,
  typeCountsFromMatrix,
} from './paper';

describe('paper helpers', () => {
  it('builds default score rows for all question types', () => {
    expect(defaultPaperTypeScores()).toHaveLength(5);
    expect(defaultPaperTypeScores()[0]?.type).toBe('单选');
  });

  it('builds default difficulty rows', () => {
    expect(defaultPaperDifficultyCounts().map((row) => row.difficulty)).toEqual(['初级', '中级', '高级', '资深']);
  });

  it('calculates total question count and score', () => {
    const totals = calculatePaperTotals([
      { type: '单选', questionCount: 10, scorePerQuestion: 5 },
      { type: '判断', questionCount: 5, scorePerQuestion: 2 },
    ]);
    expect(totals.questionCount).toBe(15);
    expect(totals.totalScore).toBe(60);
  });

  it('derives type and difficulty totals from one matrix', () => {
    const matrix = setPaperBankMatrixCell(
      setPaperBankMatrixCell(defaultPaperBankMatrix(), '单选', '初级', 3),
      '判断',
      '中级',
      2,
    );
    expect(typeCountsFromMatrix(matrix).find((row) => row.type === '单选')?.questionCount).toBe(3);
    expect(typeCountsFromMatrix(matrix).find((row) => row.type === '判断')?.questionCount).toBe(2);
    expect(difficultyCountsFromMatrix(matrix).find((row) => row.difficulty === '初级')?.questionCount).toBe(3);
    expect(difficultyCountsFromMatrix(matrix).find((row) => row.difficulty === '中级')?.questionCount).toBe(2);
  });

  it('syncs bank rules when selected banks change and keeps matrix cells', () => {
    const next = syncPaperBankRules([2, 4], [
      hydratePaperBankRule({
        categoryId: 2,
        matrix: setPaperBankMatrixCell(defaultPaperBankMatrix(), '单选', '初级', 3),
      }),
    ]);
    expect(next.map((item) => item.categoryId)).toEqual([2, 4]);
    expect(next.find((item) => item.categoryId === 2)?.matrix?.单选.初级).toBe(3);
    expect(next.find((item) => item.categoryId === 2)?.typeCounts.find((row) => row.type === '单选')?.questionCount).toBe(3);
    expect(next.find((item) => item.categoryId === 2)?.difficultyCounts.find((row) => row.difficulty === '初级')?.questionCount).toBe(3);
    expect(next.find((item) => item.categoryId === 4)?.difficultyCounts[0]?.questionCount).toBe(0);
  });

  it('counts enabled questions by type and difficulty', () => {
    const available = countEnabledQuestionsByTypeAndDifficulty(
      [
        { categoryId: 2, type: '单选', difficulty: '初级', status: '启用' },
        { categoryId: 2, type: '单选', difficulty: '初级', status: '启用' },
        { categoryId: 2, type: '判断', difficulty: '中级', status: '禁用' },
        { categoryId: 3, type: '单选', difficulty: '初级', status: '启用' },
      ],
      [2],
    );
    expect(available.单选.初级).toBe(2);
    expect(available.判断.中级).toBe(0);
  });

  it('resolves totals from selected banks for every generation mode', () => {
    const bankRules = [
      {
        categoryId: 2,
        typeCounts: defaultPaperTypeCounts().map((row) =>
          row.type === '单选' ? { ...row, questionCount: 4 } : row.type === '判断' ? { ...row, questionCount: 2 } : row,
        ),
        difficultyCounts: defaultPaperDifficultyCounts(),
      },
      {
        categoryId: 4,
        typeCounts: defaultPaperTypeCounts().map((row) => (row.type === '单选' ? { ...row, questionCount: 1 } : row)),
        difficultyCounts: defaultPaperDifficultyCounts(),
      },
    ];
    const typeScores = defaultPaperTypeScores().map((row) =>
      row.type === '单选' ? { ...row, scorePerQuestion: 5 } : row.type === '判断' ? { ...row, scorePerQuestion: 2 } : row,
    );
    expect(resolvePaperTotals({ generationMode: '随机出题', typeScores, bankRules }).questionCount).toBe(7);
    expect(resolvePaperTotals({ generationMode: '固定出题', typeScores, bankRules }).totalScore).toBe(29);
  });

  it('forces bank-rule selection for random generation', () => {
    expect(resolvePaperSelectionMode({ generationMode: '随机出题', selectionMode: '指定题目' })).toBe('按题库抽题');
    expect(resolvePaperSelectionMode({ generationMode: '固定出题', selectionMode: '指定题目' })).toBe('指定题目');
  });

  it('clears the other side when switching selection mode', () => {
    const picked = applyPaperSelectionMode(
      {
        selectionMode: '按题库抽题',
        bankRules: [hydratePaperBankRule({ categoryId: 2, matrix: defaultPaperBankMatrix() })],
        questionIds: [1],
      },
      '指定题目',
    );
    expect(picked.selectionMode).toBe('指定题目');
    expect(picked.bankRules).toEqual([]);
    expect(picked.questionIds).toEqual([1]);

    const byBank = applyPaperSelectionMode(picked, '按题库抽题');
    expect(byBank.selectionMode).toBe('按题库抽题');
    expect(byBank.questionIds).toEqual([]);
  });

  it('resolves totals from specified questions and ignores bank rules', () => {
    const typeScores = defaultPaperTypeScores().map((row) =>
      row.type === '单选' ? { ...row, scorePerQuestion: 5 } : row.type === '判断' ? { ...row, scorePerQuestion: 2 } : row,
    );
    const bankRules = [
      {
        categoryId: 2,
        typeCounts: defaultPaperTypeCounts().map((row) => (row.type === '单选' ? { ...row, questionCount: 9 } : row)),
        difficultyCounts: defaultPaperDifficultyCounts(),
      },
    ];
    const totals = resolvePaperTotals({
      generationMode: '固定出题',
      selectionMode: '指定题目',
      typeScores,
      bankRules,
      questionIds: [1, 2],
      questions: [
        { id: 1, type: '单选' },
        { id: 2, type: '判断' },
        { id: 3, type: '单选' },
      ],
    });
    expect(totals.questionCount).toBe(2);
    expect(totals.totalScore).toBe(7);
  });

  it('filters picker questions by bank subtree, stem, type and difficulty', () => {
    const tree = [{ id: 1, name: '根', children: [{ id: 11, name: '子' }] }];
    const questions = [
      { id: 1, categoryId: 11, stem: '长江是亚洲第一大河', type: '判断' as const, difficulty: '初级' as const, status: '启用' },
      { id: 2, categoryId: 11, stem: '项目经理的主要工作', type: '填空' as const, difficulty: '中级' as const, status: '启用' },
      { id: 3, categoryId: 2, stem: '长江流域', type: '判断' as const, difficulty: '初级' as const, status: '启用' },
      { id: 4, categoryId: 11, stem: '长江禁用题', type: '判断' as const, difficulty: '初级' as const, status: '禁用' },
    ];
    expect(filterPaperPickerQuestions(questions, { stem: '长江', categoryId: 1, type: '判断', difficulty: '初级' }, tree).map((item) => item.id)).toEqual([1]);
  });
});
