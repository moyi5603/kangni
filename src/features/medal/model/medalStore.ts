import { useEffect, useState } from 'react';
import {
  MEDAL_CREATOR,
  initialMedals,
  sortMedalsByCreatedAtDesc,
  type MedalApp,
  type MedalDraft,
  type MedalRecord,
  type MedalStatus,
} from './medal';

let medals: MedalRecord[] = sortMedalsByCreatedAtDesc(initialMedals);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function __resetMedalStoreForTests() {
  medals = sortMedalsByCreatedAtDesc(initialMedals);
  emit();
}

export function listMedals() {
  return medals;
}

export function getMedal(id: string) {
  return medals.find((item) => item.id === id);
}

export function createMedal(draft: Omit<MedalDraft, 'app'> & { app: MedalApp }): MedalRecord {
  const incentive = draft.app === '即时激励';
  const record: MedalRecord = {
    id: `m-${Date.now()}`,
    name: draft.name.trim(),
    imageUrl: draft.imageUrl,
    app: draft.app,
    description: draft.description.trim(),
    status: '有效',
    creator: MEDAL_CREATOR,
    createdAt: nowStamp(),
    incentiveType: incentive && draft.incentiveType ? draft.incentiveType : undefined,
    categoryId: incentive && draft.categoryId ? draft.categoryId : undefined,
  };
  medals = [record, ...medals];
  emit();
  return record;
}

export function updateMedal(
  id: string,
  patch: Partial<Pick<MedalRecord, 'name' | 'imageUrl' | 'app' | 'description' | 'incentiveType' | 'categoryId'>>,
) {
  medals = medals.map((item) => {
    if (item.id !== id) return item;
    const next: MedalRecord = {
      ...item,
      ...patch,
      name: patch.name?.trim() ?? item.name,
      description: patch.description?.trim() ?? item.description,
    };
    if (next.app !== '即时激励') {
      next.incentiveType = undefined;
      next.categoryId = undefined;
    }
    return next;
  });
  emit();
  return getMedal(id);
}

export function setMedalStatus(id: string, status: MedalStatus) {
  const current = getMedal(id);
  if (!current) return false;
  medals = medals.map((item) => (item.id === id ? { ...item, status } : item));
  emit();
  return true;
}

export function removeMedal(id: string) {
  const before = medals.length;
  medals = medals.filter((item) => item.id !== id);
  emit();
  return medals.length < before;
}

export function useMedals() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return medals;
}
