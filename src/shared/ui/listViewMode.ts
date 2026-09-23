export type ListViewMode = 'list' | 'card';

type Readable = { getItem: (key: string) => string | null };
type Writable = { setItem: (key: string, value: string) => void };

export function readListViewMode(storageKey: string, storage?: Readable): ListViewMode {
  try {
    const source = storage ?? globalThis.localStorage;
    const value = source.getItem(storageKey);
    return value === 'card' ? 'card' : 'list';
  } catch {
    return 'list';
  }
}

export function writeListViewMode(storageKey: string, view: ListViewMode, storage?: Writable) {
  try {
    const target = storage ?? globalThis.localStorage;
    target.setItem(storageKey, view);
  } catch {
    /* private mode / quota */
  }
}

export const INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY = 'interest-group-activity-list-view';
export const INTEREST_GROUP_LIST_VIEW_KEY = 'interest-group-list-view';
export const ACTIVITY_APP_LIST_VIEW_KEY = 'activity-list-view';
