import { createDecorationStore } from '../../../shared/decoration/createDecorationStore';
import { cloneIgDecoPage, defaultIgDecoPageFor, IG_DECO_MOCK_VERSION } from './igDecoration';

const store = createDecorationStore({
  storageKey: 'koni-ig-decoration',
  mockVersion: IG_DECO_MOCK_VERSION,
  clonePage: cloneIgDecoPage,
  defaultPageFor: defaultIgDecoPageFor,
});

export const getIgDecoration = store.getDraft;
export const getPublishedIgDecoration = store.getPublished;
export const saveIgDecoration = store.save;
export const publishIgDecoration = store.publish;
export const resetIgDecoration = store.reset;
export const useIgDecoration = store.useDraft;
export const usePublishedIgDecoration = store.usePublished;
