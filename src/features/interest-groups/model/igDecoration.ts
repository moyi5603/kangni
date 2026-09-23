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
import { decoActivityCardFields, decoGroupCardFields } from '../../../shared/decoration/decoCardFields';
import { decoActivityTabFields } from '../../../shared/decoration/decoActivityTabs';

export const IG_DECO_MOCK_VERSION = 11;
export const igDecoBlockTypes = ['search', 'ai', 'banner', 'groups', 'activity', 'moments'] as const;
export type IgDecoBlockType = (typeof igDecoBlockTypes)[number];

export const IG_DECO_TYPE_LABEL: Record<IgDecoBlockType, string> = {
  search: '搜索',
  ai: 'AI助手',
  banner: '轮播图',
  groups: '兴趣圈',
  activity: '活动',
  moments: '精彩瞬间',
};

export const IG_DECO_STYLES_BY_TYPE: Record<IgDecoBlockType, DecoListStyle[]> = {
  search: [],
  ai: [],
  banner: [],
  groups: ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'],
  activity: ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'],
  moments: ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'],
};

export function igDecoStylesForType(type: string, surface: DecoSurface = 'mobile'): DecoListStyle[] {
  if (!isIgDecoType(type)) return [];
  if ((type === 'moments' || type === 'groups' || type === 'activity') && surface === 'pc') {
    return ['large-image', 'left-image', 'left-text'];
  }
  return IG_DECO_STYLES_BY_TYPE[type];
}

function isIgDecoType(value: unknown): value is IgDecoBlockType {
  return igDecoBlockTypes.includes(value as IgDecoBlockType);
}

export function createIgDecoBlock(type: string, id = nextDecoId(type)): DecoBlock {
  const kind = isIgDecoType(type) ? type : 'activity';
  const allowed = igDecoStylesForType(kind);
  return {
    id,
    type: kind,
    titleBar: kind !== 'search' && kind !== 'banner' && kind !== 'ai',
    title: IG_DECO_TYPE_LABEL[kind],
    titleColor: '#171A1D',
    showMore: kind !== 'search' && kind !== 'banner' && kind !== 'ai',
    moreColor: '#747677',
    moreLink: '',
    listStyle: normalizeDecoListStyle(kind === 'moments' || kind === 'groups' ? 'scroll' : 'large-image', allowed),
    columnCount: defaultDecoColumnCount(kind === 'moments' || kind === 'groups' ? 'scroll' : 'large-image', kind),
    latestCount: kind === 'moments' || kind === 'groups' ? 5 : kind === 'activity' ? 3 : 2,
    placeholder: kind === 'ai' ? '和AI助手聊聊，找到适合你的活动' : '搜索活动或兴趣圈名称',
    ...decoActivityCardFields(),
    ...decoGroupCardFields(),
    ...decoActivityTabFields(),
    ...defaultBannerFields(kind === 'banner'),
  };
}

export const defaultIgDecoPage: DecoPage = {
  pageTitle: '兴趣圈',
  blocks: [
    createIgDecoBlock('search', 'deco-search'),
    createIgDecoBlock('groups', 'deco-groups'),
    createIgDecoBlock('activity', 'deco-activity'),
    createIgDecoBlock('moments', 'deco-moments'),
  ],
};

export function cloneIgDecoPage(page: DecoPage | undefined, surface: DecoSurface = 'mobile'): DecoPage {
  const source = page ?? defaultIgDecoPage;
  return {
    pageTitle: source.pageTitle.trim() || defaultIgDecoPage.pageTitle,
    blocks: (source.blocks ?? []).filter((item) => isIgDecoType(item.type)).map((item) => ({
      ...createIgDecoBlock(item.type, item.id),
      titleBar: Boolean(item.titleBar),
      title: item.title?.slice(0, 40) || IG_DECO_TYPE_LABEL[item.type as IgDecoBlockType],
      titleColor: item.titleColor || '#171A1D',
      showMore: Boolean(item.showMore),
      moreColor: item.moreColor || '#747677',
      moreLink: item.moreLink ?? '',
      listStyle: normalizeDecoListStyle(item.listStyle, igDecoStylesForType(item.type, surface)),
      columnCount: normalizeDecoColumnCount(
        normalizeDecoListStyle(item.listStyle, igDecoStylesForType(item.type, surface)),
        surface,
        item.columnCount,
        item.type,
      ),
      latestCount: Math.min(20, Math.max(1, Number(item.latestCount) || 2)),
      placeholder:
        item.placeholder || (item.type === 'ai' ? '和AI助手聊聊，找到适合你的活动' : '搜索活动或兴趣圈名称'),
      ...decoActivityCardFields(item),
      ...decoGroupCardFields(item),
      ...decoActivityTabFields(item),
      ...cloneBannerFields(item),
    })),
  };
}

export function defaultIgDecoPageFor(surface: DecoSurface): DecoPage {
  const page = cloneIgDecoPage(defaultIgDecoPage, surface);
  return {
    ...page,
    blocks: page.blocks.map((block) => {
      if (block.type === 'groups') {
        return {
          ...block,
          title: '热门兴趣圈',
          listStyle: surface === 'pc' ? 'large-image' : 'scroll',
          columnCount: defaultDecoColumnCount(surface === 'pc' ? 'large-image' : 'scroll', 'groups'),
          latestCount: surface === 'pc' ? 3 : 5,
        };
      }
      if (block.type === 'activity') {
        return {
          ...block,
          title: '活动',
          listStyle: 'large-image',
          columnCount: defaultDecoColumnCount('large-image', 'activity'),
          latestCount: surface === 'pc' ? 6 : 3,
        };
      }
      if (block.type === 'moments') {
        return {
          ...block,
          title: '往期精彩回顾',
          listStyle: surface === 'pc' ? 'large-image' : 'scroll',
          columnCount: defaultDecoColumnCount(surface === 'pc' ? 'large-image' : 'scroll', 'moments'),
          latestCount: surface === 'pc' ? 4 : 5,
        };
      }
      return block;
    }),
  };
}
