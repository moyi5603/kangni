import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AwardDetailPage } from './AwardDetailPage';

function render(recordId = '2', tab?: string) {
  return renderToStaticMarkup(
    <App>
      <AwardDetailPage recordId={recordId} tab={tab} onBack={() => undefined} onEdit={() => undefined} />
    </App>,
  );
}

describe('AwardDetailPage', () => {
  it('aligns detail groups with the create form', () => {
    const html = render();
    expect(html).toContain('基础信息');
    expect(html).toContain('评优活动名称');
    expect(html).toContain('评优类型');
    expect(html).toContain('活动简介');
    expect(html).toContain('评优标准');
    expect(html).toContain('名次奖励');
    expect(html).toContain('可见范围');
    expect(html).toContain('提名人');
    expect(html).toContain('提名范围');
    expect(html).toContain('结束后自动公示');
    expect(html).toContain('Q3 团队协同奖');
    expect(html).not.toContain('提名名单与审核后续补充');
  });

  it('exposes nomination and comment tabs', () => {
    const html = render();
    expect(html).toContain('提名');
    expect(html).toContain('评论');
  });

  it('shows nomination fields on the nomination tab', () => {
    const html = render('2', 'nominations');
    expect(html).toContain('提名标题');
    expect(html).toContain('提名人');
    expect(html).toContain('提名名单');
    expect(html).toContain('推荐理由');
    expect(html).toContain('核心亮点');
    expect(html).toContain('研发协同突击队');
    expect(html).toContain('展开');
    expect(html).toContain('请输入提名标题');
    expect(html).toContain('请输入提名人');
    expect(html).toContain('王芳');
    expect(html).toContain('后端组');
  });

  it('shows a comment placeholder', () => {
    const html = render('2', 'comments');
    expect(html).toContain('评论功能后续补充');
  });
});
