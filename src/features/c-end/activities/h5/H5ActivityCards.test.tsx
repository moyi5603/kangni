import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialActivities, type Activity } from '../../../activities/model/activity';
import { H5ActivityListCard, H5ActivitySearchRow, PastActivityFeedCard, PastActivityRailCard } from './H5ActivityCards';
import { H5ActivityShell } from './H5ActivityShell';

const openActivity: Activity = {
  ...initialActivities[0],
  title: '员工开放日',
  type: '公司活动',
  activityStatus: '进行中',
  publishStatus: '已发布',
  signupStartAt: '2000-01-01 00:00',
  signupEndAt: '2099-12-31 23:59',
  signupSettings: [{ type: '个人报名', limit: 50, needAudit: true }],
};

describe('H5 activity cards', () => {
  it('uses CTA state in list card content and accessible name', () => {
    const ended = { ...openActivity, activityStatus: '已结束' as const };
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={ended} onOpen={() => undefined} />,
    );

    expect(html).toContain('报名已结束');
    expect(html).toContain(
      'aria-label="员工开放日，文化，已结束，时间 04-12 09:00 ~ 04-12 17:00，地点 总部一号楼多功能厅，报名已结束，已报名 3/50"',
    );
    expect(html).toContain('04-12 09:00 ~ 04-12 17:00');
    expect(html).not.toContain('日期 04/12');
    expect(html).toContain('地点 总部一号楼多功能厅');
    expect(html).toContain('c-h5-card-button');
    expect(html).toContain('已报名3/50');
    expect(html).toContain('余47位');
    expect(html).toContain('c-home-quota-bar');
    expect(html).toContain('3人');
    expect(html).not.toContain('限额 50 人');
    expect(html).not.toContain('c-social');
    expect(html).not.toContain('c-card-btn');
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    expect(cover).toContain('c-cover-badges');
    expect(cover).toContain('c-cover-badges is-end');
    expect(cover).toContain('c-cover-title');
    expect(cover).toContain('c-cover-likes');
    expect(cover).toContain('员工开放日');
    expect(cover.indexOf('c-cover-badges')).toBeLessThan(cover.indexOf('c-cover-title'));
    const start = cover.slice(0, cover.indexOf('c-cover-badges is-end'));
    expect(start).toContain('已结束');
    expect(start).toContain('文化');
    expect(start).not.toContain('单次活动');
    expect(cover.slice(cover.indexOf('c-cover-badges is-end'))).toContain('单次活动');
    expect(cover).not.toContain('置顶');
    expect(html).not.toContain('c-cover-type');
    expect(html.slice(html.indexOf('c-list-copy'))).not.toContain('c-card-title');
  });

  it('shows format after category and puts status top-right in two-col layout', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} layout="two-col" onOpen={() => undefined} />,
    );
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    const start = cover.slice(0, cover.indexOf('c-cover-badges is-end'));
    const end = cover.slice(cover.indexOf('c-cover-badges is-end'));
    expect(start).toContain('文化');
    expect(start).toContain('单次活动');
    expect(start.indexOf('文化')).toBeLessThan(start.indexOf('单次活动'));
    expect(start).not.toContain('进行中');
    expect(end).toContain('进行中');
    expect(end).not.toContain('单次活动');
  });

  it('hides format on two-col when 举办方式 is off', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard
        activity={openActivity}
        layout="two-col"
        fields={{ showHoldMode: false }}
        onOpen={() => undefined}
      />,
    );
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    expect(cover).not.toContain('单次活动');
    expect(cover).not.toContain('is-format');
  });

  it('moves overlay info into copy for left-image, likes on cover, no place', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard
        activity={{ ...openActivity, pinned: true }}
        layout="left-image"
        onOpen={() => undefined}
      />,
    );
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    const copy = html.slice(html.indexOf('c-list-copy'));
    expect(cover).not.toContain('置顶');
    expect(cover).not.toContain('c-cover-likes');
    expect(cover).not.toContain('进行中');
    expect(cover).not.toContain('文化');
    expect(cover).not.toContain('单次活动');
    expect(cover).not.toContain('c-cover-title');
    expect(copy).toContain('置顶');
    expect(copy).toContain('进行中');
    expect(copy).toContain('文化');
    expect(copy).toContain('单次活动');
    expect(copy).toContain('c-card-title');
    expect(copy).toContain('员工开放日');
    expect(copy.indexOf('c-card-title')).toBeLessThan(copy.indexOf('c-list-tags'));
    expect(copy).not.toContain('c-list-likes');
    expect(copy).not.toContain('c-home-quota-avatars');
    expect(copy).not.toContain('总部一号楼多功能厅');
    expect(copy).toContain('c-home-quota is-side');
    expect(copy).toContain('c-home-quota-inline');
    expect(copy.indexOf('c-home-quota-bar')).toBeLessThan(copy.indexOf('c-card-action'));
    expect(html).toContain('is-side');
    expect(html).toContain('is-contain');
    expect(html).toContain('is-left-image');
    expect(html).toContain('flex-direction:row');
    expect(html).toContain('flex:0 0 108px');
  });

  it('moves overlay info into copy for left-text the same way', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} layout="left-text" onOpen={() => undefined} />,
    );
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    const copy = html.slice(html.indexOf('c-list-copy'));
    expect(cover).not.toContain('置顶');
    expect(cover).not.toContain('c-cover-likes');
    expect(cover).not.toContain('进行中');
    expect(copy).toContain('进行中');
    expect(copy).toContain('c-card-title');
    expect(copy.indexOf('c-card-title')).toBeLessThan(copy.indexOf('c-list-tags'));
    expect(copy).not.toContain('总部一号楼多功能厅');
    expect(html).toContain('flex-direction:row-reverse');
  });

  it('puts status on the right and format after category in large-image layout', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} layout="large-image" onOpen={() => undefined} />,
    );
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    const start = cover.slice(0, cover.indexOf('c-cover-badges is-end'));
    const end = cover.slice(cover.indexOf('c-cover-badges is-end'));
    expect(start).toContain('文化');
    expect(start).toContain('单次活动');
    expect(start.indexOf('文化')).toBeLessThan(start.indexOf('单次活动'));
    expect(start).not.toContain('进行中');
    expect(end).toContain('进行中');
    expect(end).not.toContain('单次活动');
  });

  it('always renders fallback below an optional cover image', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} onOpen={() => undefined} />,
    );

    expect(html).toContain('c-cover-fallback');
    expect(html).toContain(`<img src="${openActivity.coverUrl}"`);
    expect(html.indexOf('c-cover-fallback')).toBeLessThan(html.indexOf('<img'));
    expect(html).toContain(
      'aria-label="员工开放日，文化，进行中，时间 04-12 09:00 ~ 04-12 17:00，地点 总部一号楼多功能厅，立即报名，已报名 3/50"',
    );
    expect(html).toContain('04-12 09:00 ~ 04-12 17:00');
    expect(html).toContain('地点 总部一号楼多功能厅');
  });

  it('puts pin first on the left, format on the right, likes at the bottom', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={{ ...openActivity, pinned: true }} onOpen={() => undefined} />,
    );
    const cover = html.slice(html.indexOf('c-cover'), html.indexOf('c-list-copy'));
    const start = cover.slice(0, cover.indexOf('c-cover-badges is-end'));
    expect(start.indexOf('置顶')).toBeLessThan(start.indexOf('进行中'));
    expect(start.indexOf('进行中')).toBeLessThan(start.indexOf('文化'));
    expect(start).not.toContain('单次活动');
    expect(cover.indexOf('c-cover-likes')).toBeGreaterThan(cover.indexOf('c-cover-title'));
    expect(cover).toContain('>3<');
  });

  it('announces signed-up state', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} signedUp onOpen={() => undefined} />,
    );

    expect(html).toContain(
      'aria-label="员工开放日，文化，进行中，时间 04-12 09:00 ~ 04-12 17:00，地点 总部一号楼多功能厅，已报名，已报名 3/50"',
    );
    expect(html).toContain('>已报名<');
  });
});

