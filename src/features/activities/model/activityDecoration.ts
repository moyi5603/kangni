import {
  decoColumnChoices,
  decoStyleLabel,
  defaultDecoColumnCount,
  normalizeDecoColumnCount,
} from '../../../shared/decoration/decoTypes';
import {
  cloneSlides,
  createDecoSlide,
  DECO_BANNER_STYLE_LABEL,
  type DecoBannerStyle,
  type DecoIndicator,
  type DecoSlide,
} from '../../../shared/decoration/bannerDeco';
import {
  DECO_ACTIVITY_CARD_FIELD_TOGGLES,
  DECO_MOMENT_CARD_FIELD_TOGGLES,
  decoActivityCardFields,
} from '../../../shared/decoration/decoCardFields';

export { cloneSlides, createDecoSlide, DECO_BANNER_STYLE_LABEL };

export const ACTIVITY_DECO_MOCK_VERSION = 12;

export const activityDecoBlockTypes = ['search', 'banner', 'activity', 'moments'] as const;
export const activityDecoListStyles = ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'] as const;
export const activityDecoBannerStyles = ['bleed', 'inset', 'split'] as const;
export const activityDecoIndicators = ['dot', 'number'] as const;

export type ActivityDecoBlockType = (typeof activityDecoBlockTypes)[number];
export type ActivityDecoListStyle = (typeof activityDecoListStyles)[number];
export type ActivityDecoBannerStyle = DecoBannerStyle;
export type ActivityDecoIndicator = DecoIndicator;
export type ActivityDecoSurface = 'mobile' | 'pc';

export type ActivityDecoSlide = DecoSlide;

export type ActivityDecoBlock = {
  id: string;
  type: ActivityDecoBlockType;
  titleBar: boolean;
  title: string;
  titleColor: string;
  showMore: boolean;
  moreColor: string;
  moreLink: string;
  listStyle: ActivityDecoListStyle;
  columnCount: number;
  latestCount: number;
  showTitle: boolean;
  showTime: boolean;
  showPlace: boolean;
  showSignupProgress: boolean;
  showSignupButton: boolean;
  showLikes: boolean;
  showStatusTag: boolean;
  showCategoryTag: boolean;
  showHoldMode: boolean;
  showPinned: boolean;
  placeholder: string;
  bannerStyle: ActivityDecoBannerStyle;
  bannerHeight: number;
  indicator: ActivityDecoIndicator;
  immersive: boolean;
  autoplay: boolean;
  interval: number;
  bannerMode: 'template' | 'custom';
  slides: ActivityDecoSlide[];
};

export const DECO_ACTIVITY_FIELD_TOGGLES = DECO_ACTIVITY_CARD_FIELD_TOGGLES;
export const DECO_MOMENT_FIELD_TOGGLES = DECO_MOMENT_CARD_FIELD_TOGGLES;
export { decoActivityCardFields };

export type ActivityDecoPage = {
  pageTitle: string;
  blocks: ActivityDecoBlock[];
};

export const DECO_TYPE_LABEL: Record<ActivityDecoBlockType, string> = {
  search: '搜索',
  banner: '轮播图',
  activity: '活动',
  moments: '精彩瞬间',
};

export {
  decoColumnChoices,
  decoStyleLabel,
  defaultDecoColumnCount,
  normalizeDecoColumnCount,
};

export const DECO_STYLE_LABEL: Record<ActivityDecoListStyle, string> = {
  'large-image': '大图模式',
  'two-col': '一行两列',
  'left-image': '左图右文',
  'left-text': '左文右图',
  scroll: '横向滑动',
};

export const DECO_STYLES_BY_TYPE: Record<ActivityDecoBlockType, ActivityDecoListStyle[]> = {
  search: [],
  banner: [],
  activity: ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'],
  moments: ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'],
};

export function decoStylesForType(type: ActivityDecoBlockType, surface: ActivityDecoSurface = 'mobile'): ActivityDecoListStyle[] {
  if ((type === 'moments' || type === 'activity') && surface === 'pc') {
    return ['large-image', 'left-image', 'left-text'];
  }
  return DECO_STYLES_BY_TYPE[type];
}

export function normalizeDecoListStyle(
  type: ActivityDecoBlockType,
  style: unknown,
  surface: ActivityDecoSurface = 'mobile',
): ActivityDecoListStyle {
  const allowed = decoStylesForType(type, surface);
  if (isStyle(style) && allowed.includes(style)) return style;
  return allowed[0] ?? 'left-image';
}

let decoSeq = 1;

export function nextDecoId(type: ActivityDecoBlockType): string {
  decoSeq += 1;
  return `deco-${type}-${decoSeq}`;
}

function isType(value: unknown): value is ActivityDecoBlockType {
  return activityDecoBlockTypes.includes(value as ActivityDecoBlockType);
}

function isStyle(value: unknown): value is ActivityDecoListStyle {
  return activityDecoListStyles.includes(value as ActivityDecoListStyle);
}

function isBannerStyle(value: unknown): value is ActivityDecoBannerStyle {
  return activityDecoBannerStyles.includes(value as ActivityDecoBannerStyle);
}

function isIndicator(value: unknown): value is ActivityDecoIndicator {
  return activityDecoIndicators.includes(value as ActivityDecoIndicator);
}

