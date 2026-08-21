import { beforeEach, describe, expect, it } from 'vitest';
import { calculateExamTotalScore, canDeleteExam, type ExamRecord } from './exam';
import {
  __resetExamStoreForTests,
  addExamCategoryNode,
  getExam,
  getExamCategoryUsage,
  removeExam,
  removeExamCategoryNode,
  setExamPublishStatus,
  setExamCategory,
  upsertExam,
} from './examStore';

describe('canDeleteExam', () => {
  it('allows delete only when unpublished', () => {
    expect(canDeleteExam({ publishStatus: '未发布' } as ExamRecord)).toBe(true);
    expect(canDeleteExam({ publishStatus: '已发布' } as ExamRecord)).toBe(false);
  });
});

describe('calculateExamTotalScore', () => {
  it('sums question count multiplied by score per question', () => {
    expect(
      calculateExamTotalScore([
        { questionCount: 10, scorePerQuestion: 2 },
        { questionCount: 5, scorePerQuestion: 8 },
      ]),
    ).toBe(60);
  });
});

describe('examStore', () => {
  beforeEach(() => {
    __resetExamStoreForTests();
  });

  it('filters nothing here but publishes and unpublishes', () => {
    const first = getExam(1);
    expect(first).toBeTruthy();
    setExamPublishStatus([1], '已发布');
    expect(getExam(1)?.publishStatus).toBe('已发布');
    setExamPublishStatus([1], '未发布');
    expect(getExam(1)?.publishStatus).toBe('未发布');
  });

  it('blocks delete when published', () => {
    setExamPublishStatus([1], '已发布');
    expect(removeExam(1)).toBe(false);
    setExamPublishStatus([1], '未发布');
    expect(removeExam(1)).toBe(true);
    expect(getExam(1)).toBeUndefined();
  });

  it('sets category on selected exams', () => {
    setExamCategory([1], 10);
    expect(getExam(1)?.categoryId).toBe(10);
  });

  it('blocks category delete when exams use subtree', () => {
    setExamCategory([1], 10);
    expect(getExamCategoryUsage(10).canDelete).toBe(false);
    expect(removeExamCategoryNode(10)).toBe(false);
    setExamCategory([1], null);
    expect(getExamCategoryUsage(10).canDelete).toBe(true);
  });

  it('upserts exam and adds category node', () => {
    const node = addExamCategoryNode('新分类', null);
    upsertExam({
      id: 99,
      name: '单元测考试',
      categoryId: node.id,
      startAt: '2026-08-20 00:00:00',
      endAt: '2026-08-21 00:00:00',
      durationMinutes: 60,
      passScore: 60,
      points: 10,
      publishStatus: '未发布',
      examStatus: '未开始',
      creator: '测试',
      createdAt: '2026-08-20 00:00:00',
      updatedAt: '2026-08-20 00:00:00',
      certificateId: 1,
      questionRules: [{ id: 1, difficulty: '简单', questionCount: 10, scorePerQuestion: 2 }],
      totalScore: 20,
      examTimes: 2,
      tags: '数据分析,岗位',
      audience: '产品经理',
      descriptionHtml: '<p>请按时完成</p>',
    });
    expect(getExam(99)?.name).toBe('单元测考试');
    expect(getExam(99)?.totalScore).toBe(20);
    expect(getExam(99)?.questionRules).toHaveLength(1);
  });
});
