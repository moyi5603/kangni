import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaperDetailPage } from './PaperDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('PaperDetailPage', () => {
  it('shows grouped paper fields aligned with the edit form', () => {
    const html = renderPage(
      <PaperDetailPage recordId="1" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('数据合规基础测评');
    expect(html).toContain('详情');
    expect(html).toContain('基本信息');
    expect(html).toContain('题目设置');
    expect(html).toContain('试卷名称');
    expect(html).toContain('试卷描述');
    expect(html).toContain('所属分类');
    expect(html).toContain('出题方式');
    expect(html).toContain('选题方式');
    expect(html).toContain('按题库抽题');
    expect(html).toContain('题库');
    expect(html).toContain('可用');
    expect(html).toContain('题型分数');
    expect(html).toContain('每题分数');
    expect(html).toContain('单选初级出题数');
    expect(html).toContain('edit-form');
    expect(html).toContain('总题数');
    expect(html).toContain('总分数');
    expect(html).toContain('aria-label="编辑 数据合规基础测评"');
    expect(html).not.toContain('title="试卷详情"');
    expect(html).toContain('关联考试');
  });

  it('lists exams that use this paper', () => {
    const html = renderPage(
      <PaperDetailPage recordId="2" tab="exams" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('项目管理考试');
    expect(html).toContain('关联考试');
    expect(html).not.toContain('基本信息');
  });

  it('shows empty exams when no exam uses the paper', () => {
    const html = renderPage(
      <PaperDetailPage recordId="1" tab="exams" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('暂无考试使用该试卷');
    expect(html).not.toContain('基本信息');
  });

  it('shows empty state when the paper is missing', () => {
    const html = renderPage(
      <PaperDetailPage recordId="999999" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('试卷不存在或已删除');
    expect(html).toContain('返回试卷管理');
  });
});
