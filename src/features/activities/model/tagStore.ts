import { useEffect, useState } from 'react';
import { patchActivities } from './activityStore';
import { TAG_MOCK_VERSION, initialTags, type ActivityTagRecord } from './tag';

let mockVersion = TAG_MOCK_VERSION;
let tags = [...initialTags];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === TAG_MOCK_VERSION) return;
  tags = [...initialTags];
  mockVersion = TAG_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./tag', (mod) => {
    if (!mod) return;
    tags = [...mod.initialTags];
    mockVersion = mod.TAG_MOCK_VERSION;
    emit();
  });
}

export function getTags(): ActivityTagRecord[] {
  syncMockData();
  return tags;
}

export function upsertTag(tag: ActivityTagRecord) {
  const current = tags.find((item) => item.id === tag.id);
  tags = current ? tags.map((item) => (item.id === tag.id ? tag : item)) : [tag, ...tags];
  if (current && current.name !== tag.name) {
    renameOnActivities(current.name, tag.name);
  }
  emit();
}

export function removeTag(id: number) {
  const current = tags.find((item) => item.id === id);
  tags = tags.filter((item) => item.id !== id);
  if (current) {
    patchActivities((list) =>
      list.map((activity) => ({ ...activity, tags: activity.tags.filter((name) => name !== current.name) })),
    );
  }
  emit();
}

export function setTagStatus(ids: number[], status: ActivityTagRecord['status']) {
  const idSet = new Set(ids);
  tags = tags.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

function renameOnActivities(from: string, to: string) {
  patchActivities((list) =>
    list.map((activity) => ({
      ...activity,
      tags: activity.tags.map((name) => (name === from ? to : name)),
    })),
  );
}

export function useTags() {
  const [list, setList] = useState<ActivityTagRecord[]>(() => [...tags]);
  useEffect(() => {
    syncMockData();
    setList([...tags]);
    const onChange = () => setList([...tags]);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}