describe('past highlight covers', () => {
  it('matches large-image title size to activity cover titles', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    const ruleAfter = (selector: string) => {
      const idx = css.indexOf(selector);
      expect(idx, selector).toBeGreaterThan(-1);
      const start = css.indexOf('{', idx);
      return css.slice(start, css.indexOf('}', start));
    };
    const size = (block: string) => block.match(/font-size:\s*[^;]+/)?.[0];
    expect(size(ruleAfter('.c-h5-shell .c-h5-list.is-large-image .c-past-act-title'))).toBe(
      size(ruleAfter('.c-h5-shell .c-h5-list .c-cover-title')),
    );
    expect(size(ruleAfter('.c-pc-shell .c-pc-grid.is-large-image .c-past-act-title'))).toBe(
      size(ruleAfter('.c-pc-shell .c-pc-card .c-cover-title')),
    );
  });

  it('keeps H5 横向滑动 covers at a fixed width and native aspect', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    const rule = (selector: string) => {
      const idx = css.indexOf(selector);
      expect(idx, selector).toBeGreaterThan(-1);
      return css.slice(css.indexOf('{', idx), css.indexOf('}', css.indexOf('{', idx)));
    };
    expect(rule('.c-h5-list.is-scroll > li {')).toContain('flex: 0 0 168px');
    const cover = rule('.c-h5-list.is-scroll .c-list-cover:not(.is-side) {');
    expect(cover).toContain('aspect-ratio: auto');
    expect(cover).toContain('height: auto');
    expect(cover).not.toContain('3 / 4');
    const img = rule('.c-h5-list.is-scroll .c-cover img {');
    expect(img).toContain('position: relative');
    expect(img).toContain('z-index: 1');
    expect(img).toContain('width: 100%');
    expect(img).toContain('height: auto');
    expect(img).toContain('object-fit: contain');
    const fallback = rule('.c-h5-list.is-scroll .c-cover:has(img:not([hidden])) .c-cover-fallback {');
    expect(fallback).toContain('display: none');
  });

  it('letterboxes activity side covers', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    const start = css.indexOf('.c-h5-list.is-left-image .c-cover.is-side img');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(css.indexOf('{', start), css.indexOf('}', css.indexOf('{', start)));
    expect(block).toContain('object-fit: contain');
    expect(block).toContain('object-position: center');
  });

  it('matches activity side cover fill to past left-image media', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    const fill = (selector: string) => {
      const idx = css.indexOf(selector);
      expect(idx, selector).toBeGreaterThan(-1);
      const block = css.slice(css.indexOf('{', idx), css.indexOf('}', css.indexOf('{', idx)));
      return block.match(/background:\s*[^;]+/)?.[0];
    };
    expect(fill('.c-h5-list.is-left-image .c-cover.is-side,')).toBe(
      fill('.c-h5-list.is-left-image .c-past-act-media,'),
    );
  });

  it('marks rail and feed covers as uncropped', () => {
    const rail = renderToStaticMarkup(
      <PastActivityRailCard activity={openActivity} onOpen={() => undefined} />,
    );
    const feed = renderToStaticMarkup(
      <PastActivityFeedCard activity={openActivity} onOpen={() => undefined} />,
    );
    expect(rail).toContain('c-past-act-cover is-contain');
    expect(feed).toContain('c-cover c-list-cover is-contain');
  });

  it('uses a side media+copy layout for left-image past cards', () => {
    const html = renderToStaticMarkup(
      <PastActivityRailCard activity={openActivity} layout="left-image" onOpen={() => undefined} />,
    );
    expect(html).toContain('c-past-act is-left-image');
    expect(html).toContain('c-past-act-media');
    expect(html).toContain('c-past-act-copy');
    expect(html).toContain('c-past-act-title');
    expect(html.indexOf('c-past-act-title')).toBeLessThan(html.indexOf('c-past-act-badge'));
    expect(html).not.toContain('c-past-act-shade');
  });
});

