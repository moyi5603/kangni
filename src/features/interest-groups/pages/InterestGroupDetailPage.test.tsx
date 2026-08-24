import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupDetailPage } from './InterestGroupDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupDetailPage', () => {
  it('renders group header and tabs', () => {
    const html = renderPage(
      <InterestGroupDetailPage
        recordId="1"
        onBack={() => undefined}
        onNavigate={() => undefined}
        onTabChange={() => undefined}
      />,
    );
    expect(html).toContain('城市夜跑团');
    expect(html).toContain('成员');
    expect(html).toContain('评论');
    expect(html).toContain('精彩瞬间');
    expect(html).toContain('活动名称');
    expect(html).toContain('详情');
    expect(html).toContain('AI 策划');
    expect(html).toContain('新建活动');
    expect(html).toContain('activity-detail-cover');
  });
});
