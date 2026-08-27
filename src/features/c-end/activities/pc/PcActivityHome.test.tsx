import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialActivities } from '../../../activities/model/activity';
import { resetEngagement } from '../model/engagementStore';
import { filterByTab, PC_ACTIVITY_PREVIEW_LIMIT } from '../model/clientActivity';
import { loadDemoSignups, resetClientSignups } from '../model/signupStore';
import { PcActivityHome } from './PcActivityHome';

describe('PC activity home', () => {
  beforeEach(() => {
    resetClientSignups();
    resetEngagement();
  });

  afterEach(() => {
    resetClientSignups();
    resetEngagement();
  });

  it('does not render my-activities or my-favorites', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).not.toContain('c-pc-mine');
    expect(html).not.toContain('我的活动');
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
    expect(html).not.toContain('c-cover-type');
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
  });

  it('hides home and phone switches in the header', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    expect(html).not.toContain('回主页');
    expect(html).not.toContain('手机版');
  });

  it('filters the catalog by activity title', () => {
    const html = renderToStaticMarkup(<PcActivityHome initialQuery="训练营" />);

    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html.indexOf('c-catalog-title')).toBeLessThan(html.indexOf('value="训练营"'));
    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).toContain('value="训练营"');
    expect(html).toContain('新员工入职训练营');
    const catalog = html.slice(0, html.indexOf('往期精彩回顾'));
    expect(catalog).not.toContain('春季员工开放日');
  });

  it('shows the first six activities, five past moments, and a view-all entry', () => {
    const all = filterByTab(initialActivities, 'all');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const preview = all.slice(0, PC_ACTIVITY_PREVIEW_LIMIT);

    expect(html.match(/c-pc-card /g)).toHaveLength(preview.length);
    expect(preview).toHaveLength(6);
    expect(html).toContain('查看全部');
    expect(html).toContain('<h2 class="c-catalog-title">活动</h2>');
    expect(html).toContain('c-catalog-title-row');
    expect(html.indexOf('c-catalog-title')).toBeLessThan(html.indexOf('搜索活动名称'));
    expect(html.indexOf('搜索活动名称')).toBeLessThan(html.indexOf('活动分类'));
    expect(html.indexOf('活动分类')).toBeLessThan(html.indexOf('查看全部'));
    expect(html.indexOf('查看全部')).toBeLessThan(html.indexOf('aria-label="活动列表"'));
    expect(html).toContain('往期精彩回顾');
    expect(html).toContain('c-past-rail');
    expect(html.indexOf('aria-label="活动列表"')).toBeLessThan(html.indexOf('往期精彩回顾'));
    const past = html.slice(html.indexOf('往期精彩回顾'));
    expect((past.match(/c-past-card/g) ?? []).length).toBe(5);
    expect(past).toContain('c-past-copy');
    expect(past).toContain('查看全部');
    expect(past).toContain('午餐交流拍糊了');
    expect(past).toContain('开场致辞');
    expect(past).toContain('aria-label="共5张"');
    expect(past).toContain('aria-label="共4张"');
    expect(past).not.toContain('小组讨论花絮');
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
    expect(html).not.toContain('查看全部');
    expect(html).not.toContain('往期精彩回顾');
  });

  it('opens aggregated past moments from visible ended activities', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="past-moments" />);

    expect(html).toContain('<h1 class="c-pc-header-title">往期精彩回顾</h1>');
    expect(html).toContain('开场致辞');
    expect(html).toContain('春季员工开放日');
    expect(html).not.toContain('小组讨论花絮');
    expect((html.match(/c-moment-card/g) ?? []).length).toBeGreaterThan(3);
  });
});
