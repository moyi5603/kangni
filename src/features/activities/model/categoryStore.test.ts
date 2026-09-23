import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getActivities, patchActivities } from './activityStore';
import { initialCategories } from './category';
import {
  __resetCategoryStoreForTest,
  deleteCategory,
  getCategories,
  moveCategory,
  upsertCategory,
} from './categoryStore';

describe('categoryStore', () => {
  beforeEach(() => {
    __resetCategoryStoreForTest();
  });

  afterEach(() => {
    __resetCategoryStoreForTest();
  });

  it('deletes category and unassigns activities to 未分类', () => {
    const bound = getActivities().filter((item) => item.category === '文化');
    expect(bound.length).toBeGreaterThan(0);
    const result = deleteCategory(1);
    expect(result).toEqual({ ok: true, activityCount: bound.length });
    expect(getCategories().some((item) => item.id === 1)).toBe(false);
    expect(getActivities().filter((item) => bound.some((row) => item.id === row.id)).every((item) => item.category === '未分类')).toBe(
      true,
    );
    patchActivities((list) =>
      list.map((item) => {
        const origin = bound.find((row) => row.id === item.id);
        return origin ? { ...item, category: origin.category } : item;
      }),
    );
  });

  it('moves category by swapping order with neighbor', () => {
    const before = [...getCategories()].sort((a, b) => a.order - b.order);
    const first = before[0];
    const second = before[1];
    expect(moveCategory(first.id, 1)).toBe(true);
    const after = getCategories();
    expect(after.find((item) => item.id === first.id)?.order).toBe(second.order);
    expect(after.find((item) => item.id === second.id)?.order).toBe(first.order);
  });

  it('creates category with next order and default enabled', () => {
    const created = upsertCategory({ name: '团队拓展' });
    expect(created.status).toBe('启用');
    expect(created.order).toBe(Math.max(...initialCategories.map((item) => item.order)) + 10);
  });
});
