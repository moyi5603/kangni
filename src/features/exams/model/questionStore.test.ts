import { beforeEach, describe, expect, it } from 'vitest';
import type { QuestionRecord } from './question';
import {
  __resetAllQuestionStoresForTests,
  __resetQuestionStoreForTests,
  addQuestionCategoryNode,
  getQuestion,
  getQuestionStore,
  getQuestionCategoryUsage,
  removeQuestion,
  removeQuestionCategoryNode,
  setQuestionCategory,
  setQuestionStatus,
  upsertQuestion,
} from './questionStore';

describe('questionStore', () => {
  beforeEach(() => {
    __resetQuestionStoreForTests();
  });

  it('enables and disables questions', () => {
    setQuestionStatus([1], '禁用');
    expect(getQuestion(1)?.status).toBe('禁用');
    setQuestionStatus([1], '启用');
    expect(getQuestion(1)?.status).toBe('启用');
  });

  it('sets category on selected questions', () => {
    setQuestionCategory([1], 2);
    expect(getQuestion(1)?.categoryId).toBe(2);
  });

  it('blocks category delete when questions use subtree', () => {
    const node = addQuestionCategoryNode('临时分类', null);
    setQuestionCategory([1], node!.id);
    expect(getQuestionCategoryUsage(node!.id).canDelete).toBe(false);
    expect(removeQuestionCategoryNode(node!.id)).toBe(false);
    setQuestionCategory([1], null);
    expect(getQuestionCategoryUsage(node!.id).canDelete).toBe(true);
  });

  it('upserts question and adds category node', () => {
    const l2 = addQuestionCategoryNode('二级', 1);
    const l3 = addQuestionCategoryNode('三级', l2!.id);
    expect(addQuestionCategoryNode('四级', l3!.id)).toBeNull();
    const node = addQuestionCategoryNode('新分类', null);
    upsertQuestion({
      id: 99,
      categoryId: node!.id,
      type: '单选',
      difficulty: '初级',
      stem: '测试题干',
      status: '启用',
      creator: '产品管理员',
      createdAt: '2026-08-20 10:00:00',
      updatedAt: '2026-08-20 10:00:00',
    } as QuestionRecord);
    expect(getQuestion(99)?.stem).toBe('测试题干');
    expect(removeQuestion(99)).toBe(true);
    expect(getQuestion(99)).toBeUndefined();
  });

  it('keeps exam and practice stores isolated', () => {
    __resetAllQuestionStoresForTests();
    const examStore = getQuestionStore('exam');
    const practiceStore = getQuestionStore('practice');

    examStore.setQuestionStatus([1], '禁用');
    expect(examStore.getQuestion(1)?.status).toBe('禁用');
    expect(practiceStore.getQuestion(101)?.status).toBe('启用');

    practiceStore.upsertQuestion({
      id: 201,
      categoryId: 101,
      type: '判断',
      difficulty: '初级',
      stem: '练习专用题',
      status: '启用',
      creator: 'trainer',
      createdAt: '2026-08-20 10:00:00',
      updatedAt: '2026-08-20 10:00:00',
    } as QuestionRecord);
    expect(practiceStore.getQuestion(201)?.stem).toBe('练习专用题');
    expect(examStore.getQuestion(201)).toBeUndefined();
  });
});
