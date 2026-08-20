import { useEffect, useState } from 'react';
import { getActivities, patchActivities } from './activityStore';
import { CATEGORY_MOCK_VERSION, initialCategories, type ActivityCategoryRecord } from './category';

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
  return categories;
}

export function isCategoryInUse(name: string): boolean {
  return getActivities().some((activity) => activity.category === name);
}

export function upsertCategory(category: ActivityCategoryRecord) {
  const current = categories.find((item) => item.id === category.id);
  categories = current ? categories.map((item) => (item.id === category.id ? category : item)) : [category, ...categories];
  if (current && current.name !== category.name) {
    patchActivities((list) =>
      list.map((activity) => (activity.category === current.name ? { ...activity, category: category.name } : activity)),
    );
  }
  emit();
}

export function removeCategory(id: number): boolean {
  const current = categories.find((item) => item.id === id);
  if (!current) return false;
  if (isCategoryInUse(current.name)) return false;
  categories = categories.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setCategoryStatus(ids: number[], status: ActivityCategoryRecord['status']) {
  const idSet = new Set(ids);
  categories = categories.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function useCategories() {
  const [list, setList] = useState<ActivityCategoryRecord[]>(() => [...categories]);
  useEffect(() => {
    syncMockData();
    setList([...categories]);
    const onChange = () => setList([...categories]);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}
