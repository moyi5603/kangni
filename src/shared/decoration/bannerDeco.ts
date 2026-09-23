export const decoBannerStyles = ['bleed', 'inset', 'split'] as const;
export const decoIndicators = ['dot', 'number'] as const;

export type DecoBannerStyle = (typeof decoBannerStyles)[number];
export type DecoIndicator = (typeof decoIndicators)[number];
export type DecoBannerMode = 'template' | 'custom';

export type DecoSlide = {
  id: string;
  overlayUrl: string;
  imageUrl: string;
  link: string;
};

export type DecoBannerFields = {
  bannerStyle: DecoBannerStyle;
  bannerHeight: number;
  indicator: DecoIndicator;
  immersive: boolean;
  autoplay: boolean;
  interval: number;
  bannerMode: DecoBannerMode;
  slides: DecoSlide[];
};

export const DECO_BANNER_STYLE_LABEL: Record<DecoBannerStyle, string> = {
  bleed: '通栏',
  inset: '卡片',
  split: '叠层',
};

function isBannerStyle(value: unknown): value is DecoBannerStyle {
  return decoBannerStyles.includes(value as DecoBannerStyle);
}

function isIndicator(value: unknown): value is DecoIndicator {
  return decoIndicators.includes(value as DecoIndicator);
}

let slideSeq = 1;

export function nextSlideId(): string {
  slideSeq += 1;
  return `slide-${slideSeq}`;
}

export function createDecoSlide(partial?: Partial<DecoSlide>): DecoSlide {
  return {
    id: partial?.id || nextSlideId(),
    overlayUrl: partial?.overlayUrl ?? '',
    imageUrl: partial?.imageUrl ?? '/activities/share.jpg',
    link: partial?.link ?? '',
  };
}

export function cloneSlides(slides: DecoSlide[] | undefined): DecoSlide[] {
  const source = Array.isArray(slides) && slides.length ? slides : [createDecoSlide({ id: 'slide-1' })];
  return source.slice(0, 8).map((item) => createDecoSlide(item));
}

export function defaultBannerFields(isBanner: boolean): DecoBannerFields {
  return {
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

export function cloneBannerFields(item: Partial<DecoBannerFields> & { type?: string }): DecoBannerFields {
  return {
    bannerStyle: isBannerStyle(item.bannerStyle) ? item.bannerStyle : 'split',
    bannerHeight: Math.min(420, Math.max(80, Number(item.bannerHeight) || 174)),
    indicator: isIndicator(item.indicator) ? item.indicator : 'dot',
    immersive: item.immersive !== false,
    autoplay: item.autoplay !== false,
    interval: Math.min(10, Math.max(1, Number(item.interval) || 5)),
    bannerMode: item.bannerMode === 'template' ? 'template' : 'custom',
    slides: item.type === 'banner' ? cloneSlides(item.slides) : [],
  };
}

export function defaultBannerSlides(links: [string, string, string]): DecoSlide[] {
  return [
    createDecoSlide({ id: 'slide-1', imageUrl: '/activities/open-day.jpg', link: links[0] }),
    createDecoSlide({ id: 'slide-2', imageUrl: '/activities/share.jpg', link: links[1] }),
    createDecoSlide({ id: 'slide-3', imageUrl: '/activities/basketball.jpg', link: links[2] }),
  ];
}
