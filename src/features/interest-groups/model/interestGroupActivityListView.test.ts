import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_LIST_VIEW_KEY,
  readInterestGroupActivityListView,
  writeInterestGroupActivityListView,
} from './interestGroupActivityListView';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('interestGroupActivityListView', () => {
  it('defaults to list when missing, invalid, or storage throws', () => {
    expect(readInterestGroupActivityListView(memoryStorage())).toBe('list');
    expect(readInterestGroupActivityListView(memoryStorage({ [ACTIVITY_LIST_VIEW_KEY]: 'grid' }))).toBe('list');
    expect(
      readInterestGroupActivityListView({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('list');
  });

  it('reads and writes card', () => {
    const storage = memoryStorage();
    writeInterestGroupActivityListView('card', storage);
    expect(storage.getItem(ACTIVITY_LIST_VIEW_KEY)).toBe('card');
    expect(readInterestGroupActivityListView(storage)).toBe('card');
  });

  it('write swallows setItem errors', () => {
    expect(() =>
      writeInterestGroupActivityListView('list', {
        setItem: () => {
          throw new Error('quota');
        },
      }),
    ).not.toThrow();
  });
});
