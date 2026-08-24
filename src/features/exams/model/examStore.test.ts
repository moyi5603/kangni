import { beforeEach, describe, expect, it } from 'vitest';
import { calculateExamTotalScore, canDeleteExam, initialExams, listExamsUsingPaper, type ExamRecord } from './exam';
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

describe('exam mock data', () => {
  it('fills exam seeds with paper, times, tags, audience and description', () => {
    expect(initialExams.length).toBeGreaterThanOrEqual(8);
    for (const exam of initialExams) {
      expect(exam.categoryId).toEqual(expect.any(Number));
      expect(exam.paperId).toEqual(expect.any(Number));
      expect(exam.examTimes).toEqual(expect.any(Number));
      expect(exam.tags?.trim()).toBeTruthy();
      expect(exam.audience?.trim()).toBeTruthy();
      expect(exam.descriptionHtml?.replace(/<[^>]+>/g, '').trim()).toBeTruthy();
    }
    expect(initialExams.find((item) => item.id === 5)?.paperId).toBe(2);
    expect(initialExams.find((item) => item.id === 7)?.examTimes).toBe(5);
    expect(initialExams.filter((item) => item.paperId === 1)).toHaveLength(0);
  });
});

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

describe('listExamsUsingPaper', () => {
  it('keeps only exams that select the paper', () => {
    const exams = [
      { paperId: 2 },
      { paperId: 1 },
      { paperId: null },
      { paperId: 2 },
    ];
    expect(listExamsUsingPaper(exams, 2)).toHaveLength(2);
    expect(listExamsUsingPaper(exams, 9)).toHaveLength(0);
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
    setExamCategory([1], 212);
    expect(getExamCategoryUsage(212).canDelete).toBe(false);
    expect(removeExamCategoryNode(212)).toBe(false);
    setExamCategory([1], null);
    expect(getExamCategoryUsage(212).canDelete).toBe(true);
  });

  it('upserts exam and adds category node', () => {
    const node = addExamCategoryNode('新分类', null);
    expect(addExamCategoryNode('四级', 1011)).toBeNull();
    upsertExam({
      id: 99,
      name: '单元测考试',
      categoryId: node!.id,
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
      paperId: 1,
      questionRules: [{ id: 1, difficulty: '简单', questionCount: 10, scorePerQuestion: 2 }],
      totalScore: 20,
      examTimes: 2,
      tags: '数据分析,岗位',
      audience: '产品经理',
      descriptionHtml: '<p>请按时完成</p>',
    });
    expect(getExam(99)?.name).toBe('单元测考试');
    expect(getExam(99)?.paperId).toBe(1);
    expect(getExam(99)?.totalScore).toBe(20);
    expect(getExam(99)?.questionRules).toHaveLength(1);
  });
});
