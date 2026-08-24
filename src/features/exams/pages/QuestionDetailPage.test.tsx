import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { QuestionDetailPage } from './QuestionDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('QuestionDetailPage', () => {
  it('shows grouped question fields aligned with the edit form', () => {
    const html = renderPage(
      <QuestionDetailPage recordId="3" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('康有为是哪个历史时期著名的维新派人物?');
    expect(html).toContain('详情');
    expect(html).toContain('基本信息');
    expect(html).toContain('所属分类');
    expect(html).toContain('地理常识');
    expect(html).toContain('试题难度');
    expect(html).toContain('试题类型');
    expect(html).toContain('题干');
    expect(html).toContain('选项');
    expect(html).toContain('答案与解析');
    expect(html).toContain('正确答案');
    expect(html).toContain('试题解析');
    expect(html).toContain('状态');
    expect(html).toContain('edit-form');
    expect(html).toContain('戊戌变法时期');
    expect(html).not.toContain('ant-input-disabled');
    expect(html).not.toContain('ant-select-disabled');
    expect(html).not.toContain('ant-radio-button-wrapper-disabled');
    expect(html).toContain('aria-label="编辑 康有为是哪个历史时期著名的维新派人物?"');
    expect(html).not.toContain('试题详情');
  });

  it('shows fill-in answer fields from the edit form', () => {
    const html = renderPage(
      <QuestionDetailPage recordId="1" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('答案顺序');
    expect(html).toContain('不区分顺序');
    expect(html).toContain('管理项目范围、进度、成本和质量');
    expect(html).not.toContain('ant-input-disabled');
    expect(html).not.toContain('>选项<');
  });

  it('shows essay fields for practice questions', () => {
    const html = renderPage(
      <QuestionDetailPage
        scope="practice"
        recordId="105"
        onBack={() => undefined}
        onEdit={() => undefined}
      />,
    );

    expect(html).toContain('参考答案');
    expect(html).toContain('关键词');
    expect(html).toContain('至少命中');
    expect(html).toContain('习题库');
  });

  it('shows empty state when the question is missing', () => {
    const html = renderPage(
      <QuestionDetailPage recordId="999999" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('试题不存在或已删除');
    expect(html).toContain('返回试题库');
  });
});
