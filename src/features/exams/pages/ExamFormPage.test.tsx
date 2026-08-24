import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExamFormPage } from './ExamFormPage';

describe('ExamFormPage', () => {
  it('lets the admin pick one paper instead of question rules', () => {
    const html = renderToStaticMarkup(<ExamFormPage mode="create" onBack={() => undefined} />);

    expect(html).toContain('试题配置');
    expect(html).toContain('请选择试卷');
    expect(html).toContain('paperId');
    expect(html).not.toContain('添加出题规则');
    expect(html).not.toContain('清空规则');
  });
});
