export const voteV2FormTabs = ['basic', 'style', 'function'] as const;
export type VoteV2FormTab = (typeof voteV2FormTabs)[number];

const voteV2FormFieldTab: Record<string, VoteV2FormTab> = {
  name: 'basic',
  timeRange: 'basic',
  intro: 'basic',
  coverUrl: 'style',
  coverKind: 'style',
  backgroundEnabled: 'style',
  backgroundUrl: 'style',
  themeColor: 'style',
  contestantNoun: 'style',
  voteButtonNoun: 'style',
  voteUnit: 'style',
  homeColumns: 'style',
  pcHomeColumns: 'style',
  pageDisplayKeys: 'style',
  groupingEnabled: 'function',
  showAllGroups: 'function',
  groups: 'function',
  visibility: 'function',
  departments: 'function',
  period: 'function',
  selectMode: 'function',
  quotaPerUser: 'function',
  quotaPerContestant: 'function',
  minSelect: 'function',
  maxSelect: 'function',
  ruleHint: 'function',
};

export function voteV2FormTabForFieldName(name: unknown): VoteV2FormTab | undefined {
  const root = Array.isArray(name) ? name[0] : name;
  if (typeof root !== 'string') return undefined;
  return voteV2FormFieldTab[root];
}

export function firstVoteV2FormErrorTab(
  errorFields: Array<{ name: unknown }> | undefined,
): VoteV2FormTab | undefined {
  for (const field of errorFields ?? []) {
    const tab = voteV2FormTabForFieldName(field.name);
    if (tab) return tab;
  }
  return undefined;
}

export function firstVoteV2FormErrorName(
  errorFields: Array<{ name: unknown }> | undefined,
): unknown {
  return errorFields?.[0]?.name;
}
