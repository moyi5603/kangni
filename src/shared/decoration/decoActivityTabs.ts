export type DecoActivityTabFields = {
  showActivityTabs: boolean;
  showTabRecommend: boolean;
  showTabLatest: boolean;
  showTabHot: boolean;
};

export const DECO_ACTIVITY_TAB_TOGGLES = [
  ['showTabRecommend', '推荐'],
  ['showTabLatest', '最新'],
  ['showTabHot', '最热'],
] as const satisfies ReadonlyArray<readonly [keyof DecoActivityTabFields, string]>;

export function decoActivityTabFields(source?: Partial<DecoActivityTabFields> | null): DecoActivityTabFields {
  return {
    showActivityTabs: source?.showActivityTabs !== false,
    showTabRecommend: source?.showTabRecommend !== false,
    showTabLatest: source?.showTabLatest !== false,
    showTabHot: source?.showTabHot !== false,
  };
}

export function visibleDecoActivityTabLabels(tabs: readonly string[], source?: Partial<DecoActivityTabFields> | null): string[] {
  const fields = decoActivityTabFields(source);
  if (!fields.showActivityTabs) return [];
  const on: Record<string, boolean> = {
    推荐: fields.showTabRecommend,
    最新: fields.showTabLatest,
    热门: fields.showTabHot,
    最热: fields.showTabHot,
  };
  return tabs.filter((tab) => on[tab] !== false);
}

export function visibleDecoActivityTabKeys<T extends { key: 'rec' | 'latest' | 'hot' }>(
  tabs: readonly T[],
  source?: Partial<DecoActivityTabFields> | null,
): T[] {
  const fields = decoActivityTabFields(source);
  if (!fields.showActivityTabs) return [];
  return tabs.filter((tab) => {
    if (tab.key === 'rec') return fields.showTabRecommend;
    if (tab.key === 'latest') return fields.showTabLatest;
    return fields.showTabHot;
  });
}
