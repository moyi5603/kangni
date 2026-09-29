import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { H5MyCertificates } from './H5MyCertificates';

describe('H5 my certificates', () => {
  it('follows 我的认证 screenshot', () => {
    const html = renderToStaticMarkup(<H5MyCertificates />);
    expect(html).toContain('我的认证');
    expect(html).toContain('已获认证');
    expect(html).toContain('待考取');
    expect(html).toContain('已获证书');
    expect(html).toContain('项目管理认证证书');
    expect(html).toContain('颁发于2026-08-03 · 长期有效');
    expect(html).toContain('考试100分');
    expect(html).toContain('查看证书 &gt;');
    expect(html).toContain('href="#/c/h5/exam-6/result"');
    expect(html).toContain('class="c-h5-shell is-certs');
  });
});