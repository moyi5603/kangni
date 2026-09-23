import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityCategoryListPage } from './ActivityCategoryListPage';

function renderPage() {
  return renderToStaticMarkup(
    <App>
      <ActivityCategoryListPage />
    </App>,
  );
}

describe('ActivityCategoryListPage', () => {
  it('aligns with interest-group category list: sort, usage, move, inline actions', () => {
    const html = renderPage();
    expect(html).toContain('分类管理');
    expect(html).toContain('文化');
    expect(html).toContain('新建分类');
    expect(html).toContain('排序');
    expect(html).toContain('活动数');
    expect(html).toContain('上移');
    expect(html).toContain('下移');
    expect(html).toContain('编辑');
    expect(html).toContain('禁用');
    expect(html).toContain('删除');
    expect(html).not.toContain('更多操作');
    expect(html).not.toContain('aria-label="编辑 ');
    expect(html.match(/共 \d+ 条/g)?.length).toBe(1);
  });
});
