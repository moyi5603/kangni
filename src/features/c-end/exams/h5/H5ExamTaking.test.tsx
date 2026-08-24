import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5ExamTaking } from './H5ExamTaking';

describe('H5 exam taking', () => {
  it('renders the process chrome, current question, options, and nav', () => {
    const html = renderToStaticMarkup(<H5ExamTaking id={7} />);

    expect(html).toContain('class="c-h5-shell is-exam is-taking"');
    expect(html).toContain('<h1 class="c-h5-title">考试过程</h1>');
    expect(html).toContain('出题');
    expect(html).toContain('>3<');
    expect(html).toContain('/10');
    expect(html).toContain('99:45');
    expect(html).toContain('Nginx可以作为反向代理服务器和负载均衡器');
    expect(html).toContain('(判断题)');
    expect(html).toContain('(1分)');
    expect(html).toContain('正确');
    expect(html).toContain('错误');
    expect(html).toContain('上一题');
    expect(html).toContain('下一题');
  });

  it('is mounted from CEndApp exam taking page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="exam-taking" examId={7} />);
    expect(html).toContain('class="c-h5-shell is-exam is-taking"');
    expect(html).toContain('考试过程');
  });

  it('changes the last-question action to 立即交卷', () => {
    const html = renderToStaticMarkup(<H5ExamTaking id={7} initialIndex={9} />);
    expect(html).toContain('立即交卷');
    expect(html).not.toContain('下一题');
  });

  it('opens 项目管理考试 on an essay question', () => {
    const html = renderToStaticMarkup(<H5ExamTaking id={5} />);
    expect(html).toContain('/3');
    expect(html).toContain('(问答题)');
    expect(html).toContain('c-h5-exam-blank');
    expect(html).not.toContain('>正确<');
    expect(html).not.toContain('Nginx可以作为反向代理服务器和负载均衡器');
  });
});
