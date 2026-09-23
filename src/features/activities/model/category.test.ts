import { describe, expect, it } from 'vitest';
import {
  compareActivityCategories,
  countActivityCategoryUsage,
  initialCategories,
  validateActivityCategoryName,
} from './category';

describe('activity category', () => {
  it('rejects empty or too long or duplicated name', () => {
    expect(validateActivityCategoryName('', initialCategories)).toBe('请输入分类名称');
    expect(validateActivityCategoryName('文化', initialCategories)).toBe('分类名称已存在');
    expect(validateActivityCategoryName('一二三四五六七八九十十一二', initialCategories)).toBe('分类名称不超过 12 个字');
    expect(validateActivityCategoryName('新分类', initialCategories)).toBeNull();
    expect(validateActivityCategoryName('文化', initialCategories, 1)).toBeNull();
  });

  it('sorts by order then newer createdAt first', () => {
    const rows = [
      { id: 1, name: 'A', order: 10, status: '启用' as const, createdAt: '2026-01-01 10:00:00' },
      { id: 2, name: 'B', order: 10, status: '启用' as const, createdAt: '2026-06-01 10:00:00' },
      { id: 3, name: 'C', order: 5, status: '启用' as const, createdAt: '2026-01-01 10:00:00' },
    ];
    expect([...rows].sort(compareActivityCategories).map((item) => item.id)).toEqual([3, 2, 1]);
  });

  it('counts activities bound to a category name', () => {
    expect(countActivityCategoryUsage('文化', [{ category: '文化' }, { category: '培训' }, { category: '文化' }])).toBe(2);
  });
});
