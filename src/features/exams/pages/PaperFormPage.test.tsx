import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PaperFormPage } from './PaperFormPage';

describe('PaperFormPage', () => {
  it('renders generation mode in basic info and a question settings block', () => {
    const html = renderToStaticMarkup(<PaperFormPage mode="create" onBack={() => undefined} />);
    expect(html).toContain('新建试卷');
    expect(html).toContain('基本信息');
    expect(html).toContain('出题方式');
    expect(html).toContain('随机出题（一人一卷）');
    expect(html).toContain('固定出题');
    expect(html).toContain('选题方式');
    expect(html).toContain('按题库抽题');
    expect(html).toContain('指定题目');
    expect(html).toContain('题目设置');
    expect(html).toContain('添加题库');
    expect(html).toContain('题库');
    expect(html).toContain('总题数');
    expect(html).toContain('总分数');
  });
});
