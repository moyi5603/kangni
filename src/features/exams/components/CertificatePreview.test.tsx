import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CertificatePreview } from '../components/CertificatePreview';

describe('CertificatePreview', () => {
  it('renders large page watermark text', () => {
    const html = renderToStaticMarkup(
      <CertificatePreview
        record={{
          name: '数据合规与安全 · 内部认证',
          issuer: '考试练习 · 企业学习平台',
          description: '已完成本认证考试，成绩合格，特此颁发以资证明。',
          watermarkText: '内部认证',
          coverTheme: 'gold',
          numberRule: 'EXAM-{年份}-{流水号}',
        }}
      />,
    );

    expect(html).toContain('certificate-preview__watermark');
    expect(html).toContain('内部认证');
    expect(html).toContain('数据合规与安全 · 内部认证');
  });
});
