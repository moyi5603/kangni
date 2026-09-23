import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetVoteV2SelectionStoreForTests,
  clearVoteV2Selection,
  getVoteV2Selection,
  setVoteV2Selection,
  toggleVoteV2CampaignSelection,
} from './voteV2SelectionStore';

beforeEach(() => {
  __resetVoteV2SelectionStoreForTests();
});

describe('voteV2SelectionStore', () => {
  it('toggles ids per campaign and isolates campaigns', () => {
    expect(toggleVoteV2CampaignSelection(2, 1, 2)).toEqual({ ids: [1] });
    expect(toggleVoteV2CampaignSelection(2, 2, 2)).toEqual({ ids: [1, 2] });
    expect(toggleVoteV2CampaignSelection(5, 16, 2)).toEqual({ ids: [16] });
    expect(getVoteV2Selection(2)).toEqual([1, 2]);
    expect(getVoteV2Selection(5)).toEqual([16]);
  });

  it('blocks when at max and supports clear/set', () => {
    setVoteV2Selection(2, [1, 2]);
    expect(toggleVoteV2CampaignSelection(2, 3, 2)).toEqual({ ids: [1, 2], blocked: 'max' });
    clearVoteV2Selection(2);
    expect(getVoteV2Selection(2)).toEqual([]);
  });
});
