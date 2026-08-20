import { describe, expect, it } from 'vitest';
import {
  collectCategoryIds,
  filterCategoryTree,
  findCategoryNode,
  subtreeIdsOf,
  type CategoryNode,
} from './categoryTree';

const tree: CategoryNode[] = [
  { id: 10, name: '根A' },
  {
    id: 20,
    name: '根B',
    children: [
      { id: 21, name: '子1', children: [{ id: 211, name: '精通' }, { id: 212, name: '入门' }] },
      { id: 22, name: '子2' },
    ],
  },
];

describe('categoryTree helpers', () => {
  it('finds nested nodes and collects subtree ids', () => {
    const child = findCategoryNode(tree, 21);
    expect(child?.name).toBe('子1');
    expect(collectCategoryIds([child!])).toEqual([21, 211, 212]);
    expect(subtreeIdsOf(tree, 21)).toEqual([21, 211, 212]);
    expect(subtreeIdsOf(tree, 10)).toEqual([10]);
  });

  it('filters tree by keyword and keeps ancestors of matches', () => {
    const filtered = filterCategoryTree(tree, '精通');
    expect(filtered.map((node) => node.name)).toEqual(['根B']);
    expect(filtered[0]?.children?.map((node) => node.name)).toEqual(['子1']);
    expect(filterCategoryTree(tree, '不存在').length).toBe(0);
  });
});
