export type DecoActivityCardFields = {
  showPinned: boolean;
  showCategoryTag: boolean;
  showHoldMode: boolean;
  showStatusTag: boolean;
  showLikes: boolean;
  showTitle: boolean;
  showTime: boolean;
  showPlace: boolean;
  showSignupProgress: boolean;
  showSignupButton: boolean;
};

export const DECO_ACTIVITY_CARD_FIELD_TOGGLES = [
  ['showPinned', '置顶'],
  ['showCategoryTag', '分类'],
  ['showHoldMode', '举办方式'],
  ['showStatusTag', '状态'],
  ['showLikes', '点赞'],
  ['showTitle', '标题'],
  ['showTime', '活动时间'],
  ['showPlace', '活动地点'],
  ['showSignupProgress', '报名进度'],
  ['showSignupButton', '报名按钮'],
] as const satisfies ReadonlyArray<readonly [keyof DecoActivityCardFields, string]>;

export const DECO_MOMENT_CARD_FIELD_TOGGLES = [
  ['showTitle', '标题'],
  ['showStatusTag', '状态'],
] as const satisfies ReadonlyArray<readonly [keyof DecoActivityCardFields, string]>;

export type DecoGroupCardFields = {
  showTitle: boolean;
  showCategoryTag: boolean;
  showIntro: boolean;
  showMembers: boolean;
  showJoinButton: boolean;
};

export const DECO_GROUP_CARD_FIELD_TOGGLES = [
  ['showTitle', '标题'],
  ['showCategoryTag', '分类'],
  ['showIntro', '描述'],
  ['showMembers', '成员'],
  ['showJoinButton', '入组按钮'],
] as const satisfies ReadonlyArray<readonly [keyof DecoGroupCardFields, string]>;

export function decoGroupCardFields(source?: Partial<DecoGroupCardFields> | null): DecoGroupCardFields {
  return {
    showTitle: source?.showTitle !== false,
    showCategoryTag: source?.showCategoryTag !== false,
    showIntro: source?.showIntro !== false,
    showMembers: source?.showMembers !== false,
    showJoinButton: source?.showJoinButton !== false,
  };
}

export function decoActivityCardFields(source?: Partial<DecoActivityCardFields> | null): DecoActivityCardFields {
  return {
    showPinned: source?.showPinned !== false,
    showCategoryTag: source?.showCategoryTag !== false,
    showHoldMode: source?.showHoldMode !== false,
    showStatusTag: source?.showStatusTag !== false,
    showLikes: source?.showLikes !== false,
    showTitle: source?.showTitle !== false,
    showTime: source?.showTime !== false,
    showPlace: source?.showPlace !== false,
    showSignupProgress: source?.showSignupProgress !== false,
    showSignupButton: source?.showSignupButton !== false,
  };
}
