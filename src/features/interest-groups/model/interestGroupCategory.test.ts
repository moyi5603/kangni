import { describe, expect, it } from 'vitest';
import {
  buildInterestGroupCategoryOptions,
  compareInterestGroupCategories,
  initialInterestGroupCategories,
  listEnabledInterestGroupCategories,
  validateInterestGroupCategoryLabel,
} from './interestGroupCategory';

describe('interestGroupCategory', () => {
  it('rejects empty or too long or duplicated label', () => {
    expect(validateInterestGroupCategoryLabel('', initialInterestGroupCategories)).toBe('请输入分类名称');
    expect(validateInterestGroupCategoryLabel('运动健身', initialInterestGroupCategories)).toBe('分类名称已存在');
    expect(validateInterestGroupCategoryLabel('一二三四五六七八九十十一二', initialInterestGroupCategories)).toBe(
      '分类名称不超过 12 个字',
    );
    expect(validateInterestGroupCategoryLabel('新分类', initialInterestGroupCategories)).toBeNull();
    expect(validateInterestGroupCategoryLabel('运动健身', initialInterestGroupCategories, 'sport')).toBeNull();
  });

  it('sorts by order then newer createdAt first', () => {
    const rows = [
      { key: 'a', label: 'A', order: 10, status: '启用' as const, createdAt: '2026-01-01 10:00:00' },
      { key: 'b', label: 'B', order: 10, status: '启用' as const, createdAt: '2026-06-01 10:00:00' },
      { key: 'c', label: 'C', order: 5, status: '启用' as const, createdAt: '2026-01-01 10:00:00' },
    ];
    expect([...rows].sort(compareInterestGroupCategories).map((item) => item.key)).toEqual(['c', 'b', 'a']);
  });

  it('lists only enabled categories', () => {
    const list = [
      ...initialInterestGroupCategories,
      { key: 'off', label: '已关', order: 1, status: '禁用' as const, createdAt: '2026-01-01 00:00:00' },
    ];
    expect(listEnabledInterestGroupCategories(list).some((item) => item.key === 'off')).toBe(false);
  });

  it('builds select options from category management data', () => {
    const list = [
      ...initialInterestGroupCategories,
      { key: 'off', label: '已关', order: 1, status: '禁用' as const, createdAt: '2026-01-01 00:00:00' },
    ];
    const formOptions = buildInterestGroupCategoryOptions(list, { includeUncategorized: true, enabledOnly: true });
    expect(formOptions[0]).toEqual({ value: '', label: '未分类' });
    expect(formOptions.map((item) => item.label)).toContain('运动健身');
    expect(formOptions.map((item) => item.label)).not.toContain('已关');

    const filterOptions = buildInterestGroupCategoryOptions(list, { includeUncategorized: true });
    expect(filterOptions.map((item) => item.label)).toContain('已关');

    const editOptions = buildInterestGroupCategoryOptions(list, {
      includeUncategorized: true,
      enabledOnly: true,
      keepKey: 'off',
    });
    expect(editOptions.map((item) => item.value)).toContain('off');
  });
});
