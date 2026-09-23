import { useEffect, useState } from 'react';
import {
  ACTIVITY_DECO_MOCK_VERSION,
  cloneDecoPage,
  defaultDecoPageFor,
  type ActivityDecoPage,
  type ActivityDecoSurface,
} from './activityDecoration';

const STORAGE_KEY = 'koni-activity-decoration';

type DecoBundle = Record<ActivityDecoSurface, ActivityDecoPage>;

function blankPages(): DecoBundle {
  return {
    mobile: defaultDecoPageFor('mobile'),
    pc: defaultDecoPageFor('pc'),
  };
}

let mockVersion = ACTIVITY_DECO_MOCK_VERSION;
let draft: DecoBundle = blankPages();
let published: DecoBundle = blankPages();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mockVersion,
        draft,
        published,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { mockVersion?: number; draft?: DecoBundle; published?: DecoBundle };
    if (parsed.mockVersion !== ACTIVITY_DECO_MOCK_VERSION) return;
    draft = {
      mobile: cloneDecoPage(parsed.draft?.mobile, 'mobile'),
      pc: cloneDecoPage(parsed.draft?.pc, 'pc'),
    };
    published = {
      mobile: cloneDecoPage(parsed.published?.mobile, 'mobile'),
      pc: cloneDecoPage(parsed.published?.pc, 'pc'),
    };
  } catch {
    draft = blankPages();
    published = blankPages();
  }
}

hydrate();

function syncMockData() {
  if (mockVersion === ACTIVITY_DECO_MOCK_VERSION) return;
  draft = blankPages();
  published = blankPages();
  mockVersion = ACTIVITY_DECO_MOCK_VERSION;
  persist();
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./activityDecoration', (mod) => {
    if (!mod) return;
    mockVersion = mod.ACTIVITY_DECO_MOCK_VERSION;
    draft = {
      mobile: mod.cloneDecoPage(draft.mobile, 'mobile'),
      pc: mod.cloneDecoPage(draft.pc, 'pc'),
    };
    published = {
      mobile: mod.cloneDecoPage(published.mobile, 'mobile'),
      pc: mod.cloneDecoPage(published.pc, 'pc'),
    };
    persist();
    emit();
  });
}

export function getActivityDecoration(surface: ActivityDecoSurface): ActivityDecoPage {
  syncMockData();
  return cloneDecoPage(draft[surface], surface);
}

export function getPublishedActivityDecoration(surface: ActivityDecoSurface): ActivityDecoPage {
  syncMockData();
  return cloneDecoPage(published[surface], surface);
}

export function saveActivityDecoration(surface: ActivityDecoSurface, next: ActivityDecoPage) {
  draft = { ...draft, [surface]: cloneDecoPage(next, surface) };
  persist();
  emit();
}

export function publishActivityDecoration(surface: ActivityDecoSurface) {
  published = { ...published, [surface]: cloneDecoPage(draft[surface], surface) };
  persist();
  emit();
}

export function resetActivityDecoration() {
  draft = blankPages();
  published = blankPages();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

function useDecoBundle(read: (surface: ActivityDecoSurface) => ActivityDecoPage, surface: ActivityDecoSurface) {
  const [value, setValue] = useState(() => read(surface));
  useEffect(() => {
    syncMockData();
    setValue(read(surface));
    const onChange = () => setValue(read(surface));
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [read, surface]);
  return value;
}

export function useActivityDecoration(surface: ActivityDecoSurface) {
  return useDecoBundle(getActivityDecoration, surface);
}

export function usePublishedActivityDecoration(surface: ActivityDecoSurface) {
  return useDecoBundle(getPublishedActivityDecoration, surface);
}
