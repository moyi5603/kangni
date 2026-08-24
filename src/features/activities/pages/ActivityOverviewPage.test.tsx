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
    expect(html).toContain('报名状态构成');
    expect(html).toContain('发布与名额');
    expect(html).toContain('其他指标');
    expect(html).toContain('待办关注');
    expect(html).toContain('报名中的活动');
    expect(html).toContain('overview-segment-bar');
  });
});
