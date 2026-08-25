import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AwardCertificateListPage } from './AwardCertificateListPage';

describe('AwardCertificateListPage', () => {
  it('lists award certificate templates', () => {
    const html = renderToStaticMarkup(
      <App>
        <AwardCertificateListPage />
      </App>,
    );
    expect(html).toContain('评优证书');
    expect(html).toContain('新建证书');
    expect(html).toContain('优秀员工电子证书');
    expect(html).toContain('证书描述');
  });
});
