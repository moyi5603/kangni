import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { H5IgCheckInPage } from './H5IgCheckInPage';

describe('H5IgCheckInPage', () => {
  it('renders interest-group check-in shell', () => {
    const html = renderToStaticMarkup(<H5IgCheckInPage id={101} />);
    expect(html).toContain('扫码签到');
    expect(html).toContain('正在签到');
  });
});