describe('activity search row', () => {
  it('renders a compact title row with date and category', () => {
    const html = renderToStaticMarkup(
      <H5ActivitySearchRow activity={openActivity} onOpen={() => undefined} />,
    );

    expect(html).toContain('c-act-search-row');
    expect(html).toContain('员工开放日');
    expect(html).toContain('04-12 09:00 ~ 04-12 17:00');
    expect(html).toContain('文化');
    expect(html).toContain('进行中');
    expect(html).toContain('总部一号楼多功能厅');
    expect(html).not.toContain('c-h5-card-button');
    expect(html).not.toContain('c-home-quota-bar');
  });

  it('has compact search row layout styles', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toContain('.c-h5-shell .c-h5-search-sticky');
    const idx = css.indexOf('.c-act-search-row {');
    expect(idx).toBeGreaterThan(-1);
    const block = css.slice(css.indexOf('{', idx), css.indexOf('}', css.indexOf('{', idx)));
    expect(block).toContain('display: flex');
    expect(block).toContain('align-items: center');
  });

  it('shows live status, not only 已结束', () => {
    const basketball = initialActivities.find((item) => item.title === '周四篮球夜')!;
    const live = renderToStaticMarkup(
      <H5ActivitySearchRow activity={basketball} onOpen={() => undefined} />,
    );
    expect(live).toContain('周四篮球夜');
    expect(live).toContain(basketball.activityStatus);
    expect(live).toContain('体育');

    const ended = renderToStaticMarkup(
      <H5ActivitySearchRow
        activity={{ ...openActivity, activityStatus: '已结束' }}
        onOpen={() => undefined}
      />,
    );
    expect(ended).toContain('已结束');
  });
});

describe('H5 activity shell', () => {
  it('uses main for page content', () => {
    const html = renderToStaticMarkup(
      <H5ActivityShell title="活动">
        <p>内容</p>
      </H5ActivityShell>,
    );

    expect(html).toContain('<main class="c-h5-main">');
    expect(html).toContain('aria-hidden');
  });

  it('puts header actions on the right of the H5 top bar', () => {
    const html = renderToStaticMarkup(
      <H5ActivityShell title="活动" actions={<button type="button" aria-label="分享" />}>
        <p>内容</p>
      </H5ActivityShell>,
    );
    expect(html).toContain('aria-label="分享"');
    expect(html.indexOf('c-h5-title')).toBeLessThan(html.indexOf('aria-label="分享"'));
  });

  it('treats a supplied custom header as authoritative', () => {
    const html = renderToStaticMarkup(
      <H5ActivityShell header={null}>
        <p>内容</p>
      </H5ActivityShell>,
    );

    expect(html).not.toContain('c-h5-top');
  });
});
