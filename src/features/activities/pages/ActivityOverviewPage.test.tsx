import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityOverviewPage } from './ActivityOverviewPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('ActivityOverviewPage', () => {
  it('shows dashboard metrics and charts', () => {
    const html = renderPage(<ActivityOverviewPage onNavigate={() => undefined} />);

    expect(html).toContain('概览');
    expect(html).toContain('待审核活动');
    expect(html).toContain('总报名人数');
    expect(html).toContain('活动状态分布');
    expect(html).toContain('活动分类分布');
    expect(html).toContain('overview-pie');
    expect((html.match(/class="overview-pie"/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(html).toContain('>日<');
    expect(html).toContain('>月<');
    expect(html).not.toContain('报名状态构成');
    expect(html).not.toContain('发布与名额');
    expect(html).not.toContain('overview-segment-bar');
    expect(html).not.toContain('发布率');
    expect(html).not.toContain('全局名额使用率');
    expect(html).not.toContain('其他指标');
    expect(html).toContain('待办关注');
    expect(html).toContain('活动待审核');
    expect(html).toContain('线上公益讲座');
    expect(html).toContain('进行中的活动');
    expect(html).not.toContain('报名中的活动');
    expect(html).not.toContain('报名截止时间');
  });
});
