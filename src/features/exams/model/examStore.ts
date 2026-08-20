import { useEffect, useState } from 'react';
import {
  EXAM_MOCK_VERSION,
  canDeleteExam,
  initialExamCategoryTree,
  initialExams,
  type ExamCategoryNode,
  type ExamPublishStatus,
  type ExamRecord,
} from './exam';
import {
  collectCategoryIds,
  findCategoryNode,
  findCategorySiblingContext,
  insertCategory,
  isSiblingNameTaken,
  removeCategoryFromTree,
  renameCategoryInTree,
  updateCategoryChildren,
} from '../../../shared/category-tree/categoryTree';

let mockVersion = EXAM_MOCK_VERSION;
let exams = [...initialExams];
let examCategoryTree: ExamCategoryNode[] = [...initialExamCategoryTree];
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

export function __resetExamStoreForTests() {
  mockVersion = EXAM_MOCK_VERSION;
  exams = [...initialExams];
  examCategoryTree = [...initialExamCategoryTree];
  emit();
}

export function useExams() {
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribe(() => setTick((n) => n + 1));
  }, []);
  return exams;
}

export function useExamCategoryTree() {
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribe(() => setTick((n) => n + 1));
  }, []);
  return examCategoryTree;
}

export function getExam(id: number) {
  return exams.find((item) => item.id === id);
}

export function upsertExam(record: ExamRecord) {
  const current = exams.find((item) => item.id === record.id);
  exams = current ? exams.map((item) => (item.id === record.id ? record : item)) : [record, ...exams];
  emit();
}

export function removeExam(id: number): boolean {
  const target = exams.find((item) => item.id === id);
  if (!target || !canDeleteExam(target)) return false;
  exams = exams.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setExamPublishStatus(ids: number[], publishStatus: ExamPublishStatus) {
  const idSet = new Set(ids);
  exams = exams.map((item) => (idSet.has(item.id) ? { ...item, publishStatus } : item));
  emit();
}

export function setExamCategory(ids: number[], categoryId: number | null) {
  const idSet = new Set(ids);
  exams = exams.map((item) => (idSet.has(item.id) ? { ...item, categoryId } : item));
  emit();
}

export function getExamCategoryUsage(categoryId: number): { examCount: number; canDelete: boolean } {
  const node = findCategoryNode(examCategoryTree, categoryId);
  if (!node) return { examCount: 0, canDelete: false };
  const idSet = new Set(collectCategoryIds([node]));
  const examCount = exams.filter((item) => item.categoryId != null && idSet.has(item.categoryId)).length;
  return { examCount, canDelete: examCount === 0 };
}

export function getExamCategoryParentId(id: number): number | null {
  return findCategorySiblingContext(examCategoryTree, id)?.parentId ?? null;
}

export function getExamCategorySiblingIndex(id: number): { index: number; total: number } | null {
  const ctx = findCategorySiblingContext(examCategoryTree, id);
  if (!ctx) return null;
  return { index: ctx.index, total: ctx.siblings.length };
}

export function isExamCategoryNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  return isSiblingNameTaken(examCategoryTree, name, parentId, excludeId);
}

export function addExamCategoryNode(name: string, parentId: number | null = null): ExamCategoryNode {
  const node: ExamCategoryNode = { id: Date.now(), name };
  if (parentId == null) examCategoryTree = [...examCategoryTree, node];
  else examCategoryTree = insertCategory(examCategoryTree, parentId, node);
  emit();
  return node;
}

export function renameExamCategory(id: number, name: string): boolean {
  if (!findCategoryNode(examCategoryTree, id)) return false;
  examCategoryTree = renameCategoryInTree(examCategoryTree, id, name);
  emit();
  return true;
}

export function moveExamCategory(id: number, direction: 'up' | 'down'): boolean {
  const ctx = findCategorySiblingContext(examCategoryTree, id);
  if (!ctx) return false;
  const targetIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1;
  if (targetIndex < 0 || targetIndex >= ctx.siblings.length) return false;
  const reorder = (list: ExamCategoryNode[]) => {
    const next = [...list];
    [next[ctx.index], next[targetIndex]] = [next[targetIndex], next[ctx.index]];
    return next;
  };
  if (ctx.parentId == null) examCategoryTree = reorder(examCategoryTree);
  else examCategoryTree = updateCategoryChildren(examCategoryTree, ctx.parentId, reorder);
  emit();
  return true;
}

export function removeExamCategoryNode(id: number): boolean {
  if (!findCategoryNode(examCategoryTree, id)) return false;
  if (!getExamCategoryUsage(id).canDelete) return false;
  examCategoryTree = removeCategoryFromTree(examCategoryTree, id);
  emit();
  return true;
}
