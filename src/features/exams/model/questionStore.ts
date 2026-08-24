import { useEffect, useState } from 'react';
import {
  initialPracticeQuestionCategoryTree,
  initialPracticeQuestions,
  initialQuestionCategoryTree,
  initialQuestions,
  type QuestionCategoryNode,
  type QuestionRecord,
  type QuestionStatus,
} from './question';
import type { QuestionBankScope } from './questionBank';
import {
  collectCategoryIds,
  canAddCategoryChild,
  findCategoryNode,
  findCategorySiblingContext,
  insertCategory,
  isSiblingNameTaken,
  removeCategoryFromTree,
  renameCategoryInTree,
  updateCategoryChildren,
} from '../../../shared/category-tree/categoryTree';

type QuestionStoreSeed = {
  questions: QuestionRecord[];
  categoryTree: QuestionCategoryNode[];
};

function cloneSeed(seed: QuestionStoreSeed): QuestionStoreSeed {
  return {
    questions: seed.questions.map((item) => ({ ...item })),
    categoryTree: structuredClone(seed.categoryTree),
  };
}

function createQuestionStore(seed: QuestionStoreSeed) {
  const initial = cloneSeed(seed);
  let questions = [...initial.questions];
  let questionCategoryTree = [...initial.categoryTree];
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function reset() {
    const next = cloneSeed(seed);
    questions = [...next.questions];
    questionCategoryTree = [...next.categoryTree];
    emit();
  }

  function useQuestions() {
    const [, setTick] = useState(0);
    useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
    return questions;
  }

  function useQuestionCategoryTree() {
    const [, setTick] = useState(0);
    useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
    return questionCategoryTree;
  }

  function getQuestion(id: number) {
    return questions.find((item) => item.id === id);
  }

  function upsertQuestion(record: QuestionRecord) {
    const current = questions.find((item) => item.id === record.id);
    questions = current ? questions.map((item) => (item.id === record.id ? record : item)) : [record, ...questions];
    emit();
  }

  function removeQuestion(id: number): boolean {
    if (!questions.some((item) => item.id === id)) return false;
    questions = questions.filter((item) => item.id !== id);
    emit();
    return true;
  }

  function setQuestionStatus(ids: number[], status: QuestionStatus) {
    const idSet = new Set(ids);
    questions = questions.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
    emit();
  }

  function setQuestionCategory(ids: number[], categoryId: number | null) {
    const idSet = new Set(ids);
    questions = questions.map((item) => (idSet.has(item.id) ? { ...item, categoryId } : item));
    emit();
  }

  function getQuestionCategoryUsage(categoryId: number): { questionCount: number; canDelete: boolean } {
    const node = findCategoryNode(questionCategoryTree, categoryId);
    if (!node) return { questionCount: 0, canDelete: false };
    const idSet = new Set(collectCategoryIds([node]));
    const questionCount = questions.filter((item) => item.categoryId != null && idSet.has(item.categoryId)).length;
    return { questionCount, canDelete: questionCount === 0 };
  }

  function getQuestionCategoryParentId(id: number): number | null {
    return findCategorySiblingContext(questionCategoryTree, id)?.parentId ?? null;
  }

  function getQuestionCategorySiblingIndex(id: number): { index: number; total: number } | null {
    const ctx = findCategorySiblingContext(questionCategoryTree, id);
    if (!ctx) return null;
    return { index: ctx.index, total: ctx.siblings.length };
  }

  function isQuestionCategoryNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
    return isSiblingNameTaken(questionCategoryTree, name, parentId, excludeId);
  }

  function addQuestionCategoryNode(name: string, parentId: number | null = null): QuestionCategoryNode | null {
    if (!canAddCategoryChild(questionCategoryTree, parentId)) return null;
    const node: QuestionCategoryNode = { id: Date.now(), name };
    if (parentId == null) questionCategoryTree = [...questionCategoryTree, node];
    else questionCategoryTree = insertCategory(questionCategoryTree, parentId, node);
    emit();
    return node;
  }

  function renameQuestionCategory(id: number, name: string): boolean {
    if (!findCategoryNode(questionCategoryTree, id)) return false;
    questionCategoryTree = renameCategoryInTree(questionCategoryTree, id, name);
    emit();
    return true;
  }

  function moveQuestionCategory(id: number, direction: 'up' | 'down'): boolean {
    const ctx = findCategorySiblingContext(questionCategoryTree, id);
    if (!ctx) return false;
    const targetIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1;
    if (targetIndex < 0 || targetIndex >= ctx.siblings.length) return false;
    const reorder = (list: QuestionCategoryNode[]) => {
      const next = [...list];
      [next[ctx.index], next[targetIndex]] = [next[targetIndex], next[ctx.index]];
      return next;
    };
    if (ctx.parentId == null) questionCategoryTree = reorder(questionCategoryTree);
    else questionCategoryTree = updateCategoryChildren(questionCategoryTree, ctx.parentId, reorder);
    emit();
    return true;
  }

  function removeQuestionCategoryNode(id: number): boolean {
    if (!findCategoryNode(questionCategoryTree, id)) return false;
    if (!getQuestionCategoryUsage(id).canDelete) return false;
    questionCategoryTree = removeCategoryFromTree(questionCategoryTree, id);
    emit();
    return true;
  }

  return {
    reset,
    useQuestions,
    useQuestionCategoryTree,
    getQuestion,
    upsertQuestion,
    removeQuestion,
    setQuestionStatus,
    setQuestionCategory,
    getQuestionCategoryUsage,
    getQuestionCategoryParentId,
    getQuestionCategorySiblingIndex,
    isQuestionCategoryNameTaken,
    addQuestionCategoryNode,
    renameQuestionCategory,
    moveQuestionCategory,
    removeQuestionCategoryNode,
  };
}

const examQuestionStore = createQuestionStore({
  questions: initialQuestions,
  categoryTree: initialQuestionCategoryTree,
});

const practiceQuestionStore = createQuestionStore({
  questions: initialPracticeQuestions,
  categoryTree: initialPracticeQuestionCategoryTree,
});

const questionStores: Record<QuestionBankScope, ReturnType<typeof createQuestionStore>> = {
  exam: examQuestionStore,
  practice: practiceQuestionStore,
};

export function getQuestionStore(scope: QuestionBankScope) {
  return questionStores[scope];
}

export function __resetQuestionStoreForTests(scope: QuestionBankScope = 'exam') {
  questionStores[scope].reset();
}

export function __resetAllQuestionStoresForTests() {
  questionStores.exam.reset();
  questionStores.practice.reset();
}

export const {
  useQuestions,
  useQuestionCategoryTree,
  getQuestion,
  upsertQuestion,
  removeQuestion,
  setQuestionStatus,
  setQuestionCategory,
  getQuestionCategoryUsage,
  getQuestionCategoryParentId,
  getQuestionCategorySiblingIndex,
  isQuestionCategoryNameTaken,
  addQuestionCategoryNode,
  renameQuestionCategory,
  moveQuestionCategory,
  removeQuestionCategoryNode,
} = examQuestionStore;
