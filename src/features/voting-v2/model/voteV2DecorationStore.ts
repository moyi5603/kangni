import { createDecorationStore } from '../../../shared/decoration/createDecorationStore';
import { cloneVoteDecoPage, defaultVoteDecoPageFor, VOTE_DECO_MOCK_VERSION } from './voteV2Decoration';

const store = createDecorationStore({
  storageKey: 'koni-vote-v2-decoration',
  mockVersion: VOTE_DECO_MOCK_VERSION,
  clonePage: cloneVoteDecoPage,
  defaultPageFor: defaultVoteDecoPageFor,
});

export const getVoteV2Decoration = store.getDraft;
export const getPublishedVoteV2Decoration = store.getPublished;
export const saveVoteV2Decoration = store.save;
export const publishVoteV2Decoration = store.publish;
export const resetVoteV2Decoration = store.reset;
export const useVoteV2Decoration = store.useDraft;
export const usePublishedVoteV2Decoration = store.usePublished;
