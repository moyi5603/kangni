import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupMomentListPage } from './InterestGroupMomentListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupMomentListPage', () => {
  it('renders activity-style columns and seed moment', () => {
    const html = renderPage(<InterestGroupMomentListPage activityId={102} />);
    expect(html).toContain('内容');
    expect(html).toContain('提交人');
    expect(html).toContain('已通过');
    expect(html).toContain('初夏漫步打卡');
    expect(html).toContain('详情');
  });
});
