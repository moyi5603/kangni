import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupCommentListPage } from './InterestGroupCommentListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupCommentListPage', () => {
  it('renders activity-style comment columns and seed', () => {
    const html = renderPage(<InterestGroupCommentListPage activityId={101} />);
    expect(html).toContain('评论内容');
    expect(html).toContain('评论人');
    expect(html).toContain('配速');
    expect(html).toContain('删除');
    expect(html).not.toContain('点赞');
  });
});
