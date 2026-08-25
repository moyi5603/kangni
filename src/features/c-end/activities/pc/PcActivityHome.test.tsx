import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resetEngagement } from '../model/engagementStore';
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
  });

  it('does not render the featured signup rail', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));

    expect(html).not.toContain('报名中活动');
    expect(html).not.toContain('c-hero-carousel');
    expect(catalog).toContain('c-social');
    expect(html).not.toContain('发现活动');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
  });

  it('hides home and phone switches in the header', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    expect(html).not.toContain('回主页');
    expect(html).not.toContain('手机版');
  });
});
