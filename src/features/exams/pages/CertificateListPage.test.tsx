import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CertificateListPage } from './CertificateListPage';

describe('CertificateListPage', () => {
  it('shows blocking migration mask over the page', () => {
    const html = renderToStaticMarkup(<CertificateListPage />);
    expect(html).toContain('page-block-mask');
    expect(html).toContain('将【谋发展】中的证书管理迁移到考试中');
    expect(html).toContain('page-with-block-mask');
  });
});
