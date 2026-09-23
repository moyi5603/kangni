import type { DecoBannerFields } from './bannerDeco';

export const decoListStyles = ['large-image', 'two-col', 'left-image', 'left-text', 'scroll'] as const;

export type DecoListStyle = (typeof decoListStyles)[number];
export type DecoSurface = 'mobile' | 'pc';

export const DEMO_DECO_PAGE_HINT = '仅方便演示使用，实际无此装修页面，统一在H5/PC装修中实现';

export type DecoBlock = {
  id: string;
  type: string;
  titleBar: boolean;
  title: string;
  titleColor: string;
  showMore: boolean;
  moreColor: string;
  moreLink: string;
  listStyle: DecoListStyle;
  columnCount: number;
  latestCount: number;
  placeholder: string;
  showTitle?: boolean;
  showTime?: boolean;
  showStatus?: boolean;
  showPinned?: boolean;
  showPlace?: boolean;
  showSignupProgress?: boolean;
  showSignupButton?: boolean;
  showLikes?: boolean;
  showStatusTag?: boolean;
  showCategoryTag?: boolean;
  showHoldMode?: boolean;
  showIntro?: boolean;
  showMembers?: boolean;
  showJoinButton?: boolean;
  showActivityTabs?: boolean;
  showTabRecommend?: boolean;
  showTabLatest?: boolean;
  showTabHot?: boolean;
} & DecoBannerFields;

export type DecoPage = {
  pageTitle: string;
  blocks: DecoBlock[];
};

export const DECO_STYLE_LABEL: Record<DecoListStyle, string> = {
  'large-image': '大图模式',
  'two-col': '一行两列',
  'left-image': '左图右文',
  'left-text': '左文右图',
  scroll: '横向滑动',
};

export function decoStyleLabel(style: DecoListStyle, surface: DecoSurface = 'mobile'): string {
  if (surface === 'pc' && style === 'large-image') return '一行多列';
  if (surface === 'pc' && style === 'scroll') return '一行多列（小图）';
  return DECO_STYLE_LABEL[style];
}

export function decoPastAllListStyle(style: DecoListStyle): DecoListStyle {
  return style === 'scroll' ? 'two-col' : style;
}

export function decoGroupsAllListStyle(style: DecoListStyle): DecoListStyle {
  return style === 'scroll' ? 'large-image' : style;
}

export function decoColumnChoices(style: DecoListStyle, surface: DecoSurface = 'mobile', type = ''): number[] | null {
  if (surface !== 'pc') return null;
  if (style === 'large-image') return [1, 2, 3, 4];
  if (style === 'left-image' || style === 'left-text') return type === 'activity' ? [1, 2] : [1, 2, 3];
  return null;
}

export function defaultDecoColumnCount(style: DecoListStyle, type = ''): number {
  if (style === 'large-image') return type === 'moments' ? 4 : 3;
  if (style === 'two-col') return 2;
  if (style === 'left-image' || style === 'left-text') {
    if (type === 'vote') return 2;
    if (type === 'moments') return 2;
    return 1;
  }
  return 1;
}

export function normalizeDecoColumnCount(
  style: DecoListStyle,
  surface: DecoSurface,
  value: unknown,
  type = '',
): number {
  const choices = decoColumnChoices(style, surface, type);
  const fallback = defaultDecoColumnCount(style, type);
  if (!choices) return fallback;
  const count = Number(value);
  return choices.includes(count) ? count : fallback;
}

export function decoPcColsClass(count: number): string {
  return `is-cols-${count}`;
}

export function isDecoListStyle(value: unknown): value is DecoListStyle {
  return decoListStyles.includes(value as DecoListStyle);
}

export function normalizeDecoListStyle(
  style: unknown,
  allowed: DecoListStyle[],
): DecoListStyle {
  if (isDecoListStyle(style) && allowed.includes(style)) return style;
  return allowed[0] ?? 'left-image';
}

let decoSeq = 1;

export function nextDecoId(type: string): string {
  decoSeq += 1;
  return `deco-${type}-${decoSeq}`;
}

export function addDecoBlock(page: DecoPage, block: DecoBlock, index?: number): DecoPage {
  const blocks = [...page.blocks];
  const at = index == null ? blocks.length : Math.min(Math.max(index, 0), blocks.length);
  blocks.splice(at, 0, block);
  return { ...page, blocks };
}

export function removeDecoBlock(page: DecoPage, id: string): DecoPage {
  return { ...page, blocks: page.blocks.filter((item) => item.id !== id) };
}

export function moveDecoBlock(page: DecoPage, id: string, toIndex: number): DecoPage {
  const from = page.blocks.findIndex((item) => item.id === id);
  if (from < 0) return page;
  const blocks = [...page.blocks];
  const [item] = blocks.splice(from, 1);
  const at = Math.min(Math.max(toIndex, 0), blocks.length);
  blocks.splice(at, 0, item);
  return { ...page, blocks };
}

export function patchDecoBlock(page: DecoPage, id: string, patch: Partial<DecoBlock>): DecoPage {
  return {
    ...page,
    blocks: page.blocks.map((item) =>
      item.id === id ? { ...item, ...patch, title: (patch.title ?? item.title).slice(0, 40) } : item,
    ),
  };
}
