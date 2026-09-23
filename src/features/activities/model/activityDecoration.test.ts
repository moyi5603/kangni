import { describe, expect, it } from 'vitest';
import {
  addDecoBlock,
  createDecoBlock,
  defaultDecoPage,
  moveDecoBlock,
  patchDecoBlock,
  removeDecoBlock,
  normalizeDecoListStyle,
  type ActivityDecoBlockType,
  decoStyleLabel,
  decoColumnChoices,
  normalizeDecoColumnCount,
  decoStylesForType,
  DECO_STYLES_BY_TYPE,
  defaultDecoPageFor,
} from './activityDecoration';

describe('activityDecoration', () => {
  it('defaults to search, activity and moments', () => {
    expect(defaultDecoPage.blocks.map((item) => item.type)).toEqual(['search', 'activity', 'moments']);
    expect(defaultDecoPage.pageTitle).toBe('员工活动');
    expect(defaultDecoPageFor('pc').pageTitle).toBe('活动');
    expect(defaultDecoPageFor('mobile').pageTitle).toBe('员工活动');
    expect(createDecoBlock('banner').bannerMode).toBe('custom');
    expect(createDecoBlock('banner').bannerStyle).toBe('split');
  });

  it('creates typed blocks with Chinese titles', () => {
    const titles: Record<ActivityDecoBlockType, string> = {
      search: '搜索',
      banner: '轮播图',
      activity: '活动',
      moments: '精彩瞬间',
    };
    (Object.keys(titles) as ActivityDecoBlockType[]).forEach((type) => {
      expect(createDecoBlock(type).title).toBe(titles[type]);
      expect(createDecoBlock(type).type).toBe(type);
    });
  });

  it('appends, moves and removes blocks', () => {
    const page = defaultDecoPage;
    const extra = createDecoBlock('activity');
    const added = addDecoBlock(page, extra);
    expect(added.blocks).toHaveLength(4);
    expect(added.blocks.at(-1)?.id).toBe(extra.id);

    const moved = moveDecoBlock(added, extra.id, 0);
    expect(moved.blocks[0].id).toBe(extra.id);

    const removed = removeDecoBlock(moved, extra.id);
    expect(removed.blocks.map((item) => item.type)).toEqual(['search', 'activity', 'moments']);
  });

  it('patches title and list style', () => {
    const id = 'deco-activity';
    const next = patchDecoBlock(defaultDecoPage, id, { title: '热门活动', listStyle: 'left-image' });
    const activity = next.blocks.find((item) => item.id === id);
    expect(activity?.title).toBe('热门活动');
    expect(activity?.listStyle).toBe('left-image');
  });

  it('uses screenshot style sets per block type', () => {
    expect(DECO_STYLES_BY_TYPE.activity).toEqual(['large-image', 'two-col', 'left-image', 'left-text', 'scroll']);
    expect(DECO_STYLES_BY_TYPE.moments).toEqual(['large-image', 'two-col', 'left-image', 'left-text', 'scroll']);
    expect(decoStylesForType('activity', 'pc')).toEqual(['large-image', 'left-image', 'left-text']);
    expect(decoStylesForType('moments', 'pc')).toEqual(['large-image', 'left-image', 'left-text']);
    expect(normalizeDecoListStyle('moments', 'two-col', 'pc')).toBe('large-image');
    expect(normalizeDecoListStyle('moments', 'scroll', 'pc')).toBe('large-image');
    expect(createDecoBlock('activity').listStyle).toBe('left-image');
    expect(createDecoBlock('moments').listStyle).toBe('scroll');
    expect(normalizeDecoListStyle('activity', 'scroll')).toBe('scroll');
    expect(normalizeDecoListStyle('activity', 'two-col')).toBe('two-col');
    expect(normalizeDecoListStyle('activity', 'scroll', 'pc')).toBe('large-image');
    expect(normalizeDecoListStyle('moments', 'scroll')).toBe('scroll');
  });

  it('labels large-image as multi-column on PC', () => {
    expect(decoStyleLabel('large-image')).toBe('大图模式');
    expect(decoStyleLabel('large-image', 'mobile')).toBe('大图模式');
    expect(decoStyleLabel('large-image', 'pc')).toBe('一行多列');
    expect(decoStyleLabel('scroll', 'pc')).toBe('一行多列（小图）');
    expect(decoStyleLabel('scroll', 'mobile')).toBe('横向滑动');
    expect(decoStyleLabel('left-image', 'pc')).toBe('左图右文');
  });

  it('offers PC column counts for 一行多列 and side layouts', () => {
    expect(decoColumnChoices('large-image', 'pc')).toEqual([1, 2, 3, 4]);
    expect(decoColumnChoices('left-image', 'pc', 'activity')).toEqual([1, 2]);
    expect(decoColumnChoices('left-text', 'pc', 'activity')).toEqual([1, 2]);
    expect(decoColumnChoices('left-image', 'pc', 'moments')).toEqual([1, 2, 3]);
    expect(decoColumnChoices('left-image', 'pc', 'vote')).toEqual([1, 2, 3]);
    expect(decoColumnChoices('large-image', 'mobile')).toBeNull();
    expect(normalizeDecoColumnCount('large-image', 'pc', undefined, 'activity')).toBe(3);
    expect(normalizeDecoColumnCount('large-image', 'pc', 5, 'activity')).toBe(3);
    expect(normalizeDecoColumnCount('left-image', 'pc', undefined, 'activity')).toBe(1);
    expect(normalizeDecoColumnCount('left-image', 'pc', undefined, 'moments')).toBe(2);
    expect(normalizeDecoColumnCount('left-image', 'pc', 3, 'activity')).toBe(1);
    expect(normalizeDecoColumnCount('left-image', 'pc', 5, 'activity')).toBe(1);
    expect(normalizeDecoColumnCount('left-image', 'pc', undefined, 'vote')).toBe(2);
    expect(normalizeDecoColumnCount('large-image', 'pc', undefined, 'moments')).toBe(4);
    expect(defaultDecoPageFor('pc').blocks.find((item) => item.type === 'moments')?.listStyle).toBe('large-image');
    expect(defaultDecoPageFor('pc').blocks.find((item) => item.type === 'activity')?.columnCount).toBe(3);
    expect(defaultDecoPageFor('pc').blocks.find((item) => item.type === 'moments')?.columnCount).toBe(4);
    expect(defaultDecoPageFor('mobile').blocks.find((item) => item.type === 'activity')?.listStyle).toBe('large-image');
    expect(defaultDecoPageFor('mobile').blocks.find((item) => item.type === 'moments')?.listStyle).toBe('scroll');
    expect(defaultDecoPageFor('mobile').blocks.find((item) => item.type === 'activity')?.latestCount).toBe(3);
    expect(defaultDecoPageFor('mobile').blocks.find((item) => item.type === 'moments')?.latestCount).toBe(5);
    expect(defaultDecoPageFor('pc').blocks.find((item) => item.type === 'activity')?.latestCount).toBe(6);
    expect(defaultDecoPageFor('pc').blocks.find((item) => item.type === 'moments')?.latestCount).toBe(4);
  });
});
