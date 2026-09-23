import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialActivities } from '../../../activities/model/activity';
import { patchDecoBlock } from '../../../activities/model/activityDecoration';
import {
  getActivityDecoration,
  publishActivityDecoration,
  resetActivityDecoration,
  saveActivityDecoration,
} from '../../../activities/model/activityDecorationStore';
import { resetEngagement } from '../model/engagementStore';
import { filterByTab, PC_ACTIVITY_PREVIEW_LIMIT } from '../model/clientActivity';
import { loadDemoSignups, resetClientSignups } from '../model/signupStore';
import { CEndEmptyPreviewProvider } from '../../portal/emptyPreview';
import { PcActivityHome } from './PcActivityHome';

describe('PC activity home', () => {
  beforeEach(() => {
    resetActivityDecoration();
    resetClientSignups();
    resetEngagement();
  });

  afterEach(() => {
    resetActivityDecoration();
    resetClientSignups();
    resetEngagement();
  });

  it('puts my-activities icon next to search, not in the header', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('<h1 class="c-pc-header-title">活动</h1>');
    expect(html).not.toContain('c-pc-header-actions');
    expect(html).not.toContain('c-pc-header-mine');
    expect(html).not.toContain('>我的活动</button>');
    expect(html).toContain('c-home-search-row');
    expect(html).toContain('c-home-mine-btn');
    expect(html).toContain('aria-label="我的活动"');
    expect(html.indexOf('aria-label="搜索活动名称"')).toBeLessThan(html.indexOf('aria-label="我的活动"'));
    expect(html.indexOf('c-home-search-row')).toBeLessThan(html.indexOf('id="pc-activity-catalog"'));
    expect(html).not.toContain('c-pc-mine');
    expect(html).not.toContain('我的收藏');
    expect(html).not.toContain('aria-label="我的活动与收藏"');
    expect(html).not.toContain('c-pc-signup-card');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
    const card = html.slice(html.indexOf('c-pc-card'), html.indexOf('c-pc-card-body'));
    expect(card).toContain('c-cover-badges');
    expect(card).toContain('c-cover-badges is-end');
    expect(card).toContain('c-cover-title');
    expect(card).toContain('c-cover-likes');
    expect(card.indexOf('c-cover-badges')).toBeLessThan(card.indexOf('c-cover-title'));
    expect(card).toContain('c-pill is-format');
    expect(card).toContain('单次活动');
    expect(html).not.toContain('c-cover-type');
    expect(html).not.toContain('aria-label="轮播图"');
    expect(html).not.toContain('c-home-banner');
    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));

    expect(html).not.toContain('报名中活动');
    expect(html).not.toContain('c-hero-carousel');
    expect(catalog).not.toContain('c-social');
    expect(catalog).not.toContain('aria-label="收藏"');
    expect(catalog).not.toContain('评论');
    expect(catalog).toContain('c-home-quota-bar');
    expect(catalog).toContain('已报名');
    expect(catalog).toContain('余');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
    expect(catalog).not.toContain('>我的活动</button>');
  });

  it('hides home and phone switches in the header', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    expect(html).not.toContain('回主页');
    expect(html).not.toContain('手机版');
  });

  it('opens search on a secondary page instead of filtering the home catalog', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).not.toContain('type="search"');
    expect(html).toContain('新员工入职训练营');
    expect(html).toContain('往期精彩回顾');
  });

  it('filters activities on the search page', () => {
    const html = renderToStaticMarkup(<PcActivityHome variant="search" initialQuery="训练营" />);

    expect(html).toContain('<h1 class="c-pc-header-title">搜索</h1>');
    expect(html).toContain('c-act-searchbar');
    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html).toContain('type="search"');
    expect(html).toContain('value="训练营"');
    expect(html).toContain('c-act-search-row');
    expect(html).toContain('c-act-search-list is-pc-2');
    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('c-pc-grid');
    expect(html).not.toContain('<h2 class="c-catalog-title">搜索活动</h2>');
    expect(html).not.toContain('往期精彩回顾');
  });

  it('waits for a query instead of dumping the catalog', () => {
    const html = renderToStaticMarkup(<PcActivityHome variant="search" />);

    expect(html).toContain('输入名称搜索活动');
    expect(html).toContain('c-act-searchbar');
    expect(html).not.toContain('c-act-search-row');
    expect(html).not.toContain('c-pc-grid');
  });

  it('hides view-all on empty preview', () => {
    const html = renderToStaticMarkup(
      <CEndEmptyPreviewProvider empty>
        <PcActivityHome />
      </CEndEmptyPreviewProvider>,
    );
    expect(html).toContain('暂无相关活动');
    expect(html).not.toContain('查看全部');
  });

  it('opens the search page from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="activity-search" />);
    expect(html).toContain('<h1 class="c-pc-header-title">搜索</h1>');
    expect(html).toContain('type="search"');
  });

  it('hides my-activities entry on search and full catalog', () => {
    const search = renderToStaticMarkup(<PcActivityHome variant="search" />);
    const all = renderToStaticMarkup(<PcActivityHome variant="all" />);

    expect(search).not.toContain('c-pc-header-mine');
    expect(search).not.toContain('c-home-mine-btn');
    expect(search).not.toContain('aria-label="我的活动"');
    expect(all).not.toContain('c-pc-header-mine');
    expect(all).not.toContain('c-home-mine-btn');
    expect(all).not.toContain('aria-label="我的活动"');
  });

  it('shows the first six activities, four past ended activities, and a view-all entry', async () => {
    const all = filterByTab(initialActivities, 'all');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const preview = all.slice(0, PC_ACTIVITY_PREVIEW_LIMIT);

    expect(html.match(/c-pc-card /g)).toHaveLength(preview.length);
    expect(preview).toHaveLength(6);
    expect(html).toContain('查看全部');
    expect(html).toContain('<h2 class="c-catalog-title">活动</h2>');
    expect(html).toContain('c-catalog-title-row');
    expect(html.indexOf('搜索活动名称')).toBeLessThan(html.indexOf('c-catalog-title'));
    expect(html.indexOf('c-pc-catalog-search')).toBeLessThan(html.indexOf('c-catalog-title-row'));
    expect(html.indexOf('搜索活动名称')).toBeLessThan(html.indexOf('活动分类'));
    expect(html.indexOf('活动分类')).toBeLessThan(html.indexOf('查看全部'));
    expect(html.indexOf('查看全部')).toBeLessThan(html.indexOf('aria-label="活动列表"'));
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    const idx = css.indexOf('.c-pc-catalog-search {');
    expect(idx).toBeGreaterThan(-1);
    const searchCss = css.slice(css.indexOf('{', idx), css.indexOf('}', css.indexOf('{', idx)));
    expect(searchCss).toContain('max-width: none');
    expect(searchCss).not.toContain('max-width: 280px');
    expect(css).not.toContain('.c-catalog-title-row .c-pc-catalog-search');
    expect(html.indexOf('活动分类')).toBeLessThan(html.indexOf('查看全部'));
    expect(html.indexOf('查看全部')).toBeLessThan(html.indexOf('aria-label="活动列表"'));
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('c-pc-grid is-large-image is-cols-3');
    expect(html).toContain('c-pc-grid is-large-image is-cols-4');
    expect(html).not.toContain('c-past-rail');
    expect(html.indexOf('aria-label="活动列表"')).toBeLessThan(html.indexOf('往期精彩回顾'));
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect((past.match(/c-past-act"/g) ?? []).length).toBe(4);
    expect(past).toContain('查看全部');
    expect(past).toContain('已结束');
    expect(past).toContain('入职体检专场');
    expect(past).toContain('数字化转型工作坊');
    expect(past).toContain('供应链协同攻关');
    expect(past).toContain('家庭日郊游');
    expect(past).not.toContain('高管体检预约');
    expect(past).not.toContain('c-past-card');
    expect(past).not.toContain('c-past-copy');
    expect(past).not.toContain('午餐交流拍糊了');
    expect(past).not.toContain('开场致辞');
    expect(past).not.toContain('职业健康复查');
    expect(past).not.toContain('质量改进项目启动');
    expect(past).not.toContain('司庆展览周');
    preview.forEach((activity) => expect(html).toContain(activity.title));
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    all.slice(PC_ACTIVITY_PREVIEW_LIMIT).forEach((activity) => {
      expect(catalog).not.toContain(activity.title);
    });
  });

  it('opens the full catalog on the activity-list page', () => {
    const all = filterByTab(initialActivities, 'all');
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="activity-list" />);

    expect(html).toContain('<h1 class="c-pc-header-title">全部活动</h1>');
    expect(html.match(/c-pc-card /g)).toHaveLength(all.length);
    expect(html.indexOf('c-pc-catalog-search')).toBeLessThan(html.indexOf('c-catalog-title-row'));
    expect(html).not.toContain('查看全部');
    expect(html).not.toContain('往期精彩回顾');
    expect(html).not.toContain('c-pc-header-mine');
    expect(html).not.toContain('>我的活动</button>');
  });

  it('opens ended activities on the past-highlights page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="past-moments" />);

    expect(html).toContain('<h1 class="c-pc-header-title">往期精彩回顾</h1>');
    expect(html).toContain('供应链协同攻关');
    expect(html).toContain('春季员工开放日');
    expect(html).toContain('c-pc-grid is-large-image is-cols-4');
    expect(html).toContain('c-past-act');
    expect(html).not.toContain('c-past-feed');
    expect(html).not.toContain('c-past-feed-card');
    expect(html).not.toContain('开场致辞');
    expect(html).not.toContain('c-moment-card');
    expect((html.match(/c-past-act"/g) ?? []).length).toBeGreaterThan(3);
    expect(html).not.toContain('c-pc-header-mine');
    expect(html).not.toContain('>我的活动</button>');
  });

  it('applies inspector list style to PC before publish', () => {
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-activity', { listStyle: 'left-image' }),
    );
    const html = renderToStaticMarkup(<PcActivityHome />);
    expect(html).toContain('c-pc-grid is-left-image');
    expect(html).toContain('is-side');
    expect(html).toContain('c-pc-card c-card-btn is-left-image');
  });

  it('applies PC column count to C-end activity grid', () => {
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-activity', { listStyle: 'large-image', columnCount: 4 }),
    );
    const html = renderToStaticMarkup(<PcActivityHome />);
    expect(html).toContain('c-pc-grid is-large-image is-cols-4');
  });

  it('applies published PC layout style after save', () => {
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-activity', { listStyle: 'left-image' }),
    );
    publishActivityDecoration('pc');
    const home = renderToStaticMarkup(<PcActivityHome />);
    const all = renderToStaticMarkup(<PcActivityHome variant="all" />);
    expect(home).toContain('c-pc-grid is-left-image');
    expect(home).toContain('is-side');
    expect(all).toContain('c-pc-grid is-left-image');
    expect(all).toContain('is-side');
  });

  it('applies published PC left-text layout', () => {
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-activity', { listStyle: 'left-text' }),
    );
    publishActivityDecoration('pc');
    const home = renderToStaticMarkup(<PcActivityHome />);
    const all = renderToStaticMarkup(<PcActivityHome variant="all" />);
    expect(home).toContain('c-pc-grid is-left-text');
    expect(all).toContain('c-pc-grid is-left-text');
  });

  it('renders PC past highlights from decoration, not the mobile list style', async () => {
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-moments', { listStyle: 'left-image', columnCount: 2 }),
    );
    const html = renderToStaticMarkup(<PcActivityHome />);
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect(past).toContain('c-pc-grid is-left-image is-cols-2');
    expect(past).toContain('c-past-act is-left-image');
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    expect(css).toContain('.c-pc-grid.is-cols-2');
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-moments', { listStyle: 'left-text' }),
    );
    const still = renderToStaticMarkup(<PcActivityHome />);
    const stillPast = still.slice(still.indexOf('往期精彩回顾'));
    expect(stillPast).toContain('c-pc-grid is-left-image');
    expect(stillPast).not.toContain('c-pc-grid is-left-text');
  });

  it('applies home moments style to the past-highlights page', () => {
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-moments', { listStyle: 'left-image' }),
    );
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-moments', { listStyle: 'left-text' }),
    );
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="past-moments" />);
    expect(html).toContain('c-pc-grid is-left-image');
    expect(html).toContain('c-past-act is-left-image');
    expect(html).toContain('c-past-sec');
    expect(html).not.toContain('c-past-feed');
    expect(html).not.toContain('c-pc-grid is-left-text');
  });
});
