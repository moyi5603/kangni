import { useEffect, useState } from 'react';
import { AWARD_MOCK_VERSION, initialAwards, type AwardPublishStatus, type AwardRecord } from './award';

let mockVersion = AWARD_MOCK_VERSION;
let awards = [...initialAwards];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetAwardStoreForTests() {
  mockVersion = AWARD_MOCK_VERSION;
  awards = [...initialAwards];
  emit();
}

export function useAwards() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return awards;
}

export function getAwards() {
  return awards;
}

export function getAward(id: number) {
  return awards.find((item) => item.id === id);
}

export function upsertAward(record: AwardRecord) {
  const current = awards.find((item) => item.id === record.id);
  awards = current ? awards.map((item) => (item.id === record.id ? record : item)) : [record, ...awards];
  emit();
}

export function removeAward(id: number): boolean {
  const exists = awards.some((item) => item.id === id);
  if (!exists) return false;
  awards = awards.filter((item) => item.id !== id);
  emit();
  return true;
}

export function setAwardResultPublic(id: number, resultPublic: boolean): boolean {
  const current = awards.find((item) => item.id === id);
  if (!current) return false;
  awards = awards.map((item) =>
    item.id === id ? { ...item, resultPublic, publicityLocked: true } : item,
  );
  emit();
  return true;
}

export function setAwardPublishStatus(ids: number[], publishStatus: AwardPublishStatus): number {
  const idSet = new Set(ids);
  let changed = 0;
  awards = awards.map((item) => {
    if (!idSet.has(item.id) || item.publishStatus === publishStatus) return item;
    changed += 1;
    return { ...item, publishStatus };
  });
  if (changed) emit();
  return changed;
}

export function countAwardsUsingCertificate(certificateId: number): number {
  return awards.filter((item) => item.ranks.some((rank) => rank.certificateId === certificateId)).length;
}

export function awardNamesUsingCertificate(certificateId: number): string[] {
  return awards.filter((item) => item.ranks.some((rank) => rank.certificateId === certificateId)).map((item) => item.name);
}

void mockVersion;
