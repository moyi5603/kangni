import { useEffect, useState } from 'react';
import type { DecoPage, DecoSurface } from './decoTypes';

type DecoBundle = Record<DecoSurface, DecoPage>;

export function createDecorationStore(options: {
  storageKey: string;
  mockVersion: number;
  clonePage: (page: DecoPage | undefined, surface: DecoSurface) => DecoPage;
  defaultPageFor: (surface: DecoSurface) => DecoPage;
}) {
  const { storageKey, clonePage, defaultPageFor } = options;

  function blankPages(): DecoBundle {
    return {
      mobile: defaultPageFor('mobile'),
      pc: defaultPageFor('pc'),
    };
  }

  let mockVersion = options.mockVersion;
  let draft: DecoBundle = blankPages();
  let published: DecoBundle = blankPages();
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ mockVersion, draft, published }));
    } catch {
      /* ignore */
    }
  }

  function hydrate() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { mockVersion?: number; draft?: DecoBundle; published?: DecoBundle };
      if (parsed.mockVersion !== options.mockVersion) return;
      draft = {
        mobile: clonePage(parsed.draft?.mobile, 'mobile'),
        pc: clonePage(parsed.draft?.pc, 'pc'),
      };
      published = {
        mobile: clonePage(parsed.published?.mobile, 'mobile'),
        pc: clonePage(parsed.published?.pc, 'pc'),
      };
    } catch {
      draft = blankPages();
      published = blankPages();
    }
  }

  hydrate();

  function syncMockData() {
    if (mockVersion === options.mockVersion) return;
    draft = blankPages();
    published = blankPages();
    mockVersion = options.mockVersion;
    persist();
    emit();
  }

  function getDraft(surface: DecoSurface): DecoPage {
    syncMockData();
    return clonePage(draft[surface], surface);
  }

  function getPublished(surface: DecoSurface): DecoPage {
    syncMockData();
    return clonePage(published[surface], surface);
  }

  function save(surface: DecoSurface, next: DecoPage) {
    draft = { ...draft, [surface]: clonePage(next, surface) };
    persist();
    emit();
  }

  function publish(surface: DecoSurface) {
    published = { ...published, [surface]: clonePage(draft[surface], surface) };
    persist();
    emit();
  }

  function reset() {
    draft = blankPages();
    published = blankPages();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    emit();
  }

  function useDecoBundle(read: (surface: DecoSurface) => DecoPage, surface: DecoSurface) {
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

  return {
    getDraft,
    getPublished,
    save,
    publish,
    reset,
    useDraft: (surface: DecoSurface) => useDecoBundle(getDraft, surface),
    usePublished: (surface: DecoSurface) => useDecoBundle(getPublished, surface),
  };
}
