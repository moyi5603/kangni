import {
  cloneBannerFields,
  defaultBannerFields,
} from '../../../shared/decoration/bannerDeco';
import {
  nextDecoId,
  normalizeDecoColumnCount,
  normalizeDecoListStyle,
  defaultDecoColumnCount,
  type DecoBlock,
  type DecoListStyle,
  type DecoPage,
  type DecoSurface,
} from '../../../shared/decoration/decoTypes';

export const VOTE_DECO_MOCK_VERSION = 7;
export const voteDecoBlockTypes = ['search', 'banner', 'vote'] as const;
export type VoteDecoBlockType = (typeof voteDecoBlockTypes)[number];

export const VOTE_DECO_FIELD_TOGGLES = [
  ['showTitle', '标题'],
  ['showStatus', '状态'],
  ['showTime', '投票时间'],
] as const satisfies ReadonlyArray<readonly [keyof DecoBlock, string]>;

export const VOTE_DECO_TYPE_LABEL: Record<VoteDecoBlockType, string> = {
  search: '搜索',
  banner: '轮播图',
  vote: '投票',
};

export const VOTE_DECO_STYLES_BY_TYPE: Record<VoteDecoBlockType, DecoListStyle[]> = {
  search: [],
  banner: [],
  vote: ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'],
};

export function voteDecoStylesForType(type: string, surface: DecoSurface = 'mobile'): DecoListStyle[] {
  if (!isVoteDecoType(type)) return [];
  if (type === 'vote' && surface === 'pc') {
    return ['large-image', 'left-image', 'left-text'];
  }
  return VOTE_DECO_STYLES_BY_TYPE[type];
}

function isVoteDecoType(value: unknown): value is VoteDecoBlockType {
  return voteDecoBlockTypes.includes(value as VoteDecoBlockType);
}

export function createVoteDecoBlock(type: string, id = nextDecoId(type)): DecoBlock {
  const kind = isVoteDecoType(type) ? type : 'vote';
  const allowed = voteDecoStylesForType(kind);
  return {
    id,
    type: kind,
    titleBar: kind !== 'search' && kind !== 'banner',
    title: kind === 'vote' ? '发现投票' : VOTE_DECO_TYPE_LABEL[kind],
    titleColor: '#171A1D',
    showMore: false,
    moreColor: '#747677',
    moreLink: '',
    listStyle: normalizeDecoListStyle('left-image', allowed),
    columnCount: defaultDecoColumnCount('left-image', kind),
    latestCount: 99,
    placeholder: '搜索投票名称',
    showTitle: true,
    showTime: true,
    showStatus: true,
    ...defaultBannerFields(kind === 'banner'),
  };
}

export const defaultVoteDecoPage: DecoPage = {
  pageTitle: '投票',
  blocks: [createVoteDecoBlock('vote', 'deco-vote')],
};

export function cloneVoteDecoPage(page: DecoPage | undefined, surface: DecoSurface = 'mobile'): DecoPage {
  const source = page ?? defaultVoteDecoPage;
  return {
    pageTitle: source.pageTitle.trim() || defaultVoteDecoPage.pageTitle,
    blocks: (source.blocks ?? []).filter((item) => isVoteDecoType(item.type)).map((item) => ({
      ...createVoteDecoBlock(item.type, item.id),
      titleBar: Boolean(item.titleBar),
      title: item.title?.slice(0, 40) || (item.type === 'vote' ? '发现投票' : VOTE_DECO_TYPE_LABEL[item.type as VoteDecoBlockType]),
      titleColor: item.titleColor || '#171A1D',
      showMore: Boolean(item.showMore),
      moreColor: item.moreColor || '#747677',
      moreLink: item.moreLink ?? '',
      listStyle: normalizeDecoListStyle(item.listStyle, voteDecoStylesForType(item.type, surface)),
      columnCount: normalizeDecoColumnCount(
        normalizeDecoListStyle(item.listStyle, voteDecoStylesForType(item.type, surface)),
        surface,
        item.columnCount,
        item.type,
      ),
      latestCount: Math.min(99, Math.max(1, Number(item.latestCount) || 99)),
      placeholder: item.placeholder || '搜索投票名称',
      showTitle: item.showTitle !== false,
      showTime: item.showTime !== false,
      showStatus: item.showStatus !== false,
      ...cloneBannerFields(item),
    })),
  };
}

export function defaultVoteDecoPageFor(surface: DecoSurface): DecoPage {
  const page = cloneVoteDecoPage(defaultVoteDecoPage, surface);
  return {
    ...page,
    blocks: page.blocks.map((block) => {
      if (block.type === 'vote') {
        return {
          ...block,
          titleBar: surface === 'pc',
          latestCount: 99,
          listStyle: 'left-image',
          columnCount: surface === 'pc' ? 2 : defaultDecoColumnCount('left-image', 'vote'),
        };
      }
      return block;
    }),
  };
}
