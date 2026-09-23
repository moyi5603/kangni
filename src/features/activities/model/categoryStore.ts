import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getActivities, patchActivities } from './activityStore';
import {
  CATEGORY_MOCK_VERSION,
  compareActivityCategories,
  countActivityCategoryUsage,
  initialCategories,
  nextActivityCategoryOrder,
  type ActivityCategoryFormValues,
  type ActivityCategoryRecord,
} from './category';

let mockVersion = CATEGORY_MOCK_VERSION;
let categories = [...initialCategories];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === CATEGORY_MOCK_VERSION) return;
  categories = [...initialCategories];
  mockVersion = CATEGORY_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./category', (mod) => {
    if (!mod) return;
    categories = [...mod.initialCategories];
    mockVersion = mod.CATEGORY_MOCK_VERSION;
    emit();
  });
}

export function getCategories(): ActivityCategoryRecord[] {
  syncMockData();
  return [...categories].sort(compareActivityCategories);
}

export type DeleteCategoryResult = { ok: true; activityCount: number } | { ok: false; reason: 'not-found' };

export function deleteCategory(id: number): DeleteCategoryResult {
  syncMockData();
  const current = categories.find((item) => item.id === id);
  if (!current) return { ok: false, reason: 'not-found' };
  const activityCount = countActivityCategoryUsage(current.name, getActivities());
  categories = categories.filter((item) => item.id !== id);
  patchActivities((list) =>
    list.map((activity) => (activity.category === current.name ? { ...activity, category: '未分类' } : activity)),
  );
  emit();
  return { ok: true, activityCount };
}

export function upsertCategory(values: ActivityCategoryFormValues, id?: number): ActivityCategoryRecord {
  syncMockData();
  const name = values.name.trim();
  if (id) {
    const current = categories.find((item) => item.id === id);
    if (!current) throw new Error('分类不存在');
    const next: ActivityCategoryRecord = {
      ...current,
      name,
      order: values.order ?? current.order,
    };
    categories = categories.map((item) => (item.id === id ? next : item));
    if (current.name !== name) {
      patchActivities((list) =>
        list.map((activity) => (activity.category === current.name ? { ...activity, category: name } : activity)),
      );
    }
    emit();
    return next;
  }
  const created: ActivityCategoryRecord = {
    id: Date.now(),
    name,
    order: values.order ?? nextActivityCategoryOrder(categories),
    status: '启用',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  categories = [created, ...categories];
  emit();
  return created;
}

export function setCategoryStatus(ids: number[], status: ActivityCategoryRecord['status']) {
  syncMockData();
  const idSet = new Set(ids);
  categories = categories.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function moveCategory(id: number, dir: -1 | 1): boolean {
  syncMockData();
  const sorted = [...categories].sort(compareActivityCategories);
  const index = sorted.findIndex((item) => item.id === id);
  const nextIndex = index + dir;
  if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) return false;
  const current = sorted[index];
  const neighbor = sorted[nextIndex];
  if (current.order === neighbor.order) {
    const currentCreated = current.createdAt;
    sorted[index] = { ...current, createdAt: neighbor.createdAt };
    sorted[nextIndex] = { ...neighbor, createdAt: currentCreated };
  } else {
    sorted[index] = { ...current, order: neighbor.order };
    sorted[nextIndex] = { ...neighbor, order: current.order };
  }
  const nextById = new Map(sorted.map((item) => [item.id, item]));
  categories = categories.map((item) => nextById.get(item.id) ?? item);
  emit();
  return true;
}

export function __resetCategoryStoreForTest() {
  categories = [...initialCategories];
  mockVersion = CATEGORY_MOCK_VERSION;
  emit();
}

export function useCategories() {
  const [list, setList] = useState<ActivityCategoryRecord[]>(() => [...categories].sort(compareActivityCategories));
  useEffect(() => {
    syncMockData();
    setList([...categories].sort(compareActivityCategories));
    const onChange = () => setList([...categories].sort(compareActivityCategories));
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}
