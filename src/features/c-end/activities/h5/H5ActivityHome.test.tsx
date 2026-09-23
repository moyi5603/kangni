import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialActivities } from '../../../activities/model/activity';
import { CEndEmptyPreviewProvider } from '../../portal/emptyPreview';
import { H5ActivityHome } from './H5ActivityHome';
import { filterByTab, HOME_ACTIVITY_PREVIEW_LIMIT } from '../model/clientActivity';
import { patchDecoBlock } from '../../../activities/model/activityDecoration';
import {
  getActivityDecoration,
  publishActivityDecoration,
  resetActivityDecoration,
  saveActivityDecoration,
} from '../../../activities/model/activityDecorationStore';
import { resetEngagement } from '../model/engagementStore';
import { loadDemoSignups, resetClientSignups } from '../model/signupStore';

describe('H5 activity home', () => {
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
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).toContain('<header class="c-h5-top">');
    expect(html).toContain('<h1 class="c-h5-title">员工活动</h1>');
    expect(html).not.toContain('c-h5-header-mine');
    expect(html).not.toContain('>我的活动</button>');
    expect(html).toContain('c-home-search-row');
    expect(html).toContain('c-home-mine-btn');
    expect(html).toContain('aria-label="我的活动"');
    expect(html.indexOf('aria-label="搜索活动名称"')).toBeLessThan(html.indexOf('aria-label="我的活动"'));
    expect(html).not.toContain('c-h5-mine');
    expect(html).not.toContain('我的收藏');
    expect(html).not.toContain('aria-label="我的活动与收藏"');
    expect(html).not.toContain('c-h5-signup-card');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
    const catalog = html.slice(html.indexOf('id="h5-activity-catalog"'));
    expect(catalog).not.toContain('c-home-mine-btn');
    expect(catalog).not.toContain('>我的活动</button>');
  });

  it('renders my-activities as an icon button beside search', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8');
    const idx = css.indexOf('.c-home-mine-btn');
    expect(idx).toBeGreaterThan(-1);
    expect(css).toContain('.c-home-search-row');
    expect(css).not.toContain('.c-h5-shell .c-h5-header-mine');
    const row = css.slice(css.indexOf('.c-home-search-row {'), css.indexOf('.c-home-search-row .c-h5-catalog-search'));
    expect(row).toContain('align-items: center');
    const mine = css.slice(css.indexOf('.c-home-mine-btn {'), css.indexOf('.c-home-mine-btn .c-icon'));
    expect(mine).toContain('box-sizing: border-box');
    expect(mine).toContain('height: 40px');
    expect(mine).toContain('width: 40px');
    expect(mine).not.toContain('aspect-ratio');
    const ico = css.slice(css.indexOf('.c-home-mine-btn .c-icon {'), css.indexOf('.c-pc-shell .c-home-search-row'));
    expect(ico).toContain('width: 16px');
    expect(ico).toContain('height: 16px');
  });

  it('does not render a separate signup rail that duplicates the catalog', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).not.toContain('正在报名');
    expect(html).not.toContain('c-h5-feature-strip');
    expect(html).not.toContain('aria-label="报名中活动"');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
  });

  it('does not show a floating home button', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).not.toContain('c-h5-detail-fab');
    expect(html).not.toContain('回主页');
    expect(html).not.toContain('返回上一页');
  });

  it('opens search on a secondary page instead of filtering the home catalog', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).not.toContain('type="search"');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('往期精彩回顾');
  });

  it('filters activities on the search page', () => {
    const html = renderToStaticMarkup(<H5ActivityHome variant="search" initialQuery="训练营" />);

    expect(html).toContain('<h1 class="c-h5-title">搜索</h1>');
    expect(html).toContain('c-h5-search-sticky');
    expect(html).toContain('c-act-searchbar');
    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html).toContain('type="search"');
    expect(html).toContain('value="训练营"');
    expect(html).toContain('c-act-search-row');
    expect(html).not.toContain('is-pc-2');
    expect(html).toContain('新员工入职训练营');
    expect(html).not.toContain('春季员工开放日');
    expect(html).not.toContain('c-h5-card-button');
    expect(html).not.toContain('往期精彩回顾');
    expect(html).not.toContain('回主页');
  });

  it('renders empty catalog copy when empty preview is on', () => {
    const html = renderToStaticMarkup(
      <CEndEmptyPreviewProvider empty>
        <H5ActivityHome />
      </CEndEmptyPreviewProvider>,
    );
    expect(html).toContain('暂无相关活动');
    expect(html).toContain('暂无已结束活动');
    expect(html).not.toContain('新员工入职训练营');
    expect(html).not.toContain('查看全部');
  });

  it('waits for a query instead of dumping the catalog', () => {
    const html = renderToStaticMarkup(<H5ActivityHome variant="search" />);

    expect(html).toContain('输入名称搜索活动');
    expect(html).toContain('c-act-searchbar');
    expect(html).not.toContain('c-act-search-row');
    expect(html).not.toContain('c-h5-card-button');
    expect(html).not.toContain('aria-label="活动列表"');
  });

  it('reports no matches for an unknown title', () => {
    const html = renderToStaticMarkup(<H5ActivityHome variant="search" initialQuery="不存在的活动" />);

    expect(html).toContain('没有匹配的活动');
    expect(html).toContain('value="不存在的活动"');
    expect(html).not.toContain('c-act-search-row');
    expect(html).not.toContain('未找到相关活动');
  });

  it('opens the search page from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="activity-search" />);
    expect(html).toContain('<h1 class="c-h5-title">搜索</h1>');
    expect(html).toContain('type="search"');
    expect(html).not.toContain('往期精彩回顾');
  });

  it('hides my-activities entry on search and full catalog', () => {
    const search = renderToStaticMarkup(<H5ActivityHome variant="search" />);
    const all = renderToStaticMarkup(<H5ActivityHome variant="all" />);

    expect(search).not.toContain('c-h5-header-mine');
    expect(search).not.toContain('c-home-mine-btn');
    expect(search).not.toContain('aria-label="我的活动"');
    expect(all).not.toContain('c-h5-header-mine');
    expect(all).not.toContain('c-home-mine-btn');
    expect(all).not.toContain('aria-label="我的活动"');
  });

  it('shows only the first three activities and a view-all entry', () => {
    const all = filterByTab(initialActivities, 'all');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const preview = all.slice(0, HOME_ACTIVITY_PREVIEW_LIMIT);

    expect(html.match(/c-h5-card-button/g)).toHaveLength(preview.length);
    expect(html).toContain('查看全部');
    expect(html).toContain('<h2 class="c-catalog-title">活动</h2>');
    expect(html.indexOf('c-catalog-title')).toBeLessThan(html.indexOf('活动分类'));
    expect(html.indexOf('活动分类')).toBeLessThan(html.indexOf('查看全部'));
    expect(html.indexOf('查看全部')).toBeLessThan(html.indexOf('aria-label="活动列表"'));
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('c-past-rail');
    expect(html.indexOf('aria-label="活动列表"')).toBeLessThan(html.indexOf('往期精彩回顾'));
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect((past.match(/c-past-act"/g) ?? []).length).toBe(5);
    expect(past).toContain('查看全部');
    expect(past).toContain('已结束');
    expect(past).toContain('入职体检专场');
    expect(past).toContain('数字化转型工作坊');
    expect(past).toContain('供应链协同攻关');
    expect(past).not.toContain('c-past-card');
    expect(past).not.toContain('午餐交流拍糊了');
    expect(past).not.toContain('开场致辞');
    expect(past).not.toContain('产线参观这一段');
    expect(past).not.toContain('质量改进项目启动');
    expect(past).not.toContain('春季员工开放日');
    preview.forEach((activity) => expect(html).toContain(activity.title));
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect(catalog).toContain('c-pill is-format');
    expect(catalog).toContain('单次活动');
    all.slice(HOME_ACTIVITY_PREVIEW_LIMIT).forEach((activity) => {
      expect(catalog).not.toContain(activity.title);
    });
  });

  it('opens the full catalog on the activity-list page', () => {
    const all = filterByTab(initialActivities, 'all');
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="activity-list" />);

    expect(html).toContain('<h1 class="c-h5-title">全部活动</h1>');
    expect(html).toContain('<h2 class="c-catalog-title">活动</h2>');
    expect(html.match(/c-h5-card-button/g)).toHaveLength(all.length);
    expect(html).not.toContain('查看全部');
    expect(html).not.toContain('往期精彩回顾');
    expect(html).not.toContain('c-h5-header-mine');
    expect(html).not.toContain('>我的活动</button>');
    all.forEach((activity) => expect(html).toContain(activity.title));
  });

  it('opens ended activities on the past-highlights page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="past-moments" />);

    expect(html).toContain('<h1 class="c-h5-title">往期精彩回顾</h1>');
    expect(html).toContain('入职体检专场');
    expect(html).toContain('数字化转型工作坊');
    expect(html).toContain('供应链协同攻关');
    expect(html).toContain('家庭日郊游');
    expect(html).toContain('高管体检预约');
    expect(html).toContain('质量改进项目启动');
    expect(html).toContain('司庆展览周');
    expect(html).toContain('春季员工开放日');
    expect(html).toContain('c-h5-list is-two-col');
    expect(html).toContain('c-past-act');
    expect(html).not.toContain('c-past-rail');
    expect(html).not.toContain('c-past-feed');
    expect(html).not.toContain('c-past-feed-card');
    expect(html).not.toContain('午餐交流拍糊了');
    expect(html).not.toContain('开场致辞');
    expect(html).not.toContain('查看全部');
    expect(html).not.toContain('c-moment-card');
    expect((html.match(/c-past-act"/g) ?? []).length).toBeGreaterThan(3);
    expect(html).not.toContain('c-h5-header-mine');
    expect(html).not.toContain('>我的活动</button>');
  });

  it('applies inspector list style to H5 before publish', () => {
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'left-image' }));
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).toContain('c-h5-list is-left-image');
    expect(html).toContain('is-side');
    expect(html).toContain('flex-direction:row');
  });

  it('applies published layout style after save', () => {
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'left-image' }));
    publishActivityDecoration('mobile');
    const home = renderToStaticMarkup(<H5ActivityHome />);
    const all = renderToStaticMarkup(<H5ActivityHome variant="all" />);
    expect(home).toContain('c-h5-list is-left-image');
    expect(home).toContain('is-side');
    expect(all).toContain('c-h5-list is-left-image');
    expect(all).toContain('is-side');
  });

  it('applies published left-text layout', () => {
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'left-text' }));
    publishActivityDecoration('mobile');
    const home = renderToStaticMarkup(<H5ActivityHome />);
    const all = renderToStaticMarkup(<H5ActivityHome variant="all" />);
    expect(home).toContain('c-h5-list is-left-text');
    expect(home).toContain('is-side');
    expect(all).toContain('c-h5-list is-left-text');
    expect(all).toContain('is-side');
  });

  it('shows 举办方式 on two-col C-end cards', () => {
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'two-col' }));
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).toContain('c-h5-list is-two-col');
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect(catalog).toContain('c-pill is-format');
    expect(catalog).toContain('单次活动');
  });

  it('shows enabled activity fields on H5 横向滑动 cards', () => {
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'scroll' }));
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).toContain('c-h5-list is-scroll');
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect(catalog).toContain('c-h5-card-button');
    expect(catalog).toContain('c-pill is-format');
    expect(catalog).toContain('单次活动');
    expect(catalog).toContain('c-pill is-category');
    expect(catalog).toContain('进行中');
    expect(catalog).toContain('c-cover-title');
    expect(catalog).toContain('c-cover-likes');
    expect(catalog).toContain('c-meta');
    expect(catalog).toContain('c-home-quota');
    expect(catalog).not.toContain('c-past-act');
  });

  it('hides 举办方式 on 横向滑动 when the field is off', () => {
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'scroll', showHoldMode: false }),
    );
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect(catalog).not.toContain('c-pill is-format');
    expect(catalog).not.toContain('单次活动');
  });

  it('hides 举办方式 on C-end when the field is off', () => {
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { showHoldMode: false }),
    );
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
    expect(catalog).not.toContain('c-pill is-format');
    expect(catalog).not.toContain('单次活动');
  });

  it('renders past highlights as side cards, not stacked large covers', () => {
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-moments', { listStyle: 'left-image' }));
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect(past).toContain('c-h5-list is-left-image');
    expect(past).toContain('c-past-act is-left-image');
    expect(past).toContain('c-past-act-media');
    expect(past).toContain('c-past-act-copy');
    expect(past).not.toContain('c-past-act-shade');
    saveActivityDecoration('mobile', patchDecoBlock(getActivityDecoration('mobile'), 'deco-moments', { listStyle: 'left-text' }));
    const flipped = renderToStaticMarkup(<H5ActivityHome />);
    const flippedPast = flipped.slice(flipped.indexOf('往期精彩回顾'));
    expect(flippedPast).toContain('c-h5-list is-left-text');
    expect(flippedPast).toContain('c-past-act is-left-text');
  });

  it('applies home moments style to the past-highlights page', () => {
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-moments', { listStyle: 'left-image' }),
    );
    saveActivityDecoration(
      'pc',
      patchDecoBlock(getActivityDecoration('pc'), 'deco-moments', { listStyle: 'left-text' }),
    );
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="past-moments" />);
    expect(html).toContain('c-h5-list is-left-image');
    expect(html).toContain('c-past-act is-left-image');
    expect(html).not.toContain('c-past-feed');
    expect(html).not.toContain('is-left-text');
  });

  it('turns home scroll past highlights into a two-col all list', () => {
    const home = renderToStaticMarkup(<H5ActivityHome />);
    expect(home).toContain('c-past-rail');
    const all = renderToStaticMarkup(<CEndApp surface="h5" h5Page="past-moments" />);
    expect(all).toContain('c-h5-list is-two-col');
    expect(all).not.toContain('c-past-rail');
  });

  it('does not render a decoration banner on the home preview by default', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).not.toContain('aria-label="轮播图"');
    expect(html).not.toContain('c-home-banner');
  });

  it('hides activity card fields from decoration toggles', () => {
    saveActivityDecoration(
      'mobile',
      patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', {
        showTitle: false,
        showLikes: false,
        showSignupButton: false,
      }),
    );
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).not.toContain('c-cover-title');
    expect(html).not.toContain('c-cover-likes');
    expect(html).not.toContain('c-card-action');
  });
});
