import { describe, expect, it } from 'vitest';
import { INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY, readListViewMode, writeListViewMode } from './listViewMode';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('listViewMode', () => {
  it('defaults to list when missing, invalid, or storage throws', () => {
    expect(readListViewMode('k', memoryStorage())).toBe('list');
    expect(readListViewMode('k', memoryStorage({ k: 'grid' }))).toBe('list');
    expect(
      readListViewMode('k', {
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('list');
  });

  it('reads and writes card', () => {
    const storage = memoryStorage();
    writeListViewMode(INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY, 'card', storage);
    expect(storage.getItem(INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY)).toBe('card');
    expect(readListViewMode(INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY, storage)).toBe('card');
  });

  it('write swallows setItem errors', () => {
    expect(() =>
      writeListViewMode('k', 'list', {
        setItem: () => {
          throw new Error('quota');
        },
      }),
    ).not.toThrow();
  });
});
