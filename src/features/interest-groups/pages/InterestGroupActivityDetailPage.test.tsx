import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupActivityDetailPage } from './InterestGroupActivityDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupActivityDetailPage', () => {
  it('renders header and default detail tab', () => {
    const html = renderPage(
      <InterestGroupActivityDetailPage
        recordId="101"
        onBack={() => undefined}
        onEdit={() => undefined}
        onTabChange={() => undefined}
      />,
    );
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('详情');
    expect(html).not.toContain('活动描述');
    expect(html).toContain('活动信息');
    expect(html).toContain('活动详情');
    expect(html).toContain('封面图片');
    expect(html).toContain('活动标题');
    expect(html).toContain('创建时间');
    expect(html).toContain('发布时间');
    expect(html).toContain('activity-cover-preview');
    expect(html).toContain('rich-text-preview');
    expect(html).toContain('报名情况');
    expect(html).toContain('评论');
    expect(html).toContain('精彩瞬间');
    expect(html).toContain('审核状态');
    expect(html).toContain('发布状态');
    expect(html).toContain('已通过');
    expect(html).toContain('已发布');
    expect(html).toContain('activity-detail-cover');
    expect(html).toContain('周期活动');
    expect(html).not.toMatch(/ant-tag[^>]*>周期活动/);
  });
});
