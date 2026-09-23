import { useEffect, useState } from 'react';
import { toggleVoteV2Selection } from './voteV2';

const listeners = new Set<() => void>();
let selectedByCampaign = new Map<number, number[]>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetVoteV2SelectionStoreForTests() {
  selectedByCampaign = new Map();
  emit();
}

export function getVoteV2Selection(campaignId: number): number[] {
  return selectedByCampaign.get(campaignId) ?? [];
}

export function setVoteV2Selection(campaignId: number, ids: number[]) {
  selectedByCampaign.set(campaignId, [...ids]);
  emit();
}

export function clearVoteV2Selection(campaignId: number) {
  selectedByCampaign.delete(campaignId);
  emit();
}

export function toggleVoteV2CampaignSelection(campaignId: number, contestantId: number, maxSelect: number) {
  const result = toggleVoteV2Selection(getVoteV2Selection(campaignId), contestantId, maxSelect);
  selectedByCampaign.set(campaignId, result.ids);
  emit();
  return result;
}

export function useVoteV2Selection(campaignId: number): number[] {
  const [ids, setIds] = useState(() => getVoteV2Selection(campaignId));
  useEffect(() => {
    setIds(getVoteV2Selection(campaignId));
    return subscribe(() => setIds(getVoteV2Selection(campaignId)));
  }, [campaignId]);
  return ids;
}
