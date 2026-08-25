import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { H5ActivityHome } from './H5ActivityHome';
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
});
