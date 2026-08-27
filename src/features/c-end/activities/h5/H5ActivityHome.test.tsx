import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { initialActivities } from '../../../activities/model/activity';
import { H5ActivityHome } from './H5ActivityHome';
import { filterByTab, HOME_ACTIVITY_PREVIEW_LIMIT } from '../model/clientActivity';
import { resetEngagement } from '../model/engagementStore';
import { loadDemoSignups, resetClientSignups } from '../model/signupStore';

describe('H5 activity home', () => {
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
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).toContain('<header class="c-h5-top">');
    expect(html).toContain('<h1 class="c-h5-title">员工活动</h1>');
    expect(html).not.toContain('c-h5-mine');
    expect(html).not.toContain('我的活动');
    expect(html).not.toContain('我的收藏');
    expect(html).not.toContain('aria-label="我的活动与收藏"');
    expect(html).not.toContain('c-h5-signup-card');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
  });

  it('does not render a separate signup rail that duplicates the catalog', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).not.toContain('正在报名');
    expect(html).not.toContain('c-h5-feature-strip');
    expect(html).not.toContain('aria-label="报名中活动"');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
  });

  it('shows a floating home button', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);
    expect(html).toContain('c-h5-detail-fab');
    expect(html).toContain('回主页');
    expect(html).not.toContain('返回上一页');
  });

  it('filters the catalog by activity title', () => {
    const html = renderToStaticMarkup(<H5ActivityHome initialQuery="训练营" />);

    expect(html).toContain('placeholder="搜索活动名称"');
    expect(html).toContain('aria-label="搜索活动名称"');
    expect(html).toContain('value="训练营"');
    expect(html).toContain('新员工入职训练营');
    const catalog = html.slice(0, html.indexOf('往期精彩回顾'));
    expect(catalog).not.toContain('春季员工开放日');
  });

  it('reports no matches for an unknown title', () => {
    const html = renderToStaticMarkup(<H5ActivityHome initialQuery="不存在的活动" />);

    expect(html).toContain('未找到相关活动');
    expect(html).toContain('value="不存在的活动"');
    expect(html).not.toContain('aria-label="活动列表"');
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
    expect((past.match(/c-past-card/g) ?? []).length).toBe(3);
    expect(past).toContain('查看全部');
    expect(past).toContain('查看大图');
    expect(past).toContain('播放视频');
    expect(past).toContain('c-moment-grid is-1');
    expect(past).toContain('c-moment-video-poster');
    expect(past).not.toContain('c-past-cover');
    expect(past).toContain('午餐交流拍糊了');
    expect(past).toContain('aria-label="共5张"');
    expect(past).not.toContain('aria-label="共1张"');
    expect(past).toContain('产线参观这一段');
    expect(past).toContain('互动问答回放');
    expect(past).toContain('/activities/onboarding.jpg');
    expect(past).toContain('/activities/open-day.jpg');
    expect(past).not.toContain('开场致辞');
    expect(past).not.toContain('小组讨论花絮');
    expect(past).not.toContain('basketball.jpg');
    preview.forEach((activity) => expect(html).toContain(activity.title));
    const catalog = html.slice(html.indexOf('aria-label="活动列表"'), html.indexOf('往期精彩回顾'));
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
    all.forEach((activity) => expect(html).toContain(activity.title));
  });

  it('opens aggregated past moments from visible ended activities', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="past-moments" />);

    expect(html).toContain('<h1 class="c-h5-title">往期精彩回顾</h1>');
    expect(html).toContain('开场致辞');
    expect(html).toContain('午餐交流拍糊了');
    expect(html).toContain('产线参观这一段');
    expect(html).toContain('互动问答回放');
    expect(html).toContain('basketball.jpg');
    expect(html).toContain('春季员工开放日');
    expect(html).not.toContain('小组讨论花絮');
    expect(html).not.toContain('查看全部');
    expect((html.match(/c-moment-card/g) ?? []).length).toBeGreaterThan(3);
  });
});
