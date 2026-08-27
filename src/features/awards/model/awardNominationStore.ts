import { useEffect, useState } from 'react';
import { getAward, upsertAward } from './awardStore';
import {
  AWARD_NOMINATION_MOCK_VERSION,
  canReviewNomination,
  initialAwardNominations,
  nominationCounts,
  normalizeHighlights,
  validateHighlights,
  validateNominees,
  type AwardNominationRecord,
  type NominationReviewStatus,
} from './awardNomination';

let mockVersion = AWARD_NOMINATION_MOCK_VERSION;
let nominations = [...initialAwardNominations];
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

function syncAwardCounts(awardId: number) {
  const award = getAward(awardId);
  if (!award) return;
  const counts = nominationCounts(nominations.filter((item) => item.awardId === awardId));
  upsertAward({
    ...award,
    nominationCount: counts.total,
    pendingNominationCount: counts.pending,
  });
}

export function __resetAwardNominationStoreForTests() {
  mockVersion = AWARD_NOMINATION_MOCK_VERSION;
  nominations = [...initialAwardNominations];
  const awardIds = [...new Set(nominations.map((item) => item.awardId))];
  awardIds.forEach(syncAwardCounts);
  emit();
}

export function useAwardNominations(awardId: number) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return nominations.filter((item) => item.awardId === awardId);
}

export function getAwardNominations(awardId: number) {
  return nominations.filter((item) => item.awardId === awardId);
}

export function addAwardNomination(input: {
  awardId: number;
  title: string;
  nominees: string[];
  reason: string;
  highlights: string[];
}): string | null {
  const award = getAward(input.awardId);
  if (!award) return '评优不存在';
  const error = validateNominees(award.type, input.nominees) ?? validateHighlights(input.highlights);
  if (error) return error;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  nominations = [
    {
      id: Date.now(),
      awardId: input.awardId,
      title: input.title.trim(),
      nominees: input.nominees,
      reason: input.reason.trim(),
      highlights: normalizeHighlights(input.highlights),
      voteCount: 0,
      reviewStatus: '已通过',
      nominator: '产品管理员',
      createdAt: now,
    },
    ...nominations,
  ];
  syncAwardCounts(input.awardId);
  emit();
  return null;
}

export function reviewAwardNomination(
  id: number,
  reviewStatus: NominationReviewStatus,
  rejectReason?: string,
): boolean {
  const current = nominations.find((item) => item.id === id);
  if (!current || !canReviewNomination(current)) return false;
  const reason = reviewStatus === '已驳回' ? (rejectReason ?? '').trim() || undefined : undefined;
  nominations = nominations.map((item) =>
    item.id === id
      ? {
          ...item,
          reviewStatus,
          rejectReason: reason,
        }
      : item,
  );
  syncAwardCounts(current.awardId);
  emit();
  return true;
}

export function removeAwardNomination(id: number): boolean {
  const current = nominations.find((item) => item.id === id);
  if (!current) return false;
  nominations = nominations.filter((item) => item.id !== id);
  syncAwardCounts(current.awardId);
  emit();
  return true;
}

void mockVersion;
