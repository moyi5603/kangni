import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { H5CheckInPage } from './H5CheckInPage';

describe('H5CheckInPage', () => {
  it('renders the check-in shell', () => {
    const html = renderToStaticMarkup(<H5CheckInPage id={26} />);
    expect(html).toContain('扫码签到');
    expect(html).toContain('正在签到');
  });
});