export function createDecoBlock(type: ActivityDecoBlockType, id = nextDecoId(type)): ActivityDecoBlock {
  const isBanner = type === 'banner';
  const isChrome = type !== 'search' && !isBanner;
  return {
    id,
    type,
    titleBar: isChrome,
    title: DECO_TYPE_LABEL[type],
    titleColor: '#171A1D',
    showMore: isChrome,
    moreColor: '#747677',
    moreLink: '',
    listStyle: normalizeDecoListStyle(type, type === 'moments' ? 'scroll' : 'left-image'),
    columnCount: defaultDecoColumnCount(type === 'moments' ? 'scroll' : 'left-image', type),
    latestCount: type === 'moments' ? 5 : type === 'activity' ? 3 : 2,
    showTitle: true,
    showTime: true,
    showPlace: true,
    showSignupProgress: true,
    showSignupButton: true,
    showLikes: true,
    showStatusTag: true,
    showCategoryTag: true,
    showHoldMode: true,
    showPinned: true,
    placeholder: '搜索活动名称',
    bannerStyle: 'split',
    bannerHeight: 174,
    indicator: 'dot',
    immersive: true,
    autoplay: true,
    interval: 5,
    bannerMode: 'custom',
    slides: isBanner ? [createDecoSlide({ id: 'slide-1', imageUrl: '/activities/share.jpg' })] : [],
  };
}

export const defaultDecoPage: ActivityDecoPage = {
  pageTitle: '员工活动',
  blocks: [
    createDecoBlock('search', 'deco-search'),
    createDecoBlock('activity', 'deco-activity'),
    createDecoBlock('moments', 'deco-moments'),
  ],
};

export function cloneDecoPage(page: ActivityDecoPage | undefined, surface: ActivityDecoSurface = 'mobile'): ActivityDecoPage {
  const source = page ?? defaultDecoPage;
  return {
    pageTitle: source.pageTitle.trim() || defaultDecoPage.pageTitle,
    blocks: (source.blocks ?? []).filter((item) => isType(item.type)).map((item) => ({
      ...createDecoBlock(item.type, item.id),
      titleBar: Boolean(item.titleBar),
      title: item.title?.slice(0, 40) || DECO_TYPE_LABEL[item.type],
      titleColor: item.titleColor || '#171A1D',
      showMore: Boolean(item.showMore),
      moreColor: item.moreColor || '#747677',
      moreLink: item.moreLink ?? '',
      listStyle: normalizeDecoListStyle(item.type, item.listStyle, surface),
      columnCount: normalizeDecoColumnCount(
        normalizeDecoListStyle(item.type, item.listStyle, surface),
        surface,
        item.columnCount,
        item.type,
      ),
      latestCount: Math.min(20, Math.max(1, Number(item.latestCount) || 2)),
      showTitle: item.showTitle !== false,
      showTime: item.showTime !== false,
      showPlace: item.showPlace !== false,
      showSignupProgress: item.showSignupProgress !== false,
      showSignupButton: item.showSignupButton !== false,
      showLikes: item.showLikes !== false,
      showStatusTag: item.showStatusTag !== false,
      showCategoryTag: item.showCategoryTag !== false,
      showHoldMode: item.showHoldMode !== false,
      showPinned: item.showPinned !== false,
      placeholder: item.placeholder || '搜索活动名称',
      bannerStyle: isBannerStyle(item.bannerStyle) ? item.bannerStyle : 'split',
      bannerHeight: Math.min(420, Math.max(80, Number(item.bannerHeight) || 174)),
      indicator: isIndicator(item.indicator) ? item.indicator : 'dot',
      immersive: item.immersive !== false,
      autoplay: item.autoplay !== false,
      interval: Math.min(10, Math.max(1, Number(item.interval) || 5)),
      bannerMode: item.bannerMode === 'template' ? 'template' : 'custom',
      slides: item.type === 'banner' ? cloneSlides(item.slides) : [],
    })),
  };
}

export function addDecoBlock(page: ActivityDecoPage, block: ActivityDecoBlock, index?: number): ActivityDecoPage {
  const blocks = [...page.blocks];
  const at = index == null ? blocks.length : Math.min(Math.max(index, 0), blocks.length);
  blocks.splice(at, 0, block);
  return { ...page, blocks };
}

export function removeDecoBlock(page: ActivityDecoPage, id: string): ActivityDecoPage {
  return { ...page, blocks: page.blocks.filter((item) => item.id !== id) };
}

export function moveDecoBlock(page: ActivityDecoPage, id: string, toIndex: number): ActivityDecoPage {
  const from = page.blocks.findIndex((item) => item.id === id);
  if (from < 0) return page;
  const blocks = [...page.blocks];
  const [item] = blocks.splice(from, 1);
  const at = Math.min(Math.max(toIndex, 0), blocks.length);
  blocks.splice(at, 0, item);
  return { ...page, blocks };
}

export function patchDecoBlock(page: ActivityDecoPage, id: string, patch: Partial<ActivityDecoBlock>): ActivityDecoPage {
  return {
    ...page,
    blocks: page.blocks.map((item) => (item.id === id ? { ...item, ...patch, title: (patch.title ?? item.title).slice(0, 40) } : item)),
  };
}

export function defaultDecoPageFor(surface: ActivityDecoSurface): ActivityDecoPage {
  const page = cloneDecoPage(defaultDecoPage, surface);
  return {
    ...page,
    pageTitle: surface === 'pc' ? '活动' : page.pageTitle,
    blocks: page.blocks.map((block) => {
      if (block.type === 'activity') {
        return {
          ...block,
          listStyle: 'large-image',
          columnCount: defaultDecoColumnCount('large-image', 'activity'),
          latestCount: surface === 'pc' ? 6 : 3,
        };
      }
      if (block.type === 'moments') {
        return {
          ...block,
          listStyle: surface === 'pc' ? 'large-image' : 'scroll',
          columnCount: defaultDecoColumnCount(surface === 'pc' ? 'large-image' : 'scroll', 'moments'),
          latestCount: surface === 'pc' ? 4 : 5,
        };
      }
      return block;
    }),
  };
}
