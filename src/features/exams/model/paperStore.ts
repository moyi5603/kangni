import { useEffect, useState } from 'react';
import {
  initialPaperCategoryTree,
  initialPapers,
  type PaperCategoryNode,
  type PaperRecord,
  type PaperStatus,
} from './paper';
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

function clonePapers() {
  return initialPapers.map((item) => ({
    ...item,
    typeScores: item.typeScores.map((row) => ({ ...row })),
    bankRules: item.bankRules?.map((rule) => structuredClone(rule)),
    questionIds: [...(item.questionIds ?? [])],
  }));
}

let papers = clonePapers();
let paperCategoryTree: PaperCategoryNode[] = structuredClone(initialPaperCategoryTree);
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

export function __resetPaperStoreForTests() {
  papers = clonePapers();
  paperCategoryTree = structuredClone(initialPaperCategoryTree);
  emit();
}

export function usePapers() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return papers;
}

export function usePaperCategoryTree() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return paperCategoryTree;
}

export function getPapers() {
  return papers;
}

export function getPaper(id: number) {
  return papers.find((item) => item.id === id);
}

export function upsertPaper(record: PaperRecord) {
  const current = papers.find((item) => item.id === record.id);
  papers = current ? papers.map((item) => (item.id === record.id ? record : item)) : [record, ...papers];
  emit();
}

export function removePaper(id: number): boolean {
  if (!papers.some((item) => item.id === id)) return false;
  papers = papers.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setPaperStatus(ids: number[], status: PaperStatus) {
  const idSet = new Set(ids);
  papers = papers.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function getPaperOptions() {
  return papers.map((item) => ({ id: item.id, name: item.name }));
}

export function getPaperCategoryUsage(categoryId: number): { paperCount: number; canDelete: boolean } {
  const node = findCategoryNode(paperCategoryTree, categoryId);
  if (!node) return { paperCount: 0, canDelete: false };
  const idSet = new Set(collectCategoryIds([node]));
  const paperCount = papers.filter((item) => item.categoryId != null && idSet.has(item.categoryId)).length;
  return { paperCount, canDelete: paperCount === 0 };
}

export function getPaperCategoryParentId(id: number): number | null {
  return findCategorySiblingContext(paperCategoryTree, id)?.parentId ?? null;
}

export function getPaperCategorySiblingIndex(id: number): { index: number; total: number } | null {
  const ctx = findCategorySiblingContext(paperCategoryTree, id);
  if (!ctx) return null;
  return { index: ctx.index, total: ctx.siblings.length };
}

export function isPaperCategoryNameTaken(name: string, parentId: number | null, excludeId?: number): boolean {
  return isSiblingNameTaken(paperCategoryTree, name, parentId, excludeId);
}

export function addPaperCategoryNode(name: string, parentId: number | null = null): PaperCategoryNode | null {
  if (!canAddCategoryChild(paperCategoryTree, parentId)) return null;
  const node: PaperCategoryNode = { id: Date.now(), name };
  if (parentId == null) paperCategoryTree = [...paperCategoryTree, node];
  else paperCategoryTree = insertCategory(paperCategoryTree, parentId, node);
  emit();
  return node;
}

export function renamePaperCategory(id: number, name: string): boolean {
  if (!findCategoryNode(paperCategoryTree, id)) return false;
  paperCategoryTree = renameCategoryInTree(paperCategoryTree, id, name);
  emit();
  return true;
}

export function movePaperCategory(id: number, direction: 'up' | 'down'): boolean {
  const ctx = findCategorySiblingContext(paperCategoryTree, id);
  if (!ctx) return false;
  const targetIndex = direction === 'up' ? ctx.index - 1 : ctx.index + 1;
  if (targetIndex < 0 || targetIndex >= ctx.siblings.length) return false;
  const reorder = (list: PaperCategoryNode[]) => {
    const next = [...list];
    [next[ctx.index], next[targetIndex]] = [next[targetIndex], next[ctx.index]];
    return next;
  };
  if (ctx.parentId == null) paperCategoryTree = reorder(paperCategoryTree);
  else paperCategoryTree = updateCategoryChildren(paperCategoryTree, ctx.parentId, reorder);
  emit();
  return true;
}

export function removePaperCategoryNode(id: number): boolean {
  if (!findCategoryNode(paperCategoryTree, id)) return false;
  if (!getPaperCategoryUsage(id).canDelete) return false;
  paperCategoryTree = removeCategoryFromTree(paperCategoryTree, id);
  emit();
  return true;
}
