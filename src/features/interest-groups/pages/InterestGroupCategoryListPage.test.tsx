import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupCategoryListPage } from './InterestGroupCategoryListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupCategoryListPage', () => {
  it('renders heading and seed categories without icon or color fields', () => {
    const html = renderPage(<InterestGroupCategoryListPage />);
    expect(html).toContain('分类管理');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
    expect(html).toContain('新建分类');
    expect(html).toContain('排序');
    expect(html).not.toContain('图标');
    expect(html).not.toContain('颜色');
  });
});
