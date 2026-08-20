import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import { H5ActivityHome } from './H5ActivityHome';
import { resetEngagement, toggleFavorite } from '../model/engagementStore';
import { loadDemoSignups, resetClientSignups, submitSignup } from '../model/signupStore';

function clearSeedFavorites() {
  toggleFavorite(2);
  toggleFavorite(9);
}

function mineHtml(html: string) {
  const start = html.indexOf('c-h5-mine');
  const catalog = html.indexOf('id="h5-activity-catalog"');
  return html.slice(start, catalog);
}

describe('H5 activity home', () => {
  beforeEach(() => {
    resetClientSignups();
    resetEngagement();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
    resetEngagement();
  });

  it('hides the mine block when there are no signups and no favorites', () => {
    clearSeedFavorites();
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).toContain('<header class="c-h5-top">');
    expect(html).toContain('<h1 class="c-h5-title">员工活动</h1>');
    expect(html).not.toContain('c-h5-portal-head');
    expect(html).not.toContain('c-h5-mine');
    expect(html).not.toContain('还没有报名活动');
    expect(html).not.toContain('去看看活动');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
  });

  it('does not render a separate signup rail that duplicates the catalog', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).not.toContain('正在报名');
    expect(html).not.toContain('c-h5-feature-strip');
    expect(html).not.toContain('aria-label="报名中活动"');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
    expect(html).toContain('aria-label="活动列表"');
  });

  it('shows only my-favorites when seed favorites exist and signups are empty', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);
    const mineIndex = html.indexOf('c-h5-mine');
    const catalogIndex = html.indexOf('id="h5-activity-catalog"');

    expect(mineIndex).toBeGreaterThan(html.indexOf('<main'));
    expect(mineIndex).toBeLessThan(catalogIndex);
    expect(mine).toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).toContain('查看全部');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).not.toContain('role="tablist"');
    expect(mine).not.toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(html).not.toContain('还没有报名活动');
    expect(html).not.toContain('去看看活动');
    expect(html.slice(catalogIndex)).toContain('c-social');
  });

  it('previews up to two upcoming signups without a view-all link', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect((html.match(/class="c-h5-signup-card /g) ?? []).length).toBe(1);
    expect(mine).toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('培训中心 3 楼');
    expect(mine).not.toContain('查看全部');
    expect(mine).not.toContain('role="tablist"');
    expect(mine).not.toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(html).not.toContain('还没有报名活动');
  });

  it('shows view-all when upcoming signups exceed the home preview limit', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(submitSignup(6, '个人报名')).toBe('ok');
    expect(submitSignup(9, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('查看全部');
    expect((html.match(/class="c-h5-signup-card /g) ?? []).length).toBe(2);
  });

  it('keeps ended signups off the home preview and points to the full list', () => {
    clearSeedFavorites();
    expect(submitSignup(1, '个人报名')).toBe('ok');
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 1 && item.phone === '13800001111'
          ? { ...item, status: '已通过' }
          : item,
      ),
    );
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect(html.indexOf('c-h5-mine')).toBeGreaterThan(-1);
    expect(mine).toContain('查看全部');
    expect(mine).toContain('暂无待参加活动');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('c-h5-signup-card');
  });

  it('shows a square cover on my-activity preview cards', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);
    const onboard = initialActivities.find((activity) => activity.id === 2)!;

    expect(mine).toContain('c-signup-thumb');
    expect(mine).toContain(`src="${onboard.coverUrl}"`);
    expect(mine).toContain('c-cover-fallback');
    expect(mine).not.toContain('c-cover-type');
  });

  it('previews demo upcoming cards with tabs defaulting to signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('aria-label="我的活动与收藏"');
    expect(mine).toContain('>我的活动</button>');
    expect(mine).toContain('>我的收藏</button>');
    expect(mine).not.toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(mine).not.toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('年度体检安排');
    expect(mine).toContain('进行中');
    expect(mine).toContain('已通过');
    expect(mine).toContain('未开始');
    expect(mine).toContain('待审核');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('中秋员工晚会');
    expect(mine).not.toContain('还没有报名活动');

    const catalog = html.slice(html.indexOf('id="h5-activity-catalog"'));
    expect(catalog).not.toContain('c-signup-status-row');
    expect(catalog).not.toContain('is-audit-');
  });

  it('shows favorite preview when initialMineTab is favorites', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5ActivityHome initialMineTab="favorites" />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('>我的活动</button>');
    expect(mine).toContain('>我的收藏</button>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).toContain('查看全部');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('进行中');
    expect(mine).not.toContain('年度体检安排');
    expect(mine).not.toContain('is-audit-');
  });
});
