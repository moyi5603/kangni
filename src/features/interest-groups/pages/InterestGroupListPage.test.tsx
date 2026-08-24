import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupListPage } from './InterestGroupListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupListPage', () => {
  it('renders list heading and seed groups', () => {
    const html = renderPage(<InterestGroupListPage onNavigate={() => undefined} />);
    expect(html).toContain('小组管理');
    expect(html).toContain('城市夜跑团');
    expect(html).toContain('周末徒步野行');
    expect(html).toContain('新建小组');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
  });
});
