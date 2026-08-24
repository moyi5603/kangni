import { beforeEach, describe, expect, it } from 'vitest';
import { defaultPaperTypeScores } from './paper';
import {
  __resetPaperStoreForTests,
  addPaperCategoryNode,
  getPaper,
  getPaperCategoryUsage,
  removePaper,
  setPaperStatus,
  upsertPaper,
} from './paperStore';

describe('paperStore', () => {
  beforeEach(() => {
    __resetPaperStoreForTests();
  });

  it('upserts paper with type scores', () => {
    upsertPaper({
      id: 99,
      name: '单元测试卷',
      description: '说明',
      categoryId: 1,
      generationMode: '随机出题',
      typeScores: defaultPaperTypeScores().map((row, index) =>
        index === 0 ? { ...row, questionCount: 5, scorePerQuestion: 2 } : row,
      ),
      status: '启用',
      creator: '测试',
      createdAt: '2026-08-20 10:00:00',
      updatedAt: '2026-08-20 10:00:00',
    });
    expect(getPaper(99)?.generationMode).toBe('随机出题');
    expect(removePaper(99)).toBe(true);
  });

  it('enables and disables papers', () => {
    setPaperStatus([1], '禁用');
    expect(getPaper(1)?.status).toBe('禁用');
    setPaperStatus([1], '启用');
    expect(getPaper(1)?.status).toBe('启用');
  });

  it('blocks category delete when papers use subtree', () => {
    const l3 = addPaperCategoryNode('三级', 21);
    expect(addPaperCategoryNode('四级', l3!.id)).toBeNull();
    const node = addPaperCategoryNode('临时分类', null);
    upsertPaper({
      id: 100,
      name: '占用分类卷',
      description: '',
      categoryId: node!.id,
      generationMode: '固定出题',
      typeScores: defaultPaperTypeScores(),
      status: '启用',
      creator: '测试',
      createdAt: '2026-08-20 10:00:00',
      updatedAt: '2026-08-20 10:00:00',
    });
    expect(getPaperCategoryUsage(node.id).canDelete).toBe(false);
  });
});
