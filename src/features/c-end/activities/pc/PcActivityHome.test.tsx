import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import { resetEngagement, toggleFavorite } from '../model/engagementStore';
import { loadDemoSignups, resetClientSignups, submitSignup } from '../model/signupStore';
import { PcActivityHome } from './PcActivityHome';

function clearSeedFavorites() {
  toggleFavorite(2);
  toggleFavorite(9);
}

function mineHtml(html: string) {
  const start = html.indexOf('c-pc-mine');
  const catalog = html.indexOf('id="pc-activity-catalog"');
  return html.slice(start, catalog);
}

describe('PC activity home', () => {
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
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).not.toContain('c-pc-mine');
    expect(html).not.toContain('还没有报名活动');
    expect(html).not.toContain('去看看活动');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
  });

  it('does not render the featured signup rail', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));

    expect(html).not.toContain('报名中活动');
    expect(html).not.toContain('c-hero-carousel');
    expect(catalog).toContain('c-social');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
  });

  it('shows only my-favorites when seed favorites exist and signups are empty', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);
    const mineIndex = html.indexOf('c-pc-mine');
    const catalogIndex = html.indexOf('id="pc-activity-catalog"');

    expect(mineIndex).toBeGreaterThan(-1);
    expect(mineIndex).toBeLessThan(catalogIndex);
    expect(mine).toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).toContain('查看全部');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).not.toContain('role="tablist"');
    expect(mine).not.toContain('<h2 class="c-section-title">我的活动</h2>');
  });

  it('previews up to two upcoming signups without a view-all link', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect((html.match(/class="c-pc-signup-card /g) ?? []).length).toBe(1);
    expect(mine).toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('培训中心 3 楼');
    expect(mine).not.toContain('查看全部');
    expect(mine).not.toContain('role="tablist"');
  });

  it('shows view-all when upcoming signups exceed the home preview limit', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(submitSignup(6, '个人报名')).toBe('ok');
    expect(submitSignup(9, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('查看全部');
    expect((html.match(/class="c-pc-signup-card /g) ?? []).length).toBe(2);
  });

  it('keeps ended signups off the home preview', () => {
    clearSeedFavorites();
    expect(submitSignup(1, '个人报名')).toBe('ok');
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 1 && item.phone === '13800001111'
          ? { ...item, status: '已通过' }
          : item,
      ),
    );
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('查看全部');
    expect(mine).toContain('暂无待参加活动');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('c-pc-signup-card');
  });

  it('shows a square cover on my-activity preview cards', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);
    const onboard = initialActivities.find((activity) => activity.id === 2)!;

    expect(mine).toContain('c-signup-thumb');
    expect(mine).toContain(`src="${onboard.coverUrl}"`);
    expect(mine).toContain('c-cover-fallback');
    expect(mine).not.toContain('c-cover-type');
  });

  it('previews demo upcoming cards with tabs defaulting to signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('aria-label="我的活动与收藏"');
    expect(mine).toContain('>我的活动</button>');
    expect(mine).toContain('>我的收藏</button>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('年度体检安排');
    expect(mine).toContain('进行中');
    expect(mine).toContain('已通过');
    expect(mine).toContain('未开始');
    expect(mine).toContain('待审核');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('中秋员工晚会');

    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));
    expect(catalog).not.toContain('c-signup-status-row');
    expect(catalog).not.toContain('is-audit-');
  });

  it('shows favorite preview when initialMineTab is favorites', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome initialMineTab="favorites" />);
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
